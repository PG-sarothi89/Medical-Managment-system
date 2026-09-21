/**
 * APS Medical Management System — Executive Dashboard interactions
 * Connects live metrics, inventory gauges, real-time alerts, and Chart.js.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  document.addEventListener("DOMContentLoaded", () => {
    refreshDashboardStats();
    initSalesPerformanceChart();
    initModuleFilter();
  });

  /* =========================================================
     1. LIVE DASHBOARD STATS CALCULATION
  ========================================================== */

  function refreshDashboardStats() {
    if (!window.APSStore) return;

    const meds = APSStore.getMedicines();
    const batches = APSStore.getBatches();
    const alerts = APSStore.getAlerts();
    const analytics = APSStore.getAnalytics();

    // 1. Total Medicines
    const medEl = $("#statTotalMedicines");
    if (medEl) medEl.textContent = meds.length;

    // 2. Total Inventory Units
    const totalUnits = batches.reduce((sum, b) => sum + Number(b.quantityAvailable || 0), 0);
    const stockEl = $("#statTotalStock");
    if (stockEl) stockEl.textContent = totalUnits.toLocaleString();

    // 3. Gross Sales Revenue
    const salesEl = $("#statTotalSales");
    if (salesEl) salesEl.textContent = APS.formatCurrency(analytics.totalRevenue);

    const chartRevEl = $("#chartRevenueTotal");
    if (chartRevEl) chartRevEl.textContent = APS.formatCurrency(analytics.totalRevenue);

    // 4. Active Alerts Count
    const alertsEl = $("#statActiveAlerts");
    const headerAlertEl = $("#headerAlertCount");
    const panelAlertBadge = $("#panelAlertBadge");

    if (alertsEl) alertsEl.textContent = alerts.totalCount;
    if (headerAlertEl) alerts.totalCount > 0 ? (headerAlertEl.textContent = alerts.totalCount, headerAlertEl.style.display = "grid") : headerAlertEl.style.display = "none";
    if (panelAlertBadge) panelAlertBadge.textContent = alerts.totalCount;

    // 5. Stock Health Analysis
    const healthyMeds = meds.filter(m => m.totalStock > m.reorderLevel);
    const lowStockMeds = meds.filter(m => m.totalStock > 0 && m.totalStock <= m.reorderLevel);
    const criticalMeds = meds.filter(m => m.totalStock === 0 || alerts.expiringBatches.some(e => e.medicineId === m.id));

    const totalMedsCount = meds.length || 1;
    const healthyPct = Math.round((healthyMeds.length / totalMedsCount) * 100);

    const healthyPctEl = $("#healthyStockPercent");
    if (healthyPctEl) healthyPctEl.textContent = healthyPct + "%";

    const healthyCountEl = $("#healthyStockCount");
    if (healthyCountEl) healthyCountEl.textContent = healthyMeds.reduce((sum, m) => sum + m.totalStock, 0).toLocaleString();

    const lowCountEl = $("#lowStockCount");
    if (lowCountEl) lowCountEl.textContent = lowStockMeds.reduce((sum, m) => sum + m.totalStock, 0).toLocaleString();

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

      alerts.lowStock.slice(0, 2).forEach(ls => {
        alertItems.push(`
          <div class="alert-item alert-item--red" style="cursor: pointer;" onclick="window.location.href='alerts.html'">
            <span class="alert-item__icon"><i class="bi bi-exclamation-triangle-fill"></i></span>
            <div>
              <strong>Low Stock: ${APS.escapeHtml(ls.medicineName)}</strong>
              <small>Stock: ${ls.currentStock} ${ls.unit} (Reorder: ${ls.reorderLevel})</small>
            </div>
            <i class="bi bi-chevron-right text-muted"></i>
          </div>
        `);
      });

      alerts.expiringBatches.slice(0, 2).forEach(exp => {
        alertItems.push(`
          <div class="alert-item alert-item--yellow" style="cursor: pointer;" onclick="window.location.href='alerts.html'">
            <span class="alert-item__icon"><i class="bi bi-calendar-x-fill"></i></span>
            <div>
              <strong>Near Expiry: ${APS.escapeHtml(exp.medicineName)}</strong>
              <small>Batch ${APS.escapeHtml(exp.batchNumber)} expires in ${exp.daysToExpiry} days</small>
            </div>
            <i class="bi bi-chevron-right text-muted"></i>
          </div>
        `);
      });

      if (!alertItems.length) {
        quickAlertList.innerHTML = `<div class="p-3 text-center text-success fw-medium"><i class="bi bi-shield-check me-1"></i> All stock levels and batch expiries healthy.</div>`;
      } else {
        quickAlertList.innerHTML = alertItems.join("");
      }
    }
  }

  /* =========================================================
     2. SALES PERFORMANCE CHART (Chart.js)
  ========================================================== */

  function initSalesPerformanceChart() {
    const canvas = $("#salesChart");
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext("2d");
    const chartSets = {
      7: {
        labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"],
        data: [1240, 1850, 2400, 3100, 2800, 3600, 4200]
      },
      30: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        data: [14200, 18600, 22400, 28900]
      }
    };

    let currentRange = "7";

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(47, 158, 152, 0.35)");
    gradient.addColorStop(1, "rgba(47, 158, 152, 0.01)");

    const salesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartSets[currentRange].labels,
        datasets: [{
          label: "Sales Revenue",
          data: chartSets[currentRange].data,
          borderColor: "#2f9e98",
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#2f9e98",
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#123a38",
            titleFont: { family: "Poppins", size: 11 },
            bodyFont: { family: "Poppins", size: 11 },
            callbacks: {
              label: (context) => ` Revenue: ৳ ${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#68807d", font: { family: "Poppins", size: 9 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: "#edf2f1" },
            ticks: {
              color: "#68807d",
              font: { family: "Poppins", size: 9 },
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
     3. MODULE CATEGORY FILTER PILLS
  ========================================================== */

  function initModuleFilter() {
    const pills = $$(".module-pill");
    const items = $$(".module-item");

    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        const filter = pill.dataset.module;
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        items.forEach(item => {
          const category = item.dataset.category;
          const match = filter === "all" || category === filter;
          item.style.display = match ? "flex" : "none";
        });
      });
    });
  }

})();
