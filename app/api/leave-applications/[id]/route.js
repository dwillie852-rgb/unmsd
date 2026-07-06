import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../../../../lib/db.js";
import { requireAdmin } from "../../../../lib/auth.js";
import { sendNotificationEmail } from "../../../../lib/email.js";
import { asTrimmedString } from "../../../../lib/validation.js";
import { statuses, paymentStatuses } from "../../../../lib/config.js";

export async function PATCH(req, { params }) {
  const { session, errorResponse } = requireAdmin(req);
  if (errorResponse) return errorResponse;
  
  const { id } = await params;
  try {
    const payload = await req.json();
    const db = await readDb();
    const application = db.applications.find((item) => item.id === id);

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const nextStatus = asTrimmedString(payload.status);
    const nextPaymentStatus = asTrimmedString(payload.paymentStatus);
    const adminNotes = asTrimmedString(payload.adminNotes).slice(0, 1600);

    if (nextStatus && !statuses.has(nextStatus)) {
      return NextResponse.json({ error: "Status is invalid." }, { status: 400 });
    }
    if (nextPaymentStatus && !paymentStatuses.has(nextPaymentStatus)) {
      return NextResponse.json({ error: "Payment status is invalid." }, { status: 400 });
    }

    const before = { status: application.status, paymentStatus: application.paymentStatus, adminNotes: application.adminNotes };

    if (nextStatus) application.status = nextStatus;
    if (nextPaymentStatus) {
      application.paymentStatus = nextPaymentStatus;
      if (application.paymentRequest) {
        if (nextPaymentStatus === "PAID") {
          application.paymentRequest.status = "PAID";
          application.paymentRequest.paidAt = new Date().toISOString();
        } else if (nextPaymentStatus === "REFUNDED") {
          application.paymentRequest.status = "REFUNDED";
        } else if (nextPaymentStatus === "WAIVED") {
          application.paymentRequest.status = "WAIVED";
        } else if (nextPaymentStatus === "INVOICE_SENT") {
          application.paymentRequest.status = "OPEN";
          application.paymentRequest.paidAt = null;
        }
      }
    }
    application.adminNotes = adminNotes;
    application.updatedAt = new Date().toISOString();

    db.audit.unshift({
      id: randomUUID(),
      applicationId: application.id,
      reference: application.reference,
      event: "APPLICATION_UPDATED",
      at: application.updatedAt,
      actor: session.name,
      details: { before, after: { status: application.status, paymentStatus: application.paymentStatus, adminNotes: application.adminNotes } },
    });

    await writeDb(db);
    if (nextStatus || nextPaymentStatus) {
      await sendNotificationEmail(application, "MILESTONE");
    }
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Application could not be updated." }, { status: 400 });
  }
}
