import React, { useState } from "react";

const questions = [
  { id: 1, q: "Which hook manages state?", options: ["useEffect", "useState", "useMemo", "useRef"], answer: "useState" },
  { id: 2, q: "Props are:", options: ["Mutable", "Read-only", "Global", "CSS"], answer: "Read-only" },
];

export default function Practice() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions.filter((q) => answers[q.id] === q.answer).length;

  return (
    <section>
      <div className="section-header">
        <h3>Practice / Quiz</h3>
        <p className="muted">Instant feedback with AI hints</p>
      </div>

      <div className="practice-list">
        {questions.map((q) => (
          <div key={q.id} className="card">
            <h4>{q.q}</h4>
            <div className="test-options">
              {q.options.map((opt) => (
                <label key={opt} className={`option ${answers[q.id] === opt ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name={`pq-${q.id}`}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {submitted && (
              <p className="muted small">
                {answers[q.id] === q.answer ? "Correct!" : `Try again. Hint: think about stateful UI.`}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="actions" style={{ marginTop: 16 }}>
        <button className="btn-primary" onClick={() => setSubmitted(true)}>Submit</button>
        {submitted && <span className="muted">Score: {score}/{questions.length}</span>}
      </div>
    </section>
  );
}