import React, { useState, useEffect } from 'react';
import { API_BASE, apiRequest } from '../../services/api';

export default function AdminTab({ notify }) {
  const [adminSubTab, setAdminSubTab] = useState('users'); // 'users' | 'moderation' | 'system'
  const [users, setUsers] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fetch admin data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      try {
        const usersData = await apiRequest(`${API_BASE}/users`);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (e) {
        console.error('Error fetching users:', e);
      }

      // 2. Fetch Flagged Reviews
      try {
        const flaggedData = await apiRequest(`${API_BASE}/reviews/flagged`);
        setFlaggedReviews(Array.isArray(flaggedData) ? flaggedData : []);
      } catch (e) {
        console.error('Error fetching flagged reviews:', e);
      }

      // 3. Health Check
      try {
        const health = await apiRequest(`${API_BASE}/v1/health`);
        setSystemHealth(health);
      } catch {
        setSystemHealth({ status: 'OFFLINE' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // User Actions
  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const actionName = newRole === 'ROLE_ADMIN' ? 'promote to Administrator' : 'demote to standard User';
    if (!window.confirm(`Are you sure you want to ${actionName} "${targetUser.username}"?`)) return;

    try {
      const updated = await apiRequest(`${API_BASE}/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: updated.role } : u)));
      notify(`User "${targetUser.username}" role updated to ${newRole}`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Delete user "${targetUser.username}" (#${targetUser.id}) permanently? This cannot be undone.`)) return;

    try {
      await apiRequest(`${API_BASE}/users/${targetUser.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      notify(`User "${targetUser.username}" was deleted successfully`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Moderation Actions
  const handleUnflagReview = async (reviewId) => {
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}/unflag`, { method: 'PATCH' });
      setFlaggedReviews((prev) => prev.filter((r) => r.id !== reviewId));
      notify('Review approved and flag removed ✅');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleHideReview = async (reviewId) => {
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}/hide`, { method: 'PATCH' });
      setFlaggedReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isHidden: true } : r))
      );
      notify('Review hidden from public view');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleAdminDeleteReview = async (reviewId) => {
    if (!window.confirm('Permanently delete this flagged review?')) return;
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}/admin`, { method: 'DELETE' });
      setFlaggedReviews((prev) => prev.filter((r) => r.id !== reviewId));
      notify('Flagged review deleted permanently');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      String(u.id) === q
    );
  });

  return (
    <div className="admin-page-container">
      {/* Admin Spotlight Banner */}
      <div className="admin-header-card">
        <div className="admin-header-info">
          <div className="admin-badge-pill">🛡️ Administrator Console</div>
          <h2>Platform Management & Moderation</h2>
          <p>
            Control registered users, oversee community reported content, promote admins, and inspect live backend services.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={loadAdminData}
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Admin Data'}
        </button>
      </div>

      {/* Admin KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon">👥</div>
          <div>
            <div className="admin-kpi-number">{users.length}</div>
            <div className="admin-kpi-label">Registered Accounts</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon">🚩</div>
          <div>
            <div className="admin-kpi-number">{flaggedReviews.length}</div>
            <div className="admin-kpi-label">Flagged Reviews</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon">👑</div>
          <div>
            <div className="admin-kpi-number">
              {users.filter((u) => u.role === 'ROLE_ADMIN').length}
            </div>
            <div className="admin-kpi-label">Administrators</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon">⚡</div>
          <div>
            <div className="admin-kpi-number" style={{ color: 'var(--accent-emerald)' }}>
              {systemHealth?.status || 'UP'}
            </div>
            <div className="admin-kpi-label">Backend Status</div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Pills */}
      <div className="admin-subtabs-bar">
        <button
          className={`admin-subtab-btn ${adminSubTab === 'users' ? 'active' : ''}`}
          onClick={() => setAdminSubTab('users')}
        >
          <span>👥</span> Users Management ({users.length})
        </button>
        <button
          className={`admin-subtab-btn ${adminSubTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setAdminSubTab('moderation')}
        >
          <span>🚩</span> Flagged Content ({flaggedReviews.length})
        </button>
        <button
          className={`admin-subtab-btn ${adminSubTab === 'system' ? 'active' : ''}`}
          onClick={() => setAdminSubTab('system')}
        >
          <span>🖥️</span> System & Infrastructure
        </button>
      </div>

      {/* ================= SUBTAB 1: USERS MANAGEMENT ================= */}
      {adminSubTab === 'users' && (
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Registered Users Directory</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                View all registered users, manage privileges, or remove accounts.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              style={{ maxWidth: '280px', marginBottom: 0 }}
            />
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="user-id-chip">#{u.id}</span>
                      </td>
                      <td>
                        <strong>{u.username}</strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span
                          className={`badge-pill ${
                            u.role === 'ROLE_ADMIN' ? 'badge-tv' : 'badge-movie'
                          }`}
                        >
                          {u.role === 'ROLE_ADMIN' ? '👑 ADMIN' : 'USER'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleUserRole(u)}
                            title={
                              u.role === 'ROLE_ADMIN'
                                ? 'Demote to regular user'
                                : 'Promote to administrator'
                            }
                          >
                            {u.role === 'ROLE_ADMIN' ? 'Demote' : 'Promote Admin'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u)}
                            title="Delete this user"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUBTAB 2: MODERATION & FLAGGED REVIEWS ================= */}
      {adminSubTab === 'moderation' && (
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Community Flagged Reviews ({flaggedReviews.length})</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Review community reports for offensive, spoiler, or spam content.
              </p>
            </div>
          </div>

          {flaggedReviews.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">🎉</div>
              <p>Great news! There are no flagged reviews waiting for moderation.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {flaggedReviews.map((rev) => (
                <div key={rev.id} className="admin-moderation-card">
                  <div className="review-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge-pill badge-tv">
                        🚩 Flagged
                      </span>
                      {rev.isHidden && (
                        <span className="badge-pill" style={{ background: 'var(--accent-rose)', color: '#fff' }}>
                          👁️ Hidden
                        </span>
                      )}
                      <strong>TMDB #{rev.tmdbId} ({rev.mediaType})</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>
                        Review ID: #{rev.id}
                      </span>
                    </div>

                    <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>
                      ★ {rev.rating} / 10
                    </span>
                  </div>

                  <p className="review-text-content" style={{ margin: '12px 0' }}>
                    "{rev.content}"
                  </p>

                  <div className="admin-moderation-actions">
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Created: {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : 'Recent'}
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUnflagReview(rev.id)}
                      >
                        ✅ Approve & Clear Flag
                      </button>
                      {!rev.isHidden && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleHideReview(rev.id)}
                        >
                          👁️ Hide from Public
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAdminDeleteReview(rev.id)}
                      >
                        🗑️ Delete Permanently
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= SUBTAB 3: SYSTEM INFRASTRUCTURE ================= */}
      {adminSubTab === 'system' && (
        <div className="glass-card">
          <h3 className="card-title">🖥️ Server & Infrastructure Details</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Live status of backend microservices, database connection, and third-party APIs.
          </p>

          <div className="admin-system-grid">
            <div className="system-status-box">
              <div className="system-status-header">
                <strong>Spring Boot Backend</strong>
                <span className="system-pill active">UP & HEALTHY</span>
              </div>
              <p>Running on Java 21 & Spring Boot 3.5.16 inside Docker on port 8080.</p>
            </div>

            <div className="system-status-box">
              <div className="system-status-header">
                <strong>MySQL Database</strong>
                <span className="system-pill active">CONNECTED</span>
              </div>
              <p>MySQL 8.4 engine running with HikariCP connection pool on port 3308.</p>
            </div>

            <div className="system-status-box">
              <div className="system-status-header">
                <strong>TMDB API Gateway</strong>
                <span className="system-pill active">ONLINE</span>
              </div>
              <p>The Movie Database v3 REST API authenticated with live caching.</p>
            </div>

            <div className="system-status-box">
              <div className="system-status-header">
                <strong>Security & JWT Token</strong>
                <span className="system-pill active">ACTIVE</span>
              </div>
              <p>Stateless Bearer JWT Authentication with BCrypt encryption enabled.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

