package com.movies.dto;

import lombok.Data;

@Data
public class WatchlistRequest {
    private Long userId;
    private String title;
    private Boolean isPublic;
}