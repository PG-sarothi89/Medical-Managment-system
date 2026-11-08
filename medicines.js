/**
 * APS Medical Management System — Medicine Management Module
 * Comprehensive Barcode System: live optical decoding, USB gun listening,
 * auto-fill from pharmaceutical master catalog, and instant auto-add for unscanned drugs.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let currentSearch = "";
  let currentCategory = "all";
  let currentRx = "all";

  // Bootstrap Modals
  let medModalInstance = null;
  let barcodeModalInstance = null;
  let categoryModalInstance = null;
  let cameraModalInstance = null;
  let cameraScannerEngine = null;

  document.addEventListener("DOMContentLoaded", () => {
    medModalInstance = new bootstrap.Modal($("#medicineModal"));
    barcodeModalInstance = new bootstrap.Modal($("#barcodeModal"));
    categoryModalInstance = new bootstrap.Modal($("#categoryModal"));
    if ($("#cameraScannerModal")) {
      cameraModalInstance = new bootstrap.Modal($("#cameraScannerModal"));
    }

    populateDropdowns();
    renderMedicineTable();
    initEventListeners();

    // Check URL parameters for search or direct scan
    const urlParams = new URLSearchParams(window.location.search);
    const scanCode = urlParams.get("scan");
    const initialSearch = urlParams.get("search");

    if (scanCode) {
      setTimeout(() => {
        handleScannedBarcode(scanCode);
      }, 350);
    } else if (initialSearch) {
      currentSearch = initialSearch.toLowerCase();
      $("#medSearchInput").value = initialSearch;
      renderMedicineTable();
    }
  });

  // Re-render when fresh data arrives from PostgreSQL
  window.addEventListener("aps:sync", () => {
    populateDropdowns();
    renderMedicineTable();
  });

  /* =========================================================
     1. POPULATE DROPDOWNS
  ========================================================== */

  function populateDropdowns() {
    const cats = APSStore.getCategories();
    const mfrs = APSStore.getManufacturers();

    // Category Filter
    const catFilter = $("#categoryFilter");
    if (catFilter) {
      catFilter.innerHTML = `<option value="all">All Categories</option>` +
        cats.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)}</option>`).join("");
      catFilter.value = currentCategory;
    }

    // Modal Category & Manufacturer selects
    const medCatSelect = $("#medCategory");
    if (medCatSelect) {
      medCatSelect.innerHTML = cats.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)}</option>`).join("");
    }

    const medMfrSelect = $("#medManufacturer");
    if (medMfrSelect) {
      medMfrSelect.innerHTML = mfrs.map(m => `<option value="${m.id}">${APS.escapeHtml(m.name)}</option>`).join("");
    }
  }

  /* =========================================================
     2. RENDER MEDICINES TABLE
  ========================================================== */

  function renderMedicineTable() {
    const tbody = $("#medicineTableBody");
    if (!tbody) return;

    let medicines = APSStore.getMedicines();

    // Apply Search Filter
    if (currentSearch) {
      medicines = medicines.filter(m => 
        m.name.toLowerCase().includes(currentSearch) ||
        m.generic.toLowerCase().includes(currentSearch) ||
        (m.composition && m.composition.toLowerCase().includes(currentSearch)) ||
        (m.barcode && m.barcode.toLowerCase().includes(currentSearch))
      );
    }

    // Apply Category Filter
    if (currentCategory !== "all") {
      medicines = medicines.filter(m => m.categoryId === currentCategory);
    }

    // Apply Rx Filter
    if (currentRx === "rx") {
      medicines = medicines.filter(m => m.requiresPrescription);
    } else if (currentRx === "otc") {
      medicines = medicines.filter(m => !m.requiresPrescription);
    }

    // Update count
    const countEl = $("#medicineCount");
    if (countEl) countEl.textContent = medicines.length;

    if (!medicines.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <strong>No medicines found matching criteria.</strong>
            ${currentSearch ? `<div class="mt-2"><button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" id="clearSearchBtn">Clear Search</button></div>` : ""}
          </td>
        </tr>
      `;
      $("#clearSearchBtn")?.addEventListener("click", () => {
        $("#medSearchInput").value = "";
        currentSearch = "";
        renderMedicineTable();
      });
      return;
    }

    tbody.innerHTML = medicines.map(m => {
      const isLowStock = m.totalStock <= m.reorderLevel;
      const isOutOfStock = m.totalStock === 0;

      let stockBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">${m.totalStock} ${m.unit}s</span>`;
      if (isOutOfStock) {
        stockBadge = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Out of Stock</span>`;
      } else if (isLowStock) {
        stockBadge = `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">${m.totalStock} ${m.unit}s (Low)</span>`;
      }

      const rxBadge = m.requiresPrescription
        ? `<span class="badge-rx">Rx Required</span>`
        : `<span class="badge-otc">OTC</span>`;

      return `
        <tr id="med-row-${m.id}" data-barcode="${m.barcode || ''}">
          <td>
            <div class="fw-bold text-teal-900">${APS.escapeHtml(m.name)}</div>
            <small class="text-muted">${APS.escapeHtml(m.manufacturerName)}</small>
          </td>
          <td>
            <div class="fw-medium text-dark">${APS.escapeHtml(m.generic)}</div>
            <small class="text-muted">${APS.escapeHtml(m.composition || "—")}</small>
          </td>
          <td><span class="badge bg-light text-dark border">${APS.escapeHtml(m.categoryName)}</span></td>
          <td>
            <div>${APS.escapeHtml(m.unit)}</div>
            <small class="text-muted">HSN: ${APS.escapeHtml(m.hsn || "3004.90")}</small>
          </td>
          <td>
            <button class="btn btn-sm btn-light border rounded-pill px-2 py-0 font-monospace text-dark" data-view-barcode="${m.barcode}" data-med-name="${APS.escapeHtml(m.name)}" title="View & print barcode label">
              <i class="bi bi-upc me-1 text-primary"></i>${m.barcode || "No Barcode"}
            </button>
          </td>
          <td>${stockBadge}</td>
          <td>${rxBadge}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-light text-success border-0 me-1" onclick="window.location.href='inventory.html?scan=${m.barcode || ''}'" title="Add stock for this medicine">
              <i class="bi bi-plus-circle"></i> Stock
            </button>
            <button class="btn btn-sm btn-light text-primary border-0 me-1" data-edit-med="${m.id}" title="Edit Medicine">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-light text-danger border-0" data-delete-med="${m.id}" title="Delete Medicine">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function highlightMedicineRow(medId) {
    setTimeout(() => {
      const row = document.getElementById(`med-row-${medId}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        row.classList.remove("row-highlight-pulse");
        void row.offsetWidth; // trigger reflow
        row.classList.add("row-highlight-pulse");
      }
    }, 150);
  }

  /* =========================================================
     3. INTELLIGENT BARCODE PROCESSING ENGINE
     - If medicine is in database: highlights and displays details.
     - If medicine is NOT in database: automatically opens Add Medicine
       modal with ALL details pre-filled from the master pharmaceutical
       catalog, ready to add directly to the database!
  ========================================================== */

  function handleScannedBarcode(code) {
    if (!code) return;
    const clean = String(code).trim();
    if (!clean) return;

    // Check if the medicine already exists in the active database
    const existing = APSStore.getMedicineByBarcode(clean);

    if (existing) {
      // 1. Medicine IS in database
      $("#medSearchInput").value = existing.name;
      currentSearch = existing.name.toLowerCase();
      renderMedicineTable();
      highlightMedicineRow(existing.id);

      APS.playSuccessSound();
      APS.showToast(`Found: ${existing.name} (Barcode: ${clean}) | Current Stock: ${existing.totalStock} ${existing.unit}s`, "success");
    } else {
      // 2. Medicine is NOT in database
      // User requirement: "when it is scaned , if The medicine is not in the database then it will be added to the medicine list"
      openAddMedicineModalWithBarcode(clean);
    }
  }

  function openAddMedicineModalWithBarcode(barcode) {
    APS.playScanSound();

    // Look up in comprehensive master pharmaceutical database
    const lookup = APSStore.lookupBarcodeDrugCatalog(barcode);

    // Reset and prepare form
    $("#medicineForm").reset();
    $("#medId").value = "";
    $("#medicineModalTitle").textContent = "Add Scanned Medicine to Catalog";

    // Pre-populate fields automatically
    $("#medBarcode").value = barcode;
    if (lookup.name) $("#medName").value = lookup.name;
    if (lookup.generic) $("#medGeneric").value = lookup.generic;
    if (lookup.categoryId) $("#medCategory").value = lookup.categoryId;
    if (lookup.manufacturerId) $("#medManufacturer").value = lookup.manufacturerId;
    if (lookup.composition) $("#medComposition").value = lookup.composition;
    if (lookup.unit) $("#medUnit").value = lookup.unit;
    if (lookup.hsn) $("#medHsn").value = lookup.hsn;
    if (lookup.reorderLevel) $("#medReorderLevel").value = lookup.reorderLevel;
    if (lookup.reorderQuantity) $("#medReorderQty").value = lookup.reorderQuantity;
    $("#medRequiresRx").checked = Boolean(lookup.requiresPrescription);

    // Show informational notice inside modal
    const noticeEl = $("#medModalScanNotice");
    if (noticeEl) {
      noticeEl.className = "alert alert-success d-flex align-items-center gap-2 py-2 px-3 small border-0 shadow-sm";
      if (lookup.isCatalogMatch) {
        noticeEl.innerHTML = `
          <i class="bi bi-magic fs-4 text-success"></i>
          <div>
            <strong>Barcode ${APS.escapeHtml(barcode)} recognized!</strong>
            <div>Details auto-filled from master pharmaceutical database. Review and click <strong>Save Medicine Record</strong> to add to catalog.</div>
          </div>
        `;
      } else {
        noticeEl.innerHTML = `
          <i class="bi bi-upc-scan fs-4 text-primary"></i>
          <div>
            <strong>New Barcode Scanned: ${APS.escapeHtml(barcode)}</strong>
            <div>Barcode not found in catalog. Enter medicine name and click <strong>Save Medicine Record</strong> to add to database.</div>
          </div>
        `;
      }
    }

    medModalInstance.show();

    // Focus input for fastest possible interaction
    setTimeout(() => {
      if (!lookup.name) {
        $("#medName")?.focus();
      } else {
        $("#medName")?.select();
      }
    }, 400);

    APS.showToast(`New barcode ${barcode} scanned! Auto-filled details ready to add.`, "info");
  }

  /* =========================================================
     4. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Search input
    $("#medSearchInput")?.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderMedicineTable();
    });

    $("#medSearchInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val) handleScannedBarcode(val);
      }
    });

    // Category filter
    $("#categoryFilter")?.addEventListener("change", (e) => {
      currentCategory = e.target.value;
      renderMedicineTable();
    });

    // Rx filter
    $("#rxFilter")?.addEventListener("change", (e) => {
      currentRx = e.target.value;
      renderMedicineTable();
    });

    // Top Scan Barcode button
    $("#topScanBarcodeBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner();
    });

    // Search input Scan button
    $("#medCameraScanBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner();
    });

    // Scan Barcode into Add/Edit Modal button
    $("#scanBarcodeIntoModalBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner((scannedCode) => {
        const lookup = APSStore.lookupBarcodeDrugCatalog(scannedCode);
        $("#medBarcode").value = scannedCode;
        if (lookup.name && !$("#medName").value) $("#medName").value = lookup.name;
        if (lookup.generic && !$("#medGeneric").value) $("#medGeneric").value = lookup.generic;
        if (lookup.categoryId) $("#medCategory").value = lookup.categoryId;
        if (lookup.manufacturerId) $("#medManufacturer").value = lookup.manufacturerId;
        if (lookup.composition && !$("#medComposition").value) $("#medComposition").value = lookup.composition;
        APS.showToast(`Scanned and auto-filled details for ${scannedCode}`);
      });
    });

    // Add Medicine button
    $("#addMedicineBtn")?.addEventListener("click", () => {
      $("#medicineForm").reset();
      $("#medId").value = "";
      $("#medModalScanNotice").className = "d-none";
      $("#medicineModalTitle").textContent = "Add New Medicine";
      $("#generateBarcodeBtn").click(); // auto assign scannable barcode
      medModalInstance.show();
    });

    // Auto-generate Barcode
    $("#generateBarcodeBtn")?.addEventListener("click", () => {
      const randomCode = "890" + Math.floor(1000000000 + Math.random() * 9000000000);
      $("#medBarcode").value = randomCode;
    });

    // When barcode is manually entered into the modal, check catalog for auto-fill
    $("#medBarcode")?.addEventListener("blur", (e) => {
      const code = e.target.value.trim();
      if (!code || $("#medId").value) return; // only for new additions
      const lookup = APSStore.lookupBarcodeDrugCatalog(code);
      if (lookup && lookup.isCatalogMatch && !$("#medName").value) {
        $("#medName").value = lookup.name;
        $("#medGeneric").value = lookup.generic;
        $("#medCategory").value = lookup.categoryId;
        $("#medManufacturer").value = lookup.manufacturerId;
        $("#medComposition").value = lookup.composition;
        $("#medUnit").value = lookup.unit;
        $("#medHsn").value = lookup.hsn;
        $("#medReorderLevel").value = lookup.reorderLevel;
        $("#medReorderQty").value = lookup.reorderQuantity;
        $("#medRequiresRx").checked = Boolean(lookup.requiresPrescription);
        APS.showToast(`Auto-filled details for ${lookup.name}`);
      }
    });

    // Medicine Form Submit
    $("#medicineForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const medData = {
        id: $("#medId").value || null,
        name: $("#medName").value.trim(),
        generic: $("#medGeneric").value.trim(),
        categoryId: $("#medCategory").value,
        manufacturerId: $("#medManufacturer").value,
        composition: $("#medComposition").value.trim(),
        unit: $("#medUnit").value,
        hsn: $("#medHsn").value.trim() || "3004.90",
        barcode: $("#medBarcode").value.trim() || ("890" + Math.floor(1000000000 + Math.random() * 9000000000)),
        reorderLevel: Number($("#medReorderLevel").value || 50),
        reorderQuantity: Number($("#medReorderQty").value || 100),
        requiresPrescription: $("#medRequiresRx").checked
      };

      const saved = APSStore.saveMedicine(medData);
      medModalInstance.hide();
      $("#medSearchInput").value = saved.name;
      currentSearch = saved.name.toLowerCase();
      renderMedicineTable();
      highlightMedicineRow(saved.id);

      APS.showToast(`Saved medicine ${saved.name} to catalog successfully!`, "success");
      APS.playSuccessSound();
    });

    // Table click actions (Edit, Delete, Barcode)
    $("#medicineTableBody")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest("[data-edit-med]");
      if (editBtn) {
        const medId = editBtn.dataset.editMed;
        openEditModal(medId);
        return;
      }

      const deleteBtn = e.target.closest("[data-delete-med]");
      if (deleteBtn) {
        const medId = deleteBtn.dataset.deleteMed;
        if (confirm("Are you sure you want to delete this medicine?")) {
          APSStore.deleteMedicine(medId);
          renderMedicineTable();
          APS.showToast("Medicine deleted.", "warning");
        }
        return;
      }

      const barcodeBtn = e.target.closest("[data-view-barcode]");
      if (barcodeBtn) {
        const code = barcodeBtn.dataset.viewBarcode;
        const name = barcodeBtn.dataset.medName;
        openBarcodeModal(code, name);
      }
    });

    // Manage Categories Modal
    $("#manageCategoriesBtn")?.addEventListener("click", () => {
      renderCategoryList();
      categoryModalInstance.show();
    });

    $("#newCategoryForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#newCatName").value.trim();
      if (!name) return;
      APSStore.saveCategory({ name });
      $("#newCatName").value = "";
      renderCategoryList();
      populateDropdowns();
      APS.showToast(`Category "${name}" created.`);
    });

    // Export CSV
    $("#exportMedsBtn")?.addEventListener("click", exportToCSV);

    // Camera Scanner Modal events
    $("#cameraScannerModal")?.addEventListener("hidden.bs.modal", () => {
      stopCameraScanner();
    });
    // Mobile Snap Photo & Torch Controls
    $(".btn-take-photo", $("#cameraScannerModal"))?.forEach(btn => {
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

    $(".scanner-torch-btn", $("#cameraScannerModal"))?.forEach(btn => {
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
        let code = btn.dataset.code;
        if (btn.dataset.random) {
          code = "890" + Math.floor(1000000000 + Math.random() * 9000000000);
        }
        stopCameraScanner();
        cameraModalInstance?.hide();
        handleScannedBarcode(code);
      });
    });

    // Hardware USB Barcode Gun Listener
    APS.initUSBBarcodeListener((scannedCode) => {
      handleScannedBarcode(scannedCode);
    });
  }

  /* =========================================================
     5. OPTICAL CAMERA SCANNER ENGINE
  ========================================================== */

  let customScanCallback = null;

  function startCameraScanner(callback = null) {
    customScanCallback = callback;
    if (cameraScannerEngine) {
      cameraScannerEngine.stop();
    }

    cameraScannerEngine = APS.createCameraBarcodeScanner({
      containerId: "cameraScannerVideoContainer",
      statusId: "cameraScannerStatus",
      modalId: "cameraScannerModal",
      onScan: (decodedText) => {
        if (typeof customScanCallback === "function") {
          customScanCallback(decodedText);
          customScanCallback = null;
        } else {
          handleScannedBarcode(decodedText);
        }
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

  /* =========================================================
     6. EDIT & BARCODE MODAL HELPERS
  ========================================================== */

  function openEditModal(medId) {
    const med = APSStore.getMedicineById(medId);
    if (!med) return;

    $("#medId").value = med.id;
    $("#medModalScanNotice").className = "d-none";
    $("#medName").value = med.name;
    $("#medGeneric").value = med.generic;
    $("#medCategory").value = med.categoryId;
    $("#medManufacturer").value = med.manufacturerId;
    $("#medComposition").value = med.composition || "";
    $("#medUnit").value = med.unit || "Tablet";
    $("#medHsn").value = med.hsn || "3004.90";
    $("#medBarcode").value = med.barcode || "";
    $("#medReorderLevel").value = med.reorderLevel || 50;
    $("#medReorderQty").value = med.reorderQuantity || 100;
    $("#medRequiresRx").checked = Boolean(med.requiresPrescription);

    $("#medicineModalTitle").textContent = "Edit Medicine: " + med.name;
    medModalInstance.show();
  }

  function openBarcodeModal(code, name) {
    if (!code) code = "8901234500000";
    $("#barcodeMedicineTitle").textContent = name;
    if (window.JsBarcode) {
      JsBarcode("#barcodeCanvas", code, {
        format: "CODE128",
        lineColor: "#0f3735",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        font: "Poppins"
      });
    }
    barcodeModalInstance.show();
  }

  function renderCategoryList() {
    const cats = APSStore.getCategories();
    const list = $("#categoryListGroup");
    list.innerHTML = cats.map(c => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-2">
        <span class="fw-medium">${APS.escapeHtml(c.name)}</span>
        <span class="badge bg-light text-muted border">ID: ${c.id}</span>
      </li>
    `).join("");
  }

  function exportToCSV() {
    const meds = APSStore.getMedicines();
    let csv = "ID,Name,Generic,Category,Manufacturer,Unit,HSN,Barcode,CurrentStock,ReorderLevel,RequiresRx\n";
    meds.forEach(m => {
      csv += `"${m.id}","${m.name}","${m.generic}","${m.categoryName}","${m.manufacturerName}","${m.unit}","${m.hsn}","${m.barcode}","${m.totalStock}","${m.reorderLevel}","${m.requiresPrescription ? 'Yes' : 'No'}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `APS_Medicines_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    APS.showToast("Exported medicines catalog to CSV.");
  }

})();
