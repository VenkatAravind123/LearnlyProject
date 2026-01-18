import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const API_BASE = "http://localhost:5000";

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ai, setAi] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [planInfo, setPlanInfo] = useState({ today: "", stats: null, todayTasks: [] });

  useEffect(() => {
    fetch(`${API_BASE}/api/users/protected`, { credentials: "include" }).then((res) => {
      if (!res.ok) navigate("/login");
    });
  }, [navigate]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/dashboard/summary`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load dashboard");

        if (!ignore) {
          setAi(data.ai || null);
          setMetrics(data.metrics || null);
        }

        const pRes = await fetch(`${API_BASE}/api/plan/active`, { credentials: "include" });
        const pData = await pRes.json();

        if (pRes.ok && pData?.plan) {
          const today = pData.today || "";
          const todayTasks = (pData.tasks || []).filter((t) => t.date === today && t.status === "pending");
          if (!ignore) setPlanInfo({ today, stats: pData.stats || null, todayTasks });
        }
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load dashboard");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const kpis = useMemo(() => {
    const coursesCompleted = metrics?.courses?.completed ?? 0;
    const coursesTotal = metrics?.courses?.total ?? 0;

    const quizzesPassed = metrics?.quizzes?.passed ?? 0;
    const quizzesTotal = metrics?.quizzes?.total ?? 0;

    const totalHours = metrics?.time?.totalHours ?? 0;
    const thisWeekHours = metrics?.time?.thisWeekHours ?? 0;
    const weeklyGoalHours = metrics?.time?.weeklyGoalHours ?? 0;

    const overallProgressPct = metrics?.overallProgressPct ?? 0;

    const coursesPct = coursesTotal ? (coursesCompleted / coursesTotal) * 100 : 0;
    const quizzesPct = quizzesTotal ? (quizzesPassed / quizzesTotal) * 100 : 0;
    const timePct = weeklyGoalHours ? (thisWeekHours / weeklyGoalHours) * 100 : 0;

    return {
      overallProgressPct,
      coursesCompleted,
      coursesTotal,
      quizzesPassed,
      quizzesTotal,
      totalHours,
      thisWeekHours,
      weeklyGoalHours,
      coursesPct,
      quizzesPct,
      timePct,
      streakDays: metrics?.streakDays ?? 0,
      modulesCompleted: metrics?.modules?.completed ?? 0,
    };
  }, [metrics]);

  return (
    <section>
      <div className="welcome">
        <h1>Welcome back, {user?.name || "Student"}!</h1>
        <p className="muted">Continue your learning journey. You're doing great.</p>
      </div>

      {loading && (
        <div className="muted">
          <Loader />
        </div>
      )}
      {error && <div className="muted">{error}</div>}

      {!loading && !error && (
        <div className="dash-grid">
          <div className="dash-left">
            <div className="card dash-overall">
              <div className="dash-overall-head">
                <div>
                  <h3>Overall Progress</h3>
                  <div className="muted small">Your learning journey so far</div>
                </div>

                <div className="dash-overall-pct">
                  <div className="dash-overall-pct-num">{pct(kpis.overallProgressPct)}%</div>
                  <div className="muted small">Complete</div>
                </div>
              </div>

              <div className="dash-kpis">
                <div className="dash-kpi">
                  <div className="dash-kpi-label">Courses</div>
                  <div className="dash-kpi-value">
                    {kpis.coursesCompleted}/{kpis.coursesTotal || 0}
                  </div>
                  <div className="dash-mini-bar">
                    <div className="dash-mini-fill" style={{ width: `${pct(kpis.coursesPct)}%` }} />
                  </div>
                </div>

                <div className="dash-kpi">
                  <div className="dash-kpi-label">Quizzes</div>
                  <div className="dash-kpi-value">
                    {kpis.quizzesPassed}/{kpis.quizzesTotal || 0}
                  </div>
                  <div className="dash-mini-bar">
                    <div className="dash-mini-fill" style={{ width: `${pct(kpis.quizzesPct)}%` }} />
                  </div>
                </div>

                <div className="dash-kpi">
                  <div className="dash-kpi-label">Hours</div>
                  <div className="dash-kpi-value">{Number(kpis.totalHours || 0)}h</div>
                  <div className="dash-mini-bar">
                    <div className="dash-mini-fill" style={{ width: `${pct(kpis.timePct)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card dash-path">
              <div className="dash-card-head">
                <h3>Today's Learning Path</h3>
                <button className="ghost" onClick={() => navigate("/schedule")}>
                  View All
                </button>
              </div>

              {planInfo.todayTasks.length ? (
                <div className="dash-path-list">
                  {planInfo.todayTasks.slice(0, 4).map((t, idx) => (
                    <div key={t.id} className="dash-path-item">
                      <div className="dash-path-num">{idx + 1}</div>
                      <div className="dash-path-main">
                        <div className="dash-path-title">{t.title}</div>
                        <div className="muted small">
                          {t.startTime} • {t.durationMin} min
                        </div>
                      </div>
                      <div className="dash-path-status">Pending</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">No tasks planned for today. Generate a plan in a course or open Schedule.</div>
              )}
            </div>
          </div>

          <div className="dash-right">
            <div className="card dash-week">
              <h3>This Week</h3>
              <div className="muted small" style={{ marginTop: "-0.25rem" }}>
                Your activity
              </div>

              <div className="dash-week-time">
                <div className="dash-week-time-num">{Number(kpis.thisWeekHours || 0)}h</div>
                <div className="muted small">
                  {kpis.weeklyGoalHours ? `Goal: ${Number(kpis.weeklyGoalHours)}h` : "Set a plan to track weekly goals"}
                </div>
              </div>

              <div className="dash-week-stats">
                <div className="dash-week-row">
                  <span className="muted">Modules completed</span>
                  <strong>{kpis.modulesCompleted}</strong>
                </div>
                <div className="dash-week-row">
                  <span className="muted">Quizzes passed</span>
                  <strong>{kpis.quizzesPassed}</strong>
                </div>
                <div className="dash-week-row">
                  <span className="muted">Current streak</span>
                  <strong>{kpis.streakDays} days</strong>
                </div>
              </div>
            </div>

            <div className="card dash-recommended">
              <div className="dash-card-head">
                <h3>Recommended for You</h3>
                <button className="ghost" onClick={() => navigate("/courses")}>
                  Browse Courses
                </button>
              </div>

              <ul className="recommend-list">
                {(ai?.recommended || []).slice(0, 3).map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
                {!ai?.recommended?.length && <li>Enroll in a course to get recommendations.</li>}
              </ul>
            </div>

            <div className="card dash-focus">
              <h3>Today's Focus</h3>
              <p className="muted" style={{ marginTop: "0.5rem" }}>
                {ai?.todaysFocus || "Start a course or open your schedule to continue."}
              </p>
              <div className="actions">
                <button onClick={() => navigate("/learning-path")}>Continue</button>
                <button className="ghost" onClick={() => navigate("/courses")}>
                  Browse Courses
                </button>
              </div>
            </div>
          </div>

          <div className="card dash-activity">
            <div className="dash-card-head">
              <h3>Recent Activity</h3>
              <button className="ghost" onClick={() => navigate("/progress")}>
                View All
              </button>
            </div>

            <ul className="recommend-list">
              {(ai?.recentActivity || []).slice(0, 5).map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
              {!ai?.recentActivity?.length && <li>No recent activity yet.</li>}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}