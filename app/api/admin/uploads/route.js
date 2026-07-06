import { NextResponse } from "next/server";
import { readDb } from "../../../../lib/db.js";
import { requireAdmin } from "../../../../lib/auth.js";
import { DATA_DIR } from "../../../../lib/config.js";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(req) {
  const authError = await requireAdmin(req, { requireCsrf: false });
  if (authError) return authError;

  const url = new URL(req.url);
  const fileName = url.searchParams.get("file");

  if (!fileName || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
  }

  const db = await readDb();
  const application = db.applications.find(
    (app) => app.paymentRequest?.proof?.fileUrl && app.paymentRequest.proof.fileUrl.includes(fileName)
  );

  if (!application) {
    return NextResponse.json({ error: "File not found or not associated with any application." }, { status: 404 });
  }

  const uploadDir = path.join(DATA_DIR, "uploads");
  const filePath = path.join(uploadDir, fileName);

  try {
    const fileBuffer = await readFile(filePath);

    let contentType = "application/octet-stream";
    if (fileName.endsWith(".png")) contentType = "image/png";
    else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (fileName.endsWith(".pdf")) contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk." }, { status: 404 });
  }
}
