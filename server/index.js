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
app.use(cors({ 
  origin: function(origin, callback) {
    callback(null, true); // Allow any origin during development
  }, 
  credentials: true 
}));
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
//  USERS ROUTES (Profile & Settings)
// ═══════════════════════════════════════════

// ── GET /api/users/profile ────────────────
app.get('/api/users/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required.' });

  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department, email_notifs, sms_notifs, created_at FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    return res.json({ profile: rows[0] });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PUT /api/users/profile ────────────────
app.put('/api/users/profile', async (req, res) => {
  const { email, name, department, email_notifs, sms_notifs } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required.' });

  try {
    // We update name, department, and notification settings
    await pool.query(
      'UPDATE users SET name = ?, department = ?, email_notifs = ?, sms_notifs = ? WHERE email = ?',
      [
        name, 
        department || null, 
        email_notifs ? 1 : 0, 
        sms_notifs ? 1 : 0, 
        email.toLowerCase()
      ]
    );
    return res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PUT /api/users/password ───────────────
app.put('/api/users/password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'All fields required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  try {
    const [users] = await pool.query('SELECT password FROM users WHERE email = ?', [email.toLowerCase()]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

    const match = await bcrypt.compare(currentPassword, users[0].password);
    if (!match) return res.status(401).json({ message: 'Incorrect current password.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.toLowerCase()]);

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Server error.' });
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

// ═══════════════════════════════════════════
//  FOUND ITEMS & CLAIMS ROUTES
// ═══════════════════════════════════════════

// ── GET /api/found-items — all available found items ──
app.get('/api/found-items', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id, category, location, found_date, description, image_url AS imageUrl, status, created_at AS createdAt
       FROM found_items
       ORDER BY created_at DESC`
    );
    return res.json({ foundItems: rows });
  } catch (err) {
    console.error('Fetch found items error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/found-items — admin uploads a found item ──
app.post('/api/found-items', upload.single('image'), async (req, res) => {
  const { category, location, date, description } = req.body;

  if (!category || !location || !date || !description) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      `INSERT INTO found_items
         (category, location, found_date, description, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [category, location, date, description, imageUrl]
    );

    return res.status(201).json({
      message: 'Found item uploaded successfully.',
      itemId: result.insertId,
    });
  } catch (err) {
    console.error('Upload found item error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/found-items/:id/claim — student claims an item ──
app.post('/api/found-items/:id/claim', upload.single('proofImage'), async (req, res) => {
  const { id } = req.params;
  const { email, name, studentId, phoneNumber, proofDesc } = req.body;

  if (!email || !name || !studentId || !proofDesc) {
    return res.status(400).json({ message: 'All required fields must be provided.' });
  }

  const proofImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Check if item is available
    const [items] = await pool.query('SELECT status FROM found_items WHERE id = ?', [id]);
    if (items.length === 0) return res.status(404).json({ message: 'Item not found.' });
    if (items[0].status !== 'available') return res.status(400).json({ message: 'Item is not available for claim.' });

    // Insert claim
    const [result] = await pool.query(
      `INSERT INTO claims
         (found_item_id, student_email, phone_number, student_name, student_id, proof_desc, proof_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, email.toLowerCase(), phoneNumber || null, name, studentId, proofDesc, proofImageUrl]
    );

    return res.status(201).json({ message: 'Claim submitted successfully.', claimId: result.insertId });
  } catch (err) {
    console.error('Submit claim error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/claims — admin gets all claims ──
app.get('/api/claims', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         c.id, c.found_item_id as foundItemId, c.student_email as studentEmail, c.phone_number as phoneNumber, c.student_name as studentName, c.student_id as studentId,
         c.proof_desc as proofDesc, c.proof_image_url as proofImageUrl, c.status as claimStatus, c.created_at as createdAt,
         f.category, f.location, f.description, f.image_url as imageUrl
       FROM claims c
       JOIN found_items f ON c.found_item_id = f.id
       ORDER BY c.created_at DESC`
    );
    return res.json({ claims: rows });
  } catch (err) {
    console.error('Fetch claims error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/claims/:id/status — admin updates claim status ──
app.patch('/api/claims/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    // Start transaction if approving, so we also update found_items
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE claims SET status = ? WHERE id = ?', [status, id]);

      if (status === 'approved') {
        // Find the found_item_id
        const [claims] = await connection.query('SELECT found_item_id FROM claims WHERE id = ?', [id]);
        if (claims.length > 0) {
          const itemId = claims[0].found_item_id;
          await connection.query('UPDATE found_items SET status = "claimed" WHERE id = ?', [itemId]);
        }
      }

      await connection.commit();
      connection.release();
      return res.json({ message: `Claim ${status} successfully.` });

    } catch (txErr) {
      await connection.rollback();
      connection.release();
      throw txErr;
    }
  } catch (err) {
    console.error('Update claim status error:', err);
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
