/**
 * APS Medical Management System — Inventory & FEFO Ledger Controller
 * Handles batch stock tracking, FEFO ordering, stock adjustments, and movements ledger.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let currentBatchSearch = "";
  let currentBatchSort = "fefo";
  let currentMovementFilter = "all";

  let batchModalInstance = null;
  let adjustModalInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    batchModalInstance = new bootstrap.Modal($("#batchModal"));
    adjustModalInstance = new bootstrap.Modal($("#adjustModal"));

    // Check if URL has #ledger hash
    if (window.location.hash === "#ledger") {
      const ledgerTab = new bootstrap.Tab($("#ledger-tab"));
      ledgerTab.show();
    }

    refreshKPIs();
    populateDropdowns();
    renderBatches();
    renderLedger();
    initEventListeners();
  });

  /* =========================================================
     1. KPIS REFRESH
  ========================================================== */

  function refreshKPIs() {
    const batches = APSStore.getBatches();
    const analytics = APSStore.getAnalytics();

    const totalBatchesEl = $("#totalBatchesCount");
    if (totalBatchesEl) totalBatchesEl.textContent = batches.length;

    const totalUnits = batches.reduce((sum, b) => sum + Number(b.quantityAvailable || 0), 0);
    const totalUnitsEl = $("#totalUnitsCount");
    if (totalUnitsEl) totalUnitsEl.textContent = totalUnits.toLocaleString();

    const nearExpiry = batches.filter(b => b.quantityAvailable > 0 && b.daysToExpiry <= 60 && b.daysToExpiry > 0);
    const nearExpiryEl = $("#nearExpiryCount");
    if (nearExpiryEl) nearExpiryEl.textContent = nearExpiry.length;

    const valuationEl = $("#inventoryValuation");
    if (valuationEl) valuationEl.textContent = "৳ " + Number(analytics.inventoryValuation).toLocaleString();
  }

  /* =========================================================
     2. POPULATE DROPDOWNS
  ========================================================== */

  function populateDropdowns() {
    const meds = APSStore.getMedicines();
    const sups = APSStore.getSuppliers();
    const batches = APSStore.getBatches();

    // Batch modal: select medicine
    const medSelect = $("#newBatchMedId");
    if (medSelect) {
      medSelect.innerHTML = `<option value="" disabled selected>Select medicine...</option>` +
        meds.map(m => `<option value="${m.id}">${APS.escapeHtml(m.name)} (${m.unit})</option>`).join("");
    }

    // Batch modal: select supplier
    const supSelect = $("#newBatchSupplier");
    if (supSelect) {
      supSelect.innerHTML = `<option value="">Direct / Self Sourced</option>` +
        sups.map(s => `<option value="${s.id}">${APS.escapeHtml(s.name)}</option>`).join("");
    }

    // Adjust modal: select batch
    const adjustBatchSelect = $("#adjustBatchSelect");
    if (adjustBatchSelect) {
      adjustBatchSelect.innerHTML = `<option value="" disabled selected>Select batch to adjust...</option>` +
        batches.map(b => `<option value="${b.id}">${APS.escapeHtml(b.medicineName)} — Batch: ${APS.escapeHtml(b.batchNumber)} (Avail: ${b.quantityAvailable})</option>`).join("");
    }
  }

  /* =========================================================
     3. RENDER BATCHES TABLE (WITH FEFO SORT)
  ========================================================== */

  function renderBatches() {
    const tbody = $("#batchTableBody");
    if (!tbody) return;

    let batches = APSStore.getBatches();

    // Search filter
    if (currentBatchSearch) {
      batches = batches.filter(b => 
        b.medicineName.toLowerCase().includes(currentBatchSearch) ||
        b.batchNumber.toLowerCase().includes(currentBatchSearch)
      );
    }

    // Sorting
    if (currentBatchSort === "fefo") {
      // FEFO: Earliest expiry date first
      batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    } else if (currentBatchSort === "stock_desc") {
      batches.sort((a, b) => b.quantityAvailable - a.quantityAvailable);
    } else if (currentBatchSort === "batch_asc") {
      batches.sort((a, b) => a.batchNumber.localeCompare(b.batchNumber));
    }

    if (!batches.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No batches match criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = batches.map(b => {
      let statusBadge = `<span class="badge-fefo"><i class="bi bi-shield-check me-1"></i>Healthy</span>`;
      if (b.expiryStatus === "expired") {
        statusBadge = `<span class="badge-expired"><i class="bi bi-x-circle-fill me-1"></i>Expired (${Math.abs(b.daysToExpiry)}d ago)</span>`;
      } else if (b.expiryStatus === "urgent") {
        statusBadge = `<span class="badge-expired"><i class="bi bi-exclamation-triangle-fill me-1"></i>Expires in ${b.daysToExpiry}d</span>`;
      } else if (b.expiryStatus === "warning") {
        statusBadge = `<span class="badge-near-expiry"><i class="bi bi-clock-history me-1"></i>Expires in ${b.daysToExpiry}d</span>`;
      }

      return `
        <tr>
          <td>
            <strong class="text-teal-900">${APS.escapeHtml(b.medicineName)}</strong>
            <small class="d-block text-muted">ID: ${b.medicineId}</small>
          </td>
          <td>
            <span class="badge bg-light text-dark border font-monospace px-2 py-1">${APS.escapeHtml(b.batchNumber)}</span>
          </td>
          <td>
            <div class="fw-semibold">${b.expiryDate}</div>
            <small class="text-muted">Mfg: ${b.manufactureDate || "—"}</small>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div>Cost: ৳${Number(b.purchasePrice).toFixed(2)}</div>
            <small class="text-muted">Sell: ৳${Number(b.sellingPrice).toFixed(2)} | MRP: ৳${Number(b.mrp || b.sellingPrice).toFixed(2)}</small>
          </td>
          <td>
            <span class="fw-bold ${b.quantityAvailable === 0 ? 'text-danger' : 'text-success'}">${b.quantityAvailable}</span>
            <span class="text-muted">/ ${b.quantityReceived} ${b.unit}s</span>
          </td>
          <td><small class="text-muted">${APS.escapeHtml(b.supplierName)}</small></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger rounded-pill px-2 py-0" data-adjust-batch-id="${b.id}" title="Adjust or write off stock">
              <i class="bi bi-sliders me-1"></i>Adjust
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     4. RENDER INVENTORY MOVEMENT LEDGER
  ========================================================== */

  function renderLedger() {
    const tbody = $("#ledgerTableBody");
    if (!tbody) return;

    let movements = APSStore.getMovements();

    if (currentMovementFilter !== "all") {
      movements = movements.filter(m => m.movementType === currentMovementFilter);
    }

    if (!movements.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No inventory movement entries recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = movements.map(m => {
      const isPositive = m.quantity > 0;
      const qtyClass = isPositive ? "text-success fw-bold" : "text-danger fw-bold";
      const deltaText = isPositive ? `+${m.quantity}` : `${m.quantity}`;

      let typeBadge = `<span class="badge bg-secondary">${m.movementType}</span>`;
      if (m.movementType === "SALE") typeBadge = `<span class="badge bg-primary">SALE (POS)</span>`;
      else if (m.movementType === "PURCHASE" || m.movementType === "IN") typeBadge = `<span class="badge bg-success">PURCHASE (IN)</span>`;
      else if (m.movementType === "ADJUSTMENT") typeBadge = `<span class="badge bg-warning text-dark">ADJUSTMENT</span>`;
      else if (m.movementType === "RETURN") typeBadge = `<span class="badge bg-info text-dark">RETURN</span>`;

      return `
        <tr>
          <td><small class="text-muted">${m.createdAt}</small></td>
          <td>
            <strong>${APS.escapeHtml(m.medicineName)}</strong>
            <small class="d-block text-muted">Batch: ${APS.escapeHtml(m.batchNumber)}</small>
          </td>
          <td>${typeBadge}</td>
          <td class="${qtyClass}">${deltaText}</td>
          <td><span class="badge bg-light text-dark border">${APS.escapeHtml(m.referenceType)}: ${APS.escapeHtml(m.referenceId)}</span></td>
          <td><strong class="text-teal-900">${m.balanceAfter}</strong></td>
          <td><small>${APS.escapeHtml(m.createdBy)}</small></td>
          <td><small class="text-muted">${APS.escapeHtml(m.notes || "—")}</small></td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     5. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Search batch
    $("#batchSearchInput")?.addEventListener("input", (e) => {
      currentBatchSearch = e.target.value.trim().toLowerCase();
      renderBatches();
    });

    // Sort batch
    $("#batchSortSelect")?.addEventListener("change", (e) => {
      currentBatchSort = e.target.value;
      renderBatches();
    });

    // Movement ledger filter
    $("#movementTypeFilter")?.addEventListener("change", (e) => {
      currentMovementFilter = e.target.value;
      renderLedger();
    });

    // Add Batch button
    $("#addBatchBtn")?.addEventListener("click", () => {
      $("#batchForm").reset();
      populateDropdowns();
      batchModalInstance.show();
    });

    // Add Batch Form Submit
    $("#batchForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const medId = $("#newBatchMedId").value;
      const batchNumber = $("#newBatchNumber").value.trim().toUpperCase();
      const mfgDate = $("#newBatchMfgDate").value;
      const expDate = $("#newBatchExpDate").value;
      const cost = Number($("#newBatchCost").value);
      const price = Number($("#newBatchPrice").value);
      const mrp = Number($("#newBatchMrp").value || price);
      const qty = Number($("#newBatchQty").value);
      const supplierId = $("#newBatchSupplier").value || null;

      if (!medId || !batchNumber || !expDate || !qty) return;

      APSStore.saveBatch({
        medicineId: medId,
        batchNumber,
        manufactureDate: mfgDate,
        expiryDate: expDate,
        purchasePrice: cost,
        sellingPrice: price,
        mrp: mrp,
        quantityReceived: qty,
        quantityAvailable: qty,
        supplierId
      });

      batchModalInstance.hide();
      refreshKPIs();
      populateDropdowns();
      renderBatches();
      renderLedger();
      APS.showToast(`Batch ${batchNumber} registered successfully.`);
      APS.playSuccessSound();
    });

    // Quick adjust trigger from table
    $("#batchTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-adjust-batch-id]");
      if (btn) {
        const batchId = btn.dataset.adjustBatchId;
        $("#adjustBatchSelect").value = batchId;
        adjustModalInstance.show();
      }
    });

    // Stock Adjustment Modal Trigger
    $("#stockAdjustmentBtn")?.addEventListener("click", () => {
      $("#adjustForm").reset();
      populateDropdowns();
      adjustModalInstance.show();
    });

    // Stock Adjustment Form Submit
    $("#adjustForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const batchId = $("#adjustBatchSelect").value;
      const reason = $("#adjustReason").value;
      const qtyDelta = Number($("#adjustQty").value);
      const notes = $("#adjustNotes").value.trim();

      if (!batchId || !qtyDelta) return;

      try {
        APSStore.adjustBatchStock(batchId, qtyDelta, reason, notes);
        adjustModalInstance.hide();
        refreshKPIs();
        renderBatches();
        renderLedger();
        APS.showToast(`Inventory adjusted: ${qtyDelta > 0 ? '+' : ''}${qtyDelta} units.`);
        APS.playAlertSound();
      } catch (err) {
        alert(err.message);
      }
    });
  }

})();
