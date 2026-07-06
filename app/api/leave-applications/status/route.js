import { NextResponse } from "next/server";
import { readDb } from "../../../../lib/db.js";
import { consumeRateLimit, safeEquals } from "../../../../lib/auth.js";
import { asTrimmedString } from "../../../../lib/validation.js";

function publicPaymentRequest(paymentRequest) {
  if (!paymentRequest) return null;
  return {
    id: paymentRequest.id,
    reference: paymentRequest.reference,
    amount: paymentRequest.amount,
    currency: paymentRequest.currency,
    status: paymentRequest.status,
    issuedAt: paymentRequest.issuedAt,
    expiresAt: paymentRequest.expiresAt,
    paidAt: paymentRequest.paidAt || null,
    methods: Array.isArray(paymentRequest.methods) ? paymentRequest.methods : [],
    settlementNote: paymentRequest.settlementNote || "",
    proof: paymentRequest.proof || null,
  };
}

function statusNextStep(status, paymentStatus) {
  if (status === "DECLINED") return "Operations could not clear the requested leave window. The team will share revised dates or refund guidance.";
  if (status === "REFUNDED") return "The refund pathway is active or complete for this request.";
  if (status === "CLOSED") return "This leave relief request is closed.";
  if (status === "APPROVED_FOR_TRAVEL") return "Leave is cleared for travel. Follow the movement and handover instructions from operations.";
  if (paymentStatus === "INVOICE_SENT") return "Complete the invoice payment so operations can finalize replacement cover.";
  if (paymentStatus === "PAID" && status === "COVERAGE_MATCHED") return "Replacement cover is matched. Operations is finalizing movement, handover, and travel clearance.";
  if (status === "PAYMENT_PENDING") return "Coverage planning is underway and payment confirmation is needed before travel clearance.";
  if (status === "COVERAGE_MATCHED") return "A replacement match is available. Operations is confirming payment and handover readiness.";
  if (status === "COVERAGE_REVIEW") return "The mission desk is checking caseload, safety, replacement fit, and handover requirements.";
  return "Your request has been received. Operations will review the mission details and contact the applicant.";
}

function publicStatus(application) {
  const stepOrder = ["RECEIVED", "COVERAGE_REVIEW", "COVERAGE_MATCHED", "PAYMENT_PENDING", "APPROVED_FOR_TRAVEL"];
  const currentIndex = stepOrder.includes(application.status) ? stepOrder.indexOf(application.status) : -1;

  return {
    reference: application.reference,
    status: application.status,
    paymentStatus: application.paymentStatus,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    startDate: application.startDate,
    days: application.days,
    estimatedCost: application.costs?.total || 0,
    costs: application.costs || null,
    paymentRequest: publicPaymentRequest(application.paymentRequest),
    nextStep: statusNextStep(application.status, application.paymentStatus),
    timeline: stepOrder.map((step, index) => ({
      key: step,
      complete: currentIndex > index || application.status === "APPROVED_FOR_TRAVEL",
      current: application.status === step,
    })),
  };
}

export async function POST(req) {
  const rate = consumeRateLimit(req, "status-lookup", 30, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many status checks. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  try {
    const payload = await req.json();
    const reference = asTrimmedString(payload.reference).toUpperCase();
    const email = asTrimmedString(payload.email).toLowerCase();
    const token = asTrimmedString(payload.token);

    if (!reference || (!token && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: "Enter the application reference and applicant email address, or a valid secure link." }, { status: 400 });
    }

    const db = await readDb();
    const application = db.applications.find((item) => {
      if (item.reference.toUpperCase() !== reference) return false;
      if (token) return safeEquals(token, item.dashboardToken);
      return item.email.toLowerCase() === email;
    });

    if (!application) {
      return NextResponse.json({ error: "No leave relief request matched that reference and email address." }, { status: 404 });
    }

    return NextResponse.json({ application: publicStatus(application) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Status could not be checked." }, { status: 400 });
  }
}
