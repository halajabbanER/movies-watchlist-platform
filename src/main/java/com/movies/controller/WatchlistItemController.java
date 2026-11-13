package com.movies.controller;

import com.movies.dto.WatchlistItemRequest;
import com.movies.entity.WatchlistItem;
import com.movies.entity.enums.WatchStatus;
import com.movies.service.WatchlistItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist-items")
@RequiredArgsConstructor
public class WatchlistItemController {

    private final WatchlistItemService watchlistItemService;

    @PostMapping
    public ResponseEntity<WatchlistItem> addItemToWatchlist(@RequestBody WatchlistItemRequest request) {
        WatchlistItem added = watchlistItemService.addItemToWatchlist(
                request.getWatchlistId(),
                request.getUserId(),
                request.getTmdbId(),
                request.getMediaType(),
                request.getTitle(),
                request.getPosterPath()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(added);
    }

    @GetMapping("/watchlist/{watchlistId}")
    public ResponseEntity<List<WatchlistItem>> getItemsByWatchlist(@PathVariable Long watchlistId) {
        return ResponseEntity.ok(watchlistItemService.getItemsByWatchlist(watchlistId));
    }

    @GetMapping("/watchlist/{watchlistId}/status/{status}")
    public ResponseEntity<List<WatchlistItem>> getItemsByWatchlistAndStatus(
            @PathVariable Long watchlistId,
            @PathVariable WatchStatus status) {
        return ResponseEntity.ok(watchlistItemService.getItemsByWatchlistAndStatus(watchlistId, status));
    }

    @PatchMapping("/{itemId}/status")
    public ResponseEntity<WatchlistItem> updateItemStatus(
            @PathVariable Long itemId,
            @RequestBody WatchlistItemRequest request) {
        WatchlistItem updated = watchlistItemService.updateItemStatus(
                itemId,
                request.getUserId(),
                request.getStatus()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> removeItemFromWatchlist(
            @PathVariable Long itemId,
            @RequestParam Long userId) {
        watchlistItemService.removeItemFromWatchlist(itemId, userId);
        return ResponseEntity.noContent().build();
    }
}