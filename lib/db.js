import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { DATA_DIR, DB_FILE, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME } from "./config.js";
import { normalizeFeeSettings, normalizePaymentSettings, cloneDefaultFeeSettings, cloneDefaultPaymentSettings } from "./validation.js";
import argon2 from "argon2";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

let memoryDb = null;
let dbWritePromise = Promise.resolve();

export async function ensureDb() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("unmsd_store").select("data").eq("id", "main").single();
      if (!error && data?.data) {
        memoryDb = normalizeDb(data.data);
      } else {
        memoryDb = { admins: [], applications: [], audit: [], feeSettings: cloneDefaultFeeSettings(), paymentSettings: cloneDefaultPaymentSettings() };
      }
    } catch (err) {
      console.error("Supabase load error:", err);
      memoryDb = { admins: [], applications: [], audit: [], feeSettings: cloneDefaultFeeSettings(), paymentSettings: cloneDefaultPaymentSettings() };
    }
  } else {
    await mkdir(DATA_DIR, { recursive: true });
    try {
      const contents = await readFile(DB_FILE, "utf8");
      memoryDb = normalizeDb(JSON.parse(contents));
    } catch {
      memoryDb = { admins: [], applications: [], audit: [], feeSettings: cloneDefaultFeeSettings(), paymentSettings: cloneDefaultPaymentSettings() };
    }
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
  if (supabase) {
    try {
      await supabase.from("unmsd_store").upsert({ id: "main", data: memoryDb });
    } catch (err) {
      console.error("Supabase save error:", err);
    }
  } else {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
    await writeFile(tmp, `${JSON.stringify(memoryDb, null, 2)}\n`, "utf8");
    await rename(tmp, DB_FILE);
  }
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
