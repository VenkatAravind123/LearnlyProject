import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup({ onSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
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
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      
      // Call success handler with user data
      onSuccess(data.user);
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-visual alt">
          <div className="auth-gradient alt" />
          <div className="auth-copy">
            <p className="pill">Start free</p>
            <h1>Craft your learning path</h1>
            <p>Tell us what you want to achieve and we'll tailor a roadmap for you.</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Sign up</h2>
            <p>Create your account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                color: '#ff6b6b', 
                background: 'rgba(255,107,107,0.1)', 
                padding: '0.75rem', 
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
            
            <label>
              Full name
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Jordan Learner" 
                required 
                disabled={loading}
              />
            </label>
            
            <label>
              Email
              <input 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="you@example.com" 
                required 
                disabled={loading}
              />
            </label>
            
            <label>
              Password
              <input 
                name="password" 
                type="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="At least 6 characters" 
                required 
                minLength={6}
                disabled={loading}
              />
            </label>
            
            <label>
              I am a
              <select 
                name="role" 
                value={form.role} 
                onChange={handleChange}
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </label>

            <button 
              className="btn-primary full" 
              type="submit" 
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <div className="auth-divider"><span>or</span></div>
            
            <div className="auth-social">
              <button type="button" className="btn-ghost" disabled={loading}>
                Sign up with Google
              </button>
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