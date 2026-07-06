import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../../../../../lib/db.js";
import { requireAdmin } from "../../../../../lib/auth.js";
import { sendNotificationEmail } from "../../../../../lib/email.js";
import { asTrimmedString, normalizePaymentSettings } from "../../../../../lib/validation.js";

function publicPaymentMethods(settings) {
  const normalized = normalizePaymentSettings(settings);
  return Object.entries(normalized.methods)
    .filter(([, method]) => method.enabled)
    .map(([key, method]) => {
      if (key === "crypto") {
        return {
          key, label: method.label, settlement: method.settlement, instructions: method.instructions,
          assets: method.assets.map((asset) => ({ asset: asTrimmedString(asset.asset), network: asTrimmedString(asset.network), address: asTrimmedString(asset.address) })),
        };
      }
      return {
        key, label: method.label, provider: method.provider, checkoutUrl: method.checkoutUrl,
        accountName: method.accountName, bankName: method.bankName, accountNumber: method.accountNumber,
        iban: method.iban, swift: method.swift, providers: method.providers, contact: method.contact, instructions: method.instructions,
      };
    });
}

function publicPaymentRequest(paymentRequest) {
  if (!paymentRequest) return null;
  return {
    id: paymentRequest.id, reference: paymentRequest.reference, amount: paymentRequest.amount,
    currency: paymentRequest.currency, status: paymentRequest.status, issuedAt: paymentRequest.issuedAt,
    expiresAt: paymentRequest.expiresAt, paidAt: paymentRequest.paidAt || null,
    methods: Array.isArray(paymentRequest.methods) ? paymentRequest.methods : [], settlementNote: paymentRequest.settlementNote || "",
  };
}

function createPaymentRequest(application, settings) {
  const normalized = normalizePaymentSettings(settings);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + normalized.expiryDays * 86_400_000);

  return {
    id: randomUUID(),
    reference: `${application.reference}-PAY`,
    amount: application.costs?.total || 0,
    currency: normalized.currency,
    status: "OPEN",
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    paidAt: null,
    methods: publicPaymentMethods(normalized),
    settlementNote: normalized.settlementNote,
  };
}

export async function POST(req, { params }) {
  const { session, errorResponse } = requireAdmin(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  try {
    const db = await readDb();
    const application = db.applications.find((item) => item.id === id);

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const before = {
      status: application.status,
      paymentStatus: application.paymentStatus,
      paymentRequest: publicPaymentRequest(application.paymentRequest),
    };
    const paymentRequest = createPaymentRequest(application, db.paymentSettings);

    application.paymentRequest = paymentRequest;
    application.paymentStatus = "INVOICE_SENT";
    if (["RECEIVED", "COVERAGE_REVIEW", "COVERAGE_MATCHED"].includes(application.status)) {
      application.status = "PAYMENT_PENDING";
    }
    application.updatedAt = paymentRequest.issuedAt;

    db.audit.unshift({
      id: randomUUID(),
      applicationId: application.id,
      reference: application.reference,
      event: "PAYMENT_REQUEST_ISSUED",
      at: paymentRequest.issuedAt,
      actor: session.name,
      details: { before, after: { status: application.status, paymentStatus: application.paymentStatus, paymentRequest: publicPaymentRequest(application.paymentRequest) } },
    });

    await writeDb(db);
    await sendNotificationEmail(application, "MILESTONE");
    return NextResponse.json({ application, audit: db.audit.slice(0, 100) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Payment request could not be issued." }, { status: 400 });
  }
}
