import React from "react";

export default function Profile({ user, onLogout }) {
  return (
    <section>
      <div className="profile-header">
        <div className="avatar">👩‍🎓</div>
        <div>
          <h3>{user?.name || 'User'}</h3>
          <div className="muted">
            {user?.email} • {user?.role === 'admin' ? 'Administrator' : 'Student'}
          </div>
        </div>
      </div>

      <div className="card">
        <h4>Account Details</h4>
        <div className="profile-grid">
          <div>
            <div className="muted small">Email</div>
            <div>{user?.email || 'user@example.com'}</div>
          </div>
          <div>
            <div className="muted small">Role</div>
            <div>{user?.role === 'admin' ? 'Administrator' : 'Student'}</div>
          </div>
          <div>
            <div className="muted small">Member Since</div>
            <div>2024</div>
          </div>
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="ghost">Edit Profile</button>
          <button className="ghost" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </section>
  );
}