import { after } from "next/server";
import { authenticateApiRequest, apiJson, apiError } from "@/lib/api/auth";
import { apiKeys } from "@/lib/api/service";
import { apiSupports, validateApiJobBody, IDEMPOTENCY_RE } from "@/lib/api/keys";
import { createJob, JobError } from "@/lib/ai/jobs";
import { runJob } from "@/lib/ai/run-job";
import { toolBindings } from "@/config/tool-bindings";

export const maxDuration = 300;

const CODES = { 400: "invalid_request", 402: "insufficient_credits", 404: "tool_not_found", 429: "limit_reached", 503: "tool_unavailable" };

// POST /api/v1/jobs : starts a job and returns 202 immediately. Poll GET /api/v1/jobs/{id}.
// Same pipeline as the dashboard: credits are held now, used on success, refunded on failure.
export async function POST(request) {
  const a = await authenticateApiRequest(request);
  if (!a.ok) return a.response;

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey || !IDEMPOTENCY_RE.test(idempotencyKey)) {
    return apiError("idempotency_key_required", "Send an Idempotency-Key header (16-64 characters: letters, digits, _ or -). Reuse it when retrying so you are never charged twice.", 400);
  }
  const body = await request.json().catch(() => null);
  const v = validateApiJobBody(body);
  if (!v.ok) return apiError("invalid_request", v.error, 400);
  if (!apiSupports(toolBindings[v.value.toolSlug])) return apiError("tool_not_supported", "This tool is not available through the API.", 400);

  try {
    const { id, created } = await createJob({ user: { uid: a.auth.uid }, ...v.value, idempotencyKey });
    if (created) {
      after(() => runJob(id).catch((e) => console.error("[api] run failed:", e?.message)));
      apiKeys.recordUsage(a.auth, { requests: 0, jobs: 1 }).catch(() => {});
    }
    return apiJson({ id, status: "queued" }, 202);
  } catch (err) {
    if (err instanceof JobError) return apiError(CODES[err.status] || "request_failed", err.message, err.status);
    console.error("[api] create failed:", err?.message);
    return apiError("internal_error", "Could not start the job.", 500);
  }
}
