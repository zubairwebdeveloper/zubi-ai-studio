import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { createSharedRateLimiter } from "@/lib/security/rate-limit-core";

const shared = createSharedRateLimiter({ getDb: getAdminDb, toTimestamp: (ms) => Timestamp.fromMillis(ms) });

// Two layers: a free in-memory check first (cheap rejection), then the shared Firestore counter.
export async function limitRequest({ bucket, id, limit, windowMs = 60_000 }) {
  const key = `${bucket}:${id}`;
  const local = rateLimit(key, limit, windowMs);
  if (!local.ok) return local;
  return shared(key, limit, windowMs);
}
