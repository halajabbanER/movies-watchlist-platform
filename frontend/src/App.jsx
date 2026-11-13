import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { API_BASE, apiRequest } from './services/api';
import Navbar from './components/layout/Navbar';
import Toast from './components/common/Toast';
import AuthScreen from './components/auth/AuthScreen';
import WatchlistsTab from './components/watchlists/WatchlistsTab';
import TmdbSearchTab from './components/tmdb/TmdbSearchTab';
import ReviewsTab from './components/reviews/ReviewsTab';
import CommunityTab from './components/community/CommunityTab';
import AdminTab from './components/admin/AdminTab';

export default function App() {
  const { currentUser, userId } = useAuth();
  const [activeTab, setActiveTab] = useState('watchlists'); // 'watchlists' | 'search' | 'reviews' | 'community'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [toast, setToast] = useState(null);

  // Data states
  const [watchlists, setWatchlists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [followStats, setFollowStats] = useState({ followingCount: 0, followersCount: 0 });
  const [followingList, setFollowingList] = useState([]);

  // TMDB Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Review Form state
  const [reviewForm, setReviewForm] = useState({
    tmdbId: '',
    mediaType: 'MOVIE',
    rating: 9,
    content: ''
  });

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const notify = (msg, isError = false) => {
    const text = typeof msg === 'string' ? msg : (msg?.message || 'حدث خطأ غير متوقع');
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4500);
  };

  // Load User Data & Social Stats
  const loadUserData = async (uid = userId) => {
    if (!uid) return;
    try {
      const data = await apiRequest(`${API_BASE}/watchlists/user/${uid}`);
      const listArray = Array.isArray(data) ? data : [];
      setWatchlists(listArray);
      if (listArray.length > 0) {
        setSelectedList((prev) => {
          if (!prev) return listArray[0];
          const exists = listArray.find((l) => l.id === prev.id);
          return exists || listArray[0];
        });
      } else {
        setSelectedList(null);
        setItems([]);
      }

      // Reviews
      try {
        const revData = await apiRequest(`${API_BASE}/reviews/user/${uid}`);
        setReviews(Array.isArray(revData) ? revData : []);
      } catch {
        setReviews([]);
      }

      // Social / Follow Stats
      try {
        const stats = await apiRequest(`${API_BASE}/follows/${uid}/stats`);
        if (stats) setFollowStats(stats);

        const following = await apiRequest(`${API_BASE}/follows/${uid}/following`);
        if (Array.isArray(following)) setFollowingList(following);
      } catch {
        // ignore if not setup yet
      }
    } catch (err) {
      notify(err.message, true);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadUserData(currentUser.id);
    } else {
      setWatchlists([]);
      setSelectedList(null);
      setItems([]);
      setReviews([]);
      setFollowStats({ followingCount: 0, followersCount: 0 });
      setFollowingList([]);
    }
  }, [currentUser]);

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

  // Watchlist Actions
  const handleCreateList = async (title, isPublic) => {
    try {
      await apiRequest(`${API_BASE}/watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), title, isPublic })
      });
      notify('New collection created successfully!');
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteList = async (id) => {
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
      await apiRequest(`${API_BASE}/watchlist-items/${itemId}?userId=${userId}`, {
        method: 'DELETE'
      });
      setItems((prev) => prev.filter((item) => item.id !== itemId));
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
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status: updated.status } : it))
      );
      notify(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  // TMDB Search Actions
  const handleSearchMovies = async (e, customQuery) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const results = await apiRequest(
        `${API_BASE}/tmdb/search?query=${encodeURIComponent(q)}`
      );
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

  const handleAddFromSearch = async (movie) => {
    if (!selectedList?.id) {
      notify('Please select or create a watchlist first!', true);
      return;
    }
    try {
      const data = await apiRequest(`${API_BASE}/watchlist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchlistId: Number(selectedList.id),
          userId: Number(userId),
          tmdbId: Number(movie.tmdbId),
          mediaType: movie.mediaType,
          title: movie.title,
          posterPath: movie.posterPath || null
        })
      });

      setItems((prev) => [...prev, data]);
      notify(`Added "${movie.title}" to "${selectedList.title}"!`);
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
      setReviews((prev) => [data, ...prev]);
      setReviewForm({ tmdbId: '', mediaType: 'MOVIE', rating: 9, content: '' });
      notify('Review published successfully!');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}?userId=${userId}`, {
        method: 'DELETE'
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      notify('Review deleted');
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleFlagReview = async (reviewId) => {
    try {
      await apiRequest(`${API_BASE}/reviews/${reviewId}/flag`, { method: 'PATCH' });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isFlagged: true } : r))
      );
      notify('Review flagged for community moderation.');
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Community / Follow Actions
  const handleFollowUser = async (targetId) => {
    if (!targetId || Number(targetId) === Number(userId)) {
      notify('Enter a valid User ID different from your own', true);
      return;
    }
    try {
      await apiRequest(`${API_BASE}/follows/${userId}/follow/${targetId}`, {
        method: 'POST'
      });
      notify(`You are now following user #${targetId}!`);
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleUnfollowUser = async (targetId) => {
    try {
      await apiRequest(`${API_BASE}/follows/${userId}/unfollow/${targetId}`, {
        method: 'DELETE'
      });
      notify(`Unfollowed user #${targetId}`);
      loadUserData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const handleOpenReviewForMovie = (movieOrItem) => {
    setReviewForm({
      tmdbId: String(movieOrItem.tmdbId),
      mediaType: movieOrItem.mediaType || 'MOVIE',
      rating: 9,
      content: ''
    });
    setActiveTab('reviews');
    notify(`Selected "${movieOrItem.title}" for review!`);
  };

  const handleQuickSearch = (query) => {
    setSearchQuery(query);
    setActiveTab('search');
    handleSearchMovies(null, query);
  };

  // If unauthenticated: Show full Auth screen
  if (!currentUser) {
    return (
      <AuthScreen
        theme={theme}
        toggleTheme={toggleTheme}
        toast={toast}
        notify={notify}
      />
    );
  }

  return (
    <div className="app-container">
      <Toast toast={toast} />

      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        onBrandClick={() => setActiveTab('watchlists')}
      />

      {/* Spotlight & Dynamic Stats */}
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
        <button
          className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
          style={currentUser.role === 'ROLE_ADMIN' ? { border: '1px solid var(--accent-indigo)' } : {}}
        >
          <span>🛡️</span> Admin Center {currentUser.role === 'ROLE_ADMIN' ? '👑' : ''}
        </button>
      </nav>

      {/* Active Tab Content */}
      {activeTab === 'watchlists' && (
        <WatchlistsTab
          watchlists={watchlists}
          selectedList={selectedList}
          items={items}
          onSelectList={(list) => setSelectedList(list)}
          onCreateList={handleCreateList}
          onDeleteList={handleDeleteList}
          onUpdateItemStatus={handleUpdateItemStatus}
          onRemoveItem={handleRemoveItem}
          onOpenReview={handleOpenReviewForMovie}
          onNavigateToSearch={() => setActiveTab('search')}
          onQuickSearch={handleQuickSearch}
        />
      )}

      {activeTab === 'search' && (
        <TmdbSearchTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          isSearching={isSearching}
          onSearch={handleSearchMovies}
          watchlists={watchlists}
          selectedList={selectedList}
          onAddMovie={handleAddFromSearch}
          onOpenReview={handleOpenReviewForMovie}
        />
      )}

      {activeTab === 'reviews' && (
        <ReviewsTab
          reviews={reviews}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onAddReview={handleAddReview}
          onDeleteReview={handleDeleteReview}
          onFlagReview={handleFlagReview}
        />
      )}

      {activeTab === 'community' && (
        <CommunityTab
          followingList={followingList}
          currentUserId={userId}
          onFollowUser={handleFollowUser}
          onUnfollowUser={handleUnfollowUser}
        />
      )}

      {activeTab === 'admin' && (
        <AdminTab notify={notify} />
      )}
    </div>
  );
}

