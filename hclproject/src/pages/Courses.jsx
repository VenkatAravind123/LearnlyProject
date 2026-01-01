import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function formatDurationMinutes(mins) {
  const n = Number(mins || 0);
  if (!n) return "—";
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function Courses({ search, userRole }) {
  const navigate = useNavigate();
  const isAdmin = userRole === "admin";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // Admin UI state
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

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const name = String(c.courseName || "").toLowerCase();
      const subject = String(c.subject || "").toLowerCase();
      return name.includes(q) || subject.includes(q);
    });
  }, [search, courses]);

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
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
          border: '1px solid rgba(239,68,68,0.2)',
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <div style={{ color: '#fca5a5' }}>⚠️ {error}</div>
        </div>
      )}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="muted">Loading courses…</div>
        </div>
      )}

      {isAdmin && (
        <div className="actions" style={{ marginBottom: "1rem" }}>
          <button
            style={{
              background: showAdd ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
              border: showAdd ? '1px solid rgba(255,255,255,0.1)' : 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "✕ Close" : "➕ Add Course"}
          </button>
        </div>
      )}

      {isAdmin && showAdd && (
        <div className="card" style={{
          marginBottom: "1rem",
          background: 'linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))',
          border: '1px solid rgba(100,108,255,0.15)'
        }}>
          <h4 style={{
            background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem'
          }}>✨ Add New Course</h4>
          <form onSubmit={submitAddCourse} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              name="courseName"
              placeholder="Course Name"
              value={addForm.courseName}
              onChange={onAddChange}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'inherit',
                transition: 'all 0.2s ease'
              }}
            />
            <input
              name="subject"
              placeholder="Subject"
              value={addForm.subject}
              onChange={onAddChange}
              required
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'inherit',
                transition: 'all 0.2s ease'
              }}
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={addForm.description}
              onChange={onAddChange}
              rows={3}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'inherit',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'all 0.2s ease'
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                name="durationMinutes"
                type="number"
                min="0"
                placeholder="Duration Minutes"
                value={addForm.durationMinutes}
                onChange={onAddChange}
                style={{ width: "200px" }}
              />
              <input
                name="minPassPercentage"
                type="number"
                min="0"
                max="100"
                placeholder="Min Pass %"
                value={addForm.minPassPercentage}
                onChange={onAddChange}
                style={{ width: "200px" }}
              />
            </div>

            <div className="card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h4 style={{ marginTop: 0, color: '#61dafb' }}>📚 Unit 1</h4>
              <input
                name="unitTitle"
                placeholder="Unit Title"
                value={addForm.unitTitle}
                onChange={onAddChange}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'inherit',
                  width: '100%',
                  marginBottom: '0.75rem'
                }}
              />
              <textarea
                name="unitContent"
                placeholder="Unit Content (baseContent)"
                value={addForm.unitContent}
                onChange={onAddChange}
                rows={5}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  width: '100%',
                  resize: 'vertical'
                }}
              />
              <div className="muted small" style={{ marginTop: '0.5rem' }}>💡 This is the first unit used by the adaptive lesson generator.</div>
            </div>

            <button
              type="submit"
              disabled={busyId === "add"}
              style={{
                background: busyId === "add" ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                border: 'none',
                padding: '0.85rem 1.5rem',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: busyId === "add" ? 'not-allowed' : 'pointer',
                opacity: busyId === "add" ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {busyId === "add" ? "⏳ Creating..." : "✨ Create Course"}
            </button>
          </form>
        </div>
      )}

      <div className="courses-grid">
        {filtered.map((c) => (
          <article key={c.courseId} className="course-card" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div className="course-meta">
              <div className="course-title" style={{
                background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '1.1rem'
              }}>{c.courseName}</div>
              <div className="muted small" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(100,108,255,0.15)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}>📖 {c.subject}</span>
                <span style={{
                  background: 'rgba(97,218,251,0.15)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}>⏱️ {formatDurationMinutes(c.durationMinutes)}</span>
                <span style={{
                  background: 'rgba(34,197,94,0.15)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}>✓ Pass: {c.minPassPercentage}%</span>
              </div>
            </div>

            <div className="course-actions">
              {isAdmin ? (
                <button
                  onClick={() => viewEnrollments(c)}
                  disabled={enrollmentsLoading && selectedCourse?.courseId === c.courseId}
                  style={{
                    background: 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: (enrollmentsLoading && selectedCourse?.courseId === c.courseId) ? 'not-allowed' : 'pointer',
                    opacity: (enrollmentsLoading && selectedCourse?.courseId === c.courseId) ? 0.6 : 1
                  }}
                >
                  {enrollmentsLoading && selectedCourse?.courseId === c.courseId ? "⏳ Loading..." : "👥 View Students"}
                </button>
              ) : (
                <button
                  onClick={() => startCourse(c)}
                  disabled={busyId === c.courseId}
                  style={{
                    background: 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: busyId === c.courseId ? 'not-allowed' : 'pointer',
                    opacity: busyId === c.courseId ? 0.6 : 1
                  }}
                >
                  {busyId === c.courseId ? "⏳ Starting..." : "🚀 Start"}
                </button>
              )}
            </div>
          </article>
        ))}
        {!loading && filtered.length === 0 && <div className="muted">No courses found.</div>}
      </div>

      {isAdmin && selectedCourse && (
        <div className="card" style={{
          marginTop: "1rem",
          background: 'linear-gradient(135deg, rgba(100,108,255,0.06), rgba(97,218,251,0.03))',
          border: '1px solid rgba(100,108,255,0.12)'
        }}>
          <h4 style={{
            background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem'
          }}>
            👥 Enrolled Students: {selectedCourse.courseName}
          </h4>
          <div className="muted small" style={{ marginBottom: '1rem' }}>Course ID: {selectedCourse.courseId}</div>

          {enrollmentsError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              padding: '0.75rem',
              borderRadius: '8px',
              color: '#fca5a5'
            }}>⚠️ {enrollmentsError}</div>
          )}
          {enrollmentsLoading && (
            <div className="muted" style={{ textAlign: 'center', padding: '1rem' }}>⏳ Loading enrollments…</div>
          )}

          {!enrollmentsLoading && enrolledStudents.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>📭 No enrollments yet.</div>
          )}

          {!enrollmentsLoading && enrolledStudents.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ background: 'rgba(100,108,255,0.1)' }}>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Name</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Email</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Level</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Learning Style</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Competence</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Last Quiz</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Unit</th>
                    <th style={{ textAlign: "left", padding: "0.75rem", fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((s, idx) => (
                    <tr
                      key={s.enrollmentId}
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: "0.75rem" }}>{s.user?.name || "—"}</td>
                      <td style={{ padding: "0.75rem", color: 'rgba(255,255,255,0.7)' }}>{s.user?.email || "—"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          background: 'rgba(100,108,255,0.15)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>{s.user?.profile?.currentLevel || "—"}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>{s.user?.profile?.learningStyle || "—"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          background: 'rgba(34,197,94,0.15)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#4ade80'
                        }}>{s.user?.profile?.lastCompetencyScore ?? "—"}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          background: (s.lastQuizScore ?? 0) >= 60 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: (s.lastQuizScore ?? 0) >= 60 ? '#4ade80' : '#fca5a5'
                        }}>{s.lastQuizScore ?? "—"}%</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>{s.currentUnitOrder ?? "—"}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          background: s.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(97,218,251,0.15)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>{s.status || "active"}</span>
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