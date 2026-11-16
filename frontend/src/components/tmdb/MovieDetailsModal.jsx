import React, { useState, useEffect } from 'react';
import { API_BASE, apiRequest, TMDB_IMG } from '../../services/api';

export default function MovieDetailsModal({
  movie,
  onClose,
  onAddMovie,
  onOpenReview,
  canAddToWatchlist
}) {
  const [details, setDetails] = useState(null);
  const [mediaReviews, setMediaReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movie) return;
    let isMounted = true;
    setLoading(true);

    const type = movie.mediaType || 'MOVIE';
    const id = movie.tmdbId;

    Promise.all([
      apiRequest(`${API_BASE}/tmdb/details/${type}/${id}`).catch(() => null),
      apiRequest(`${API_BASE}/reviews/media/${type}/${id}`).catch(() => [])
    ])
      .then(([detailsData, reviewsData]) => {
        if (!isMounted) return;
        setDetails(detailsData || movie);
        setMediaReviews(Array.isArray(reviewsData) ? reviewsData : []);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie]);

  if (!movie) return null;

  const info = details || movie;
  const posterUrl = info.posterPath
    ? (info.posterPath.startsWith('http') ? info.posterPath : `${TMDB_IMG}${info.posterPath}`)
    : 'https://via.placeholder.com/300x450/e2e8f0/0284c7?text=No+Poster';

  const backdropUrl = info.backdropPath
    ? `https://image.tmdb.org/t/p/w780${info.backdropPath}`
    : null;

  return (
    <div className="public-list-modal-overlay" onClick={onClose}>
      <div
        className="public-list-modal"
        style={{ maxWidth: '780px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Header */}
        <div
          style={{
            position: 'relative',
            minHeight: '190px',
            background: backdropUrl
              ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.92)), url(${backdropUrl}) center/cover no-repeat`
              : 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '24px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}
            title="Close details"
          >
            ✕
          </button>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
            <img
              src={posterUrl}
              alt={info.title}
              style={{
                width: '105px',
                height: '155px',
                objectFit: 'cover',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.35)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
              }}
            />

            <div style={{ flex: 1, color: '#ffffff' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span className={`badge-pill ${info.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'}`}>
                  {info.mediaType === 'TV' ? '📺 TV SERIES' : '🎬 MOVIE'}
                </span>
                {info.voteAverage > 0 && (
                  <span className="badge-pill badge-rating">
                    ★ {Number(info.voteAverage).toFixed(1)} / 10
                  </span>
                )}
                {info.releaseDate && (
                  <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                    📅 {info.releaseDate.substring(0, 4)}
                  </span>
                )}
                {info.runtime ? (
                  <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                    ⏱️ {info.runtime} min
                  </span>
                ) : null}
                {info.numberOfSeasons ? (
                  <span className="badge-pill" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                    🎞️ {info.numberOfSeasons} Seasons • {info.numberOfEpisodes} Episodes
                  </span>
                ) : null}
              </div>

              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {info.title}
              </h2>
              {info.tagline && (
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', margin: '4px 0 0' }}>
                  "{info.tagline}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              Loading full story, trailer, and details...
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Genres */}
              {info.genres && info.genres.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {info.genres.map((g) => (
                    <span
                      key={g}
                      className="chip-btn"
                      style={{ cursor: 'default', fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Story / Overview */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}
              >
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
                  <i className="bi bi-book-half me-2 text-primary"></i>
                  Story & Overview
                </h4>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 }}>
                  {info.overview && info.overview.trim()
                    ? info.overview
                    : 'No detailed synopsis available for this title on TMDB yet.'}
                </p>
              </div>

              {/* Action Buttons Bar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {canAddToWatchlist && onAddMovie && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                    onClick={() => onAddMovie(info)}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Add to Current Watchlist</span>
                  </button>
                )}

                {onOpenReview && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                    onClick={() => {
                      onClose();
                      onOpenReview(info);
                    }}
                  >
                    <i className="bi bi-star-fill text-warning"></i>
                    <span>Write Review</span>
                  </button>
                )}
              </div>

              {/* Community Reviews for this Title */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>
                  <i className="bi bi-chat-quote-fill me-2 text-warning"></i>
                  Community Reviews ({mediaReviews.length})
                </h4>
                {mediaReviews.length === 0 ? (
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-faint)', margin: 0 }}>
                    No community reviews for this title yet. Be the first to review it!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mediaReviews.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.88rem' }}>
                            {rev.user?.username || 'Community Member'}
                          </strong>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: '0.88rem' }}>
                            ★ {rev.rating} / 10
                          </span>
                        </div>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
                          {rev.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

