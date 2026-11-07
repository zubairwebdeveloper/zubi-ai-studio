import { createHash } from "node:crypto";

// Fixed-window counter shared by ALL server instances through Firestore (the in-memory limiter only sees one).
// A burst at a window boundary can reach up to 2x the limit; that is acceptable for abuse control.
// Raw keys (user ids, IPs) are hashed, so the collection holds no personal data.
export const rateLimitDocId = (key, windowStart) => `${createHash("sha256").update(key).digest("hex").slice(0, 40)}_${windowStart}`;

export function createSharedRateLimiter({ getDb, toTimestamp, now = () => Date.now(), log = console }) {
  return async function check(key, limit, windowMs) {
    const t = now();
    const windowStart = Math.floor(t / windowMs) * windowMs;
    try {
      const db = getDb();
      const ref = db.collection("rateLimits").doc(rateLimitDocId(key, windowStart));
      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const count = snap.exists ? snap.data().count : 0;
        if (count >= limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - t) / 1000)) };
        // expiresAt feeds a Firestore TTL policy (see docs/DEPLOYMENT.md); one spare window is kept.
        tx.set(ref, { count: count + 1, expiresAt: toTimestamp(windowStart + windowMs * 2) });
        return { ok: true, retryAfter: 0 };
      });
    } catch (err) {
      // Fail OPEN: a database blip must not lock everyone out. The in-memory limiter still applies.
      log.error("[rate-limit] shared check failed, allowing the request:", err?.message);
      return { ok: true, retryAfter: 0, degraded: true };
    }
  };
}
