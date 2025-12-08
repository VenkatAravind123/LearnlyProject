import React from "react";
import { useNavigate } from "react-router-dom";

const topics = [
  { name: "Arithmetic", score: 72, level: "Intermediate" },
  { name: "Algebra", score: 45, level: "Beginner" },
  { name: "Reasoning", score: 81, level: "Proficient" },
];

export default function CompetenceResult({ onComplete }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    onComplete?.();
    navigate("/dashboard");
  };

  return (
    <div className="competence-page">
      <div className="result-grid">
        <div className="result-card">
          <p className="pill">Overall Score</p>
          <h1>76% • Intermediate</h1>
          <p className="muted">We identified strong reasoning skills and growth areas in Algebra.</p>
          <button className="btn-primary" onClick={handleContinue}>
            Generate My Personalized Learning Path
          </button>
        </div>

        <div className="result-card">
          <h3>Topic Breakdown</h3>
          <ul className="topic-list">
            {topics.map((t) => (
              <li key={t.name}>
                <div>
                  <strong>{t.name}</strong>
                  <div className="muted small">{t.level}</div>
                </div>
                <div className="score-chip">{t.score}%</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="result-card">
          <h3>AI Summary</h3>
          <p>“You have strong reasoning skills but foundational gaps in Algebra. Recommended starting level: Beginner → Number Systems Module.”</p>
        </div>
      </div>
    </div>
  );
}