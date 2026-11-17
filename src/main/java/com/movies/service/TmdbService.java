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
                dto.put("releaseDate",
                        "movie".equals(mediaType) ? item.get("release_date") : item.get("first_air_date"));
                dto.put("posterPath", item.get("poster_path"));
                dto.put("overview", item.get("overview"));
                dto.put("voteAverage", item.get("vote_average"));
                cleanedResults.add(dto);
            }
        }

        return cleanedResults;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMediaDetails(String mediaType, Long tmdbId) {
        String type = "tv".equalsIgnoreCase(mediaType) ? "tv" : "movie";
        Map<String, Object> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + type + "/" + tmdbId)
                        .queryParam("api_key", apiKey)
                        .queryParam("append_to_response", "videos")
                        .build())
                .retrieve()
                .body(Map.class);

        Map<String, Object> details = new LinkedHashMap<>();
        if (response == null) {
            return details;
        }

        details.put("tmdbId", response.get("id"));
        details.put("mediaType", type.toUpperCase());
        details.put("title", "movie".equals(type) ? response.get("title") : response.get("name"));
        details.put("tagline", response.get("tagline"));
        details.put("overview", response.get("overview"));
        details.put("releaseDate", "movie".equals(type) ? response.get("release_date") : response.get("first_air_date"));
        details.put("voteAverage", response.get("vote_average"));
        details.put("posterPath", response.get("poster_path"));
        details.put("backdropPath", response.get("backdrop_path"));
        details.put("status", response.get("status"));

        if ("movie".equals(type)) {
            details.put("runtime", response.get("runtime"));
        } else {
            details.put("numberOfSeasons", response.get("number_of_seasons"));
            details.put("numberOfEpisodes", response.get("number_of_episodes"));
        }

        List<String> genreNames = new ArrayList<>();
        Object genresObj = response.get("genres");
        if (genresObj instanceof List<?> genresList) {
            for (Object g : genresList) {
                if (g instanceof Map<?, ?> gMap && gMap.get("name") != null) {
                    genreNames.add(String.valueOf(gMap.get("name")));
                }
            }
        }
        details.put("genres", genreNames);

        // Extract YouTube trailer key
        String trailerKey = null;
        Object videosObj = response.get("videos");
        if (videosObj instanceof Map<?, ?> videosMap && videosMap.get("results") instanceof List<?> videoList) {
            for (Object v : videoList) {
                if (v instanceof Map<?, ?> vMap) {
                    String site = String.valueOf(vMap.get("site"));
                    String vType = String.valueOf(vMap.get("type"));
                    if ("YouTube".equalsIgnoreCase(site)) {
                        if ("Trailer".equalsIgnoreCase(vType)) {
                            trailerKey = String.valueOf(vMap.get("key"));
                            break;
                        } else if (trailerKey == null) {
                            trailerKey = String.valueOf(vMap.get("key"));
                        }
                    }
                }
            }
        }
        details.put("trailerKey", trailerKey);

        return details;
    }
}