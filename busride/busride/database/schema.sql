-- Patakbuhin: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS busride
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE busride;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Mga laman ng "References" card (Discover).
CREATE TABLE IF NOT EXISTS ref_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  source      VARCHAR(60)  NOT NULL DEFAULT '',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO ref_items (title, description, source) VALUES
  ('Minimalism Typography', 'Malinis na layout, malalaking letra, maraming espasyo.', 'Pinterest'),
  ('Glassmorphism UI', 'Malabong salamin na cards na may soft na gradient.', 'Pinterest'),
  ('Retro Bus Wallpaper', 'Teal hanggang orange na gradient na may vintage na bus.', 'Pinterest'),
  ('Pastel Sunset Palette', 'Pink, peach at terracotta para sa mainit na mood.', 'Pinterest');
