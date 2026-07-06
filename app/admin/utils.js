export const statusOptions = [
  "RECEIVED",
  "COVERAGE_REVIEW",
  "COVERAGE_MATCHED",
  "PAYMENT_PENDING",
  "APPROVED_FOR_TRAVEL",
  "DECLINED",
  "REFUNDED",
  "CLOSED",
];

export const paymentOptions = ["NOT_REQUESTED", "INVOICE_SENT", "PAID", "REFUNDED", "WAIVED"];

export const statusSteps = ["RECEIVED", "COVERAGE_REVIEW", "COVERAGE_MATCHED", "PAYMENT_PENDING", "APPROVED_FOR_TRAVEL"];

export const statusProgress = {
  RECEIVED: 20,
  COVERAGE_REVIEW: 40,
  COVERAGE_MATCHED: 60,
  PAYMENT_PENDING: 75,
  APPROVED_FOR_TRAVEL: 100,
  DECLINED: 100,
  REFUNDED: 100,
  CLOSED: 100,
};

export const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  return moneyFormatter.format(value || 0);
}

export function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusClass(status) {
  if (status === "APPROVED_FOR_TRAVEL" || status === "CLOSED") return "statusGreen";
  if (status === "COVERAGE_MATCHED") return "statusTeal";
  if (status === "DECLINED" || status === "REFUNDED") return "statusGold";
  return "statusRed";
}

export function paymentClass(paymentStatus) {
  if (paymentStatus === "PAID" || paymentStatus === "WAIVED") return "statusGreen";
  if (paymentStatus === "INVOICE_SENT") return "statusGold";
  if (paymentStatus === "REFUNDED") return "statusTeal";
  return "statusRed";
}

export function progressClass(status) {
  return `progress${statusProgress[status] || 20}`;
}

export function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  const diff = Math.round((target - today) / 86_400_000);
  return Number.isFinite(diff) ? diff : null;
}

export function urgencyLabel(application) {
  if (["APPROVED_FOR_TRAVEL", "DECLINED", "REFUNDED", "CLOSED"].includes(application.status)) {
    return { label: formatStatus(application.status), className: "urgencyNeutral" };
  }

  const days = daysUntil(application.startDate);
  if (days !== null && days <= 3) return { label: "Critical window", className: "urgencyHigh" };
  if (application.status === "PAYMENT_PENDING" || application.paymentStatus === "INVOICE_SENT") {
    return { label: "Payment needed", className: "urgencyMedium" };
  }
  if (application.status === "RECEIVED" || application.status === "COVERAGE_REVIEW") {
    return { label: "Coverage action", className: "urgencyHigh" };
  }

  return { label: "On track", className: "urgencyLow" };
}

export function isActionNeeded(application) {
  return ["RECEIVED", "COVERAGE_REVIEW", "PAYMENT_PENDING"].includes(application.status);
}

export function isPaymentOpen(application) {
  return ["NOT_REQUESTED", "INVOICE_SENT"].includes(application.paymentStatus) && !["DECLINED", "REFUNDED", "CLOSED"].includes(application.status);
}

export function isTravelReady(application) {
  return application.status === "APPROVED_FOR_TRAVEL" || (application.status === "COVERAGE_MATCHED" && ["PAID", "WAIVED"].includes(application.paymentStatus));
}

export function matchesQuickFilter(application, activeQuickFilter) {
  if (activeQuickFilter === "action") return isActionNeeded(application);
  if (activeQuickFilter === "payment") return isPaymentOpen(application);
  if (activeQuickFilter === "travel") return isTravelReady(application);
  return true;
}

export function getFilteredApplications(applications, { query, statusFilter, paymentFilter, quickFilter, sortFilter }) {
  const q = query.trim().toLowerCase();

  const filtered = applications.filter((application) => {
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

    const matchesQuery = !q || haystack.includes(q);
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || application.paymentStatus === paymentFilter;

    return matchesQuery && matchesStatus && matchesPayment && matchesQuickFilter(application, quickFilter);
  });

  return filtered.sort((a, b) => {
    if (sortFilter === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortFilter === "startDate") return new Date(`${a.startDate}T00:00:00`) - new Date(`${b.startDate}T00:00:00`);
    if (sortFilter === "highestCost") return (b.costs?.total || 0) - (a.costs?.total || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}
