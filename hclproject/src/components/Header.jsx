import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/courses": "Courses",
  "/learning-path": "Learning Path",
  "/lesson": "Lesson",
  "/practice": "Practice / Quiz",
  "/progress": "Progress",
  "/assistant": "AI Assistant",
  "/profile": "Profile",
};

export default function Header({ search, setSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const base = Object.keys(pageTitles).find((p) => location.pathname.startsWith(p));
  const pageTitle = pageTitles[base] || "Dashboard";

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="page-title">{pageTitle}</h2>
        <div className="header-sub">Personalized suggestions to meet your goals</div>
      </div>

      <div className="header-right">
        <label className="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, topics..."
            aria-label="Search courses"
          />
        </label>
        <button className="ghost" onClick={() => navigate("/profile")}>Account</button>
      </div>
    </header>
  );
}