import React, { useEffect, useMemo, useState } from "react";
import { FiTrendingUp, FiCode, FiMessageSquare, FiZap, FiPlus, FiEdit2 } from "react-icons/fi";
import './skilltracker.css'
import Loader from "../components/Loader";

import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function meanPct(values) {
  const nums = values.map(clampPct).filter((v) => Number.isFinite(v));
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function toCategory(subject = "", courseName = "") {
  const s = `${subject} ${courseName}`.toLowerCase();
  if (/(communication|english|speaking|soft)/.test(s)) return "communication";
  if (/(aptitude|logic|reason|reasoning|math|quant|verbal)/.test(s)) return "aptitude";
  return "programming";
}

function buildTrend(overall, points = 8) {
  const end = clampPct(overall);
  const start = clampPct(end - 12);
  const step = points <= 1 ? 0 : (end - start) / (points - 1);
  return Array.from({ length: points }, (_, i) => Math.round(start + step * i));
}

function LineChart({ data }) {
  const w = 560;
  const h = 220;
  const pad = 28;

  const values = (Array.isArray(data) ? data : []).map(clampPct);
  const safe = values.length ? values : [0, 0, 0, 0, 0, 0, 0, 0];

  const xStep = (w - pad * 2) / (safe.length - 1);
  const y = (v) => pad + (1 - v / 100) * (h - pad * 2);

  const points = safe.map((v, i) => `${pad + i * xStep},${y(v)}`).join(" ");
  const gridY = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="st-chart">
      {gridY.map((gy) => (
        <g key={gy}>
          <line x1={pad} y1={y(gy)} x2={w - pad} y2={y(gy)} className="st-chart-grid" />
          <text x={6} y={y(gy) + 4} className="st-chart-label">{gy}</text>
        </g>
      ))}

      <polyline points={points} className="st-chart-line" />

      {safe.map((v, i) => (
        <circle key={i} cx={pad + i * xStep} cy={y(v)} r="3.2" className="st-chart-dot" />
      ))}
    </svg>
  );
}

function Donut({ parts }) {
  const size = 240;
  const r = 74;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  const safe = (parts || []).filter((p) => p.value > 0);
  const total = safe.reduce((a, p) => a + p.value, 0) || 1;

  let offset = 0;

  return (
    <div className="st-donut">
      <svg viewBox={`0 0 ${size} ${size}`} className="st-donut-svg">
        <circle cx={cx} cy={cy} r={r} className="st-donut-track" />
        {safe.map((p) => {
          const frac = p.value / total;
          const dash = frac * c;
          const node = (
            <circle
              key={p.key}
              cx={cx}
              cy={cy}
              r={r}
              className="st-donut-seg"
              style={{
                stroke: p.color,
                strokeDasharray: `${dash} ${c - dash}`,
                strokeDashoffset: -offset,
              }}
            />
          );
          offset += dash;
          return node;
        })}
      </svg>

      <div className="st-donut-legend">
        {safe.map((p) => (
          <div key={p.key} className="st-legend-row">
            <span className="st-legend-dot" style={{ background: p.color }} />
            <span className="st-legend-label">{p.label}</span>
            <span className="st-legend-val">{Math.round((p.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkillTracker() {
  const [range, setRange] = useState("30");
  const [activeTab, setActiveTab] = useState("programming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skills, setSkills] = useState([]);
const navigate = useNavigate();
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/courses/my/enrollments`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load skill tracker");

        const enrollments = Array.isArray(data?.enrollments) ? data.enrollments : [];

        // Optional: fetch outlines to compute a better “progress%”
        const outlineResults = await Promise.allSettled(
          enrollments
            .map((e) => e?.course?.courseId)
            .filter(Boolean)
            .map(async (courseId) => {
              const oRes = await fetch(`${API_BASE}/api/courses/${courseId}/outline`, { credentials: "include" });
              const oData = await oRes.json();
              if (!oRes.ok) throw new Error(oData?.error || "Failed outline");

              const units = Array.isArray(oData?.units) ? oData.units : [];
              const total = units.length || 0;
              const completed = units.filter((u) => u.status === "completed").length;
              const pct = total ? Math.round((completed / total) * 100) : 0;
              return [courseId, clampPct(pct)];
            })
        );

        const outlinePctByCourseId = {};
        for (const r of outlineResults) {
          if (r.status === "fulfilled") {
            const [cid, pct] = r.value;
            outlinePctByCourseId[cid] = pct;
          }
        }

        const derived = enrollments.map((e) => {
          const cid = e?.course?.courseId;
          const name = e?.course?.courseName || "Skill";
          const subject = e?.course?.subject || "";
          const category = toCategory(subject, name);

          const pct =
            outlinePctByCourseId[cid] ??
            clampPct(e?.lastQuizScore) ??
            0;

          const target = clampPct(Math.max(pct, Math.min(100, pct + 10)));

          return {
            id: `${cid ?? name}`,
            courseId: cid,
  subject,
  name,
  category,
  current: pct,
  target,
          };
        });

        // fallback demo skills if student has no enrollments yet
       

        if (!ignore) setSkills(derived);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load skill tracker");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const skillsByCat = useMemo(() => {
    const map = { programming: [], communication: [], aptitude: [] };
    for (const s of skills) (map[s.category] ?? map.programming).push(s);
    return map;
  }, [skills]);

  const overall = useMemo(() => meanPct(skills.map((s) => s.current)), [skills]);
  const programming = useMemo(() => meanPct(skillsByCat.programming.map((s) => s.current)), [skillsByCat]);
  const communication = useMemo(() => meanPct(skillsByCat.communication.map((s) => s.current)), [skillsByCat]);
  const aptitude = useMemo(() => meanPct(skillsByCat.aptitude.map((s) => s.current)), [skillsByCat]);

  const trend = useMemo(() => buildTrend(overall, 8), [overall]);

  const donutParts = useMemo(() => {
    const values = [
      { key: "programming", label: "Programming", value: programming, color: "#3b82f6" },
      { key: "communication", label: "Communication", value: Math.max(1, communication), color: "#10b981" },
      { key: "aptitude", label: "Aptitude", value: Math.max(1, aptitude), color: "#8b5cf6" },
    ];
    return values;
  }, [programming, communication, aptitude]);

  // function onAddSkill() {
  //   const name = window.prompt("Skill name?");
  //   if (!name) return;

  //   const category = window.prompt("Category: programming / communication / aptitude", "programming") || "programming";
  //   const current = clampPct(window.prompt("Current % (0-100)", "60"));
  //   const target = clampPct(window.prompt("Target % (0-100)", "75"));

  //   setSkills((prev) => [
  //     ...prev,
  //     { id: `${Date.now()}`, name, category, current, target },
  //   ]);
  // }

  // function onUpdateSkill(id) {
  //   const s = skills.find((x) => x.id === id);
  //   if (!s) return;

  //   const current = clampPct(window.prompt("New current % (0-100)", String(s.current)));
  //   const target = clampPct(window.prompt("New target % (0-100)", String(s.target)));

  //   setSkills((prev) => prev.map((x) => (x.id === id ? { ...x, current, target } : x)));
  // }

  const activeSkills = skillsByCat[activeTab] || [];

  return (
    <section className="st-wrap">
      <div className="st-topbar">
        <div>
          <h3 className="st-title">Skill Tracker</h3>
          <p className="st-subtitle">Monitor your growth across programming, communication, and aptitude skills</p>
        </div>

        <select className="st-range" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {loading && (
        <div className="loading-block">
          <Loader size={34} color="#646cff" />
          <div className="muted">Loading…</div>
        </div>
      )}
      {error && <div className="muted">{error}</div>}

      {!loading && !error && (
        <>
          <div className="st-kpis">
            <div className="st-kpi">
              <div className="st-kpi-row">
                <div>
                  <div className="st-kpi-label">Overall Progress</div>
                  <div className="st-kpi-value">{overall}%</div>
                  <div className="st-kpi-delta">+5% this month</div>
                </div>
                <div className="st-kpi-icon st-kpi-icon--green"><FiTrendingUp /></div>
              </div>
            </div>

            <div className="st-kpi">
              <div className="st-kpi-row">
                <div>
                  <div className="st-kpi-label">Programming</div>
                  <div className="st-kpi-value">{programming}%</div>
                  <div className="st-kpi-delta">+3% this week</div>
                </div>
                <div className="st-kpi-icon st-kpi-icon--blue"><FiCode /></div>
              </div>
            </div>

            <div className="st-kpi">
              <div className="st-kpi-row">
                <div>
                  <div className="st-kpi-label">Communication</div>
                  <div className="st-kpi-value">{communication}%</div>
                  <div className="st-kpi-delta">+3% this week</div>
                </div>
                <div className="st-kpi-icon st-kpi-icon--teal"><FiMessageSquare /></div>
              </div>
            </div>

            <div className="st-kpi">
              <div className="st-kpi-row">
                <div>
                  <div className="st-kpi-label">Aptitude</div>
                  <div className="st-kpi-value">{aptitude}%</div>
                  <div className="st-kpi-delta">+3% this week</div>
                </div>
                <div className="st-kpi-icon st-kpi-icon--purple"><FiZap /></div>
              </div>
            </div>
          </div>

          <div className="st-grid">
            <div className="st-panel">
              <div className="st-panel-head">
                <div>
                  <div className="st-panel-title">Progress Over Time</div>
                  <div className="st-panel-subtitle">Your skill development across different categories</div>
                </div>
              </div>
              <LineChart data={trend} />
              <div className="st-panel-foot muted small">Range: last {range} days (visual only)</div>
            </div>

            <div className="st-panel">
              <div className="st-panel-head">
                <div>
                  <div className="st-panel-title">Skill Distribution</div>
                  <div className="st-panel-subtitle">How your skills are distributed across categories</div>
                </div>
              </div>
              <Donut parts={donutParts} />
            </div>
          </div>

          <div className="st-tabs">
            <button
              type="button"
              className={`st-tab ${activeTab === "programming" ? "active" : ""}`}
              onClick={() => setActiveTab("programming")}
            >
              <FiCode /> Programming
            </button>
            <button
              type="button"
              className={`st-tab ${activeTab === "communication" ? "active" : ""}`}
              onClick={() => setActiveTab("communication")}
            >
              <FiMessageSquare /> Communication
            </button>
            <button
              type="button"
              className={`st-tab ${activeTab === "aptitude" ? "active" : ""}`}
              onClick={() => setActiveTab("aptitude")}
            >
              <FiZap /> Aptitude
            </button>
          </div>

          <div className="st-panel">
            <div className="st-skill-head">
              <div>
                <div className="st-panel-title">
                  {activeTab === "programming" ? "Programming Skills" : activeTab === "communication" ? "Communication Skills" : "Aptitude Skills"}
                </div>
                <div className="st-panel-subtitle">Track and improve your abilities</div>
              </div>

              {/* <button type="button" className="st-add" onClick={onAddSkill}>
                <FiPlus /> Add Skill
              </button> */}
            </div>

            {activeSkills.length === 0 ? (
             <div className="card">
  <h4>No skill data yet</h4>
  <p className="muted">Enroll in courses to start tracking your skills.</p>
  <div className="actions">
    <button className="btn-primary" onClick={() => navigate("/courses")}>Browse Courses</button>
  </div>
</div>
            ) : (
              <div className="st-skill-list">
                {activeSkills.map((s) => (
                  <div key={s.id} className="st-skill">
                    <div className="st-skill-row">
                      <div className="st-skill-name">{s.name}</div>
                      {s.courseId ? (
  <button className="btn-primary" onClick={() => navigate(`/courses/${s.courseId}`)}>
    Continue
  </button>
) : null}
                    </div>

                    <div className="st-skill-meta">
                      <span>Current: {clampPct(s.current)}%</span>
                      <span className="muted">Target: {clampPct(s.target)}%</span>
                    </div>

                    <div className="st-meter">
                      <div className="st-meter-fill" style={{ width: `${clampPct(s.current)}%` }} />
                    </div>

                    <div className="st-meter-scale">
                      <span className="muted">Beginner</span>
                      <span className="muted">Expert</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}