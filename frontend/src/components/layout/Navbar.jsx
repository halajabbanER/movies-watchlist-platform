import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ theme, toggleTheme, onBrandClick }) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="header-nav">
      <div className="brand-wrapper" onClick={onBrandClick} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-icon">
          <i className="bi bi-camera-reels-fill text-primary fs-3"></i>
        </div>
        <div>
          <div className="brand-title">CineTrack Platform</div>
          <div className="brand-tagline">Movie & Series Watchlist Hub</div>
        </div>
      </div>

      <div className="nav-user-bar">
        <button
          type="button"
          className="theme-toggle-btn d-flex align-items-center gap-1"
          onClick={toggleTheme}
          title="Toggle Light / Dark mode"
        >
          {theme === 'light' ? (
            <>
              <i className="bi bi-moon-stars-fill"></i>
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <i className="bi bi-sun-fill text-warning"></i>
              <span>Light Mode</span>
            </>
          )}
        </button>

        {currentUser && (
          <>
            <div className="user-profile-badge d-flex align-items-center">
              <span className="user-avatar-badge">
                <i className="bi bi-person-circle fs-5"></i>
              </span>
              <div className="user-meta">
                <span className="user-name">{currentUser.username}</span>
                <span className="user-role badge bg-primary-subtle text-primary border border-primary-subtle">
                  {currentUser.role === 'ROLE_ADMIN' ? '👑 ADMIN' : 'USER'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm btn-logout d-flex align-items-center gap-1"
              onClick={logout}
              title="Sign out of your account"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
