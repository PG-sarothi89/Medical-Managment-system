/**
 * APS Medical Management System — Point of Sale (POS) Cashier Controller
 * Barcode scanning, live FEFO stock validation, multi-mode split checkout, and GST invoice generation.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let cart = []; // Array of cart items
  let selectedCategory = "all";
  let searchTerm = "";

  let paymentModalInstance = null;
  let invoiceModalInstance = null;
  let cameraModalInstance = null;
  let cameraStream = null;

  document.addEventListener("DOMContentLoaded", () => {
    paymentModalInstance = new bootstrap.Modal($("#paymentModal"));
    invoiceModalInstance = new bootstrap.Modal($("#invoiceModal"));
    if ($("#cameraScannerModal")) {
      cameraModalInstance = new bootstrap.Modal($("#cameraScannerModal"));
    }

    populateCustomers();
    populatePrescriptions();
    populateCategories();
    renderProductGrid();
    renderCart();
    initEventListeners();

    // Check if loaded from a Prescription "Dispense in POS" link
    const urlParams = new URLSearchParams(window.location.search);
    const rxId = urlParams.get("rxId");
    if (rxId) {
      loadPrescriptionIntoPOS(rxId);
    }
  });

  /* =========================================================
     1. DROPDOWNS & CATALOG
  ========================================================== */

  // Re-render when fresh data arrives from PostgreSQL
  window.addEventListener("aps:sync", () => {
    populateCustomers();
    populatePrescriptions();
    populateCategories();
    renderProductGrid();
  });

  function populateCustomers() {
    const custs = APSStore.getCustomers();
    const select = $("#posCustomerSelect");
    if (!select) return;

    select.innerHTML = `<option value="">Walk-in Customer</option>` +
      custs.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)} (${c.phone})</option>`).join("");
  }

  function populatePrescriptions() {
    const rxs = APSStore.getPrescriptions();
    const select = $("#posPrescriptionSelect");
    if (!select) return;

    select.innerHTML = `<option value="">No Prescription Attached</option>` +
      rxs.map(r => `<option value="${r.id}">[${r.id}] ${APS.escapeHtml(r.customerName)} (${r.doctorName})</option>`).join("");
  }

  function populateCategories() {
    const cats = APSStore.getCategories();
    const select = $("#posCategorySelect");
    if (!select) return;

    select.innerHTML = `<option value="all">All Drug Classes</option>` +
      cats.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)}</option>`).join("");
  }

  /* =========================================================
     2. RENDER PRODUCT GRID
  ========================================================== */

  function renderProductGrid() {
    const grid = $("#posProductGrid");
    if (!grid) return;

    let medicines = APSStore.getMedicines();

    if (searchTerm) {
      medicines = medicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm) ||
        m.generic.toLowerCase().includes(searchTerm) ||
        (m.barcode && m.barcode.includes(searchTerm))
      );
    }

    if (selectedCategory !== "all") {
      medicines = medicines.filter(m => m.categoryId === selectedCategory);
    }

    if (!medicines.length) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5 text-muted">
          <i class="bi bi-search fs-1 d-block mb-2 text-secondary opacity-50"></i>
          <strong>No medicines match search term.</strong>
        </div>
      `;
      return;
    }

    grid.innerHTML = medicines.map(m => {
      const isOutOfStock = m.totalStock <= 0;
      const isLowStock = m.totalStock <= m.reorderLevel;

      let stockTag = `<span class="badge bg-success-subtle text-success">${m.totalStock} in stock</span>`;
      if (isOutOfStock) stockTag = `<span class="badge bg-danger-subtle text-danger">Out of Stock</span>`;
      else if (isLowStock) stockTag = `<span class="badge bg-warning-subtle text-warning-emphasis">${m.totalStock} left (Low)</span>`;

      return `
        <div class="col-xl-4 col-md-6">
          <div class="pos-item-card ${isOutOfStock ? 'opacity-75' : ''}" data-add-to-cart="${m.id}">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-1">
                <strong class="text-teal-900">${APS.escapeHtml(m.name)}</strong>
                ${m.requiresPrescription ? '<span class="badge-rx">Rx</span>' : '<span class="badge-otc">OTC</span>'}
              </div>
              <small class="text-muted d-block">${APS.escapeHtml(m.generic)}</small>
              <small class="text-muted d-block" style="font-size: 10px;">${APS.escapeHtml(m.unit)} • ${APS.escapeHtml(m.categoryName)}</small>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <div>
                <span class="fs-5 fw-bold text-teal-700">৳${Number(m.sellingPrice || 0).toFixed(2)}</span>
                <span class="d-block" style="font-size: 9px;">${stockTag}</span>
              </div>
              <button type="button" class="btn btn-sm btn-teal-500 btn-primary rounded-pill px-3 fw-semibold" ${isOutOfStock ? 'disabled' : ''}>
                <i class="bi bi-cart-plus me-1"></i>Add
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  /* =========================================================
     3. CART LOGIC & RENDERING
  ========================================================== */

  function addToCart(medicineId, qtyToAdd = 1) {
    const med = APSStore.getMedicineById(medicineId);
    if (!med) return;

    if (med.totalStock <= 0) {
      APS.showToast(`${med.name} is out of stock!`, "danger");
      APS.playAlertSound();
      return;
    }

    const existingIndex = cart.findIndex(item => item.medicineId === medicineId);
    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + qtyToAdd > med.totalStock) {
        APS.showToast(`Cannot add more than available stock (${med.totalStock})`, "warning");
        APS.playAlertSound();
        return;
      }
      cart[existingIndex].quantity += qtyToAdd;
    } else {
      cart.push({
        medicineId: med.id,
        medicineName: med.name,
        unit: med.unit,
        unitPrice: Number(med.sellingPrice || 0),
        mrp: Number(med.mrp || med.sellingPrice || 0),
        quantity: Math.min(qtyToAdd, med.totalStock),
        maxStock: med.totalStock,
        requiresRx: med.requiresPrescription
      });
    }

    APS.playScanSound();
    renderCart();
  }

  function updateCartQty(medicineId, newQty) {
    const idx = cart.findIndex(i => i.medicineId === medicineId);
    if (idx === -1) return;

    if (newQty <= 0) {
      cart.splice(idx, 1);
    } else {
      if (newQty > cart[idx].maxStock) {
        APS.showToast(`Stock limit reached (${cart[idx].maxStock})`, "warning");
        newQty = cart[idx].maxStock;
      }
      cart[idx].quantity = newQty;
    }
    renderCart();
  }

  function renderCart() {
    const list = $("#cartItemsList");
    if (!list) return;

    if (!cart.length) {
      list.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-cart-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
          <strong>Cart is empty.</strong>
          <p class="small text-muted mb-0">Scan barcode or click items to add.</p>
        </div>
      `;
      calculateTotals();
      return;
    }

    list.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <div>
          <div class="fw-bold text-teal-900 small">${APS.escapeHtml(item.medicineName)}</div>
          <small class="text-muted">৳${item.unitPrice.toFixed(2)} / ${APS.escapeHtml(item.unit)}</small>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button type="button" class="qty-btn" data-cart-minus="${item.medicineId}">-</button>
          <span class="px-2 fw-bold text-dark">${item.quantity}</span>
          <button type="button" class="qty-btn" data-cart-plus="${item.medicineId}">+</button>
        </div>
        <div class="text-end">
          <div class="fw-bold text-teal-700">৳${(item.quantity * item.unitPrice).toFixed(2)}</div>
          <button type="button" class="btn btn-sm btn-link text-danger p-0" data-cart-remove="${item.medicineId}" style="font-size: 11px;">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>
      </div>
    `).join("");

    // Update Mobile Toggle Cart Badge Counter
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countBadge = $("#mobileCartCount");
    if (countBadge) countBadge.textContent = totalCount;

    calculateTotals();
  }

  function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discount = Math.max(0, Number($("#cartDiscountInput")?.value || 0));
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = Number((taxableAmount * 0.05).toFixed(2));
    const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

    $("#cartSubtotal").textContent = "৳ " + subtotal.toFixed(2);
    $("#cartTaxAmount").textContent = "৳ " + taxAmount.toFixed(2);
    $("#cartTotalAmount").textContent = "৳ " + grandTotal.toFixed(2);

    return { subtotal, discount, taxAmount, grandTotal };
  }

  /* =========================================================
     4. PRESCRIPTION AUTO-DISPENSE LOADER
  ========================================================== */

  function loadPrescriptionIntoPOS(rxId) {
    const rxs = APSStore.getPrescriptions();
    const rx = rxs.find(r => r.id === rxId);
    if (!rx) return;

    // Attach customer & prescription select
    if ($("#posCustomerSelect")) $("#posCustomerSelect").value = rx.customerId || "";
    if ($("#posPrescriptionSelect")) $("#posPrescriptionSelect").value = rx.id;

    // Add prescribed medicines to cart
    rx.items.forEach(item => {
      addToCart(item.medicineId, Number(item.quantityPrescribed || 10));
    });

    APS.showToast(`Prescription [${rx.id}] loaded into POS for ${rx.customerName}.`);
    APS.playSuccessSound();
  }

  /* =========================================================
     5. OPTICAL & WEBCAM BARCODE ENGINE
  ========================================================== */

  let cameraScannerEngine = null;

  function handleScannedBarcode(code) {
    if (!code) return false;
    const clean = String(code).trim();
    const meds = APSStore.getMedicines();
    const matched = meds.find(m => (m.barcode && String(m.barcode).trim().toLowerCase() === clean.toLowerCase()) || m.name.toLowerCase() === clean.toLowerCase());

    if (matched) {
      addToCart(matched.id, 1);
      APS.playScanSound();
      APS.showToast(`Scanned & Added: ${matched.name}`, "success");
      return true;
    } else {
      APS.playAlertSound();
      APS.showToast(`Barcode not found: ${clean} &mdash; <a href="medicines.html?scan=${encodeURIComponent(clean)}" class="text-white text-decoration-underline fw-bold">Add to Medicines</a>`, "warning");
      return false;
    }
  }

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

  /* =========================================================
     6. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Search input
    $("#posBarcodeScanInput")?.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderProductGrid();
    });

    // Barcode scanner trigger on Enter key
    $("#posBarcodeScanInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        processBarcodeScan();
      }
    });

    // Physical scanner simulation button
    $("#simulateScanBtn")?.addEventListener("click", () => {
      processBarcodeScan();
    });

    function processBarcodeScan() {
      const input = $("#posBarcodeScanInput");
      const val = input.value.trim();
      if (!val) return;

      const matched = handleScannedBarcode(val);
      if (matched) {
        input.value = "";
        searchTerm = "";
        renderProductGrid();
      }
      input.focus();
    }

    // Category filter
    $("#posCategorySelect")?.addEventListener("change", (e) => {
      selectedCategory = e.target.value;
      renderProductGrid();
    });

    // Add to cart from card click
    $("#posProductGrid")?.addEventListener("click", (e) => {
      const card = e.target.closest("[data-add-to-cart]");
      if (card) {
        addToCart(card.dataset.addToCart, 1);
      }
    });

    // Cart item modifier clicks
    $("#cartItemsList")?.addEventListener("click", (e) => {
      const minusBtn = e.target.closest("[data-cart-minus]");
      if (minusBtn) {
        const id = minusBtn.dataset.cartMinus;
        const item = cart.find(i => i.medicineId === id);
        if (item) updateCartQty(id, item.quantity - 1);
        return;
      }

      const plusBtn = e.target.closest("[data-cart-plus]");
      if (plusBtn) {
        const id = plusBtn.dataset.cartPlus;
        const item = cart.find(i => i.medicineId === id);
        if (item) updateCartQty(id, item.quantity + 1);
        return;
      }

      const removeBtn = e.target.closest("[data-cart-remove]");
      if (removeBtn) {
        const id = removeBtn.dataset.cartRemove;
        updateCartQty(id, 0);
      }
    });

    // Clear cart
    $("#clearCartBtn")?.addEventListener("click", () => {
      if (!cart.length) return;
      if (confirm("Clear all items from current cart?")) {
        cart = [];
        renderCart();
      }
    });

    // Discount change
    $("#cartDiscountInput")?.addEventListener("input", calculateTotals);

    // Customer Selection Change
    $("#posCustomerSelect")?.addEventListener("change", (e) => {
      const custId = e.target.value;
      const badge = $("#customerSummaryBadge");
      if (!custId) {
        badge.classList.add("d-none");
        return;
      }
      const custs = APSStore.getCustomers();
      const cust = custs.find(c => c.id === custId);
      if (cust) {
        badge.classList.remove("d-none");
        $("#custPointsBadge").textContent = `${cust.loyaltyPoints || 0} Loyalty Pts`;
        $("#custCreditBadge").textContent = `Outstanding: ৳${(cust.outstandingBalance || 0).toFixed(2)}`;
      }
    });

    // Checkout Proceed
    $("#posCheckoutBtn")?.addEventListener("click", () => {
      if (!cart.length) {
        APS.showToast("Cannot checkout an empty cart.", "warning");
        APS.playAlertSound();
        return;
      }

      const totals = calculateTotals();
      $("#payModalTotal").textContent = "৳ " + totals.grandTotal.toFixed(2);
      $("#cashReceivedInput").value = totals.grandTotal;
      $("#changeReturnOutput").value = "৳ 0.00";
      $("#payPrimaryMode").value = "Cash";
      $("#splitPaymentBox").classList.add("d-none");
      $("#cashTenderedBox").classList.remove("d-none");

      paymentModalInstance.show();
    });

    // Payment Mode Selection handler (Cash, Split, Credit, etc.)
    $("#payPrimaryMode")?.addEventListener("change", (e) => {
      const mode = e.target.value;
      const splitBox = $("#splitPaymentBox");
      const cashBox = $("#cashTenderedBox");

      if (mode === "Split") {
        splitBox.classList.remove("d-none");
        cashBox.classList.add("d-none");
      } else if (mode === "Cash") {
        splitBox.classList.add("d-none");
        cashBox.classList.remove("d-none");
      } else {
        splitBox.classList.add("d-none");
        cashBox.classList.add("d-none");
      }
    });

    // Cash received calculation
    $("#cashReceivedInput")?.addEventListener("input", (e) => {
      const tendered = Number(e.target.value || 0);
      const totals = calculateTotals();
      const change = Math.max(0, tendered - totals.grandTotal);
      $("#changeReturnOutput").value = "৳ " + change.toFixed(2);
    });

    // Payment Form Submit -> Complete Sale
    $("#paymentForm")?.addEventListener("submit", (e) => {
      e.preventDefault();

      const totals = calculateTotals();
      const custSelect = $("#posCustomerSelect");
      const customerId = custSelect.value || null;
      const customerName = custSelect.selectedOptions[0] ? custSelect.selectedOptions[0].textContent.split(" (")[0] : "Walk-in Customer";
      const prescriptionId = $("#posPrescriptionSelect").value || null;
      const paymentMode = $("#payPrimaryMode").value;

      try {
        const result = APSStore.processSale({
          customerId,
          customerName,
          prescriptionId,
          items: cart,
          subtotal: totals.subtotal,
          discount: totals.discount,
          taxRate: 0.05,
          paymentMode,
          paymentStatus: paymentMode === "Credit" ? "Unpaid" : "Paid"
        });

        paymentModalInstance.hide();
        APS.playSuccessSound();
        APS.showToast(`Invoice ${result.invoice.invoiceNumber} generated!`);

        // Render printable invoice modal
        showInvoiceModal(result.invoice);

        // Reset POS State
        cart = [];
        $("#cartDiscountInput").value = "0";
        $("#posBarcodeScanInput").value = "";
        searchTerm = "";
        renderProductGrid();
        renderCart();
      } catch (err) {
        alert(err.message);
      }
    });

    // Launch Camera Barcode Scanner
    $("#openCameraScannerBtn")?.addEventListener("click", () => {
      cameraModalInstance?.show();
      startCameraScanner();
    });

    // Cleanup camera when modal closed
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


    // Quick Barcode simulation buttons
    $$(".test-barcode-btn", $("#cameraScannerModal"))?.forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.code;
        handleScannedBarcode(code);
        stopCameraScanner();
        cameraModalInstance?.hide();
      });
    });

    // Camera flash / torch toggle
    $("#toggleCameraTorchBtn")?.addEventListener("click", async () => {
      if (!cameraStream) return;
      const track = cameraStream.getVideoTracks()[0];
      if (track && track.getCapabilities && track.getCapabilities().torch) {
        const current = track.getSettings().torch || false;
        await track.applyConstraints({ advanced: [{ torch: !current }] });
        APS.showToast(`Scanner illumination ${!current ? 'ON' : 'OFF'}`);
      } else {
        APS.showToast("Flash torch not supported on this device/camera.", "info");
      }
    });

    // Mobile View Switcher (Medicines Catalog vs Cart) & Floating Bottom Bar
    function updateMobilePosUI() {
      if (window.innerWidth >= 992) {
        $("#posMobileBottomBar")?.classList.add("d-none");
        const grid = $("#posProductGrid");
        if (grid) grid.style.paddingBottom = "20px";
        return;
      }

      const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      const isCatalogActive = !$("#posCatalogColumn")?.classList.contains("d-none");
      const bottomBar = $("#posMobileBottomBar");
      const bottomBadge = $("#mobileBottomCartBadge");
      const bottomTotal = $("#mobileBottomCartTotal");

      if (bottomBadge) bottomBadge.textContent = totalCount;
      if (bottomTotal) {
        const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discount = Math.max(0, Number($("#cartDiscountInput")?.value || 0));
        const taxableAmount = Math.max(0, subtotal - discount);
        const grandTotal = Number((taxableAmount + (taxableAmount * 0.05)).toFixed(2));
        bottomTotal.textContent = "৳ " + grandTotal.toFixed(2);
      }

      if (bottomBar) {
        if (isCatalogActive && totalCount > 0) {
          bottomBar.classList.remove("d-none");
          const grid = $("#posProductGrid");
          if (grid) grid.style.paddingBottom = "80px";
        } else {
          bottomBar.classList.add("d-none");
          const grid = $("#posProductGrid");
          if (grid) grid.style.paddingBottom = "20px";
        }
      }
    }

    function switchToCatalogView() {
      $("#posCatalogColumn")?.classList.remove("d-none");
      $("#posCartColumn")?.classList.add("d-none");
      $("#mobileShowCatalogBtn")?.classList.add("btn-teal-700", "btn-primary", "active");
      $("#mobileShowCatalogBtn")?.classList.remove("btn-outline-secondary");
      $("#mobileShowCartBtn")?.classList.remove("btn-teal-700", "btn-primary", "active");
      $("#mobileShowCartBtn")?.classList.add("btn-outline-secondary");
      updateMobilePosUI();
    }

    function switchToCartView() {
      $("#posCatalogColumn")?.classList.add("d-none");
      $("#posCartColumn")?.classList.remove("d-none");
      $("#mobileShowCartBtn")?.classList.add("btn-teal-700", "btn-primary", "active");
      $("#mobileShowCartBtn")?.classList.remove("btn-outline-secondary");
      $("#mobileShowCatalogBtn")?.classList.remove("btn-teal-700", "btn-primary", "active");
      $("#mobileShowCatalogBtn")?.classList.add("btn-outline-secondary");
      updateMobilePosUI();
    }

    $("#mobileShowCatalogBtn")?.addEventListener("click", switchToCatalogView);
    $("#mobileShowCartBtn")?.addEventListener("click", switchToCartView);
    $("#mobileBottomViewCartBtn")?.addEventListener("click", switchToCartView);
    $("#backToCatalogBtn")?.addEventListener("click", switchToCatalogView);

    // Initial mobile view setup
    if (window.innerWidth < 992) {
      switchToCatalogView();
    }

    // Responsive window resizing handler
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 992) {
        $("#posCatalogColumn")?.classList.remove("d-none");
        $("#posCartColumn")?.classList.remove("d-none");
        $("#posMobileBottomBar")?.classList.add("d-none");
      } else {
        const isCartHidden = $("#posCartColumn")?.classList.contains("d-none");
        const isCatalogHidden = $("#posCatalogColumn")?.classList.contains("d-none");
        if (!isCartHidden && !isCatalogHidden) {
          switchToCatalogView();
        } else {
          updateMobilePosUI();
        }
      }
    });

    // Support Quick Order pre-selection from Overview
    const quickMedId = sessionStorage.getItem("apsQuickSelectMed");
    if (quickMedId) {
      sessionStorage.removeItem("apsQuickSelectMed");
      addToCart(quickMedId, 1);
      APS.showToast("Item added to cart.");
    }

    // Global Hardware USB Barcode Scanner Wedge Listener
    APS.initUSBBarcodeListener((scannedCode) => {
      handleScannedBarcode(scannedCode);
    });
  }

  /* =========================================================
     6. PRINTABLE GST INVOICE MODAL RENDERER
  ========================================================== */

  function showInvoiceModal(inv) {
    $("#invModalNumber").textContent = inv.invoiceNumber;
    $("#invModalDate").textContent = "Date: " + inv.invoiceDate;
    $("#invModalCustomer").textContent = inv.customerName;
    $("#invModalCashier").textContent = inv.servedBy;
    $("#invModalPayMethod").textContent = inv.paymentMode;
    $("#invModalStatus").textContent = inv.paymentStatus.toUpperCase();

    const tbody = $("#invModalItems");
    tbody.innerHTML = inv.items.map(item => `
      <tr>
        <td>
          <strong>${APS.escapeHtml(item.medicineName)}</strong>
        </td>
        <td><small class="font-monospace">${APS.escapeHtml(item.batchNumber)}</small></td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">৳${Number(item.unitPrice).toFixed(2)}</td>
        <td class="text-end">৳${Number(item.subtotal).toFixed(2)}</td>
      </tr>
    `).join("");

    $("#invModalSubtotal").textContent = "৳ " + Number(inv.subtotal).toFixed(2);
    $("#invModalDiscount").textContent = "- ৳ " + Number(inv.discount).toFixed(2);
    $("#invModalTax").textContent = "৳ " + Number(inv.gstAmount).toFixed(2);
    $("#invModalGrandTotal").textContent = "৳ " + Number(inv.totalAmount).toFixed(2);

    invoiceModalInstance.show();
  }

})();
