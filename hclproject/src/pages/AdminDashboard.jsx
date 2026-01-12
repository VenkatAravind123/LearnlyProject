import React from "react";
import { useState } from "react";

export default function AdminDashboard() {
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    difficulty: "easy",
    count: 5,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("http://localhost:5000/api/admin/competence/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // Add Authorization header if needed
        },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      const data = await res.json();
      setResult(data.questions || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <section>
      <div className="welcome">
        <h1>Admin Dashboard 👨‍💼</h1>
        <p className="muted">Manage users, courses, and platform analytics.</p>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>1,247</p>
          <p className="muted">+12% from last month</p>
        </div>

        <div className="card">
          <h3>Active Courses</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>45</p>
          <p className="muted">3 pending approval</p>
        </div>

        <div className="card">
          <h3>Completion Rate</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>78%</p>
          <p className="muted">+5% improvement</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Recent Activity</h3>
        <ul className="recommend-list">
          <li>New user registered: john@example.com</li>
          <li>Course "React Advanced" published</li>
          <li>System backup completed</li>
        </ul>
      </div>
      <div className="card" style={{ marginTop: "2rem" }}>
  <div className="card-head">
    <div>
      <h3>Generate AI Competence Questions</h3>
      <p className="muted small">
        Generates questions via Ollama and saves them to the database.
      </p>
    </div>

    <div className="actions">
      <button
        className="ghost"
        type="button"
        onClick={() => {
          setForm({ subject: "", topic: "", difficulty: "easy", count: 5 });
          setError("");
          setResult(null);
        }}
        disabled={loading}
      >
        Reset
      </button>

      <button type="submit" form="ai-q-form" className="btn-primary" disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  </div>

  <form id="ai-q-form" onSubmit={handleGenerate} className="form-grid">
    <div className="form-field">
      <label>Subject</label>
      <input
        name="subject"
        placeholder="e.g., Computer Networks"
        value={form.subject}
        onChange={handleChange}
        required
        disabled={loading}
      />
    </div>

    <div className="form-field">
      <label>Topic</label>
      <input
        name="topic"
        placeholder="e.g., OSI Model"
        value={form.topic}
        onChange={handleChange}
        required
        disabled={loading}
      />
    </div>

    <div className="form-field">
      <label>Difficulty</label>
      <select
        name="difficulty"
        value={form.difficulty}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>

    <div className="form-field">
      <label>Count</label>
      <input
        name="count"
        type="number"
        min="1"
        max="50"
        value={form.count}
        onChange={handleChange}
        disabled={loading}
      />
      <div className="hint">Allowed: 1 to 50</div>
    </div>
  </form>

  {error && <div className="alert alert-error">{error}</div>}

  {result && (
    <div className="result-box">
      <div className="result-row">
        <div>
          <div className="muted small">Saved Test</div>
          <div className="result-title">
            {(result?.test?.subject || form.subject) + " — " + (result?.test?.topic || form.topic)}
          </div>
          <div className="muted small">
            Difficulty: {result?.test?.difficultyLevel || form.difficulty} · Total:{" "}
            {result?.test?.totalQuestions ?? result?.questionsGenerated ?? form.count}
          </div>
          <div className="muted small" style={{ marginTop: "0.35rem" }}>
            Test ID: {result?.test?.id ?? "—"}
          </div>
        </div>

        <div className="result-pill">{result?.questionsGenerated ?? 0} Questions Saved</div>
      </div>
    </div>
  )}
</div>
    </section>

  );
}