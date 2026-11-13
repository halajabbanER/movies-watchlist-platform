package com.movies.controller;

import com.movies.dto.ReviewRequest;
import com.movies.entity.Review;
import com.movies.entity.enums.MediaType;
import com.movies.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody ReviewRequest request) {
        Review created = reviewService.createReview(
                request.getUserId(),
                request.getTmdbId(),
                request.getMediaType(),
                request.getRating(),
                request.getContent()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/media/{mediaType}/{tmdbId}")
    public ResponseEntity<List<Review>> getVisibleReviewsForMedia(
            @PathVariable MediaType mediaType,
            @PathVariable Long tmdbId) {
        return ResponseEntity.ok(reviewService.getVisibleReviewsForMedia(tmdbId, mediaType));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<Review> updateReview(
            @PathVariable Long reviewId,
            @RequestBody ReviewRequest request) {
        Review updated = reviewService.updateReview(
                reviewId,
                request.getUserId(),
                request.getRating(),
                request.getContent()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @RequestParam Long userId) {
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{reviewId}/flag")
    public ResponseEntity<Review> flagReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.flagReview(reviewId));
    }

    @PatchMapping("/{reviewId}/hide")
    public ResponseEntity<Review> hideReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.hideReview(reviewId));
    }

    @GetMapping("/flagged")
    public ResponseEntity<List<Review>> getFlaggedReviews() {
        return ResponseEntity.ok(reviewService.getFlaggedReviews());
    }
}