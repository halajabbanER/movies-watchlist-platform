import React, { useState, useMemo } from 'react';
import WatchlistSidebar from './WatchlistSidebar';
import WatchlistItemCard from './WatchlistItemCard';

export default function WatchlistsTab({
  watchlists,
  selectedList,
  items,
  onSelectList,
  onCreateList,
  onDeleteList,
  onUpdateItemStatus,
  onRemoveItem,
  onOpenReview,
  onNavigateToSearch,
  onQuickSearch
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSearch =
        !itemSearchQuery.trim() ||
        item.title.toLowerCase().includes(itemSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, statusFilter, itemSearchQuery]);

  return (
    <div className="content-grid">
      <WatchlistSidebar
        watchlists={watchlists}
        selectedList={selectedList}
        onSelectList={onSelectList}
        onCreateList={onCreateList}
        onDeleteList={onDeleteList}
        onQuickSearch={onQuickSearch}
      />

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
                onClick={onNavigateToSearch}
              >
                + Find More on TMDB
              </button>
            )}
          </div>

          {selectedList && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px'
              }}
            >
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
                style={{
                  maxWidth: '240px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  marginBottom: 0
                }}
              />
            </div>
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
                  onClick={onNavigateToSearch}
                >
                  🔍 Discover Movies on TMDB
                </button>
              )}
            </div>
          ) : (
            <div className="movies-grid-responsive">
              {displayedItems.map((item) => (
                <WatchlistItemCard
                  key={item.id}
                  item={item}
                  onUpdateStatus={onUpdateItemStatus}
                  onRemove={onRemoveItem}
                  onOpenReview={onOpenReview}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

