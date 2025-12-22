import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/profile/me", {
      credentials: "include",
    })
      .then((res) => {
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
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">👤 Profile</h2>
        {user && (
          <div className="profile-section">
            <div><b>Name:</b> {user.name}</div>
            <div><b>Email:</b> {user.email}</div>
            <div><b>Role:</b> {user.role}</div>
          </div>
        )}
        <hr className="profile-divider" />
        <h3 className="profile-subtitle">🎯 Learning Preferences</h3>
        {loading ? (
          <div className="profile-loading">Loading profile...</div>
        ) : error ? (
          <div className="profile-loading" style={{ color: "#ff6b6b" }}>Error: {error}</div>
        ) : profile ? (
          <div className="profile-section">
            <div><b>Current Level:</b> {profile.currentLevel}</div>
            <div><b>Preferred Language:</b> {profile.preferredLanguage}</div>
            <div><b>Learning Style:</b> {profile.learningStyle}</div>
            <div>
              <b>Competence Score:</b> <span className="profile-score">{profile.lastCompetencyScore}</span>
            </div>
            <button
              className="btn-primary"
              style={{ marginTop: "1.5rem", width: "100%" }}
              onClick={() => navigate("/competence-test")}
            >
              Take Competence Test
            </button>
          </div>
        ) : (
          <div className="profile-loading">No profile data found</div>
        )}
      </div>
    </div>
  );
}