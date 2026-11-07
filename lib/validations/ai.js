import { z } from "zod";

// Which fields are required depends on the tool's binding (checked in lib/ai/jobs.js).
// `options` and `history` are re-validated against the binding on the server; this only bounds their size.
export const createJobSchema = z.object({
  toolSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  text: z.string().trim().max(50_000).optional().default(""),
  assetId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  options: z.record(z.string().max(40), z.string().max(80)).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) })).max(12).optional(),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, "Invalid idempotency key"),
});
