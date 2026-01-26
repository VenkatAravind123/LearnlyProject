import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function CourseLearn() {
  const { courseId } = useParams();
  const navigate = useNavigate();

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

  const [placementRequired, setPlacementRequired] = useState(false);
  const [placementQuestions, setPlacementQuestions] = useState([]);
  const [placementAnswers, setPlacementAnswers] = useState({});
  const [placementResult, setPlacementResult] = useState(null);
    const explanationRef = useRef(null);

  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState(null); // { x, y } in viewport coords
  const [askOpen, setAskOpen] = useState(false);
  const [askMode, setAskMode] = useState("meaning"); // "meaning" | "simplify"
  const [askQuestion, setAskQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  function closeAsk() {
    setAskOpen(false);
    setAiLoading(false);
    setAiAnswer(null);
    setAskQuestion("");
  }

  function captureSelection() {
    if (placementRequired || completed) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectedText("");
      setSelectionPos(null);
      return;
    }

    const text = String(sel.toString() || "").trim();
    if (!text) {
      setSelectedText("");
      setSelectionPos(null);
      return;
    }

    // Only react to selections inside the explanation box
    const node = sel.anchorNode;
    if (explanationRef.current && node && !explanationRef.current.contains(node)) {
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (!rect.width && !rect.height)) return;

      setSelectedText(text.slice(0, 200));
      setSelectionPos({
        x: rect.left + rect.width / 2,
        y: Math.max(8, rect.top - 8),
      });
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    function onScroll() {
      setSelectionPos(null);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  async function askAIForSelection() {
    if (!selectedText) return;

    setAiLoading(true);
    setAiAnswer(null);
    setError("");

    const contextCourse = course?.courseName || "";
    const contextUnit = unit?.title ? `Unit: ${unit.title}` : "";

    const modeInstruction =
      askMode === "meaning"
        ? "Explain the meaning/definition in very simple words. Provide 2 synonyms and 1 example sentence."
        : "Rewrite it in simpler words (very easy English), keep it short.";

    const userExtra = String(askQuestion || "").trim();

    const message = `
You are helping a student while reading course content.

Course: ${contextCourse}
${contextUnit}

Selected text: "${selectedText}"

Task: ${modeInstruction}
${userExtra ? `User question: ${userExtra}` : ""}

Return concise output.
`.trim();

    try {
      const fd = new FormData();
      fd.append("message", message);

      const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI request failed");

      setAiAnswer(data);
    } catch (e) {
      setError(e.message || "Failed to ask AI");
    } finally {
      setAiLoading(false);
    }
  }

  const unitId = unit?.id;

  const canSubmit = useMemo(() => {
    if (!unitId || quizQuestions.length === 0) return false;
    return quizQuestions.every((q) => !!answersByQid[q.id]);
  }, [unitId, quizQuestions, answersByQid]);

  async function loadNext() {
    try {
      setError("");
      setLoading(true);
      setLastResult(null);
      setAnswersByQid({});

      const res = await fetch(`${API_BASE}/api/courses/${courseId}/next`, {
        credentials: "include",
      });

      const data = await res.json();

      // Handle errors first
      if (!res.ok) {
        if (String(data?.error || "").toLowerCase().includes("not enrolled")) {
          navigate(`/courses/${courseId}/overview`, { replace: true });
          return;
        }
        throw new Error(data?.error || "Failed to load course unit");
      }

      // If backend requires competence test, render test screen (NOT the unit screen)
      if (data?.placementRequired) {
        setPlacementRequired(true);
        setPlacementQuestions(Array.isArray(data.placementQuestions) ? data.placementQuestions : []);
        setPlacementAnswers({});
        setPlacementResult(null);

        setCompleted(false);
        setCourse(data.course || null);
        setUnit(null);
        setExplanationText("");
        setRecommendedStyle("");
        setQuizQuestions([]);
        setFlashcards([]);
        return;
      }

      setPlacementRequired(false);

      // Course completed
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

      // Normal unit payload
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

  async function submitPlacement() {
    try {
      setBusy(true);
      setError("");

      const answers = placementQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: placementAnswers[q.id],
      }));

      const res = await fetch(`${API_BASE}/api/courses/${courseId}/placement/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Placement submit failed");

      setPlacementResult(data);
      await loadNext(); // now server will allow unit 1
    } catch (e) {
      setError(e.message || "Failed to submit placement test");
    } finally {
      setBusy(false);
    }
  }

  async function generateCoursePlan() {
    await fetch(`${API_BASE}/api/plan/generate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: Number(courseId), days: 14, dailyMinutes: 30, preferredTime: "evening" }),
    });
    navigate(`/schedule?courseId=${courseId}`);
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
    } catch (e) {
      setError(e.message || "Failed to submit quiz");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <div className="muted">Loading…</div>
      </div>
    );
  }

  if (completed) {
    return (
      <section>
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <h3>Course Completed</h3>
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            You’ve finished all available units for this course.
          </p>
          <div className="actions" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <button className="btn-primary" onClick={() => navigate("/courses")}>
              Browse Courses
            </button>
            <button className="ghost" onClick={() => navigate(`/schedule?courseId=${courseId}`)}>
              View Plan
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (placementRequired) {
    const canSubmitPlacement =
      placementQuestions.length > 0 && placementQuestions.every((q) => !!placementAnswers[q.id]);

    return (
      <section>
        <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--border)" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>{course?.courseName || "Course"} • Competence Test</h3>

          {error && (
            <div className="card" style={{ marginBottom: "1rem", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div className="muted">{error}</div>
              <div className="actions" style={{ marginTop: "0.75rem" }}>
                <button onClick={loadNext} disabled={busy}>Retry</button>
                <button className="ghost" onClick={() => navigate(`/courses/${courseId}/overview`)}>
                  Back to Overview
                </button>
              </div>
            </div>
          )}

          <div className="muted" style={{ marginBottom: "1rem" }}>
            Answer these questions so the AI can adapt the course to your level.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {placementQuestions.map((q, idx) => (
              <div key={q.id} className="card" style={{ border: "1px solid var(--border)", padding: "1rem" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>
                  Q{idx + 1}. {q.questionText}
                </div>
                {["A", "B", "C", "D"].map((opt) => {
                  const text =
                    opt === "A" ? q.optionA : opt === "B" ? q.optionB : opt === "C" ? q.optionC : q.optionD;

                  const checked = placementAnswers[q.id] === opt;

                  return (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.75rem",
                        margin: "0.5rem 0",
                        background: checked ? "rgba(100,108,255,0.15)" : "var(--input-bg)",
                        border: `1px solid ${checked ? "rgba(100,108,255,0.35)" : "var(--border)"}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`p-${q.id}`}
                        value={opt}
                        checked={checked}
                        onChange={() => setPlacementAnswers((p) => ({ ...p, [q.id]: opt }))}
                        style={{ marginRight: "0.75rem" }}
                      />
                      {opt}. {text}
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="actions" style={{ marginTop: "1rem" }}>
            <button onClick={submitPlacement} disabled={!canSubmitPlacement || busy} className="btn-primary">
              {busy ? "Submitting..." : "Submit Placement Test"}
            </button>
            <button onClick={loadNext} disabled={busy} className="ghost">
              Reload
            </button>
          </div>

          {placementResult?.score !== undefined && (
            <div className="muted" style={{ marginTop: "1rem" }}>
              Placement score: {placementResult.score}% • Recommended style: {placementResult.recommendedStyle}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div
        className="section-header"
        style={{
          background: "linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))",
          border: "1px solid rgba(100,108,255,0.15)",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            background: "linear-gradient(135deg, #fff 0%, #646cff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "1.8rem",
            marginBottom: "0.5rem",
          }}
        >
          {course?.courseName || "Course"}
        </h3>
        <p className="muted" style={{ fontSize: "1rem" }}>
          <span
            style={{
              background: "rgba(100,108,255,0.2)",
              padding: "0.35rem 0.85rem",
              borderRadius: "6px",
              marginRight: "0.5rem",
            }}
          >
            Unit {unit?.order}: {unit?.title}
          </span>
          {recommendedStyle && (
            <span
              style={{
                background: "rgba(97,218,251,0.2)",
                padding: "0.35rem 0.85rem",
                borderRadius: "6px",
              }}
            >
              Learning Style: {recommendedStyle}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "1rem", border: "1px solid rgba(239,68,68,0.25)" }}>
          <div className="muted">{error}</div>
          <div className="actions" style={{ marginTop: "0.75rem" }}>
            <button onClick={loadNext} disabled={busy}>Retry</button>
            <button className="ghost" onClick={() => navigate(`/courses/${courseId}/overview`)}>
              Back to Overview
            </button>
          </div>
        </div>
      )}

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <h4
          style={{
            color: "#61dafb",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          Explanation
        </h4>

        <div
          ref={explanationRef}
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          className="muted"
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: "1.7",
            fontSize: "0.95rem",
            userSelect: "text",
          }}
        >
          {explanationText || "No explanation returned."}
        </div>
                {selectionPos && selectedText && !askOpen && (
          <button
            type="button"
            onClick={() => {
              setAskMode("meaning");
              setAskOpen(true);
            }}
            style={{
              position: "fixed",
              left: `${selectionPos.x}px`,
              top: `${selectionPos.y}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
              padding: "0.4rem 0.65rem",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "#000",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ask AI
          </button>
        )}
      </div>

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h4
          style={{
            color: "#646cff",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          Flashcards
        </h4>

        {flashcards.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: "1rem" }}>
            No flashcards.
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            {flashcards.map((f, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  background: "linear-gradient(135deg, rgba(100,108,255,0.1), rgba(97,218,251,0.05))",
                  border: "1px solid rgba(100,108,255,0.15)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "0.75rem", color: "#61dafb", fontSize: "0.95rem" }}>
                  {f.front}
                </div>
                <div className="muted" style={{ lineHeight: "1.6" }}>
                  {f.back}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h4
          style={{
            color: "#646cff",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          Unit Quiz
        </h4>

        {quizQuestions.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: "2rem" }}>
            No quiz questions.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {quizQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="card"
                style={{
                  background: "linear-gradient(135deg, rgba(100,108,255,0.08), rgba(97,218,251,0.04))",
                  border: "1px solid rgba(100,108,255,0.12)",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "1.05rem", color: "#61dafb" }}>
                  <span
                    style={{
                      background: "rgba(100,108,255,0.3)",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "6px",
                      marginRight: "0.75rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Q{idx + 1}
                  </span>
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
                        alignItems: "center",
                        padding: "0.75rem",
                        margin: "0.5rem 0",
                        background: answersByQid[q.id] === opt ? "rgba(100,108,255,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${
                          answersByQid[q.id] === opt ? "rgba(100,108,255,0.3)" : "rgba(255,255,255,0.05)"
                        }`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={answersByQid[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                        style={{ marginRight: "0.75rem", width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span style={{ fontWeight: answersByQid[q.id] === opt ? "600" : "400" }}>
                        {opt}. {text}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}

            <div className="actions" style={{ marginTop: "1.5rem" }}>
              <button
                onClick={submitQuiz}
                disabled={!canSubmit || busy}
                style={{
                  background:
                    !canSubmit || busy
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                  border: "none",
                  padding: "0.85rem 1.75rem",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: !canSubmit || busy ? "not-allowed" : "pointer",
                  opacity: !canSubmit || busy ? 0.5 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {busy ? "Submitting..." : "Submit Quiz"}
              </button>

              <button
                onClick={loadNext}
                disabled={busy}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  padding: "0.85rem 1.75rem",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.5 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                Reload Unit
              </button>
            </div>

            {lastResult && (
              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1.25rem",
                  background: lastResult.passed
                    ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))"
                    : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))",
                  border: `1px solid ${lastResult.passed ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      margin: "0 auto",
                      background: lastResult.passed
                        ? "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"
                        : "linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                  >
                    {lastResult.passed ? "✓" : "X"}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: lastResult.passed ? "#4ade80" : "#fca5a5",
                  }}
                >
                  Score: {lastResult.score}%
                </div>
                <div className="muted" style={{ fontSize: "0.9rem" }}>
                  Pass mark: {lastResult.minPassPercentage}% • {lastResult.passed ? "Passed!" : "Not passed"}
                </div>
              </div>
            )}

            {lastResult?.passed && (
              <div className="actions" style={{ marginTop: "1rem" }}>
                <button
                  onClick={loadNext}
                  disabled={busy}
                  style={{
                    background: "linear-gradient(135deg, #646cff 0%, #61dafb 100%)",
                    border: "none",
                    padding: "0.85rem 1.75rem",
                    borderRadius: "10px",
                    fontWeight: "600",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.5 : 1,
                    transition: "all 0.2s ease",
                    fontSize: "1rem",
                  }}
                >
                  Next Unit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
            {askOpen && (
        <div
          onClick={closeAsk}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 100%)" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Ask AI about selection</h3>

            <div className="muted small" style={{ marginBottom: "0.75rem" }}>
              Selected: <b>{selectedText}</b>
            </div>

            <div className="actions" style={{ marginBottom: "0.75rem" }}>
              <button className={askMode === "meaning" ? "btn-primary" : ""} onClick={() => setAskMode("meaning")}>
                Meaning
              </button>
              <button className={askMode === "simplify" ? "btn-primary" : ""} onClick={() => setAskMode("simplify")}>
                Simplify
              </button>
              <button onClick={askAIForSelection} disabled={aiLoading}>
                {aiLoading ? "Asking..." : "Ask"}
              </button>
              <button className="ghost" onClick={closeAsk}>
                Close
              </button>
            </div>

            <label className="muted small" style={{ display: "block", marginBottom: "0.35rem" }}>
              Optional question
            </label>
            <input
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder='e.g., "Explain in very simple words"'
              style={{ width: "100%", marginBottom: "0.75rem" }}
            />

            {aiAnswer && (
              <div className="card" style={{ border: "1px solid var(--border)", padding: "1rem" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Answer</div>
                <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  {aiAnswer.simplifiedExplanation || "No response"}
                </div>

                {Array.isArray(aiAnswer.keyPoints) && aiAnswer.keyPoints.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div className="muted small" style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                      Key Points
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {aiAnswer.keyPoints.slice(0, 5).map((k, i) => (
                        <li key={i} className="muted">{k}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}