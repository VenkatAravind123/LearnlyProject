import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup({ onSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    track: "frontend",
    updates: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess?.();
    navigate("/competence/instructions");
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual alt">
          <div className="auth-gradient alt" />
          <div className="auth-copy">
            <p className="pill">Start free</p>
            <h1>Craft your learning path</h1>
            <p>Tell us what you want to achieve and we’ll tailor a roadmap for you.</p>
            <div className="chips">
              <span>Web</span><span>AI/ML</span><span>Data</span><span>Cloud</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Sign up</h2>
            <p>14-day Pro trial included</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Full name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Jordan Learner" required />
            </label>
            <label>Email
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>
            <label>Password
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a strong password" required />
            </label>
            <label>Preferred track
              <select name="track" value={form.track} onChange={handleChange}>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="ai">AI / ML</option>
                <option value="data">Data</option>
                <option value="cloud">Cloud</option>
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" name="updates" checked={form.updates} onChange={handleChange} />
              Email me product updates and tips
            </label>
            <button className="btn-primary full" type="submit">Create account</button>
            <div className="auth-divider"><span>or</span></div>
            <div className="auth-social">
              <button type="button" className="btn-ghost">Sign up with Google</button>
              <button type="button" className="btn-ghost">Sign up with GitHub</button>
            </div>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}