package com.movies.repository;

import com.movies.entity.WatchlistItem;
import com.movies.entity.enums.MediaType;
import com.movies.entity.enums.WatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    List<WatchlistItem> findByWatchlistId(Long watchlistId);

    List<WatchlistItem> findByWatchlistIdAndStatus(Long watchlistId, WatchStatus status);

    Optional<WatchlistItem> findByWatchlistIdAndTmdbIdAndMediaType(Long watchlistId, Long tmdbId, MediaType mediaType);

    boolean existsByWatchlistIdAndTmdbIdAndMediaType(Long watchlistId, Long tmdbId, MediaType mediaType);
}