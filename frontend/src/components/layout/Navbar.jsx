import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ theme, toggleTheme, onBrandClick }) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="header-nav">
      <div className="brand-wrapper" onClick={onBrandClick} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-icon">🎬</div>
        <div>
          <div className="brand-title">CineTrack Platform</div>
          <div className="brand-tagline">Movie & Series Watchlist Hub</div>
        </div>
      </div>

      <div className="nav-user-bar">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle Light / Dark mode"
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>

        {currentUser && (
          <>
            <div className="user-profile-badge">
              <span className="user-avatar-badge">👤</span>
              <div className="user-meta">
                <span className="user-name">{currentUser.username}</span>
                <span className="user-role">{currentUser.role || 'ROLE_USER'}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm btn-logout"
              onClick={logout}
              title="Sign out of your account"
            >
              🚪 Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

