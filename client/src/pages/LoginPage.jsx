import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const COLLEGE_DOMAIN = 'kongu.edu';

// ─────────────────────────────────────────────
//  AuthForm — used for BOTH Login & Register
//  Demonstrates:
//  • useState  — all form field values (controlled inputs)
//  • useRef    — direct DOM focus on mount (uncontrolled DOM access)
//  • useEffect — auto-focus email field when form mounts
// ─────────────────────────────────────────────
function AuthForm({ role, mode, onSwitch, onLoginSuccess }) {
  const navigate = useNavigate();

  // ── CONTROLLED STATE ─────────────────────────────────────
  // Every input is a "controlled component" — React owns the value.
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [message, setMessage]   = useState({ text: '', type: '' });
  const [loading, setLoading]   = useState(false);
  const [remember, setRemember] = useState(false);
  // ─────────────────────────────────────────────────────────

  // ── UNCONTROLLED DOM ACCESS via useRef ───────────────────
  // We use a ref to directly focus the email input when the
  // form appears — without making it a controlled component.
  const emailRef = useRef(null);
  // ─────────────────────────────────────────────────────────

  // ── useEffect: auto-focus email on mount / mode change ───
  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
    // Reset form state when switching between login/register
    setName(''); setEmail(''); setPassword(''); setConfirm('');
    setErrors({}); setMessage({ text: '', type: '' }); setShowPass(false);
  }, [mode, role]);
  // ─────────────────────────────────────────────────────────

  const isCollegeEmail = (val) =>
    val.trim().toLowerCase().endsWith('@' + COLLEGE_DOMAIN);

  // ── Validate all fields ───────────────────────────────────
  function validate() {
    const e = {};
    if (mode === 'register' && !name.trim()) e.name = 'Please enter your full name.';
    if (!email)                  e.email = 'Please enter your college email.';
    else if (!isCollegeEmail(email)) e.email = `Only @${COLLEGE_DOMAIN} emails are allowed.`;
    if (!password)               e.password = 'Please enter a password.';
    else if (mode === 'register' && password.length < 6)
                                 e.password = 'Password must be at least 6 characters.';
    if (mode === 'register') {
      if (!confirm)              e.confirm = 'Please confirm your password.';
      else if (confirm !== password) e.confirm = 'Passwords do not match.';
    }
    return e;
  }

  // ── Handle form submit ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const endpoint = mode === 'login'
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';

      const body = mode === 'login'
        ? { email: email.trim().toLowerCase(), password, role }
        : { name: name.trim(), email: email.trim().toLowerCase(), password, role };

      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message || 'Something went wrong.', type: 'error' });
        return;
      }

      if (mode === 'register') {
        setMessage({ text: 'Account created! You can now sign in.', type: 'success' });
        setTimeout(() => onSwitch('login'), 1800);
      } else {
        // Save user to sessionStorage (and localStorage if "remember me")
        const userPayload = { name: data.user.name, email: data.user.email, role: data.user.role, token: data.token };
        sessionStorage.setItem('loggedInUser', JSON.stringify(userPayload));
        if (remember) localStorage.setItem('loggedInUser', JSON.stringify(userPayload));

        setMessage({ text: `Welcome, ${data.user.name}! Redirecting...`, type: 'success' });
        setTimeout(() => navigate(role === 'student' ? '/student' : '/faculty'), 1200);
      }
    } catch {
      setMessage({ text: 'Cannot reach server. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === 'register';
  const btnClass   = `submit-btn ${role}-btn`;

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2 className="panel-heading">
        {isRegister ? `${role === 'student' ? 'Student' : 'Faculty'} Registration` : `${role === 'student' ? 'Student' : 'Faculty'} Login`}
      </h2>
      <p className="panel-subtext">
        {isRegister ? 'Create your account using your college email' : 'Sign in with your college email'}
      </p>

      {/* Full Name — only in register mode */}
      {isRegister && (
        <div className="form-group">
          <label htmlFor="reg-name">Full Name</label>
          {/* CONTROLLED — value driven by useState */}
          <input
            id="reg-name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'error-field' : ''}
            autoComplete="name"
          />
          <span className="field-error">{errors.name || ''}</span>
        </div>
      )}

      {/* Email — CONTROLLED + UNCONTROLLED ref for focus */}
      <div className="form-group">
        <label htmlFor="auth-email">College Email</label>
        <input
          id="auth-email"
          ref={emailRef}          /* ← useRef: uncontrolled DOM access for focus */
          type="email"
          placeholder={`yourname@${COLLEGE_DOMAIN}`}
          value={email}           /* ← controlled: value from state */
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? 'error-field' : ''}
          autoComplete="email"
        />
        <span className="field-error">{errors.email || ''}</span>
      </div>

      {/* Password — CONTROLLED */}
      <div className="form-group">
        <label htmlFor="auth-password">Password</label>
        <div className="input-wrap">
          <input
            id="auth-password"
            type={showPass ? 'text' : 'password'}
            placeholder={isRegister ? 'Create a password' : 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'error-field' : ''}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <button type="button" className="show-hide-btn" onClick={() => setShowPass((p) => !p)}>
            {showPass ? 'Hide' : 'Show'}
          </button>
        </div>
        <span className="field-error">{errors.password || ''}</span>
      </div>

      {/* Confirm Password — only in register, CONTROLLED */}
      {isRegister && (
        <div className="form-group">
          <label htmlFor="auth-confirm">Confirm Password</label>
          <input
            id="auth-confirm"
            type="password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={errors.confirm ? 'error-field' : ''}
            autoComplete="new-password"
          />
          <span className="field-error">{errors.confirm || ''}</span>
        </div>
      )}

      {/* Remember me + Forgot — only in login mode */}
      {!isRegister && (
        <div className="form-options">
          <label className="remember-label">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <span className="forgot-link">Forgot password?</span>
        </div>
      )}

      <button type="submit" className={btnClass} disabled={loading}>
        {loading ? 'Please wait...' : isRegister ? `Create ${role === 'student' ? 'Student' : 'Faculty'} Account` : `Sign In as ${role === 'student' ? 'Student' : 'Faculty'}`}
      </button>

      {message.text && (
        <p className={`form-msg ${message.type}`}>{message.text}</p>
      )}

      <p className="switch-text">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <button type="button" className="switch-link" onClick={() => onSwitch(isRegister ? 'login' : 'register')}>
          {isRegister ? 'Sign In' : 'Create Account'}
        </button>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────
//  LoginPage
//  • useState — active tab (student/faculty) and mode (login/register)
//  • useEffect — restore session if already logged in
// ─────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();

  // ── useState: which tab and which form mode ───────────────
  const [role, setRole] = useState('student');   // 'student' | 'faculty'
  const [mode, setMode] = useState('login');     // 'login'   | 'register'
  // ─────────────────────────────────────────────────────────

  // ── useEffect: redirect if already logged in ──────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');
    if (raw) {
      const u = JSON.parse(raw);
      // Put back into session in case it came from localStorage
      sessionStorage.setItem('loggedInUser', raw);
      navigate(u.role === 'student' ? '/student' : '/faculty', { replace: true });
    }
  }, [navigate]);
  // ─────────────────────────────────────────────────────────

  function switchTab(newRole) {
    setRole(newRole);
    setMode('login');
  }

  return (
    <div className="login-page">
      <div className="login-overlay" />
      <div className="login-wrapper">

        {/* Brand */}
        <div className="college-brand">
          <h1 className="college-name">Kongu Engineering College</h1>
          <p className="portal-title">Lost &amp; Found Portal</p>
        </div>

        {/* Tab switcher — only visible in login mode */}
        {mode === 'login' && (
          <div className="tab-switcher" role="tablist">
            <button
              role="tab"
              className={`tab-btn ${role === 'student' ? 'active' : ''}`}
              onClick={() => switchTab('student')}
            >
              Student
            </button>
            <button
              role="tab"
              className={`tab-btn ${role === 'faculty' ? 'active faculty' : ''}`}
              onClick={() => switchTab('faculty')}
            >
              Faculty (Admin)
            </button>
          </div>
        )}

        {/* Login / Register card */}
        <div className="login-card">
          <AuthForm
            role={role}
            mode={mode}
            onSwitch={setMode}
          />
        </div>

        <p className="login-footer">
          &copy; 2026 Kongu Engineering College — Lost &amp; Found Portal
        </p>
      </div>
    </div>
  );
}
