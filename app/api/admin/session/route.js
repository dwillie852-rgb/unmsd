import { NextResponse } from "next/server";
import { getAdminSession, sessionPayload } from "../../../../lib/auth.js";

export async function GET(req) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json(sessionPayload(session));
}
