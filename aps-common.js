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

  // Lock to clean light theme
  document.documentElement.setAttribute("data-theme", "light");
  localStorage.setItem("curoTheme", "light");

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
  const userName = sessionStorage.getItem("apsUserName") || "System Administrator";
  const userRole = sessionStorage.getItem("apsUserRole") || "Administrator";
  const userEmail = sessionStorage.getItem("apsUserEmail") || "admin@curo.health";

  function applyUserDisplay(name, role) {
    const nameEl = $("#userName") || $("#navUserName");
    const roleEl = $("#userRole") || $("#navUserRole");
    const avatarEl = $(".avatar") || $("#userAvatarLetter");
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
      id: sessionStorage.getItem("apsUserId") || "usr-admin",
      name: sessionStorage.getItem("apsUserName") || "System Administrator",
      role: sessionStorage.getItem("apsUserRoleKey") || "admin",
      roleTitle: sessionStorage.getItem("apsUserRole") || "Administrator",
      email: sessionStorage.getItem("apsUserEmail") || "admin@curo.health"
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyUserDisplay(userName, userRole);
    const yearEl = $("#currentYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Highlight active sidebar navigation link based on current filename
    $$(".sidebar-nav-item").forEach(link => {
      const href = link.getAttribute("href");
      if (href && (href === currentFilename || href.startsWith(currentFilename))) {
        link.classList.add("is-active");
      } else if (href && !href.startsWith("#")) {
        link.classList.remove("is-active");
      }
    });

    // Mobile sidebar drawer toggler & responsive controls
    const sidebarToggleBtn = $("#sidebarToggleBtn");
    const appSidebar = $("#appSidebar");
    const sidebarOverlay = $("#sidebarOverlay");

    function closeSidebar() {
      if (appSidebar) appSidebar.classList.remove("is-open");
      if (sidebarOverlay) sidebarOverlay.classList.remove("is-visible");
      document.body.classList.remove("sidebar-open");
    }

    function openSidebar() {
      if (appSidebar) appSidebar.classList.add("is-open");
      if (sidebarOverlay) sidebarOverlay.classList.add("is-visible");
      document.body.classList.add("sidebar-open");
    }

    if (sidebarToggleBtn && appSidebar) {
      sidebarToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (appSidebar.classList.contains("is-open")) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (appSidebar && !$("#sidebarCloseBtn", appSidebar)) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.id = "sidebarCloseBtn";
      closeBtn.className = "sidebar-close-btn d-lg-none";
      closeBtn.setAttribute("aria-label", "Close navigation drawer");
      closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeSidebar();
      });
      appSidebar.appendChild(closeBtn);
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", closeSidebar);
    }

    // Swipe left on mobile sidebar drawer to close
    let touchStartX = 0;
    let touchStartY = 0;
    if (appSidebar) {
      appSidebar.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      appSidebar.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (diffX < -50 && Math.abs(diffX) > Math.abs(diffY)) {
          closeSidebar();
        }
      }, { passive: true });
    }

    // Close sidebar on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && appSidebar && appSidebar.classList.contains("is-open")) {
        closeSidebar();
      }
    });

    // Auto-close sidebar on mobile when a nav item is clicked
    $$(".sidebar-nav-item", appSidebar || document).forEach(navItem => {
      navItem.addEventListener("click", () => {
        if (window.innerWidth < 992) {
          closeSidebar();
        }
      });
    });

    // Reset mobile drawer state when resizing to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992) {
        closeSidebar();
      }
    });

    // Role-Based UI Guard: Hide Admin-only modules for non-admin staff
    if (userRoleKey !== "admin") {
      $$('a[href="users.html"]').forEach(el => {
        el.style.display = "none";
      });
    }

    // Topbar global search across pages
    const topSearch = $("#topSearchInput");
    if (topSearch && currentFilename !== "home.html") {
      topSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && topSearch.value.trim()) {
          window.location.href = `medicines.html?search=${encodeURIComponent(topSearch.value.trim())}`;
        }
      });
    }

    // Bind logout handlers
    $$("[data-logout], #logoutBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index.html";
      });
    });

    // Update notification badge count from live alerts
    updateAlertBadge();
    initInactivityTimer();
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
    const alerts = APSStore.getAlerts() || { totalCount: 0 };
    const dots = $$(".notification-dot, .notification-badge-dot, #headerAlertCount");
    dots.forEach(dot => {
      dot.textContent = alerts.totalCount;
      dot.style.display = alerts.totalCount > 0 ? "inline-flex" : "none";
    });
  }

  // Bind notification button
  document.addEventListener("click", (e) => {
    const notifBtn = e.target.closest("#notificationBtn, .topbar-notification-btn");
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
   * Detects rapid keystroke bursts (<60ms intervals) ending in 'Enter'.
   * Gracefully handles both global background scanning and focused inputs.
   */
  function initUSBBarcodeListener(onBarcodeScanned) {
    let barcodeBuffer = "";
    let lastKeyTime = Date.now();
    let lastProcessedScan = "";
    let lastProcessedTime = 0;

    document.addEventListener("keydown", (e) => {
      const activeEl = document.activeElement;
      const targetTag = activeEl ? activeEl.tagName.toLowerCase() : "";
      const isInput = targetTag === "input" || targetTag === "textarea" || targetTag === "select";
      const isDedicatedBarcodeInput = activeEl && (
        activeEl.hasAttribute("data-barcode-input") ||
        activeEl.id === "medSearchInput" ||
        activeEl.id === "batchBarcodeScanInput" ||
        activeEl.id === "posBarcodeScanInput" ||
        activeEl.id === "medBarcode"
      );

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Handle Enter keypress
      if (e.key === "Enter") {
        // If Enter pressed inside a dedicated barcode input, grab input value
        if (isDedicatedBarcodeInput && activeEl.value.trim().length >= 3) {
          const code = activeEl.value.trim();
          if (Date.now() - lastProcessedTime > 600 || code !== lastProcessedScan) {
            lastProcessedScan = code;
            lastProcessedTime = Date.now();
            e.preventDefault();
            playScanSound();
            if (typeof onBarcodeScanned === "function") {
              onBarcodeScanned(code);
            }
          }
          barcodeBuffer = "";
          return;
        }

        // Global burst from USB barcode gun (buffer accumulated quickly)
        if (barcodeBuffer.length >= 4) {
          const code = barcodeBuffer.trim();
          barcodeBuffer = "";
          if (Date.now() - lastProcessedTime > 600 || code !== lastProcessedScan) {
            lastProcessedScan = code;
            lastProcessedTime = Date.now();
            e.preventDefault();
            playScanSound();
            if (typeof onBarcodeScanned === "function") {
              onBarcodeScanned(code);
            }
          }
          return;
        }
        return;
      }

      // Reset buffer if delay is too long (human typing is >80ms, barcode guns are <50ms)
      if (timeDiff > 70) {
        barcodeBuffer = "";
      }

      // Printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer += e.key;
      }
    });
  }

  /**
   * Enterprise Multi-Format Optical Camera Barcode Scanner Engine
   * Optimized for mobile devices: explicit 1D retail barcode formats,
   * continuous autofocus, flashlight/torch toggle, native GPU BarcodeDetector,
   * and high-resolution photo snap/upload for 100% mobile detection.
   */
  function createCameraBarcodeScanner({ containerId, statusId, onScan, modalId }) {
    let html5QrCode = null;
    let isRunning = false;
    let isStopping = false;
    let detectorLoopId = null;
    let torchState = false;

    const formats = window.Html5QrcodeSupportedFormats ? [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.QR_CODE
    ] : undefined;

    function handleSuccess(decodedText) {
      if (isStopping) return;
      isStopping = true;
      playScanSound();
      const statusEl = document.getElementById(statusId);
      if (statusEl) {
        statusEl.className = "alert alert-success py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
        statusEl.innerHTML = `<i class="bi bi-check-circle-fill text-success fs-5"></i><div>Scanned Barcode: <strong>${escapeHtml(decodedText)}</strong></div>`;
      }
      stop();
      if (modalId) {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
          const inst = bootstrap.Modal.getInstance(modalEl);
          if (inst) inst.hide();
        }
      }
      if (typeof onScan === "function") {
        onScan(decodedText);
      }
    }

    async function start() {
      const container = document.getElementById(containerId);
      const statusEl = document.getElementById(statusId);
      if (!container) return;

      isRunning = true;
      isStopping = false;

      if (statusEl) {
        statusEl.className = "alert alert-info py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
        statusEl.innerHTML = `<div class="spinner-border spinner-border-sm text-info"></div><div>Activating optical camera stream... Align barcode in frame.</div>`;
      }

      // 1. Try Html5Qrcode library with explicit 1D formats and mobile-tuned config
      if (window.Html5Qrcode) {
        try {
          html5QrCode = new Html5Qrcode(containerId, {
            formatsToSupport: formats,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            },
            verbose: false
          });

          // Detect back/environment camera directly if possible
          let cameraConfig = { facingMode: { ideal: "environment" } };
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
              const backCam = cameras.find(c => /back|rear|environment|camera2 0/i.test(c.label));
              if (backCam) {
                cameraConfig = backCam.id;
              }
            }
          } catch (e) {}

          const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
            const w = Math.floor(viewfinderWidth * 0.96);
            const h = Math.floor(Math.min(viewfinderHeight * 0.85, 280));
            return { width: Math.max(w, 200), height: Math.max(h, 140) };
          };

          const config = {
            fps: 24,
            qrbox: qrboxFunction,
            aspectRatio: 1.333334,
            disableFlip: true
          };

          await html5QrCode.start(
            cameraConfig,
            config,
            (decodedText) => {
              handleSuccess(decodedText);
            },
            () => {}
          );

          if (statusEl) {
            statusEl.className = "alert alert-success py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
            statusEl.innerHTML = `<i class="bi bi-camera-video-fill text-success fs-5"></i><div>Camera active! Point at barcode or tap <strong>Snap Photo</strong> below.</div>`;
          }

          // Check if torch/flashlight is supported on phone
          try {
            const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
            const torchBtn = document.getElementById("cameraTorchBtn") || document.querySelector(".scanner-torch-btn");
            if (torchBtn && capabilities.torchFeature && capabilities.torchFeature.isSupported()) {
              torchBtn.style.display = "inline-flex";
            }
          } catch (e) {}

          // Concurrent native BarcodeDetector on video element (super fast on Android Chrome!)
          if ("BarcodeDetector" in window) {
            try {
              const video = container.querySelector("video");
              if (video) {
                const supportedFormats = await BarcodeDetector.getSupportedFormats();
                const nativeFormats = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"].filter(f => supportedFormats.includes(f));
                const detector = new BarcodeDetector({ formats: nativeFormats });

                const runNativeDetection = async () => {
                  if (!isRunning || isStopping) return;
                  try {
                    if (video.readyState >= 2) {
                      const barcodes = await detector.detect(video);
                      if (barcodes && barcodes.length > 0) {
                        handleSuccess(barcodes[0].rawValue);
                        return;
                      }
                    }
                  } catch (e) {}
                  if (isRunning && !isStopping) {
                    detectorLoopId = requestAnimationFrame(runNativeDetection);
                  }
                };
                detectorLoopId = requestAnimationFrame(runNativeDetection);
              }
            } catch (e) {}
          }

          return;
        } catch (err) {
          console.warn("Live camera start note:", err.name, err.message);
          if (statusEl) {
            statusEl.className = "alert alert-warning py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
            statusEl.innerHTML = `
              <i class="bi bi-camera-fill text-warning fs-5"></i>
              <div>
                <strong>Live Video Stream Restricted on HTTP.</strong>
                <div>Tap <strong>Snap Photo / Upload</strong> below to capture barcode with phone macro autofocus!</div>
              </div>
            `;
          }
          return;
        }
      }

      // 2. Fallback note if camera denied, non-HTTPS, or unavailable
      if (statusEl) {
        statusEl.className = "alert alert-warning py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
        statusEl.innerHTML = `
          <i class="bi bi-camera-fill text-warning fs-5"></i>
          <div>
            <strong>Camera direct feed unavailable.</strong>
            <div>Tap <strong>Take Photo / Snap Barcode</strong> below to scan with your phone's camera!</div>
          </div>
        `;
      }
    }

    async function toggleTorch() {
      if (!html5QrCode) return false;
      try {
        torchState = !torchState;
        await html5QrCode.applyVideoConstraints({
          advanced: [{ torch: torchState }]
        });
        return torchState;
      } catch (e) {
        return false;
      }
    }

    async function scanImageFile(file) {
      if (!file) return;

      const statusEl = document.getElementById(statusId);
      if (statusEl) {
        statusEl.className = "alert alert-info py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
        statusEl.innerHTML = `<div class="spinner-border spinner-border-sm text-info"></div><div>Analyzing high-resolution photo with macro optics...</div>`;
      }

      // 1. Crucial: Stop live camera feed first so canvas is unlocked for file analysis
      if (detectorLoopId) {
        cancelAnimationFrame(detectorLoopId);
        detectorLoopId = null;
      }
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
        } catch (e) {}
      }

      // 2. High-speed native BarcodeDetector on image (handles rotated & macro shots)
      if ("BarcodeDetector" in window) {
        try {
          const supportedFormats = await BarcodeDetector.getSupportedFormats();
          const nativeFormats = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "itf", "qr_code"].filter(f => supportedFormats.includes(f));
          const detector = new BarcodeDetector({ formats: nativeFormats });

          // Pass A: Direct image bitmap
          const bitmap = await createImageBitmap(file);
          let barcodes = await detector.detect(bitmap);
          if (barcodes && barcodes.length > 0) {
            handleSuccess(barcodes[0].rawValue);
            return;
          }

          // Pass B: Canvas with contrast boost & 90-degree orientation check
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          ctx.drawImage(bitmap, 0, 0);

          // Contrast enhancement
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
              const contrasted = lum < 125 ? Math.max(0, lum - 35) : Math.min(255, lum + 35);
              d[i] = contrasted;
              d[i + 1] = contrasted;
              d[i + 2] = contrasted;
            }
            ctx.putImageData(imgData, 0, 0);
            barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              handleSuccess(barcodes[0].rawValue);
              return;
            }
          } catch (e) {}
        } catch (e) {
          console.warn("Native BarcodeDetector file scan note:", e);
        }
      }

      // 3. Html5Qrcode.scanFile (ZXing multi-format fallback)
      if (window.Html5Qrcode) {
        try {
          let scanner = html5QrCode;
          if (!scanner) {
            scanner = new Html5Qrcode(containerId, { formatsToSupport: formats, verbose: false });
          }
          const decoded = await scanner.scanFile(file, false);
          if (decoded) {
            handleSuccess(decoded);
            return;
          }
        } catch (e) {
          console.warn("Html5Qrcode scanFile note:", e);
        }
      }

      if (statusEl) {
        statusEl.className = "alert alert-warning py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
        statusEl.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i><div>No barcode detected in photo. Ensure package is well-lit, steady, and try snapping again.</div>`;
      }
    }

    async function stop() {
      isRunning = false;
      if (detectorLoopId) {
        cancelAnimationFrame(detectorLoopId);
        detectorLoopId = null;
      }
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
          html5QrCode.clear();
        } catch (e) {}
        html5QrCode = null;
      }
      isStopping = false;
    }

    return {
      start,
      stop,
      toggleTorch,
      scanImageFile,
      getIsRunning: () => isRunning
    };
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
    initUSBBarcodeListener,
    createCameraBarcodeScanner
  };
})();
