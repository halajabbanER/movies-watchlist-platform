import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_BASE = 'http://localhost:8080/api';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

async function apiRequest(url, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });
    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMsg =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        (typeof data === 'string' && data.trim()) ||
        `Error ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('فشل الاتصال بالسيرفر: تأكد من تشغيل خادم Backend على http://localhost:8080');
    }
    throw err;
  }
}

function App() {
  const [userId, setUserId] = useState(1);
  const [activeTab, setActiveTab] = useState('watchlists'); // 'watchlists' | 'search' | 'reviews' | 'community'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Data states
  const [watchlists, setWatchlists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [followStats, setFollowStats] = useState({ followingCount: 0, followersCount: 0 });
  const [followingList, setFollowingList] = useState([]);
  const [toast, setToast] = useState(null);

  // Local Filter & Search in Watchlist
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // TMDB Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Forms
  const [newListTitle, setNewListTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);

  const [followTargetId, setFollowTargetId] = useState('');

  const [reviewForm, setReviewForm] = useState({
    tmdbId: '',
    mediaType: 'MOVIE',
    rating: 9,
    content: ''
  });

  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showRegister, setShowRegister] = useState(false);

  const notify = (msg, isError = false) => {
    const text = typeof msg === 'string' ? msg : (msg?.message || 'حدث خطأ غير متوقع');
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4500);
  };

  // Load User Data & Social Stats
  const loadUserData = async () => {
    try {
      const data = await apiRequest(`${API_BASE}/watchlists/user/${userId}`);
      const listArray = Array.isArray(data) ? data : [];
      setWatchlists(listArray);
      if (listArray.length > 0) {
        setSelectedList(listArray[0]);
      } else {
        setSelectedList(null);
        setItems([]);
      }

      // Reviews
      try {
        const revData = await apiRequest(`${API_BASE}/reviews/user/${userId}`);
        setReviews(Array.isArray(revData) ? revData : []);
      } catch {
        setReviews([]);
      }

      // Social / Follow Stats
      try {
        const stats = await apiRequest(`${API_BASE}/follows/${userId}/stats`);
        if (stats) setFollowStats(stats);

        const following = await apiRequest(`${API_BASE}/follows/${userId}/following`);
        if (Array.isArray(following)) setFollowingList(following);
      } catch {
        // ignore if not setup yet
      }
    } catch (err) {
      notify(err.message, true);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userId]);

  // Load items when selected watchlist changes
  useEffect(() => {
    if (!selectedList) return;
    apiRequest(`${API_BASE}/watchlist-items/watchlist/${selectedList.id}`)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        setItems([]);
        notify(err.message, true);
      });
  }, [selectedList]);

  // Filtered Items in current Watchlist
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSearch = !itemSearchQuery.trim() || item.title.toLowerCase().includes(itemSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, itemSearchQuery]);

  // Actions
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUserId(data.id);
      setShowRegister(false);
      setRegForm({ username: '', email: '', password: '' });
      notify(`Account created successfully! Welcome, ${data.username || data.id}`);
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.identifier,
          password: loginForm.password
        })
      });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setUserId(data.id);
      setShowRegister(false);
      setLoginForm({ identifier: '', password: '' });
      notify(`Welcome back, ${data.username || 'User #' + data.id}!`);
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      await apiRequest(`${API_BASE}/watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), title: newListTitle.trim(), isPublic })
      });
      setNewListTitle('');
      setShowNewListModal(false);
      notify('New collection created successfully!');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this entire watchlist?')) return;
    try {
      await apiRequest(`${API_BASE}/watchlists/${id}?userId=${userId}`, { method: 'DELETE' });
      notify('Watchlist deleted successfully');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await apiRequest(`${API_BASE}/watchlist-items/${itemId}?userId=${userId}`, { method: 'DELETE' });
      setItems(items.filter((item) => item.id !== itemId));
      notify('Movie removed from watchlist');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    try {
      const updated = await apiRequest(`${API_BASE}/watchlist-items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), status: newStatus })
      });
      setItems(items.map((it) => (it.id === itemId ? { ...it, status: updated.status } : it)));
      notify(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  // TMDB Search
  const handleSearchMovies = async (e, customQuery) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const results = await apiRequest(`${API_BASE}/tmdb/search?query=${encodeURIComponent(q)}`);
      const array = Array.isArray(results) ? results : [];
      setSearchResults(array);
      if (array.length === 0) {
        notify('No movies or series found matching your query.');
      }
    } catch (err) {
      notify(err.message, true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = async (movie, targetListId) => {
    const listId = targetListId || selectedList?.id;
    if (!listId) {
      notify('Please create or select a watchlist first!', true);
      return;
    }
    try {
      const data = await apiRequest(`${API_BASE}/watchlist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchlistId: Number(listId),
          userId: Number(userId),
          tmdbId: Number(movie.tmdbId),
          mediaType: movie.mediaType,
          title: movie.title,
          posterPath: movie.posterPath || null
        })
      });

      if (selectedList && selectedList.id === Number(listId)) {
        setItems([...items, data]);
      }
      notify(`Added "${movie.title}" to your watchlist!`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Review Actions
  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          tmdbId: Number(reviewForm.tmdbId),
          mediaType: reviewForm.mediaType,
          rating: Number(reviewForm.rating),
          content: reviewForm.content
        })
      });
      setReviews([data, ...reviews]);
      setReviewForm({ tmdbId: '', mediaType: 'MOVIE', rating: 9, content: '' });
      notify('Review published successfully!');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}?userId=${userId}`, { method: 'DELETE' });
      setReviews(reviews.filter((r) => r.id !== reviewId));
      notify('Review deleted');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleFlagReview = async (reviewId) => {
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}/flag`, { method: 'PATCH' });
      setReviews(reviews.map((r) => (r.id === reviewId ? { ...r, isFlagged: true } : r)));
      notify('Review flagged for community moderation.');
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Follow Action
  const handleFollowUser = async (e) => {
    e.preventDefault();
    if (!followTargetId || Number(followTargetId) === Number(userId)) {
      notify('Enter a valid User ID different from your own', true);
      return;
    }
    try {
      await apiRequest(`${API_BASE}/follows/${userId}/follow/${followTargetId}`, { method: 'POST' });
      setFollowTargetId('');
      notify(`You are now following user #${followTargetId}!`);
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleUnfollowUser = async (targetId) => {
    try {
      await apiRequest(`${API_BASE}/follows/${userId}/unfollow/${targetId}`, { method: 'DELETE' });
      notify(`Unfollowed user #${targetId}`);
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const ratingLabel = (val) => {
    if (val >= 10) return 'Masterpiece! 🏆';
    if (val >= 9) return 'Incredible! ⭐';
    if (val >= 7) return 'Great Movie 👍';
    if (val >= 5) return 'Average / Decent 🍿';
    return 'Disappointing 👎';
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-banner ${toast.isError ? 'error' : ''}`}>
          <span>{toast.isError ? '⚠️' : '✨'}</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{toast.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="header-nav">
        <div className="brand-wrapper" onClick={() => setActiveTab('watchlists')}>
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

          <div className="user-badge-pill">
            <span>👤 User ID:</span>
            <input
              type="number"
              min="1"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              title="Change User ID to switch profile"
            />
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowRegister(!showRegister)}
          >
            {showRegister ? '✕ Close' : '🔐 Sign In / Register'}
          </button>
        </div>
      </header>

      {/* Auth Card (Login & Register) */}
      {showRegister && (
        <div className="glass-card" style={{ animation: 'slideInUp 0.25s ease', maxWidth: '640px', margin: '0 auto 28px' }}>
          <div className="card-header-flex">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`chip-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`chip-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                Create Account
              </button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowRegister(false)}>✕</button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                placeholder="Email or Username"
                required
                value={loginForm.identifier}
                onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>
                Sign In with JWT
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                placeholder="Username"
                required
                value={regForm.username}
                onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email address"
                required
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                required
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
              />
              <button type="submit" className="btn btn-primary" style={{ height: '46px' }}>
                Create Account & Generate Token
              </button>
            </form>
          )}
        </div>
      )}

      {/* Hero Spotlight & Real Stats */}
      <div className="spotlight-banner">
        <div className="spotlight-info">
          <h1>Curate Your Cinema Universe</h1>
          <p>
            Build public and private watchlists, discover trending cinema powered by TMDB, track your watch progress, and review your favorite films.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-number">{watchlists.length}</div>
            <div className="stat-title">Watchlists</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{items.length}</div>
            <div className="stat-title">Current Items</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{reviews.length}</div>
            <div className="stat-title">Reviews</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{followStats.followingCount || 0}</div>
            <div className="stat-title">Following</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'watchlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlists')}
        >
          <span>📁</span> My Watchlists & Movies ({watchlists.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <span>🔍</span> Discover & Search TMDB
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <span>⭐</span> Reviews & Ratings ({reviews.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <span>👥</span> Community & Following ({followStats.followingCount || 0})
        </button>
      </nav>

      {/* ================= TAB 1: WATCHLISTS & MOVIES ================= */}
      {activeTab === 'watchlists' && (
        <div className="content-grid">
          {/* Left Column: Watchlist Selector */}
          <div>
            <div className="glass-card">
              <div className="card-header-flex">
                <h3 className="card-title">📁 Your Collections</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowNewListModal(!showNewListModal)}
                >
                  {showNewListModal ? '✕' : '+ New List'}
                </button>
              </div>

              {showNewListModal && (
                <form onSubmit={handleCreateList} style={{ marginBottom: '18px', animation: 'slideInUp 0.2s ease' }}>
                  <input
                    placeholder="Collection title (e.g. Must Watch 2026)..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    required
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      style={{ width: 'auto', marginBottom: 0 }}
                    />
                    Public collection (visible to other users)
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Save Collection
                  </button>
                </form>
              )}

              <div>
                {watchlists.length === 0 ? (
                  <div className="empty-placeholder">
                    <div className="empty-placeholder-icon">📭</div>
                    <p>No watchlists found for user #{userId}.</p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }} onClick={() => setShowNewListModal(true)}>
                      + Create First Watchlist
                    </button>
                  </div>
                ) : (
                  watchlists.map((list) => (
                    <div
                      key={list.id}
                      className={`watchlist-nav-item ${selectedList?.id === list.id ? 'active' : ''}`}
                      onClick={() => setSelectedList(list)}
                    >
                      <div>
                        <div className="watchlist-info-title">
                          <span>{list.isPublic ? '🌐' : '🔒'}</span>
                          <span>{list.title}</span>
                        </div>
                        <div className="watchlist-meta-tag">
                          <span>ID: #{list.id}</span>
                          <span>•</span>
                          <span>{list.isPublic ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDeleteList(list.id, e)}
                        title="Delete this collection"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick TMDB Search Banner */}
            <div className="glass-card">
              <h3 className="card-title">⚡ Quick Search</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Search TMDB catalog directly:
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setActiveTab('search');
                  handleSearchMovies(e);
                }}
                className="search-wrapper"
              >
                <input
                  placeholder="Movie or show title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Go
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Movies in Selected Watchlist */}
          <div>
            <div className="glass-card">
              <div className="card-header-flex">
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                    {selectedList ? selectedList.title : 'Select a Watchlist'}
                  </h2>
                  {selectedList && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Showing {displayedItems.length} of {items.length} titles
                    </p>
                  )}
                </div>

                {selectedList && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('search')}
                  >
                    + Find More on TMDB
                  </button>
                )}
              </div>

              {selectedList && (
                <>
                  {/* Status Filter Chips & In-list Search */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div className="filter-chips-bar" style={{ marginBottom: 0 }}>
                      {['ALL', 'PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED'].map((st) => (
                        <button
                          key={st}
                          className={`chip-btn ${statusFilter === st ? 'active' : ''}`}
                          onClick={() => setStatusFilter(st)}
                        >
                          {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>

                    <input
                      placeholder="Filter by title in list..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      style={{ maxWidth: '240px', padding: '6px 12px', fontSize: '0.85rem', marginBottom: 0 }}
                    />
                  </div>
                </>
              )}

              {!selectedList ? (
                <div className="empty-placeholder">
                  <div className="empty-placeholder-icon">📽️</div>
                  <p>Select a collection on the left or create a new one to view your saved movies.</p>
                </div>
              ) : displayedItems.length === 0 ? (
                <div className="empty-placeholder">
                  <div className="empty-placeholder-icon">🍿</div>
                  <p>
                    {items.length === 0
                      ? 'This collection is empty! Search and add movies from TMDB.'
                      : 'No movies match the selected status filter.'}
                  </p>
                  {items.length === 0 && (
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: '14px' }}
                      onClick={() => setActiveTab('search')}
                    >
                      🔍 Discover Movies on TMDB
                    </button>
                  )}
                </div>
              ) : (
                <div className="movies-grid-responsive">
                  {displayedItems.map((item) => (
                    <div key={item.id} className="movie-poster-card">
                      <div className="poster-frame">
                        <img
                          src={
                            item.posterPath
                              ? (item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}${item.posterPath}`)
                              : 'https://via.placeholder.com/300x450/e2e8f0/0284c7?text=No+Poster'
                          }
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="badge-overlay-top">
                          <span className={`badge-pill ${item.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`}>
                            {item.mediaType}
                          </span>
                          <span className="badge-pill badge-rating">
                            ★ #{item.tmdbId}
                          </span>
                        </div>
                      </div>

                      <div className="card-details-body">
                        <div>
                          <select
                            className="status-select-control"
                            value={item.status || 'PLAN_TO_WATCH'}
                            onChange={(e) => handleUpdateItemStatus(item.id, e.target.value)}
                            title="Update watch status"
                          >
                            <option value="PLAN_TO_WATCH">Plan to Watch</option>
                            <option value="WATCHING">Watching Now</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DROPPED">Dropped</option>
                          </select>

                          <h4 className="movie-card-title" title={item.title}>
                            {item.title}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => {
                              setReviewForm({
                                ...reviewForm,
                                tmdbId: String(item.tmdbId),
                                mediaType: item.mediaType
                              });
                              setActiveTab('reviews');
                              notify(`Reviewing "${item.title}"`);
                            }}
                          >
                            ✍ Review
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove from watchlist"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: EXPLORE & SEARCH TMDB ================= */}
      {activeTab === 'search' && (
        <div className="glass-card">
          <div className="card-header-flex">
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🔍 Explore Live TMDB Catalog</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Search millions of movies and series directly with live posters, synopsis, and ratings.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchMovies} className="search-wrapper">
            <input
              placeholder="Search by title (e.g. Interstellar, Oppenheimer, Succession, Dune, Gladiator)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={isSearching} style={{ minWidth: '130px' }}>
              {isSearching ? 'Searching...' : 'Search TMDB'}
            </button>
          </form>

          {/* Quick Trending Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: 700 }}>POPULAR SEARCHES:</span>
            {['Inception', 'Interstellar', 'Dune', 'Breaking Bad', 'The Dark Knight', 'Gladiator', 'Arcane', 'Severance'].map((item) => (
              <button
                key={item}
                type="button"
                className="chip-btn"
                onClick={(e) => {
                  setSearchQuery(item);
                  handleSearchMovies(e, item);
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Search Results */}
          {searchResults.length === 0 ? (
            <div className="empty-placeholder">
              <div className="empty-placeholder-icon">🎬</div>
              <p>Type any title above or click one of the popular search tags to explore titles.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                  Found <strong>{searchResults.length}</strong> matching titles
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchResults([])}
                >
                  Clear Results
                </button>
              </div>

              <div className="movies-grid-responsive">
                {searchResults.map((movie) => (
                  <div key={`${movie.mediaType}-${movie.tmdbId}`} className="movie-poster-card">
                    <div className="poster-frame">
                      <img
                        src={
                          movie.posterPath
                            ? (movie.posterPath.startsWith('http') ? movie.posterPath : `${TMDB_IMG}${movie.posterPath}`)
                            : 'https://via.placeholder.com/300x450/e2e8f0/0284c7?text=No+Poster'
                        }
                        alt={movie.title}
                        loading="lazy"
                      />
                      <div className="badge-overlay-top">
                        <span className={`badge-pill ${movie.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`}>
                          {movie.mediaType}
                        </span>
                        {movie.voteAverage ? (
                          <span className="badge-pill badge-rating">
                            ★ {Number(movie.voteAverage).toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="card-details-body">
                      <div>
                        <h4 className="movie-card-title" title={movie.title}>
                          {movie.title}
                        </h4>
                        <div className="movie-card-meta">
                          {movie.releaseDate ? movie.releaseDate.substring(0, 4) : 'Unknown Year'} • ID: #{movie.tmdbId}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        {watchlists.length > 0 ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAddFromSearch(movie)}
                          >
                            + Add to {selectedList ? `"${selectedList.title}"` : 'Watchlist'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', textAlign: 'center' }}>
                            Create a collection first
                          </span>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setReviewForm({
                              ...reviewForm,
                              tmdbId: String(movie.tmdbId),
                              mediaType: movie.mediaType
                            });
                            setActiveTab('reviews');
                            notify(`Selected "${movie.title}" for review!`);
                          }}
                        >
                          ✍ Write Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: REVIEWS & RATINGS ================= */}
      {activeTab === 'reviews' && (
        <div className="content-grid">
          {/* Write Review Form */}
          <div className="glass-card">
            <h3 className="card-title">✍ Write a Review</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Score out of 10 and write your review to share your thoughts.
            </p>

            <form onSubmit={handleAddReview}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>TMDB ID:</label>
              <input
                type="number"
                placeholder="TMDB ID (e.g. 27205)"
                required
                value={reviewForm.tmdbId}
                onChange={(e) => setReviewForm({ ...reviewForm, tmdbId: e.target.value })}
              />

              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>MEDIA TYPE:</label>
              <select
                value={reviewForm.mediaType}
                onChange={(e) => setReviewForm({ ...reviewForm, mediaType: e.target.value })}
              >
                <option value="MOVIE">MOVIE</option>
                <option value="TV">TV SERIES</option>
              </select>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCORE: ⭐ {reviewForm.rating} / 10</label>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                  {ratingLabel(reviewForm.rating)}
                </span>
              </div>
              <div className="stars-picker">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <span
                    key={star}
                    className={`star-choice ${star <= reviewForm.rating ? 'active' : ''}`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    title={`Rate ${star}/10`}
                  >
                    ★
                  </span>
                ))}
              </div>

              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>REVIEW CONTENT:</label>
              <textarea
                rows="4"
                placeholder="What did you think of the directing, acting, or story?..."
                required
                value={reviewForm.content}
                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              />

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Publish Review
              </button>
            </form>
          </div>

          {/* User Reviews Stream */}
          <div className="glass-card">
            <h3 className="card-title">⭐ Your Reviews Timeline ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <div className="empty-placeholder">
                <div className="empty-placeholder-icon">📝</div>
                <p>You haven't written any reviews yet. Share your rating on the left!</p>
              </div>
            ) : (
              <div>
                {reviews.map((rev) => (
                  <div key={rev.id} className="review-item-card">
                    <div className="review-card-header">
                      <div>
                        <span className={`badge-pill ${rev.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`} style={{ marginRight: '8px' }}>
                          {rev.mediaType}
                        </span>
                        <strong>TMDB Item #{rev.tmdbId}</strong>
                        {rev.isFlagged && (
                          <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                            [Flagged]
                          </span>
                        )}
                      </div>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: '1.05rem' }}>
                        ★ {rev.rating} / 10
                      </span>
                    </div>

                    <p className="review-text-content">{rev.content}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                      <span>Published: {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleFlagReview(rev.id)}
                          title="Flag this review"
                        >
                          🚩 Flag
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteReview(rev.id)}
                          title="Delete review"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: COMMUNITY & FOLLOWING ================= */}
      {activeTab === 'community' && (
        <div className="content-grid">
          {/* Follow Form */}
          <div className="glass-card">
            <h3 className="card-title">👥 Follow a Cinephile</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Connect with other movie enthusiasts on CineTrack using their User ID.
            </p>

            <form onSubmit={handleFollowUser}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>TARGET USER ID:</label>
              <input
                type="number"
                min="1"
                placeholder="Enter User ID (e.g. 2, 3...)"
                required
                value={followTargetId}
                onChange={(e) => setFollowTargetId(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                + Follow User
              </button>
            </form>
          </div>

          {/* Following List */}
          <div className="glass-card">
            <h3 className="card-title">✨ People You Follow ({followingList.length})</h3>
            {followingList.length === 0 ? (
              <div className="empty-placeholder">
                <div className="empty-placeholder-icon">🌐</div>
                <p>You aren't following anyone yet. Connect with a user on the left!</p>
              </div>
            ) : (
              <div>
                {followingList.map((f) => (
                  <div key={f.id} className="follow-user-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar-circle">
                        #{f.following ? f.following.id : f.id}
                      </div>
                      <div>
                        <strong>User #{f.following ? f.following.id : 'Member'}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                          Following since: {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUnfollowUser(f.following ? f.following.id : f.id)}
                    >
                      Unfollow
                    </button>
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
