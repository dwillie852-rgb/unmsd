import { readDb, writeDb, supabase } from "../../../../lib/db.js";
import { consumeRateLimit, safeEquals } from "../../../../lib/auth.js";
import { asTrimmedString } from "../../../../lib/validation.js";
import { DATA_DIR } from "../../../../lib/config.js";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function POST(req) {
  const rate = consumeRateLimit(req, "upload-proof", 10, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many upload attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  try {
    const formData = await req.formData();
    const reference = asTrimmedString(formData.get("reference")).toUpperCase();
    const email = asTrimmedString(formData.get("email")).toLowerCase();
    const token = asTrimmedString(formData.get("token"));
    const file = formData.get("file");

    if (!reference || (!token && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: "Authentication details missing or invalid." }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No valid file provided." }, { status: 400 });
    }

    const db = await readDb();
    const application = db.applications.find((item) => {
      if (item.reference.toUpperCase() !== reference) return false;
      if (token) return safeEquals(token, item.dashboardToken);
      return item.email.toLowerCase() === email;
    });

    if (!application) {
      return NextResponse.json({ error: "No leave relief request matched that reference and email address." }, { status: 404 });
    }

    if (!application.paymentRequest) {
      return NextResponse.json({ error: "No payment request exists for this application." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and PDF files are allowed." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let ext = ".jpg";
    if (file.type === "image/png") ext = ".png";
    if (file.type === "application/pdf") ext = ".pdf";
    
    const fileName = `${application.reference}-proof-${randomUUID()}${ext}`;
    let fileUrl = "";

    if (supabase) {
      const { data, error } = await supabase.storage.from("proofs").upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
      if (error) throw new Error("Failed to upload file to cloud storage.");
      const { data: publicData } = supabase.storage.from("proofs").getPublicUrl(fileName);
      fileUrl = publicData.publicUrl;
    } else {
      const uploadDir = path.join(DATA_DIR, "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      fileUrl = `/api/admin/uploads?file=${encodeURIComponent(fileName)}`;
    }

    application.paymentRequest.proof = {
      fileUrl,
      uploadedAt: new Date().toISOString(),
      status: "PENDING_REVIEW"
    };
    
    await writeDb(db);

    return NextResponse.json({ success: true, proof: application.paymentRequest.proof });
  } catch (error) {
    return NextResponse.json({ error: error.message || "File upload failed." }, { status: 500 });
  }
}
