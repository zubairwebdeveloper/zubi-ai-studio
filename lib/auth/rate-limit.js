import { createSharedRateLimiter } from "@/lib/security/rate-limit-core";
import { getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

const shared = createSharedRateLimiter({
  getDb: getAdminDb,
  toTimestamp: (ms) => Timestamp.fromMillis(ms),
});

/**
 * Shared Firebase Firestore rate limiter.
 *
 * @param {string} key - Unique identifier (IP, UID, email, etc.)
 * @param {object} options - Rate limit configuration
 * @returns {Promise<object>} Rate limit result
 */
export async function rateLimit(key, options = {}) {
  if (!key || typeof key !== "string") {
    throw new Error("A valid rate-limit key is required.");
  }

  return shared(key, options);
}
