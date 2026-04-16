import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// ── Data constants ─────────────────────────────────────────
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
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              My Reports
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${activeSection === 'found-items' ? 'active' : ''}`}
              onClick={() => onNavigate('found-items')}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Available Items
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
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('30');
  const [period, setPeriod] = useState('AM');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
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

    if (!category || !location || !date || !hour || !minute || !period || !description.trim()) {
      setMessage({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    // Convert 12-hour AM/PM to 24-hour format for MySQL 'TIME' column compatibility
    let h = parseInt(hour, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const formattedTime = `${h.toString().padStart(2, '0')}:${minute}:00`;

    setLoading(true);

    try {
      // Read the file from the uncontrolled ref
      const file = imageRef.current?.files[0];
      const formData = new FormData();
      formData.append('category', category);
      formData.append('location', location);
      formData.append('date', date);
      formData.append('time', formattedTime);
      formData.append('description', description);
      formData.append('email', user.email);
      formData.append('name', user.name);
      if (file) formData.append('image', file);

      const res = await fetch('/api/reports', {
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
      setCategory(''); setLocation(''); setHour('08'); setMinute('30'); setPeriod('AM'); setDescription('');
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
    setCategory(''); setLocation(''); setHour('08'); setMinute('30'); setPeriod('AM'); setDescription('');
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

        {/* CONTROLLED: custom time dropdowns */}
        <div className="form-group">
          <label>Approximate Time</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="form-control" value={hour} onChange={(e) => setHour(e.target.value)} style={{ flex: 1 }}>
              {[...Array(12)].map((_, i) => {
                const val = (i + 1).toString().padStart(2, '0');
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>:</span>
            <select className="form-control" value={minute} onChange={(e) => setMinute(e.target.value)} style={{ flex: 1 }}>
              {['00', '15', '30', '45'].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <select className="form-control" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ flex: 1 }}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
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
                <rect x="6" y="10" width="36" height="28" rx="4" fill="none" />
                <circle cx="18" cy="22" r="4" fill="none" />
                <path d="M6 34l10-10 8 8 6-6 12 12" fill="none" />
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
        const res = await fetch(`/api/reports?email=${encodeURIComponent(user.email)}`);
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
          <path d="M14 18h36M14 26h36M14 34h24" />
          <circle cx="48" cy="48" r="10" fill="none" />
          <path d="M52 44l-8 8M44 44l8 8" />
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
                    <rect x="6" y="10" width="36" height="28" rx="4" fill="none" />
                    <circle cx="18" cy="22" r="4" fill="none" />
                    <path d="M6 34l10-10 8 8 6-6 12 12" fill="none" />
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

// ── Check if an object is empty ────────────────────────────
// Helper for claim module
// ── FoundItems component ───────────────────────────────────
function FoundItems({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [claimingItem, setClaimingItem] = useState(null);
  
  // Claim form state
  const [claimName, setClaimName] = useState(user.name || '');
  const [claimEmail, setClaimEmail] = useState(user.email || '');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [claimStatus, setClaimStatus] = useState({ text: '', type: '' });
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const proofImageRef = useRef(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);

  function handleProofImageChange() {
    const file = proofImageRef.current?.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Proof image must be under 5 MB.');
      proofImageRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setProofImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function resetClaimForm() {
    setClaimingItem(null);
    setStudentId('');
    setPhoneNumber('');
    setProofDesc('');
    setClaimStatus({ text: '', type: '' });
    setProofImagePreview(null);
    if (proofImageRef.current) proofImageRef.current.value = '';
  }

  useEffect(() => {
    fetchFoundItems();
  }, []);

  async function fetchFoundItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/found-items');
      const data = await res.json();
      setItems(data.foundItems || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function submitClaim(e) {
    e.preventDefault();
    if (!claimName.trim() || !studentId.trim() || !claimEmail.trim() || !proofDesc.trim()) {
      setClaimStatus({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }
    setSubmittingClaim(true);
    try {
      const formData = new FormData();
      formData.append('name', claimName);
      formData.append('email', claimEmail);
      formData.append('studentId', studentId);
      formData.append('phoneNumber', phoneNumber);
      formData.append('proofDesc', proofDesc);
      if (proofImageRef.current?.files[0]) {
        formData.append('proofImage', proofImageRef.current.files[0]);
      }

      const res = await fetch(`/api/found-items/${claimingItem.id}/claim`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimStatus({ text: data.message || 'Failed to submit claim.', type: 'error' });
      } else {
        setClaimStatus({ text: 'Claim submitted successfully! The admin will review it.', type: 'success' });
        setTimeout(() => {
          resetClaimForm();
        }, 3000);
      }
    } catch {
      setClaimStatus({ text: 'Server error. Please try again.', type: 'error' });
    } finally {
      setSubmittingClaim(false);
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)', paddingTop: '20px' }}>Loading available items...</p>;
  }

  const availableItems = items.filter(img => img.status === 'available');

  return (
    <div className="found-items-container">
      <div className="items-header">
        <p className="item-count">{availableItems.length} items found</p>
      </div>

      <div className="items-grid">
        {availableItems.length === 0 ? (
          <div className="no-reports">
            <p>No available found items right now.</p>
          </div>
        ) : (
          availableItems.map(item => {
            const formattedDate = new Date(item.found_date).toLocaleDateString('en-IN');
            return (
              <div key={item.id} className="found-item-card">
                <div className="card-image-wrapper">
                  {item.imageUrl ? (
                    <img src={`http://localhost:5000${item.imageUrl}`} alt={item.category} className="item-main-img" />
                  ) : (
                    <div className="card-no-img placeholder-item">
                      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="10" width="36" height="28" rx="4"></rect><circle cx="18" cy="22" r="4"></circle><path d="M6 34l10-10 8 8 6-6 12 12"></path></svg>
                    </div>
                  )}
                </div>
                
                <div className="item-card-content">
                  <div className="item-card-header">
                    <h3 className="item-title">{item.category}</h3>
                    <span className="availability-badge">Available</span>
                  </div>
                  
                  <p className="item-card-desc">{item.description}</p>
                  
                  <ul className="item-details-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                      {item.category}
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {item.location}
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      Found on {formattedDate}
                    </li>
                  </ul>

                  <div className="item-card-actions">
                    <button className="btn-text-link">View Details</button>
                    <button className="btn-claim-item" onClick={() => setClaimingItem(item)}>Claim Item</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Claim Modal */}
      {claimingItem && (
        <div className="modal-overlay">
          <div className="modal-content claim-modal">
            <button className="modal-close" onClick={resetClaimForm}>&times;</button>
            <div className="modal-header">
              <h2>Claim Item</h2>
              <p className="modal-subtitle">Provide details to prove this {claimingItem.category} belongs to you.</p>
            </div>
            
            <form onSubmit={submitClaim} className="ext-claim-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter your full name"
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Student ID *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="E.g., 22EC123"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <h3 className="section-subtitle-small">Contact Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="your.email@kongu.edu"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number (Optional)</label>
                  <div className="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group full-width" style={{ marginTop: '10px' }}>
                <label>Description of Ownership *</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Please describe how you own this item, when and where you lost it, any distinguishing features, etc."
                  value={proofDesc}
                  onChange={(e) => setProofDesc(e.target.value)}
                  required
                />
                <p className="upload-hint">Provide detailed information to help verify your ownership</p>
              </div>

              <div className="form-group full-width">
                <label>Upload Proof of Ownership (Optional)</label>
                <input type="file" ref={proofImageRef} accept=".png,.jpg,.jpeg,.pdf" onChange={handleProofImageChange} hidden />
                <div 
                  className={`upload-area claim-upload-area ${proofImagePreview ? 'has-image' : ''}`} 
                  onClick={() => proofImageRef.current?.click()}
                >
                  {proofImagePreview ? (
                    <img className="img-preview mini-preview" src={proofImagePreview} alt="Proof preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <p className="upload-text"><strong>Click to upload</strong> or drag and drop</p>
                      <p className="upload-hint">PNG, JPG, PDF (MAX. 5MB)</p>
                    </div>
                  )}
                </div>
                <p className="upload-hint">Upload receipts, photos, or other documents that prove ownership</p>
              </div>
              
              {claimStatus.text && (
                <div className={`form-msg ${claimStatus.type}`} style={{ margin: '12px 0 0' }}>{claimStatus.text}</div>
              )}

              <div className="form-actions claim-actions">
                <button type="submit" className="btn-primary" disabled={submittingClaim}>
                  {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetClaimForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── OverviewPanel component ──────────────────────────────────
function OverviewPanel({ user, onNavigate }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, found: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [latestReport, setLatestReport] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch User Stats
        const statRes = await fetch(`/api/reports?email=${encodeURIComponent(user.email)}`);
        const statData = await statRes.json();
        const reports = statData.reports || [];
        setStats({
          total: reports.length,
          pending: reports.filter(r => r.status === 'pending').length,
          found: reports.filter(r => r.status === 'found').length
        });
        setLatestReport(reports.length > 0 ? reports[0] : null);

        // Fetch Recent Found Items
        const recentRes = await fetch('/api/found-items');
        const recentData = await recentRes.json();
        const items = recentData.foundItems || [];
        // Show only the 3 most recent available items
        setRecentItems(items.filter(i => i.status === 'available').slice(0, 3));
      } catch (err) {
        console.error("Failed to load overview data", err);
      }
    }
    fetchData();
  }, [user.email]);

  return (
    <div className="overview-panel">
      <div className="welcome-banner">
        <div className="banner-text">
          <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
          <p>Here’s an overview of your activity on the KEC Lost & Found portal.</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('report')}>
          + Report an Item
        </button>
      </div>
      
      <h3 className="section-subtitle">Your Statistics</h3>
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-icon purple-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Reports</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orange-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Search</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.found}</span>
            <span className="stat-label">Successfully Found</span>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        {/* Live Report Tracker Column */}
        <div className="overview-card tracker-card">
          <div className="overview-card-header">
            <h3>Live Status Tracker</h3>
          </div>
          <div className="tracker-wrapper">
            {!latestReport ? (
              <div className="tracker-empty">
                <div className="tracker-radar-anim">
                  <span className="radar-circle"></span>
                  <span className="radar-circle delay"></span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6M19 11a8 8 0 10-16 0 8 8 0 0016 0z"></path></svg>
                </div>
                <h4>No Active Searches</h4>
                <p>You haven't reported any lost items recently. If you misplace something, register it immediately to initiate a campus search.</p>
                <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('report')}>Initiate Trace Protocol</button>
              </div>
            ) : (
              <div className="tracker-active">
                <div className="tracker-meta">
                  <div className="tracker-meta-header">
                    <span className="tracker-id">Case #{latestReport.id.toString().padStart(4, '0')}</span>
                    <span className={`status-badge ${latestReport.status === 'found' ? 'status-found' : 'status-pending'}`}>
                      {latestReport.status.toUpperCase()}
                    </span>
                  </div>
                  <h4>{latestReport.category}</h4>
                  <p>Lost heavily around <strong>{latestReport.location}</strong> on {new Date(latestReport.date).toLocaleDateString()}</p>
                </div>
                
                <div className="tracker-pipeline">
                  <div className={`pipeline-node completed`}>
                    <div className="node-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                    <div className="node-text">Report Logged</div>
                  </div>
                  
                  <div className={`pipeline-line ${latestReport.status === 'found' ? 'completed' : 'pulsing'}`}></div>
                  
                  <div className={`pipeline-node ${latestReport.status === 'found' ? 'completed' : 'pulsing-node'}`}>
                    <div className="node-icon">
                      {latestReport.status === 'found' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : (
                        <div className="loader-ring"></div>
                      )}
                    </div>
                    <div className="node-text">Active Search</div>
                  </div>
                  
                  <div className={`pipeline-line ${latestReport.status === 'found' ? 'completed' : ''}`}></div>
                  
                  <div className={`pipeline-node ${latestReport.status === 'found' ? 'completed finale' : 'pending'}`}>
                    <div className="node-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div className="node-text">Successfully Found</div>
                  </div>
                </div>

                {latestReport.status === 'found' && (
                  <div className="tracker-success-msg">
                    <strong>Great news!</strong> Your item has been located and secured. Please visit the admin office corresponding to the location to retrieve it.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Items Column */}
        <div className="overview-card">
          <div className="overview-card-header">
            <h3>Recently Found on Campus</h3>
          </div>
          <div className="recent-items-feed">
            {recentItems.length === 0 ? (
              <div className="empty-feed">
                <p>No recently available items.</p>
              </div>
            ) : (
              recentItems.map((item) => (
                <div key={item.id} className="feed-item">
                  {item.imageUrl ? (
                    <img src={`http://localhost:5000${item.imageUrl}`} alt="item" className="feed-item-img" />
                  ) : (
                    <div className="feed-item-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                  )}
                  <div className="feed-item-details">
                    <div className="feed-item-head">
                      <h4>{item.category}</h4>
                      <span className="feed-item-date">{new Date(item.found_date || item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="feed-item-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {item.location}
                    </p>
                  </div>
                </div>
              ))
            )}
            {recentItems.length > 0 && (
              <button className="view-all-btn" onClick={() => onNavigate('found-items')}>
                View All Available Items
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ProfilePanel component ──────────────────────────────────
function ProfilePanel({ user }) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  
  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);

  // Edit Profile form state
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editMsg, setEditMsg] = useState({ text: '', type: '' });

  // Change Password form state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, [user.email]);

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/users/profile?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (res.ok) {
        setProfileData(data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateNotificationSettings(field, value) {
    if (!profileData) return;
    const updated = { ...profileData, [field]: value };
    setProfileData(updated); // Optimistic UI update
    
    try {
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: updated.name,
          department: updated.department,
          email_notifs: updated.email_notifs,
          sms_notifs: updated.sms_notifs
        })
      });
    } catch (err) {
      console.error('Failed to update notifs', err);
    }
  }

  function openEditProfile() {
    setEditName(profileData.name || '');
    setEditDepartment(profileData.department || '');
    setEditMsg({ text: '', type: '' });
    setShowEditProfile(true);
  }

  async function submitEditProfile(e) {
    e.preventDefault();
    if (!editName.trim()) {
      setEditMsg({ text: 'Name is required.', type: 'error' });
      return;
    }
    
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: editName,
          department: editDepartment,
          email_notifs: profileData.email_notifs,
          sms_notifs: profileData.sms_notifs
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMsg({ text: data.message || 'Update failed', type: 'error' });
      } else {
        setEditMsg({ text: 'Profile updated successfully!', type: 'success' });
        // Update user session natively (simplification)
        const cachedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
        cachedUser.name = editName;
        sessionStorage.setItem('loggedInUser', JSON.stringify(cachedUser));
        
        setTimeout(() => {
          setShowEditProfile(false);
          fetchProfile(); // refresh data
        }, 1500);
      }
    } catch (err) {
      setEditMsg({ text: 'Server error.', type: 'error' });
    }
  }

  function openChangePassword() {
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdMsg({ text: '', type: '' });
    setShowChangePwd(true);
  }

  async function submitChangePassword(e) {
    e.preventDefault();
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ text: 'All fields are required.', type: 'error' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword: currentPwd,
          newPassword: newPwd
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdMsg({ text: data.message || 'Update failed.', type: 'error' });
      } else {
        setPwdMsg({ text: 'Password successfully changed!', type: 'success' });
        setTimeout(() => setShowChangePwd(false), 2000);
      }
    } catch (err) {
      setPwdMsg({ text: 'Server error.', type: 'error' });
    }
  }

  if (loading) return <p style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading profile...</p>;
  if (!profileData) return <p style={{ color: 'var(--text-secondary)', padding: '20px' }}>Failed to load profile.</p>;

  // Format created_at safely
  let memberSince = 'N/A';
  if (profileData.created_at) {
    const d = new Date(profileData.created_at);
    memberSince = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return (
    <div className="profile-container">
      {/* Banner & Header */}
      <div className="profile-banner">
        <div className="banner-overlay"></div>
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-huge">
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <div className="avatar-ring"></div>
        </div>
      </div>

      <div className="profile-content-grid">
        {/* Left Column: ID Card */}
        <div className="profile-id-card">
          <div className="id-card-header">
            <h3>Student ID Profile</h3>
            <span className="status-badge status-found">Active</span>
          </div>
          
          <div className="id-info-stack">
            <h2 className="profile-name-main">{profileData.name}</h2>
            <p className="profile-role-tag">Kongu Engineering College</p>
          </div>

          <div className="id-details-list">
            <div className="id-detail-item">
              <span className="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <div className="detail-text">
                <label>College Email</label>
                <span>{profileData.email}</span>
              </div>
            </div>
            
            <div className="id-detail-item">
              <span className="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              </span>
              <div className="detail-text">
                <label>Department</label>
                {profileData.department ? (
                  <span>{profileData.department}</span>
                ) : (
                  <span className="pending-text">Not Set (Update Profile)</span>
                )}
              </div>
            </div>

            <div className="id-detail-item">
              <span className="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </span>
              <div className="detail-text">
                <label>Member Since</label>
                <span>{memberSince}</span>
              </div>
            </div>
          </div>

          <button className="btn-primary edit-profile-btn" onClick={openEditProfile}>
            Edit Profile Details
          </button>
        </div>

        {/* Right Column: Settings & Options */}
        <div className="profile-settings-column">

          {/* Security Card */}
          <div className="settings-card">
            <div className="settings-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <h3>Security & Account</h3>
            </div>
            <div className="settings-action-list">
              <button className="action-row-btn" onClick={openChangePassword}>
                <div className="action-text">
                  <h4>Change Password</h4>
                  <p>Update your account security</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <button className="modal-close" onClick={() => setShowEditProfile(false)}>&times;</button>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <p className="modal-subtitle">Update your personal details below.</p>
            </div>
            <form onSubmit={submitEditProfile}>
              <div className="form-group full-width">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group full-width" style={{ marginTop: '16px' }}>
                <label>Department</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Computer Science and Engineering"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                />
              </div>
              
              {editMsg.text && (
                <div className={`form-msg ${editMsg.type}`} style={{ marginTop: '12px' }}>{editMsg.text}</div>
              )}

              <div className="form-actions" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfile(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePwd && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <button className="modal-close" onClick={() => setShowChangePwd(false)}>&times;</button>
            <div className="modal-header">
              <h2>Change Password</h2>
              <p className="modal-subtitle">Ensure your account uses a strong, secure password.</p>
            </div>
            <form onSubmit={submitChangePassword}>
              <div className="form-group full-width">
                <label>Current Password *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group full-width" style={{ marginTop: '16px' }}>
                <label>New Password *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group full-width" style={{ marginTop: '16px' }}>
                <label>Confirm New Password *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required 
                />
              </div>
              
              {pwdMsg.text && (
                <div className={`form-msg ${pwdMsg.type}`} style={{ marginTop: '12px' }}>{pwdMsg.text}</div>
              )}

              <div className="form-actions" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn-primary">Update Password</button>
                <button type="button" className="btn-secondary" onClick={() => setShowChangePwd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [greeting, setGreeting] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard Overview');
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
    const titles = { 
      'overview': 'Dashboard Overview',
      'report': 'Report Lost Item', 
      'my-reports': 'My Reports',
      'found-items': 'Available Found Items',
      'profile': 'My Profile'
    };
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
              <button className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => handleNavigate('overview')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Dashboard Overview
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'report' ? 'active' : ''}`} onClick={() => handleNavigate('report')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Report Lost Item
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'my-reports' ? 'active' : ''}`} onClick={() => handleNavigate('my-reports')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                My Reports
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'found-items' ? 'active' : ''}`} onClick={() => handleNavigate('found-items')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Available Items
              </button>
            </li>
            <li>
              <button className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => handleNavigate('profile')}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Profile
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
          {activeSection === 'overview' && (
            <OverviewPanel user={user} onNavigate={handleNavigate} />
          )}

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

          {activeSection === 'found-items' && (
            <>
              <div className="section-header">
                <h2 className="section-title">Available Found Items</h2>
                <p className="section-desc">Items recovered on campus. Claim them if they belong to you.</p>
              </div>
              <FoundItems user={user} />
            </>
          )}

          {activeSection === 'profile' && (
            <ProfilePanel user={user} />
          )}
        </main>
      </div>
    </div>
  );
}
