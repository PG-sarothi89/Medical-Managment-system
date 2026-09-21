/**
 * APS Medical Management System — Business Intelligence & Reports Controller
 * Visualizes 4 enterprise Chart.js charts, demand forecasting, and analytics exports.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);

  document.addEventListener("DOMContentLoaded", () => {
    refreshAnalytics();
    initCharts();
    initExportButtons();
  });

  /* =========================================================
     1. REFRESH METRICS & LISTS
  ========================================================== */

  function refreshAnalytics() {
    const analytics = APSStore.getAnalytics();

    $("#biRevenue").textContent = "৳ " + analytics.totalRevenue.toLocaleString("en-BD", { minimumFractionDigits: 2 });
    $("#biProfit").textContent = "৳ " + analytics.grossProfit.toLocaleString("en-BD", { minimumFractionDigits: 2 });
    $("#biMargin").textContent = analytics.profitMargin;
    $("#biValuation").textContent = "৳ " + Number(analytics.inventoryValuation).toLocaleString();

    // Fast-Moving List
    const fastList = $("#fastMovingList");
    if (!analytics.fastMoving.length) {
      fastList.innerHTML = `<li class="list-group-item text-muted small py-3">No sales velocity recorded yet.</li>`;
    } else {
      fastList.innerHTML = analytics.fastMoving.map((item, idx) => `
        <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-0">
          <div>
            <span class="badge bg-teal-100 text-teal-900 me-2">#${idx + 1}</span>
            <strong class="text-teal-900">${APS.escapeHtml(item.name)}</strong>
          </div>
          <span class="badge bg-success-subtle text-success fs-6 fw-bold">${item.qty} units sold</span>
        </li>
      `).join("");
    }

    // Slow-Moving List
    const slowList = $("#slowMovingList");
    if (!analytics.slowMoving.length) {
      slowList.innerHTML = `<li class="list-group-item text-muted small py-3">All catalog drugs have recent movement.</li>`;
    } else {
      slowList.innerHTML = analytics.slowMoving.map(item => `
        <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-0">
          <div>
            <strong class="text-teal-900">${APS.escapeHtml(item.name)}</strong>
            <small class="d-block text-muted">Stock: ${item.totalStock} ${item.unit}s</small>
          </div>
          <span class="badge bg-warning-subtle text-dark border">Low Velocity</span>
        </li>
      `).join("");
    }
  }

  /* =========================================================
     2. CHART.JS VISUALIZATIONS
  ========================================================== */

  function initCharts() {
    if (!window.Chart) return;

    // Chart 1: Sales Trend
    const trendCtx = $("#biSalesTrendChart")?.getContext("2d");
    if (trendCtx) {
      const grad = trendCtx.createLinearGradient(0, 0, 0, 260);
      grad.addColorStop(0, "rgba(47, 158, 152, 0.35)");
      grad.addColorStop(1, "rgba(47, 158, 152, 0.01)");

      new Chart(trendCtx, {
        type: "line",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
          datasets: [{
            label: "Monthly Revenue (৳)",
            data: [42000, 58000, 64000, 78000, 71000, 89000, 94000, 112000, 128000],
            borderColor: "#1b5f5b",
            backgroundColor: grad,
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#1b5f5b"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { callback: v => "৳" + (v/1000) + "k" } }
          }
        }
      });
    }

    // Chart 2: Category Share (Donut)
    const catCtx = $("#biCategoryDonutChart")?.getContext("2d");
    if (catCtx) {
      new Chart(catCtx, {
        type: "doughnut",
        data: {
          labels: ["Analgesics", "Antibiotics", "Gastro", "Diabetic", "Vitamins", "Others"],
          datasets: [{
            data: [32, 24, 18, 14, 8, 4],
            backgroundColor: ["#1b5f5b", "#2f9e98", "#45b8b3", "#75d0a0", "#f1bb19", "#3189bd"],
            borderWidth: 2,
            borderColor: "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } }
          },
          cutout: "68%"
        }
      });
    }

    // Chart 3: 30-Day Demand Forecasting Line Chart
    const forecastCtx = $("#biForecastChart")?.getContext("2d");
    if (forecastCtx) {
      new Chart(forecastCtx, {
        type: "line",
        data: {
          labels: ["Day 1-5", "Day 6-10", "Day 11-15", "Day 16-20", "Day 21-25", "Day 26-30"],
          datasets: [
            {
              label: "Actual Past Run-Rate",
              data: [120, 145, 138, 160, null, null],
              borderColor: "#1b5f5b",
              borderWidth: 2,
              tension: 0.3
            },
            {
              label: "Predictive Forecast (Units)",
              data: [null, null, null, 160, 185, 210],
              borderColor: "#2f9e98",
              borderDash: [5, 5],
              borderWidth: 2,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top", labels: { boxWidth: 12 } } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
          }
        }
      });
    }

    // Chart 4: Profit vs COGS (Bar)
    const profitCtx = $("#biProfitBarChart")?.getContext("2d");
    if (profitCtx) {
      new Chart(profitCtx, {
        type: "bar",
        data: {
          labels: ["Analgesics", "Antibiotics", "Gastro", "Diabetic", "Vitamins"],
          datasets: [
            {
              label: "Gross Profit (৳)",
              data: [14200, 9800, 8400, 6200, 4800],
              backgroundColor: "#2f9e98",
              borderRadius: 6
            },
            {
              label: "Cost of Goods (৳)",
              data: [19800, 15200, 12600, 18400, 7200],
              backgroundColor: "#c2ece9",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { callback: v => "৳" + (v/1000) + "k" } }
          }
        }
      });
    }
  }

  /* =========================================================
     3. EXPORT CONTROLS
  ========================================================== */

  function initExportButtons() {
    // Export CSV
    $("#exportCsvBtn")?.addEventListener("click", () => {
      const analytics = APSStore.getAnalytics();
      const sales = APSStore.getInvoices();

      let csv = "APS Medical Management System - Business Intelligence Summary\n";
      csv += `Generated Date,${new Date().toLocaleString()}\n`;
      csv += `Total Revenue,৳${analytics.totalRevenue}\n`;
      csv += `Gross Profit,৳${analytics.grossProfit}\n`;
      csv += `Profit Margin,${analytics.profitMargin}\n`;
      csv += `Inventory Valuation,৳${analytics.inventoryValuation}\n\n`;

      csv += "InvoiceNumber,Date,Customer,Subtotal,GST,TotalAmount,PaymentMode\n";
      sales.forEach(s => {
        csv += `"${s.invoiceNumber}","${s.invoiceDate}","${s.customerName}",${s.subtotal},${s.gstAmount},${s.totalAmount},"${s.paymentMode}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `APS_BI_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      APS.showToast("Exported BI summary to CSV.");
    });

    // Download Database JSON Backup
    $("#exportBackupBtn")?.addEventListener("click", () => {
      const jsonStr = APSStore.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `APS_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      APS.showToast("System database backup JSON downloaded.");
      APS.playSuccessSound();
    });
  }

})();
