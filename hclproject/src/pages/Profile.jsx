import React from "react";

export default function Profile() {
  return (
    <section>
      <div className="profile-header">
        <div className="avatar">👩‍🎓</div>
        <div>
          <h3>Jordan Learner</h3>
          <div className="muted">Member since 2024 • Learning: React Basics</div>
        </div>
      </div>

      <div className="card">
        <h4>Account</h4>
        <div className="profile-grid">
          <div>
            <div className="muted small">Email</div>
            <div>jordan.learner@example.com</div>
          </div>
          <div>
            <div className="muted small">Subscription</div>
            <div>Free</div>
          </div>
          <div>
            <div className="muted small">Timezone</div>
            <div>UTC−05:00</div>
          </div>
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button>Manage Subscription</button>
          <button className="ghost">Edit Profile</button>
        </div>
      </div>
    </section>
  );
}