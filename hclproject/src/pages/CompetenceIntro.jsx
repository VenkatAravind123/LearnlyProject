import React from "react";
import { useNavigate } from "react-router-dom";

export default function CompetenceIntro() {
  const navigate = useNavigate();
  return (
    <div className="competence-page">
      <div className="competence-card">
        <p className="pill">Competence Assessment</p>
        <h1>We’ll tailor your path based on your current level</h1>
        <p className="muted">
          This short test helps us understand your strengths and gaps so the AI can personalize your learning path.
        </p>
        <ul className="competence-facts">
          <li>✅ 25 questions • ~12 minutes</li>
          <li>✅ Adaptive difficulty</li>
          <li>✅ Generates your personalized curriculum</li>
        </ul>
        <button className="btn-primary" onClick={() => navigate("/competence/test")}>
          Start Test
        </button>
      </div>
    </div>
  );
}