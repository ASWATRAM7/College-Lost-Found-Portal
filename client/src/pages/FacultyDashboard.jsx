import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// ── FacultyDashboard ────────────────────────────────────────
// Demonstrates:
//   • useState  — user, all reports list, filter, section
//   • useEffect — load user, fetch ALL reports from server
export default function FacultyDashboard() {
  const navigate = useNavigate();

  // ── useState ──────────────────────────────────────────────
  const [user,          setUser]          = useState(null);
  const [reports,       setReports]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [greeting,      setGreeting]      = useState('');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [filterStatus,  setFilterStatus]  = useState('all'); // 'all' | 'pending' | 'found'
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
      const res  = await fetch('http://localhost:5000/api/reports/all');
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
      await fetch(`http://localhost:5000/api/reports/${id}/status`, {
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
              <button className="nav-item active">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                All Reports
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
            {/* CONTROLLED: search input */}
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search by item, location or student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* CONTROLLED: status filter */}
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

          {/* Reports */}
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
        </main>
      </div>
    </div>
  );
}
