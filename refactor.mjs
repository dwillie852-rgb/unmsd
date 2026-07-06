import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const src = join(process.cwd(), "src");
  await mkdir(src, { recursive: true });
  await mkdir(join(src, "routes"), { recursive: true });

  const files = {};

  files["src/config.mjs"] = `
export const PORT = Number(process.env.PORT || 4173);
export const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "local-admin-token";
export const ADMIN_NAME = process.env.ADMIN_NAME || "Operations admin";
export const SESSION_COOKIE = "dwb_admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const ROOT = import.meta.dirname ? import.meta.dirname.replace(/\\/src$/, "") : process.cwd();
export const DATA_DIR = import.meta.dirname ? import.meta.dirname.replace(/\\/src$/, "/data") : process.cwd() + "/data";
export const DB_FILE = DATA_DIR + "/applications.json";

export const roleLabels = {
  medical: "Medical officer",
  emergency: "Emergency physician",
  surgical: "Surgical or anaesthesia doctor",
  maternal: "OB or maternal health clinician",
  mental: "Mental health clinician",
};

export const zoneLabels = {
  standard: "Standard mission",
  hardship: "Hardship mission",
  critical: "Critical or conflict mission",
};

export const statuses = new Set([
  "RECEIVED",
  "COVERAGE_REVIEW",
  "COVERAGE_MATCHED",
  "PAYMENT_PENDING",
  "APPROVED_FOR_TRAVEL",
  "DECLINED",
  "REFUNDED",
  "CLOSED",
]);

export const paymentStatuses = new Set(["NOT_REQUESTED", "INVOICE_SENT", "PAID", "REFUNDED", "WAIVED"]);

export const defaultFeeSettings = {
  roleRates: { medical: 245, emergency: 380, surgical: 520, maternal: 320, mental: 290 },
  zoneMultipliers: { standard: 1, hardship: 1.18, critical: 1.35 },
  handover: { default: 650, surgical: 900 },
  travelCoordination: 480,
  reservePercent: 8,
  updatedAt: null,
  updatedBy: "system-default",
};

export const defaultPaymentSettings = {
  currency: "USD",
  expiryDays: 14,
  settlementNote: "Payment must use the application payment reference so operations can reconcile it quickly.",
  methods: {
    card: { enabled: true, label: "Card or digital wallet", provider: "Hosted checkout", checkoutUrl: "", instructions: "Operations can attach a hosted checkout link when a processor is connected." },
    bank: { enabled: true, label: "Bank transfer", accountName: "Doctors Without Border Relief Operations", bankName: "Global operations account", accountNumber: "Issued by finance", iban: "Issued by finance", swift: "Issued by finance", instructions: "Use the payment reference as the transfer memo." },
    mobileMoney: { enabled: true, label: "Mobile money", providers: "M-Pesa, MTN, Airtel Money", contact: "payments@doctorswithoutborder.example", instructions: "Operations will confirm the local wallet route for the applicant country." },
    crypto: { enabled: true, label: "Cryptocurrency", settlement: "Stablecoin settlement preferred for fast global reconciliation.", assets: [ { asset: "USDC", network: "Polygon", address: "Wallet issued after compliance review" }, { asset: "USDT", network: "TRON", address: "Wallet issued after compliance review" }, { asset: "BTC", network: "Bitcoin", address: "Wallet issued after compliance review" } ], instructions: "Use the exact payment reference in the confirmation message. Operations verifies network, amount, and sender review before travel clearance." },
  },
};
`;

  files["src/validation.mjs"] = `
import { defaultFeeSettings, defaultPaymentSettings, roleLabels, zoneLabels } from "./config.mjs";

export function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function escapeHtml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function cloneDefaultFeeSettings() {
  return JSON.parse(JSON.stringify(defaultFeeSettings));
}

export function cloneDefaultPaymentSettings() {
  return JSON.parse(JSON.stringify(defaultPaymentSettings));
}

export function normalizeFeeSettings(settings = {}) {
  const defaults = cloneDefaultFeeSettings();
  return {
    roleRates: { ...defaults.roleRates, ...(settings.roleRates || {}) },
    zoneMultipliers: { ...defaults.zoneMultipliers, ...(settings.zoneMultipliers || {}) },
    handover: { ...defaults.handover, ...(settings.handover || {}) },
    travelCoordination: settings.travelCoordination ?? defaults.travelCoordination,
    reservePercent: settings.reservePercent ?? defaults.reservePercent,
    updatedAt: settings.updatedAt || defaults.updatedAt,
    updatedBy: settings.updatedBy || defaults.updatedBy,
  };
}

export function normalizePaymentSettings(settings = {}) {
  const defaults = cloneDefaultPaymentSettings();
  const methods = settings.methods || {};
  return {
    currency: asTrimmedString(settings.currency || defaults.currency).toUpperCase() || defaults.currency,
    expiryDays: Number.isInteger(Number(settings.expiryDays)) ? Math.min(Math.max(Number(settings.expiryDays), 1), 60) : defaults.expiryDays,
    settlementNote: asTrimmedString(settings.settlementNote || defaults.settlementNote),
    methods: {
      card: { ...defaults.methods.card, ...(methods.card || {}), enabled: methods.card?.enabled ?? defaults.methods.card.enabled },
      bank: { ...defaults.methods.bank, ...(methods.bank || {}), enabled: methods.bank?.enabled ?? defaults.methods.bank.enabled },
      mobileMoney: { ...defaults.methods.mobileMoney, ...(methods.mobileMoney || {}), enabled: methods.mobileMoney?.enabled ?? defaults.methods.mobileMoney.enabled },
      crypto: { ...defaults.methods.crypto, ...(methods.crypto || {}), enabled: methods.crypto?.enabled ?? defaults.methods.crypto.enabled, assets: Array.isArray(methods.crypto?.assets) && methods.crypto.assets.length ? methods.crypto.assets : defaults.methods.crypto.assets },
    },
  };
}

export function toBoundedNumber(value, label, { min, max, decimals = 0 }, errors) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    errors.push(\`\${label} must be between \${min} and \${max}.\`);
    return null;
  }
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
}

export function calculateCost({ role, zone, days, travel }, feeSettings) {
  const settings = normalizeFeeSettings(feeSettings);
  const coverage = Math.round(settings.roleRates[role] * settings.zoneMultipliers[zone] * days);
  const handover = role === "surgical" ? settings.handover.surgical : settings.handover.default;
  const travelCoordination = travel ? settings.travelCoordination : 0;
  const reserve = Math.round((coverage + handover + travelCoordination) * (settings.reservePercent / 100));
  const total = coverage + handover + travelCoordination + reserve;
  return { coverage, handover, travelCoordination, reserve, total };
}

export function validateApplication(payload, feeSettings) {
  const settings = normalizeFeeSettings(feeSettings);
  const errors = [];
  const applicant = asTrimmedString(payload.applicant);
  const email = asTrimmedString(payload.email).toLowerCase();
  const doctorEmail = asTrimmedString(payload.doctorEmail).toLowerCase();
  const doctor = asTrimmedString(payload.doctor);
  const station = asTrimmedString(payload.station);
  const startDate = asTrimmedString(payload.startDate);
  const familyNotes = asTrimmedString(payload.familyNotes).slice(0, 1200);
  const role = asTrimmedString(payload.role);
  const zone = asTrimmedString(payload.zone);
  const days = Number(payload.days);
  const travel = Boolean(payload.travel);
  const consent = Boolean(payload.consent);
  const website = asTrimmedString(payload.website);

  if (website) errors.push("This request could not be processed.");
  if (!applicant) errors.push("Applicant name is required.");
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) errors.push("A valid email address is required.");
  if (!doctorEmail || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(doctorEmail)) errors.push("A valid doctor email address is required.");
  if (!doctor) errors.push("Field doctor's name is required.");
  if (!station) errors.push("Field station is required.");
  if (!role || !settings.roleRates[role]) errors.push("Replacement role is invalid.");
  if (!zone || !settings.zoneMultipliers[zone]) errors.push("Field pressure is invalid.");
  if (!Number.isInteger(days) || days < 7 || days > 45) errors.push("Requested leave must be between 7 and 45 days.");
  if (!startDate || Number.isNaN(Date.parse(\`\${startDate}T00:00:00Z\`))) {
    errors.push("Preferred start date is required.");
  }
  if (!consent) errors.push("Consent to privacy notice and terms is required.");

  return {
    errors,
    data: {
      applicant, email, doctorEmail, doctor, station, startDate, familyNotes,
      role, roleLabel: roleLabels[role], zone, zoneLabel: zoneLabels[zone], days, travel, consent,
    },
  };
}

export function validateFeeSettings(payload, actor) {
  const errors = [];
  const current = normalizeFeeSettings(payload);
  const next = cloneDefaultFeeSettings();

  for (const [key, label] of Object.entries(roleLabels)) {
    next.roleRates[key] = toBoundedNumber(current.roleRates[key], \`\${label} daily rate\`, { min: 50, max: 5000 }, errors);
  }

  for (const [key, label] of Object.entries(zoneLabels)) {
    next.zoneMultipliers[key] = toBoundedNumber(current.zoneMultipliers[key], \`\${label} multiplier\`, { min: 0.5, max: 3, decimals: 2 }, errors);
  }

  next.handover.default = toBoundedNumber(current.handover.default, "Standard handover fee", { min: 0, max: 50000 }, errors);
  next.handover.surgical = toBoundedNumber(current.handover.surgical, "Surgical handover fee", { min: 0, max: 50000 }, errors);
  next.travelCoordination = toBoundedNumber(current.travelCoordination, "Travel coordination fee", { min: 0, max: 50000 }, errors);
  next.reservePercent = toBoundedNumber(current.reservePercent, "Operations reserve percent", { min: 0, max: 50, decimals: 2 }, errors);
  next.updatedAt = new Date().toISOString();
  next.updatedBy = actor;

  return { errors, settings: next };
}
`;

  files["src/db.mjs"] = `
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { DATA_DIR, DB_FILE } from "./config.mjs";
import { normalizeFeeSettings, normalizePaymentSettings, cloneDefaultFeeSettings, cloneDefaultPaymentSettings } from "./validation.mjs";

let memoryDb = null;
let dbWritePromise = Promise.resolve();

export async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const contents = await readFile(DB_FILE, "utf8");
    memoryDb = normalizeDb(JSON.parse(contents));
  } catch {
    memoryDb = { applications: [], audit: [], feeSettings: cloneDefaultFeeSettings(), paymentSettings: cloneDefaultPaymentSettings() };
    await persistDb();
  }
}

async function persistDb() {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = \`\${DB_FILE}.\${randomUUID()}.tmp\`;
  await writeFile(tmp, \`\${JSON.stringify(memoryDb, null, 2)}\\n\`, "utf8");
  await rename(tmp, DB_FILE);
}

export async function readDb() {
  if (!memoryDb) await ensureDb();
  return memoryDb;
}

export async function writeDb(db) {
  memoryDb = db;
  dbWritePromise = dbWritePromise.then(() => persistDb()).catch(console.error);
  await dbWritePromise;
}

function normalizeDb(db) {
  return {
    applications: Array.isArray(db.applications) ? db.applications : [],
    audit: Array.isArray(db.audit) ? db.audit : [],
    feeSettings: normalizeFeeSettings(db.feeSettings),
    paymentSettings: normalizePaymentSettings(db.paymentSettings),
  };
}
`;

  files["src/middleware.mjs"] = `
export function sendJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

export function readJson(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64_000) {
        req.destroy();
        rejectBody(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch {
        rejectBody(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", rejectBody);
  });
}

export function clientAddress(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0].split(",")[0].trim();
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}
`;

  files["src/auth.mjs"] = `
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE, SESSION_TTL_MS, ADMIN_NAME, ADMIN_TOKEN } from "./config.mjs";
import { sendJson, clientAddress } from "./middleware.mjs";

const adminSessions = new Map();
const rateLimits = new Map();

export function consumeRateLimit(req, bucket, limit, windowMs) {
  const now = Date.now();
  const key = \`\${bucket}:\${clientAddress(req)}\`;
  const current = rateLimits.get(key);
  const entry = current && current.resetAt > now ? current : { count: 0, resetAt: now + windowMs };

  entry.count += 1;
  rateLimits.set(key, entry);

  for (const [rateKey, value] of rateLimits.entries()) {
    if (value.resetAt <= now) rateLimits.delete(rateKey);
  }

  return {
    allowed: entry.count <= limit,
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function clearRateLimit(req, bucket) {
  rateLimits.delete(\`\${bucket}:\${clientAddress(req)}\`);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function safeEquals(left, right) {
  const normalizeSecret = (value) => createHmac("sha256", "dwb-constant-compare").update(String(value || "")).digest();
  return timingSafeEqual(normalizeSecret(left), normalizeSecret(right));
}

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator === -1) return [decodeURIComponent(part), ""];
        return [decodeURIComponent(part.slice(0, separator)), decodeURIComponent(part.slice(separator + 1))];
      }),
  );
}

function isSecureRequest(req) {
  return Boolean(req.socket.encrypted || req.headers["x-forwarded-proto"] === "https");
}

export function sessionCookie(req, value, maxAgeSeconds) {
  const secure = isSecureRequest(req) ? "; Secure" : "";
  return \`\${SESSION_COOKIE}=\${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=\${maxAgeSeconds}\${secure}\`;
}

function clearExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(id);
    }
  }
}

export function createAdminSession() {
  clearExpiredSessions();
  const id = randomToken();
  const session = {
    id,
    csrfToken: randomToken(),
    name: ADMIN_NAME,
    role: "Leave relief operations",
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  adminSessions.set(id, session);
  return session;
}

export function getAdminSession(req) {
  clearExpiredSessions();
  const sessionId = parseCookies(req)[SESSION_COOKIE];
  if (!sessionId) return null;

  const session = adminSessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(sessionId);
    return null;
  }

  return session;
}

export function sessionPayload(session) {
  return {
    authenticated: true,
    csrfToken: session.csrfToken,
    admin: {
      name: session.name,
      role: session.role,
    },
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

export function requireAdmin(req, res, { requireCsrf = true } = {}) {
  const session = getAdminSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Sign in to the operations dashboard first." });
    return null;
  }

  const csrfHeader = req.headers["x-csrf-token"];
  const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
  if (requireCsrf && !safeEquals(csrfToken, session.csrfToken)) {
    sendJson(res, 403, { error: "The admin session could not be verified. Please sign in again." });
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

export function removeAdminSession(sessionId) {
  if (sessionId) adminSessions.delete(sessionId);
}
`;

  files["src/email.mjs"] = `
import { Resend } from "resend";
import { escapeHtml } from "./validation.mjs";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendNotificationEmail(application, eventType) {
  if (!process.env.RESEND_API_KEY) {
    console.log(\`[Email Mock] Email for event \${eventType} would be sent to \${application.email} and \${application.doctorEmail}\`);
    return;
  }

  let subject = "";
  let html = "";

  if (eventType === "REGISTRATION") {
    subject = \`Leave Application Received - \${application.reference}\`;
    html = \`<p>Hello \${escapeHtml(application.applicant)},</p>
            <p>Your leave application for \${escapeHtml(application.doctor)} has been received.</p>
            <p><strong>Reference:</strong> \${escapeHtml(application.reference)}</p>
            <p><strong>Status:</strong> \${escapeHtml(application.status)}</p>
            <p>We will notify you and \${escapeHtml(application.doctor)} when operations reviews this request.</p>\`;
  } else if (eventType === "MILESTONE") {
    subject = \`Leave Application Update - \${application.reference}\`;
    html = \`<p>Hello,</p>
            <p>There is an update on the leave application for \${escapeHtml(application.doctor)}.</p>
            <p><strong>Reference:</strong> \${escapeHtml(application.reference)}</p>
            <p><strong>New Status:</strong> \${escapeHtml(application.status)}</p>
            <p><strong>Payment Status:</strong> \${escapeHtml(application.paymentStatus)}</p>\`;
  }

  if (!subject) return;

  try {
    await resend.emails.send({
      from: "no-reply@doctorswithoutborders-hr.org",
      to: [application.email, application.doctorEmail],
      subject,
      html,
    });
    console.log(\`Notification sent for \${application.reference}\`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
`;

  files["src/routes/applications.mjs"] = `
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../db.mjs";
import { sendJson, readJson } from "../middleware.mjs";
import { consumeRateLimit, randomToken, safeEquals, requireAdmin } from "../auth.mjs";
import { sendNotificationEmail } from "../email.mjs";
import { validateApplication, asTrimmedString, calculateCost, normalizeFeeSettings, normalizePaymentSettings } from "../validation.mjs";
import { statuses, paymentStatuses } from "../config.mjs";

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
  };
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
    paymentRequest: publicPaymentRequest(application.paymentRequest),
    nextStep: statusNextStep(application.status, application.paymentStatus),
    timeline: stepOrder.map((step, index) => ({
      key: step,
      complete: currentIndex > index || application.status === "APPROVED_FOR_TRAVEL",
      current: application.status === step,
    })),
  };
}

function makeReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return \`DWB-LR-\${date}-\${suffix}\`;
}

export async function createApplication(req, res) {
  const rate = consumeRateLimit(req, "create-app", 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    sendJson(res, 429, { errors: ["Too many applications submitted. Please try again later."] }, { "Retry-After": String(rate.retryAfter) });
    return;
  }
  try {
    const payload = await readJson(req);
    const db = await readDb();
    const { errors, data } = validateApplication(payload, db.feeSettings);

    if (errors.length) {
      sendJson(res, 400, { errors });
      return;
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

    sendJson(res, 201, { application: publicApplication(application), dashboardToken: application.dashboardToken });
  } catch (error) {
    sendJson(res, 400, { errors: [error.message || "Application could not be processed."] });
  }
}

export async function listApplications(req, res) {
  if (!requireAdmin(req, res)) return;
  const db = await readDb();
  sendJson(res, 200, {
    applications: db.applications.map(({ dashboardToken, ...rest }) => rest),
    audit: db.audit.slice(0, 100),
  });
}

export async function updateApplication(req, res, id) {
  const session = requireAdmin(req, res);
  if (!session) return;
  try {
    const payload = await readJson(req);
    const db = await readDb();
    const application = db.applications.find((item) => item.id === id);

    if (!application) {
      sendJson(res, 404, { error: "Application not found." });
      return;
    }

    const nextStatus = asTrimmedString(payload.status);
    const nextPaymentStatus = asTrimmedString(payload.paymentStatus);
    const adminNotes = asTrimmedString(payload.adminNotes).slice(0, 1600);

    if (nextStatus && !statuses.has(nextStatus)) {
      sendJson(res, 400, { error: "Status is invalid." });
      return;
    }
    if (nextPaymentStatus && !paymentStatuses.has(nextPaymentStatus)) {
      sendJson(res, 400, { error: "Payment status is invalid." });
      return;
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
    sendJson(res, 200, { application });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Application could not be updated." });
  }
}

export async function getApplicationStatus(req, res) {
  const rate = consumeRateLimit(req, "status-lookup", 30, 10 * 60 * 1000);
  if (!rate.allowed) {
    sendJson(res, 429, { error: "Too many status checks. Please try again shortly." }, { "Retry-After": String(rate.retryAfter) });
    return;
  }

  try {
    const payload = await readJson(req);
    const reference = asTrimmedString(payload.reference).toUpperCase();
    const email = asTrimmedString(payload.email).toLowerCase();
    const token = asTrimmedString(payload.token);

    if (!reference || (!token && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))) {
      sendJson(res, 400, { error: "Enter the application reference and applicant email address, or a valid secure link." });
      return;
    }

    const db = await readDb();
    const application = db.applications.find((item) => {
      if (item.reference.toUpperCase() !== reference) return false;
      if (token) return safeEquals(token, item.dashboardToken);
      return item.email.toLowerCase() === email;
    });

    if (!application) {
      sendJson(res, 404, { error: "No leave relief request matched that reference and email address." });
      return;
    }

    sendJson(res, 200, { application: publicStatus(application) });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Status could not be checked." });
  }
}
`;

  files["src/routes/admin.mjs"] = `
import { sendJson, readJson } from "../middleware.mjs";
import { consumeRateLimit, clearRateLimit, safeEquals, createAdminSession, sessionPayload, sessionCookie, parseCookies, getAdminSession, removeAdminSession, ADMIN_TOKEN, SESSION_COOKIE, SESSION_TTL_MS } from "../auth.mjs";

export async function adminLogin(req, res) {
  const rate = consumeRateLimit(req, "admin-login", 8, 15 * 60 * 1000);
  if (!rate.allowed) {
    sendJson(res, 429, { error: "Too many sign-in attempts. Please wait before trying again." }, { "Retry-After": String(rate.retryAfter) });
    return;
  }

  try {
    const payload = await readJson(req);
    const token = payload.token ? String(payload.token).trim() : "";

    if (!token || !safeEquals(token, ADMIN_TOKEN)) {
      sendJson(res, 401, { error: "Admin credentials are invalid." });
      return;
    }

    const session = createAdminSession();
    clearRateLimit(req, "admin-login");
    sendJson(res, 200, sessionPayload(session), {
      "Set-Cookie": sessionCookie(req, session.id, Math.floor(SESSION_TTL_MS / 1000)),
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Sign in failed." });
  }
}

export async function adminLogout(req, res) {
  const sessionId = parseCookies(req)[SESSION_COOKIE];
  removeAdminSession(sessionId);

  sendJson(res, 200, { ok: true }, {
    "Set-Cookie": sessionCookie(req, "", 0),
  });
}

export function adminSession(req, res) {
  const session = getAdminSession(req);
  if (!session) {
    sendJson(res, 401, { authenticated: false });
    return;
  }

  sendJson(res, 200, sessionPayload(session));
}
`;

  files["src/routes/settings.mjs"] = `
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../db.mjs";
import { sendJson, readJson } from "../middleware.mjs";
import { requireAdmin } from "../auth.mjs";
import { normalizeFeeSettings, validateFeeSettings } from "../validation.mjs";

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

export async function getFeeSettings(req, res) {
  const db = await readDb();
  sendJson(res, 200, { feeSettings: publicFeeSettings(db.feeSettings) });
}

export async function updateFeeSettings(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const payload = await readJson(req);
    const { errors, settings } = validateFeeSettings(payload.feeSettings || payload, session.name);

    if (errors.length) {
      sendJson(res, 400, { errors });
      return;
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
    sendJson(res, 200, { feeSettings: publicFeeSettings(settings), audit: db.audit.slice(0, 100) });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Fee settings could not be updated." });
  }
}
`;

  files["src/routes/payments.mjs"] = `
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "../db.mjs";
import { sendJson } from "../middleware.mjs";
import { requireAdmin } from "../auth.mjs";
import { asTrimmedString, normalizePaymentSettings } from "../validation.mjs";

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
    reference: \`\${application.reference}-PAY\`,
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

export async function issuePaymentRequest(req, res, id) {
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const db = await readDb();
    const application = db.applications.find((item) => item.id === id);

    if (!application) {
      sendJson(res, 404, { error: "Application not found." });
      return;
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
    sendJson(res, 200, { application, audit: db.audit.slice(0, 100) });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Payment request could not be issued." });
  }
}
`;

  files["src/static.mjs"] = `
import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { ROOT } from "./config.mjs";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

export function serveStatic(req, res) {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = normalize(requested).replace(/^(\\.\\.[\\/\\\\])+/, "");
  const filePath = resolve(join(ROOT, normalized));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = extname(filePath);
  const isAsset = [".css", ".js", ".jpg", ".jpeg", ".png", ".svg", ".ico", ".woff", ".woff2"].includes(ext);
  const stream = createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
      "Cache-Control": isAsset ? "public, max-age=86400" : "no-cache",
    });
    stream.pipe(res);
  });
  stream.on("error", () => {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });
}
`;

  files["server.mjs"] = `
import { createServer } from "node:http";
import { ensureDb } from "./src/db.mjs";
import { sendJson } from "./src/middleware.mjs";
import { PORT, ADMIN_TOKEN } from "./src/config.mjs";
import { serveStatic } from "./src/static.mjs";
import { createApplication, listApplications, updateApplication, getApplicationStatus } from "./src/routes/applications.mjs";
import { adminLogin, adminLogout, adminSession } from "./src/routes/admin.mjs";
import { getFeeSettings, updateFeeSettings } from "./src/routes/settings.mjs";
import { issuePaymentRequest } from "./src/routes/payments.mjs";

if (process.env.NODE_ENV === "production" && !process.env.ADMIN_TOKEN) {
  throw new Error("ADMIN_TOKEN must be set before running the admin dashboard in production.");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, \`http://\${req.headers.host}\`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, product: "leave-relief-operations", time: new Date().toISOString() });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/fee-settings") return await getFeeSettings(req, res);
    if (req.method === "POST" && url.pathname === "/api/leave-applications") return await createApplication(req, res);
    if (req.method === "POST" && url.pathname === "/api/leave-applications/status") return await getApplicationStatus(req, res);
    if (req.method === "POST" && url.pathname === "/api/admin/login") return await adminLogin(req, res);
    if (req.method === "POST" && url.pathname === "/api/admin/logout") return await adminLogout(req, res);
    if (req.method === "GET" && url.pathname === "/api/admin/session") return adminSession(req, res);
    if (req.method === "PATCH" && url.pathname === "/api/fee-settings") return await updateFeeSettings(req, res);
    if (req.method === "GET" && url.pathname === "/api/leave-applications") return await listApplications(req, res);

    const paymentRequestMatch = url.pathname.match(/^\\/api\\/leave-applications\\/([a-f0-9-]+)\\/payment-request$/i);
    if (req.method === "POST" && paymentRequestMatch) return await issuePaymentRequest(req, res, paymentRequestMatch[1]);

    const updateMatch = url.pathname.match(/^\\/api\\/leave-applications\\/([a-f0-9-]+)$/i);
    if (req.method === "PATCH" && updateMatch) return await updateApplication(req, res, updateMatch[1]);

    if (req.method === "GET") return serveStatic(req, res);

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (err) {
    console.error("Unhandled server error:", err);
    sendJson(res, 500, { error: "An internal server error occurred." });
  }
});

await ensureDb();
server.listen(PORT, () => {
  console.log(\`Doctors Without Border product server running at http://127.0.0.1:\${PORT}\`);
  console.log(process.env.ADMIN_TOKEN ? "Admin dashboard auth: ADMIN_TOKEN is set." : "Admin dashboard token: local-admin-token (development default).");
});

process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));
process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
`;

  for (const [path, content] of Object.entries(files)) {
    await writeFile(join(process.cwd(), path), content.trim() + "\\n");
    console.log("Wrote", path);
  }
}

run().catch(console.error);
