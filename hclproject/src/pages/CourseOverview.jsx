import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";

const API_BASE = "http://localhost:5000";

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(640px, 100%)", padding: "1.25rem" }}
      >
        <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function CourseOverview() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [course, setCourse] = useState(null);
  const [units, setUnits] = useState([]);
  const [enrollment, setEnrollment] = useState(null);

  const [askBeginner, setAskBeginner] = useState(false);
  const [showTestInfo, setShowTestInfo] = useState(false);
  const [busy, setBusy] = useState(false);

  const isEnrolled = !!enrollment;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/outline`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load course");

      setCourse(data.course || null);
      setUnits(Array.isArray(data.units) ? data.units : []);
      setEnrollment(data.enrollment || null);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function enroll({ beginner }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beginner }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Enroll failed");
      await load();
    } catch (e) {
      setError(e.message || "Enroll failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      {loading && (
        <div className="loading-center" style={{ padding: "1rem 0" }}>
          <div className="loading-inline">
            <Loader size={22} color="#646cff" />
            <div className="muted">Loading…</div>
          </div>
        </div>
      )}
      {error && <div className="muted">{error}</div>}

      {!loading && course && (
        <>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.25rem" }}>{course.courseName}</h3>
            <div className="muted small" style={{ marginBottom: "0.75rem" }}>
              Subject: {course.subject} • Duration: {course.durationMinutes || 0} min • Pass: {course.minPassPercentage}%
            </div>
            <p className="muted" style={{ marginBottom: "1rem" }}>
              {course.description || "This course adapts to your level and learning style."}
            </p>

            <div className="actions">
              {isEnrolled ? (
                <button className="btn-primary" onClick={() => navigate(`/courses/${courseId}`)}>
                  Continue Learning
                </button>
              ) : (
                <button className="btn-primary" disabled={busy} onClick={() => setAskBeginner(true)}>
                  {busy ? "Preparing..." : "Start Course"}
                </button>
              )}
              <button className="ghost" onClick={() => navigate("/courses")}>Back to Courses</button>
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: "0.75rem" }}>What you’ll learn</h4>
            {units.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {units.slice(0, 12).map((u) => (
                  <div key={u.id} className="progress-row" style={{ alignItems: "center" }}>
                    <div className="progress-meta">
                      <div className="progress-title">Unit {u.order} • {u.title}</div>
                      <div className="muted small">Status: {u.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">No units available yet.</div>
            )}
          </div>

          <Modal open={askBeginner} title="Are you a beginner?" onClose={() => setAskBeginner(false)}>
            <div className="muted" style={{ marginBottom: "1rem" }}>
              If you’re a beginner, we’ll start from the basics with no competence test.
            </div>
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <button
                className="ghost"
                disabled={busy}
                onClick={() => {
                  setAskBeginner(false);
                  setShowTestInfo(true);
                }}
              >
                No
              </button>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={async () => {
                  setAskBeginner(false);
                  await enroll({ beginner: true });
                  navigate(`/courses/${courseId}`);
                }}
              >
                Yes
              </button>
            </div>
          </Modal>

          <Modal open={showTestInfo} title="Competence test required" onClose={() => setShowTestInfo(false)}>
            <div className="muted" style={{ marginBottom: "1rem" }}>
              We’ll conduct a short competence test to understand your capacity. Then the AI will teach some topics deeper
              and more advanced based on your score.
            </div>
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <button className="ghost" disabled={busy} onClick={() => setShowTestInfo(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={async () => {
                  setShowTestInfo(false);
                  await enroll({ beginner: false });
                  navigate(`/courses/${courseId}`); // CourseLearn will show placement test
                }}
              >
                Continue to Test
              </button>
            </div>
          </Modal>
        </>
      )}
    </section>
  );
}