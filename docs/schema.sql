-- ========================================================
-- Database Schema: Movie & Series Watchlist Platform
-- Student ID: 2121221350
-- Course: BLM22441 Web Tasarımı ve Programlama
-- Target Database: MySQL 8.0+
-- ========================================================

CREATE DATABASE IF NOT EXISTS movie_platform_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE movie_platform_db;

-- --------------------------------------------------------
-- 1. Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ROLE_USER', 'ROLE_ADMIN') DEFAULT 'ROLE_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 2. Table: watchlists
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_watchlists_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 3. Table: watchlist_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS watchlist_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    watchlist_id BIGINT NOT NULL,
    tmdb_id BIGINT NOT NULL,
    media_type ENUM('MOVIE', 'TV') NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    status ENUM('PLAN_TO_WATCH', 'WATCHING', 'COMPLETED', 'DROPPED') DEFAULT 'PLAN_TO_WATCH',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_watchlist 
        FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) 
        ON DELETE CASCADE,
    CONSTRAINT uq_watchlist_media 
        UNIQUE (watchlist_id, tmdb_id, media_type)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 4. Table: reviews
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tmdb_id BIGINT NOT NULL,
    media_type ENUM('MOVIE', 'TV') NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 10),
    content TEXT NOT NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 5. Table: follows
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    following_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_follows_follower 
        FOREIGN KEY (follower_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_follows_following 
        FOREIGN KEY (following_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT uq_user_follow 
        UNIQUE (follower_id, following_id)
) ENGINE=InnoDB;