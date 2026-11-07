import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { runJob } from "@/lib/ai/run-job";
import { firestoreStore } from "@/lib/ai/store";
import { credits } from "@/lib/credits/service";

const QUEUED_STALE_MS = 2 * 60_000;
const PROCESSING_STALE_MS = 10 * 60_000;

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

// Call every few minutes from a scheduler (Cloud Scheduler, Vercel Cron...) with: Authorization: Bearer $CRON_SECRET
//  - queued jobs whose background run never started are run again
//  - processing jobs with a provider id are polled
//  - processing jobs WITHOUT a provider id are failed and flagged needsReview (the provider may have been charged)
export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getAdminDb();
  const cutoff = new Date(Date.now() - QUEUED_STALE_MS);
  const snap = await db.collection("generationJobs").where("status", "in", ["queued", "processing"]).where("updatedAt", "<", cutoff).limit(25).get();

  const report = { rerun: 0, polled: 0, flagged: 0 };
  for (const doc of snap.docs) {
    const j = doc.data();
    const age = Date.now() - (j.updatedAt?.toMillis?.() || 0);
    if (j.status === "queued") { await runJob(doc.id); report.rerun++; }
    else if (j.providerJobId) { await runJob(doc.id); report.polled++; }
    else if (age > PROCESSING_STALE_MS) {
      await firestoreStore.fail(doc.id, {
        publicMessage: "This request timed out. Please try again.", internalMessage: "Stuck in processing without a provider job id",
        code: "stuck", retryable: false, needsReview: true,
      });
      await credits.release(doc.id, "Job timed out: credits refunded").catch((e) => console.error("[credits] refund failed:", e?.message));
      report.flagged++;
    }
  }
  return NextResponse.json({ ok: true, ...report });
}

// Some schedulers (e.g. Vercel Cron) can only send GET. Same secret check applies.
export async function GET(request) { return POST(request); }
