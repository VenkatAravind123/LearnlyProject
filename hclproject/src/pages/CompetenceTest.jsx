import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function CompetenceTest() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds for the test
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/competence/test", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []));
  }, []);

  // Timer logic
  useEffect(() => {
    if (submitted) return;
    if (timeLeft === 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [timeLeft, submitted]);

  const handleChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitted) return;
    setSubmitted(true);
    const payload = {
      subject: "General",
      answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      })),
    };
    const res = await fetch("http://localhost:5000/api/competence/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setResult(data);
  };

  if (submitted && result) {
    return (
      <div className="competence-result">
        <h2>Competence Test Result</h2>
        <p><b>Score:</b> {result.competenceScore?.toFixed(2) ?? "--"}%</p>
        <p><b>Level:</b> {result.competenceLevel}</p>
        <p><b>Confidence:</b> {(result.confidenceScore * 100).toFixed(1)}%</p>
        <button className="btn-primary" onClick={() => navigate("/profile")}>Back to Profile</button>
      </div>
    );
  }

  return (
    <div className="competence-test-container">
      <h2>Competence Test</h2>
      <div style={{ fontWeight: "bold", color: "#ff6b6b", marginBottom: "1rem" }}>
        Time Left: {timeLeft}s
      </div>
      <form onSubmit={handleSubmit}>
        {questions.length === 0 && (
          <div className="loading-inline" style={{ padding: "0.75rem 0" }}>
            <Loader size={20} color="#646cff" />
            <div className="muted">Loading questions…</div>
          </div>
        )}
        {questions.map((q, idx) => (
          <div key={q.id} className="competence-question">
            <div>
              <b>Q{idx + 1}:</b> {q.questionText}
            </div>
            {q.options.map((opt, i) => (
              <label key={i} style={{ display: "block", marginLeft: "1rem" }}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => handleChange(q.id, opt)}
                  required
                  disabled={submitted}
                />
                {opt}
              </label>
            ))}
          </div>
        ))}
        {questions.length > 0 && !submitted && (
          <button className="btn-primary"
  type="submit"
  style={{ marginTop: "1.5rem" }}
  disabled={Object.keys(answers).length !== questions.length}>
            Submit Test
          </button>
        )}
      </form>
    </div>
  );
}