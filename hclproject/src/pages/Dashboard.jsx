import React from "react";
import { useNavigate } from "react-router-dom";

const progress = [
  { title: "React Basics", pct: 72 },
  { title: "Data Structures", pct: 40 },
  { title: "Algorithms", pct: 18 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <section>
      <div className="welcome">
        <h1>Welcome back, Learner 👋</h1>
        <p className="muted">Here are your suggested next steps and progress.</p>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Today's Focus</h3>
          <p>Continue your React Basics course — try the next lesson: "Components & Props".</p>
          <div className="actions">
            <button onClick={() => navigate("/courses")}>Continue Course</button>
            <button className="ghost" onClick={() => navigate("/learning-path")}>View Path</button>
          </div>
        </div>

        <div className="card">
          <h3>Progress</h3>
          {progress.map((p) => (
            <div key={p.title} className="progress-row">
              <div className="progress-meta">
                <div className="progress-title">{p.title}</div>
                <div className="muted small">{p.pct}% completed</div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3>Recommended</h3>
          <ul className="recommend-list">
            <li>Hands-on project: Build a todo app</li>
            <li>Short reading: "Designing for learning"</li>
            <li>Quick quiz: Data Structures (10 Qs)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}