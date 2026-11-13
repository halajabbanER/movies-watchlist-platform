import React from 'react';

export default function ReviewsTab({
  reviews,
  reviewForm,
  setReviewForm,
  onAddReview,
  onDeleteReview,
  onFlagReview
}) {
  const ratingLabel = (val) => {
    if (val >= 10) return 'Masterpiece! 🏆';
    if (val >= 9) return 'Incredible! ⭐';
    if (val >= 7) return 'Great Movie 👍';
    if (val >= 5) return 'Average / Decent 🍿';
    return 'Disappointing 👎';
  };

  return (
    <div className="content-grid">
      {/* Write Review Form */}
      <div className="glass-card">
        <h3 className="card-title">✍ Write a Review</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Score out of 10 and write your review to share your thoughts.
        </p>

        <form onSubmit={onAddReview}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            TMDB ID:
          </label>
          <input
            type="number"
            placeholder="TMDB ID (e.g. 27205)"
            required
            value={reviewForm.tmdbId}
            onChange={(e) => setReviewForm({ ...reviewForm, tmdbId: e.target.value })}
          />

          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            MEDIA TYPE:
          </label>
          <select
            value={reviewForm.mediaType}
            onChange={(e) => setReviewForm({ ...reviewForm, mediaType: e.target.value })}
          >
            <option value="MOVIE">MOVIE</option>
            <option value="TV">TV SERIES</option>
          </select>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}
          >
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              SCORE: ⭐ {reviewForm.rating} / 10
            </label>
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

          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            REVIEW CONTENT:
          </label>
          <textarea
            rows="4"
            placeholder="What did you think of the directing, acting, or story?..."
            required
            value={reviewForm.content}
            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
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
                    <span
                      className={`badge-pill ${
                        rev.mediaType === 'TV' ? 'badge-tv' : 'badge-movie'
                      }`}
                      style={{ marginRight: '8px' }}
                    >
                      {rev.mediaType}
                    </span>
                    <strong>TMDB Item #{rev.tmdbId}</strong>
                    {rev.isFlagged && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '0.75rem',
                          color: 'var(--accent-rose)',
                          fontWeight: 700
                        }}
                      >
                        [Flagged]
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      color: 'var(--accent-amber)',
                      fontWeight: 800,
                      fontSize: '1.05rem'
                    }}
                  >
                    ★ {rev.rating} / 10
                  </span>
                </div>

                <p className="review-text-content">{rev.content}</p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-faint)'
                  }}
                >
                  <span>
                    Published: {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => onFlagReview(rev.id)}
                      title="Flag this review"
                    >
                      🚩 Flag
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      onClick={() => onDeleteReview(rev.id)}
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
  );
}

