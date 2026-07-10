-- Script de création des tables pour l'application My Music
-- Base de données compatible MySQL/PostgreSQL

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    avatar_url TEXT,
    bio TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE musiques (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    cover_url TEXT,
    audio_url TEXT NOT NULL,
    duration_seconds INT,
    genre VARCHAR(100),
    description TEXT,
    user_id BIGINT,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    musique_id BIGINT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_musique FOREIGN KEY (musique_id) REFERENCES musiques(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_musique_like UNIQUE (user_id, musique_id)
);

CREATE TABLE partages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    musique_id BIGINT NOT NULL,
    destination VARCHAR(255),
    message TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_partages_musique FOREIGN KEY (musique_id) REFERENCES musiques(id) ON DELETE CASCADE
);

CREATE TABLE news (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id BIGINT,
    image_url TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE nb_telechargements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    musique_id BIGINT NOT NULL,
    user_id BIGINT,
    nombre_telechargements INT NOT NULL DEFAULT 0,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nb_dl_musique FOREIGN KEY (musique_id) REFERENCES musiques(id) ON DELETE CASCADE,
    CONSTRAINT fk_nb_dl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_musique_id ON likes(musique_id);
CREATE INDEX idx_musiques_statut ON musiques(statut);
CREATE INDEX idx_users_statut ON users(statut);
CREATE INDEX idx_news_statut ON news(statut);
CREATE INDEX idx_nb_dl_musique_id ON nb_telechargements(musique_id);
