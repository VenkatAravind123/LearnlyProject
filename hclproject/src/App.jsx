import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import LearningPath from "./pages/LearningPath";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompetenceIntro from "./pages/CompetenceIntro";
import CompetenceTest from "./pages/CompetenceTest";
import CompetenceEvaluating from "./pages/CompetenceEvaluating";
import CompetenceResult from "./pages/CompetenceResult";
import Lesson from "./pages/Lesson";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import Assistant from "./pages/Assistant";

function AppLayout({ children, search, setSearch }) {
  return (
    <div className="app-root">
      <Sidebar />
      <div className="main-area">
        <Header search={search} setSearch={setSearch} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedCompetence, setHasCompletedCompetence] = useState(false);
  const [search, setSearch] = useState("");

  const requireAuth = (element) =>
    isLoggedIn ? (
      hasCompletedCompetence ? (
        element
      ) : (
        <Navigate to="/competence/instructions" replace />
      )
    ) : (
      <Navigate to="/login" replace />
    );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login
                onSuccess={() => {
                  setIsLoggedIn(true);
                  setHasCompletedCompetence(false);
                }}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Signup
                onSuccess={() => {
                  setIsLoggedIn(true);
                  setHasCompletedCompetence(false);
                }}
              />
            )
          }
        />

        {/* Competence flow */}
        <Route
          path="/competence/instructions"
          element={
            isLoggedIn ? (
              <CompetenceIntro />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/competence/test"
          element={
            isLoggedIn ? (
              <CompetenceTest />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/competence/evaluating"
          element={
            isLoggedIn ? (
              <CompetenceEvaluating />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/competence/result"
          element={
            isLoggedIn ? (
              <CompetenceResult
                onComplete={() => setHasCompletedCompetence(true)}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected app */}
        <Route
          path="/dashboard"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Dashboard />
            </AppLayout>
          )}
        />
        <Route
          path="/courses"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Courses search={search} />
            </AppLayout>
          )}
        />
        <Route
          path="/learning-path"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <LearningPath />
            </AppLayout>
          )}
        />
        <Route
          path="/lesson/:id"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Lesson />
            </AppLayout>
          )}
        />
        <Route
          path="/practice"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Practice />
            </AppLayout>
          )}
        />
        <Route
          path="/progress"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Progress />
            </AppLayout>
          )}
        />
        <Route
          path="/assistant"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Assistant />
            </AppLayout>
          )}
        />
        <Route
          path="/profile"
          element={requireAuth(
            <AppLayout search={search} setSearch={setSearch}>
              <Profile />
            </AppLayout>
          )}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}