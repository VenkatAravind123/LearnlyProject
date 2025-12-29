import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(user)
    fetch("http://localhost:5000/api/profile/me", {
      credentials: "include",

    }).then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setError(err.message);
        setLoading(false);

      });
  }, []);

  return (
    <section>
      <div className="welcome">
        <h1>Profile 👤</h1>
        <p className="muted">Manage your personal information and learning preferences.</p>
      </div>

      <div className="profile-grid-layout">
        <div className="card profile-info-card">
          <div className="profile-header-internal">
            <div className="avatar-large">{user?.name?.charAt(0) || "U"}</div>
            <div>
              <h3>{user?.name || "User"}</h3>
              <p className="muted">{user?.email}</p>
              <div className="role-badge">{user?.role || "Student"}</div>
            </div>
          </div>
        </div>

        <div className="card profile-stats-card">
          <h3>Learning Stats</h3>
          {loading ? (
            <div className="profile-loading">Loading stats...</div>
          ) : error ? (
            <div className="error-text">Failed to load stats</div>
          ) : (
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-val">{profile?.lastCompetencyScore || 0}</span>
                <span className="stat-label">Competence Score</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{profile?.currentLevel || "Beginner"}</span>
                <span className="stat-label">Current Level</span>
              </div>
            </div>
          )}
        </div>

        <div className="card profile-preferences-card">
          <h3>Preferences</h3>
          {loading ? (
            <div>Loading...</div>
          ) : profile ? (
            <div className="pref-list">
              <div className="pref-item">
                <span>Preferred Language</span>
                <strong>{profile.preferredLanguage}</strong>
              </div>
              <div className="pref-item">
                <span>Learning Style</span>
                <strong>{profile.learningStyle}</strong>
              </div>
            </div>
          ) : null}

          <button
            className="btn-primary"
            style={{ marginTop: "1.5rem", width: "100%" }}
            onClick={() => navigate("/competence-test")}
          >
            Re-take Competence Test
          </button>
        </div>
      </div>
    </section>
  );
}