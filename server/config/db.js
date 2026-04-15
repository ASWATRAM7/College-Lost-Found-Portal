// ─────────────────────────────────────────────
//  server/config/db.js
//  Creates a MySQL connection pool using mysql2.
//  A pool keeps multiple connections open so the
//  server doesn't reconnect on every request.
// ─────────────────────────────────────────────
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'kec_lost_found',

  // Pool settings
  waitForConnections: true,   // queue queries if all connections are busy
  connectionLimit:    10,     // max 10 simultaneous connections
  queueLimit:         0,      // unlimited queue
});

// Test the connection when the server starts
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('  MySQL connected successfully');
    conn.release(); // return connection back to pool
  } catch (err) {
    console.error('  MySQL connection failed:', err.message);
    console.error('  Check your .env file credentials and make sure MySQL is running.');
    process.exit(1); // stop the server if DB can't connect
  }
}

module.exports = { pool, testConnection };
