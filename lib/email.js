import { Resend } from "resend";
import { escapeHtml } from "./validation.js";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendNotificationEmail(application, eventType) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Email for event ${eventType} would be sent to ${application.email} and ${application.doctorEmail}`);
    return;
  }

  let subject = "";
  let headline = "";
  let messageBody = "";
  
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const cost = formatter.format(application.costs?.total || 0);

  if (eventType === "REGISTRATION") {
    subject = `Leave Relief Application Received - ${application.reference}`;
    headline = "Application Received";
    messageBody = `
      <p>Hello ${escapeHtml(application.applicant)},</p>
      <p>Your leave relief request for <strong>${escapeHtml(application.doctor)}</strong> at <strong>${escapeHtml(application.station)}</strong> has been securely received by operations.</p>
      <p>The estimated application cost is <strong>${cost}</strong>.</p>
      <p>Operations will review the mission caseload, security protocols, and replacement fit before proceeding. You can track the status of this application at any time using your reference number and email address.</p>
      <div style="margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/staff/leave-relief/status?ref=${encodeURIComponent(application.reference)}&token=${encodeURIComponent(application.dashboardToken || "")}" style="background-color: #418FDE; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Track Application Status</a>
      </div>
    `;
  } else if (eventType === "MILESTONE") {
    subject = `Leave Relief Update - ${application.reference}`;
    headline = "Application Update";
    
    let specificMessage = `<p>There is an update on the leave application for ${escapeHtml(application.doctor)}.</p>`;
    
    if (application.status === "DECLINED") {
      specificMessage = `<p>Operations could not clear the requested leave window for ${escapeHtml(application.doctor)}. The desk team will reach out directly with revised dates or refund guidance.</p>`;
    } else if (application.status === "REFUNDED" || application.paymentStatus === "REFUNDED") {
      specificMessage = `<p>The refund pathway for this request is now active or completed.</p>`;
    } else if (application.status === "CLOSED") {
      specificMessage = `<p>This leave relief request has been closed.</p>`;
    } else if (application.status === "APPROVED_FOR_TRAVEL") {
      specificMessage = `<p>Leave is officially cleared for travel! Please follow the movement and handover instructions provided by operations directly.</p>`;
    } else if (application.paymentStatus === "PAID") {
      specificMessage = `<p>Payment has been received. Operations is now finalizing the movement, handover, and travel clearance.</p>`;
    } else if (application.paymentStatus === "INVOICE_SENT") {
      specificMessage = `<p>An invoice has been generated for the leave relief request. Please complete the payment of <strong>${cost}</strong> so operations can finalize replacement cover.</p>`;
    } else if (application.status === "COVERAGE_MATCHED") {
      specificMessage = `<p>Great news! A replacement match is available for ${escapeHtml(application.doctor)}. Operations is now confirming the handover readiness.</p>`;
    }

    messageBody = `
      <p>Hello ${escapeHtml(application.applicant)},</p>
      ${specificMessage}
      <p><strong>Status:</strong> ${escapeHtml(application.status.replace(/_/g, " "))}</p>
      <p><strong>Payment Status:</strong> ${escapeHtml(application.paymentStatus.replace(/_/g, " "))}</p>
      <div style="margin: 32px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/staff/leave-relief/status?ref=${encodeURIComponent(application.reference)}&token=${encodeURIComponent(application.dashboardToken || "")}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Details</a>
      </div>
    `;
  }

  if (!subject) return;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #141414; background-color: #f7f7f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #418FDE; color: #ffffff; padding: 24px; text-align: left; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .content { padding: 32px 24px; }
        .footer { background: #f0f0f0; padding: 24px; text-align: center; font-size: 13px; color: #666666; }
        .footer a { color: #666666; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>United Nations Medical Services Division</h1>
        </div>
        <div class="content">
          <h2 style="margin-top: 0; margin-bottom: 24px;">${headline}</h2>
          ${messageBody}
        </div>
        <div class="footer">
          <p>Reference: <strong>${escapeHtml(application.reference)}</strong></p>
          <p>This is an automated operational notification. For privacy, this email does not contain secure family notes.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "no-reply@unmsd.org",
      to: [application.email, application.doctorEmail],
      subject,
      html,
    });
    console.log(`Notification sent for ${application.reference}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
