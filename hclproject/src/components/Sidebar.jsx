import React from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { GiPathDistance } from "react-icons/gi";
import { SiCoursera } from "react-icons/si";
import { GrResources } from "react-icons/gr";
import { GiProgression } from "react-icons/gi";
import { SiGoogleassistant } from "react-icons/si";
import { CgProfile } from "react-icons/cg";
import { GrSchedules } from "react-icons/gr"; 
import { MdManageSearch } from "react-icons/md";
import { FaUsers } from "react-icons/fa6";
import { SiSimpleanalytics } from "react-icons/si";
const studentItems = [
  { id: "dashboard", label: "Dashboard", emoji: <RxDashboard />, path: "/dashboard" },
  { id: "learning-path", label: "Learning Path", emoji: <GiPathDistance />, path: "/learning-path" },
  { id: "courses", label: "Courses", emoji: <SiCoursera />, path: "/courses" },
  { id: "practice", label: "Skill Tracker", emoji: <GrResources />, path: "/skilltracker" },
  { id: "progress", label: "Progress", emoji: <GiProgression />, path: "/progress" },
  { id: "assistant", label: "AI Assistant", emoji: <SiGoogleassistant />, path: "/assistant" },
  { id: "profile", label: "Profile", emoji: <CgProfile />, path: "/profile" },
  { id: "schedule", label: "Schedule", emoji: <GrSchedules />, path: "/schedule" },
];

const adminItems = [
  { id: "dashboard", label: "Dashboard", emoji: <RxDashboard />, path: "/dashboard" },
  { id: "courses", label: "Manage Courses", emoji: <MdManageSearch />, path: "/courses" },
  { id: "users", label: "Users", emoji: <FaUsers />, path: "/users" },
  { id: "analytics", label: "Analytics", emoji: <SiSimpleanalytics />, path: "/analytics" },
  { id: "profile", label: "Profile", emoji: <CgProfile />, path: "/profile" },
];

export default function Sidebar({ userRole = 'student',user}) {
  const items = userRole === 'admin' ? adminItems : studentItems;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">🎓</div>
        <div className="brand-text">
          <strong>GenTutor</strong>
          <span className="muted">
            {userRole === 'admin' ? 'Admin Panel' : 'Personalized Learning'}
          </span>
        </div>
      </div>
      {user && (
        <div className="sidebar-user">
          <span className="sidebar-user-name">Username : {user.name}</span>
        </div>
      )}
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