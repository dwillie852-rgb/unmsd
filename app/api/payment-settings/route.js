import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../../lib/db.js";
import { requireAdmin } from "../../../lib/auth.js";
import { validatePaymentSettings } from "../../../lib/validation.js";

export async function GET(req) {
  const { errorResponse } = requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const db = await readDb();
    return NextResponse.json({ paymentSettings: db.paymentSettings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load payment settings." }, { status: 500 });
  }
}

export async function PATCH(req) {
  const { session, errorResponse } = requireAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const payload = await req.json();
    const { errors, settings } = validatePaymentSettings(payload);

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const db = await readDb();
    db.paymentSettings = settings;
    await writeDb(db);

    return NextResponse.json({ paymentSettings: db.paymentSettings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment settings." }, { status: 400 });
  }
}
