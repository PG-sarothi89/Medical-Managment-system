/**
 * APS Medical Management System — Purchases & Suppliers Controller
 * Handles Purchase Order workflows, Goods Receipt into Batches, and Supplier Ledgers.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let poModalInstance = null;
  let receiveModalInstance = null;
  let supplierModalInstance = null;
  let supplierPayModalInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    poModalInstance = new bootstrap.Modal($("#poModal"));
    receiveModalInstance = new bootstrap.Modal($("#receiveModal"));
    supplierModalInstance = new bootstrap.Modal($("#supplierModal"));
    supplierPayModalInstance = new bootstrap.Modal($("#supplierPayModal"));

    // Check URL hash
    if (window.location.hash === "#po") {
      const poTab = new bootstrap.Tab($("#po-tab"));
      poTab.show();
    }

    renderPOList();
    renderSuppliers();
    populateSuppliersDropdown();
    initEventListeners();
  });

  /* =========================================================
     1. RENDER PURCHASE ORDERS
  ========================================================== */

  function renderPOList() {
    const tbody = $("#poTableBody");
    if (!tbody) return;

    const poList = APSStore.getPurchaseOrders();

    if (!poList.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No purchase orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = poList.map(po => {
      const isReceived = po.status === "Received";
      const statusBadge = isReceived
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check2-all me-1"></i>Received</span>`
        : `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1"><i class="bi bi-clock me-1"></i>Pending Receipt</span>`;

      const itemsText = po.items.map(i => `${APS.escapeHtml(i.medicineName)} (${i.orderedQty})`).join(", ");

      const actionBtn = isReceived
        ? `<span class="text-muted small">Stock Registered</span>`
        : `<button class="btn btn-sm btn-success rounded-pill px-3 fw-semibold" data-receive-po="${po.id}">
             <i class="bi bi-box-arrow-in-down me-1"></i>Receive Goods
           </button>`;

      return `
        <tr>
          <td><strong class="text-teal-900 font-monospace">${APS.escapeHtml(po.poNumber)}</strong></td>
          <td><strong>${APS.escapeHtml(po.supplierName)}</strong></td>
          <td><small class="text-muted">${po.orderDate}</small></td>
          <td><small class="text-muted">${po.expectedDate}</small></td>
          <td><small class="text-truncate d-inline-block" style="max-width: 250px;" title="${itemsText}">${itemsText}</small></td>
          <td><strong class="text-teal-700">৳${Number(po.totalAmount).toLocaleString()}</strong></td>
          <td>${statusBadge}</td>
          <td class="text-end">${actionBtn}</td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     2. RENDER SUPPLIERS
  ========================================================== */

  function renderSuppliers() {
    const tbody = $("#suppliersTableBody");
    if (!tbody) return;

    const sups = APSStore.getSuppliers();

    if (!sups.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No suppliers registered.</td></tr>`;
      return;
    }

    tbody.innerHTML = sups.map(s => `
      <tr>
        <td>
          <strong class="text-teal-900">${APS.escapeHtml(s.name)}</strong>
          <small class="d-block text-muted">${APS.escapeHtml(s.address || "")}</small>
        </td>
        <td>${APS.escapeHtml(s.contactPerson || "—")}</td>
        <td>
          <div>${APS.escapeHtml(s.phone)}</div>
          <small class="text-muted">${APS.escapeHtml(s.email || "—")}</small>
        </td>
        <td><small class="font-monospace">${APS.escapeHtml(s.gstin || "—")}</small></td>
        <td>${s.creditPeriodDays} Days</td>
        <td>
          <strong class="${s.outstandingBalance > 0 ? 'text-danger' : 'text-success'}">
            ৳${Number(s.outstandingBalance || 0).toLocaleString()}
          </strong>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary rounded-pill px-3" data-pay-supplier="${s.id}" data-sup-name="${APS.escapeHtml(s.name)}" data-sup-bal="${s.outstandingBalance}">
            <i class="bi bi-wallet2 me-1"></i>Pay
          </button>
        </td>
      </tr>
    `).join("");
  }

  function populateSuppliersDropdown() {
    const sups = APSStore.getSuppliers();
    const select = $("#poSupplierSelect");
    if (!select) return;

    select.innerHTML = `<option value="" disabled selected>Select supplier...</option>` +
      sups.map(s => `<option value="${s.id}">${APS.escapeHtml(s.name)} (Credit: ${s.creditPeriodDays}d)</option>`).join("");
  }

  /* =========================================================
     3. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Open New PO modal
    $("#createPoBtn")?.addEventListener("click", () => {
      $("#poForm").reset();
      populateSuppliersDropdown();
      const container = $("#poItemsContainer");
      container.innerHTML = "";
      addPoItemRow(); // Add first item row
      updatePoTotal();
      poModalInstance.show();
    });

    // Add another item row in PO form
    $("#addPoItemRowBtn")?.addEventListener("click", () => {
      addPoItemRow();
    });

    // PO Form Submit
    $("#poForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const supplierId = $("#poSupplierSelect").value;
      const expectedDate = $("#poExpectedDate").value;

      const rows = $$(".po-item-row");
      const items = [];
      rows.forEach(row => {
        const medSelect = row.querySelector(".po-med-select");
        const qtyInput = row.querySelector(".po-qty-input");
        const priceInput = row.querySelector(".po-price-input");

        const medId = medSelect.value;
        const medName = medSelect.selectedOptions[0].textContent;
        const orderedQty = Number(qtyInput.value || 1);
        const unitPrice = Number(priceInput.value || 0);

        if (medId) {
          items.push({ medicineId: medId, medicineName: medName, orderedQty, unitPrice });
        }
      });

      if (!items.length) {
        alert("Please add at least one medicine item.");
        return;
      }

      APSStore.createPurchaseOrder({ supplierId, items, expectedDate });
      poModalInstance.hide();
      renderPOList();
      APS.showToast("Purchase order generated successfully.");
      APS.playSuccessSound();
    });

    // Open Goods Receipt Modal
    $("#poTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-receive-po]");
      if (btn) {
        const poId = btn.dataset.receivePo;
        openReceiveModal(poId);
      }
    });

    // Goods Receipt Form Submit
    $("#receiveForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const poId = $("#receivePoId").value;
      const invoiceNumber = $("#receiveSupplierInvoice").value.trim();

      const itemRows = $$(".receive-item-row");
      const receivedBatches = [];

      itemRows.forEach(row => {
        const medId = row.dataset.medId;
        const batchNum = row.querySelector(".rec-batch-num").value.trim().toUpperCase();
        const expDate = row.querySelector(".rec-exp-date").value;
        const costPrice = Number(row.querySelector(".rec-cost").value);
        const sellPrice = Number(row.querySelector(".rec-price").value);
        const mrp = Number(row.querySelector(".rec-mrp").value || sellPrice);
        const qty = Number(row.querySelector(".rec-qty").value);

        if (medId && batchNum && expDate && qty > 0) {
          receivedBatches.push({
            medicineId: medId,
            batchNumber: batchNum,
            expiryDate: expDate,
            purchasePrice: costPrice,
            sellingPrice: sellPrice,
            mrp: mrp,
            quantityReceived: qty
          });
        }
      });

      try {
        APSStore.receiveGoods({ poId, invoiceNumber, receivedBatches });
        receiveModalInstance.hide();
        renderPOList();
        renderSuppliers();
        APS.showToast("Goods received & batches added to stock inventory!");
        APS.playSuccessSound();
      } catch (err) {
        alert(err.message);
      }
    });

    // Pay Supplier Modal Trigger
    $("#suppliersTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pay-supplier]");
      if (btn) {
        const supId = btn.dataset.paySupplier;
        const name = btn.dataset.supName;
        const bal = Number(btn.dataset.supBal || 0);

        $("#paySupplierId").value = supId;
        $("#paySupplierName").textContent = name;
        $("#paySupplierBalance").textContent = "৳ " + bal.toLocaleString();
        $("#paySupplierAmount").value = bal > 0 ? bal : 5000;
        supplierPayModalInstance.show();
      }
    });

    // Supplier Payment Form Submit
    $("#supplierPayForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const supId = $("#paySupplierId").value;
      const amount = Number($("#paySupplierAmount").value);
      const paymentMode = $("#paySupplierMode").value;
      const ref = $("#paySupplierRef").value.trim();

      APSStore.recordSupplierPayment({
        supplierId: supId,
        amount,
        paymentMode,
        referenceNumber: ref
      });

      supplierPayModalInstance.hide();
      renderSuppliers();
      APS.showToast(`Recorded payment of ৳${amount.toLocaleString()} to supplier.`);
      APS.playSuccessSound();
    });

    // Register Supplier Modal Trigger
    $("#newSupplierBtn")?.addEventListener("click", () => {
      $("#supplierForm").reset();
      supplierModalInstance.show();
    });

    // Register Supplier Form Submit
    $("#supplierForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#supName").value.trim();
      const contactPerson = $("#supContactPerson").value.trim();
      const phone = $("#supPhone").value.trim();
      const email = $("#supEmail").value.trim();
      const gstin = $("#supGstin").value.trim();
      const creditDays = Number($("#supCreditDays").value || 30);

      APSStore.saveSupplier({
        name,
        contactPerson,
        phone,
        email,
        gstin,
        creditPeriodDays: creditDays,
        outstandingBalance: 0
      });

      supplierModalInstance.hide();
      renderSuppliers();
      populateSuppliersDropdown();
      APS.showToast(`Supplier ${name} registered.`);
    });
  }

  /* =========================================================
     4. PO ITEM ROW DYNAMICS
  ========================================================== */

  function addPoItemRow() {
    const meds = APSStore.getMedicines();
    const container = $("#poItemsContainer");
    const rowId = "po_row_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);

    const div = document.createElement("div");
    div.className = "row g-2 align-items-center mb-2 po-item-row";
    div.id = rowId;

    div.innerHTML = `
      <div class="col-md-5">
        <select class="form-select form-select-sm po-med-select" required>
          <option value="" disabled selected>Choose medicine...</option>
          ${meds.map(m => `<option value="${m.id}" data-cost="${m.sellingPrice ? (m.sellingPrice * 0.7).toFixed(2) : 5}">${APS.escapeHtml(m.name)}</option>`).join("")}
        </select>
      </div>
      <div class="col-md-3">
        <input type="number" class="form-control form-control-sm po-qty-input" placeholder="Quantity" value="100" min="1" required>
      </div>
      <div class="col-md-3">
        <input type="number" step="0.01" class="form-control form-control-sm po-price-input" placeholder="Unit Cost (৳)" value="5.00" required>
      </div>
      <div class="col-md-1 text-end">
        <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="document.getElementById('${rowId}').remove(); window.updatePoTotal();">
          <i class="bi bi-trash fs-6"></i>
        </button>
      </div>
    `;

    container.appendChild(div);

    // Auto populate estimated cost when medicine is chosen
    const select = div.querySelector(".po-med-select");
    const priceInput = div.querySelector(".po-price-input");
    const qtyInput = div.querySelector(".po-qty-input");

    select.addEventListener("change", () => {
      const opt = select.selectedOptions[0];
      if (opt && opt.dataset.cost) {
        priceInput.value = opt.dataset.cost;
      }
      updatePoTotal();
    });

    qtyInput.addEventListener("input", updatePoTotal);
    priceInput.addEventListener("input", updatePoTotal);
  }

  window.updatePoTotal = function() {
    const rows = $$(".po-item-row");
    let sum = 0;
    rows.forEach(r => {
      const q = Number(r.querySelector(".po-qty-input")?.value || 0);
      const p = Number(r.querySelector(".po-price-input")?.value || 0);
      sum += (q * p);
    });
    const estEl = $("#poTotalEstimate");
    if (estEl) estEl.textContent = "৳ " + sum.toFixed(2);
  };

  /* =========================================================
     5. GOODS RECEIPT MODAL POPULATOR
  ========================================================== */

  function openReceiveModal(poId) {
    const poList = APSStore.getPurchaseOrders();
    const po = poList.find(p => p.id === poId);
    if (!po) return;

    $("#receivePoId").value = po.id;
    $("#receiveSupplierInvoice").value = "INV-" + Math.floor(100000 + Math.random() * 900000);

    const container = $("#receiveItemsContainer");
    container.innerHTML = po.items.map((item, idx) => {
      const defaultBatch = "BAT-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900);
      const defaultExp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const costPrice = Number(item.unitPrice || 5);
      const sellPrice = (costPrice * 1.35).toFixed(2);
      const mrp = (costPrice * 1.4).toFixed(2);

      return `
        <div class="card p-3 mb-2 bg-light border receive-item-row" data-med-id="${item.medicineId}">
          <strong class="text-teal-900 mb-2 d-block">${APS.escapeHtml(item.medicineName)} (Ordered: ${item.orderedQty})</strong>
          <div class="row g-2">
            <div class="col-md-4">
              <label class="small text-muted">Assigned Batch #</label>
              <input type="text" class="form-control form-control-sm rec-batch-num" value="${defaultBatch}" required>
            </div>
            <div class="col-md-4">
              <label class="small text-muted">Expiry Date *</label>
              <input type="date" class="form-control form-control-sm rec-exp-date" value="${defaultExp}" required>
            </div>
            <div class="col-md-4">
              <label class="small text-muted">Received Qty</label>
              <input type="number" class="form-control form-control-sm rec-qty" value="${item.orderedQty}" min="1" required>
            </div>
            <div class="col-md-4">
              <label class="small text-muted">Cost Price (৳)</label>
              <input type="number" step="0.01" class="form-control form-control-sm rec-cost" value="${costPrice}" required>
            </div>
            <div class="col-md-4">
              <label class="small text-muted">Selling Price (৳)</label>
              <input type="number" step="0.01" class="form-control form-control-sm rec-price" value="${sellPrice}" required>
            </div>
            <div class="col-md-4">
              <label class="small text-muted">MRP (৳)</label>
              <input type="number" step="0.01" class="form-control form-control-sm rec-mrp" value="${mrp}" required>
            </div>
          </div>
        </div>
      `;
    }).join("");

    receiveModalInstance.show();
  }

})();
