/**
 * APS Medical Management System — Shared UI Controller
 * Handles Authentication guards, Navbar, Audio Synthesizer,
 * Global Search (Ctrl+K), Live Alerts Drawer, Toasts, and XSS Sanitization.
 */

window.APS = (() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* =========================================================
     1. AUTHENTICATION GUARD & SESSION
  ========================================================== */

  const isLoginPage = window.location.pathname.endsWith("index.html") || 
                      window.location.pathname.endsWith("/") ||
                      window.location.pathname === "";

  // Apply system theme (dark/light)
  const savedTheme = localStorage.getItem("curoTheme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const isAuthenticated = sessionStorage.getItem("apsAuthenticated") === "true";

  if (!isAuthenticated && !isLoginPage) {
    window.location.replace("index.html");
    return;
  }

  const userRoleKey = sessionStorage.getItem("apsUserRoleKey") || "admin";

  // RBAC Page Route Guards
  const currentFilename = window.location.pathname.split("/").pop() || "home.html";
  if (currentFilename === "users.html" && userRoleKey !== "admin") {
    alert("Access Denied: You need Administrator privileges to access the Staff & Audit Management module.");
    window.location.replace("home.html");
    return;
  }

  // Populate User Display
  const userName = sessionStorage.getItem("apsUserName") || "Dr. Alexander Vance";
  const userRole = sessionStorage.getItem("apsUserRole") || "Administrator";
  const userEmail = sessionStorage.getItem("apsUserEmail") || "pg@gmail.com";

  function applyUserDisplay(name, role) {
    const nameEl = $("#userName");
    const roleEl = $("#userRole");
    const avatarEl = $(".avatar");
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  }

  function syncSessionUser(user) {
    if (!user) return;
    if (user.id) sessionStorage.setItem("apsUserId", user.id);
    sessionStorage.setItem("apsUserName", user.name);
    sessionStorage.setItem("apsUserRole", user.designation || user.roleTitle || user.role);
    sessionStorage.setItem("apsUserRoleKey", user.role);
    sessionStorage.setItem("apsUserEmail", user.email);
    applyUserDisplay(user.name, user.designation || user.roleTitle || user.role);
  }

  function getCurrentUser() {
    return {
      id: sessionStorage.getItem("apsUserId") || "usr-1",
      name: sessionStorage.getItem("apsUserName") || "Dr. Alexander Vance",
      role: sessionStorage.getItem("apsUserRoleKey") || "admin",
      roleTitle: sessionStorage.getItem("apsUserRole") || "Administrator",
      email: sessionStorage.getItem("apsUserEmail") || "pg@gmail.com"
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyUserDisplay(userName, userRole);
    const yearEl = $("#currentYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Highlight active nav link based on current filename
    $$(".main-nav .nav-link").forEach(link => {
      const href = link.getAttribute("href");
      if (href && (href === currentFilename || href.startsWith(currentFilename))) {
        link.classList.add("active");
      } else if (href && !href.startsWith("#")) {
        link.classList.remove("active");
      }
    });

    // Update notification badge count from live alerts
    updateAlertBadge();
    initInactivityTimer();

    // Global Theme Toggle Injection for Static Pages
    const actionsWrap = $(".header-actions") || $(".navbar-nav") || $(".d-flex.align-items-center.gap-3");
    if (actionsWrap && !$("#globalThemeToggle")) {
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.id = "globalThemeToggle";
      toggleBtn.className = "btn btn-outline-secondary btn-sm rounded-circle d-inline-flex align-items-center justify-content-center";
      toggleBtn.style.width = "34px";
      toggleBtn.style.height = "34px";
      toggleBtn.title = savedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
      toggleBtn.innerHTML = `<i class="bi ${savedTheme === "dark" ? "bi-sun" : "bi-moon-stars"}"></i>`;
      toggleBtn.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") || "dark";
        const next = cur === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("curoTheme", next);
        toggleBtn.title = next === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
        toggleBtn.innerHTML = `<i class="bi ${next === "dark" ? "bi-sun" : "bi-moon-stars"}"></i>`;
      });
      actionsWrap.prepend(toggleBtn);
    }
  });

  /* =========================================================
     2. AUDIO SYNTHESIZER (Web Audio API)
  ========================================================== */

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type = "sine", duration = 0.1, gainVal = 0.15) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted without interaction
    }
  }

  function playScanSound() {
    playTone(1760, "sine", 0.08, 0.2); // Crisp modern retail barcode beep
  }

  function playSuccessSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      playTone(523.25, "triangle", 0.12, 0.15); // C5
      setTimeout(() => playTone(659.25, "triangle", 0.18, 0.15), 100); // E5
    } catch (e) {}
  }

  function playAlertSound() {
    try {
      playTone(392, "sawtooth", 0.18, 0.12);
      setTimeout(() => playTone(329.63, "sawtooth", 0.22, 0.12), 120);
    } catch (e) {}
  }

  /* =========================================================
     3. TOAST MANAGER
  ========================================================== */

  function showToast(message, type = "success") {
    let toastEl = $("#appToast");
    if (!toastEl) {
      const container = document.createElement("div");
      container.className = "toast-container position-fixed bottom-0 end-0 p-4";
      container.style.zIndex = "9999";
      container.innerHTML = `
        <div id="appToast" class="toast custom-toast shadow" role="status" aria-live="polite" aria-atomic="true">
          <div class="toast-body d-flex align-items-center gap-2">
            <span class="toast-icon text-success fs-5"><i class="bi bi-check2-circle"></i></span>
            <span id="toastMessage" class="fw-medium">Action completed.</span>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      toastEl = $("#appToast");
    }

    const toastMessage = $("#toastMessage");
    const toastIcon = toastEl.querySelector(".toast-icon");
    if (toastMessage) toastMessage.textContent = message;

    if (toastIcon) {
      if (type === "danger" || type === "error") {
        toastIcon.innerHTML = `<i class="bi bi-exclamation-octagon text-danger"></i>`;
      } else if (type === "warning") {
        toastIcon.innerHTML = `<i class="bi bi-exclamation-triangle text-warning"></i>`;
      } else {
        toastIcon.innerHTML = `<i class="bi bi-check2-circle text-success"></i>`;
      }
    }

    if (window.bootstrap && toastEl) {
      const instance = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
      instance.show();
    } else {
      alert(message);
    }
  }

  /* =========================================================
     4. LIVE ALERTS & NOTIFICATIONS
  ========================================================== */

  function updateAlertBadge() {
    if (!window.APSStore) return;
    const alerts = APSStore.getAlerts();
    const dot = $(".notification-dot");
    if (dot) {
      dot.textContent = alerts.totalCount;
      dot.style.display = alerts.totalCount > 0 ? "grid" : "none";
    }
  }

  // Bind notification button
  document.addEventListener("click", (e) => {
    const notifBtn = e.target.closest("#notificationBtn");
    if (notifBtn) {
      e.preventDefault();
      window.location.href = "alerts.html";
    }

    const logoutBtn = e.target.closest("[data-logout]");
    if (logoutBtn) {
      e.preventDefault();
      logout();
    }
  });

  /* =========================================================
     5. GLOBAL SEARCH (Ctrl + K)
  ========================================================== */

  const searchPanel = $("#searchPanel");
  const searchInput = $("#globalSearch");

  document.addEventListener("click", (e) => {
    if (e.target.closest("#searchBtn")) {
      openSearch();
    }
    if (e.target.closest("#closeSearch")) {
      closeSearch();
    }
  });

  function openSearch() {
    const panel = $("#searchPanel");
    const input = $("#globalSearch");
    if (panel) {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      setTimeout(() => input && input.focus(), 120);
    }
  }

  function closeSearch() {
    const panel = $("#searchPanel");
    if (panel) {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      logout();
    }
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && searchInput.value.trim()) {
      const q = searchInput.value.trim();
      closeSearch();
      window.location.href = `medicines.html?search=${encodeURIComponent(q)}`;
    }
  });

  /* =========================================================
     6. LOGOUT
  ========================================================== */

  function logout() {
    if (window.APSStore) {
      APSStore.logAudit("LOGOUT", "session", "0", `User ${userName} logged out`);
    }
    sessionStorage.clear();
    window.location.href = "index.html";
  }

  /* =========================================================
     7. SECURITY & UTILS
  ========================================================== */

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCurrency(amount) {
    const num = Number(amount || 0);
    return "৳ " + num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* =========================================================
     8. INACTIVITY AUTO-LOCK & USB HARDWARE BARCODE LISTENER
  ========================================================== */

  let inactivityTimer = null;
  function initInactivityTimer() {
    if (isLoginPage) return;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Auto-logout after 45 minutes of complete inactivity
      inactivityTimer = setTimeout(() => {
        alert("Session timed out due to 45 minutes of inactivity. Please sign in again.");
        logout();
      }, 45 * 60 * 1000);
    };

    ["mousedown", "mousemove", "keydown", "touchstart", "scroll"].forEach(evt => {
      document.addEventListener(evt, resetTimer, { passive: true });
    });
    resetTimer();
  }

  /**
   * Global USB Barcode Scanner Wedge Listener
   * Detects rapid keystroke bursts (<50ms intervals) ending in 'Enter'.
   */
  function initUSBBarcodeListener(onBarcodeScanned) {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();

    document.addEventListener("keydown", (e) => {
      // Ignore if user is inside a textarea or normal form input
      const targetTag = e.target.tagName.toLowerCase();
      const isInput = targetTag === "input" || targetTag === "textarea" || targetTag === "select";

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Reset buffer if delay is too long (normal typing is >80ms)
      if (timeDiff > 65) {
        barcodeBuffer = "";
      }

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 6) {
          e.preventDefault();
          const code = barcodeBuffer;
          barcodeBuffer = "";
          playScanSound();
          if (typeof onBarcodeScanned === "function") {
            onBarcodeScanned(code);
          }
        }
        return;
      }

      // Printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key;
      }
    });
  }

  // Public Interface
  return {
    showToast,
    playScanSound,
    playSuccessSound,
    playAlertSound,
    logout,
    escapeHtml,
    formatCurrency,
    updateAlertBadge,
    getCurrentUser,
    syncSessionUser,
    initUSBBarcodeListener
  };
})();
