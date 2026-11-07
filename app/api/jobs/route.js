import { NextResponse, after } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createJobSchema } from "@/lib/validations/ai";
import { createJob, JobError } from "@/lib/ai/jobs";
import { runJob } from "@/lib/ai/run-job";
import { limitRequest } from "@/lib/security/limit";
import { sameOrigin } from "@/lib/security/request";
import { LIMITS } from "@/config/limits";

// Image jobs can take over a minute in the background (honored by hosts that support it, e.g. Vercel).
export const maxDuration = 300;

const json = (body, status = 200, headers) => NextResponse.json(body, { status, headers });

// Creates a job and returns immediately (202). The provider call runs after the response is sent,
// so no HTTP request waits on a provider.
export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Request blocked." }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: "Please log in." }, 401);
  if (!user.emailVerified) return json({ error: "Verify your email first." }, 403);

  const limit = await limitRequest({ bucket: "jobs", id: user.uid, limit: LIMITS.maxJobRequestsPerMinute });
  if (!limit.ok) return json({ error: "Too many requests. Slow down a little." }, 429, { "Retry-After": String(limit.retryAfter) });

  const parsed = createJobSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  try {
    const { id, created } = await createJob({ user, ...parsed.data });
    if (created) after(() => runJob(id).catch((e) => console.error("[jobs] run failed:", e?.message)));
    return json({ id, status: "queued" }, 202);
  } catch (err) {
    if (err instanceof JobError) return json({ error: err.message }, err.status);
    console.error("[jobs] create failed:", err?.message);
    return json({ error: "Could not start the job." }, 500);
  }
}
