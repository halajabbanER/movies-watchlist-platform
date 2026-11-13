package com.movies.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "follows",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_follow", columnNames = {"follower_id", "following_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "follower_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "watchlists", "reviews", "password"})
    private User follower;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "following_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "watchlists", "reviews", "password"})
    private User following;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
