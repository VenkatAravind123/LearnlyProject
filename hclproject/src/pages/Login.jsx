import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: true });

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
        <div className="auth-visual">
          <div className="auth-gradient" />
          <div className="auth-copy">
            <p className="pill">Welcome back</p>
            <h1>Personalized learning awaits</h1>
            <p>Pick up where you left off with adaptive recommendations tailored to your goals.</p>
            <ul>
              <li>🎯 Smart recommendations</li>
              <li>📊 Progress analytics</li>
              <li>🧭 Guided learning paths</li>
            </ul>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Login</h2>
            <p>Access your personalized dashboard</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="********" required />
            </label>
            <div className="auth-row">
              <label className="checkbox">
                <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
                Remember me
              </label>
              <button type="button" className="link-btn">Forgot password?</button>
            </div>
            <button className="btn-primary full" type="submit">Continue</button>
            <div className="auth-divider"><span>or</span></div>
            <div className="auth-social">
              <button type="button" className="btn-ghost">Sign in with Google</button>
              <button type="button" className="btn-ghost">Sign in with GitHub</button>
            </div>
          </form>

          <div className="auth-footer">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}