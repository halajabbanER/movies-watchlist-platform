package com.movies.controller;

import com.movies.dto.WatchlistRequest;
import com.movies.entity.Watchlist;
import com.movies.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlists")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @PostMapping
    public ResponseEntity<Watchlist> createWatchlist(@RequestBody WatchlistRequest request) {
        Watchlist created = watchlistService.createWatchlist(
                request.getUserId(),
                request.getTitle(),
                request.getIsPublic()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Watchlist> getWatchlistById(@PathVariable Long id) {
        return ResponseEntity.ok(watchlistService.getWatchlistById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Watchlist>> getUserWatchlists(@PathVariable Long userId) {
        return ResponseEntity.ok(watchlistService.getUserWatchlists(userId));
    }

    @GetMapping("/user/{userId}/public")
    public ResponseEntity<List<Watchlist>> getPublicUserWatchlists(@PathVariable Long userId) {
        return ResponseEntity.ok(watchlistService.getPublicUserWatchlists(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Watchlist> updateWatchlist(
            @PathVariable Long id,
            @RequestBody WatchlistRequest request) {
        Watchlist updated = watchlistService.updateWatchlist(
                id,
                request.getUserId(),
                request.getTitle(),
                request.getIsPublic()
        );
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWatchlist(
            @PathVariable Long id,
            @RequestParam Long userId) {
        watchlistService.deleteWatchlist(id, userId);
        return ResponseEntity.noContent().build();
    }
}