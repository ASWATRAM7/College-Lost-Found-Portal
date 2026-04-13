// ═══════════════════════════════════════════════
//  KEC Lost & Found Portal — Dashboard Logic
// ═══════════════════════════════════════════════

// ── Run when the page is fully loaded ──
document.addEventListener("DOMContentLoaded", function () {
  loadUserInfo();
  setDefaultDate();

  // If the "My Reports" section exists, load reports on page load
  if (document.getElementById("section-my-reports")) {
    loadMyReports();
  }
});

// ═══════════════════════════
//  Load Logged-In User Info
// ═══════════════════════════

/**
 * loadUserInfo — Reads the session storage set during login
 * and displays the user's name and email in the sidebar and topbar.
 * If no user is found (not logged in), redirect to login page.
 */
function loadUserInfo() {
  const raw = sessionStorage.getItem("loggedInUser");

  // If nobody is logged in, send back to login page
  if (!raw) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(raw);

  // Update sidebar name and email
  const nameEl     = document.getElementById("sidebar-user-name");
  const emailEl    = document.getElementById("sidebar-user-email");
  const avatarEl   = document.getElementById("sidebar-avatar");
  const greetingEl = document.getElementById("topbar-greeting");

  if (nameEl)  nameEl.textContent  = user.name  || "User";
  if (emailEl) emailEl.textContent = user.email  || "";

  // Set avatar initial from the user's name
  if (avatarEl && user.name) {
    avatarEl.textContent = user.name.charAt(0).toUpperCase();
  }

  // Time-based greeting in the topbar
  if (greetingEl) {
    const hour = new Date().getHours();
    let timeGreeting = "Good day";
    if (hour < 12)       timeGreeting = "Good morning";
    else if (hour < 17)  timeGreeting = "Good afternoon";
    else                 timeGreeting = "Good evening";

    greetingEl.textContent = `${timeGreeting}, ${user.name.split(" ")[0]}`;
  }
}

// ═══════════════════════════
//  Logout
// ═══════════════════════════

/**
 * logout — Clears session data and redirects back to the login page.
 */
function logout() {
  sessionStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

// ═══════════════════════════
//  Sidebar Toggle (Mobile)
// ═══════════════════════════

/**
 * toggleSidebar — Opens/closes the sidebar on mobile screens.
 */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  sidebar.classList.toggle("open");
  overlay.classList.toggle("visible");
}

// ═══════════════════════════
//  Section Switching
// ═══════════════════════════

/**
 * showSection — Switches between dashboard sections
 * (e.g., 'report' and 'my-reports').
 * Updates the sidebar nav active state and topbar title.
 *
 * @param {string} sectionName — The section key ('report', 'my-reports')
 */
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll(".page-content");
  sections.forEach((s) => {
    s.classList.add("hidden");
    // Reset animation so it plays again when shown
    s.style.animation = "none";
  });

  // Show the target section
  const target = document.getElementById(`section-${sectionName}`);
  if (target) {
    target.classList.remove("hidden");
    // Trigger re-animation
    void target.offsetWidth;
    target.style.animation = "";
  }

  // Update nav active state
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));
  const activeNav = document.getElementById(`nav-${sectionName}`);
  if (activeNav) activeNav.classList.add("active");

  // Update topbar title
  const pageTitleEl = document.getElementById("page-title");
  if (pageTitleEl) {
    const titles = {
      "report": "Report Lost Item",
      "my-reports": "My Reports",
    };
    pageTitleEl.textContent = titles[sectionName] || "Dashboard";
  }

  // Refresh reports list when switching to My Reports
  if (sectionName === "my-reports") {
    loadMyReports();
  }

  // Close sidebar on mobile after navigation
  const sidebar = document.getElementById("sidebar");
  if (sidebar && sidebar.classList.contains("open")) {
    toggleSidebar();
  }
}

// ═══════════════════════════
//  Report Form Helpers
// ═══════════════════════════

/** Set default date to today */
function setDefaultDate() {
  const dateInput = document.getElementById("report-date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    dateInput.max = today; // Can't report future dates
  }
}

/** Preview uploaded image */
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    alert("Image size must be under 5 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const preview     = document.getElementById("image-preview");
    const placeholder = document.getElementById("upload-placeholder");
    const uploadArea  = document.getElementById("image-upload-area");
    const removeBtn   = document.getElementById("remove-image-btn");

    preview.src = e.target.result;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
    uploadArea.classList.add("has-image");
    removeBtn.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

/** Remove the uploaded image */
function removeImage() {
  const fileInput   = document.getElementById("report-image");
  const preview     = document.getElementById("image-preview");
  const placeholder = document.getElementById("upload-placeholder");
  const uploadArea  = document.getElementById("image-upload-area");
  const removeBtn   = document.getElementById("remove-image-btn");

  fileInput.value = "";
  preview.src = "";
  preview.classList.add("hidden");
  placeholder.classList.remove("hidden");
  uploadArea.classList.remove("has-image");
  removeBtn.classList.add("hidden");
}

/** Reset the form to initial state */
function resetForm() {
  removeImage();
  setDefaultDate();
  const msg = document.getElementById("report-message");
  if (msg) {
    msg.textContent = "";
    msg.className = "form-message";
  }
}

// ═══════════════════════════
//  Submit Report
// ═══════════════════════════

/**
 * submitReport — Validates the form and saves the lost item report
 * to localStorage. Each report is stored with the student's email
 * so they can see their own reports.
 *
 * @param {Event} event — Form submit event
 */
function submitReport(event) {
  event.preventDefault();

  const category    = document.getElementById("report-category").value;
  const location    = document.getElementById("report-location").value;
  const date        = document.getElementById("report-date").value;
  const time        = document.getElementById("report-time").value;
  const description = document.getElementById("report-description").value.trim();
  const imageInput  = document.getElementById("report-image");
  const message     = document.getElementById("report-message");
  const submitBtn   = document.getElementById("submit-report-btn");

  // Clear previous messages
  message.textContent = "";
  message.className = "form-message";

  // Basic validation
  if (!category || !location || !date || !time || !description) {
    message.textContent = "Please fill in all required fields.";
    message.classList.add("error");
    return;
  }

  // Get logged-in user
  const userRaw = sessionStorage.getItem("loggedInUser");
  if (!userRaw) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(userRaw);

  // Show loading state
  setLoading(submitBtn, true);

  // Get image data if uploaded
  const imageFile = imageInput.files[0];

  // Use a small timeout to simulate async save
  const saveReport = function (imageData) {
    // Build the report object
    const report = {
      id: Date.now().toString(),
      email: user.email,
      name: user.name,
      category: category,
      location: location,
      date: date,
      time: time,
      description: description,
      image: imageData || null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const reports = getReports();
    reports.push(report);
    localStorage.setItem("lostItemReports", JSON.stringify(reports));

    setLoading(submitBtn, false);
    message.textContent = "Report submitted successfully! You can view it under My Reports.";
    message.classList.add("success");

    // Reset form after success
    document.getElementById("report-form").reset();
    removeImage();
    setDefaultDate();
  };

  // If there's an image, read it as base64
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      saveReport(e.target.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    setTimeout(() => saveReport(null), 500);
  }
}

// ═══════════════════════════
//  Reports Storage
// ═══════════════════════════

/** Get all reports from localStorage */
function getReports() {
  const raw = localStorage.getItem("lostItemReports");
  return raw ? JSON.parse(raw) : [];
}

// ═══════════════════════════
//  Load My Reports
// ═══════════════════════════

/**
 * loadMyReports — Reads reports from localStorage and displays
 * only the ones belonging to the currently logged-in student.
 */
function loadMyReports() {
  const container = document.getElementById("reports-list");
  if (!container) return;

  const userRaw = sessionStorage.getItem("loggedInUser");
  if (!userRaw) return;
  const user = JSON.parse(userRaw);

  const allReports = getReports();
  const myReports  = allReports.filter(
    (r) => r.email.toLowerCase() === user.email.toLowerCase()
  );

  // Sort by newest first
  myReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Clear existing
  container.innerHTML = "";

  if (myReports.length === 0) {
    container.innerHTML = `
      <div class="no-reports">
        <svg class="no-reports-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M14 18h36M14 26h36M14 34h24"/>
          <circle cx="48" cy="48" r="10" fill="none"/>
          <path d="M52 44l-8 8M44 44l8 8"/>
        </svg>
        <h3>No reports yet</h3>
        <p>You haven't reported any lost items. Use the form to report one.</p>
      </div>
    `;
    return;
  }

  // Render each report card
  myReports.forEach((report) => {
    const card = document.createElement("div");
    card.className = "report-card";

    // Format date nicely
    const dateObj = new Date(report.date + "T" + report.time);
    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
    const formattedTime = dateObj.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true
    });

    // Image or placeholder
    let imageHtml;
    if (report.image) {
      imageHtml = `<img class="report-card-thumb" src="${report.image}" alt="${report.category}" />`;
    } else {
      imageHtml = `
        <div class="report-card-no-image">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="6" y="10" width="36" height="28" rx="4" fill="none"/>
            <circle cx="18" cy="22" r="4" fill="none"/>
            <path d="M6 34l10-10 8 8 6-6 12 12" fill="none"/>
          </svg>
        </div>
      `;
    }

    // Status badge
    const statusClass = report.status === "found" ? "status-found" : "status-pending";
    const statusText  = report.status === "found" ? "Found" : "Pending";

    card.innerHTML = `
      ${imageHtml}
      <div class="report-card-body">
        <span class="report-card-category">${report.category}</span>
        <div class="report-card-meta">
          <span>${report.location}</span>
          <span>${formattedDate}, ${formattedTime}</span>
        </div>
        <p class="report-card-desc">${report.description}</p>
        <span class="report-card-status ${statusClass}">${statusText}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// ═══════════════════════════
//  UI Helpers
// ═══════════════════════════

/** setLoading — Shows or hides the loading text on the button */
function setLoading(btn, isLoading) {
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  if (!text || !loader) return;
  if (isLoading) {
    text.classList.add("hidden");
    loader.classList.remove("hidden");
    btn.disabled = true;
  } else {
    text.classList.remove("hidden");
    loader.classList.add("hidden");
    btn.disabled = false;
  }
}
