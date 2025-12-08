import React from "react";

const path = [
  { title: "JavaScript Essentials", status: "complete" },
  { title: "React Basics", status: "in-progress" },
  { title: "State Management", status: "locked" },
  { title: "Testing & CI", status: "locked" },
];

export default function LearningPath() {
  return (
    <section>
      <div className="section-header">
        <h3>Your Learning Path</h3>
        <p className="muted">A recommended sequence tailored for you.</p>
      </div>

      <ol className="path-list">
        {path.map((p, i) => (
          <li key={p.title} className={`path-item ${p.status}`}>
            <div className="path-index">{i + 1}</div>
            <div className="path-body">
              <div className="path-title">{p.title}</div>
              <div className="muted small">{p.status.replace("-", " ")}</div>
            </div>
            <div className="path-action">
              {p.status === "in-progress" ? <button>Continue</button> : <button className="ghost">View</button>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}