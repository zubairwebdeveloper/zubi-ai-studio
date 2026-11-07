import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { createCreditService } from "@/lib/credits/service-core";
import { CREDITS } from "@/config/credits";

export const credits = createCreditService({
  getDb: getAdminDb,
  serverTimestamp: () => FieldValue.serverTimestamp(),
  toTimestamp: (ms) => Timestamp.fromMillis(ms),
  signupCredits: CREDITS.signupCredits,
  maxDailyLimit: CREDITS.maxDailyLimit,
});

// For layout/overview: a failing wallet read must never take the whole dashboard down.
export async function safeSummary(uid) {
  try { return await credits.getSummary(uid); }
  catch (err) { console.error("[credits] summary failed:", err?.message); return null; }
}
