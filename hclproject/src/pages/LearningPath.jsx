import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function LearningPath() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState("");
const courseComp = (e)=>{
  if(e.status == "completed"){
    return true;
  }
  else{
    return false;
  }
}
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
        if (!res.ok) throw new Error(data?.error || "Failed to load learning path");

        if (!ignore) setEnrollments(Array.isArray(data?.enrollments) ? data.enrollments : []);
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

  return (
    <section>
      <div className="section-header">
        <h3>Your Learning Path</h3>
        <p className="muted">Courses you enrolled in (continue anytime).</p>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="muted">⏳ Loading…</div>
        </div>
      )}
      {error && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
          border: '1px solid rgba(239,68,68,0.2)',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#fca5a5' }}>⚠️ {error}</div>
        </div>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))',
          border: '1px solid rgba(100,108,255,0.15)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h4 style={{
            background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '1.5rem',
            marginBottom: '1rem'
          }}>No enrolled courses yet</h4>
          <p className="muted" style={{ marginBottom: '2rem', fontSize: '1rem' }}>Go to Courses and start one.</p>
          <div className="actions">
            <button
              onClick={() => navigate("/courses")}
              style={{
                background: 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                border: 'none',
                padding: '0.85rem 2rem',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >🚀 Browse Courses</button>
          </div>
        </div>
      )}

      {!loading && !error && enrollments.length > 0 && (
        <ol className="path-list" style={{
          listStyle: 'none',
          padding: 0,
          margin: '1rem 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {enrollments.map((e, i) => (
            <li key={e.enrollmentId} className="path-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <div className="path-index" style={{
                width: '50px',
                height: '50px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '12px',
                background: e.status === 'completed'
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))'
                  : 'linear-gradient(135deg, rgba(100,108,255,0.2), rgba(97,218,251,0.15))',
                fontWeight: '700',
                fontSize: '1.2rem',
                color: e.status === 'completed' ? '#4ade80' : '#61dafb'
              }}>{i + 1}</div>
              <div className="path-body" style={{ flex: 1 }}>
                <div className="path-title" style={{
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>{e.course?.courseName || "Course"}</div>
                <div className="muted small" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(100,108,255,0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem'
                  }}>📖 {e.course?.subject || "—"}</span>
                  <span style={{
                    background: 'rgba(97,218,251,0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem'
                  }}>📚 Unit: {e.currentUnitOrder ?? "—"}</span>
                  <span style={{
                    background: (e.lastQuizScore ?? 0) >= 60 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: (e.lastQuizScore ?? 0) >= 60 ? '#4ade80' : '#fca5a5'
                  }}>🎯 Last quiz: {e.lastQuizScore ?? "—"}%</span>
                  <span style={{
                    background: e.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(97,218,251,0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: e.status === 'completed' ? '#4ade80' : '#61dafb'
                  }}>{e.status === 'completed' ? '✅ Completed' : '🔄 Active'}</span>
                </div>
              </div>
              <div className="path-action" style={{ flexShrink: 0 }}>
                <button
                  onClick={() => navigate(`/courses/${e.course?.courseId}`)}
                  disabled={courseComp(e)}
                  style={{
                    background: 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: !e.course?.courseId ? 'not-allowed' : 'pointer',
                    opacity: !e.course?.courseId ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  🚀 Continue
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}