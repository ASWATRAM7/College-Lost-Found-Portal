import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const CATEGORIES = [
  'Mobile Phone', 'Laptop / Tablet', 'Charger / Cable', 'Earphones / Headphones',
  'Wallet / Purse', 'ID Card / College Card', 'Keys', 'Water Bottle', 'Umbrella',
  'Books / Notes', 'Calculator', 'Pen Drive / Hard Disk', 'Spectacles / Sunglasses',
  'Watch', 'Bag / Backpack', 'Clothing / Accessories', 'Lab Equipment',
  'Sports Equipment', 'Other',
];

const LOCATIONS = [
  'IT PARK', 'ADMIN BLOCK', 'SCIENCE AND HUMAINITIES BLOCK', 'EEE & EIE BLOCK',
  'Library', 'ECE BLOCK', 'MBA BLOCK', 'Mechanical Workshop', 'MECHANICAL BLOCK',
  'NATUROPATHY BLOCK', 'AIDS BLOCK', 'Auditorium', 'Food Court', 'Boys Hostel',
  'KEC Bus Stand', 'Sports Ground', 'Gymnasium',
  'Placement Cell', 'Corridor / Staircase', 'Washroom Area', 'Main Gate Area',
  'Garden / Open Area', 'Other',
];

// ── FacultyDashboard ────────────────────────────────────────
// Demonstrates:
//   • useState  — user, all reports list, filter, section
//   • useEffect — load user, fetch ALL reports from server

// ── UploadFoundItem Component ─────────────────────────────
function UploadFoundItem({ onSuccess }) {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const imageRef = useRef(null);

  function handleImageChange() {
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
    if (imageRef.current) imageRef.current.value = '';
    setImagePreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!category || !location || !date || !description.trim()) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('location', location);
      formData.append('date', date);
      formData.append('description', description);
      if (imageRef.current?.files[0]) formData.append('image', imageRef.current.files[0]);

      const res = await fetch('/api/found-items', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.message || 'Failed to submit.', type: 'error' });
        return;
      }
      setMessage({ text: 'Found item uploaded successfully!', type: 'success' });
      setCategory(''); setLocation(''); setDescription('');
      if (imageRef.current) imageRef.current.value = '';
      setImagePreview(null);
      if (onSuccess) onSuccess();
    } catch {
      setMessage({ text: 'Server error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="report-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="form-group">
          <label>Item Category</label>
          <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Location Found</label>
          <select className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} required>
            <option value="" disabled>Select a location</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date Found</label>
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="form-group full-width">
        <label>Description & Condition</label>
        <textarea className="form-control" rows={3} placeholder="Describe the found item..." value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="form-group full-width">
        <label>Item Image</label>
        <input type="file" ref={imageRef} accept="image/*" onChange={handleImageChange} hidden />
        <div className={`upload-area ${imagePreview ? 'has-image' : ''}`} onClick={() => imageRef.current?.click()}>
          {imagePreview ? <img className="img-preview" src={imagePreview} alt="preview" /> :
            <div className="upload-placeholder">
              <svg className="upload-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="6" y="10" width="36" height="28" rx="4" fill="none" />
                <circle cx="18" cy="22" r="4" fill="none" />
                <path d="M6 34l10-10 8 8 6-6 12 12" fill="none" />
              </svg>
              <p className="upload-text">Click to upload an image</p>
            </div>
          }
        </div>
        {imagePreview && <button type="button" className="remove-img-btn" onClick={removeImage}>Remove Image</button>}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload Item'}</button>
      </div>
      {message.text && <p className={`form-msg ${message.type}`}>{message.text}</p>}
    </form>
  );
}

// ── ManageClaims Component ─────────────────────────────
function ManageClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  async function fetchClaims() {
    try {
      const res = await fetch('/api/claims');
      const data = await res.json();
      setClaims(data.claims || []);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateClaimStatus(id, newStatus) {
    try {
      const res = await fetch(`/api/claims/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchClaims(); // refresh
    } catch (e) {
      alert('Error updating claim');
    }
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading claims...</p>;

  return (
    <div className="reports-list">
      {claims.length === 0 ? <p className="no-reports">No claims available.</p> : claims.map(claim => (
        <div key={claim.id} className="report-card">
          <div className="card-body">
            <h3 className="card-category">Claim for: {claim.category} (Item #{claim.foundItemId})</h3>
            <p className="card-meta">
              <strong>Student:</strong> {claim.studentName} ({claim.studentId})<br />
              <strong>Contact:</strong> {claim.studentEmail} {claim.phoneNumber ? `| Ph: ${claim.phoneNumber}` : ''}
            </p>
            <div className="card-desc" style={{ marginTop: '12px', background: 'var(--bg-default)', padding: '12px', borderRadius: '6px' }}>
              <strong>Proof of Ownership Description:</strong><br />
              {claim.proofDesc}
            </div>
            {claim.proofImageUrl && (
              <div style={{ marginTop: '12px' }}>
                <a href={`http://localhost:5000${claim.proofImageUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--student-primary)', textDecoration: 'underline', fontSize: '0.85rem' }}>
                  View Attached Proof Evidence
                </a>
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className={`status-badge ${claim.claimStatus === 'approved' ? 'status-found' : claim.claimStatus === 'rejected' ? 'status-pending' : ''}`}>
                Status: {claim.claimStatus.toUpperCase()}
              </span>
              {claim.claimStatus === 'pending' && (
                <>
                  <button className="btn-primary" style={{ padding: '6px 12px' }} onClick={() => updateClaimStatus(claim.id, 'approved')}>Approve</button>
                  <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => updateClaimStatus(claim.id, 'rejected')}>Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FacultyDashboard() {
  const navigate = useNavigate();

  // ── useState ──────────────────────────────────────────────
  const [user,          setUser]          = useState(null);
  const [reports,       setReports]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [greeting,      setGreeting]      = useState('');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [filterStatus,  setFilterStatus]  = useState('all'); // 'all' | 'pending' | 'found'
  const [activeSection, setActiveSection] = useState('all-reports');
  const [searchTerm,    setSearchTerm]    = useState('');
  // ─────────────────────────────────────────────────────────

  // ── useEffect: load user + fetch all reports ──────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('loggedInUser');
    if (!raw) { navigate('/', { replace: true }); return; }
    const u = JSON.parse(raw);
    if (u.role !== 'faculty') { navigate('/', { replace: true }); return; }
    setUser(u);

    const hour = new Date().getHours();
    const g = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    setGreeting(`${g}, ${u.name.split(' ')[0]}`);

    fetchAllReports();
  }, [navigate]);
  // ─────────────────────────────────────────────────────────

  async function fetchAllReports() {
    setLoading(true);
    try {
      const res  = await fetch('/api/reports/all');
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  // Mark a report as found
  async function markAsFound(id) {
    try {
      await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'found' }),
      });
      // Update state locally without full refetch
      setReports((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'found' } : r)
      );
    } catch {
      alert('Failed to update. Please try again.');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    localStorage.removeItem('loggedInUser');
    navigate('/', { replace: true });
  }

  // ── Filter reports based on status + search ───────────────
  const filteredReports = reports.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      r.category.toLowerCase().includes(term) ||
      r.location.toLowerCase().includes(term) ||
      r.name.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────
  const totalCount   = reports.length;
  const pendingCount = reports.filter((r) => r.status !== 'found').length;
  const foundCount   = reports.filter((r) => r.status === 'found').length;

  if (!user) return null;

  return (
    <div className="dashboard faculty-theme">
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">KEC</div>
          <div className="brand-text">
            <span className="brand-name">Lost &amp; Found</span>
            <span className="brand-role">Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Faculty Navigation">
          <p className="nav-label">Management</p>
          <ul className="nav-list">
            <li>
              <button className={`nav-item ${activeSection === 'all-reports' ? 'active' : ''}`} onClick={() => setActiveSection('all-reports')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                All Reports
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'upload-found' ? 'active' : ''}`} onClick={() => setActiveSection('upload-found')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload Found Item
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'claims' ? 'active' : ''}`} onClick={() => setActiveSection('claims')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                </svg>
                Manage Claims
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
          <div className="topbar-title"><h2>Admin Dashboard</h2></div>
          <div className="topbar-right">
            <span className="admin-badge">Admin</span>
            <span className="topbar-greeting">{greeting}</span>
          </div>
        </header>

        <main className="page-content">
          {activeSection === 'all-reports' && (
            <>
              <div className="section-header">
                <h2 className="section-title">All Lost Item Reports</h2>
                <p className="section-desc">Review, search and manage all student reported items.</p>
              </div>

              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-number">{totalCount}</span>
                  <span className="stat-label">Total Reports</span>
                </div>
                <div className="stat-card pending">
                  <span className="stat-number">{pendingCount}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-card found">
                  <span className="stat-number">{foundCount}</span>
                  <span className="stat-label">Found</span>
                </div>
              </div>

              {/* Filters */}
              <div className="filters-row">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search by item, location or student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="form-control filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="found">Found</option>
                </select>
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>Loading reports...</p>
              ) : filteredReports.length === 0 ? (
                <div className="no-reports">
                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M14 18h36M14 26h36M14 34h24"/>
                  </svg>
                  <h3>No reports found</h3>
                  <p>No items match the current filter.</p>
                </div>
              ) : (
                <div className="reports-list">
                  {filteredReports.map((report) => {
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
                            <span>Reported by: {report.name}</span>
                          </div>
                          <p className="card-desc">{report.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <span className={`status-badge ${report.status === 'found' ? 'status-found' : 'status-pending'}`}>
                              {report.status === 'found' ? 'Found' : 'Pending'}
                            </span>
                            {report.status !== 'found' && (
                              <button className="mark-found-btn" onClick={() => markAsFound(report.id)}>
                                Mark as Found
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeSection === 'upload-found' && (
            <>
              <div className="section-header">
                <h2 className="section-title">Upload Found Item</h2>
                <p className="section-desc">Add details of an item found on campus so students can claim it.</p>
              </div>
              <UploadFoundItem onSuccess={() => setActiveSection('all-reports')} />
            </>
          )}

          {activeSection === 'claims' && (
            <>
              <div className="section-header">
                <h2 className="section-title">Manage Claims</h2>
                <p className="section-desc">Review and approve or reject item claims made by students.</p>
              </div>
              <ManageClaims />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
