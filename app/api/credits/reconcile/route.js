import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { credits } from "@/lib/credits/service";

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

// Safety net for reservations still "held" long after their job finished (e.g. a crash between the job and billing).
// Schedule every ~10 minutes with: Authorization: Bearer $CRON_SECRET
export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const report = await credits.reconcileHeld();
  return NextResponse.json({ ok: true, ...report });
}

// Some schedulers (e.g. Vercel Cron) can only send GET. Same secret check applies.
export async function GET(request) { return POST(request); }
