const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const bcrypt     = require('bcryptjs');
const multer     = require('multer');

// ─────────────────────────────────────────────
//  Setup
// ─────────────────────────────────────────────
const app  = express();
const PORT = 5000;

// JSON file "databases"
const DB_DIR     = path.join(__dirname, 'data');
const USERS_FILE   = path.join(DB_DIR, 'users.json');
const REPORTS_FILE = path.join(DB_DIR, 'reports.json');
const UPLOADS_DIR  = path.join(__dirname, 'uploads');

// Ensure directories and files exist
[DB_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(USERS_FILE))   fs.writeFileSync(USERS_FILE,   JSON.stringify([]));
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, JSON.stringify([]));

// ─────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR)); // serve uploaded images

// ─────────────────────────────────────────────
//  Multer — file upload for lost item images
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed.'), ok);
  },
});

// ─────────────────────────────────────────────
//  Helper: read / write JSON files
// ─────────────────────────────────────────────
function readJSON(file)        { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const COLLEGE_DOMAIN = 'kongu.edu';

// ═══════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate fields
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

  const users = readJSON(USERS_FILE);
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: 'This email is already registered.' });
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    name:  name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  return res.status(201).json({ message: 'Account created successfully.' });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!email.toLowerCase().endsWith('@' + COLLEGE_DOMAIN)) {
    return res.status(400).json({ message: `Only @${COLLEGE_DOMAIN} emails are allowed.` });
  }

  const users = readJSON(USERS_FILE);
  const user  = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );

  if (!user) {
    return res.status(401).json({ message: 'No account found with this email and role.' });
  }

  // Compare password with bcrypt hash
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  // Return user info (no real JWT for now — token is a placeholder)
  return res.json({
    message: 'Login successful.',
    token: `mock-token-${user.id}`,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ═══════════════════════════════════════════
//  REPORTS ROUTES
// ═══════════════════════════════════════════

// POST /api/reports — student submits a lost item report
app.post('/api/reports', upload.single('image'), (req, res) => {
  const { category, location, date, time, description, email, name } = req.body;

  if (!category || !location || !date || !time || !description || !email) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const reports  = readJSON(REPORTS_FILE);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const report = {
    id: Date.now().toString(),
    email: email.toLowerCase(),
    name,
    category,
    location,
    date,
    time,
    description,
    imageUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  reports.push(report);
  writeJSON(REPORTS_FILE, reports);

  return res.status(201).json({ message: 'Report submitted.', report });
});

// GET /api/reports?email=... — get reports for a specific student
app.get('/api/reports', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const reports  = readJSON(REPORTS_FILE);
  const myReports = reports
    .filter((r) => r.email.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json({ reports: myReports });
});

// GET /api/reports/all — faculty gets all reports
app.get('/api/reports/all', (req, res) => {
  const reports = readJSON(REPORTS_FILE)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json({ reports });
});

// PATCH /api/reports/:id/status — faculty marks item as found
app.patch('/api/reports/:id/status', (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!['pending', 'found'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  const reports = readJSON(REPORTS_FILE);
  const idx     = reports.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Report not found.' });

  reports[idx].status    = status;
  reports[idx].updatedAt = new Date().toISOString();
  writeJSON(REPORTS_FILE, reports);

  return res.json({ message: 'Status updated.', report: reports[idx] });
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  KEC Lost & Found Server running at http://localhost:${PORT}\n`);
});
