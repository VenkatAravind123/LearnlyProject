import React, { useEffect, useMemo, useState } from "react";
import Loader from "../components/Loader";

const API_BASE = "http://localhost:5000";

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export default function Progress() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/courses/my/enrollments`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load progress");

        if (!ignore) setEnrollments(Array.isArray(data?.enrollments) ? data.enrollments : []);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load progress");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const items = useMemo(() => {
    // Minimal “progress” metric: lastQuizScore (0-100) for each enrolled course
    // (Backend currently doesn’t track total units completed, so this is the best available signal)
    return enrollments.map((e) => ({
      enrollmentId: e.enrollmentId,
      courseId: e.course?.courseId,
      courseName: e.course?.courseName || "Course",
      subject: e.course?.subject || "—",
      status: e.status || "active",
      currentUnitOrder: e.currentUnitOrder ?? "—",
      lastQuizScore: clampPct(e.lastQuizScore),
    }));
  }, [enrollments]);

  return (
    <section>
      <div className="section-header">
        <h3>Progress</h3>
        <p className="muted">Your progress in enrolled courses</p>
      </div>

      {loading && (
        <div className="loading-center" style={{ padding: "1rem 0" }}>
          <div className="loading-inline">
            <Loader size={22} color="#646cff" />
            <div className="muted">Loading…</div>
          </div>
        </div>
      )}
      {error && <div className="muted">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="card">
          <h4>No progress yet</h4>
          <p className="muted">Enroll in a course to start tracking progress.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="card">
          <h4>Course Progress</h4>

          {items.map((m) => (
            <div key={m.enrollmentId} className="progress-row">
              <div className="progress-meta">
                <div className="progress-title">
                  {m.courseName} <span className="muted small">({m.subject})</span>
                </div>
                <div className="muted small">
                  Last quiz: {m.lastQuizScore}% • Unit: {m.currentUnitOrder} • {m.status}
                </div>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.lastQuizScore}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}