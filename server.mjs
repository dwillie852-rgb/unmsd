import { createServer } from "node:http";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 4173);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "local-admin-token";
const ROOT = resolve(".");
const DATA_DIR = join(ROOT, "data");
const DB_FILE = join(DATA_DIR, "applications.json");

const rates = {
  medical: 245,
  emergency: 380,
  surgical: 520,
  maternal: 320,
  mental: 290,
};

const multipliers = {
  standard: 1,
  hardship: 1.18,
  critical: 1.35,
};

const roleLabels = {
  medical: "Medical officer",
  emergency: "Emergency physician",
  surgical: "Surgical or anaesthesia doctor",
  maternal: "OB or maternal health clinician",
  mental: "Mental health clinician",
};

const zoneLabels = {
  standard: "Standard mission",
  hardship: "Hardship mission",
  critical: "Critical or conflict mission",
};

const statuses = new Set([
  "RECEIVED",
  "COVERAGE_REVIEW",
  "COVERAGE_MATCHED",
  "PAYMENT_PENDING",
  "APPROVED_FOR_TRAVEL",
  "DECLINED",
  "REFUNDED",
  "CLOSED",
]);

const paymentStatuses = new Set(["NOT_REQUESTED", "INVOICE_SENT", "PAID", "REFUNDED", "WAIVED"]);

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
};

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await stat(DB_FILE);
  } catch {
    await writeDb({ applications: [], audit: [] });
  }
}

async function readDb() {
  await ensureDb();
  const contents = await readFile(DB_FILE, "utf8");
  return JSON.parse(contents);
}

async function writeDb(db) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  await rename(tmp, DB_FILE);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
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

function requireAdmin(req, res) {
  const header = req.headers["x-admin-token"];
  const token = Array.isArray(header) ? header[0] : header;
  if (!token || token !== ADMIN_TOKEN) {
    sendJson(res, 401, { error: "Admin token is missing or invalid." });
    return false;
  }
  return true;
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function calculateCost({ role, zone, days, travel }) {
  const coverage = Math.round(rates[role] * multipliers[zone] * days);
  const handover = role === "surgical" ? 900 : 650;
  const travelCoordination = travel ? 480 : 0;
  const reserve = Math.round((coverage + handover + travelCoordination) * 0.08);
  const total = coverage + handover + travelCoordination + reserve;

  return { coverage, handover, travelCoordination, reserve, total };
}

function validateApplication(payload) {
  const errors = [];
  const applicant = asTrimmedString(payload.applicant);
  const email = asTrimmedString(payload.email).toLowerCase();
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("A valid email address is required.");
  if (!doctor) errors.push("Field doctor's name is required.");
  if (!station) errors.push("Field station is required.");
  if (!role || !rates[role]) errors.push("Replacement role is invalid.");
  if (!zone || !multipliers[zone]) errors.push("Field pressure is invalid.");
  if (!Number.isInteger(days) || days < 7 || days > 45) errors.push("Requested leave must be between 7 and 45 days.");
  if (!startDate || Number.isNaN(Date.parse(`${startDate}T00:00:00Z`))) {
    errors.push("Preferred start date is required.");
  }
  if (!consent) errors.push("Consent to privacy notice and terms is required.");

  return {
    errors,
    data: {
      applicant,
      email,
      doctor,
      station,
      startDate,
      familyNotes,
      role,
      roleLabel: roleLabels[role],
      zone,
      zoneLabel: zoneLabels[zone],
      days,
      travel,
      consent,
    },
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

function makeReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `DWB-LR-${date}-${suffix}`;
}

async function createApplication(req, res) {
  try {
    const payload = await readJson(req);
    const { errors, data } = validateApplication(payload);

    if (errors.length) {
      sendJson(res, 400, { errors });
      return;
    }

    const now = new Date().toISOString();
    const application = {
      id: randomUUID(),
      reference: makeReference(),
      ...data,
      costs: calculateCost(data),
      status: "RECEIVED",
      paymentStatus: "NOT_REQUESTED",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    };

    const db = await readDb();
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

    sendJson(res, 201, { application: publicApplication(application) });
  } catch (error) {
    sendJson(res, 400, { errors: [error.message || "Application could not be processed."] });
  }
}

async function listApplications(req, res) {
  if (!requireAdmin(req, res)) return;

  const db = await readDb();
  sendJson(res, 200, {
    applications: db.applications,
    audit: db.audit.slice(0, 100),
  });
}

async function updateApplication(req, res, id) {
  if (!requireAdmin(req, res)) return;

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

    const before = {
      status: application.status,
      paymentStatus: application.paymentStatus,
      adminNotes: application.adminNotes,
    };

    if (nextStatus) application.status = nextStatus;
    if (nextPaymentStatus) application.paymentStatus = nextPaymentStatus;
    application.adminNotes = adminNotes;
    application.updatedAt = new Date().toISOString();

    db.audit.unshift({
      id: randomUUID(),
      applicationId: application.id,
      reference: application.reference,
      event: "APPLICATION_UPDATED",
      at: application.updatedAt,
      actor: "admin-dashboard",
      details: {
        before,
        after: {
          status: application.status,
          paymentStatus: application.paymentStatus,
          adminNotes: application.adminNotes,
        },
      },
    });

    await writeDb(db);
    sendJson(res, 200, { application });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Application could not be updated." });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(ROOT, normalized));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = extname(filePath);
  const stream = createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    stream.pipe(res);
  });
  stream.on("error", () => {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, product: "leave-relief-operations", time: new Date().toISOString() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/leave-applications") {
    await createApplication(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leave-applications") {
    await listApplications(req, res);
    return;
  }

  const updateMatch = url.pathname.match(/^\/api\/leave-applications\/([a-f0-9-]+)$/i);
  if (req.method === "PATCH" && updateMatch) {
    await updateApplication(req, res, updateMatch[1]);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

await ensureDb();
server.listen(PORT, () => {
  console.log(`Doctors Without Border product server running at http://127.0.0.1:${PORT}`);
  console.log(`Admin dashboard token: ${ADMIN_TOKEN}`);
});
