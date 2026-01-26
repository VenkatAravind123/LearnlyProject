import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
import { LuLightbulb, LuLightbulbOff } from "react-icons/lu";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/courses": "Courses",
  "/learning-path": "Learning Path",
  "/lesson": "Lesson",
  "/practice": "Practice / Quiz",
  "/progress": "Progress",
  "/assistant": "AI Assistant",
  "/profile": "Profile",
  "/schedule": "Schedule",
};

export default function Header({ search, setSearch, user, theme, onToggleTheme }) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const base = Object.keys(pageTitles).find((p) => location.pathname.startsWith(p));
  const pageTitle = pageTitles[base] || "Dashboard";

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/users/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  const isDark = theme === "dark";

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="page-title">{pageTitle}</h2>
        <div className="header-sub" style={{color: theme === "dark" ? "white" : "black"}}>Personalized suggestions to meet your goals</div>
      </div>

      <div className="header-right" ref={menuRef}>
        <label className="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, topics..."
            aria-label="Search courses"
          />
        </label>

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          {isDark ? <LuLightbulb /> : <LuLightbulbOff />}
        </button>

        <button type="button" className="ghost" onClick={() => setShowMenu((v) => !v)}>
          <FaRegUser /> {user ? user.name : "Account"}
        </button>

        {showMenu && (
          <div className="account-menu">
            <button type="button" className="account-menu-item" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}