package com.movies.dto;

import com.movies.entity.enums.MediaType;
import lombok.Data;

@Data
public class ReviewRequest {
    private Long userId;
    private Long tmdbId;
    private MediaType mediaType;
    private Integer rating;
    private String content;
}