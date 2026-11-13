import React, { useState, useEffect } from 'react';
import { API_BASE, apiRequest, TMDB_IMG } from '../../services/api';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  'linear-gradient(135deg, #14b8a6, #0284c7)'
];

function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export default function CommunityTab({
  followingList,
  currentUserId,
  onFollowUser,
  onUnfollowUser
}) {
  const [communityTab, setCommunityTab] = useState('all'); // 'all' | 'following'
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Public watchlist preview modal
  const [previewUser, setPreviewUser] = useState(null);
  const [userPublicLists, setUserPublicLists] = useState([]);
  const [loadingPublicLists, setLoadingPublicLists] = useState(false);

  // Load all registered community members
  const loadCommunityUsers = () => {
    setLoadingUsers(true);
    apiRequest(`${API_BASE}/users`)
      .then((data) => {
        if (Array.isArray(data)) {
          setAllUsers(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load community users:', err);
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  };

  useEffect(() => {
    loadCommunityUsers();
  }, []);

  const handleOpenUserPublicLists = async (user) => {
    setPreviewUser(user);
    setLoadingPublicLists(true);
    setUserPublicLists([]);
    try {
      const lists = await apiRequest(`${API_BASE}/watchlists/user/${user.id}/public`);
      setUserPublicLists(Array.isArray(lists) ? lists : []);
    } catch (err) {
      console.error('Error fetching public watchlists:', err);
      setUserPublicLists([]);
    } finally {
      setLoadingPublicLists(false);
    }
  };

  // Set of following user IDs
  const followingIds = new Set(
    followingList.map((f) => Number(f.following?.id || f.following || f.followingId))
  );

  // Filtered lists
  const filteredUsers = allUsers.filter((u) => {
    const q = searchMemberQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      String(u.id) === q
    );
  });

  const followingUsers = followingList.map((f) => {
    if (f.following && f.following.username) {
      return { ...f.following, followCreatedAt: f.createdAt };
    }
    const targetId = f.following?.id || f.following || f.followingId;
    const found = allUsers.find((u) => u.id === Number(targetId));
    if (found) return { ...found, followCreatedAt: f.createdAt };
    return {
      id: targetId || f.id,
      username: `User #${targetId || f.id}`,
      email: '',
      followCreatedAt: f.createdAt
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Community Spotlight Banner */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div className="card-header-flex">
          <div>
            <div className="badge-pill badge-movie" style={{ marginBottom: '8px' }}>
              🌐 CineTrack Social Directory
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
              Registered Community Cinephiles
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
              Browse all members registered on the platform, view their public movie watchlists, and follow your favorite film critics.
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadCommunityUsers}
            disabled={loadingUsers}
            style={{ alignSelf: 'flex-start' }}
          >
            {loadingUsers ? 'Refreshing...' : '🔄 Refresh Directory'}
          </button>
        </div>

        {/* Directory Search & Filter Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px'
          }}
        >
          <div className="admin-subtabs-bar" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <button
              className={`admin-subtab-btn ${communityTab === 'all' ? 'active' : ''}`}
              onClick={() => setCommunityTab('all')}
            >
              <span>🌟</span> All Registered Members ({allUsers.length})
            </button>
            <button
              className={`admin-subtab-btn ${communityTab === 'following' ? 'active' : ''}`}
              onClick={() => setCommunityTab('following')}
            >
              <span>✨</span> People You Follow ({followingList.length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search cinephile by name or email..."
            value={searchMemberQuery}
            onChange={(e) => setSearchMemberQuery(e.target.value)}
            style={{ maxWidth: '300px', marginBottom: 0 }}
          />
        </div>
      </div>

      {/* ================= VIEW 1: ALL REGISTERED MEMBERS ================= */}
      {communityTab === 'all' && (
        <div>
          {loadingUsers ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">⏳</div>
              <p>Loading registered members from database...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">🔍</div>
              <p>No registered members found matching "{searchMemberQuery}".</p>
            </div>
          ) : (
            <div className="members-grid">
              {filteredUsers.map((user) => {
                const isSelf = user.id === Number(currentUserId);
                const isFollowed = followingIds.has(user.id);
                const initial = user.username ? user.username.charAt(0).toUpperCase() : '👤';
                const gradient = getAvatarGradient(user.username || '');

                return (
                  <div key={user.id} className={`member-card ${isSelf ? 'is-self' : ''}`}>
                    <div>
                      <div className="member-card-header">
                        <div className="member-avatar" style={{ background: gradient }}>
                          {initial}
                        </div>

                        <div>
                          <div className="member-info-title">
                            <span className="member-username">{user.username}</span>
                            {isSelf && (
                              <span className="badge-pill" style={{ background: 'var(--accent-indigo)', color: '#fff', fontSize: '0.7rem' }}>
                                YOU
                              </span>
                            )}
                            {user.role === 'ROLE_ADMIN' && (
                              <span className="badge-pill badge-tv" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                👑 ADMIN
                              </span>
                            )}
                          </div>

                          <div className="member-email" title={user.email}>
                            {user.email || 'No public email'}
                          </div>

                          <div className="member-joined-tag" style={{ marginTop: '4px' }}>
                            <span>📅 Member #{user.id}</span>
                            <span>•</span>
                            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="member-actions-row">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: '0.82rem' }}
                        onClick={() => handleOpenUserPublicLists(user)}
                        title="View public collections created by this user"
                      >
                        📁 Collections
                      </button>

                      {!isSelf && (
                        isFollowed ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, fontSize: '0.82rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)' }}
                            onClick={() => onUnfollowUser(user.id)}
                            title="Click to unfollow"
                          >
                            ✓ Following
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, fontSize: '0.82rem' }}
                            onClick={() => onFollowUser(user.id)}
                          >
                            + Follow
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: PEOPLE YOU FOLLOW ================= */}
      {communityTab === 'following' && (
        <div className="glass-card">
          <h3 className="card-title">✨ People You Follow ({followingList.length})</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            List of members you are currently connected with.
          </p>

          {followingUsers.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">🌐</div>
              <p>You haven't followed any members yet. Click the "All Registered Members" tab to explore!</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => setCommunityTab('all')}
              >
                🌟 Browse All Registered Members
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {followingUsers.map((target) => {
                const initial = target.username ? target.username.charAt(0).toUpperCase() : '👤';
                const gradient = getAvatarGradient(target.username || '');

                return (
                  <div key={target.id} className="follow-user-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        className="user-avatar-circle"
                        style={{
                          background: gradient,
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          width: '42px',
                          height: '42px'
                        }}
                      >
                        {initial}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {target.username}
                          </strong>
                          {target.role === 'ROLE_ADMIN' && (
                            <span className="badge-pill badge-tv" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              👑 ADMIN
                            </span>
                          )}
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                            #{target.id}
                          </span>
                        </div>
                        {target.email && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {target.email}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                          Following since: {target.followCreatedAt ? new Date(target.followCreatedAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenUserPublicLists(target)}
                      >
                        📁 Collections
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => onUnfollowUser(target.id)}
                      >
                        Unfollow
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: PUBLIC COLLECTIONS PREVIEW ================= */}
      {previewUser && (
        <div className="public-list-modal-overlay" onClick={() => setPreviewUser(null)}>
          <div className="public-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-header-flex" style={{ marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
                  PUBLIC WATCHLISTS
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0' }}>
                  {previewUser.username}'s Cinema Collections
                </h3>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewUser(null)}
              >
                ✕ Close
              </button>
            </div>

            {loadingPublicLists ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                Loading public collections...
              </p>
            ) : userPublicLists.length === 0 ? (
              <div className="empty-placeholder" style={{ padding: '30px 10px' }}>
                <div className="empty-placeholder-icon">📭</div>
                <p>
                  <strong>{previewUser.username}</strong> hasn't shared any public watchlists yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {userPublicLists.map((list) => (
                  <div
                    key={list.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        🌐 {list.title}
                      </strong>
                      <span className="badge-pill badge-rating">
                        {list.items ? list.items.length : 0} items
                      </span>
                    </div>

                    {!list.items || list.items.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)', margin: 0 }}>
                        No movies added to this public collection yet.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                        {list.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              width: '100px',
                              flexShrink: 0,
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <img
                              src={
                                item.posterPath
                                  ? (item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}${item.posterPath}`)
                                  : 'https://via.placeholder.com/100x150/e2e8f0/0284c7?text=No+Poster'
                              }
                              alt={item.title}
                              style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '4px 6px' }}>
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={item.title}
                              >
                                {item.title}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
