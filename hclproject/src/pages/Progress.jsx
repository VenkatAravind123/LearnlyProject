import React from "react";

const modules = [
  { name: "React Basics", done: 80 },
  { name: "Data Structures", done: 45 },
  { name: "Algorithms", done: 20 },
];

export default function Progress() {
  return (
    <section>
      <div className="section-header">
        <h3>Progress</h3>
        <p className="muted">Competence improvement over time</p>
      </div>

      <div className="card">
        <h4>Module Completion</h4>
        {modules.map((m) => (
          <div key={m.name} className="progress-row">
            <div className="progress-meta">
              <div className="progress-title">{m.name}</div>
              <div className="muted small">{m.done}%</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${m.done}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}