const adminMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const statusOptions = [
  "RECEIVED",
  "COVERAGE_REVIEW",
  "COVERAGE_MATCHED",
  "PAYMENT_PENDING",
  "APPROVED_FOR_TRAVEL",
  "DECLINED",
  "REFUNDED",
  "CLOSED",
];

const paymentOptions = ["NOT_REQUESTED", "INVOICE_SENT", "PAID", "REFUNDED", "WAIVED"];

const adminAuthForm = document.querySelector("#admin-auth");
const adminTokenInput = document.querySelector("#admin-token");
const refreshButton = document.querySelector("#refresh-applications");
const adminStatus = document.querySelector("#admin-status");
const applicationList = document.querySelector("#application-list");
const auditList = document.querySelector("#audit-list");
const adminStats = document.querySelector("#admin-stats");
const queueSearch = document.querySelector("#queue-search");
const statusFilter = document.querySelector("#status-filter");
const paymentFilter = document.querySelector("#payment-filter");

let cachedApplications = [];
let cachedAudit = [];

if (adminTokenInput) {
  const isLocal = ["127.0.0.1", "localhost", "::1"].includes(window.location.hostname);
  adminTokenInput.value = localStorage.getItem("dwb-admin-token") || (isLocal ? "local-admin-token" : "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatStatus(value) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionHtml(options, selected) {
  return options
    .map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${formatStatus(option)}</option>`)
    .join("");
}

function setAdminStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.classList.toggle("is-error", isError);
}

function statusClass(status) {
  if (status === "APPROVED_FOR_TRAVEL" || status === "COVERAGE_MATCHED") return "status-teal";
  if (status === "DECLINED" || status === "REFUNDED") return "status-gold";
  return "status-red";
}

function getFilteredApplications() {
  const query = queueSearch.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedPayment = paymentFilter.value;

  return cachedApplications.filter((application) => {
    const haystack = [
      application.reference,
      application.applicant,
      application.email,
      application.doctor,
      application.station,
      application.roleLabel,
      application.zoneLabel,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = selectedStatus === "all" || application.status === selectedStatus;
    const matchesPayment = selectedPayment === "all" || application.paymentStatus === selectedPayment;

    return matchesQuery && matchesStatus && matchesPayment;
  });
}

function rerenderQueue() {
  renderStats(cachedApplications);
  renderApplications(getFilteredApplications(), cachedApplications.length);
  renderAudit(cachedAudit);
}

async function adminFetch(path, options = {}) {
  const token = adminTokenInput.value.trim();
  if (!token) {
    throw new Error("Enter the admin token first.");
  }

  localStorage.setItem("dwb-admin-token", token);

  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": token,
      ...(options.headers || {}),
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || result.errors?.join(" ") || "Admin request failed.");
  }

  return result;
}

function renderStats(applications) {
  const coverageReview = applications.filter((item) => item.status === "COVERAGE_REVIEW").length;
  const approved = applications.filter((item) => item.status === "APPROVED_FOR_TRAVEL").length;
  const total = applications.reduce((sum, item) => sum + (item.costs?.total || 0), 0);

  adminStats.innerHTML = `
    <article>
      <strong>${applications.length}</strong>
      <span>Total applications</span>
    </article>
    <article>
      <strong>${coverageReview}</strong>
      <span>Coverage review</span>
    </article>
    <article>
      <strong>${approved}</strong>
      <span>Approved for travel</span>
    </article>
    <article>
      <strong>${adminMoney.format(total)}</strong>
      <span>Estimated coverage total</span>
    </article>
  `;
}

function renderApplications(applications, totalApplications = applications.length) {
  if (!totalApplications) {
    applicationList.innerHTML = `<div class="empty-state">No leave relief applications have been submitted yet.</div>`;
    return;
  }

  if (!applications.length) {
    applicationList.innerHTML = `<div class="empty-state">No applications match the current filters.</div>`;
    return;
  }

  applicationList.innerHTML = applications
    .map(
      (application) => `
        <article class="application-card" data-application-id="${application.id}">
          <div class="application-card-header">
            <div>
              <span class="status status-red">${escapeHtml(application.reference)}</span>
              <h3>${escapeHtml(application.doctor)}</h3>
              <p>${escapeHtml(application.roleLabel)} | ${escapeHtml(application.station)}</p>
              <div class="application-badges">
                <span class="status ${statusClass(application.status)}">${formatStatus(application.status)}</span>
                <span class="status status-teal">${formatStatus(application.paymentStatus)}</span>
              </div>
            </div>
            <div class="application-total">
              <strong>${adminMoney.format(application.costs.total)}</strong>
              <span>${application.days} days from ${escapeHtml(application.startDate)}</span>
            </div>
          </div>

          <div class="application-meta">
            <div>
              <span>Applicant</span>
              <strong>${escapeHtml(application.applicant)}</strong>
              <small>${escapeHtml(application.email)}</small>
            </div>
            <div>
              <span>Field pressure</span>
              <strong>${escapeHtml(application.zoneLabel)}</strong>
              <small>${application.travel ? "Travel coordination included" : "No travel coordination"}</small>
            </div>
            <div>
              <span>Submitted</span>
              <strong>${new Date(application.createdAt).toLocaleDateString()}</strong>
              <small>${new Date(application.createdAt).toLocaleTimeString()}</small>
            </div>
          </div>

          <div class="cost-panel compact-costs">
            <div><span>Coverage</span><strong>${adminMoney.format(application.costs.coverage)}</strong></div>
            <div><span>Handover</span><strong>${adminMoney.format(application.costs.handover)}</strong></div>
            <div><span>Travel</span><strong>${adminMoney.format(application.costs.travelCoordination)}</strong></div>
            <div><span>Reserve</span><strong>${adminMoney.format(application.costs.reserve)}</strong></div>
          </div>

          <div class="admin-controls">
            <label>
              Review status
              <select data-field="status">${optionHtml(statusOptions, application.status)}</select>
            </label>
            <label>
              Payment status
              <select data-field="paymentStatus">${optionHtml(paymentOptions, application.paymentStatus)}</select>
            </label>
          </div>

          <label>
            Operations notes
            <textarea data-field="adminNotes" rows="3" maxlength="1600" placeholder="Coverage match, payment notes, handover risks">${escapeHtml(application.adminNotes)}</textarea>
          </label>

          ${
            application.familyNotes
              ? `<div class="family-note"><span>Family notes</span><p>${escapeHtml(application.familyNotes)}</p></div>`
              : ""
          }

          <button class="button button-primary save-application" type="button">
            <i data-lucide="save"></i>
            Save review
          </button>
        </article>
      `,
    )
    .join("");

  window.lucide?.createIcons();
}

function renderAudit(audit) {
  if (!audit.length) {
    auditList.innerHTML = `<div class="empty-state">No audit events yet.</div>`;
    return;
  }

  auditList.innerHTML = audit
    .slice(0, 30)
    .map(
      (event) => `
        <article class="audit-event">
          <div>
            <strong>${escapeHtml(event.event)}</strong>
            <span>${escapeHtml(event.reference)} | ${escapeHtml(event.actor)}</span>
          </div>
          <time>${new Date(event.at).toLocaleString()}</time>
        </article>
      `,
    )
    .join("");
}

async function loadApplications() {
  setAdminStatus("Loading operations queue...");
  const result = await adminFetch("/api/leave-applications");
  cachedApplications = result.applications;
  cachedAudit = result.audit;
  rerenderQueue();
  setAdminStatus(`Loaded ${result.applications.length} application${result.applications.length === 1 ? "" : "s"}.`);
}

adminAuthForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await loadApplications();
  } catch (error) {
    setAdminStatus(error.message, true);
  }
});

[queueSearch, statusFilter, paymentFilter].forEach((control) => {
  control?.addEventListener("input", rerenderQueue);
  control?.addEventListener("change", rerenderQueue);
});

window.addEventListener("DOMContentLoaded", () => {
  if (!adminTokenInput?.value.trim()) {
    applicationList.innerHTML = `<div class="empty-state">Enter the admin token to load the operations queue.</div>`;
    auditList.innerHTML = `<div class="empty-state">Audit events will appear after authentication.</div>`;
    return;
  }

  loadApplications().catch((error) => {
    setAdminStatus(error.message, true);
    applicationList.innerHTML = `<div class="empty-state">Could not load the queue. Check the admin token and server.</div>`;
  });
});

refreshButton?.addEventListener("click", async () => {
  try {
    await loadApplications();
  } catch (error) {
    setAdminStatus(error.message, true);
  }
});

applicationList?.addEventListener("click", async (event) => {
  const button = event.target.closest(".save-application");
  if (!button) return;

  const card = button.closest(".application-card");
  const id = card.dataset.applicationId;
  const payload = {
    status: card.querySelector('[data-field="status"]').value,
    paymentStatus: card.querySelector('[data-field="paymentStatus"]').value,
    adminNotes: card.querySelector('[data-field="adminNotes"]').value,
  };

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    await adminFetch(`/api/leave-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await loadApplications();
    setAdminStatus("Application review saved.");
  } catch (error) {
    setAdminStatus(error.message, true);
  } finally {
    button.disabled = false;
    button.innerHTML = '<i data-lucide="save"></i> Save review';
    window.lucide?.createIcons();
  }
});
