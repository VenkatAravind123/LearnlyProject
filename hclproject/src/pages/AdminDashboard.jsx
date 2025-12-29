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
        <h3>Generate AI Competence Questions</h3>
        <form onSubmit={handleGenerate} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            name="subject"
            placeholder="Subject"
            value={form.subject}
            onChange={handleChange}
            required
          />
          <input
            name="topic"
            placeholder="Topic"
            value={form.topic}
            onChange={handleChange}
            required
          />
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input
            name="count"
            type="number"
            min="1"
            max="20"
            value={form.count}
            onChange={handleChange}
            style={{ width: "80px" }}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {result && (
          <div style={{ marginTop: "1rem" }}>
            <h4>Generated Questions:</h4>
            <ol>
              {Array.isArray(result) ? result.map((q, i) => (
                <li key={i}>{q.question || q.questionText || JSON.stringify(q)}</li>
              )) : (
                <p>Generated {result.questionsGenerated || 0} questions (check console/DB)</p>
              )}
            </ol>
          </div>
        )}
      </div>
    </section>

  );
}