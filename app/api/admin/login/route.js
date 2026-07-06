import { NextResponse } from "next/server";
import { consumeRateLimit, clearRateLimit, createAdminSession, sessionPayload, sessionCookie } from "../../../../lib/auth.js";
import { SESSION_TTL_MS } from "../../../../lib/config.js";
import { readDb } from "../../../../lib/db.js";
import argon2 from "argon2";

export async function POST(req) {
  const rate = consumeRateLimit(req, "admin-login", 8, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many sign-in attempts. Please wait before trying again." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  try {
    const payload = await req.json();
    const username = payload.username ? String(payload.username).trim() : "";
    const password = payload.password ? String(payload.password).trim() : "";

    if (!username || !password) {
      return NextResponse.json({ error: "Admin credentials are required." }, { status: 401 });
    }

    const db = await readDb();
    const admin = db.admins.find((a) => a.username === username);

    if (!admin || !(await argon2.verify(admin.passwordHash, password))) {
      return NextResponse.json({ error: "Admin credentials are invalid." }, { status: 401 });
    }

    const { session, token } = createAdminSession(admin);
    clearRateLimit(req, "admin-login");
    
    const response = NextResponse.json(sessionPayload(session));
    response.headers.set("Set-Cookie", sessionCookie(req, token, Math.floor(SESSION_TTL_MS / 1000)));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || "Sign in failed." }, { status: 400 });
  }
}
