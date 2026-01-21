import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiUsers, FiTrendingUp, FiCheckCircle, FiSearch, FiClock, FiTarget } from "react-icons/fi";

const API_BASE = "http://localhost:5000";

function formatDurationMinutes(mins) {
  const n = Number(mins || 0);
  if (!n) return "—";
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function deriveCourseLevel(course) {
  const pass = Number(course?.minPassPercentage ?? 0);
  if (pass >= 75) return "advanced";
  if (pass >= 60) return "intermediate";
  return "beginner";
}

function courseLevelLabel(course) {
  const lvl = deriveCourseLevel(course);
  return lvl.charAt(0).toUpperCase() + lvl.slice(1);
}

export default function Courses({ search, userRole }) {
  const navigate = useNavigate();
  const isAdmin = userRole === "admin";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");


  // Admin UI state  // Student dashboard UI state
  const [localSearch, setLocalSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const [myEnrollments, setMyEnrollments] = useState([]);
  const [enrollmentByCourseId, setEnrollmentByCourseId] = useState({});
  const [outlineByCourseId, setOutlineByCourseId] = useState({});
  const [myLoading, setMyLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    courseName: "",
    subject: "",
    description: "",
    durationMinutes: 60,
    minPassPercentage: 60,
    unitTitle: "Unit 1",
    unitContent: "",
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  async function loadCourses() {
    try {
      setError("");
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/courses`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load courses");
      setCourses(Array.isArray(data?.courses) ? data.courses : []);
    } catch (e) {
      setError(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }
    async function loadMyEnrollments() {
    if (isAdmin) return;
    try {
      setMyLoading(true);
      const res = await fetch(`${API_BASE}/api/courses/my/enrollments`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load enrollments");

      const items = Array.isArray(data?.enrollments) ? data.enrollments : [];
      setMyEnrollments(items);

      const map = {};
      for (const e of items) {
        const courseId = e?.course?.courseId;
        if (courseId) map[courseId] = e;
      }
      setEnrollmentByCourseId(map);
    } catch (e) {
      // don't hard-fail the page if enrollments can't load
      console.warn(e);
    } finally {
      setMyLoading(false);
    }
  }

  async function loadOutline(courseId) {
    const res = await fetch(`${API_BASE}/api/courses/${courseId}/outline`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load outline");

    const units = Array.isArray(data?.units) ? data.units : [];
    const total = units.length || 0;
    const completed = units.filter((u) => u.status === "completed").length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    return { totalUnits: total, completedUnits: completed, progressPercent: clampPct(pct) };
  }

  // useEffect(() => {
  //   loadCourses();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

    useEffect(() => {
    (async () => {
      await loadCourses();
      await loadMyEnrollments();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    useEffect(() => {
    if (isAdmin) return;

    const ids = Object.keys(enrollmentByCourseId).map((x) => Number(x)).filter(Boolean);
    const missing = ids.filter((id) => !outlineByCourseId[id]);

    if (missing.length === 0) return;

    (async () => {
      const results = await Promise.allSettled(missing.map((id) => loadOutline(id).then((o) => [id, o])));
      const next = { ...outlineByCourseId };

      for (const r of results) {
        if (r.status === "fulfilled") {
          const [id, o] = r.value;
          next[id] = o;
        }
      }
      setOutlineByCourseId(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, enrollmentByCourseId]);


  // const filtered = useMemo(() => {
  //   const q = (search || "").trim().toLowerCase();
  //   if (!q) return courses;
  //   return courses.filter((c) => {
  //     const name = String(c.courseName || "").toLowerCase();
  //     const subject = String(c.subject || "").toLowerCase();
  //     return name.includes(q) || subject.includes(q);
  //   });
  // }, [search, courses]);

    const categories = useMemo(() => {
    const s = new Set();
    for (const c of courses) {
      const subj = String(c?.subject || "").trim();
      if (subj) s.add(subj);
    }
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [courses]);

  const filtered = useMemo(() => {
    const q = (localSearch || search || "").trim().toLowerCase();

    return courses.filter((c) => {
      const name = String(c.courseName || "").toLowerCase();
      const subject = String(c.subject || "").toLowerCase();

      const matchesText = !q || name.includes(q) || subject.includes(q);
      const matchesCategory = categoryFilter === "all" || String(c.subject || "") === categoryFilter;
      const matchesLevel = levelFilter === "all" || deriveCourseLevel(c) === levelFilter;

      return matchesText && matchesCategory && matchesLevel;
    });
  }, [localSearch, search, courses, categoryFilter, levelFilter]);
  async function startCourse(course) {
    try {
      setBusyId(course.courseId);
      setError("");

      const enrollRes = await fetch(`${API_BASE}/api/courses/${course.courseId}/enroll`, {
        method: "POST",
        credentials: "include",
      });
      const enrollData = await enrollRes.json();
      if (!enrollRes.ok) throw new Error(enrollData?.error || "Enroll failed");

      navigate(`/courses/${course.courseId}`);
    } catch (e) {
      setError(e.message || "Failed to start course");
    } finally {
      setBusyId(null);
    }
  }

  async function viewEnrollments(course) {
    try {
      setSelectedCourse(course);
      setEnrollmentsError("");
      setEnrollmentsLoading(true);
      setEnrolledStudents([]);

      const res = await fetch(`${API_BASE}/api/courses/${course.courseId}/enrollments`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load enrollments");

      setEnrolledStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (e) {
      setEnrollmentsError(e.message || "Failed to load enrollments");
    } finally {
      setEnrollmentsLoading(false);
    }
  }

  function onAddChange(e) {
    const { name, value } = e.target;
    setAddForm((f) => ({ ...f, [name]: value }));
  }

  async function submitAddCourse(e) {
    e.preventDefault();
    try {
      setError("");
      setBusyId("add");

      const payload = {
        courseName: addForm.courseName,
        subject: addForm.subject,
        description: addForm.description,
        durationMinutes: Number(addForm.durationMinutes),
        minPassPercentage: Number(addForm.minPassPercentage),
        units: [
          {
            title: addForm.unitTitle || "Unit 1",
            order: 1,
            baseContent: addForm.unitContent || "",
          },
        ],
      };

      const res = await fetch(`${API_BASE}/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create course failed");

      setShowAdd(false);
      setAddForm({
        courseName: "",
        subject: "",
        description: "",
        durationMinutes: 60,
        minPassPercentage: 60,
        unitTitle: "Unit 1",
        unitContent: "",
      });

      await loadCourses();
    } catch (e2) {
      setError(e2.message || "Create course failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="section-header">
        <h3>{isAdmin ? "Manage Courses" : "All Courses"}</h3>
        <p className="muted">
          {isAdmin
            ? "Create courses and view enrolled students."
            : "Browse courses and enroll; the teaching adapts based on performance."}
        </p>
      </div>

      {error && (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))",
            border: "1px solid rgba(239,68,68,0.2)",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              color: "#fca5a5",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "2px solid #fca5a5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
            >
              !
            </div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div className="muted">Loading courses…</div>
        </div>
      )}

      {isAdmin && (
        <div className="actions" style={{ marginBottom: "1rem" }}>
          <button
            style={{
              background: showAdd ? "var(--input-bg)" : "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
              border: showAdd ? "1px solid var(--border)" : "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "10px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              cursor: "pointer",
              color: "var(--text)",
            }}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Close" : "+ Add Course"}
          </button>
        </div>
      )}

      {isAdmin && showAdd && (
        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, rgba(100,108,255,0.1), rgba(97,218,251,0.05))",
            border: "1px solid rgba(100,108,255,0.2)",
            boxShadow: "0 8px 32px rgba(100,108,255,0.1)",
            padding: "2rem",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                margin: "0 auto 1rem",
                background: "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(100,108,255,0.3)",
              }}
            >
              +
            </div>

            <h3
              style={{
                background: "linear-gradient(135deg, var(--text) 0%, #646cff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontSize: "1.8rem",
                margin: "0 0 0.5rem 0",
              }}
            >
              Create New Course
            </h3>

            <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
              Fill in the details below to create an adaptive learning course
            </p>
          </div>

          <form onSubmit={submitAddCourse} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Basic Information Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#61dafb",
                    boxShadow: "0 0 8px rgba(97,218,251,0.6)",
                  }}
                />
                <h4 style={{ margin: 0, color: "#61dafb", fontSize: "1.1rem" }}>Basic Information</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Course Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Course Name <span style={{ color: "#fca5a5" }}>*</span>
                  </label>

                  <input
                    name="courseName"
                    placeholder="e.g., Introduction to React"
                    value={addForm.courseName}
                    onChange={onAddChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(100,108,255,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Subject <span style={{ color: "#fca5a5" }}>*</span>
                  </label>

                  <input
                    name="subject"
                    placeholder="e.g., Web Development, Data Science"
                    value={addForm.subject}
                    onChange={onAddChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(100,108,255,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Description <span className="muted small">(optional)</span>
                  </label>

                  <textarea
                    name="description"
                    placeholder="Provide a brief description of what students will learn..."
                    value={addForm.description}
                    onChange={onAddChange}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontFamily: "inherit",
                      fontSize: "1rem",
                      resize: "vertical",
                      transition: "all 0.2s ease",
                      outline: "none",
                      lineHeight: "1.6",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(100,108,255,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>
              </div>
            </div>

            {/* Course Settings Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#61dafb",
                    boxShadow: "0 0 8px rgba(97,218,251,0.6)",
                  }}
                />
                <h4 style={{ margin: 0, color: "#61dafb", fontSize: "1.1rem" }}>Course Settings</h4>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                {/* Duration */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Duration (minutes)
                  </label>

                  <input
                    name="durationMinutes"
                    type="number"
                    min="0"
                    placeholder="60"
                    value={addForm.durationMinutes}
                    onChange={onAddChange}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(100,108,255,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>

                {/* Pass Percentage */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Minimum Pass %
                  </label>

                  <input
                    name="minPassPercentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="60"
                    value={addForm.minPassPercentage}
                    onChange={onAddChange}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(100,108,255,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>
              </div>
            </div>

            {/* First Unit Section */}
            <div
              className="card"
              style={{
                background: "linear-gradient(135deg, rgba(97,218,251,0.1), rgba(100,108,255,0.05))",
                border: "1px solid rgba(97,218,251,0.2)",
                padding: "1.5rem",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#61dafb",
                    boxShadow: "0 0 8px rgba(97,218,251,0.6)",
                  }}
                />
                <h4 style={{ margin: 0, color: "#61dafb", fontSize: "1.1rem" }}>First Unit</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Unit Title */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Unit Title
                  </label>

                  <input
                    name="unitTitle"
                    placeholder="e.g., Getting Started with Components"
                    value={addForm.unitTitle}
                    onChange={onAddChange}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(97,218,251,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>

                {/* Unit Content */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "var(--text)",
                    }}
                  >
                    Unit Content
                  </label>

                  <textarea
                    name="unitContent"
                    placeholder="Enter the base content for this unit. This will be used by the AI to generate adaptive lessons..."
                    value={addForm.unitContent}
                    onChange={onAddChange}
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--input-bg)",
                      color: "var(--text)",
                      fontFamily: "inherit",
                      fontSize: "1rem",
                      resize: "vertical",
                      transition: "all 0.2s ease",
                      outline: "none",
                      lineHeight: "1.6",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(97,218,251,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
                  />
                </div>

                {/* Info Box */}
                <div
                  style={{
                    background: "rgba(97,218,251,0.1)",
                    border: "1px solid rgba(97,218,251,0.2)",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(97,218,251,0.2)",
                      border: "2px solid rgba(97,218,251,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      color: "#61dafb",
                      flexShrink: 0,
                    }}
                  >
                    i
                  </div>

                  <div className="muted small" style={{ lineHeight: "1.5" }}>
                    This is the foundational content for your first unit. The adaptive learning system will use this to
                    generate personalized lessons, flashcards, and quizzes based on each student's learning style and
                    performance.
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <button
                type="submit"
                disabled={busyId === "add"}
                style={{
                  flex: 1,
                  background:
                    busyId === "add" ? "var(--input-bg)" : "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                  border: "none",
                  padding: "1rem 2rem",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "1.05rem",
                  cursor: busyId === "add" ? "not-allowed" : "pointer",
                  opacity: busyId === "add" ? 0.6 : 1,
                  transition: "all 0.3s ease",
                  boxShadow: busyId === "add" ? "none" : "0 4px 16px rgba(100,108,255,0.3)",
                  transform: "translateY(0)",
                  color: "var(--text)",
                }}
                onMouseEnter={(e) => {
                  if (busyId !== "add") {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 24px rgba(100,108,255,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (busyId !== "add") {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 16px rgba(100,108,255,0.3)";
                  }
                }}
              >
                {busyId === "add" ? "Creating Course..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* <div className="courses-grid">
        {filtered.map((c) => (
          <article
            key={c.courseId}
            className="course-card"
            style={{
              background: "var(--card-grad)",
              border: "1px solid var(--border)",
              transition: "all 0.3s ease",
            }}
          >
            <div className="course-meta">
              <div
                className="course-title"
                style={{
                  background: "linear-gradient(135deg, var(--text) 0%, #646cff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "1.1rem",
                }}
              >
                {c.courseName}
              </div>

              <div className="muted small" style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ background: "rgba(100,108,255,0.15)", padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                  {c.subject}
                </span>
                <span style={{ background: "rgba(97,218,251,0.15)", padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                  {formatDurationMinutes(c.durationMinutes)}
                </span>
                <span style={{ background: "rgba(34,197,94,0.15)", padding: "0.25rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
                  Pass: {c.minPassPercentage}%
                </span>
              </div>
            </div>

            <div className="course-actions">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => viewEnrollments(c)}
                  disabled={enrollmentsLoading && selectedCourse?.courseId === c.courseId}
                  style={{
                    background: "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                    border: "none",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: enrollmentsLoading && selectedCourse?.courseId === c.courseId ? "not-allowed" : "pointer",
                    opacity: enrollmentsLoading && selectedCourse?.courseId === c.courseId ? 0.6 : 1,
                    color: "#fff",
                  }}
                >
                  {enrollmentsLoading && selectedCourse?.courseId === c.courseId ? "Loading..." : "View Students"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startCourse(c)}
                  disabled={busyId === c.courseId}
                  style={{
                    background: "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                    border: "none",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: busyId === c.courseId ? "not-allowed" : "pointer",
                    opacity: busyId === c.courseId ? 0.6 : 1,
                    color: "#fff",
                  }}
                >
                  {busyId === c.courseId ? "Starting..." : "Start Course"}
                </button>
              )}
            </div>
          </article>
        ))}
        {!loading && filtered.length === 0 && <div className="muted">No courses found.</div>}
      </div> */}

            {isAdmin ? (
        <div className="courses-grid">
          {filtered.map((c) => (
            <article
              key={c.courseId}
              className="course-card"
              style={{
                background: "var(--card-grad)",
                border: "1px solid var(--border)",
                transition: "all 0.3s ease",
              }}
            >
              <div className="course-meta">
                <div
                  className="course-title"
                  style={{
                    background: "linear-gradient(135deg, var(--text) 0%, #646cff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: "1.1rem",
                  }}
                >
                  {c.courseName}
                </div>

                <div
                  className="muted small"
                  style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
                >
                  <span
                    style={{
                      background: "rgba(100,108,255,0.15)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {c.subject}
                  </span>
                  <span
                    style={{
                      background: "rgba(97,218,251,0.15)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {formatDurationMinutes(c.durationMinutes)}
                  </span>
                  <span
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                    }}
                  >
                    Pass: {c.minPassPercentage}%
                  </span>
                </div>
              </div>

              <div className="course-actions">
                <button
                  type="button"
                  onClick={() => viewEnrollments(c)}
                  disabled={enrollmentsLoading && selectedCourse?.courseId === c.courseId}
                  style={{
                    background: "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                    border: "none",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: enrollmentsLoading && selectedCourse?.courseId === c.courseId ? "not-allowed" : "pointer",
                    opacity: enrollmentsLoading && selectedCourse?.courseId === c.courseId ? 0.6 : 1,
                    color: "#fff",
                  }}
                >
                  {enrollmentsLoading && selectedCourse?.courseId === c.courseId ? "Loading..." : "View Students"}
                </button>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && <div className="muted">No courses found.</div>}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="course-stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><FiBookOpen /></div>
              <div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-value">{courses.length}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><FiUsers /></div>
              <div>
                <div className="stat-label">Enrolled</div>
                <div className="stat-value">{myEnrollments.length}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><FiTrendingUp /></div>
              <div>
                <div className="stat-label">In Progress</div>
                <div className="stat-value">
                  {myEnrollments.filter((e) => {
                    if (e.status === "completed") return false;
                    const cid = e?.course?.courseId;
                    const pct = outlineByCourseId[cid]?.progressPercent;
                    if (Number.isFinite(pct)) return pct > 0 && pct < 100;
                    return Number(e.currentUnitOrder || 1) > 1;
                  }).length}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon"><FiCheckCircle /></div>
              <div>
                <div className="stat-label">Completed</div>
                <div className="stat-value">{myEnrollments.filter((e) => e.status === "completed").length}</div>
              </div>
            </div>
          </div>

          {/* Search + filters */}
          <div className="courses-toolbar">
            <div className="toolbar-input">
              <FiSearch className="toolbar-icon" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search courses..."
              />
            </div>

            <select className="toolbar-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>

            <select className="toolbar-select" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Cards */}
          <div className="course-cards-grid">
            {filtered.map((c) => {
              const enrolled = Boolean(enrollmentByCourseId[c.courseId]);
              const outline = outlineByCourseId[c.courseId];
              const pct = enrolled ? (outline?.progressPercent ?? 0) : null;

              return (
                <article key={c.courseId} className="course-card-v2">
                  <div className="course-card-v2__media">
                    <div className="badges">
                      {enrolled && <span className="badge badge--enrolled">Enrolled</span>}
                      <span className="badge badge--ai">AI Course</span>
                    </div>

                    <span className="level-chip">{courseLevelLabel(c)}</span>
                  </div>

                  <div className="course-card-v2__body">
                    <div className="course-card-v2__title">{c.courseName}</div>
                    <div className="course-card-v2__desc">{c.description || "Learn with adaptive lessons and quizzes."}</div>

                    <div className="course-meta-row">
                      <span className="meta-pill"><FiClock /> {formatDurationMinutes(c.durationMinutes)}</span>
                      <span className="meta-pill"><FiTarget /> Pass {c.minPassPercentage}%</span>
                      <span className="meta-pill">{c.subject}</span>
                    </div>

                    {enrolled && (
                      <div className="course-progress">
                        <div className="course-progress__top">
                          <span>Progress</span>
                          <span className="muted">{pct}%</span>
                        </div>
                        <div className="progress-bar" style={{ ["--pct"]: `${pct}%` }}>
                          <div className="progress-bar__fill" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="course-card-v2__footer">
                    {enrolled ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate(`/courses/${c.courseId}`)}
                      >
                        Continue Learning
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => startCourse(c)}
                        disabled={busyId === c.courseId}
                      >
                        {busyId === c.courseId ? "Enrolling..." : "Enroll Now"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {!loading && !myLoading && filtered.length === 0 && <div className="muted">No courses found.</div>}
          </div>
        </>
      )}

      {isAdmin && selectedCourse && (
        <div
          className="card"
          style={{
            marginTop: "1rem",
            background: "linear-gradient(135deg, rgba(100,108,255,0.06), rgba(97,218,251,0.03))",
            border: "1px solid rgba(100,108,255,0.12)",
          }}
        >
          <h4
            style={{
              background: "linear-gradient(135deg, var(--text) 0%, #646cff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1.5rem",
            }}
          >
            Enrolled Students: {selectedCourse.courseName}
          </h4>

          <div className="muted small" style={{ marginBottom: "1rem" }}>
            Course ID: {selectedCourse.courseId}
          </div>

          {enrollmentsError && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                padding: "0.75rem",
                borderRadius: "8px",
                color: "#fca5a5",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "2px solid #fca5a5",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  marginRight: "0.5rem",
                }}
              >
                !
              </div>
              {enrollmentsError}
            </div>
          )}

          {enrollmentsLoading && <div className="muted" style={{ textAlign: "center", padding: "1rem" }}>Loading enrollments…</div>}

          {!enrollmentsLoading && enrolledStudents.length === 0 && (
            <div className="muted" style={{ textAlign: "center", padding: "2rem" }}>
              No enrollments yet.
            </div>
          )}

          {!enrollmentsLoading && enrolledStudents.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "var(--input-bg)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(100,108,255,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Level</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Learning Style</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Competence</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Last Quiz</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Unit</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: "600" }}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {enrolledStudents.map((s, idx) => (
                    <tr
                      key={s.enrollmentId}
                      style={{
                        borderTop: "1px solid var(--border)",
                        background: idx % 2 === 0 ? "var(--surface-2)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "0.75rem" }}>{s.user?.name || "—"}</td>
                      <td style={{ padding: "0.75rem", color: "var(--muted)" }}>{s.user?.email || "—"}</td>

                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ background: "rgba(100,108,255,0.15)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem" }}>
                          {s.user?.profile?.currentLevel || "—"}
                        </span>
                      </td>

                      <td style={{ padding: "0.75rem" }}>{s.user?.profile?.learningStyle || "—"}</td>

                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ background: "rgba(34,197,94,0.15)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem", color: "#4ade80" }}>
                          {s.user?.profile?.lastCompetencyScore ?? "—"}
                        </span>
                      </td>

                      <td style={{ padding: "0.75rem" }}>
                        <span
                          style={{
                            background: (s.lastQuizScore ?? 0) >= 60 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            color: (s.lastQuizScore ?? 0) >= 60 ? "#4ade80" : "#fca5a5",
                          }}
                        >
                          {s.lastQuizScore ?? "—"}%
                        </span>
                      </td>

                      <td style={{ padding: "0.75rem" }}>{s.currentUnitOrder ?? "—"}</td>

                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ background: s.status === "completed" ? "rgba(34,197,94,0.15)" : "rgba(97,218,251,0.15)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.85rem" }}>
                          {s.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}