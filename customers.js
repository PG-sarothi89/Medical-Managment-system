/**
 * APS Medical Management System — Customer Management Controller
 * Handles Patient Records, Credit Limits, Balances, Loyalty Points, and Debt Settlements.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let currentSearch = "";
  let currentCreditFilter = "all";

  let customerModalInstance = null;
  let settleModalInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    customerModalInstance = new bootstrap.Modal($("#customerModal"));
    settleModalInstance = new bootstrap.Modal($("#settleModal"));

    refreshKPIs();
    renderCustomers();
    initEventListeners();
  });

  /* =========================================================
     1. KPIS REFRESH
  ========================================================== */

  function refreshKPIs() {
    const custs = APSStore.getCustomers();

    const totalCustEl = $("#totalCustCount");
    if (totalCustEl) totalCustEl.textContent = custs.length;

    const totalDue = custs.reduce((sum, c) => sum + Number(c.outstandingBalance || 0), 0);
    const totalDueEl = $("#totalCreditDue");
    if (totalDueEl) totalDueEl.textContent = "৳ " + totalDue.toLocaleString("en-BD", { minimumFractionDigits: 2 });

    const totalPoints = custs.reduce((sum, c) => sum + Number(c.loyaltyPoints || 0), 0);
    const totalPointsEl = $("#totalLoyaltyPoints");
    if (totalPointsEl) totalPointsEl.textContent = totalPoints.toLocaleString();

    const healthyAccounts = custs.filter(c => Number(c.outstandingBalance || 0) === 0);
    const healthyEl = $("#healthyAccountsCount");
    if (healthyEl) healthyEl.textContent = healthyAccounts.length;
  }

  /* =========================================================
     2. RENDER CUSTOMERS TABLE
  ========================================================== */

  function renderCustomers() {
    const tbody = $("#customersTableBody");
    if (!tbody) return;

    let custs = APSStore.getCustomers();

    if (currentSearch) {
      custs = custs.filter(c =>
        c.name.toLowerCase().includes(currentSearch) ||
        c.phone.includes(currentSearch) ||
        (c.email && c.email.toLowerCase().includes(currentSearch))
      );
    }

    if (currentCreditFilter === "has_due") {
      custs = custs.filter(c => Number(c.outstandingBalance || 0) > 0);
    } else if (currentCreditFilter === "clear") {
      custs = custs.filter(c => Number(c.outstandingBalance || 0) === 0);
    }

    const countEl = $("#custFilteredCount");
    if (countEl) countEl.textContent = custs.length;

    if (!custs.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No customer records matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = custs.map(c => {
      const balance = Number(c.outstandingBalance || 0);
      const limit = Number(c.creditLimit || 5000);
      const isOverLimit = balance > limit;
      const hasBalance = balance > 0;

      let balanceBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle">৳0.00 (Clear)</span>`;
      if (isOverLimit) {
        balanceBadge = `<span class="badge bg-danger text-white">৳${balance.toFixed(2)} (Exceeded)</span>`;
      } else if (hasBalance) {
        balanceBadge = `<span class="badge bg-warning-subtle text-danger border border-warning-subtle fw-bold">৳${balance.toFixed(2)}</span>`;
      }

      return `
        <tr>
          <td>
            <strong class="text-teal-900">${APS.escapeHtml(c.name)}</strong>
            <small class="d-block text-muted">DOB: ${c.dateOfBirth || "—"}</small>
          </td>
          <td>
            <div>${APS.escapeHtml(c.phone)}</div>
            <small class="text-muted">${APS.escapeHtml(c.email || "—")}</small>
          </td>
          <td><small class="text-muted">${APS.escapeHtml(c.address || "—")}</small></td>
          <td>৳${limit.toLocaleString()}</td>
          <td>${balanceBadge}</td>
          <td><span class="badge bg-light text-dark border"><i class="bi bi-star-fill text-warning me-1"></i>${c.loyaltyPoints || 0} pts</span></td>
          <td class="text-end">
            ${hasBalance ? `
              <button class="btn btn-sm btn-outline-danger rounded-pill px-3 me-1" data-settle-cust="${c.id}" data-cust-name="${APS.escapeHtml(c.name)}" data-cust-bal="${balance}">
                <i class="bi bi-cash-coin me-1"></i>Settle Due
              </button>
            ` : ''}
            <button class="btn btn-sm btn-light text-primary border rounded-pill px-2" data-edit-cust="${c.id}" title="Edit Customer Details">
              <i class="bi bi-pencil"></i>
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
    // Search
    $("#custSearchInput")?.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderCustomers();
    });

    // Credit Filter
    $("#custCreditFilter")?.addEventListener("change", (e) => {
      currentCreditFilter = e.target.value;
      renderCustomers();
    });

    // Add Customer
    $("#addCustomerBtn")?.addEventListener("click", () => {
      $("#customerForm").reset();
      $("#custEditId").value = "";
      $("#custModalTitle").textContent = "Register Customer";
      customerModalInstance.show();
    });

    // Customer Form Submit
    $("#customerForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = $("#custEditId").value || null;
      const name = $("#custName").value.trim();
      const phone = $("#custPhone").value.trim();
      const email = $("#custEmail").value.trim();
      const address = $("#custAddress").value.trim();
      const dateOfBirth = $("#custDob").value;
      const creditLimit = Number($("#custLimit").value || 5000);

      APSStore.saveCustomer({
        id,
        name,
        phone,
        email,
        address,
        dateOfBirth,
        creditLimit
      });

      customerModalInstance.hide();
      refreshKPIs();
      renderCustomers();
      APS.showToast(`Customer ${name} saved successfully.`);
      APS.playSuccessSound();
    });

    // Table click actions (Edit & Settle)
    $("#customersTableBody")?.addEventListener("click", (e) => {
      const editBtn = e.target.closest("[data-edit-cust]");
      if (editBtn) {
        const id = editBtn.dataset.editCust;
        const custs = APSStore.getCustomers();
        const c = custs.find(item => item.id === id);
        if (c) {
          $("#custEditId").value = c.id;
          $("#custName").value = c.name;
          $("#custPhone").value = c.phone;
          $("#custEmail").value = c.email || "";
          $("#custAddress").value = c.address || "";
          $("#custDob").value = c.dateOfBirth || "";
          $("#custLimit").value = c.creditLimit || 5000;
          $("#custModalTitle").textContent = "Edit Customer: " + c.name;
          customerModalInstance.show();
        }
        return;
      }

      const settleBtn = e.target.closest("[data-settle-cust]");
      if (settleBtn) {
        const id = settleBtn.dataset.settleCust;
        const name = settleBtn.dataset.custName;
        const bal = Number(settleBtn.dataset.custBal || 0);

        $("#settleCustId").value = id;
        $("#settleCustName").textContent = name;
        $("#settleCustBalance").textContent = "৳ " + bal.toFixed(2);
        $("#settleAmount").value = bal;
        $("#settleRef").value = "REC-" + Math.floor(10000 + Math.random() * 90000);
        settleModalInstance.show();
      }
    });

    // Settle Credit Form Submit
    $("#settleForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const customerId = $("#settleCustId").value;
      const amount = Number($("#settleAmount").value);
      const paymentMode = $("#settleMode").value;
      const referenceNumber = $("#settleRef").value.trim();

      try {
        APSStore.settleCustomerCredit({ customerId, amount, paymentMode, referenceNumber });
        settleModalInstance.hide();
        refreshKPIs();
        renderCustomers();
        APS.showToast(`Credit collection of ৳${amount.toFixed(2)} recorded.`);
        APS.playSuccessSound();
      } catch (err) {
        alert(err.message);
      }
    });
  }

})();
