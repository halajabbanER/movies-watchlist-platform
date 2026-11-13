package com.movies.service;

import com.movies.entity.Review;
import com.movies.entity.User;
import com.movies.entity.enums.MediaType;
import com.movies.repository.ReviewRepository;
import com.movies.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Transactional
    public Review createReview(Long userId, Long tmdbId, MediaType mediaType, Integer rating, String content) {
        if (rating == null || rating < 1 || rating > 10) {
            throw new IllegalArgumentException("Rating must be between 1 and 10");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Review review = Review.builder()
                .user(user)
                .tmdbId(tmdbId)
                .mediaType(mediaType)
                .rating(rating)
                .content(content)
                .isFlagged(false)
                .isHidden(false)
                .build();

        return reviewRepository.save(review);
    }

    public List<Review> getVisibleReviewsForMedia(Long tmdbId, MediaType mediaType) {
        return reviewRepository.findByTmdbIdAndMediaTypeAndIsHiddenFalse(tmdbId, mediaType);
    }

    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserId(userId);
    }

    @Transactional
    public Review updateReview(Long reviewId, Long userId, Integer rating, String content) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to update this review");
        }

        if (rating != null) {
            if (rating < 1 || rating > 10) {
                throw new IllegalArgumentException("Rating must be between 1 and 10");
            }
            review.setRating(rating);
        }

        if (content != null) {
            review.setContent(content);
        }

        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }

    @Transactional
    public void adminDeleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        reviewRepository.delete(review);
    }

    @Transactional
    public Review flagReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.setIsFlagged(true);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review unflagReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.setIsFlagged(false);
        review.setIsHidden(false);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review hideReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.setIsHidden(true);
        return reviewRepository.save(review);
    }

    public List<Review> getFlaggedReviews() {
        return reviewRepository.findByIsFlaggedTrue();
    }
}