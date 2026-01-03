import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/users/protected`, { credentials: "include" }).then((res) => {
      if (!res.ok) navigate("/login");
    });
  }, [navigate]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/dashboard/summary`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load dashboard AI");

        if (!ignore) setAi(data.ai);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section>
      <div className="welcome">
        <h1>Welcome back, {user.name} 👋</h1>
        <p className="muted">Here are your suggested next steps and progress.</p>
      </div>

      {loading && <div className="muted">Loading dashboard…</div>}
      {error && <div className="muted">{error}</div>}

      <div className="grid">
        <div className="card">
          <h3>Today's Focus</h3>
          <p>{ai?.todaysFocus || "Start a course or view your learning path."}</p>
          <div className="actions">
            <button onClick={() => navigate("/learning-path")}>Continue</button>
            <button className="ghost" onClick={() => navigate("/courses")}>Browse Courses</button>
          </div>
        </div>

        <div className="card">
          <h3>Progress</h3>
          {(ai?.progress || []).map((p) => (
            <div key={p.title} className="progress-row">
              <div className="progress-meta">
                <div className="progress-title">{p.title}</div>
                <div className="muted small">{p.pct}%</div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
          {!ai?.progress?.length && <div className="muted">No progress yet.</div>}
        </div>

        <div className="card">
          <h3>Recommended</h3>
          <ul className="recommend-list">
            {(ai?.recommended || []).map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
            {!ai?.recommended?.length && <li>Enroll in a course to get recommendations.</li>}
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Recent Activity</h3>
        <ul className="recommend-list">
          {(ai?.recentActivity || []).map((a, idx) => (
            <li key={idx}>{a}</li>
          ))}
          {!ai?.recentActivity?.length && <li>No recent activity yet.</li>}
        </ul>
      </div>
    </section>
  );
}