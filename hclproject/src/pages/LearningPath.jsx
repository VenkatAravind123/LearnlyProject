import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

// Simple “level” heuristic (edit if you add a real field later)
function inferLevel(course) {
  const minutes = Number(course?.durationMinutes || 0);
  if (minutes >= 1200) return "Advanced";
  if (minutes >= 600) return "Intermediate";
  return "Beginner";
}

function estWeeks(course) {
  // Assume ~4 hours/week pace
  const minutes = Number(course?.durationMinutes || 0);
  const weeks = Math.max(1, Math.ceil(minutes / 240));
  return weeks;
}

export default function LearningPath() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("All");
  const [level, setLevel] = useState("All");
  const [rec, setRec] = useState("All"); // All | Recommended

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        setLoading(true);

        const [cRes, eRes] = await Promise.all([
          fetch(`${API_BASE}/api/courses`, { credentials: "include" }),
          fetch(`${API_BASE}/api/courses/my/enrollments`, { credentials: "include" }),
        ]);

        const cData = await cRes.json();
        const eData = await eRes.json();

        if (!cRes.ok) throw new Error(cData?.error || "Failed to load courses");
        if (!eRes.ok) throw new Error(eData?.error || "Failed to load enrollments");

        if (!ignore) {
          setCourses(Array.isArray(cData?.courses) ? cData.courses : []);
          setEnrollments(Array.isArray(eData?.enrollments) ? eData.enrollments : []);
        }
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const enrollmentByCourseId = useMemo(() => {
    const map = new Map();
    for (const e of enrollments) {
      const id = e?.course?.courseId;
      if (id) map.set(id, e);
    }
    return map;
  }, [enrollments]);

  const allDomains = useMemo(() => {
    const s = new Set();
    for (const c of courses) if (c?.subject) s.add(c.subject);
    return ["All", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [courses]);

  const allLevels = useMemo(() => ["All", "Beginner", "Intermediate", "Advanced"], []);

  // Build ordered path items (by courseId asc for a stable “path”)
  const pathItems = useMemo(() => {
    const sorted = [...courses].sort((a, b) => Number(a.courseId) - Number(b.courseId));

    // Gating rule to mimic screenshot: unlock next after previous completed (or already enrolled)
    const completedSet = new Set(
      enrollments.filter((e) => e.status === "completed").map((e) => e.course?.courseId).filter(Boolean)
    );

    let prevCompleted = true; // first is always unlocked

    const items = sorted.map((course, idx) => {
      const e = enrollmentByCourseId.get(course.courseId);
      const isEnrolled = !!e;
      const isCompleted = e?.status === "completed";
      const isInProgress = isEnrolled && !isCompleted;

      // if enrolled, always unlocked
      const unlocked = isEnrolled || prevCompleted || idx === 0;

      // lock if not enrolled and not unlocked
      const isLocked = !isEnrolled && !unlocked;

      // progress
      const totalUnits = Number(e?.totalUnits || 0);
      const completedUnits = Number(e?.completedUnits || 0);

      const progressPct =
        isCompleted ? 100 : isInProgress && Number.isFinite(e?.progressPct) ? clampPct(e.progressPct) : 0;

      const item = {
        course,
        enrollment: e || null,
        level: inferLevel(course),
        status: isCompleted ? "completed" : isInProgress ? "in-progress" : isLocked ? "locked" : "not-started",
        unlocked: !isLocked,
        progressPct,
        meta: {
          modulesText:
            totalUnits > 0 ? `${totalUnits} modules` : course?.durationMinutes ? "Modules" : "Modules",
          weeksText: `${estWeeks(course)} weeks`,
        },
        computed: {
          totalUnits,
          completedUnits,
        },
      };

      // update gating for next item
      if (isCompleted) prevCompleted = true;
      else if (isEnrolled) prevCompleted = false;
      else if (!unlocked) prevCompleted = false;
      else prevCompleted = false;

      return item;
    });

    return items;
  }, [courses, enrollments, enrollmentByCourseId]);

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();

    return pathItems.filter((it) => {
      const subj = String(it.course?.subject || "");
      const name = String(it.course?.courseName || "");
      const lvl = String(it.level || "");

      if (domain !== "All" && subj !== domain) return false;
      if (level !== "All" && lvl !== level) return false;

      // “Recommended” = unlocked + not completed (simple heuristic)
      if (rec === "Recommended" && (!it.unlocked || it.status === "completed")) return false;

      if (!query) return true;
      return name.toLowerCase().includes(query) || subj.toLowerCase().includes(query);
    });
  }, [pathItems, q, domain, level, rec]);

  async function startCourse(courseId) {
    // Enroll then go to course learning page
    const res = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to enroll");
    navigate(`/courses/${courseId}`);
  }

  return (
    <section className="lp-shell">
      <div className="lp-header">
        <h2>My Learning Path</h2>
        <p className="muted">Your personalized journey to mastering Computer Science</p>
      </div>

      <div className="lp-filters card">
        <input
          className="lp-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses..."
          aria-label="Search courses"
        />

        <select className="lp-select" value={domain} onChange={(e) => setDomain(e.target.value)}>
          {allDomains.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All Domains" : d}
            </option>
          ))}
        </select>

        <select className="lp-select" value={level} onChange={(e) => setLevel(e.target.value)}>
          {allLevels.map((l) => (
            <option key={l} value={l}>
              {l === "All" ? "All Levels" : l}
            </option>
          ))}
        </select>

        <select className="lp-select" value={rec} onChange={(e) => setRec(e.target.value)}>
          <option value="All">All</option>
          <option value="Recommended">Recommended</option>
        </select>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div className="muted">Loading…</div>
        </div>
      )}

      {error && (
        <div className="card lp-error">
          <div className="lp-error-text">{error}</div>
        </div>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div className="muted">No matching courses.</div>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <ol className="lp-timeline">
          {filteredItems.map((it) => {
            const c = it.course;
            const courseId = c?.courseId;

            const badgeLevel = it.level;
            const badgeStatus =
              it.status === "completed"
                ? "Completed"
                : it.status === "in-progress"
                ? "In Progress"
                : it.status === "locked"
                ? "Locked"
                : "Not Started";

            const actionLabel =
              it.status === "completed"
                ? "Review"
                : it.status === "in-progress"
                ? "Continue"
                : it.status === "locked"
                ? "Locked"
                : "Start";

            const disabled = it.status === "locked" || !courseId;

            return (
              <li key={courseId} className={`lp-item ${it.status}`}>
                <div className="lp-rail">
                  <div className="lp-dot" />
                  <div className="lp-line" />
                </div>

                <div className="lp-card">
                  <div className="lp-top">
                    <div className="lp-title-block">
                      <div className="lp-title">{c?.courseName || "Course"}</div>

                      <div className="lp-badges">
                        <span className={`lp-badge level ${badgeLevel.toLowerCase()}`}>{badgeLevel}</span>
                        <span className={`lp-badge status ${it.status}`}>{badgeStatus}</span>
                      </div>

                      <div className="lp-meta muted small">
                        <span>{it.computed.totalUnits > 0 ? `${it.computed.totalUnits} modules` : it.meta.modulesText}</span>
                        <span>•</span>
                        <span>{it.meta.weeksText}</span>
                        <span>•</span>
                        <span>{clampPct(it.progressPct)}% complete</span>
                      </div>
                    </div>

                    <div className="lp-action">
                      <button
                        className={`lp-action-btn ${it.status === "locked" ? "ghost" : ""}`}
                        disabled={disabled}
                        onClick={async () => {
                          try {
                            if (it.status === "completed" || it.status === "in-progress") {
                              navigate(`/courses/${courseId}`);
                            } else if (it.status === "not-started") {
                              await startCourse(courseId);
                            }
                          } catch (e) {
                            setError(e.message || "Action failed");
                          }
                        }}
                      >
                        {actionLabel}
                      </button>
                    </div>
                  </div>

                  <div className="lp-progress">
                    <div className="lp-progress-bar">
                      <div className="lp-progress-fill" style={{ width: `${clampPct(it.progressPct)}%` }} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="lp-more card">
        <div className="lp-more-icon">⏳</div>
        <div className="lp-more-text">
          <div className="lp-more-title">More courses coming soon!</div>
          <div className="muted small">
            Complete your current path to unlock advanced courses and specializations.
          </div>
        </div>
        <div className="lp-more-actions">
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    </section>
  );
}