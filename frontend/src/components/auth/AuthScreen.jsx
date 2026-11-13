import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../layout/Navbar';
import Toast from '../common/Toast';

export default function AuthScreen({ theme, toggleTheme, toast, notify }) {
  const { login, register, authError, setAuthError, isSubmittingAuth } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(loginForm.identifier, loginForm.password);
      notify(`Welcome back, ${user.username}!`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(regForm.username, regForm.email, regForm.password);
      notify(`Account created successfully! Welcome, ${user.username}`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  return (
    <div className="app-container">
      <Toast toast={toast} />
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <div className="auth-hero-container">
        <div className="auth-card-container">
          <div className="auth-header text-center">
            <div className="auth-header-icon">
              <i className="bi bi-film fs-1 text-primary"></i>
            </div>
            <h2>{authMode === 'login' ? 'Sign In to CineTrack' : 'Create an Account'}</h2>
            <p>
              {authMode === 'login'
                ? 'Access your private watchlists, track your movies & series, and connect with the community.'
                : 'Join CineTrack to build custom watchlists, discover trending cinema, and rate films.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
            >
              <i className="bi bi-person-plus-fill me-1"></i> Register New
            </button>
          </div>

          {authError && (
            <div className="auth-error-banner alert alert-danger d-flex align-items-center gap-2 p-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{authError}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="auth-field">
                <label className="form-label mb-1">Email Address or Username</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. user@example.com or username"
                    required
                    autoFocus
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="form-label mb-1">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter your secret password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary auth-submit-btn w-100"
              >
                <i className="bi bi-box-arrow-in-right me-1"></i>
                {isSubmittingAuth ? 'Signing In...' : 'Sign In with JWT'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="auth-field">
                <label className="form-label mb-1">Username</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Choose a unique username"
                    required
                    autoFocus
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="form-label mb-1">Email Address</label>
                <div className="auth-input-wrapper">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="form-label mb-1">Password (min 6 chars)</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="btn btn-primary auth-submit-btn w-100"
              >
                <i className="bi bi-person-check-fill me-1"></i>
                {isSubmittingAuth ? 'Creating Account...' : 'Create Account & Sign In'}
              </button>
            </form>
          )}

          <div className="auth-footer-help">
            <div className="auth-feature-pill">
              <i className="bi bi-shield-lock-fill text-primary"></i>
              <span>JWT Token & User Profile stored securely in localStorage</span>
            </div>
            <div className="auth-feature-pill">
              <i className="bi bi-patch-check-fill text-success"></i>
              <span>Automatic Bearer token Authorization on all API requests</span>
            </div>
            <div className="auth-feature-pill">
              <i className="bi bi-camera-reels-fill text-info"></i>
              <span>Personal watchlists, TMDB discovery, reviews & community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
