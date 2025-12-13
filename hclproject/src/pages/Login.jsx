import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // TODO: Replace with actual backend API call
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for sending cookies
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      // Expected response: { user: { id, name, email, role }, token }
      
  
      
      onSuccess(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual">
          <div className="auth-gradient" />
          <div className="auth-copy">
            <p className="pill">Welcome back</p>
            <h1>Personalized learning awaits</h1>
            <p>Pick up where you left off with adaptive recommendations.</p>
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
            {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
            
            <label>
              Email
              <input 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="you@example.com" 
                required 
              />
            </label>
            
            <label>
              Password
              <input 
                name="password" 
                type="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="********" 
                required 
              />
            </label>

            <button className="btn-primary full" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Continue'}
            </button>

            <div className="auth-divider"><span>or</span></div>
            
            <div className="auth-social">
              <button type="button" className="btn-ghost">Sign in with Google</button>
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