import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import { IoCloseOutline } from "react-icons/io5";

const API_BASE = "http://localhost:5000";

function safeStr(v) {
  return v === null || v === undefined ? "" : String(v);
}

function toGoalsArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? "").trim()).filter(Boolean);
}

export default function Profile({ user }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile"); // profile | preferences | security | premium
  const [profile, setProfile] = useState(null);

  const [draft, setDraft] = useState({
    // profile fields
    phoneNumber: "",
    location: "",
    college: "",
    graduationYear: "",
    currentRole: "",
    experienceLevel: "",
    bio: "",
    github: "",
    linkedin: "",
    learningGoals: [],

    // preferences
    currentLevel: "Beginner",
    preferredLanguage: "English",
    learningStyle: "Text",
  });

  const [goalsInput, setGoalsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initials = useMemo(() => {
    const n = (user?.name || "U").trim();
    return (n[0] || "U").toUpperCase();
  }, [user]);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, { credentials: "include" });
      if (res.status === 404) {
        // profile not created yet; keep defaults and let Save create it
        setProfile(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load profile");

      setProfile(json);
      setDraft({
        phoneNumber: safeStr(json.phoneNumber),
        location: safeStr(json.location),
        college: safeStr(json.college),
        graduationYear: safeStr(json.graduationYear),
        currentRole: safeStr(json.currentRole),
        experienceLevel: safeStr(json.experienceLevel),
        bio: safeStr(json.bio),
        github: safeStr(json.github),
        linkedin: safeStr(json.linkedin),
        learningGoals: toGoalsArray(json.learningGoals),

        currentLevel: json.currentLevel || "Beginner",
        preferredLanguage: json.preferredLanguage || "English",
        learningStyle: json.learningStyle || "Text",
      });
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function addGoal() {
    const v = goalsInput.trim();
    if (!v) return;
    setDraft((d) => ({ ...d, learningGoals: [...d.learningGoals, v].slice(0, 20) }));
    setGoalsInput("");
  }

  function removeGoal(index) {
    setDraft((d) => ({ ...d, learningGoals: d.learningGoals.filter((_, i) => i !== index) }));
  }

  async function saveAll() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentLevel: draft.currentLevel,
          preferredLanguage: draft.preferredLanguage,
          learningStyle: draft.learningStyle,

          phoneNumber: draft.phoneNumber,
          location: draft.location,
          college: draft.college,
          graduationYear: draft.graduationYear,
          currentRole: draft.currentRole,
          experienceLevel: draft.experienceLevel,
          bio: draft.bio,
          github: draft.github,
          linkedin: draft.linkedin,
          learningGoals: draft.learningGoals,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save profile");

      setProfile(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "preferences", label: "Preferences" },
    { id: "security", label: "Security" },
    
  ];

  return (
    <section className="ps-shell">
      <div className="ps-topbar">
        <div>
          <h2 className="ps-title">Profile & Settings</h2>
          <div className="ps-sub">Manage your account settings and preferences</div>
        </div>
      </div>

      <div className="ps-tabs" role="tablist" aria-label="Profile tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ps-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            role="tab"
            aria-selected={activeTab === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="ps-alert">Error: {error}</div>}
      {loading && <div className="card ps-card">Loading profile…</div>}

      {!loading && (
        <>
          {activeTab === "profile" && (
            <>
              <div className="card ps-hero">
                <div className="ps-hero-left">
                  <div className="ps-avatar">{initials}</div>
                  <div className="ps-hero-meta">
                    <div className="ps-name">{user?.name || "User"}</div>
                    <div className="ps-email">{user?.email || ""}</div>
                    <div className="ps-badges">
                      <span className="ps-pill">{(draft.currentRole || user?.role || "Student").toString()}</span>
                      {draft.experienceLevel ? <span className="ps-pill soft">{draft.experienceLevel}</span> : null}
                    </div>
                  </div>
                </div>

                <div className="ps-hero-right">
                  <div className="ps-mini">
                    <div className="ps-mini-label">Competence Score</div>
                    <div className="ps-mini-val">{profile?.lastCompetencyScore ?? 0}</div>
                  </div>
                  <div className="ps-mini">
                    <div className="ps-mini-label">Current Level</div>
                    <div className="ps-mini-val">{draft.currentLevel}</div>
                  </div>
                </div>
              </div>

              <div className="ps-grid">
                <div className="card ps-card">
                  <div className="ps-card-head">
                    <h3>Basic Information</h3>
                  </div>

                  <div className="ps-fields">
                    <label className="ps-field">
                      <span>Full Name</span>
                      <input value={user?.name || ""} disabled />
                    </label>

                    <label className="ps-field">
                      <span>Email Address</span>
                      <input value={user?.email || ""} disabled />
                    </label>

                    <label className="ps-field">
                      <span>Phone Number</span>
                      <input
                        value={draft.phoneNumber}
                        onChange={(e) => updateDraft("phoneNumber", e.target.value)}
                        placeholder="+1 234567890"
                      />
                    </label>

                    <label className="ps-field">
                      <span>Location</span>
                      <input
                        value={draft.location}
                        onChange={(e) => updateDraft("location", e.target.value)}
                        placeholder="City, Country"
                      />
                    </label>
                  </div>
                </div>

                <div className="card ps-card">
                  <div className="ps-card-head">
                    <h3>Education & Career</h3>
                  </div>

                  <div className="ps-fields">
                    <label className="ps-field">
                      <span>College/University</span>
                      <input
                        value={draft.college}
                        onChange={(e) => updateDraft("college", e.target.value)}
                        placeholder="Your college/university"
                      />
                    </label>

                    <label className="ps-field">
                      <span>Graduation Year</span>
                      <select value={draft.graduationYear} onChange={(e) => updateDraft("graduationYear", e.target.value)}>
                        <option value="">Select</option>
                        {Array.from({ length: 12 }).map((_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return (
                            <option key={year} value={String(year)}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label className="ps-field">
                      <span>Current Role</span>
                      <input
                        value={draft.currentRole}
                        onChange={(e) => updateDraft("currentRole", e.target.value)}
                        placeholder="e.g., Frontend Developer"
                      />
                    </label>

                    <label className="ps-field">
                      <span>Experience Level</span>
                      <select value={draft.experienceLevel} onChange={(e) => updateDraft("experienceLevel", e.target.value)}>
                        <option value="">Select</option>
                        <option value="0-1 years">0-1 years</option>
                        <option value="1-2 years">1-2 years</option>
                        <option value="2-3 years">2-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5+ years">5+ years</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="card ps-card">
                  <div className="ps-card-head">
                    <h3>Learning Goals</h3>
                  </div>

                  <div className="ps-goals">
                    {draft.learningGoals.map((g, idx) => (
                      <div className="ps-goal" key={`${g}-${idx}`}>
                        <div className="ps-goal-text">{g}</div>
                        <button type="button"  onClick={() => removeGoal(idx)} aria-label="Remove goal">
                          <IoCloseOutline  />
                        </button>
                      </div>
                    ))}

                    <div className="ps-goal-add">
                      <input
                        value={goalsInput}
                        
                        onChange={(e) => setGoalsInput(e.target.value)}
                        placeholder="Add a goal (e.g., Learn React Advanced Patterns)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addGoal();
                          }
                        }}
                      />
                      <button type="button" className="ps-add" onClick={addGoal}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card ps-card">
                  <div className="ps-card-head">
                    <h3>Bio & Social Links</h3>
                  </div>

                  <div className="ps-fields">
                    <label className="ps-field ps-field-full">
                      <span>Bio</span>
                      <textarea
                        rows={4}
                        value={draft.bio}
                        onChange={(e) => updateDraft("bio", e.target.value)}
                        placeholder="Write a short bio…"
                      />
                    </label>

                    <label className="ps-field">
                      <span>GitHub</span>
                      <input
                        value={draft.github}
                        onChange={(e) => updateDraft("github", e.target.value)}
                        placeholder="username or profile link"
                      />
                    </label>

                    <label className="ps-field">
                      <span>LinkedIn</span>
                      <input
                        value={draft.linkedin}
                        onChange={(e) => updateDraft("linkedin", e.target.value)}
                        placeholder="username or profile link"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="ps-savebar">
                <button type="button" className="btn-primary ps-save" onClick={saveAll} disabled={saving}>
                  {saving ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </>
          )}

          {activeTab === "preferences" && (
            <>
              <div className="ps-grid">
                <div className="card ps-card">
                  <div className="ps-card-head">
                    <h3>Preferences</h3>
                  </div>

                  <div className="ps-fields">
                    <label className="ps-field">
                      <span>Current Level</span>
                      <select value={draft.currentLevel} onChange={(e) => updateDraft("currentLevel", e.target.value)}>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </label>

                    <label className="ps-field">
                      <span>Preferred Language</span>
                      <input
                        value={draft.preferredLanguage}
                        onChange={(e) => updateDraft("preferredLanguage", e.target.value)}
                        placeholder="English"
                      />
                    </label>

                    <label className="ps-field">
                      <span>Learning Style</span>
                      <select value={draft.learningStyle} onChange={(e) => updateDraft("learningStyle", e.target.value)}>
                        <option value="Text">Text</option>
                        <option value="Visual">Visual</option>
                        <option value="Practice">Practice</option>
                      </select>
                    </label>
                  </div>

                  <div className="ps-actions">
                    <button type="button" className="btn-primary" onClick={saveAll} disabled={saving}>
                      {saving ? "Saving..." : "Save Preferences"}
                    </button>

                    <button type="button" className="ps-secondary" onClick={() => navigate("/competence-test")}>
                      Re-take Competence Test
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <div className="ps-grid">
              <div className="card ps-card">
                <div className="ps-card-head">
                  <h3>Security</h3>
                </div>
                <div className="ps-muted">Coming soon (password change, sessions, etc.).</div>
              </div>
            </div>
          )}

          
        </>
      )}
    </section>
  );
}