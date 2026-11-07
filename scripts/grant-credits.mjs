// Add or remove credits from a trusted machine (an admin UI comes in Phase 11).
// Usage: node --env-file=.env.local scripts/grant-credits.mjs user@example.com 100 "Support goodwill" --key support-1234
//   amount > 0 adds credits, amount < 0 removes them (never below zero).
//   --key makes the command safe to run twice: the same key is applied only once.
import { randomUUID } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { createCreditService } from "../lib/credits/service-core.js";

const args = process.argv.slice(2);
const keyAt = args.indexOf("--key");
const key = keyAt >= 0 ? args.splice(keyAt, 2)[1] : null;
const [email, amountStr, ...reasonParts] = args;
const amount = Number(amountStr);
const reason = reasonParts.join(" ").trim();
if (!email || !Number.isInteger(amount) || amount === 0 || !reason) {
  console.error('Usage: grant-credits.mjs <email> <non-zero integer> "<reason>" [--key <idempotency-key>]');
  process.exit(1);
}

initializeApp({ credential: cert({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
}) });

const db = getFirestore();
const service = createCreditService({
  getDb: () => db, serverTimestamp: () => FieldValue.serverTimestamp(), toTimestamp: (ms) => Timestamp.fromMillis(ms),
  signupCredits: Number(process.env.SIGNUP_CREDITS || 50),
});

const user = await getAuth().getUserByEmail(email);
const idempotencyKey = key || `cli_${randomUUID()}`;
const result = await service.grant({ uid: user.uid, amount, type: "adjust", reason, idempotencyKey, actor: "cli" });
if (result !== "duplicate") {
  await db.collection("auditLogs").add({ action: "credits.adjust", actor: "cli", targetUid: user.uid, targetEmail: email, amount, reason, idempotencyKey, createdAt: FieldValue.serverTimestamp() });
}
const summary = await service.getSummary(user.uid);
console.log(`${email}: ${result}. Available now: ${summary.available}${key ? "" : `  (idempotency key: ${idempotencyKey})`}`);
