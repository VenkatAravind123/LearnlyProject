import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function groupByDate(tasks) {
  const map = new Map();
  for (const t of tasks || []) {
    const key = t.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return Array.from(map.entries()).map(([date, items]) => ({
    date,
    tasks: items.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))),
  }));
}

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryCourseId = searchParams.get("courseId") ? Number(searchParams.get("courseId")) : 0;

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
const [today, setToday] = useState("");
const [nextTask, setNextTask] = useState(null);
  const [error, setError] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId || 0); // 0 => overall plan

  const [goal, setGoal] = useState("Complete my enrolled courses");
  const [days, setDays] = useState(14);
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [preferredTime, setPreferredTime] = useState("evening");

  const byDate = useMemo(() => groupByDate(tasks), [tasks]);

  async function loadEnrollments() {
    const res = await fetch(`${API_BASE}/api/courses/my/enrollments`, { credentials: "include" });
    const data = await res.json();
    if (res.ok) setEnrollments(Array.isArray(data?.enrollments) ? data.enrollments : []);
  }

  async function loadPlan(courseId) {
    setError("");
    setLoading(true);
    try {
      const url = courseId
        ? `${API_BASE}/api/plan/active?courseId=${courseId}`
        : `${API_BASE}/api/plan/active`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load plan");

      setPlan(data.plan);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setStats(data.stats || null);
setToday(data.today || "");
setNextTask(data.nextTask || null);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnrollments();
  }, []);

  useEffect(() => {
    loadPlan(selectedCourseId || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  async function generate() {
    setError("");
    try {
      const body = { goal, days, dailyMinutes, preferredTime };
      if (selectedCourseId) body.courseId = selectedCourseId;

      const res = await fetch(`${API_BASE}/api/plan/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate plan");

      setPlan(data.plan);
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (e) {
      setError(e.message || "Failed to generate");
    }
  }

  async function completeTask(taskId) {
    await fetch(`${API_BASE}/api/plan/tasks/${taskId}/complete`, { method: "POST", credentials: "include" });
    await loadPlan(selectedCourseId || 0);
  }
  async function rescheduleMissed() {
  setError("");
  try {
    const body = {};
    if (selectedCourseId) body.courseId = selectedCourseId;

    const res = await fetch(`${API_BASE}/api/plan/reschedule`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to reschedule");

    await loadPlan(selectedCourseId || 0);
  } catch (e) {
    setError(e.message || "Failed to reschedule");
  }
}

  async function skipTask(taskId) {
    await fetch(`${API_BASE}/api/plan/tasks/${taskId}/skip`, { method: "POST", credentials: "include" });
    await loadPlan(selectedCourseId || 0);
  }

  return (
    <section>
      <div className="section-header">
        <h3>Schedule</h3>
        <p className="muted" >Generate a plan for a specific course and track unit progress.</p>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h4>Plan Scope</h4>
        <label className="muted small">Course</label>
        <select
          value={selectedCourseId}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelectedCourseId(id);
            navigate(id ? `/schedule?courseId=${id}` : "/schedule");
          }}
        >
          <option value={0}>Overall (all courses)</option>
          {enrollments.map((e) => (
            <option key={e.enrollmentId} value={e.course?.courseId || 0}>
              {e.course?.courseName || "Course"}
            </option>
          ))}
        </select>
        <div className="actions" style={{ marginTop: "0.75rem" }}>
          <button onClick={generate}>Generate / Regenerate</button>
          <button className="ghost" disabled={!stats?.missed} onClick={rescheduleMissed}>
  Reschedule missed ({stats?.missed || 0})
</button>
          <button className="ghost" onClick={() => loadPlan(selectedCourseId || 0)}>Refresh</button>
          {selectedCourseId ? (
            <button className="ghost" onClick={() => navigate(`/courses/${selectedCourseId}`)}>Open Course</button>
          ) : null}
        </div>
      </div>

      {loading && <div className="muted">Loading…</div>}
      {error && <div className="muted">{error}</div>}

      {!loading && !plan && (
        <div className="card">
          <h4>Create your schedule</h4>
          <div className="form-grid">
            <label>
              Goal
              <input value={goal} onChange={(e) => setGoal(e.target.value)} />
            </label>
            <label>
              Days
              <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min={7} max={30} />
            </label>
            <label>
              Minutes/day
              <input
                type="number"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                min={15}
                max={180}
              />
            </label>
            <label>
              Preferred time
              <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="any">Any</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button onClick={generate}>Generate schedule</button>
          </div>
        </div>
      )}

      {!loading && plan && (
        <>
          <div className="card">
            <h4>Active plan</h4>
            <div className="muted small">
              Goal: {plan.goal} • {plan.days} days • {plan.dailyMinutes} min/day • {plan.preferredTime}
              {plan.courseId ? ` • courseId: ${plan.courseId}` : ""}
            </div>
            {stats ? (
  <div className="muted small" style={{ marginTop: "0.5rem" }}>
    Today: {today || "-"} • Pending: {stats.pending} • Completed: {stats.completed} • Missed: {stats.missed} • Completion: {stats.completedPct}%
    {nextTask ? ` • Next: ${nextTask.date} ${nextTask.startTime} (${nextTask.type})` : ""}
  </div>
) : null}
          </div>

          {byDate.map((d) => (
            <div key={d.date} className="card" style={{ marginTop: "1rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>{d.date}</h4>

              {d.tasks.map((t) => (
                <div key={t.id} className="progress-row" style={{ alignItems: "center" }}>
                  <div className="progress-meta">
                    <div className="progress-title">{t.startTime} • {t.title}</div>
                    <div className="muted small">
                      {t.type} • {t.durationMin} min • status: {t.status}
                      {t.unitOrder ? ` • unit: ${t.unitOrder}` : ""}
                    </div>
                  </div>

                  <div className="actions">
                    <button disabled={t.status === "completed"} onClick={() => completeTask(t.id)}>Complete</button>
                    <button className="ghost" disabled={t.status === "completed"} onClick={() => skipTask(t.id)}>Skip</button>
                    
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </section>
  );
}