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
  const [communityTab, setCommunityTab] = useState('all'); // 'all' | 'following' | 'publicLists'
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Global public watchlists
  const [globalPublicLists, setGlobalPublicLists] = useState([]);
  const [loadingGlobalLists, setLoadingGlobalLists] = useState(false);

  // User Profile & Social Modal state
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [profileModalTab, setProfileModalTab] = useState('watchlists'); // 'watchlists' | 'reviews'
  const [userPublicLists, setUserPublicLists] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userFollowStats, setUserFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loadingProfileData, setLoadingProfileData] = useState(false);

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

  // Load global public watchlists
  const loadGlobalPublicLists = () => {
    setLoadingGlobalLists(true);
    apiRequest(`${API_BASE}/watchlists/public`)
      .then((data) => {
        if (Array.isArray(data)) {
          setGlobalPublicLists(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load public watchlists:', err);
      })
      .finally(() => {
        setLoadingGlobalLists(false);
      });
  };

  useEffect(() => {
    loadCommunityUsers();
    loadGlobalPublicLists();
  }, []);

  // Open Full User Profile & Social Modal
  const handleOpenUserProfile = async (user, initialTab = 'watchlists') => {
    setProfileModalUser(user);
    setProfileModalTab(initialTab);
    setLoadingProfileData(true);
    setUserPublicLists([]);
    setUserReviews([]);
    setUserFollowStats({ followersCount: 0, followingCount: 0 });

    try {
      // 1. Fetch public watchlists
      const listsPromise = apiRequest(`${API_BASE}/watchlists/user/${user.id}/public`).catch(() => []);
      // 2. Fetch user reviews
      const reviewsPromise = apiRequest(`${API_BASE}/reviews/user/${user.id}`).catch(() => []);
      // 3. Fetch follow stats
      const statsPromise = apiRequest(`${API_BASE}/follows/${user.id}/stats`).catch(() => ({}));

      const [lists, revs, stats] = await Promise.all([listsPromise, reviewsPromise, statsPromise]);
      setUserPublicLists(Array.isArray(lists) ? lists : []);
      setUserReviews(Array.isArray(revs) ? revs : []);
      if (stats && (stats.followersCount !== undefined || stats.followingCount !== undefined)) {
        setUserFollowStats(stats);
      }
    } catch (err) {
      console.error('Error fetching user profile data:', err);
    } finally {
      setLoadingProfileData(false);
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
            <div className="badge-pill badge-movie mb-2">
              <i className="bi bi-people-fill me-1"></i> CineTrack Social Network
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '6px' }}>
              Explore Cinephiles & Public Collections
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
              Follow friends, browse their public movie watchlists, read their reviews, and discover trending collections across the community.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => {
                loadCommunityUsers();
                loadGlobalPublicLists();
              }}
              disabled={loadingUsers || loadingGlobalLists}
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>{loadingUsers ? 'Refreshing...' : 'Refresh Feed'}</span>
            </button>
          </div>
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
              <i className="bi bi-person-lines-fill me-1"></i>
              <span>All Cinephiles ({allUsers.length})</span>
            </button>
            <button
              className={`admin-subtab-btn ${communityTab === 'following' ? 'active' : ''}`}
              onClick={() => setCommunityTab('following')}
            >
              <i className="bi bi-person-check-fill me-1"></i>
              <span>Friends & Following ({followingList.length})</span>
            </button>
            <button
              className={`admin-subtab-btn ${communityTab === 'publicLists' ? 'active' : ''}`}
              onClick={() => setCommunityTab('publicLists')}
            >
              <i className="bi bi-collection-play-fill me-1"></i>
              <span>Public Watchlists ({globalPublicLists.length})</span>
            </button>
          </div>

          {communityTab !== 'publicLists' && (
            <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
              <input
                type="text"
                placeholder="Search cinephile by name or email..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= TAB 1: ALL COMMUNITY CINEPHILES ================= */}
      {communityTab === 'all' && (
        <div>
          {loadingUsers ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">⏳</div>
              <p>Loading community members...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">🔍</div>
              <p>No cinephiles found matching "{searchMemberQuery}".</p>
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
                              <span className="badge-pill" style={{ background: 'var(--accent-indigo)', color: '#fff', fontSize: '0.68rem' }}>
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
                            <i className="bi bi-calendar3"></i>
                            <span>Member #{user.id}</span>
                            <span>•</span>
                            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="member-actions-row">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center gap-1"
                        style={{ flex: 1, fontSize: '0.82rem' }}
                        onClick={() => handleOpenUserProfile(user, 'watchlists')}
                        title="View public collections & reviews"
                      >
                        <i className="bi bi-collection-play"></i>
                        <span>Profile & Lists</span>
                      </button>

                      {!isSelf && (
                        isFollowed ? (
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center gap-1"
                            style={{ flex: 1, fontSize: '0.82rem' }}
                            onClick={() => onUnfollowUser(user.id)}
                            title="Click to unfollow"
                          >
                            <i className="bi bi-check2"></i>
                            <span>Following</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-1"
                            style={{ flex: 1, fontSize: '0.82rem' }}
                            onClick={() => onFollowUser(user.id)}
                          >
                            <i className="bi bi-person-plus-fill"></i>
                            <span>Follow</span>
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

      {/* ================= TAB 2: FOLLOWING & FRIENDS FEED ================= */}
      {communityTab === 'following' && (
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">✨ People You Follow ({followingList.length})</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Your personal cinephile network. Inspect their public collections and movie critiques.
              </p>
            </div>
          </div>

          {followingUsers.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">🌐</div>
              <p>You haven't followed any friends yet. Explore members to start following!</p>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={() => setCommunityTab('all')}
              >
                <i className="bi bi-people-fill me-1"></i> Browse Community Cinephiles
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                          width: '44px',
                          height: '44px'
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
                          Connected since: {target.followCreatedAt ? new Date(target.followCreatedAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        onClick={() => handleOpenUserProfile(target, 'watchlists')}
                        title="View their watchlists"
                      >
                        <i className="bi bi-collection-play"></i>
                        <span>Watchlists</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 text-dark"
                        onClick={() => handleOpenUserProfile(target, 'reviews')}
                        title="View their reviews"
                      >
                        <i className="bi bi-star-fill text-warning"></i>
                        <span>Reviews</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                        onClick={() => onUnfollowUser(target.id)}
                        title="Unfollow this user"
                      >
                        <i className="bi bi-person-x"></i>
                        <span>Unfollow</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: GLOBAL PUBLIC WATCHLISTS ================= */}
      {communityTab === 'publicLists' && (
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">🌐 Community Public Watchlists ({globalPublicLists.length})</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Explore shared movie collections curated and published by cinephiles across the platform.
              </p>
            </div>
          </div>

          {loadingGlobalLists ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">⏳</div>
              <p>Loading community watchlists...</p>
            </div>
          ) : globalPublicLists.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">📽️</div>
              <p>No public watchlists published yet. Create a public collection to be featured here!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {globalPublicLists.map((list) => (
                <div
                  key={list.id}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    transition: 'border-color 0.2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                          🌐 {list.title}
                        </strong>
                        <span className="badge-pill badge-rating">
                          {list.items ? list.items.length : 0} titles
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '3px' }}>
                        Created: {list.createdAt ? new Date(list.createdAt).toLocaleDateString() : 'Recent'} • Collection #{list.id}
                      </div>
                    </div>
                  </div>

                  {!list.items || list.items.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-faint)', margin: 0 }}>
                      No movies added to this public collection yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                      {list.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            width: '110px',
                            flexShrink: 0,
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <img
                            src={
                              item.posterPath
                                ? (item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}${item.posterPath}`)
                                : 'https://via.placeholder.com/110x165/e2e8f0/0284c7?text=No+Poster'
                            }
                            alt={item.title}
                            style={{ width: '100%', height: '155px', objectFit: 'cover' }}
                            loading="lazy"
                          />
                          <div style={{ padding: '6px 8px' }}>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: 'var(--text-main)'
                              }}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <span className={`badge-pill ${item.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`} style={{ fontSize: '0.62rem', padding: '1px 5px', marginTop: '2px' }}>
                              {item.mediaType}
                            </span>
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
      )}

      {/* ================= MODAL: CINEPHILE PROFILE & SOCIAL DIALOG ================= */}
      {profileModalUser && (
        <div className="public-list-modal-overlay" onClick={() => setProfileModalUser(null)}>
          <div className="public-list-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  className="member-avatar"
                  style={{
                    background: getAvatarGradient(profileModalUser.username || ''),
                    width: '54px',
                    height: '54px',
                    fontSize: '1.4rem'
                  }}
                >
                  {profileModalUser.username ? profileModalUser.username.charAt(0).toUpperCase() : '👤'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      {profileModalUser.username}
                    </h3>
                    {profileModalUser.role === 'ROLE_ADMIN' && (
                      <span className="badge-pill badge-tv" style={{ fontSize: '0.7rem' }}>
                        👑 ADMIN
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {profileModalUser.email || `Member ID #${profileModalUser.id}`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                    <strong>{userFollowStats.followersCount || 0}</strong> Followers • <strong>{userFollowStats.followingCount || 0}</strong> Following
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {profileModalUser.id !== Number(currentUserId) && (
                  followingIds.has(profileModalUser.id) ? (
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={() => onUnfollowUser(profileModalUser.id)}
                    >
                      ✓ Following
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onFollowUser(profileModalUser.id)}
                    >
                      + Follow
                    </button>
                  )
                )}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setProfileModalUser(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Subtabs: Watchlists vs Reviews */}
            <div className="admin-subtabs-bar mb-3" style={{ borderBottom: 'none' }}>
              <button
                className={`admin-subtab-btn ${profileModalTab === 'watchlists' ? 'active' : ''}`}
                onClick={() => setProfileModalTab('watchlists')}
              >
                <i className="bi bi-collection-play-fill me-1"></i>
                <span>Public Watchlists ({userPublicLists.length})</span>
              </button>
              <button
                className={`admin-subtab-btn ${profileModalTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setProfileModalTab('reviews')}
              >
                <i className="bi bi-star-fill me-1"></i>
                <span>Reviews & Ratings ({userReviews.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            {loadingProfileData ? (
              <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Loading {profileModalUser.username}'s profile data...
              </p>
            ) : profileModalTab === 'watchlists' ? (
              userPublicLists.length === 0 ? (
                <div className="empty-placeholder" style={{ padding: '30px 10px' }}>
                  <div className="empty-placeholder-icon">📭</div>
                  <p><strong>{profileModalUser.username}</strong> hasn't shared any public watchlists yet.</p>
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
              )
            ) : (
              /* Reviews Subtab */
              userReviews.length === 0 ? (
                <div className="empty-placeholder" style={{ padding: '30px 10px' }}>
                  <div className="empty-placeholder-icon">📝</div>
                  <p><strong>{profileModalUser.username}</strong> hasn't published any movie reviews yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userReviews.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge-pill ${rev.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`}>
                            {rev.mediaType}
                          </span>
                          <strong>TMDB #{rev.tmdbId}</strong>
                        </div>
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>
                          ★ {rev.rating} / 10
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '6px 0 10px', lineHeight: 1.4 }}>
                        "{rev.content}"
                      </p>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-faint)' }}>
                        Reviewed: {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
