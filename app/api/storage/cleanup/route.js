import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { deleteAsset } from "@/lib/storage";
import { maintenance } from "@/lib/ops/maintenance";

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

// Retention: deletes uploads/outputs past their expiresAt. Schedule daily with Authorization: Bearer $CRON_SECRET.
export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await getAdminDb().collection("projectAssets").where("expiresAt", "<=", Timestamp.now()).limit(50).get();
  let deleted = 0, failed = 0;
  for (const doc of snap.docs) {
    try { if (await deleteAsset(doc.id)) deleted++; } catch (err) { failed++; console.error("[cleanup]", doc.id, err?.message); }
  }
  // Same daily run also enforces the input-retention policy and clears spent rate-limit counters.
  let inputs = null, limits = null;
  try { inputs = await maintenance.redactExpiredInputs(); } catch (err) { console.error("[cleanup] input redaction failed:", err?.message); }
  try { limits = await maintenance.deleteExpiredRateLimits(); } catch (err) { console.error("[cleanup] rate-limit cleanup failed:", err?.message); }
  return NextResponse.json({ ok: true, deleted, failed, more: snap.size === 50, redactedInputs: inputs?.redacted ?? null, rateLimitsDeleted: limits?.deleted ?? null });
}

// Some schedulers (e.g. Vercel Cron) can only send GET. Same secret check applies.
export async function GET(request) { return POST(request); }
