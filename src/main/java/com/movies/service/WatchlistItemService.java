package com.movies.service;

import com.movies.entity.Watchlist;
import com.movies.entity.WatchlistItem;
import com.movies.entity.enums.MediaType;
import com.movies.entity.enums.WatchStatus;
import com.movies.repository.WatchlistItemRepository;
import com.movies.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WatchlistItemService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final WatchlistRepository watchlistRepository;

    @Transactional
    public WatchlistItem addItemToWatchlist(Long watchlistId, Long userId, Long tmdbId, MediaType mediaType, String title, String posterPath) {
        Watchlist watchlist = watchlistRepository.findById(watchlistId)
                .orElseThrow(() -> new IllegalArgumentException("Watchlist not found"));

        if (!watchlist.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to add items to this watchlist");
        }

        if (watchlistItemRepository.existsByWatchlistIdAndTmdbIdAndMediaType(watchlistId, tmdbId, mediaType)) {
            throw new IllegalArgumentException("Item already exists in this watchlist");
        }

        WatchlistItem item = WatchlistItem.builder()
                .watchlist(watchlist)
                .tmdbId(tmdbId)
                .mediaType(mediaType)
                .title(title)
                .posterPath(posterPath)
                .status(WatchStatus.PLAN_TO_WATCH)
                .build();

        return watchlistItemRepository.save(item);
    }

    public List<WatchlistItem> getItemsByWatchlist(Long watchlistId) {
        return watchlistItemRepository.findByWatchlistId(watchlistId);
    }

    public List<WatchlistItem> getItemsByWatchlistAndStatus(Long watchlistId, WatchStatus status) {
        return watchlistItemRepository.findByWatchlistIdAndStatus(watchlistId, status);
    }

    @Transactional
    public WatchlistItem updateItemStatus(Long itemId, Long userId, WatchStatus status) {
        WatchlistItem item = watchlistItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Watchlist item not found"));

        if (!item.getWatchlist().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to update this item");
        }

        item.setStatus(status);
        return watchlistItemRepository.save(item);
    }

    @Transactional
    public void removeItemFromWatchlist(Long itemId, Long userId) {
        WatchlistItem item = watchlistItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Watchlist item not found"));

        if (!item.getWatchlist().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to remove this item");
        }

        watchlistItemRepository.delete(item);
    }
}