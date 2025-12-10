import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { id: "dashboard", label: "Dashboard", emoji: "🏠", path: "/dashboard" },
  { id: "learning-path", label: "Learning Path", emoji: "🛤️", path: "/learning-path" },
  { id: "courses", label: "Courses", emoji: "📚", path: "/courses" },
  { id: "practice", label: "Practice / Quiz", emoji: "📝", path: "/practice" },
  { id: "progress", label: "Progress", emoji: "📈", path: "/progress" },
  { id: "assistant", label: "AI Assistant", emoji: "🤖", path: "/assistant" },
  { id: "profile", label: "Profile", emoji: "👤", path: "/profile" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">🎓</div>
        <div className="brand-text">
          <strong>GenTutor</strong>
          <span className="muted">Personalized Learning</span>
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
        <small className="muted">Tip: Use the search above to find courses</small>
      </div>
    </aside>
  );
}