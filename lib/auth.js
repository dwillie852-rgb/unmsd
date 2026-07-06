import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE, SESSION_TTL_MS } from "./config.js";
import { NextResponse } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "unmsd-default-stateless-secret-key-2026";
const rateLimits = new Map();

function clientAddress(req) {
  return req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
}

export function consumeRateLimit(req, bucket, limit, windowMs) {
  const now = Date.now();
  const key = `${bucket}:${clientAddress(req)}`;
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
  rateLimits.delete(`${bucket}:${clientAddress(req)}`);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function safeEquals(left, right) {
  const normalizeSecret = (value) => createHmac("sha256", "dwb-constant-compare").update(String(value || "")).digest();
  return timingSafeEqual(normalizeSecret(left), normalizeSecret(right));
}

function isSecureRequest(req) {
  const url = new URL(req.url);
  return url.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
}

export function sessionCookie(req, value, maxAgeSeconds) {
  const secure = isSecureRequest(req) ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

function signPayload(payloadObj) {
  const dataB64 = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET).update(dataB64).digest("base64url");
  return `${dataB64}.${signature}`;
}

function verifyPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [dataB64, signature] = parts;

  const expectedSignature = createHmac("sha256", SESSION_SECRET).update(dataB64).digest("base64url");
  if (!safeEquals(signature, expectedSignature)) return null;

  try {
    const jsonStr = Buffer.from(dataB64, "base64url").toString("utf8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function createAdminSession(admin) {
  const session = {
    csrfToken: randomToken(),
    username: admin.username,
    name: admin.name,
    role: admin.role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  const token = signPayload(session);
  return { session, token };
}

export function getAdminSession(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = verifyPayload(token);
  if (!session || session.expiresAt <= Date.now()) {
    return null;
  }

  return session;
}

export function sessionPayload(session) {
  return {
    authenticated: true,
    csrfToken: session.csrfToken,
    admin: {
      username: session.username,
      name: session.name,
      role: session.role,
    },
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

export function requireAdmin(req, { requireCsrf = true } = {}) {
  const session = getAdminSession(req);
  if (!session) {
    return { errorResponse: NextResponse.json({ error: "Sign in to the operations dashboard first." }, { status: 401 }) };
  }

  const csrfToken = req.headers.get("x-csrf-token");
  if (requireCsrf && !safeEquals(csrfToken, session.csrfToken)) {
    return { errorResponse: NextResponse.json({ error: "The admin session could not be verified. Please sign in again." }, { status: 403 }) };
  }

  // With stateless sessions, extending the expiry requires setting a new cookie in the response.
  // Next.js middleware or route handlers usually do this. For now, we trust the existing expiry.
  return { session };
}

export function removeAdminSession(sessionId) {
  // Stateless sessions are destroyed by deleting the cookie in the route handler. No server state to clear.
}
