import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CompetenceEvaluating() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/competence/result"), 1800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="competence-page loading">
      <div className="competence-card">
        <p className="pill">Evaluating</p>
        <h2>Evaluating your competence level…</h2>
        <p className="muted">This may take a few seconds while the AI analyzes your answers.</p>
        <div className="spinner" aria-label="Loading" />
      </div>
    </div>
  );
}