import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../../../lib/db.js";
import { requireAdmin } from "../../../lib/auth.js";
import { normalizeFeeSettings, validateFeeSettings } from "../../../lib/validation.js";

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

export async function GET(req) {
  const db = await readDb();
  return NextResponse.json({ feeSettings: publicFeeSettings(db.feeSettings) });
}

export async function PATCH(req) {
  const { session, errorResponse } = requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const payload = await req.json();
    const { errors, settings } = validateFeeSettings(payload.feeSettings || payload, session.name);

    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const db = await readDb();
    const before = publicFeeSettings(db.feeSettings);
    db.feeSettings = settings;
    db.audit.unshift({
      id: randomUUID(),
      applicationId: null,
      reference: "FEE-SETTINGS",
      event: "FEE_SETTINGS_UPDATED",
      at: settings.updatedAt,
      actor: session.name,
      details: { before, after: publicFeeSettings(settings) },
    });

    await writeDb(db);
    return NextResponse.json({ feeSettings: publicFeeSettings(settings), audit: db.audit.slice(0, 100) });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Fee settings could not be updated." }, { status: 400 });
  }
}
