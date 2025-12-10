import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const handleGetStarted = () => navigate("/signup");
  const handleSignIn = () => navigate("/login");

  

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <div className="landing-brand">
            <span className="landing-logo">🎓</span>
            <strong>GenTutor</strong>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <button className="btn-outline" onClick={handleSignIn}>Login</button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Learn Smarter, Not Harder
          </h1>
          <p className="hero-subtitle">
            Personalized learning paths powered by AI. Master new skills at your own pace with adaptive content tailored just for you.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started Free
            </button>
            <button className="btn-secondary">
              Watch Demo
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Active Learners</div>
            </div>
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <h2 className="section-title">Why Choose GenTutor?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Learning</h3>
            <p>AI-powered recommendations based on your goals, pace, and learning style.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Visual dashboards to monitor your learning journey and celebrate milestones.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Learn at Your Pace</h3>
            <p>Flexible schedules and adaptive content that fits your lifestyle.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Earn Certificates</h3>
            <p>Get recognized for your achievements with industry-valued certifications.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Community Support</h3>
            <p>Connect with fellow learners and expert mentors in our vibrant community.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Practical Projects</h3>
            <p>Learn by doing with hands-on projects and real-world applications.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Your Profile</h3>
            <p>Tell us about your goals and current skill level</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Get Your Path</h3>
            <p>Receive a personalized learning roadmap</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Start Learning</h3>
            <p>Progress through courses at your own pace</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Achieve Goals</h3>
            <p>Master skills and earn certificates</p>
          </div>
        </div>
      </section>

      

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="landing-logo">🎓</span>
            <strong>GenTutor</strong>
            <p>Empowering learners worldwide</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#courses">Courses</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
              <a href="#terms">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 GenTutor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}