import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
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

export default function Header({ search, setSearch,user }) {
 // const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const base = Object.keys(pageTitles).find((p) => location.pathname.startsWith(p));
  const pageTitle = pageTitles[base] || "Dashboard";

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout handler
  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/users/logout", {
      method: "POST",
      credentials: "include",
    });
    // navigate("/login");
    window.location.href = "/login";
  };

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="page-title">{pageTitle}</h2>
        <div className="header-sub">Personalized suggestions to meet your goals</div>
      </div>

      <div className="header-right" ref={menuRef} style={{ position: "relative" }}>
        {/* <label className="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, topics..."
            aria-label="Search courses"
          />
        </label> */}
        <button
          className="ghost"
          onClick={() => setShowMenu((v) => !v)}
          style={{ position: "relative" }}
        >
          <FaRegUser /> {user ? user.name : "Account"}
        </button>
        {showMenu && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "2.5rem",
              background: "#222",
              borderRadius: "0.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 10,
              minWidth: "120px",
              padding: "0.5rem 0"
            }}
          >
            <button
              className="ghost"
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 1rem",
                border: "none",
                background: "none",
                color: "#fff",
                cursor: "pointer"
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}