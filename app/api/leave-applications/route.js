import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../../../lib/db.js";
import { consumeRateLimit, randomToken, requireAdmin } from "../../../lib/auth.js";
import { sendNotificationEmail } from "../../../lib/email.js";
import { validateApplication, calculateCost, normalizeFeeSettings } from "../../../lib/validation.js";

function publicFeeSettings(settings) {
  const normalized = normalizeFeeSettings(settings);
  return {
    roleRates: normalized.roleRates,
    zoneMultipliers: normalized.zoneMultipliers,
    handover: normalized.handover,
    travelCoordination: normalized.travelCoordination,
    reservePercent: normalized.reservePercent,
    updatedAt: normalized.updatedAt,
  };
}

function makeReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `DWB-LR-${date}-${suffix}`;
}

function publicApplication(application) {
  return {
    id: application.id,
    reference: application.reference,
    status: application.status,
    paymentStatus: application.paymentStatus,
    createdAt: application.createdAt,
    costs: application.costs,
  };
}

export async function POST(req) {
  const rate = consumeRateLimit(req, "create-app", 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ errors: ["Too many applications submitted. Please try again later."] }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }
  try {
    const payload = await req.json();
    const db = await readDb();
    const { errors, data } = validateApplication(payload, db.feeSettings);

    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const now = new Date().toISOString();
    const application = {
      id: randomUUID(),
      reference: makeReference(),
      dashboardToken: randomToken(16),
      ...data,
      costs: calculateCost(data, db.feeSettings),
      feeSettingsSnapshot: publicFeeSettings(db.feeSettings),
      status: "RECEIVED",
      paymentStatus: "NOT_REQUESTED",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    };

    db.applications.unshift(application);
    db.audit.unshift({
      id: randomUUID(),
      applicationId: application.id,
      reference: application.reference,
      event: "APPLICATION_RECEIVED",
      at: now,
      actor: "public-form",
      details: {
        status: application.status,
        paymentStatus: application.paymentStatus,
        total: application.costs.total,
      },
    });
    await writeDb(db);
    await sendNotificationEmail(application, "REGISTRATION");

    return NextResponse.json({ application: publicApplication(application), dashboardToken: application.dashboardToken }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ errors: [error.message || "Application could not be processed."] }, { status: 400 });
  }
}

export async function GET(req) {
  const { session, errorResponse } = requireAdmin(req);
  if (errorResponse) return errorResponse;
  
  const db = await readDb();
  return NextResponse.json({
    applications: db.applications.map(({ dashboardToken, ...rest }) => rest),
    audit: db.audit.slice(0, 100),
  });
}
