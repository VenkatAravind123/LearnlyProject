import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function CourseLearn() {
  const { courseId } = useParams();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [completed, setCompleted] = useState(false);
  const [course, setCourse] = useState(null);
  const [unit, setUnit] = useState(null);

  const [explanationText, setExplanationText] = useState("");
  const [recommendedStyle, setRecommendedStyle] = useState("");

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [flashcards, setFlashcards] = useState([]);

  const [answersByQid, setAnswersByQid] = useState({});
  const [lastResult, setLastResult] = useState(null);

  const unitId = unit?.id;

  const canSubmit = useMemo(() => {
    if (!unitId || quizQuestions.length === 0) return false;
    return quizQuestions.every((q) => !!answersByQid[q.id]);
  }, [unitId, quizQuestions, answersByQid]);

  async function enrollIfNeeded() {
    // Safe to call always; backend returns "Already enrolled" too
    await fetch(`${API_BASE}/api/courses/${courseId}/enroll`, {
      method: "POST",
      credentials: "include",
    });
  }

  async function loadNext() {
    try {
      setError("");
      setLoading(true);
      setLastResult(null);
      setAnswersByQid({});

      await enrollIfNeeded();

      const res = await fetch(`${API_BASE}/api/courses/${courseId}/next`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to load course unit");

      if (data?.completed) {
        setCompleted(true);
        setCourse(null);
        setUnit(null);
        setExplanationText("");
        setRecommendedStyle("");
        setQuizQuestions([]);
        setFlashcards([]);
        return;
      }

      setCompleted(false);
      setCourse(data.course || null);
      setUnit(data.unit || null);
      setExplanationText(String(data.explanationText || ""));
      setRecommendedStyle(String(data.recommendedStyle || ""));
      setQuizQuestions(Array.isArray(data.quizQuestions) ? data.quizQuestions : []);
      setFlashcards(Array.isArray(data.flashcards) ? data.flashcards : []);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  function setAnswer(questionId, selectedOption) {
    setAnswersByQid((prev) => ({ ...prev, [questionId]: selectedOption }));
  }

  async function submitQuiz() {
    try {
      if (!unitId) return;
      setBusy(true);
      setError("");

      const answers = quizQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: answersByQid[q.id],
      }));

      const res = await fetch(`${API_BASE}/api/courses/${courseId}/units/${unitId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Quiz submit failed");

      setLastResult(data);

      // If passed, user can click "Next unit"
      // If failed, user can retry (reloadNext will serve same unit again)
    } catch (e) {
      setError(e.message || "Failed to submit quiz");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <div className="muted">⏳ Loading…</div>
    </div>
  );

  if (error) return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
      border: '1px solid rgba(239,68,68,0.2)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ color: '#fca5a5' }}>⚠️ {error}</div>
    </div>
  );

  if (completed) {
    return (
      <section>
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
          border: '1px solid rgba(34,197,94,0.3)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{
            background: 'linear-gradient(135deg, #fff 0%, #4ade80 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>Course Completed!</h3>
          <p className="muted" style={{ fontSize: '1.1rem' }}>Nice work — you finished this course.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="section-header" style={{
        background: 'linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))',
        border: '1px solid rgba(100,108,255,0.15)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          background: 'linear-gradient(135deg, #fff 0%, #646cff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '1.8rem',
          marginBottom: '0.5rem'
        }}>📚 {course?.courseName || "Course"}</h3>
        <p className="muted" style={{ fontSize: '1rem' }}>
          <span style={{
            background: 'rgba(100,108,255,0.2)',
            padding: '0.35rem 0.85rem',
            borderRadius: '6px',
            marginRight: '0.5rem'
          }}>Unit {unit?.order}: {unit?.title}</span>
          {recommendedStyle && (
            <span style={{
              background: 'rgba(97,218,251,0.2)',
              padding: '0.35rem 0.85rem',
              borderRadius: '6px'
            }}>✨ Style: {recommendedStyle}</span>
          )}
        </p>
      </div>

      <div className="card" style={{
        marginBottom: "1rem",
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <h4 style={{
          color: '#61dafb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>💡 Explanation</h4>
        <div className="muted" style={{
          whiteSpace: "pre-wrap",
          lineHeight: '1.7',
          fontSize: '0.95rem'
        }}>
          {explanationText || "No explanation returned."}
        </div>
      </div>

      <div className="card" style={{
        marginBottom: "1rem",
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <h4 style={{
          color: '#646cff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>🗂️ Flashcards</h4>
        {flashcards.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: '1rem' }}>📭 No flashcards.</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: '1rem' }}>
            {flashcards.map((f, idx) => (
              <div key={idx} className="card" style={{
                background: 'linear-gradient(135deg, rgba(100,108,255,0.1), rgba(97,218,251,0.05))',
                border: '1px solid rgba(100,108,255,0.15)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                  color: '#61dafb',
                  fontSize: '0.95rem'
                }}>{f.front}</div>
                <div className="muted" style={{ lineHeight: '1.6' }}>{f.back}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <h4 style={{
          color: '#646cff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>📝 Unit Quiz</h4>

        {quizQuestions.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>📭 No quiz questions.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {quizQuestions.map((q, idx) => (
              <div key={q.id} className="card" style={{
                background: 'linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))',
                border: '1px solid rgba(100,108,255,0.12)',
                padding: '1.5rem'
              }}>
                <div style={{
                  fontWeight: 600,
                  marginBottom: "1rem",
                  fontSize: '1.05rem',
                  color: '#61dafb'
                }}>
                  <span style={{
                    background: 'rgba(100,108,255,0.3)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    marginRight: '0.75rem',
                    fontSize: '0.9rem'
                  }}>Q{idx + 1}</span>
                  {q.questionText}
                </div>

                {["A", "B", "C", "D"].map((opt) => {
                  const text =
                    opt === "A" ? q.optionA : opt === "B" ? q.optionB : opt === "C" ? q.optionC : q.optionD;

                  return (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: 'center',
                        padding: "0.75rem",
                        margin: "0.5rem 0",
                        background: answersByQid[q.id] === opt ? 'rgba(100,108,255,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${answersByQid[q.id] === opt ? 'rgba(100,108,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={answersByQid[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                        style={{
                          marginRight: "0.75rem",
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ fontWeight: answersByQid[q.id] === opt ? '600' : '400' }}>
                        {opt}. {text}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}

            <div className="actions" style={{ marginTop: '1.5rem' }}>
              <button
                onClick={submitQuiz}
                disabled={!canSubmit || busy}
                style={{
                  background: (!canSubmit || busy) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: (!canSubmit || busy) ? 'not-allowed' : 'pointer',
                  opacity: (!canSubmit || busy) ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {busy ? "⏳ Submitting..." : "✅ Submit Quiz"}
              </button>

              <button
                onClick={loadNext}
                disabled={busy}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Reload Unit
              </button>
            </div>

            {lastResult && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: lastResult.passed
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))',
                border: `1px solid ${lastResult.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {lastResult.passed ? '🎉' : '📚'}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: lastResult.passed ? '#4ade80' : '#fca5a5'
                }}>
                  Score: {lastResult.score}%
                </div>
                <div className="muted" style={{ fontSize: '0.9rem' }}>
                  Pass mark: {lastResult.minPassPercentage}% • {lastResult.passed ? "✅ Passed!" : "❌ Not passed"}
                </div>
              </div>
            )}

            {lastResult?.passed && (
              <div className="actions" style={{ marginTop: '1rem' }}>
                <button
                  onClick={loadNext}
                  disabled={busy}
                  style={{
                    background: 'linear-gradient(135deg, #646cff 0%, #61dafb 100%)',
                    border: 'none',
                    padding: '0.85rem 1.75rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    fontSize: '1rem'
                  }}
                >
                  🚀 Next Unit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}