package com.movies.service;

import com.movies.entity.User;
import com.movies.entity.Watchlist;
import com.movies.repository.UserRepository;
import com.movies.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;

    @Transactional
    public Watchlist createWatchlist(Long userId, String title, Boolean isPublic) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Watchlist watchlist = Watchlist.builder()
                .user(user)
                .title(title)
                .isPublic(isPublic != null ? isPublic : true)
                .build();

        return watchlistRepository.save(watchlist);
    }

    public Watchlist getWatchlistById(Long id) {
        return watchlistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Watchlist not found"));
    }

    public List<Watchlist> getUserWatchlists(Long userId) {
        return watchlistRepository.findByUserId(userId);
    }

    public List<Watchlist> getPublicUserWatchlists(Long userId) {
        return watchlistRepository.findByUserIdAndIsPublicTrue(userId);
    }

    public List<Watchlist> getAllPublicWatchlists() {
        return watchlistRepository.findByIsPublicTrue();
    }

    @Transactional
    public Watchlist updateWatchlist(Long watchlistId, Long userId, String title, Boolean isPublic) {
        Watchlist watchlist = getWatchlistById(watchlistId);

        if (!watchlist.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to update this watchlist");
        }

        if (title != null && !title.isBlank()) {
            watchlist.setTitle(title);
        }
        if (isPublic != null) {
            watchlist.setIsPublic(isPublic);
        }

        return watchlistRepository.save(watchlist);
    }

    @Transactional
    public void deleteWatchlist(Long watchlistId, Long userId) {
        Watchlist watchlist = getWatchlistById(watchlistId);

        if (!watchlist.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to delete this watchlist");
        }

        watchlistRepository.delete(watchlist);
    }
}