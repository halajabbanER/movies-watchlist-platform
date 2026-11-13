import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const API_BASE = 'http://localhost:8080/api';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, options);
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
  const [activeTab, setActiveTab] = useState('watchlists'); // 'watchlists' | 'search' | 'reviews'

  // Data states
  const [watchlists, setWatchlists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [toast, setToast] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Forms
  const [newListTitle, setNewListTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);

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
  const [showRegister, setShowRegister] = useState(false);

  const notify = (msg, isError = false) => {
    const text = typeof msg === 'string' ? msg : (msg?.message || 'حدث خطأ غير متوقع');
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4500);
  };

  // Load User Data
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

      try {
        const revData = await apiRequest(`${API_BASE}/reviews/user/${userId}`);
        setReviews(Array.isArray(revData) ? revData : []);
      } catch {
        setReviews([]);
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

  // Actions
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      setUserId(data.id);
      setShowRegister(false);
      setRegForm({ username: '', email: '', password: '' });
      notify(`Account created successfully! Welcome, ID: ${data.id}`);
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
      notify('New watchlist created successfully!');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await apiRequest(`${API_BASE}/watchlists/${id}`, { method: 'DELETE' });
      notify('Watchlist deleted');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await apiRequest(`${API_BASE}/watchlist-items/${itemId}`, { method: 'DELETE' });
      setItems(items.filter((item) => item.id !== itemId));
      notify('Item removed from watchlist');
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
        notify('No movies or series found matching your search.');
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
      notify('Please select or create a watchlist first!', true);
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
      notify(`Added "${movie.title}" to watchlist!`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Review Submissions
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

  const totalSavedMovies = watchlists.reduce((acc, curr) => acc + (curr.items?.length || 0), items.length);

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-banner ${toast.isError ? 'error' : ''}`}>
          <span>{toast.isError ? '⚠️' : '✨'}</span>
          <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{toast.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="header-nav">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">🎬</div>
          <div>
            <div className="brand-title">CineTrack</div>
            <div className="brand-tagline">Movie & Series Watchlist Platform</div>
          </div>
        </div>

        <div className="nav-user-bar">
          <div className="user-badge-pill">
            <span style={{ color: '#94a3b8' }}>User ID:</span>
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
            {showRegister ? '✕ Close' : '+ New Account'}
          </button>
        </div>
      </header>

      {/* Registration Card Modal */}
      {showRegister && (
        <div className="glass-card" style={{ animation: 'slideInUp 0.25s ease' }}>
          <div className="card-header-flex">
            <h3 className="card-title">👤 Create New CineTrack Account</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowRegister(false)}>✕</button>
          </div>
          <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
              placeholder="Password"
              required
              value={regForm.password}
              onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
            />
            <button type="submit" className="btn btn-primary" style={{ height: '48px' }}>
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* Hero Stats Banner */}
      <div className="hero-banner">
        <div className="hero-text">
          <h1>Track, Discover & Review Cinema</h1>
          <p>
            Organize movies and shows into curated watchlists, discover top-rated titles powered by TMDB, and share your ratings.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-number">{watchlists.length}</div>
            <div className="stat-label">Watchlists</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{items.length}</div>
            <div className="stat-label">Active Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{reviews.length}</div>
            <div className="stat-label">Reviews</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'watchlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlists')}
        >
          <span>📁</span> My Watchlists & Movies
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
      </nav>

      {/* ================= TAB 1: WATCHLISTS & MOVIES ================= */}
      {activeTab === 'watchlists' && (
        <div className="content-grid">
          {/* Left Column: Watchlists Manager */}
          <div>
            <div className="glass-card">
              <div className="card-header-flex">
                <h3 className="card-title">📁 Your Collections</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowNewListModal(!showNewListModal)}
                >
                  {showNewListModal ? '✕' : '+ Create'}
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      style={{ width: 'auto', marginBottom: 0 }}
                    />
                    Public collection (visible to others)
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
                        title="Delete this watchlist"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick TMDB Search Widget */}
            <div className="glass-card">
              <h3 className="card-title">⚡ Quick Search</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Search TMDB and jump right to discovery:
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
                  placeholder="Movie or series name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Go
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Active Movies in Watchlist */}
          <div>
            <div className="glass-card">
              <div className="card-header-flex">
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    {selectedList ? selectedList.title : 'Select a Watchlist'}
                  </h2>
                  {selectedList && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {items.length} titles in this collection
                    </p>
                  )}
                </div>

                {selectedList && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('search')}
                  >
                    + Find Movies to Add
                  </button>
                )}
              </div>

              {!selectedList ? (
                <div className="empty-placeholder">
                  <div className="empty-placeholder-icon">📽️</div>
                  <p>Select a watchlist on the left or create a new one to view your saved movies.</p>
                </div>
              ) : items.length === 0 ? (
                <div className="empty-placeholder">
                  <div className="empty-placeholder-icon">🍿</div>
                  <p>This watchlist is empty! Search and add movies from TMDB.</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '14px' }}
                    onClick={() => setActiveTab('search')}
                  >
                    🔍 Discover Movies on TMDB
                  </button>
                </div>
              ) : (
                <div className="movies-grid-responsive">
                  {items.map((item) => (
                    <div key={item.id} className="movie-poster-card">
                      <div className="poster-frame">
                        <img
                          src={
                            item.posterPath
                              ? (item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}${item.posterPath}`)
                              : 'https://via.placeholder.com/300x450/151d30/38bdf8?text=No+Poster'
                          }
                          alt={item.title}
                          loading="lazy"
                        />
                        <div className="badge-overlay-top">
                          <span className={`badge-pill ${item.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`}>
                            {item.mediaType}
                          </span>
                          <span className="badge-pill badge-rating">
                            ★ TMDB #{item.tmdbId}
                          </span>
                        </div>
                      </div>

                      <div className="card-details-body">
                        <div>
                          <div className={`status-tag status-${item.status || 'PLAN_TO_WATCH'}`}>
                            {item.status ? item.status.replace(/_/g, ' ') : 'PLAN TO WATCH'}
                          </div>
                          <h4 className="movie-card-title" title={item.title}>
                            {item.title}
                          </h4>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
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
                              notify(`Writing review for "${item.title}"`);
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
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>🔍 Discover TMDB Catalog</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Search millions of movies and series directly with live metadata, ratings, and posters.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchMovies} className="search-wrapper">
            <input
              placeholder="Search by title (e.g. Interstellar, Oppenheimer, Succession, Dune)..."
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: 600 }}>TRENDING PICKS:</span>
            {['Inception', 'Interstellar', 'Dune', 'Breaking Bad', 'The Dark Knight', 'Gladiator', 'Arcane'].map((item) => (
              <button
                key={item}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
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
              <p>Type a movie or TV show title above to browse results and add them to your watchlist.</p>
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
                            : 'https://via.placeholder.com/300x450/151d30/38bdf8?text=No+Poster'
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
                          {movie.releaseDate ? movie.releaseDate.substring(0, 4) : 'Unknown Year'} • ID: {movie.tmdbId}
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
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)' }}>
                            Create a watchlist first
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
              Share your thoughts, score out of 10, and publish to your timeline.
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

              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                SCORE: ⭐ {reviewForm.rating} / 10
              </label>
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
                placeholder="What did you love or dislike about this movie?..."
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
            <h3 className="card-title">⭐ Your Reviews ({reviews.length})</h3>
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
                      </div>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: '1.05rem' }}>
                        ★ {rev.rating} / 10
                      </span>
                    </div>
                    <p className="review-text-content">{rev.content}</p>
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                      Published on: {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
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
