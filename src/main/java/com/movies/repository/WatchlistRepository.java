package com.movies.repository;

import com.movies.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    List<Watchlist> findByUserId(Long userId);

    List<Watchlist> findByUserIdAndIsPublicTrue(Long userId);

    List<Watchlist> findByIsPublicTrue();
}