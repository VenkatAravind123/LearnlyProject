import React from "react";

export default function AdminDashboard() {
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
    </section>
  );
}