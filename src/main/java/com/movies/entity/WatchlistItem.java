package com.movies.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.movies.entity.enums.MediaType;
import com.movies.entity.enums.WatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "watchlist_items",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_watchlist_media", columnNames = {"watchlist_id", "tmdb_id", "media_type"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WatchlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "watchlist_id", nullable = false)
    private Watchlist watchlist;

    @Column(name = "tmdb_id", nullable = false)
    private Long tmdbId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    private MediaType mediaType;

    @Column(nullable = false)
    private String title;

    @Column(name = "poster_path")
    private String posterPath;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED') DEFAULT 'PLAN_TO_WATCH'")
    @Builder.Default
    private WatchStatus status = WatchStatus.PLAN_TO_WATCH;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;
}
