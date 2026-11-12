package com.movies.repository;

import com.movies.entity.Review;
import com.movies.entity.enums.MediaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByTmdbIdAndMediaTypeAndIsHiddenFalse(Long tmdbId, MediaType mediaType);

    List<Review> findByUserId(Long userId);

    List<Review> findByIsFlaggedTrue();
}