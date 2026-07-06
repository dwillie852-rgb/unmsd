const adminMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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

function resetQueuePage() {
  currentQueuePage = 1;
}

function setFeeSettingsStatus(message, isError = false) {
  setStatus(feeSettingsStatus, message, isError);
}

function getPaginatedApplications(filtered) {
  const start = (currentQueuePage - 1) * queuePageSize;
  const end = start + queuePageSize;
  return filtered.slice(start, end);
}

function renderPagination(totalFiltered) {
  if (!queuePagination) return;
  const totalPages = Math.ceil(totalFiltered / queuePageSize) || 1;
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="button ${i === currentQueuePage ? 'button-primary' : 'button-secondary'}" data-page="${i}">${i}</button>`;
  }
  queuePagination.innerHTML = html;
  
  queuePagination.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentQueuePage = Number(e.target.dataset.page);
      rerenderQueue();
    });
  });
}

