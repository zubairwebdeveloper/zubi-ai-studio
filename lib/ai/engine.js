import { withRetry } from "./retry.js";
import { ProviderError } from "./errors.js";

// Provider-independent job executor. Dependencies are injected so the logic is testable without Firebase.
//   store:      { claim(id), progress(id, patch), complete(id, patch), fail(id, patch) }
//   getAdapter: (job) => { submit({job}), poll({job}) }  -> { state: "succeeded"|"processing", ... }
//   billing:    optional { capture(jobId), release(jobId, reason) }. Called once the job reaches a final state.
//               A billing failure is logged but never changes the job's result; the credit reconciler repairs it.
async function bill(hook, label, jobId, ...rest) {
  if (!hook) return;
  try { await hook(jobId, ...rest); } catch (err) { console.error(`[billing] ${label} failed for job ${jobId}:`, err?.message); }
}

export async function executeJob({ jobId, store, getAdapter, billing, maxRetries = 2, sleep }) {
  // claim() is atomic: two workers racing for the same job cannot both run it.
  const job = await store.claim(jobId);
  if (!job) return { status: "skipped" };
  const started = Date.now();
  try {
    const adapter = getAdapter(job);
    const call = job.providerJobId ? () => adapter.poll({ job }) : () => adapter.submit({ job });
    const result = await withRetry(call, { retries: maxRetries, sleep });

    if (result?.state === "succeeded") {
      await store.complete(jobId, { output: result.output, usage: result.usage || null, latencyMs: Date.now() - started });
      await bill(billing?.capture, "capture", jobId);
      return { status: "succeeded" };
    }
    if (result?.state === "processing" && result.providerJobId) {
      await store.progress(jobId, { providerJobId: result.providerJobId, nextPollAt: Date.now() + (result.pollAfterSec ?? 5) * 1000 });
      return { status: "processing" };
    }
    throw new ProviderError("Adapter returned an unknown result", { code: "bad_adapter_result" });
  } catch (err) {
    await store.fail(jobId, {
      publicMessage: err?.publicMessage || "The request could not be completed.",
      internalMessage: String(err?.message || err).slice(0, 500),
      code: err?.code || "error",
      retryable: !!err?.retryable,
      needsReview: !!err?.needsReview,
    });
    await bill(billing?.release, "release", jobId, "Job failed: credits refunded"); // the user is never charged for a failed job
    return { status: "failed" };
  }
}
