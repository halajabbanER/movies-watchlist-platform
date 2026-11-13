package com.movies.controller;

import com.movies.entity.Follow;
import com.movies.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{followerId}/follow/{followingId}")
    public ResponseEntity<Follow> followUser(
            @PathVariable Long followerId,
            @PathVariable Long followingId) {
        Follow created = followService.followUser(followerId, followingId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{followerId}/unfollow/{followingId}")
    public ResponseEntity<Void> unfollowUser(
            @PathVariable Long followerId,
            @PathVariable Long followingId) {
        followService.unfollowUser(followerId, followingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<List<Follow>> getFollowing(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowing(userId));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<Follow>> getFollowers(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowers(userId));
    }

    @GetMapping("/{userId}/stats")
    public ResponseEntity<?> getFollowStats(@PathVariable Long userId) {
        Map<String, Long> stats = new HashMap<>();
        stats.put("followingCount", followService.getFollowingCount(userId));
        stats.put("followersCount", followService.getFollowersCount(userId));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{followerId}/is-following/{followingId}")
    public ResponseEntity<?> isFollowing(
            @PathVariable Long followerId,
            @PathVariable Long followingId) {
        Map<String, Boolean> result = new HashMap<>();
        result.put("isFollowing", followService.isFollowing(followerId, followingId));
        return ResponseEntity.ok(result);
    }
}