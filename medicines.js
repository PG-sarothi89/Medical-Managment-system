/**
 * APS Medical Management System — Medicine Management Module
 * Connects directly to APSStore with full CRUD, barcode rendering, category management, and CSV export.
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
  let cameraStream = null;

  document.addEventListener("DOMContentLoaded", () => {
    medModalInstance = new bootstrap.Modal($("#medicineModal"));
    barcodeModalInstance = new bootstrap.Modal($("#barcodeModal"));
    categoryModalInstance = new bootstrap.Modal($("#categoryModal"));
    if ($("#cameraScannerModal")) {
      cameraModalInstance = new bootstrap.Modal($("#cameraScannerModal"));
    }

    // Check URL params for search
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get("search");
    if (initialSearch) {
      currentSearch = initialSearch.toLowerCase();
      $("#medSearchInput").value = initialSearch;
    }

    populateDropdowns();
    renderMedicineTable();
    initEventListeners();
  });

  /* =========================================================
     1. POPULATE DROPDOWNS
  ========================================================== */

  function populateDropdowns() {
    const cats = APSStore.getCategories();
    const mfrs = APSStore.getManufacturers();

    // Category Filter
    const catFilter = $("#categoryFilter");
    catFilter.innerHTML = `<option value="all">All Categories</option>` +
      cats.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)}</option>`).join("");

    // Modal Category & Manufacturer selects
    const medCatSelect = $("#medCategory");
    medCatSelect.innerHTML = cats.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)}</option>`).join("");

    const medMfrSelect = $("#medManufacturer");
    medMfrSelect.innerHTML = mfrs.map(m => `<option value="${m.id}">${APS.escapeHtml(m.name)}</option>`).join("");
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
        (m.barcode && m.barcode.includes(currentSearch))
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
          </td>
        </tr>
      `;
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
        <tr>
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
            <small class="text-muted">HSN: ${APS.escapeHtml(m.hsn || "3004")}</small>
          </td>
          <td>
            <button class="btn btn-sm btn-light border rounded-pill px-2 py-0 text-muted" data-view-barcode="${m.barcode}" data-med-name="${APS.escapeHtml(m.name)}" title="View & print barcode">
              <i class="bi bi-upc me-1"></i>${m.barcode || "No Barcode"}
            </button>
          </td>
          <td>${stockBadge}</td>
          <td>${rxBadge}</td>
          <td class="text-end">
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

  /* =========================================================
     3. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Search input
    $("#medSearchInput")?.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderMedicineTable();
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

    // Add Medicine button
    $("#addMedicineBtn")?.addEventListener("click", () => {
      $("#medicineForm").reset();
      $("#medId").value = "";
      $("#medicineModalTitle").textContent = "Add New Medicine";
      $("#generateBarcodeBtn").click(); // auto assign scannable barcode
      medModalInstance.show();
    });

    // Auto-generate Barcode
    $("#generateBarcodeBtn")?.addEventListener("click", () => {
      const randomCode = "890" + Math.floor(1000000000 + Math.random() * 9000000000);
      $("#medBarcode").value = randomCode;
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

      APSStore.saveMedicine(medData);
      medModalInstance.hide();
      renderMedicineTable();
      APS.showToast(`Saved medicine ${medData.name} successfully.`);
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

    // Camera Barcode Scanner
    $("#medCameraScanBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner();
    });

    $("#cameraScannerModal")?.addEventListener("hidden.bs.modal", () => {
      stopCameraScanner();
    });

    $$(".test-barcode-btn", $("#cameraScannerModal"))?.forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.code;
        handleScannedBarcode(code);
        stopCameraScanner();
        cameraModalInstance?.hide();
      });
    });

    // Hardware USB Barcode Gun Wedge Listener
    APS.initUSBBarcodeListener((scannedCode) => {
      handleScannedBarcode(scannedCode);
    });
  }

  /* =========================================================
     4. OPTICAL & WEBCAM BARCODE ENGINE
  ========================================================== */

  let barcodeScanActive = false;

  function handleScannedBarcode(code) {
    if (!code) return;
    const clean = String(code).trim();
    $("#medSearchInput").value = clean;
    currentSearch = clean.toLowerCase();
    renderMedicineTable();
    APS.playScanBeep();
    APS.showToast(`Filtered by barcode: ${clean}`);
  }

  async function startCameraScanner() {
    const video = $("#cameraScannerVideo");
    const statusEl = $("#cameraScannerStatus");
    if (!video) return;

    barcodeScanActive = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("No getUserMedia");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      cameraStream = stream;
      video.srcObject = stream;
      await video.play();

      if ("BarcodeDetector" in window) {
        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"] });
        const scanLoop = async () => {
          if (!barcodeScanActive || !cameraStream) return;
          try {
            if (video.readyState >= 2) {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0) {
                handleScannedBarcode(barcodes[0].rawValue);
                stopCameraScanner();
                cameraModalInstance?.hide();
                return;
              }
            }
          } catch (e) {}
          if (barcodeScanActive) requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      }
    } catch (err) {
      if (statusEl) {
        statusEl.className = "alert alert-warning py-2 px-3 small mt-3 mb-2 d-flex align-items-center justify-content-center gap-2 text-start";
        statusEl.innerHTML = `<i class="bi bi-info-circle-fill fs-5 text-warning"></i><div>Optical preview simulated. Click quick-test buttons below or use a USB barcode gun.</div>`;
      }
    }
  }

  function stopCameraScanner() {
    barcodeScanActive = false;
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    const video = $("#cameraScannerVideo");
    if (video) video.srcObject = null;
  }

  /* =========================================================
     4. EDIT & BARCODE MODAL HELPERS
  ========================================================== */

  function openEditModal(medId) {
    const med = APSStore.getMedicineById(medId);
    if (!med) return;

    $("#medId").value = med.id;
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
        lineColor: "#123a38",
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
