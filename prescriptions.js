/**
 * APS Medical Management System — Prescription Management Controller
 * Handles Doctor Registries, Digital Rx Creation, and Direct POS Dispensing integration.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  let rxModalInstance = null;
  let doctorModalInstance = null;
  let rxDetailModalInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    rxModalInstance = new bootstrap.Modal($("#rxModal"));
    doctorModalInstance = new bootstrap.Modal($("#doctorModal"));
    rxDetailModalInstance = new bootstrap.Modal($("#rxDetailModal"));

    renderPrescriptions();
    renderDoctors();
    populateDropdowns();
    initEventListeners();
  });

  /* =========================================================
     1. RENDER PRESCRIPTIONS
  ========================================================== */

  function renderPrescriptions() {
    const tbody = $("#rxTableBody");
    if (!tbody) return;

    const rxs = APSStore.getPrescriptions();

    if (!rxs.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No prescriptions recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = rxs.map(r => {
      const isDispensed = r.status === "Dispensed";
      const statusBadge = isDispensed
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check2-circle me-1"></i>Dispensed</span>`
        : `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1"><i class="bi bi-hourglass-split me-1"></i>Pending Dispense</span>`;

      const regimenSummary = r.items.map(i => `${APS.escapeHtml(i.medicineName)} [${APS.escapeHtml(i.dosage)}]`).join(", ");

      const dispenseBtn = isDispensed
        ? `<button class="btn btn-sm btn-outline-secondary rounded-pill px-3" data-view-rx="${r.id}"><i class="bi bi-eye me-1"></i>View</button>`
        : `
          <button class="btn btn-sm btn-outline-secondary rounded-pill px-2 me-1" data-view-rx="${r.id}"><i class="bi bi-eye"></i></button>
          <a href="pos.html?rxId=${r.id}" class="btn btn-sm btn-success rounded-pill px-3 fw-semibold">
            <i class="bi bi-cart-check me-1"></i>Dispense in POS
          </a>
        `;

      return `
        <tr>
          <td><strong class="text-teal-900 font-monospace">${APS.escapeHtml(r.id)}</strong></td>
          <td><strong>${APS.escapeHtml(r.customerName)}</strong></td>
          <td>${APS.escapeHtml(r.doctorName)}</td>
          <td><small class="text-muted">${r.prescriptionDate}</small></td>
          <td><small class="text-truncate d-inline-block" style="max-width: 260px;" title="${regimenSummary}">${regimenSummary}</small></td>
          <td>${statusBadge}</td>
          <td class="text-end">${dispenseBtn}</td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     2. RENDER DOCTORS
  ========================================================== */

  function renderDoctors() {
    const tbody = $("#doctorsTableBody");
    if (!tbody) return;

    const docs = APSStore.getDoctors();

    tbody.innerHTML = docs.map(d => `
      <tr>
        <td><strong class="text-teal-900">${APS.escapeHtml(d.name)}</strong></td>
        <td><span class="badge bg-light text-dark border">${APS.escapeHtml(d.specialization)}</span></td>
        <td><small class="font-monospace">${APS.escapeHtml(d.licenseNumber)}</small></td>
        <td>${APS.escapeHtml(d.chamber || "—")}</td>
        <td><small class="text-muted">${APS.escapeHtml(d.phone || "—")}</small></td>
      </tr>
    `).join("");
  }

  function populateDropdowns() {
    const custs = APSStore.getCustomers();
    const docs = APSStore.getDoctors();

    const custSelect = $("#rxCustomerSelect");
    if (custSelect) {
      custSelect.innerHTML = `<option value="" disabled selected>Select patient...</option>` +
        custs.map(c => `<option value="${c.id}">${APS.escapeHtml(c.name)} (${c.phone})</option>`).join("");
    }

    const docSelect = $("#rxDoctorSelect");
    if (docSelect) {
      docSelect.innerHTML = `<option value="" disabled selected>Select prescribing doctor...</option>` +
        docs.map(d => `<option value="${d.id}">${APS.escapeHtml(d.name)} (${d.specialization})</option>`).join("");
    }
  }

  /* =========================================================
     3. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Open create Rx modal
    $("#createRxBtn")?.addEventListener("click", () => {
      $("#rxForm").reset();
      populateDropdowns();
      const container = $("#rxItemsContainer");
      container.innerHTML = "";
      addRxItemRow();
      rxModalInstance.show();
    });

    // Add another medicine row
    $("#addRxItemBtn")?.addEventListener("click", () => {
      addRxItemRow();
    });

    // Submit Prescription Form
    $("#rxForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const custSelect = $("#rxCustomerSelect");
      const customerId = custSelect.value;
      const customerName = custSelect.selectedOptions[0].textContent.split(" (")[0];

      const docSelect = $("#rxDoctorSelect");
      const doctorId = docSelect.value;
      const doctorName = docSelect.selectedOptions[0].textContent.split(" (")[0];

      const notes = $("#rxNotes").value.trim();

      const rows = $$(".rx-item-row");
      const items = [];
      rows.forEach(r => {
        const medSelect = r.querySelector(".rx-med-select");
        const dosageInput = r.querySelector(".rx-dosage-input");
        const durationInput = r.querySelector(".rx-duration-input");
        const qtyInput = r.querySelector(".rx-qty-input");

        const medId = medSelect.value;
        const medName = medSelect.selectedOptions[0].textContent;
        const dosage = dosageInput.value.trim() || "1-0-1 after meals";
        const durationDays = Number(durationInput.value || 7);
        const quantityPrescribed = Number(qtyInput.value || 14);

        if (medId) {
          items.push({ medicineId: medId, medicineName: medName, dosage, durationDays, quantityPrescribed });
        }
      });

      if (!items.length) {
        alert("Please prescribe at least one medicine.");
        return;
      }

      APSStore.savePrescription({
        customerId,
        customerName,
        doctorId,
        doctorName,
        notes,
        status: "Pending",
        items
      });

      rxModalInstance.hide();
      renderPrescriptions();
      APS.showToast(`Prescription created for ${customerName}. Ready to dispense.`);
      APS.playSuccessSound();
    });

    // Open Doctor Registration Modal
    $("#newDoctorBtn")?.addEventListener("click", () => {
      $("#doctorForm").reset();
      doctorModalInstance.show();
    });

    // Register Doctor Submit
    $("#doctorForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#docName").value.trim();
      const specialization = $("#docSpecialization").value.trim();
      const licenseNumber = $("#docLicense").value.trim();
      const chamber = $("#docChamber").value.trim();
      const phone = $("#docPhone").value.trim();

      APSStore.saveDoctor({ name, specialization, licenseNumber, chamber, phone });
      doctorModalInstance.hide();
      renderDoctors();
      populateDropdowns();
      APS.showToast(`Doctor ${name} registered.`);
    });

    // View Rx Detail Modal trigger
    $("#rxTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view-rx]");
      if (btn) {
        const rxId = btn.dataset.viewRx;
        openRxDetail(rxId);
      }
    });
  }

  /* =========================================================
     4. RX ITEM ROW BUILDER
  ========================================================== */

  function addRxItemRow() {
    const meds = APSStore.getMedicines();
    const container = $("#rxItemsContainer");
    const rowId = "rx_row_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);

    const div = document.createElement("div");
    div.className = "row g-2 align-items-center mb-2 rx-item-row";
    div.id = rowId;

    div.innerHTML = `
      <div class="col-md-5">
        <select class="form-select form-select-sm rx-med-select" required>
          <option value="" disabled selected>Select medicine...</option>
          ${meds.map(m => `<option value="${m.id}">${APS.escapeHtml(m.name)}</option>`).join("")}
        </select>
      </div>
      <div class="col-md-3">
        <input type="text" class="form-control form-control-sm rx-dosage-input" placeholder="e.g. 1-0-1 after meals" value="1-0-1 after meals" required>
      </div>
      <div class="col-md-2">
        <input type="number" class="form-control form-control-sm rx-duration-input" placeholder="Days" value="14" min="1" required>
      </div>
      <div class="col-md-1">
        <input type="number" class="form-control form-control-sm rx-qty-input" placeholder="Qty" value="28" min="1" required>
      </div>
      <div class="col-md-1 text-end">
        <button type="button" class="btn btn-sm btn-link text-danger p-0" onclick="document.getElementById('${rowId}').remove();">
          <i class="bi bi-trash fs-6"></i>
        </button>
      </div>
    `;

    container.appendChild(div);
  }

  /* =========================================================
     5. VIEW RX DETAIL MODAL
  ========================================================== */

  function openRxDetail(rxId) {
    const rxs = APSStore.getPrescriptions();
    const rx = rxs.find(r => r.id === rxId);
    if (!rx) return;

    $("#viewRxDocName").textContent = rx.doctorName;
    $("#viewRxRef").textContent = rx.id.toUpperCase();
    $("#viewRxDate").textContent = "Date: " + rx.prescriptionDate;
    $("#viewRxPatient").textContent = rx.customerName;
    $("#viewRxNotes").textContent = rx.notes || "Standard clinical regimen";

    const tbody = $("#viewRxItems");
    tbody.innerHTML = rx.items.map(item => `
      <tr>
        <td><strong>${APS.escapeHtml(item.medicineName)}</strong></td>
        <td>${APS.escapeHtml(item.dosage)}</td>
        <td>${item.durationDays} Days</td>
        <td class="text-center font-monospace fw-bold">${item.quantityPrescribed}</td>
      </tr>
    `).join("");

    const dispenseBtn = $("#viewRxDispenseBtn");
    if (dispenseBtn) {
      dispenseBtn.onclick = () => {
        window.location.href = `pos.html?rxId=${rx.id}`;
      };
    }

    rxDetailModalInstance.show();
  }

})();
