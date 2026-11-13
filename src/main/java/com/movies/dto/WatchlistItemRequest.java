package com.movies.dto;

import com.movies.entity.enums.MediaType;
import com.movies.entity.enums.WatchStatus;
import lombok.Data;

@Data
public class WatchlistItemRequest {
    private Long watchlistId;
    private Long userId;
    private Long tmdbId;
    private MediaType mediaType;
    private String title;
    private String posterPath;
    private WatchStatus status;
}