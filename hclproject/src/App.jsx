import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Courses from "./pages/Courses";
import LearningPath from "./pages/LearningPath";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Lesson from "./pages/Lesson";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import Assistant from "./pages/Assistant";
import CompleteProfile from "./pages/CompleteProfile"; // <-- Import the new page
import CompetenceTest from "./pages/CompetenceTest";
import CourseLearn from "./pages/CourseLearn";
import Users from "./pages/Users";

function AppLayout({ children, search, setSearch, userRole,user }) {
  return (
    <div className="app-root">
      <Sidebar userRole={userRole} user={user}/>
      <div className="main-area">
        <Header search={search} setSearch={setSearch} user={user}/>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null); // { id, name, email, role: 'student' | 'admin' }
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!user;
  const userRole = user?.role || 'student';

  useEffect(() => {
    fetch("http://localhost:5000/api/users/protected", {
      credentials: "include",
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data && data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
      
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/users/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const requireAuth = (element, allowedRoles = ['student', 'admin']) =>
    isLoggedIn ? (
      allowedRoles.includes(userRole) ? (
        element
      ) : (
        <Navigate to="/dashboard" replace />
      )
    ) : (
      <Navigate to="/login" replace />
    );

  if (loading) return null; // Optionally show a spinner

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Landing />} />
        
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onSuccess={handleLoginSuccess} />
            )
          }
        />
        
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/complete-profile" replace />
            ) : (
              <Signup onSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Complete profile after signup */}
        <Route
          path="/complete-profile"
          element={requireAuth(<CompleteProfile />)}
        />

        {/* Protected routes - Role-based dashboard */}
        <Route
          path="/dashboard"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              {userRole === 'admin' ? <AdminDashboard user={user}/> : <Dashboard user={user}/>}
            </AppLayout>
          )}
        />

        <Route
          path="/users"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <Users search={search} userRole={userRole}/>
            </AppLayout>,
            ['admin']
          )}
        />
        {/* Student routes */}
        <Route
          path="/courses"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <Courses search={search} userRole={userRole}/>
            </AppLayout>,
            ['student', 'admin']
          )}
        />
        <Route
          path="/courses/:courseId"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <CourseLearn />
            </AppLayout>,
            ['student', 'admin']
          )}
         />
        
        <Route
          path="/learning-path"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <LearningPath />
            </AppLayout>,
            ['student']
          )}
        />
        
        <Route
          path="/lesson/:id"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <Lesson />
            </AppLayout>,
            ['student']
          )}
        />
        
        <Route
          path="/practice"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <Practice />
            </AppLayout>,
            ['student']
          )}
        />
        
        <Route
          path="/progress"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole}  user={user}>
              <Progress />
            </AppLayout>,
            ['student']
          )}
        />
        
        <Route
          path="/assistant"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole} user={user}>
              <Assistant />
            </AppLayout>,
            ['student']
          )}
        />
        
        <Route
          path="/profile"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch} userRole={userRole}  user={user}>
              <Profile user={user} onLogout={handleLogout} />
            </AppLayout>
          )}
        />
        <Route path="/competence-test" element={requireAuth(<CompetenceTest />)}
/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}