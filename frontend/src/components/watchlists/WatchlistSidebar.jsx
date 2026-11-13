import React, { useState } from 'react';

export default function WatchlistSidebar({
  watchlists,
  selectedList,
  onSelectList,
  onCreateList,
  onDeleteList,
  onQuickSearch
}) {
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [quickSearchInput, setQuickSearchInput] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    onCreateList(newListTitle.trim(), isPublic);
    setNewListTitle('');
    setShowNewListForm(false);
  };

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (!quickSearchInput.trim()) return;
    onQuickSearch(quickSearchInput.trim());
  };

  return (
    <div>
      <div className="glass-card">
        <div className="card-header-flex">
          <h3 className="card-title">📁 Your Collections</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowNewListForm(!showNewListForm)}
          >
            {showNewListForm ? '✕' : '+ New List'}
          </button>
        </div>

        {showNewListForm && (
          <form onSubmit={handleFormSubmit} style={{ marginBottom: '18px', animation: 'slideInUp 0.2s ease' }}>
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
              <p>No watchlists found yet.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '10px' }}
                onClick={() => setShowNewListForm(true)}
              >
                + Create First Watchlist
              </button>
            </div>
          ) : (
            watchlists.map((list) => (
              <div
                key={list.id}
                className={`watchlist-nav-item ${selectedList?.id === list.id ? 'active' : ''}`}
                onClick={() => onSelectList(list)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteList(list.id);
                  }}
                  title="Delete this collection"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Search */}
      <div className="glass-card">
        <h3 className="card-title">⚡ Quick Search</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Search TMDB catalog directly:
        </p>
        <form onSubmit={handleQuickSearchSubmit} className="search-wrapper">
          <input
            placeholder="Movie or show title..."
            value={quickSearchInput}
            onChange={(e) => setQuickSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Go
          </button>
        </form>
      </div>
    </div>
  );
}

