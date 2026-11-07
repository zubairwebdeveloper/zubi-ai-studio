import { createHash } from "node:crypto";

// Same user + same idempotency key => same job id, so a retried request can never create a second job.
export function jobIdFor(uid, idempotencyKey) {
  return createHash("sha256").update(`${uid}:${idempotencyKey}`).digest("hex").slice(0, 32);
}
