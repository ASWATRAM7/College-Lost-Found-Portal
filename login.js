// ═══════════════════════════════════════════════
//  KEC Lost & Found Portal — Login & Registration Logic
// ═══════════════════════════════════════════════

// ── Allowed college email domain ──
const COLLEGE_DOMAIN = "kongu.edu";

// ── Registered users are stored in localStorage ──
// Structure: { "student": [...users], "faculty": [...users] }
// Each user: { name, email, password }
function getRegisteredUsers() {
  const raw = localStorage.getItem("registeredUsers");
  if (raw) return JSON.parse(raw);
  // Return empty structure if no one has registered yet
  return { student: [], faculty: [] };
}

function saveRegisteredUsers(users) {
  localStorage.setItem("registeredUsers", JSON.stringify(users));
}

// Track which panel is currently visible
// 'login' or 'register' — per role
let currentView = { student: "login", faculty: "login" };

// ═══════════════════════════
//  Tab Switching
// ═══════════════════════════

/**
 * switchTab — Shows the correct login panel (student or faculty)
 * and updates tab button styles accordingly.
 *
 * @param {string} role — 'student' or 'faculty'
 */
function switchTab(role) {
  const tabStudent  = document.getElementById("tab-student");
  const tabFaculty  = document.getElementById("tab-faculty");

  // Update tab buttons
  tabStudent.classList.remove("active", "faculty-tab");
  tabFaculty.classList.remove("active", "faculty-tab");

  if (role === "student") {
    tabStudent.classList.add("active");
    tabStudent.setAttribute("aria-selected", "true");
    tabFaculty.setAttribute("aria-selected", "false");
  } else {
    tabFaculty.classList.add("active", "faculty-tab");
    tabFaculty.setAttribute("aria-selected", "true");
    tabStudent.setAttribute("aria-selected", "false");
  }

  // Hide all panels first
  hideAllPanels();

  // Show the correct panel based on which view the role was on
  const view = currentView[role]; // 'login' or 'register'
  if (view === "register") {
    showPanel(`panel-${role}-register`);
  } else {
    showPanel(`panel-${role}`);
  }

  clearMessages();
}

// ═══════════════════════════
//  Show / Hide Panels
// ═══════════════════════════

/** Hides all login and register panels */
function hideAllPanels() {
  const panels = document.querySelectorAll(".login-panel");
  panels.forEach((p) => {
    p.classList.remove("active");
    p.classList.add("hidden");
  });
}

/** Shows a specific panel by its ID */
function showPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove("hidden");
    panel.classList.add("active");
  }
}

/**
 * showRegister — Switches from login form to registration form
 * for the given role.
 */
function showRegister(event, role) {
  event.preventDefault();
  currentView[role] = "register";
  hideAllPanels();
  showPanel(`panel-${role}-register`);
}

/**
 * showLogin — Switches from registration form back to login form
 * for the given role.
 */
function showLogin(event, role) {
  event.preventDefault();
  currentView[role] = "login";
  hideAllPanels();
  showPanel(`panel-${role}`);
}

// ═══════════════════════════
//  Email Validation
// ═══════════════════════════

/**
 * isCollegeEmail — Checks if the email ends with the college domain.
 * Only @kongu.edu emails are accepted.
 *
 * @param {string} email
 * @returns {boolean}
 */
function isCollegeEmail(email) {
  const trimmed = email.trim().toLowerCase();
  return trimmed.endsWith("@" + COLLEGE_DOMAIN);
}

// ═══════════════════════════
//  Toggle Password Visibility
// ═══════════════════════════

/**
 * togglePassword — Shows or hides the password text in a field.
 *
 * @param {string} fieldId — The ID of the password input
 * @param {HTMLElement} btn — The button element
 */
function togglePassword(fieldId, btn) {
  const field = document.getElementById(fieldId);
  if (field.type === "password") {
    field.type = "text";
    btn.textContent = "Hide";
    btn.setAttribute("aria-label", "Hide password");
  } else {
    field.type = "password";
    btn.textContent = "Show";
    btn.setAttribute("aria-label", "Show password");
  }
}

// ═══════════════════════════
//  Registration Handler
// ═══════════════════════════

/**
 * handleRegister — Called when registration form is submitted.
 * Validates all fields, checks for duplicate email, and saves
 * the new user to localStorage.
 *
 * @param {Event} event — Form submit event
 * @param {string} role  — 'student' or 'faculty'
 */
function handleRegister(event, role) {
  event.preventDefault();

  const nameInput    = document.getElementById(`${role}-reg-name`);
  const emailInput   = document.getElementById(`${role}-reg-email`);
  const passInput    = document.getElementById(`${role}-reg-password`);
  const confirmInput = document.getElementById(`${role}-reg-confirm`);

  const nameError    = document.getElementById(`${role}-reg-name-error`);
  const emailError   = document.getElementById(`${role}-reg-email-error`);
  const passError    = document.getElementById(`${role}-reg-password-error`);
  const confirmError = document.getElementById(`${role}-reg-confirm-error`);

  const message      = document.getElementById(`${role}-reg-message`);
  const submitBtn    = document.getElementById(`${role}-register-btn`);

  // Clear previous errors
  nameError.textContent = "";
  emailError.textContent = "";
  passError.textContent = "";
  confirmError.textContent = "";
  message.textContent = "";
  message.className = "form-message";

  const name     = nameInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passInput.value;
  const confirm  = confirmInput.value;

  let valid = true;

  // Step 1: Check name
  if (!name) {
    nameError.textContent = "Please enter your full name.";
    valid = false;
  }

  // Step 2: Check email
  if (!email) {
    emailError.textContent = "Please enter your college email.";
    valid = false;
  } else if (!isCollegeEmail(email)) {
    emailError.textContent = `Only @${COLLEGE_DOMAIN} emails are allowed.`;
    valid = false;
  }

  // Step 3: Check password (minimum 6 characters)
  if (!password) {
    passError.textContent = "Please create a password.";
    valid = false;
  } else if (password.length < 6) {
    passError.textContent = "Password must be at least 6 characters.";
    valid = false;
  }

  // Step 4: Check confirm password matches
  if (!confirm) {
    confirmError.textContent = "Please re-enter your password.";
    valid = false;
  } else if (password !== confirm) {
    confirmError.textContent = "Passwords do not match.";
    valid = false;
  }

  if (!valid) return;

  // Step 5: Check if email is already registered
  const users = getRegisteredUsers();
  const alreadyExists = users[role].some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (alreadyExists) {
    emailError.textContent = "This email is already registered. Please sign in.";
    return;
  }

  // Step 6: Save the new user
  setLoading(submitBtn, true);

  setTimeout(() => {
    users[role].push({ name, email: email.toLowerCase(), password });
    saveRegisteredUsers(users);

    setLoading(submitBtn, false);
    message.textContent = "Account created successfully! You can now sign in.";
    message.classList.add("success");

    // Clear the form fields
    nameInput.value = "";
    emailInput.value = "";
    passInput.value = "";
    confirmInput.value = "";

    // Automatically switch to login after 2 seconds
    setTimeout(() => {
      currentView[role] = "login";
      hideAllPanels();
      showPanel(`panel-${role}`);
    }, 2000);

  }, 700);
}

// ═══════════════════════════
//  Login Handler
// ═══════════════════════════

/**
 * handleLogin — Called when login form is submitted.
 * Validates email domain, checks credentials against registered users,
 * and redirects on success.
 *
 * @param {Event} event — Form submit event
 * @param {string} role  — 'student' or 'faculty'
 */
function handleLogin(event, role) {
  event.preventDefault();

  const emailInput    = document.getElementById(`${role}-email`);
  const passwordInput = document.getElementById(`${role}-password`);
  const emailError    = document.getElementById(`${role}-email-error`);
  const passwordError = document.getElementById(`${role}-password-error`);
  const message       = document.getElementById(`${role}-message`);
  const loginBtn      = document.getElementById(`${role}-login-btn`);

  // Clear previous errors
  emailError.textContent    = "";
  passwordError.textContent = "";
  message.textContent       = "";
  message.className         = "form-message";
  emailInput.classList.remove("error");
  passwordInput.classList.remove("error");

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  let valid = true;

  // Step 1: Check email is not empty
  if (!email) {
    emailError.textContent = "Please enter your college email.";
    emailInput.classList.add("error");
    valid = false;
  }
  // Step 2: Check it's a college email
  else if (!isCollegeEmail(email)) {
    emailError.textContent = `Only @${COLLEGE_DOMAIN} emails are allowed.`;
    emailInput.classList.add("error");
    valid = false;
  }

  // Step 3: Check password is not empty
  if (!password) {
    passwordError.textContent = "Please enter your password.";
    passwordInput.classList.add("error");
    valid = false;
  }

  if (!valid) return;

  // Step 4: Simulate loading
  setLoading(loginBtn, true);

  // Step 5: Check credentials against registered users in localStorage
  setTimeout(() => {
    const user = authenticateUser(email, password, role);
    setLoading(loginBtn, false);

    if (user) {
      // Login success
      message.textContent = `Welcome, ${user.name}! Redirecting...`;
      message.classList.add("success");

      // Save login info to session storage
      sessionStorage.setItem("loggedInUser", JSON.stringify({
        name:  user.name,
        email: user.email,
        role:  role,
      }));

      // Redirect after a short delay
      setTimeout(() => {
        if (role === "student") {
          window.location.href = "student-dashboard.html";
        } else {
          window.location.href = "faculty-dashboard.html";
        }
      }, 1500);

    } else {
      // Login failed
      message.textContent = "Incorrect email or password. Please try again.";
      message.classList.add("error");
      shakeCard();
    }
  }, 900);
}

// ═══════════════════════════
//  Authenticate User
// ═══════════════════════════

/**
 * authenticateUser — Finds a matching user in registered users (localStorage).
 * Returns the user object if found, or null if not.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} role — 'student' or 'faculty'
 * @returns {object|null}
 */
function authenticateUser(email, password, role) {
  const users = getRegisteredUsers();
  const roleUsers = users[role] || [];
  return roleUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  ) || null;
}

// ═══════════════════════════
//  UI Helpers
// ═══════════════════════════

/** setLoading — Shows or hides the loading spinner on the button */
function setLoading(btn, isLoading) {
  const text   = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
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

/** shakeCard — Briefly shakes the login card on wrong credentials */
function shakeCard() {
  const card = document.querySelector(".login-card");
  card.style.animation = "none";
  card.style.transform = "translateX(10px)";
  setTimeout(() => { card.style.transform = "translateX(-10px)"; }, 80);
  setTimeout(() => { card.style.transform = "translateX(8px)"; },  160);
  setTimeout(() => { card.style.transform = "translateX(-8px)"; }, 240);
  setTimeout(() => { card.style.transform = "translateX(0)"; },    320);
}

/** clearMessages — Removes any status messages and error texts */
function clearMessages() {
  ["student", "faculty"].forEach((role) => {
    // Login form messages
    const msg = document.getElementById(`${role}-message`);
    const eErr = document.getElementById(`${role}-email-error`);
    const pErr = document.getElementById(`${role}-password-error`);
    if (msg) { msg.textContent = ""; msg.className = "form-message"; }
    if (eErr) eErr.textContent = "";
    if (pErr) pErr.textContent = "";

    // Registration form messages
    const regMsg = document.getElementById(`${role}-reg-message`);
    const rnErr  = document.getElementById(`${role}-reg-name-error`);
    const reErr  = document.getElementById(`${role}-reg-email-error`);
    const rpErr  = document.getElementById(`${role}-reg-password-error`);
    const rcErr  = document.getElementById(`${role}-reg-confirm-error`);
    if (regMsg) { regMsg.textContent = ""; regMsg.className = "form-message"; }
    if (rnErr) rnErr.textContent = "";
    if (reErr) reErr.textContent = "";
    if (rpErr) rpErr.textContent = "";
    if (rcErr) rcErr.textContent = "";
  });
}
