import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// ── Data constants ─────────────────────────────────────────
const CATEGORIES = [
  'Mobile Phone','Laptop / Tablet','Charger / Cable','Earphones / Headphones',
  'Wallet / Purse','ID Card / College Card','Keys','Water Bottle','Umbrella',
  'Books / Notes','Calculator','Pen Drive / Hard Disk','Spectacles / Sunglasses',
  'Watch','Bag / Backpack','Clothing / Accessories','Lab Equipment',
  'Sports Equipment','Other',
];

const LOCATIONS = [
  'Classroom Block A','Classroom Block B','Classroom Block C','Classroom Block D',
  'Library','Computer Lab','Electronics Lab','Mechanical Workshop','Physics Lab',
  'Chemistry Lab','Seminar Hall','Auditorium','Canteen / Food Court','Hostel',
  'Bus Stand / Parking','Sports Ground','Gymnasium','Admin Block',
  'Placement Cell','Corridor / Staircase','Washroom Area','Main Gate Area',
  'Garden / Open Area','Other',
];

// ── Sidebar component ──────────────────────────────────────
function Sidebar({ user, activeSection, onNavigate, onLogout }) {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">KEC</div>
        <div className="brand-text">
          <span className="brand-name">Lost &amp; Found</span>
          <span className="brand-role">Student Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Student Navigation">
        <p className="nav-label">Navigation</p>
        <ul className="nav-list">
          <li>
            <button
              className={`nav-item ${activeSection === 'report' ? 'active' : ''}`}
              onClick={() => onNavigate('report')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Report Lost Item
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeSection === 'my-reports' ? 'active' : ''}`}
              onClick={() => onNavigate('my-reports')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              My Reports
            </button>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'S'}</div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'Student'}</span>
            <span className="user-email">{user?.email || ''}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
}

// ── ReportForm component ───────────────────────────────────
// Demonstrates:
//   • useState       — all form field values (controlled inputs)
//   • useRef         — image file input (uncontrolled component)
//   • useEffect      — set today's date on mount
//   • controlled     — category, location, date, time, description (via state)
//   • uncontrolled   — the file <input> itself managed through a ref
function ReportForm({ user, onSuccess }) {
  // ── CONTROLLED STATE (all text/select/date/time fields) ────
  const [category,    setCategory]    = useState('');
  const [location,    setLocation]    = useState('');
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [message,     setMessage]     = useState({ text: '', type: '' });
  const [loading,     setLoading]     = useState(false);
  // ──────────────────────────────────────────────────────────

  // ── UNCONTROLLED — image file input managed via ref ────────
  // We do NOT store the file object in state; we access the
  // DOM element directly through imageRef.current.files[0]
  const imageRef = useRef(null);
  // ──────────────────────────────────────────────────────────

  // ── useEffect: set default date to today on mount ─────────
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);
  // ──────────────────────────────────────────────────────────

  // ── Image preview — reads the uncontrolled ref ────────────
  function handleImageChange() {
    // Access uncontrolled input via ref
    const file = imageRef.current?.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      imageRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    // Clear the uncontrolled input via ref
    if (imageRef.current) imageRef.current.value = '';
    setImagePreview(null);
  }

  // ── Form Submit ───────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!category || !location || !date || !time || !description.trim()) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Read the file from the uncontrolled ref
      const file = imageRef.current?.files[0];
      const formData = new FormData();
      formData.append('category',    category);
      formData.append('location',    location);
      formData.append('date',        date);
      formData.append('time',        time);
      formData.append('description', description);
      formData.append('email',       user.email);
      formData.append('name',        user.name);
      if (file) formData.append('image', file);

      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.message || 'Failed to submit.', type: 'error' });
        return;
      }

      setMessage({ text: 'Report submitted successfully! View it in My Reports.', type: 'success' });
      // Reset controlled state
      setCategory(''); setLocation(''); setTime(''); setDescription('');
      // Reset uncontrolled input via ref
      if (imageRef.current) imageRef.current.value = '';
      setImagePreview(null);
      // Reset date to today
      setDate(new Date().toISOString().split('T')[0]);

      if (onSuccess) onSuccess();
    } catch {
      setMessage({ text: 'Cannot reach server. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setCategory(''); setLocation(''); setTime(''); setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    if (imageRef.current) imageRef.current.value = '';
    setImagePreview(null);
    setMessage({ text: '', type: '' });
  }

  return (
    <form className="report-form" onSubmit={handleSubmit} noValidate>

      <div className="form-row">
        {/* CONTROLLED: category select */}
        <div className="form-group">
          <label htmlFor="r-category">Item Category</label>
          <select
            id="r-category"
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* CONTROLLED: location select */}
        <div className="form-group">
          <label htmlFor="r-location">Location Lost</label>
          <select
            id="r-location"
            className="form-control"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          >
            <option value="" disabled>Select a location</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        {/* CONTROLLED: date */}
        <div className="form-group">
          <label htmlFor="r-date">Date Lost</label>
          <input
            id="r-date"
            type="date"
            className="form-control"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* CONTROLLED: time */}
        <div className="form-group">
          <label htmlFor="r-time">Approximate Time</label>
          <input
            id="r-time"
            type="time"
            className="form-control"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* CONTROLLED: description */}
      <div className="form-group full-width">
        <label htmlFor="r-desc">Description</label>
        <textarea
          id="r-desc"
          className="form-control"
          rows={4}
          placeholder="Describe the item — colour, brand, identifying marks..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* UNCONTROLLED: image file input — managed via useRef */}
      <div className="form-group full-width">
        <label>Item Image (optional)</label>

        {/* Hidden file input — uncontrolled, referenced by imageRef */}
        <input
          type="file"
          ref={imageRef}
          accept="image/*"
          onChange={handleImageChange}
          hidden
          id="image-upload"
        />

        <div
          className={`upload-area ${imagePreview ? 'has-image' : ''}`}
          onClick={() => imageRef.current?.click()}
        >
          {imagePreview ? (
            <img className="img-preview" src={imagePreview} alt="Item preview" />
          ) : (
            <div className="upload-placeholder">
              <svg className="upload-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="6" y="10" width="36" height="28" rx="4" fill="none"/>
                <circle cx="18" cy="22" r="4" fill="none"/>
                <path d="M6 34l10-10 8 8 6-6 12 12" fill="none"/>
              </svg>
              <p className="upload-text">Click to upload an image</p>
              <p className="upload-hint">JPG, PNG or WEBP — max 5 MB</p>
            </div>
          )}
        </div>

        {imagePreview && (
          <button type="button" className="remove-img-btn" onClick={removeImage}>
            Remove Image
          </button>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Clear Form
        </button>
      </div>

      {message.text && (
        <p className={`form-msg ${message.type}`}>{message.text}</p>
      )}
    </form>
  );
}

// ── MyReports component ────────────────────────────────────
// Demonstrates:
//   • useState  — list of reports
//   • useEffect — fetch reports from API when component mounts
function MyReports({ user }) {
  // ── useState: reports list & loading ─────────────────────
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  // ─────────────────────────────────────────────────────────

  // ── useEffect: fetch from API on mount ───────────────────
  useEffect(() => {
    async function fetchReports() {
      try {
        const res  = await fetch(`http://localhost:5000/api/reports?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        setReports(data.reports || []);
      } catch {
        setReports([]);
      } finally {
        setLoadingReports(false);
      }
    }
    fetchReports();
  }, [user.email]);
  // ─────────────────────────────────────────────────────────

  if (loadingReports) {
    return <p style={{ color: 'var(--text-secondary)', paddingTop: '20px' }}>Loading your reports...</p>;
  }

  if (reports.length === 0) {
    return (
      <div className="no-reports">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M14 18h36M14 26h36M14 34h24"/>
          <circle cx="48" cy="48" r="10" fill="none"/>
          <path d="M52 44l-8 8M44 44l8 8"/>
        </svg>
        <h3>No reports yet</h3>
        <p>You have not reported any lost items yet.</p>
      </div>
    );
  }

  return (
    <div className="reports-list">
      {reports.map((report) => {
        const d = new Date(`${report.date}T${report.time}`);
        const formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        return (
          <div key={report.id} className="report-card">
            {report.imageUrl
              ? <img className="card-thumb" src={`http://localhost:5000${report.imageUrl}`} alt={report.category} />
              : (
                <div className="card-no-img">
                  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="6" y="10" width="36" height="28" rx="4" fill="none"/>
                    <circle cx="18" cy="22" r="4" fill="none"/>
                    <path d="M6 34l10-10 8 8 6-6 12 12" fill="none"/>
                  </svg>
                </div>
              )
            }
            <div className="card-body">
              <span className="card-category">{report.category}</span>
              <div className="card-meta">
                <span>{report.location}</span>
                <span>{formattedDate}, {formattedTime}</span>
              </div>
              <p className="card-desc">{report.description}</p>
              <span className={`status-badge ${report.status === 'found' ? 'status-found' : 'status-pending'}`}>
                {report.status === 'found' ? 'Found' : 'Pending'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── StudentDashboard (main page) ────────────────────────────
// Demonstrates:
//   • useState  — current section, sidebar open state
//   • useEffect — load user from session, compute greeting
export default function StudentDashboard() {
  const navigate = useNavigate();

  // ── useState ──────────────────────────────────────────────
  const [user,            setUser]            = useState(null);
  const [activeSection,   setActiveSection]   = useState('report');
  const [greeting,        setGreeting]        = useState('');
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [pageTitle,       setPageTitle]       = useState('Report Lost Item');
  // ─────────────────────────────────────────────────────────

  // ── useEffect: load user + time-based greeting ────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('loggedInUser');
    if (!raw) { navigate('/', { replace: true }); return; }

    const u = JSON.parse(raw);
    setUser(u);

    const hour = new Date().getHours();
    const g = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    setGreeting(`${g}, ${u.name.split(' ')[0]}`);
  }, [navigate]);
  // ─────────────────────────────────────────────────────────

  function handleNavigate(section) {
    setActiveSection(section);
    setSidebarOpen(false);
    const titles = { 'report': 'Report Lost Item', 'my-reports': 'My Reports' };
    setPageTitle(titles[section] || 'Dashboard');
  }

  function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    localStorage.removeItem('loggedInUser');
    navigate('/', { replace: true });
  }

  if (!user) return null;

  return (
    <div className="dashboard student-theme">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">KEC</div>
          <div className="brand-text">
            <span className="brand-name">Lost &amp; Found</span>
            <span className="brand-role">Student Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Student Navigation">
          <p className="nav-label">Navigation</p>
          <ul className="nav-list">
            <li>
              <button className={`nav-item ${activeSection === 'report' ? 'active' : ''}`} onClick={() => handleNavigate('report')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Report Lost Item
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'my-reports' ? 'active' : ''}`} onClick={() => handleNavigate('my-reports')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                My Reports
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle sidebar">
            <span /><span /><span />
          </button>
          <div className="topbar-title"><h2>{pageTitle}</h2></div>
          <div className="topbar-right">
            <span className="topbar-greeting">{greeting}</span>
          </div>
        </header>

        <main className="page-content">
          {activeSection === 'report' && (
            <>
              <div className="section-header">
                <h2 className="section-title">Report a Lost Item</h2>
                <p className="section-desc">Fill in the details below to report an item you lost on campus.</p>
              </div>
              <ReportForm user={user} onSuccess={() => handleNavigate('my-reports')} />
            </>
          )}
          {activeSection === 'my-reports' && (
            <>
              <div className="section-header">
                <h2 className="section-title">My Reports</h2>
                <p className="section-desc">All lost items you have reported are listed below.</p>
              </div>
              <MyReports user={user} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
