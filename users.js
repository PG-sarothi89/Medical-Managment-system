/**
 * APS Medical Management System — Users & Audit Trail Controller
 * Manages user accounts, credentials, RBAC matrix, and live audit logging.
 */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);

  let userModalInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    userModalInstance = new bootstrap.Modal($("#userModal"));

    if (window.location.hash === "#audit") {
      const tab = new bootstrap.Tab($("#audit-tab"));
      tab.show();
    }

    renderUsers();
    renderAuditLogs();
    initEventListeners();
  });

  /* =========================================================
     1. RENDER USERS
  ========================================================== */

  function renderUsers() {
    const tbody = $("#usersTableBody");
    if (!tbody) return;

    const users = APSStore.getUsers();

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <strong class="text-teal-900">${APS.escapeHtml(u.name)}</strong>
          <small class="d-block text-muted">Username: @${APS.escapeHtml(u.username)}</small>
        </td>
        <td>
          <span class="badge bg-teal-50 text-teal-800 border border-teal-200 fw-semibold px-2 py-1">${APS.escapeHtml(u.designation || u.roleTitle || "Staff Specialist")}</span>
        </td>
        <td>${APS.escapeHtml(u.email)}</td>
        <td><span class="badge bg-light text-teal-900 border px-2 py-1">${APS.escapeHtml(u.roleTitle || u.role)}</span></td>
        <td><small class="text-muted">${APS.escapeHtml(u.phone || "—")}</small></td>
        <td>
          ${u.isActive ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Active</span>' : '<span class="badge bg-secondary">Disabled</span>'}
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-light text-primary border rounded-pill px-3" data-edit-user="${u.id}">
            <i class="bi bi-pencil me-1"></i>Edit
          </button>
        </td>
      </tr>
    `).join("");
  }

  /* =========================================================
     2. RENDER AUDIT LOGS
  ========================================================== */

  function renderAuditLogs() {
    const tbody = $("#auditTableBody");
    if (!tbody) return;

    const logs = APSStore.getAuditLogs();

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No audit trail events recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let badge = `<span class="badge bg-secondary">${l.action}</span>`;
      if (l.action.includes("LOGIN")) badge = `<span class="badge bg-info text-dark">LOGIN</span>`;
      else if (l.action.includes("SALE")) badge = `<span class="badge bg-success">POS SALE</span>`;
      else if (l.action.includes("PURCHASE")) badge = `<span class="badge bg-primary">PURCHASE</span>`;
      else if (l.action.includes("ADJUST")) badge = `<span class="badge bg-warning text-dark">ADJUSTMENT</span>`;
      else if (l.action.includes("DELETE")) badge = `<span class="badge bg-danger">DELETE</span>`;

      return `
        <tr>
          <td><small class="text-muted font-monospace">${l.timestamp}</small></td>
          <td><strong>${APS.escapeHtml(l.userName)}</strong></td>
          <td>${badge}</td>
          <td><span class="badge bg-light text-dark border font-monospace">${APS.escapeHtml(l.tableName)}</span></td>
          <td><small class="font-monospace text-muted">${APS.escapeHtml(l.recordId)}</small></td>
          <td><small>${APS.escapeHtml(l.details)}</small></td>
        </tr>
      `;
    }).join("");
  }

  /* =========================================================
     3. EVENT LISTENERS
  ========================================================== */

  function initEventListeners() {
    // Open Add User
    $("#addUserBtn")?.addEventListener("click", () => {
      $("#userForm").reset();
      $("#userEditId").value = "";
      $("#userDesignation").value = "";
      const titleEl = $("#userModalTitle");
      if (titleEl) titleEl.textContent = "Register System User";
      $("#deleteUserBtn")?.classList.add("d-none");
      userModalInstance.show();
    });

    // Submit User Form
    $("#userForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      try {
        const id = $("#userEditId").value ? $("#userEditId").value.trim() : null;
        const name = $("#userFullName").value.trim();
        const designation = $("#userDesignation").value.trim() || "Staff Specialist";
        const username = $("#userLoginName").value.trim();
        const role = $("#userRoleSelect").value;
        const roleTitle = $("#userRoleSelect").selectedOptions[0]?.textContent || role;
        const email = $("#userEmailInput").value.trim();
        const phone = $("#userPhoneInput").value.trim();
        const password = $("#userPasswordInput").value;
        const isActive = $("#userStatusSelect").value === "true";

        if (!name || !username || !email) {
          APS.showToast("Please provide staff name, username, and email.", "warning");
          return;
        }

        const savedUser = APSStore.saveUser({
          id: id || undefined,
          name,
          designation,
          username,
          role,
          roleTitle,
          email,
          phone,
          password,
          isActive
        });

        // Synchronize session if the current user profile was edited
        try {
          const currentUser = (typeof APS !== "undefined" && typeof APS.getCurrentUser === "function") 
            ? APS.getCurrentUser() 
            : null;
          if (currentUser && (currentUser.id === id || currentUser.email === email || currentUser.name === name)) {
            if (typeof APS.syncSessionUser === "function") {
              APS.syncSessionUser(savedUser);
            }
          }
        } catch (syncErr) {
          console.warn("Session sync notice:", syncErr);
        }

        if (userModalInstance) {
          userModalInstance.hide();
        } else {
          bootstrap.Modal.getInstance($("#userModal"))?.hide();
        }

        renderUsers();
        renderAuditLogs();
        APS.showToast(`Staff profile for ${name} (${designation}) saved successfully.`, "success");
        APS.playSuccessSound();
      } catch (err) {
        console.error("Save staff user error:", err);
        APS.showToast("Failed to save user: " + err.message, "danger");
      }
    });

    // Edit user click
    $("#usersTableBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-edit-user]");
      if (btn) {
        const id = btn.dataset.editUser;
        const users = APSStore.getUsers();
        const u = users.find(item => item.id === id);
        if (u) {
          const titleEl = $("#userModalTitle");
          if (titleEl) titleEl.textContent = `Edit Staff Profile: ${u.name}`;

          $("#userEditId").value = u.id;
          $("#userFullName").value = u.name;
          $("#userDesignation").value = u.designation || u.roleTitle || "";
          $("#userLoginName").value = u.username;
          $("#userRoleSelect").value = u.role;
          $("#userEmailInput").value = u.email;
          $("#userPhoneInput").value = u.phone || "";
          $("#userPasswordInput").value = u.password;
          $("#userStatusSelect").value = u.isActive !== false ? "true" : "false";

          // Only show delete button for non-primary accounts
          if (u.id === "usr-1") {
            $("#deleteUserBtn")?.classList.add("d-none");
          } else {
            $("#deleteUserBtn")?.classList.remove("d-none");
          }

          userModalInstance.show();
        }
      }
    });

    // Delete user button
    $("#deleteUserBtn")?.addEventListener("click", () => {
      const id = $("#userEditId").value;
      if (!id) return;
      if (confirm("Are you sure you want to permanently delete this staff member?")) {
        try {
          APSStore.deleteUser(id);
          userModalInstance.hide();
          renderUsers();
          renderAuditLogs();
          APS.showToast("Staff account removed.");
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Refresh Audit logs
    $("#refreshAuditBtn")?.addEventListener("click", () => {
      renderAuditLogs();
      APS.showToast("System audit logs refreshed.");
    });
  }

})();
