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
  const [watchlists, setWatchlists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState(null);

  const [newListTitle, setNewListTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [movieForm, setMovieForm] = useState({
    tmdbId: '',
    mediaType: 'MOVIE',
    title: '',
    posterPath: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 5000);
  };

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

  useEffect(() => {
    if (!selectedList) return;
    apiRequest(`${API_BASE}/watchlist-items/watchlist/${selectedList.id}`)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        setItems([]);
        notify(err.message, true);
      });
  }, [selectedList]);

  const handleSearchMovies = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await apiRequest(`${API_BASE}/tmdb/search?query=${encodeURIComponent(searchQuery.trim())}`);
      const array = Array.isArray(results) ? results : [];
      setSearchResults(array);
      if (array.length === 0) {
        notify('No movies or shows found matching your query.');
      }
    } catch (err) {
      notify(err.message, true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = async (movie) => {
    if (!selectedList) {
      notify('Please select or create a watchlist first!', true);
      return;
    }
    try {
      const data = await apiRequest(`${API_BASE}/watchlist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchlistId: selectedList.id,
          userId: Number(userId),
          tmdbId: Number(movie.tmdbId),
          mediaType: movie.mediaType,
          title: movie.title,
          posterPath: movie.posterPath || null
        })
      });
      setItems([...items, data]);
      notify(`Added "${movie.title}" to ${selectedList.title}!`);
    } catch (err) {
      notify(err.message, true);
    }
  };

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
      notify(`Account created successfully! User ID: ${data.id}`);
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
        body: JSON.stringify({ userId: Number(userId), title: newListTitle, isPublic })
      });
      setNewListTitle('');
      notify('Watchlist created successfully');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteList = async (id, e) => {
    e.stopPropagation();
    try {
      await apiRequest(`${API_BASE}/watchlists/${id}`, { method: 'DELETE' });
      notify('Watchlist deleted');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    if (!selectedList) return notify('Please select a watchlist first', true);
    try {
      const data = await apiRequest(`${API_BASE}/watchlist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchlistId: selectedList.id,
          userId: Number(userId),
          tmdbId: Number(movieForm.tmdbId),
          mediaType: movieForm.mediaType,
          title: movieForm.title,
          posterPath: movieForm.posterPath || null
        })
      });
      setItems([...items, data]);
      setMovieForm({ tmdbId: '', mediaType: 'MOVIE', title: '', posterPath: '' });
      notify('Added to watchlist!');
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

  return (
    <div className="container">
      <header className="navbar">
        <div className="brand">🎬 Movies Watchlist</div>
        <div className="user-controls">
          <label>Current User ID:</label>
          <input
            type="number"
            min="1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: '80px', marginBottom: 0 }}
          />
          <button className="secondary" onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? 'Close' : '+ New Account'}
          </button>
        </div>
      </header>

      {message && (
        <div className={`alert ${message.isError ? 'error' : ''}`}>{message.text}</div>
      )}

      {showRegister && (
        <div className="card">
          <h3>Register New User</h3>
          <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <input
              placeholder="Username"
              required
              value={regForm.username}
              onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
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
            <button type="submit">Create Account</button>
          </form>
        </div>
      )}

      <div className="grid">
        <div>
          <div className="card">
            <h2>Watchlists</h2>
            <form onSubmit={handleCreateList}>
              <input
                placeholder="New watchlist title..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                required
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  style={{ width: 'auto', marginBottom: 0 }}
                />
                Public Watchlist
              </label>
              <button type="submit" style={{ width: '100%' }}>+ Create Watchlist</button>
            </form>

            <div style={{ marginTop: '16px' }}>
              {watchlists.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No watchlists found for this user.</p>
              ) : (
                watchlists.map((list) => (
                  <div
                    key={list.id}
                    className={`watchlist-item ${selectedList?.id === list.id ? 'active' : ''}`}
                    onClick={() => setSelectedList(list)}
                  >
                    <div>
                      <strong>{list.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {list.isPublic ? 'Public' : 'Private'} • ID: {list.id}
                      </div>
                    </div>
                    <button className="danger" onClick={(e) => handleDeleteList(list.id, e)}>Delete</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h2>Write a Review</h2>
            <form onSubmit={handleAddReview}>
              <input
                type="number"
                placeholder="TMDB ID (e.g., 157336)"
                required
                value={reviewForm.tmdbId}
                onChange={(e) => setReviewForm({ ...reviewForm, tmdbId: e.target.value })}
              />
              <select
                value={reviewForm.mediaType}
                onChange={(e) => setReviewForm({ ...reviewForm, mediaType: e.target.value })}
              >
                <option value="MOVIE">MOVIE</option>
                <option value="TV">TV</option>
              </select>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="Rating (1-10)"
                required
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
              />
              <textarea
                rows="3"
                placeholder="Write your review..."
                value={reviewForm.content}
                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              />
              <button type="submit" style={{ width: '100%' }}>Publish Review</button>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>🔍 Search TMDB Movies & Series</h2>
            <form onSubmit={handleSearchMovies} className="search-form">
              <input
                placeholder="Search by title (e.g. Inception, Breaking Bad)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" disabled={isSearching} style={{ minWidth: '100px' }}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Results found: {searchResults.length}
                  </span>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={() => setSearchResults([])}
                  >
                    Clear Results
                  </button>
                </div>
                <div className="search-results-grid">
                  {searchResults.map((movie) => (
                    <div key={`${movie.mediaType}-${movie.tmdbId}`} className="search-card">
                      <img
                        src={
                          movie.posterPath
                            ? (movie.posterPath.startsWith('http') ? movie.posterPath : `${TMDB_IMG}${movie.posterPath}`)
                            : 'https://via.placeholder.com/200x300/1e293b/38bdf8?text=No+Poster'
                        }
                        alt={movie.title}
                      />
                      <div className="search-card-body">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span className="badge">{movie.mediaType}</span>
                            {movie.voteAverage ? (
                              <span style={{ fontSize: '0.75rem', color: '#facc15' }}>⭐ {Number(movie.voteAverage).toFixed(1)}</span>
                            ) : null}
                          </div>
                          <h4 title={movie.title}>{movie.title}</h4>
                          {movie.releaseDate && (
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                              {movie.releaseDate.substring(0, 4)}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleAddFromSearch(movie)}
                            style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                          >
                            + Add to Watchlist
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                              setReviewForm({ ...reviewForm, tmdbId: String(movie.tmdbId), mediaType: movie.mediaType });
                              notify(`Selected "${movie.title}" for review form.`);
                            }}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
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

          <div className="card">
            <h2>
              {selectedList ? `Items in: ${selectedList.title}` : 'Select a watchlist to view items'}
            </h2>

            {selectedList && (
              <form onSubmit={handleAddMovie} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="number"
                  placeholder="TMDB ID"
                  required
                  value={movieForm.tmdbId}
                  onChange={(e) => setMovieForm({ ...movieForm, tmdbId: e.target.value })}
                />
                <input
                  placeholder="Movie / Show Title"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                />
                <select
                  value={movieForm.mediaType}
                  onChange={(e) => setMovieForm({ ...movieForm, mediaType: e.target.value })}
                >
                  <option value="MOVIE">MOVIE</option>
                  <option value="TV">TV</option>
                </select>
                <input
                  placeholder="Poster Path (/xyz.jpg)"
                  value={movieForm.posterPath}
                  onChange={(e) => setMovieForm({ ...movieForm, posterPath: e.target.value })}
                />
                <button type="submit">+ Add Item</button>
              </form>
            )}

            <div className="movies-grid">
              {items.map((item) => (
                <div key={item.id} className="movie-card">
                  <img
                    src={
                      item.posterPath
                        ? (item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}${item.posterPath}`)
                        : 'https://via.placeholder.com/300x450/1e293b/38bdf8?text=No+Poster'
                    }
                    alt={item.title}
                  />
                  <div className="movie-info">
                    <span className="badge">{item.mediaType}</span>
                    <h4 style={{ marginBottom: '6px' }}>{item.title}</h4>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                      TMDB ID: {item.tmdbId}
                    </div>
                    <button className="danger" style={{ width: '100%' }} onClick={() => handleRemoveItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>User Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No reviews yet.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="review-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong>{rev.mediaType} #{rev.tmdbId}</strong>
                    <span style={{ color: '#facc15', fontWeight: 'bold' }}>⭐ {rev.rating}/10</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>{rev.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);