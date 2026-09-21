/**
 * APS Medical Management System — Alerts & Stock Intelligence Controller
 * Aggregates low stock alerts, near-expiry countdowns, dead-stock detection, and reorders.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);

  document.addEventListener("DOMContentLoaded", () => {
    refreshAlerts();
  });

  function refreshAlerts() {
    const alerts = APSStore.getAlerts();

    // KPI Counters
    $("#alertLowStockCount").textContent = alerts.lowStock.length;
    $("#alertNearExpiryCount").textContent = alerts.expiringBatches.length;
    $("#alertDeadStockCount").textContent = alerts.deadStock.length;
    $("#alertReorderCount").textContent = alerts.reorders.length;

    // 1. Low Stock Table
    const lowTbody = $("#lowStockTableBody");
    if (!alerts.lowStock.length) {
      lowTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-success fw-medium"><i class="bi bi-shield-check me-1"></i> All active medicines are above minimum reorder levels.</td></tr>`;
    } else {
      lowTbody.innerHTML = alerts.lowStock.map(item => `
        <tr>
          <td><strong class="text-teal-900">${APS.escapeHtml(item.medicineName)}</strong></td>
          <td><span class="badge ${item.currentStock === 0 ? 'bg-danger' : 'bg-warning text-dark'} fs-6">${item.currentStock} ${item.unit}</span></td>
          <td>${item.reorderLevel} ${item.unit}</td>
          <td><strong>${item.recommendedOrderQty} ${item.unit}</strong></td>
          <td>
            ${item.currentStock === 0 ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Critical: Out of Stock</span>' : '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">Low Stock Warning</span>'}
          </td>
          <td class="text-end">
            <a href="purchases.html" class="btn btn-sm btn-primary rounded-pill px-3">
              <i class="bi bi-cart-plus me-1"></i>Order Stock
            </a>
          </td>
        </tr>
      `).join("");
    }

    // 2. Expiry Countdown Table
    const expTbody = $("#expiryTableBody");
    if (!alerts.expiringBatches.length) {
      expTbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-success fw-medium"><i class="bi bi-check-circle me-1"></i> No batches expiring within the next 60 days.</td></tr>`;
    } else {
      expTbody.innerHTML = alerts.expiringBatches.map(b => {
        let badge = `<span class="badge-near-expiry">${b.daysToExpiry} days left</span>`;
        if (b.daysToExpiry <= 0) {
          badge = `<span class="badge-expired">Expired ${Math.abs(b.daysToExpiry)} days ago</span>`;
        } else if (b.daysToExpiry <= 30) {
          badge = `<span class="badge-expired">Urgent: ${b.daysToExpiry} days left</span>`;
        }

        return `
          <tr>
            <td><strong class="text-teal-900">${APS.escapeHtml(b.medicineName)}</strong></td>
            <td><span class="badge bg-light text-dark border font-monospace">${APS.escapeHtml(b.batchNumber)}</span></td>
            <td><strong>${b.expiryDate}</strong></td>
            <td>${badge}</td>
            <td><strong>${b.quantityAvailable}</strong> ${b.unit}</td>
            <td><span class="badge bg-light text-dark border">${b.severity.toUpperCase()}</span></td>
            <td class="text-end">
              <a href="inventory.html" class="btn btn-sm btn-outline-danger rounded-pill px-3">
                <i class="bi bi-sliders me-1"></i>Write-off / Dispose
              </a>
            </td>
          </tr>
        `;
      }).join("");
    }

    // 3. Dead Stock Table
    const deadTbody = $("#deadStockTableBody");
    if (!alerts.deadStock.length) {
      deadTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No dead stock identified. Inventory turnover is active.</td></tr>`;
    } else {
      deadTbody.innerHTML = alerts.deadStock.map(d => `
        <tr>
          <td><strong class="text-teal-900">${APS.escapeHtml(d.medicineName)}</strong></td>
          <td><span class="badge bg-light text-dark border font-monospace">${APS.escapeHtml(d.batchNumber)}</span></td>
          <td><strong class="text-danger">${d.quantityStuck} units</strong></td>
          <td><strong class="text-teal-700">৳${d.capitalTiedUp.toLocaleString()}</strong></td>
          <td>${d.daysSinceMfg} days</td>
          <td><span class="badge bg-warning-subtle text-dark border">Zero Sales Movement</span></td>
        </tr>
      `).join("");
    }

    // 4. Reorders Table
    const reorderTbody = $("#reorderTableBody");
    if (!alerts.reorders.length) {
      reorderTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-success fw-medium">All inventories healthy. No bulk reorders required at this time.</td></tr>`;
    } else {
      reorderTbody.innerHTML = alerts.reorders.map(r => `
        <tr>
          <td><strong class="text-teal-900">${APS.escapeHtml(r.medicineName)}</strong></td>
          <td><span class="badge bg-light text-danger border">${r.currentStock}</span></td>
          <td>${r.reorderLevel}</td>
          <td>${r.avgDailySales} units/day</td>
          <td><strong class="text-success fs-6">${r.recommendedQty} units</strong></td>
        </tr>
      `).join("");
    }
  }

})();
