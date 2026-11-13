import React from 'react';
import { TMDB_IMG } from '../../services/api';

export default function WatchlistItemCard({
  item,
  onUpdateStatus,
  onRemove,
  onOpenReview
}) {
  const posterUrl = item.posterPath
    ? (item.posterPath.startsWith('http') ? item.posterPath : `${TMDB_IMG}${item.posterPath}`)
    : 'https://via.placeholder.com/300x450/e2e8f0/0284c7?text=No+Poster';

  return (
    <div className="movie-poster-card">
      <div className="poster-frame">
        <img
          src={posterUrl}
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
            onChange={(e) => onUpdateStatus(item.id, e.target.value)}
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
            onClick={() => onOpenReview(item)}
          >
            ✍ Review
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onRemove(item.id)}
            title="Remove from watchlist"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

