package com.movies.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TmdbService {

    private final RestClient restClient;
    private final String apiKey;

    public TmdbService(
            @Value("${tmdb.api.base-url}") String baseUrl,
            @Value("${tmdb.api.key}") String apiKey) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchMulti(String query) {
        Map<String, Object> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/multi")
                        .queryParam("api_key", apiKey)
                        .queryParam("query", query)
                        .queryParam("include_adult", false)
                        .build())
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> cleanedResults = new ArrayList<>();
        if (response == null || !response.containsKey("results")) {
            return cleanedResults;
        }

        List<Map<String, Object>> rawResults = (List<Map<String, Object>>) response.get("results");
        if (rawResults != null) {
            for (Map<String, Object> item : rawResults) {
                String mediaType = String.valueOf(item.get("media_type"));
                if (!"movie".equals(mediaType) && !"tv".equals(mediaType)) {
                    continue;
                }

                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("tmdbId", item.get("id"));
                dto.put("mediaType", mediaType.toUpperCase());
                dto.put("title", "movie".equals(mediaType) ? item.get("title") : item.get("name"));
                dto.put("releaseDate", "movie".equals(mediaType) ? item.get("release_date") : item.get("first_air_date"));
                dto.put("posterPath", item.get("poster_path"));
                dto.put("overview", item.get("overview"));
                dto.put("voteAverage", item.get("vote_average"));
                cleanedResults.add(dto);
            }
        }

        return cleanedResults;
    }
}