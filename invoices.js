/**
 * APS Medical Management System — Invoices & Sales Returns Controller
 * Handles GST Invoicing repository, Print Modal previews, and Sales Returns processing.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let currentSearch = "";
  let currentPaymentFilter = "all";

  let viewInvoiceModalInstance = null;
  let returnModalInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    viewInvoiceModalInstance = new bootstrap.Modal($("#viewInvoiceModal"));
    returnModalInstance = new bootstrap.Modal($("#returnModal"));

    if (window.location.hash === "#returns") {
      const tab = new bootstrap.Tab($("#returns-tab"));
      tab.show();
    }

    renderInvoices();
    renderReturns();
    initEventListeners();
  });

  /* =========================================================
     1. RENDER INVOICES TABLE
  ========================================================== */

  function renderInvoices() {
    const tbody = $("#invoicesTableBody");
    if (!tbody) return;

    let invoices = APSStore.getInvoices();

    if (currentSearch) {
      invoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(currentSearch) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(currentSearch))
      );
    }

    if (currentPaymentFilter !== "all") {
      invoices = invoices.filter(inv => inv.paymentMode === currentPaymentFilter);
    }

    if (!invoices.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No invoices found matching filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const isPaid = inv.paymentStatus === "Paid";
      const statusBadge = isPaid
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Paid</span>`
        : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Credit / Unpaid</span>`;

      return `
        <tr>
          <td><strong class="text-teal-900 font-monospace">${APS.escapeHtml(inv.invoiceNumber)}</strong></td>
          <td><small class="text-muted">${inv.invoiceDate}</small></td>
          <td><strong>${APS.escapeHtml(inv.customerName)}</strong></td>
          <td><small>${APS.escapeHtml(inv.servedBy)}</small></td>
          <td>৳${Number(inv.subtotal).toFixed(2)}</td>
          <td><small class="text-muted">৳${Number(inv.gstAmount).toFixed(2)}</small></td>
          <td><strong class="text-teal-700">৳${Number(inv.totalAmount).toFixed(2)}</strong></td>
          <td><span class="badge bg-light text-dark border">${APS.escapeHtml(inv.paymentMode)}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary rounded-pill px-2 me-1" data-view-inv="${inv.invoiceNumber}" title="View & Print Invoice">
              <i class="bi bi-printer"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-2" data-return-inv="${inv.invoiceNumber}" title="Process Return / Refund">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     2. RENDER RETURNS TABLE
  ========================================================== */

  function renderReturns() {
    const tbody = $("#returnsTableBody");
    if (!tbody) return;

    const returns = APSStore.getReturns();

    if (!returns.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No sales returns processed yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = returns.map(ret => `
      <tr>
        <td><strong class="font-monospace text-teal-900">${APS.escapeHtml(ret.id)}</strong></td>
        <td><span class="badge bg-light text-dark border font-monospace">${APS.escapeHtml(ret.invoiceNumber)}</span></td>
        <td>${APS.escapeHtml(ret.customerName)}</td>
        <td><small class="text-muted">${ret.returnDate}</small></td>
        <td><small class="text-muted">${APS.escapeHtml(ret.reason)}</small></td>
        <td>
          ${ret.restocked ? '<span class="badge bg-success-subtle text-success">Restocked</span>' : '<span class="badge bg-secondary">Disposed</span>'}
        </td>
        <td><strong class="text-danger">৳${Number(ret.totalRefundAmount).toFixed(2)}</strong></td>
        <td><small>${APS.escapeHtml(ret.processedBy)}</small></td>
      </tr>
    `).join("");
  }

  /* =========================================================
     3. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Search
    $("#invSearchInput")?.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderInvoices();
    });

    // Payment Filter
    $("#invPaymentFilter")?.addEventListener("change", (e) => {
      currentPaymentFilter = e.target.value;
      renderInvoices();
    });

    // Table clicks (View & Return)
    $("#invoicesTableBody")?.addEventListener("click", (e) => {
      const viewBtn = e.target.closest("[data-view-inv]");
      if (viewBtn) {
        const invNum = viewBtn.dataset.viewInv;
        openPrintModal(invNum);
        return;
      }

      const returnBtn = e.target.closest("[data-return-inv]");
      if (returnBtn) {
        const invNum = returnBtn.dataset.returnInv;
        openReturnModal(invNum);
      }
    });

    // Return Form Submit
    $("#returnForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const saleId = $("#returnSaleId").value;
      const invNum = $("#returnModalInvNumber").textContent;
      const reason = $("#returnReasonSelect").value;
      const restock = $("#restockInventoryToggle").checked;

      const rows = $$(".return-item-row");
      const itemsToReturn = [];

      rows.forEach(r => {
        const qty = Number(r.querySelector(".return-qty-input").value || 0);
        if (qty > 0) {
          itemsToReturn.push({
            medicineId: r.dataset.medId,
            medicineName: r.dataset.medName,
            batchId: r.dataset.batchId,
            batchNumber: r.dataset.batchNumber,
            quantity: qty,
            unitPrice: Number(r.dataset.price)
          });
        }
      });

      if (!itemsToReturn.length) {
        alert("Please specify a return quantity greater than 0 for at least one item.");
        return;
      }

      try {
        APSStore.processReturn({
          saleId,
          invoiceNumber: invNum,
          itemsToReturn,
          reason,
          restockInventory: restock
        });

        returnModalInstance.hide();
        renderReturns();
        renderInvoices();
        APS.showToast(`Return processed for ${invNum}. Refund authorized.`);
        APS.playAlertSound();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  /* =========================================================
     4. PRINT MODAL BUILDER
  ========================================================== */

  function openPrintModal(invNum) {
    const invoices = APSStore.getInvoices();
    const inv = invoices.find(i => i.invoiceNumber === invNum);
    if (!inv) return;

    $("#printInvNumber").textContent = inv.invoiceNumber;
    $("#printInvDate").textContent = "Date: " + inv.invoiceDate;
    $("#printInvCustomer").textContent = inv.customerName;
    $("#printInvCashier").textContent = inv.servedBy;
    $("#printInvMode").textContent = inv.paymentMode;
    $("#printInvStatus").textContent = inv.paymentStatus.toUpperCase();

    const tbody = $("#printInvItems");
    tbody.innerHTML = inv.items.map(item => `
      <tr>
        <td><strong>${APS.escapeHtml(item.medicineName)}</strong></td>
        <td><small class="font-monospace">${APS.escapeHtml(item.batchNumber)}</small></td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">৳${Number(item.unitPrice).toFixed(2)}</td>
        <td class="text-end">৳${Number(item.subtotal).toFixed(2)}</td>
      </tr>
    `).join("");

    $("#printInvSubtotal").textContent = "৳ " + Number(inv.subtotal).toFixed(2);
    $("#printInvDiscount").textContent = "- ৳ " + Number(inv.discount || 0).toFixed(2);
    $("#printInvTax").textContent = "৳ " + Number(inv.gstAmount || 0).toFixed(2);
    $("#printInvGrandTotal").textContent = "৳ " + Number(inv.totalAmount).toFixed(2);

    viewInvoiceModalInstance.show();
  }

  /* =========================================================
     5. RETURN MODAL BUILDER
  ========================================================== */

  function openReturnModal(invNum) {
    const invoices = APSStore.getInvoices();
    const inv = invoices.find(i => i.invoiceNumber === invNum);
    if (!inv) return;

    $("#returnSaleId").value = inv.saleId;
    $("#returnModalInvNumber").textContent = inv.invoiceNumber;
    $("#returnModalCustName").textContent = inv.customerName;

    const container = $("#returnItemsContainer");
    container.innerHTML = inv.items.map(item => `
      <div class="row g-2 align-items-center mb-2 p-2 bg-light border rounded-3 return-item-row"
           data-med-id="${item.medicineId}"
           data-med-name="${APS.escapeHtml(item.medicineName)}"
           data-batch-id="${item.batchId}"
           data-batch-number="${APS.escapeHtml(item.batchNumber)}"
           data-price="${item.unitPrice}">
        <div class="col-6">
          <strong class="d-block text-teal-900 small">${APS.escapeHtml(item.medicineName)}</strong>
          <small class="text-muted">Purchased: ${item.quantity} units @ ৳${item.unitPrice}</small>
        </div>
        <div class="col-3">
          <label class="small text-muted">Return Qty:</label>
          <input type="number" class="form-control form-control-sm return-qty-input" min="0" max="${item.quantity}" value="0">
        </div>
        <div class="col-3 text-end">
          <span class="small text-muted d-block">Refund:</span>
          <strong class="text-danger item-refund-display">৳ 0.00</strong>
        </div>
      </div>
    `).join("");

    // Setup refund calculation listeners
    $$(".return-qty-input").forEach(input => {
      input.addEventListener("input", calculateReturnRefund);
    });

    calculateReturnRefund();
    returnModalInstance.show();
  }

  function calculateReturnRefund() {
    const rows = $$(".return-item-row");
    let total = 0;

    rows.forEach(r => {
      const qty = Number(r.querySelector(".return-qty-input").value || 0);
      const price = Number(r.dataset.price || 0);
      const itemRefund = qty * price;
      total += itemRefund;
      r.querySelector(".item-refund-display").textContent = "৳ " + itemRefund.toFixed(2);
    });

    $("#returnRefundDisplay").textContent = "৳ " + total.toFixed(2);
  }

})();
