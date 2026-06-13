const statusMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const statusLabels = {
  RECEIVED: "Received",
  COVERAGE_REVIEW: "Coverage review",
  COVERAGE_MATCHED: "Coverage matched",
  PAYMENT_PENDING: "Payment pending",
  APPROVED_FOR_TRAVEL: "Approved for travel",
  DECLINED: "Declined",
  REFUNDED: "Refunded",
  CLOSED: "Closed",
};

const statusForm = document.querySelector("#status-form");
const statusReference = document.querySelector("#status-reference");
const statusEmail = document.querySelector("#status-email");
const statusMessage = document.querySelector("#status-message");
const statusResult = document.querySelector("#status-result");

function escapeStatusHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelStatus(value) {
  return (
    statusLabels[value] ||
    String(value || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function statusClassName(status) {
  if (status === "APPROVED_FOR_TRAVEL" || status === "CLOSED") return "status-green";
  if (status === "COVERAGE_MATCHED") return "status-teal";
  if (status === "DECLINED" || status === "REFUNDED") return "status-gold";
  return "status-red";
}

function formatStatusDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderTimeline(timeline) {
  return `
    <div class="public-timeline" aria-label="Application progress">
      ${timeline
        .map(
          (step) => `
            <div class="${step.complete ? "is-complete" : ""} ${step.current ? "is-current" : ""}">
              <span aria-hidden="true"></span>
              <strong>${escapeStatusHtml(labelStatus(step.key))}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderStatusResult(application) {
  statusResult.innerHTML = `
    <article class="status-card">
      <div class="status-card-header">
        <div>
          <span class="status ${statusClassName(application.status)}">${escapeStatusHtml(labelStatus(application.status))}</span>
          <h2>${escapeStatusHtml(application.reference)}</h2>
          <p>${escapeStatusHtml(application.nextStep)}</p>
        </div>
        <div class="application-total">
          <strong>${statusMoney.format(application.estimatedCost)}</strong>
          <span>Estimated leave relief fee</span>
        </div>
      </div>

      ${renderTimeline(application.timeline || [])}

      <div class="application-meta status-meta">
        <div>
          <span>Requested leave</span>
          <strong>${application.days} days</strong>
          <small>From ${formatStatusDate(application.startDate)}</small>
        </div>
        <div>
          <span>Payment state</span>
          <strong>${escapeStatusHtml(labelStatus(application.paymentStatus))}</strong>
          <small>Payment updates may lag processor confirmation.</small>
        </div>
        <div>
          <span>Submitted</span>
          <strong>${formatStatusDate(application.createdAt)}</strong>
          <small>Last updated ${formatStatusDate(application.updatedAt)}</small>
        </div>
      </div>
    </article>
  `;

  window.lucide?.createIcons();
}

function setStatusMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}

statusForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatusMessage("");

  if (!statusForm.checkValidity()) {
    statusForm.reportValidity();
    return;
  }

  const submitButton = statusForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.dataset.originalHtml = submitButton.innerHTML;
  submitButton.textContent = "Checking...";

  try {
    const response = await fetch("/api/leave-applications/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        reference: statusReference.value.trim(),
        email: statusEmail.value.trim(),
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Status could not be checked.");
    }

    renderStatusResult(result.application);
    setStatusMessage("Application verified.");
  } catch (error) {
    statusResult.innerHTML = `<div class="empty-state">No status result is available for those details.</div>`;
    setStatusMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = submitButton.dataset.originalHtml || "Check status";
    window.lucide?.createIcons();
  }
});

const initialReference = new URLSearchParams(window.location.search).get("reference");
if (initialReference && statusReference) {
  statusReference.value = initialReference;
  statusEmail?.focus();
}

window.lucide?.createIcons();
