/**
 * CURO Health & Wellness — Executive Dashboard Interactions
 * Connects live metrics, inventory gauges, real-time alerts, Chart.js,
 * category filtering, and product/medicine card displays matching new Dashboard UI.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  document.addEventListener("DOMContentLoaded", () => {
    initUserSession();
    refreshDashboardStats();
    initSalesPerformanceChart();
    initMedicineCards();
    initCategoryPills();
    initGlobalSearch();
  });

  /* =========================================================
     0. USER SESSION & NAVIGATION
  ========================================================== */
  function initUserSession() {
    const userNameEl = $("#navUserName");
    const userRoleEl = $("#navUserRole");
    const avatarEl = $("#userAvatarLetter");

    const currentName = sessionStorage.getItem("apsUserName") || "Dr. Alexander Vance";
    const currentRole = sessionStorage.getItem("apsUserRole") || "Administrator";

    if (userNameEl) userNameEl.textContent = currentName;
    if (userRoleEl) userRoleEl.textContent = currentRole;
    if (avatarEl) avatarEl.textContent = currentName.charAt(0).toUpperCase();

    // Logout button
    const logoutBtn = $("#logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index.html";
      });
    }
  }

  /* =========================================================
     1. LIVE DASHBOARD STATS CALCULATION
  ========================================================== */
  function refreshDashboardStats() {
    if (!window.APSStore) return;

    const meds = APSStore.getMedicines() || [];
    const batches = APSStore.getBatches() || [];
    const alerts = APSStore.getAlerts() || { lowStock: [], expiringBatches: [], expiredBatches: [], creditOverdue: [], totalCount: 0 };
    const analytics = APSStore.getAnalytics() || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, totalCost: 0, grossProfit: 0, profitMarginPct: 0 };

    // 1. Total Medicines
    const medEl = $("#statTotalMedicines");
    if (medEl) medEl.textContent = meds.length;

    // 2. Total Inventory Units
    const totalUnits = batches.reduce((sum, b) => sum + Number(b.quantityAvailable || 0), 0);
    const stockEl = $("#statTotalStock");
    if (stockEl) stockEl.textContent = totalUnits.toLocaleString();

    // 3. Gross Sales Revenue
    const salesEl = $("#statTotalSales");
    if (salesEl) {
      salesEl.textContent = window.APS ? APS.formatCurrency(analytics.totalRevenue) : `৳ ${Number(analytics.totalRevenue || 0).toLocaleString()}`;
    }

    const chartRevEl = $("#chartRevenueTotal");
    if (chartRevEl) {
      chartRevEl.textContent = window.APS ? APS.formatCurrency(analytics.totalRevenue) : `৳ ${Number(analytics.totalRevenue || 0).toLocaleString()}`;
    }

    // 4. Active Alerts Count
    const alertsEl = $("#statActiveAlerts");
    const headerAlertEl = $("#headerAlertCount");
    const panelAlertBadge = $("#panelAlertBadge");

    if (alertsEl) alertsEl.textContent = alerts.totalCount;
    if (headerAlertEl) {
      headerAlertEl.textContent = alerts.totalCount;
      headerAlertEl.style.display = alerts.totalCount > 0 ? "inline-flex" : "none";
    }
    if (panelAlertBadge) panelAlertBadge.textContent = alerts.totalCount;

    // 5. Stock Health Analysis
    const healthyMeds = meds.filter(m => (m.totalStock || 0) > (m.reorderLevel || 10));
    const lowStockMeds = meds.filter(m => (m.totalStock || 0) > 0 && (m.totalStock || 0) <= (m.reorderLevel || 10));
    const criticalMeds = meds.filter(m => (m.totalStock || 0) === 0 || alerts.expiringBatches.some(e => e.medicineId === m.id));

    const totalMedsCount = meds.length || 1;
    const healthyPct = Math.round((healthyMeds.length / totalMedsCount) * 100);

    const healthyPctEl = $("#healthyStockPercent");
    if (healthyPctEl) healthyPctEl.textContent = healthyPct + "%";

    const healthyCountEl = $("#healthyStockCount");
    if (healthyCountEl) healthyCountEl.textContent = healthyMeds.reduce((sum, m) => sum + (m.totalStock || 0), 0).toLocaleString();

    const lowCountEl = $("#lowStockCount");
    if (lowCountEl) lowCountEl.textContent = lowStockMeds.reduce((sum, m) => sum + (m.totalStock || 0), 0).toLocaleString();

    const criticalCountEl = $("#criticalStockCount");
    if (criticalCountEl) criticalCountEl.textContent = alerts.lowStock.length + alerts.expiringBatches.length;

    // Reorder Summary
    const reorderSummaryEl = $("#reorderAlertSummary");
    if (reorderSummaryEl) {
      reorderSummaryEl.textContent = `${alerts.lowStock.length} medicines need restocking. ${alerts.expiringBatches.length} batches near expiry.`;
    }

    // 6. Quick Alert Items in Panel
    const quickAlertList = $("#quickAlertList");
    if (quickAlertList) {
      quickAlertList.innerHTML = "";
      const alertItems = [];

      alerts.lowStock.slice(0, 3).forEach(ls => {
        alertItems.push(`
          <div class="alert-item alert-item--red" style="cursor: pointer;" onclick="window.location.href='alerts.html'">
            <span class="alert-item__icon"><i class="bi bi-exclamation-triangle-fill text-danger"></i></span>
            <div>
              <strong>Low Stock: ${ls.medicineName}</strong>
              <small>Stock: ${ls.currentStock} ${ls.unit} (Reorder: ${ls.reorderLevel})</small>
            </div>
            <i class="bi bi-chevron-right text-muted ms-auto"></i>
          </div>
        `);
      });

      alerts.expiringBatches.slice(0, 2).forEach(exp => {
        alertItems.push(`
          <div class="alert-item alert-item--yellow" style="cursor: pointer;" onclick="window.location.href='alerts.html'">
            <span class="alert-item__icon"><i class="bi bi-calendar-x-fill text-warning"></i></span>
            <div>
              <strong>Near Expiry: ${exp.medicineName}</strong>
              <small>Batch ${exp.batchNumber} expires in ${exp.daysToExpiry} days</small>
            </div>
            <i class="bi bi-chevron-right text-muted ms-auto"></i>
          </div>
        `);
      });

      if (!alertItems.length) {
        quickAlertList.innerHTML = `<div class="p-3 text-center text-success fw-medium"><i class="bi bi-shield-check me-1"></i> All stock levels and batch expiries healthy.</div>`;
      } else {
        quickAlertList.innerHTML = alertItems.join("");
      }
    }

    // 7. Recent Invoices / Orders Table
    renderRecentInvoices();
  }

  function renderRecentInvoices() {
    const listEl = $("#recentInvoicesTableBody");
    if (!listEl || !window.APSStore) return;

    const invoices = (APSStore.getInvoices() || []).slice(0, 5);
    if (!invoices.length) {
      listEl.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No recent transactions recorded yet.</td></tr>`;
      return;
    }

    listEl.innerHTML = invoices.map(inv => {
      const isPaid = inv.paymentStatus === "PAID" || inv.paymentStatus === "paid";
      const badgeClass = isPaid ? "badge-paid" : "badge-pending";
      const badgeText = isPaid ? "PAID" : "CREDIT";

      return `
        <tr>
          <td><strong class="text-dark">#${inv.invoiceNumber || inv.id}</strong></td>
          <td>${inv.customerName || "Walk-in Patient"}</td>
          <td>${inv.date ? new Date(inv.date).toLocaleDateString() : "Today"}</td>
          <td><strong class="text-primary">${window.APS ? APS.formatCurrency(inv.grandTotal) : "৳ " + inv.grandTotal}</strong></td>
          <td><span class="status-pill ${badgeClass}">${badgeText}</span></td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     2. PRODUCT & MEDICINE CARDS (Replicating Dashboard UI.webp)
  ========================================================== */
  let currentCategory = "all";
  let searchKeyword = "";

  // Distinct clean medication image illustrations for the product cards
  const medicineVisuals = [
    { bg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", icon: "bi-capsule", color: "#0284c7" },
    { bg: "linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)", icon: "bi-prescription2", color: "#059669" },
    { bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", icon: "bi-droplet-half", color: "#d97706" },
    { bg: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)", icon: "bi-heart-pulse", color: "#7c3aed" },
    { bg: "linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)", icon: "bi-bandaid", color: "#e11d48" }
  ];

  function initMedicineCards() {
    renderMedicineCards();

    // Category search input
    const catSearch = $("#categorySearchInput");
    if (catSearch) {
      catSearch.addEventListener("input", (e) => {
        searchKeyword = e.target.value.toLowerCase().trim();
        renderMedicineCards();
      });
    }
  }

  function renderMedicineCards() {
    const grid = $("#medicineCardsGrid");
    if (!grid || !window.APSStore) return;

    let meds = APSStore.getMedicines() || [];

    // Filter by Category
    if (currentCategory !== "all") {
      meds = meds.filter(m => {
        const cat = (m.categoryName || m.category || "").toLowerCase();
        return cat.includes(currentCategory.toLowerCase());
      });
    }

    // Filter by Search Keyword
    if (searchKeyword) {
      meds = meds.filter(m => {
        const name = (m.name || "").toLowerCase();
        const generic = (m.genericName || "").toLowerCase();
        const cat = (m.categoryName || "").toLowerCase();
        return name.includes(searchKeyword) || generic.includes(searchKeyword) || cat.includes(searchKeyword);
      });
    }

    if (!meds.length) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="text-muted fs-5"><i class="bi bi-search me-2"></i>No medicines match the selected filter.</div>
          <button class="btn btn-outline-primary btn-sm mt-3" onclick="resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = meds.map((med, index) => {
      const isOutOfStock = Number(med.totalStock || 0) <= 0;
      const isLowStock = !isOutOfStock && Number(med.totalStock || 0) <= Number(med.reorderLevel || 10);
      const visual = medicineVisuals[index % medicineVisuals.length];
      const priceFormatted = window.APS ? APS.formatCurrency(med.sellingPrice || med.mrp || 10) : `৳ ${med.sellingPrice || med.mrp || 10}`;

      return `
        <div class="product-card ${isOutOfStock ? 'is-out-of-stock' : ''}">
          <!-- Top Card Image Banner -->
          <div class="product-img-wrap" style="background: ${visual.bg};">
            <i class="bi ${visual.icon} product-card-icon" style="color: ${visual.color};"></i>
            ${isOutOfStock ? `
              <div class="out-of-stock-badge">Out of Stock</div>
            ` : `
              <div class="in-stock-check" title="Available in Dispensary">
                <i class="bi bi-check2"></i>
              </div>
            `}
          </div>

          <!-- Product Details -->
          <div class="product-card-body">
            <div class="product-title" title="${med.name}">${med.name}</div>
            <div class="product-generic-text">${med.genericName || med.composition || "Pharmaceutical Grade"}</div>

            <div class="product-footer-row">
              <div class="product-price">${priceFormatted}</div>
              <div class="product-stock-tag ${isLowStock ? 'text-warning' : isOutOfStock ? 'text-danger' : 'text-success'}">
                ${isOutOfStock ? '0 units' : `${med.totalStock} in stock`}
              </div>
            </div>

            <!-- Quick Action Button -->
            <button
              type="button"
              class="btn-product-action ${isOutOfStock ? 'btn-disabled' : ''}"
              onclick="handleQuickOrder('${med.id}', '${med.name}', ${med.sellingPrice || med.mrp || 10})"
              ${isOutOfStock ? 'disabled' : ''}
            >
              <i class="bi bi-cart-plus me-1"></i> Order at POS
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  window.handleQuickOrder = (medId, medName, price) => {
    // Navigate to POS with preselected medicine
    sessionStorage.setItem("apsQuickSelectMed", medId);
    window.location.href = "pos.html";
  };

  window.resetFilters = () => {
    currentCategory = "all";
    searchKeyword = "";
    $$(".category-pill").forEach(p => p.classList.toggle("active", p.dataset.cat === "all"));
    const catInput = $("#categorySearchInput");
    if (catInput) catInput.value = "";
    renderMedicineCards();
  };

  /* =========================================================
     3. CATEGORY FILTER PILLS (Replicating Dashboard UI.webp)
  ========================================================== */
  function initCategoryPills() {
    const pills = $$(".category-pill");
    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentCategory = pill.dataset.cat || "all";
        renderMedicineCards();
      });
    });
  }

  /* =========================================================
     4. SALES PERFORMANCE CHART (Chart.js with Indigo Theme)
  ========================================================== */
  function initSalesPerformanceChart() {
    const canvas = $("#salesChart");
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext("2d");
    const chartSets = {
      7: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
        data: [1840, 2450, 3100, 3900, 3600, 4800, 5400]
      },
      30: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        data: [16800, 21500, 28400, 34200]
      }
    };

    let currentRange = "7";

    // Modern blue-indigo gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(91, 75, 245, 0.35)");
    gradient.addColorStop(0.7, "rgba(0, 152, 234, 0.12)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    const salesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartSets[currentRange].labels,
        datasets: [{
          label: "Sales Revenue",
          data: chartSets[currentRange].data,
          borderColor: "#5b4bf5",
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.38,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#0098ea",
          pointBorderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0f172a",
            titleFont: { family: "Plus Jakarta Sans", size: 12, weight: 600 },
            bodyFont: { family: "Plus Jakarta Sans", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` Revenue: ৳ ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#64748b", font: { family: "Plus Jakarta Sans", size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: {
              color: "#64748b",
              font: { family: "Plus Jakarta Sans", size: 11 },
              callback: (val) => "৳" + val
            }
          }
        }
      }
    });

    $("#chartRange")?.addEventListener("change", (e) => {
      currentRange = e.target.value;
      salesChart.data.labels = chartSets[currentRange].labels;
      salesChart.data.datasets[0].data = chartSets[currentRange].data;
      salesChart.update();
    });
  }

  /* =========================================================
     5. GLOBAL SEARCH INPUT (Top Header)
  ========================================================== */
  function initGlobalSearch() {
    const topSearch = $("#topSearchInput");
    if (topSearch) {
      topSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          searchKeyword = topSearch.value.toLowerCase().trim();
          const catInput = $("#categorySearchInput");
          if (catInput) catInput.value = topSearch.value;
          renderMedicineCards();
          // Scroll down to cards
          $("#medicineCardsSection")?.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }

})();