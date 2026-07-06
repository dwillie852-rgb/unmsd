import { NextResponse } from "next/server";
import { removeAdminSession, sessionCookie } from "../../../../lib/auth.js";
import { SESSION_COOKIE } from "../../../../lib/config.js";

export async function POST(req) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  removeAdminSession(sessionId);

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", sessionCookie(req, "", 0));
  return response;
}
