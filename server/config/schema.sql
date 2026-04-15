-- ═══════════════════════════════════════════════════
--  KEC Lost & Found Portal — MySQL Database Schema
--  Run this file once to set up all tables.
--
--  How to run:
--  1. Open MySQL Workbench (or MySQL command line)
--  2. Run:  SOURCE path/to/schema.sql;
--     OR copy-paste everything below and execute it.
-- ═══════════════════════════════════════════════════

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS kec_lost_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Use it
USE kec_lost_found;

-- ─────────────────────────────────────────
--  TABLE: users
--  Stores registered student and faculty accounts
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,          -- bcrypt hashed
  role        ENUM('student','faculty') NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TABLE: reports
--  Stores lost item reports submitted by students
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_email   VARCHAR(150)  NOT NULL,
  user_name    VARCHAR(100)  NOT NULL,
  category     VARCHAR(100)  NOT NULL,
  location     VARCHAR(150)  NOT NULL,
  lost_date    DATE          NOT NULL,
  lost_time    TIME          NOT NULL,
  description  TEXT          NOT NULL,
  image_url    VARCHAR(300)  DEFAULT NULL,     -- path to uploaded image
  status       ENUM('pending','found') DEFAULT 'pending',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key: report must belong to a registered user
  FOREIGN KEY (user_email) REFERENCES users(email)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- Verify tables were created
SHOW TABLES;
