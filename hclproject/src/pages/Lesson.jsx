import React from "react";

export default function Lesson() {
  return (
    <section className="lesson">
      <div className="section-header">
        <h3>Lesson: Components & Props</h3>
        <p className="muted">AI-curated content fetched via RAG</p>
      </div>

      <div className="lesson-body">
        <p>Components let you split the UI into reusable pieces. Props are read-only inputs to components.</p>
        <div className="lesson-callout">
          <strong>Example</strong>
          <pre>{`function Button({ label }) {\n  return <button>{label}</button>;\n}`}</pre>
        </div>
        <div className="lesson-actions">
          <button className="btn-primary">Start Practice</button>
          <button className="ghost">Ask AI</button>
        </div>
      </div>
    </section>
  );
}