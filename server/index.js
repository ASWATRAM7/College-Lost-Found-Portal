// ═══════════════════════════════════════════════
//  KEC Lost & Found Portal — Express Server
//  Database: MySQL (via mysql2/promise + pool)
// ═══════════════════════════════════════════════
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const fs       = require('fs');

const { pool, testConnection } = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
//  Uploads directory
// ─────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ─────────────────────────────────────────────
//  Multer — image upload config
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
            && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed.'), ok);
  },
});

const COLLEGE_DOMAIN = 'kongu.edu';

// ═══════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════

// ── POST /api/auth/register ────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate inputs
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!email.toLowerCase().endsWith('@' + COLLEGE_DOMAIN)) {
    return res.status(400).json({ message: `Only @${COLLEGE_DOMAIN} emails are allowed.` });
  }
  if (!['student', 'faculty'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if email already exists in MySQL
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into MySQL
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashedPassword, role]
    );

    return res.status(201).json({ message: 'Account created successfully.' });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!email.toLowerCase().endsWith('@' + COLLEGE_DOMAIN)) {
    return res.status(400).json({ message: `Only @${COLLEGE_DOMAIN} emails are allowed.` });
  }

  try {
    // Find user by email and role in MySQL
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email.toLowerCase(), role]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'No account found with this email and role.' });
    }

    const user = rows[0];

    // Compare entered password against stored bcrypt hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    return res.json({
      message: 'Login successful.',
      token: `mock-token-${user.id}`,   // replace with JWT in production
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ═══════════════════════════════════════════
//  REPORTS ROUTES
// ═══════════════════════════════════════════

// ── POST /api/reports — student submits report ──
app.post('/api/reports', upload.single('image'), async (req, res) => {
  const { category, location, date, time, description, email, name } = req.body;

  if (!category || !location || !date || !time || !description || !email) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Insert report into MySQL
    const [result] = await pool.query(
      `INSERT INTO reports
         (user_email, user_name, category, location, lost_date, lost_time, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase(), name, category, location, date, time, description, imageUrl]
    );

    return res.status(201).json({
      message: 'Report submitted.',
      reportId: result.insertId,
    });

  } catch (err) {
    console.error('Submit report error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/reports?email=... — student's own reports ──
app.get('/api/reports', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const [rows] = await pool.query(
      `SELECT
         id, user_email AS email, user_name AS name,
         category, location, lost_date AS date, lost_time AS time,
         description, image_url AS imageUrl, status, created_at AS createdAt
       FROM reports
       WHERE user_email = ?
       ORDER BY created_at DESC`,
      [email.toLowerCase()]
    );

    return res.json({ reports: rows });

  } catch (err) {
    console.error('Fetch reports error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/reports/all — faculty gets all reports ──
app.get('/api/reports/all', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id, user_email AS email, user_name AS name,
         category, location, lost_date AS date, lost_time AS time,
         description, image_url AS imageUrl, status, created_at AS createdAt
       FROM reports
       ORDER BY created_at DESC`
    );

    return res.json({ reports: rows });

  } catch (err) {
    console.error('Fetch all reports error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/reports/:id/status — faculty marks as found ──
app.patch('/api/reports/:id/status', async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!['pending', 'found'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE reports SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    return res.json({ message: 'Status updated successfully.' });

  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
//  Start server — test DB connection first
// ─────────────────────────────────────────────
async function startServer() {
  await testConnection();   // will exit if MySQL is not reachable

  app.listen(PORT, () => {
    console.log(`\n  KEC Lost & Found Server running at http://localhost:${PORT}`);
    console.log(`  MySQL database: ${process.env.DB_NAME}\n`);
  });
}

startServer();
