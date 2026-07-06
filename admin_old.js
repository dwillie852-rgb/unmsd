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

const statusSteps = ["RECEIVED", "COVERAGE_REVIEW", "COVERAGE_MATCHED", "PAYMENT_PENDING", "APPROVED_FOR_TRAVEL"];

const statusProgress = {
  RECEIVED: 20,
  COVERAGE_REVIEW: 40,
  COVERAGE_MATCHED: 60,
  PAYMENT_PENDING: 75,
  APPROVED_FOR_TRAVEL: 100,
  DECLINED: 100,
  REFUNDED: 100,
  CLOSED: 100,
};

const adminAuthForm = document.querySelector("#admin-auth");
const adminTokenInput = document.querySelector("#admin-token");
const adminSessionPanel = document.querySelector("#admin-session");
const adminConsole = document.querySelector("#admin-console");
const authStatus = document.querySelector("#auth-status");
const logoutButton = document.querySelector("#admin-logout");
const sessionUser = document.querySelector("#session-user");
const sessionRole = document.querySelector("#session-role");
const sessionExpiry = document.querySelector("#session-expiry");
const refreshButton = document.querySelector("#refresh-applications");
const adminStatus = document.querySelector("#admin-status");
const applicationList = document.querySelector("#application-list");
const auditList = document.querySelector("#audit-list");
const adminStats = document.querySelector("#admin-stats");
const queueSearch = document.querySelector("#queue-search");
const statusFilter = document.querySelector("#status-filter");
const paymentFilter = document.querySelector("#payment-filter");
const sortFilter = document.querySelector("#sort-filter");
const quickFilterButtons = document.querySelectorAll("[data-quick-filter]");

let cachedApplications = [];
let cachedAudit = [];
let activeQuickFilter = "all";
let adminSession = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function optionHtml(options, selected) {
  return options
    .map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${formatStatus(option)}</option>`)
    .join("");
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function setAdminStatus(message, isError = false) {
  setStatus(adminStatus, message, isError);
}

function setAuthStatus(message, isError = false) {
  setStatus(authStatus, message, isError);
}

function statusClass(status) {
  if (status === "APPROVED_FOR_TRAVEL" || status === "CLOSED") return "status-green";
  if (status === "COVERAGE_MATCHED") return "status-teal";
  if (status === "DECLINED" || status === "REFUNDED") return "status-gold";
  return "status-red";
}

function paymentClass(paymentStatus) {
  if (paymentStatus === "PAID" || paymentStatus === "WAIVED") return "status-green";
  if (paymentStatus === "INVOICE_SENT") return "status-gold";
  if (paymentStatus === "REFUNDED") return "status-teal";
  return "status-red";
}

function progressClass(status) {
  return `progress-${statusProgress[status] || 20}`;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  const diff = Math.round((target - today) / 86_400_000);
  return Number.isFinite(diff) ? diff : null;
}

function urgencyLabel(application) {
  if (["APPROVED_FOR_TRAVEL", "DECLINED", "REFUNDED", "CLOSED"].includes(application.status)) {
    return { label: formatStatus(application.status), className: "urgency-neutral" };
  }

  const days = daysUntil(application.startDate);
  if (days !== null && days <= 3) return { label: "Critical window", className: "urgency-high" };
  if (application.status === "PAYMENT_PENDING" || application.paymentStatus === "INVOICE_SENT") {
    return { label: "Payment needed", className: "urgency-medium" };
  }
  if (application.status === "RECEIVED" || application.status === "COVERAGE_REVIEW") {
    return { label: "Coverage action", className: "urgency-high" };
  }

  return { label: "On track", className: "urgency-low" };
}

function isActionNeeded(application) {
  return ["RECEIVED", "COVERAGE_REVIEW", "PAYMENT_PENDING"].includes(application.status);
}

function isPaymentOpen(application) {
  return ["NOT_REQUESTED", "INVOICE_SENT"].includes(application.paymentStatus) && !["DECLINED", "REFUNDED", "CLOSED"].includes(application.status);
}

function isTravelReady(application) {
  return application.status === "APPROVED_FOR_TRAVEL" || (application.status === "COVERAGE_MATCHED" && ["PAID", "WAIVED"].includes(application.paymentStatus));
}

function matchesQuickFilter(application) {
  if (activeQuickFilter === "action") return isActionNeeded(application);
  if (activeQuickFilter === "payment") return isPaymentOpen(application);
  if (activeQuickFilter === "travel") return isTravelReady(application);
  return true;
}

function getFilteredApplications() {
  const query = queueSearch.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedPayment = paymentFilter.value;

  const filtered = cachedApplications.filter((application) => {
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

    return matchesQuery && matchesStatus && matchesPayment && matchesQuickFilter(application);
  });

  return filtered.sort((a, b) => {
    if (sortFilter.value === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortFilter.value === "startDate") return new Date(`${a.startDate}T00:00:00`) - new Date(`${b.startDate}T00:00:00`);
    if (sortFilter.value === "highestCost") return (b.costs?.total || 0) - (a.costs?.total || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function showSignedOut(message = "Sign in to continue.", isError = false) {
  adminSession = null;
  adminAuthForm.hidden = false;
  adminSessionPanel.hidden = true;
  adminConsole.hidden = true;
  cachedApplications = [];
  cachedAudit = [];
  applicationList.innerHTML = `<div class="empty-state">Sign in to load the operations queue.</div>`;
  auditList.innerHTML = `<div class="empty-state">Audit events will appear after authentication.</div>`;
  setAdminStatus("");
  setAuthStatus(message, isError);
}

function showSignedIn(session) {
  adminSession = session;
  adminAuthForm.hidden = true;
  adminSessionPanel.hidden = false;
  adminConsole.hidden = false;
  sessionUser.textContent = session.admin?.name || "Operations admin";
  sessionRole.textContent = session.admin?.role || "Leave relief operations";
  sessionExpiry.textContent = formatDateTime(session.expiresAt);
  setAuthStatus("Secure session active.");
}

async function readJsonResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.errors?.join(" ") || "Request failed.");
  }
  return result;
}

async function adminFetch(path, options = {}) {
  if (!adminSession?.csrfToken) {
    throw new Error("Sign in to the operations dashboard first.");
  }

  const headers = {
    Accept: "application/json",
    "X-CSRF-Token": adminSession.csrfToken,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  try {
    return await readJsonResponse(response);
  } catch (error) {
    if (response.status === 401 || response.status === 403) {
      showSignedOut(error.message, true);
    }
    throw error;
  }
}

async function signIn(token) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ token }),
  });

  return readJsonResponse(response);
}

async function checkSession() {
  const response = await fetch("/api/admin/session", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;
  return response.json();
}

function renderStats(applications) {
  const needsAction = applications.filter(isActionNeeded).length;
  const travelReady = applications.filter(isTravelReady).length;
  const paidOrEstimated = applications.reduce((sum, item) => sum + (item.costs?.total || 0), 0);

  adminStats.innerHTML = `
    <article>
      <strong>${applications.length}</strong>
      <span>Total applications</span>
    </article>
    <article>
      <strong>${needsAction}</strong>
      <span>Needs action</span>
    </article>
    <article>
      <strong>${travelReady}</strong>
      <span>Travel ready</span>
    </article>
    <article>
      <strong>${adminMoney.format(paidOrEstimated)}</strong>
      <span>Paid or estimated fees</span>
    </article>
  `;
}

function renderChecklist(application) {
  const coverageDone = statusSteps.indexOf(application.status) >= statusSteps.indexOf("COVERAGE_MATCHED");
  const paymentDone = ["PAID", "WAIVED"].includes(application.paymentStatus);
  const travelDone = application.status === "APPROVED_FOR_TRAVEL" || application.status === "CLOSED";
  const closedDone = ["APPROVED_FOR_TRAVEL", "CLOSED"].includes(application.status);

  return `
    <div class="ops-checklist" aria-label="Operational readiness">
      <span class="${coverageDone ? "is-done" : ""}"><i data-lucide="${coverageDone ? "check" : "circle"}"></i> Coverage</span>
      <span class="${paymentDone ? "is-done" : ""}"><i data-lucide="${paymentDone ? "check" : "circle"}"></i> Payment</span>
      <span class="${travelDone ? "is-done" : ""}"><i data-lucide="${travelDone ? "check" : "circle"}"></i> Movement</span>
      <span class="${closedDone ? "is-done" : ""}"><i data-lucide="${closedDone ? "check" : "circle"}"></i> Handover</span>
    </div>
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
    .map((application) => {
      const urgency = urgencyLabel(application);
      const submitted = `${formatDate(application.createdAt)} at ${new Date(application.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const leaveWindow = `${application.days} days from ${formatDate(application.startDate)}`;

      return `
        <article class="application-card" data-application-id="${application.id}">
          <div class="application-card-header">
            <div>
              <div class="reference-row">
                <span class="status status-red">${escapeHtml(application.reference)}</span>
                <span class="urgency-pill ${urgency.className}">${escapeHtml(urgency.label)}</span>
              </div>
              <h3>${escapeHtml(application.doctor)}</h3>
              <p>${escapeHtml(application.roleLabel)} | ${escapeHtml(application.station)}</p>
              <div class="application-badges">
                <span class="status ${statusClass(application.status)}">${formatStatus(application.status)}</span>
                <span class="status ${paymentClass(application.paymentStatus)}">${formatStatus(application.paymentStatus)}</span>
              </div>
            </div>
            <div class="application-total">
              <strong>${adminMoney.format(application.costs.total)}</strong>
              <span>${escapeHtml(leaveWindow)}</span>
            </div>
          </div>

          <div class="progress-track" aria-label="Application progress">
            <span class="progress-fill ${progressClass(application.status)}"></span>
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
              <strong>${escapeHtml(submitted)}</strong>
              <small>Updated ${formatDateTime(application.updatedAt)}</small>
            </div>
            <div>
              <span>Coverage estimate</span>
              <strong>${adminMoney.format(application.costs.coverage)}</strong>
              <small>Reserve ${adminMoney.format(application.costs.reserve)}</small>
            </div>
          </div>

          ${renderChecklist(application)}

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

          <label class="notes-field">
            Operations notes
            <textarea data-field="adminNotes" rows="3" maxlength="1600" placeholder="Coverage match, payment notes, handover risks">${escapeHtml(application.adminNotes)}</textarea>
          </label>

          ${
            application.familyNotes
              ? `<details class="family-note"><summary>Family context</summary><p>${escapeHtml(application.familyNotes)}</p></details>`
              : ""
          }

          <div class="card-actions">
            <button class="button button-primary save-application" type="button">
              <i data-lucide="save"></i>
              Save review
            </button>
          </div>
        </article>
      `;
    })
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
          <span class="audit-icon" aria-hidden="true"><i data-lucide="${event.event === "APPLICATION_UPDATED" ? "file-pen-line" : "inbox"}"></i></span>
          <div>
            <strong>${formatStatus(event.event)}</strong>
            <span>${escapeHtml(event.reference)} | ${escapeHtml(event.actor)}</span>
          </div>
          <time>${formatDateTime(event.at)}</time>
        </article>
      `,
    )
    .join("");

  window.lucide?.createIcons();
}

function rerenderQueue() {
  renderStats(cachedApplications);
  renderApplications(getFilteredApplications(), cachedApplications.length);
  renderAudit(cachedAudit);
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
  const submitButton = adminAuthForm.querySelector('button[type="submit"]');
  const token = adminTokenInput.value.trim();
  if (!token) {
    setAuthStatus("Enter the admin token.", true);
    return;
  }

  submitButton.disabled = true;
  submitButton.dataset.originalHtml = submitButton.innerHTML;
  submitButton.textContent = "Signing in...";
  setAuthStatus("Checking credentials...");

  try {
    const session = await signIn(token);
    adminTokenInput.value = "";
    localStorage.removeItem("dwb-admin-token");
    showSignedIn(session);
    await loadApplications();
  } catch (error) {
    showSignedOut(error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = submitButton.dataset.originalHtml || "Sign in";
    window.lucide?.createIcons();
  }
});

[queueSearch, statusFilter, paymentFilter, sortFilter].forEach((control) => {
  control?.addEventListener("input", rerenderQueue);
  control?.addEventListener("change", rerenderQueue);
});

quickFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeQuickFilter = button.dataset.quickFilter;
    quickFilterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    rerenderQueue();
  });
});

refreshButton?.addEventListener("click", async () => {
  refreshButton.disabled = true;
  try {
    await loadApplications();
  } catch (error) {
    setAdminStatus(error.message, true);
  } finally {
    refreshButton.disabled = false;
  }
});

logoutButton?.addEventListener("click", async () => {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(adminSession?.csrfToken ? { "X-CSRF-Token": adminSession.csrfToken } : {}),
      },
    });
  } finally {
    showSignedOut("Signed out.");
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
  button.dataset.originalHtml = button.innerHTML;
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
    button.innerHTML = button.dataset.originalHtml || '<i data-lucide="save"></i> Save review';
    window.lucide?.createIcons();
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  localStorage.removeItem("dwb-admin-token");
  showSignedOut("Checking for an active session...");

  try {
    const session = await checkSession();
    if (!session) {
      showSignedOut("Sign in to open the operations queue.");
      return;
    }

    showSignedIn(session);
    await loadApplications();
  } catch (error) {
    showSignedOut(error.message, true);
  } finally {
    window.lucide?.createIcons();
  }
});
