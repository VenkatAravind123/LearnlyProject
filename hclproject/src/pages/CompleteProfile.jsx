import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import completeProfile from '../assets/completeprofile.jpg'
export default function CompleteProfile() {
  const [form, setForm] = useState({
    currentLevel: "Beginner",
    preferredLanguage: "English",
    learningStyle: "Text",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <h2>Complete Your Profile</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div style={{ color: "#ff6b6b" }}>{error}</div>}
            <label>
              Current Level
              <select name="currentLevel" value={form.currentLevel} onChange={handleChange} style={{backgroundColor:"black"}}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label>
              Preferred Language
              <input
                name="preferredLanguage"
                value={form.preferredLanguage}
                onChange={handleChange}
                placeholder="e.g. English"
                required
              />
            </label>
            <label>
              Learning Style
              <select name="learningStyle" value={form.learningStyle} onChange={handleChange} style={{backgroundColor:"black"}}>
                <option value="Visual">Visual</option>
                <option value="Text">Text</option>
                <option value="Practice">Practice</option>
              </select>
            </label>
            <button className="btn-primary full" type="submit">
              Save & Continue
            </button>
          </form>
        </div>
        <img src={completeProfile} alt="Complete Profile" style={{ width: "500px", height: "500px" }}/>
      </div>
    </div>
  );
}