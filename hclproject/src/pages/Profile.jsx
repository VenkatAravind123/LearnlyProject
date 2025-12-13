import React, { useEffect, useState } from "react";
import "./profile.css"
export default function Profile({ user, onLogout }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/profile/me", {
      credentials: "include",
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProfile(data));
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
        {profile ? (
          <div className="profile-section">
            <div><b>Current Level:</b> {profile.currentLevel}</div>
            <div><b>Preferred Language:</b> {profile.preferredLanguage}</div>
            <div><b>Learning Style:</b> {profile.learningStyle}</div>
            <div><b>Competence Score:</b> <span className="profile-score">{profile.lastCompetencyScore}</span></div>
          </div>
        ) : (
          <div className="profile-loading">Loading profile...</div>
        )}
        {/* <button className="btn-ghost profile-logout" onClick={onLogout}>
          Logout
        </button> */}
      </div>
    </div>
  );
}