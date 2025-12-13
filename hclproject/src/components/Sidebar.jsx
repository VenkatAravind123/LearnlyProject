import React from "react";
import { NavLink } from "react-router-dom";

const studentItems = [
  { id: "dashboard", label: "Dashboard", emoji: "🏠", path: "/dashboard" },
  { id: "learning-path", label: "Learning Path", emoji: "🛤️", path: "/learning-path" },
  { id: "courses", label: "Courses", emoji: "📚", path: "/courses" },
  { id: "practice", label: "Practice / Quiz", emoji: "📝", path: "/practice" },
  { id: "progress", label: "Progress", emoji: "📈", path: "/progress" },
  { id: "assistant", label: "AI Assistant", emoji: "🤖", path: "/assistant" },
  { id: "profile", label: "Profile", emoji: "👤", path: "/profile" },
];

const adminItems = [
  { id: "dashboard", label: "Dashboard", emoji: "🏠", path: "/dashboard" },
  { id: "courses", label: "Manage Courses", emoji: "📚", path: "/courses" },
  { id: "users", label: "Users", emoji: "👥", path: "/users" },
  { id: "analytics", label: "Analytics", emoji: "📊", path: "/analytics" },
  { id: "profile", label: "Profile", emoji: "👤", path: "/profile" },
];

export default function Sidebar({ userRole = 'student' }) {
  const items = userRole === 'admin' ? adminItems : studentItems;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">🎓</div>
        <div className="brand-text">
          <strong>Learnly</strong>
          <span className="muted">
            {userRole === 'admin' ? 'Admin Panel' : 'Personalized Learning'}
          </span>
        </div>
      </div>

      <nav className="nav">
        {items.map((it) => (
          <NavLink
            key={it.id}
            to={it.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-emoji">{it.emoji}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <small className="muted">
          {userRole === 'admin' ? 'Managing the platform' : 'Tip: Use search to find courses'}
        </small>
      </div>
    </aside>
  );
}