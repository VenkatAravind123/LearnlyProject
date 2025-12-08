import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const sampleQuestions = [
  { id: 1, text: "Which time complexity is faster?", options: ["O(n)", "O(n log n)", "O(1)", "O(n^2)"] },
  { id: 2, text: "React state is best described as:", options: ["Immutable data", "DOM nodes", "CSS styles", "Server cache"] },
  { id: 3, text: "Which is a stable sorting algorithm?", options: ["Quick sort", "Merge sort", "Heap sort", "Selection sort"] },
];

export default function CompetenceTest() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const total = sampleQuestions.length;
  const q = sampleQuestions[current];
  const allAnswered = Object.keys(answers).length === total;

  const setAnswer = (id, option) => setAnswers((prev) => ({ ...prev, [id]: option }));

  const handleSubmit = () => {
    if (!allAnswered) return;
    navigate("/competence/evaluating");
  };

  return (
    <div className="competence-page">
      <div className="test-shell">
        <div className="test-top">
          <span className="pill">Question {current + 1} / {total}</span>
          <div className="test-progress">
            <div className="test-progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
          </div>
        </div>

        <div className="test-question">
          <h2>{q.text}</h2>
          <div className="test-options">
            {q.options.map((opt) => (
              <label key={opt} className={`option ${answers[q.id] === opt ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswer(q.id, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="test-actions">
          <button className="ghost" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
            Previous
          </button>
          {current < total - 1 ? (
            <button className="btn-primary" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
              Next
            </button>
          ) : (
            <button className="btn-primary" disabled={!allAnswered} onClick={handleSubmit}>
              Submit Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}