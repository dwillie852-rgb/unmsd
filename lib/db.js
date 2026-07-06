import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { DATA_DIR, DB_FILE } from "./config.js";
import { normalizeFeeSettings, normalizePaymentSettings, cloneDefaultFeeSettings, cloneDefaultPaymentSettings } from "./validation.js";

import argon2 from "argon2";
import { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME } from "./config.js";

let memoryDb = null;
let dbWritePromise = Promise.resolve();

export async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const contents = await readFile(DB_FILE, "utf8");
    memoryDb = normalizeDb(JSON.parse(contents));
  } catch {
    memoryDb = { admins: [], applications: [], audit: [], feeSettings: cloneDefaultFeeSettings(), paymentSettings: cloneDefaultPaymentSettings() };
  }

  if (memoryDb.admins.length === 0) {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD);
    memoryDb.admins.push({
      id: randomUUID(),
      username: ADMIN_USERNAME,
      passwordHash,
      name: ADMIN_NAME,
      role: "Leave relief operations",
    });
    await persistDb();
  }
}

async function persistDb() {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(memoryDb, null, 2)}\n`, "utf8");
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
    admins: Array.isArray(db.admins) ? db.admins : [],
    applications: Array.isArray(db.applications) ? db.applications : [],
    audit: Array.isArray(db.audit) ? db.audit : [],
    feeSettings: normalizeFeeSettings(db.feeSettings),
    paymentSettings: normalizePaymentSettings(db.paymentSettings),
  };
}
