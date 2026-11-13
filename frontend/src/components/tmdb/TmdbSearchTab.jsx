import React, { useState } from 'react';
import { TMDB_IMG } from '../../services/api';

const POPULAR_SEARCHES = [
  'Inception',
  'Interstellar',
  'Dune',
  'Breaking Bad',
  'The Dark Knight',
  'Gladiator',
  'Arcane',
  'Severance'
];

export default function TmdbSearchTab({
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  isSearching,
  onSearch,
  watchlists,
  selectedList,
  onAddMovie,
  onOpenReview
}) {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSearch(e);
  };

  const handleChipClick = (title) => {
    setSearchQuery(title);
    onSearch(null, title);
  };

  return (
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
      <form onSubmit={handleFormSubmit} className="search-wrapper">
        <input
          placeholder="Search by title (e.g. Interstellar, Oppenheimer, Succession, Dune, Gladiator)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSearching}
          style={{ minWidth: '130px' }}
        >
          {isSearching ? 'Searching...' : 'Search TMDB'}
        </button>
      </form>

      {/* Popular Searches */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: 700 }}>
          POPULAR SEARCHES:
        </span>
        {POPULAR_SEARCHES.map((item) => (
          <button
            key={item}
            type="button"
            className="chip-btn"
            onClick={() => handleChipClick(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Results */}
      {searchResults.length === 0 ? (
        <div className="empty-placeholder">
          <div className="empty-placeholder-icon">🎬</div>
          <p>Type any title above or click one of the popular search tags to explore titles.</p>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}
          >
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
              <div
                key={`${movie.mediaType}-${movie.tmdbId}`}
                className="movie-poster-card"
              >
                <div className="poster-frame">
                  <img
                    src={
                      movie.posterPath
                        ? (movie.posterPath.startsWith('http')
                            ? movie.posterPath
                            : `${TMDB_IMG}${movie.posterPath}`)
                        : 'https://via.placeholder.com/300x450/e2e8f0/0284c7?text=No+Poster'
                    }
                    alt={movie.title}
                    loading="lazy"
                  />
                  <div className="badge-overlay-top">
                    <span
                      className={`badge-pill ${
                        movie.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'
                      }`}
                    >
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

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '10px'
                    }}
                  >
                    {watchlists.length > 0 ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onAddMovie(movie)}
                      >
                        + Add to {selectedList ? `"${selectedList.title}"` : 'Watchlist'}
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--accent-amber)',
                          textAlign: 'center'
                        }}
                      >
                        Create a collection first
                      </span>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenReview(movie)}
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
  );
}

