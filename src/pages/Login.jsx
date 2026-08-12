import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, loginAsDemo, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleDemoLogin = (role = 'admin') => {
    loginAsDemo(role);
    navigate(from, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(messages[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card animate-slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <div>
            <h1>Danishgah</h1>
            <span>Institute Management System</span>
          </div>
        </div>

        {resetMode ? (
          /* Reset Password */
          <>
            <h2 className="login-title">Reset Password</h2>
            <p className="login-subtitle">
              {resetSent
                ? "✅ Reset link sent! Check your email inbox."
                : "Enter your email and we'll send a reset link."}
            </p>

            {!resetSent && (
              <form onSubmit={handleReset}>
                {error && (
                  <div className="form-error" style={{ marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="reset-email"
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            )}

            <button
              className="btn btn-ghost w-full mt-2"
              onClick={() => { setResetMode(false); setResetSent(false); setError(''); }}
            >
              ← Back to Login
            </button>
          </>
        ) : (
          /* Login Form */
          <>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to manage your institute</p>

            <form onSubmit={handleLogin}>
              {error && (
                <div className="form-error" style={{ marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(o => !o)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResetMode(true)} style={{ padding: '4px 0', color: 'var(--primary-400)' }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" id="login-submit-btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-secondary)', textAlign: 'center' }}>
              <span className="text-xs text-muted" style={{ display: 'block', marginBottom: 10 }}>QUICK PREVIEW MODE</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm w-full" onClick={() => handleDemoLogin('admin')}>
                  👑 Demo Admin
                </button>
                <button className="btn btn-secondary btn-sm w-full" onClick={() => handleDemoLogin('accountant')}>
                  💼 Demo Accountant
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
