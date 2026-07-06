

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





function statusClassName(status) {
  if (status === "APPROVED_FOR_TRAVEL" || status === "CLOSED") return "status-green";
  if (status === "COVERAGE_MATCHED") return "status-teal";
  if (status === "DECLINED" || status === "REFUNDED") return "status-gold";
  return "status-red";
}

function renderTimeline(timeline) {
  return `
    <div class="public-timeline" aria-label="Application progress">
      ${timeline
        .map(
          (step) => `
            <div class="${step.complete ? "is-complete" : ""} ${step.current ? "is-current" : ""}">
              <span aria-hidden="true"></span>
              <strong>${escapeHtml(formatStatus(step.key))}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPaymentDetail(label, value) {
  if (!value) return "";
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderPublicPaymentMethod(method) {
  const details =
    method.key === "crypto"
      ? `
        <div class="payment-method-assets">
          ${(method.assets || [])
            .map(
              (asset) => `
                <div>
                  <span>${escapeHtml(asset.asset)} / ${escapeHtml(asset.network)}</span>
                  <strong>${escapeHtml(asset.address)}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      `
      : `
        <div class="payment-method-fields">
          ${renderPaymentDetail("Provider", method.provider)}
          ${renderPaymentDetail("Checkout", method.checkoutUrl)}
          ${renderPaymentDetail("Account", method.accountName)}
          ${renderPaymentDetail("Bank", method.bankName)}
          ${renderPaymentDetail("IBAN", method.iban)}
          ${renderPaymentDetail("SWIFT", method.swift)}
          ${renderPaymentDetail("Mobile routes", method.providers)}
          ${renderPaymentDetail("Contact", method.contact)}
        </div>
      `;

  return `
    <article class="payment-method-card">
      <span class="status status-teal">${escapeHtml(method.key)}</span>
      <h3>${escapeHtml(method.label)}</h3>
      <p>${escapeHtml(method.instructions || method.settlement || "")}</p>
      ${details}
    </article>
  `;
}

function renderPublicPaymentRequest(paymentRequest) {
  if (!paymentRequest) return "";

  return `
    <section class="payment-request-panel public-payment-panel" aria-label="Payment request">
      <div class="payment-request-header">
        <div>
          <span>Payment reference</span>
          <strong>${escapeHtml(paymentRequest.reference)}</strong>
          <small>${escapeHtml(paymentRequest.status)} | Expires ${formatDate(paymentRequest.expiresAt)}</small>
        </div>
        <div class="application-total">
          <strong>${formatMoney(paymentRequest.amount)}</strong>
          <span>${escapeHtml(paymentRequest.currency)}</span>
        </div>
      </div>
      <p>${escapeHtml(paymentRequest.settlementNote || "")}</p>
      <div class="payment-method-grid">
        ${(paymentRequest.methods || []).map(renderPublicPaymentMethod).join("")}
      </div>
    </section>
  `;
}

function renderCostBreakdown(costs) {
  if (!costs) return "";
  return `
    <div class="cost-panel status-cost-panel" aria-label="Detailed fee breakdown">
      <div>
        <span>Replacement coverage</span>
        <strong>${formatMoney(costs.coverage)}</strong>
      </div>
      <div>
        <span>Handover and onboarding</span>
        <strong>${formatMoney(costs.handover)}</strong>
      </div>
      <div>
        <span>Travel coordination</span>
        <strong>${formatMoney(costs.travelCoordination)}</strong>
      </div>
      <div>
        <span>Operations reserve</span>
        <strong>${formatMoney(costs.reserve)}</strong>
      </div>
    </div>
  `;
}

function renderStatusResult(application) {
  statusResult.innerHTML = `
    <article class="status-card">
      <div class="status-card-header">
        <div>
          <span class="status ${statusClassName(application.status)}">${escapeHtml(formatStatus(application.status))}</span>
          <h2>${escapeHtml(application.reference)}</h2>
          <p>${escapeHtml(application.nextStep)}</p>
        </div>
        <div class="application-total">
          <strong>${formatMoney(application.estimatedCost)}</strong>
          <span>Estimated leave relief fee</span>
        </div>
      </div>

      ${renderTimeline(application.timeline || [])}

      <div class="application-meta status-meta">
        <div>
          <span>Requested leave</span>
          <strong>${application.days} days</strong>
          <small>From ${formatDate(application.startDate)}</small>
        </div>
        <div>
          <span>Payment state</span>
          <strong>${escapeHtml(formatStatus(application.paymentStatus))}</strong>
          <small>Payment updates may lag processor confirmation.</small>
        </div>
        <div>
          <span>Submitted</span>
          <strong>${formatDate(application.createdAt)}</strong>
          <small>Last updated ${formatDate(application.updatedAt)}</small>
        </div>
      </div>
      
      ${renderCostBreakdown(application.costs)}

      ${renderPublicPaymentRequest(application.paymentRequest)}
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

const urlParams = new URLSearchParams(window.location.search);
const initialReference = urlParams.get("reference") || urlParams.get("ref");
const initialToken = urlParams.get("token");

async function autoFetchStatus(ref, token) {
  statusResult.innerHTML = `<div class="empty-state">Loading your dashboard...</div>`;
  try {
    const response = await fetch("/api/leave-applications/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ reference: ref, token: token }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Status could not be checked.");
    }

    renderStatusResult(result.application);
  } catch (error) {
    if (statusForm) statusForm.hidden = false;
    if (statusReference) statusReference.value = ref;
    statusResult.innerHTML = `<div class="empty-state">No status result is available for those details.</div>`;
    setStatusMessage(error.message, true);
  }
}

if (initialReference && initialToken) {
  if (statusForm) statusForm.hidden = true;
  autoFetchStatus(initialReference, initialToken);
} else if (initialReference && statusReference) {
  statusReference.value = initialReference;
  statusEmail?.focus();
}

window.lucide?.createIcons();
