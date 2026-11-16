/**
 * APS Medical Management System — Inventory & FEFO Ledger Controller
 * Barcode Auto-Fill Stock Inward: Scanning medicine package barcode auto-fills
 * medicine, batch number, dates, supplier and pricing — leaving only the stock quantity to enter manually!
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
  let cameraModalInstance = null;
  let unregisteredModalInstance = null;
  let cameraScannerEngine = null;

  document.addEventListener("DOMContentLoaded", () => {
    batchModalInstance = new bootstrap.Modal($("#batchModal"));
    adjustModalInstance = new bootstrap.Modal($("#adjustModal"));
    if ($("#cameraScannerModal")) {
      cameraModalInstance = new bootstrap.Modal($("#cameraScannerModal"));
    }
    if ($("#unregisteredMedModal")) {
      unregisteredModalInstance = new bootstrap.Modal($("#unregisteredMedModal"));
    }

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

    // Check URL parameters for direct scan trigger (e.g. from Medicines or POS)
    const urlParams = new URLSearchParams(window.location.search);
    const scanCode = urlParams.get("scan");
    if (scanCode) {
      setTimeout(() => {
        handleScannedBarcode(scanCode);
      }, 350);
    }
  });

  // Re-render when fresh data arrives from PostgreSQL
  window.addEventListener("aps:sync", () => {
    refreshKPIs();
    populateDropdowns();
    renderBatches();
    renderLedger();
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
      const currentVal = medSelect.value;
      medSelect.innerHTML = `<option value="" disabled selected>Select medicine...</option>` +
        meds.map(m => `<option value="${m.id}" data-barcode="${m.barcode || ''}">${APS.escapeHtml(m.name)} (${m.unit})</option>`).join("");
      if (currentVal) medSelect.value = currentVal;
    }

    // Batch modal: select supplier
    const supSelect = $("#newBatchSupplier");
    if (supSelect) {
      const currentVal = supSelect.value;
      supSelect.innerHTML = `<option value="">Direct / Self Sourced</option>` +
        sups.map(s => `<option value="${s.id}">${APS.escapeHtml(s.name)}</option>`).join("");
      if (currentVal) supSelect.value = currentVal;
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
        <tr id="batch-row-${b.id}">
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
     5. BARCODE STOCK RECEIVING & AUTO-FILL ENGINE
     "when it is scanned the whole information will be already filled,
      just how much stock it will needed to be entered manually."
  ========================================================== */

  function handleScannedBarcode(code) {
    if (!code) return;
    const clean = String(code).trim();
    if (!clean) return;

    // Check if medicine exists in the catalog
    const med = APSStore.getMedicineByBarcode(clean);

    if (!med) {
      // Medicine is not in the database!
      APS.playAlertSound();
      showUnregisteredMedicineModal(clean);
      return;
    }

    // Medicine found! Auto-fill everything in the batch registration modal
    autoFillBatchModalForMedicine(med, clean);
  }

  function autoFillBatchModalForMedicine(med, barcode = "") {
    APS.playScanSound();

    populateDropdowns();
    $("#batchForm").reset();

    // 1. Select the medicine
    $("#newBatchMedId").value = med.id;
    if (barcode) {
      $("#batchBarcodeScanInput").value = barcode;
    }

    // 2. Fetch past pricing and supplier data or catalog defaults
    const latestBatch = APSStore.getLatestBatchForMedicine(med.id);
    const catalogData = APSStore.lookupBarcodeDrugCatalog(barcode || med.barcode);

    const cost = latestBatch ? Number(latestBatch.purchasePrice).toFixed(2) : (catalogData.costPrice || 2.50).toFixed(2);
    const price = latestBatch ? Number(latestBatch.sellingPrice).toFixed(2) : (catalogData.sellingPrice || 3.50).toFixed(2);
    const mrp = latestBatch ? Number(latestBatch.mrp || latestBatch.sellingPrice).toFixed(2) : (catalogData.mrp || price);
    const supplierId = latestBatch ? (latestBatch.supplierId || "") : (catalogData.supplierId || "sup-1");

    $("#newBatchCost").value = cost;
    $("#newBatchPrice").value = price;
    $("#newBatchMrp").value = mrp;
    if (supplierId) $("#newBatchSupplier").value = supplierId;

    // 3. Auto-generate sequential Batch Number
    const medInitials = (med.name || "BN").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "BCH";
    const dateCode = new Date().toISOString().slice(2, 7).replace("-", ""); // e.g. 2611
    const randSeq = Math.floor(100 + Math.random() * 900);
    const autoBatchNum = `${medInitials}-${dateCode}-${randSeq}`;
    $("#newBatchNumber").value = autoBatchNum;

    // 4. Auto-generate Dates
    const today = new Date();
    const mfgDate = today.toISOString().split("T")[0];

    const expDateObj = new Date();
    expDateObj.setFullYear(expDateObj.getFullYear() + 2); // Standard 2-year FEFO pharmaceutical shelf life
    const expDate = expDateObj.toISOString().split("T")[0];

    $("#newBatchMfgDate").value = mfgDate;
    $("#newBatchExpDate").value = expDate;

    // 5. Visual Notification Notice
    const noticeEl = $("#batchScanAutoFillNotice");
    if (noticeEl) {
      noticeEl.className = "alert alert-success py-2 px-3 small mt-2 mb-0 d-flex align-items-center gap-2 border-0 shadow-sm";
      noticeEl.innerHTML = `
        <i class="bi bi-check-circle-fill text-success fs-5"></i>
        <div>
          <strong>${APS.escapeHtml(med.name)} details auto-filled!</strong>
          <div>Batch: <span class="font-monospace fw-bold text-dark">${autoBatchNum}</span> | Exp: ${expDate} | Cost: ৳${cost} | Sell: ৳${price}. <strong>Enter stock quantity below.</strong></div>
        </div>
      `;
    }

    // 6. Open Modal
    batchModalInstance.show();

    // 7. Focus on Quantity Received field — user ONLY types the number!
    setTimeout(() => {
      const qtyInput = $("#newBatchQty");
      if (qtyInput) {
        qtyInput.value = "";
        qtyInput.focus();
      }
    }, 400);

    APS.showToast(`Auto-filled details for ${med.name}! Enter stock quantity.`, "success");
  }

  function showUnregisteredMedicineModal(barcode) {
    const textEl = $("#unregisteredBarcodeText");
    if (textEl) textEl.textContent = barcode;

    const addBtn = $("#goToAddMedicineBtn");
    if (addBtn) {
      addBtn.onclick = () => {
        window.location.href = `medicines.html?scan=${encodeURIComponent(barcode)}`;
      };
    }

    unregisteredModalInstance?.show();
    APS.showToast(`Barcode ${barcode} not in medicines catalog. Add it first.`, "warning");
  }

  /* =========================================================
     6. EVENT LISTENERS
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

    // "Scan to Add Stock" Top Action Button
    $("#scanAddStockBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner();
    });

    // In-modal "Camera Scan" button
    $("#openBatchCameraScanBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner();
    });

    // In-modal barcode input (Enter key triggers scan auto-fill)
    $("#batchBarcodeScanInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const code = e.target.value.trim();
        if (code) handleScannedBarcode(code);
      }
    });

    // Regular Add Batch button (manual)
    $("#addBatchBtn")?.addEventListener("click", () => {
      $("#batchForm").reset();
      populateDropdowns();
      const noticeEl = $("#batchScanAutoFillNotice");
      if (noticeEl) {
        noticeEl.className = "small text-muted mt-1";
        noticeEl.innerHTML = `<i class="bi bi-info-circle me-1"></i> Scan medicine barcode or select medicine below to auto-fill details.`;
      }
      batchModalInstance.show();
    });

    // When a medicine is manually selected from dropdown, auto-fill default prices and batch
    $("#newBatchMedId")?.addEventListener("change", (e) => {
      const medId = e.target.value;
      const med = APSStore.getMedicineById(medId);
      if (med) {
        const latestBatch = APSStore.getLatestBatchForMedicine(med.id);
        if (latestBatch) {
          if (!$("#newBatchCost").value) $("#newBatchCost").value = Number(latestBatch.purchasePrice).toFixed(2);
          if (!$("#newBatchPrice").value) $("#newBatchPrice").value = Number(latestBatch.sellingPrice).toFixed(2);
          if (!$("#newBatchMrp").value) $("#newBatchMrp").value = Number(latestBatch.mrp || latestBatch.sellingPrice).toFixed(2);
          if (!$("#newBatchSupplier").value && latestBatch.supplierId) $("#newBatchSupplier").value = latestBatch.supplierId;
        }
        if (!$("#newBatchNumber").value) {
          const initials = (med.name || "BN").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "BCH";
          const dateCode = new Date().toISOString().slice(2, 7).replace("-", "");
          const randSeq = Math.floor(100 + Math.random() * 900);
          $("#newBatchNumber").value = `${initials}-${dateCode}-${randSeq}`;
        }
        if (!$("#newBatchMfgDate").value) $("#newBatchMfgDate").value = new Date().toISOString().split("T")[0];
        if (!$("#newBatchExpDate").value) {
          const exp = new Date();
          exp.setFullYear(exp.getFullYear() + 2);
          $("#newBatchExpDate").value = exp.toISOString().split("T")[0];
        }
      }
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

      const savedBatch = APSStore.saveBatch({
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

      // Highlight the registered batch in table
      setTimeout(() => {
        const row = document.getElementById(`batch-row-${savedBatch.id}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("row-highlight-pulse");
        }
      }, 150);

      APS.showToast(`Batch ${batchNumber} (${qty} units) registered successfully!`, "success");
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
        APS.showToast(`Inventory adjusted: ${qtyDelta > 0 ? "+" : ""}${qtyDelta} units.`);
        APS.playAlertSound();
      } catch (err) {
        alert(err.message);
      }
    });

    // Camera Scanner Modal events
    $("#cameraScannerModal")?.addEventListener("hidden.bs.modal", () => {
      stopCameraScanner();
    });
    // Mobile Snap Photo & Torch Controls
    $$(".btn-take-photo", $("#cameraScannerModal"))?.forEach(btn => {
      btn.addEventListener("click", () => {
        $("#cameraScannerModal .camera-photo-file-input")?.click();
      });
    });

    $("#cameraScannerModal .camera-photo-file-input")?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file && cameraScannerEngine) {
        cameraScannerEngine.scanImageFile(file);
      }
    });

        $$(".scanner-torch-btn", $("#cameraScannerModal"))?.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        if (cameraScannerEngine) {
          const state = await cameraScannerEngine.toggleTorch();
          btn.classList.toggle("btn-warning", state);
          btn.classList.toggle("btn-outline-light", !state);
        }
      });
    });


    // Quick test buttons inside scanner modal
    $$(".test-barcode-btn", $("#cameraScannerModal"))?.forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.code;
        stopCameraScanner();
        cameraModalInstance?.hide();
        handleScannedBarcode(code);
      });
    });

    // Global Hardware USB Barcode Scanner Listener
    APS.initUSBBarcodeListener((scannedCode) => {
      handleScannedBarcode(scannedCode);
    });
  }

  /* =========================================================
     7. OPTICAL CAMERA SCANNER ENGINE
  ========================================================== */

  function startCameraScanner() {
    if (cameraScannerEngine) {
      cameraScannerEngine.stop();
    }

    cameraScannerEngine = APS.createCameraBarcodeScanner({
      containerId: "cameraScannerVideoContainer",
      statusId: "cameraScannerStatus",
      modalId: "cameraScannerModal",
      onScan: (decodedText) => {
        handleScannedBarcode(decodedText);
      }
    });

    cameraScannerEngine.start();
  }

  function stopCameraScanner() {
    if (cameraScannerEngine) {
      cameraScannerEngine.stop();
      cameraScannerEngine = null;
    }
  }

})();
