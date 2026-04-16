const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Connect to MySQL server WITHOUT specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server.');

    // Create the database
    console.log('Creating database kec_lost_found...');
    await connection.query('CREATE DATABASE IF NOT EXISTS kec_lost_found CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    
    // Select the database
    await connection.query('USE kec_lost_found;');

    // Read the schema.sql file
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema by ';' to execute each query separately
    // Note: This is an approximation. A better way is to just execute the individual CREATE TABLE statements.
    console.log('Creating tables...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100)  NOT NULL,
        email       VARCHAR(150)  NOT NULL UNIQUE,
        password    VARCHAR(255)  NOT NULL,
        role        ENUM('student','faculty') NOT NULL,
        department  VARCHAR(100) DEFAULT NULL,
        email_notifs TINYINT(1) DEFAULT 1,
        sms_notifs   TINYINT(1) DEFAULT 0,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_email   VARCHAR(150)  NOT NULL,
        user_name    VARCHAR(100)  NOT NULL,
        category     VARCHAR(100)  NOT NULL,
        location     VARCHAR(150)  NOT NULL,
        lost_date    DATE          NOT NULL,
        lost_time    TIME          NOT NULL,
        description  TEXT          NOT NULL,
        image_url    VARCHAR(300)  DEFAULT NULL,
        status       ENUM('pending','found') DEFAULT 'pending',
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email)
          ON UPDATE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS found_items (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        category     VARCHAR(100)  NOT NULL,
        location     VARCHAR(150)  NOT NULL,
        found_date   DATE          NOT NULL,
        description  TEXT          NOT NULL,
        image_url    VARCHAR(300)  DEFAULT NULL,
        status       ENUM('available','claimed') DEFAULT 'available',
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        found_item_id  INT NOT NULL,
        student_email  VARCHAR(150) NOT NULL,
        phone_number   VARCHAR(20) DEFAULT NULL,
        student_name   VARCHAR(100) NOT NULL,
        student_id     VARCHAR(50) DEFAULT NULL,
        proof_desc     TEXT NOT NULL,
        proof_image_url VARCHAR(300) DEFAULT NULL,
        status         ENUM('pending','approved','rejected') DEFAULT 'pending',
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (found_item_id) REFERENCES found_items(id) ON DELETE CASCADE,
        FOREIGN KEY (student_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    console.log('Database and tables created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error setting up database:', error.message);
  }
}

setupDatabase();
