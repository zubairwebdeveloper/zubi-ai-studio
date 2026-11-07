import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { toolBindings } from "@/config/tool-bindings";
import { getEffectiveTool } from "@/lib/admin/tool-store";
import { resolveModelForTool } from "@/lib/ai/availability";
import { jobIdFor } from "@/lib/ai/ids";
import { redactAtMs } from "@/lib/ai/retention";
import { normalizeOptions, normalizeHistory } from "@/lib/ai/options";
import { getOwnedAssetMeta } from "@/lib/storage";
import { documentExists } from "@/lib/documents/store";
import { credits } from "@/lib/credits/service";
import { CreditError } from "@/lib/credits/ledger";
import { LIMITS } from "@/config/limits";

export class JobError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

const count = async (q) => (await q.count().get()).data().count;

// Validates everything server-side, reserves the credits, then creates the job pair.
// Credits are reserved here, captured when the job succeeds and refunded if it fails (see run-job.js).
// The daily job caps below are abuse guards that apply in addition to credits.
export async function createJob({ user, toolSlug, text = "", assetId, options, history, idempotencyKey }) {
  const binding = toolBindings[toolSlug];
  // Registry tool + admin overrides (enabled flag and price). Throws if the config cannot be read: fail closed.
  const effective = await getEffectiveTool(toolSlug);
  if (!binding || !effective) throw new JobError("This tool is not available.", 404);
  if (!effective.enabled) throw new JobError("This tool is currently turned off.", 503);
  const model = resolveModelForTool(toolSlug);
  if (!model) throw new JobError("This tool is not available right now.", 503);

  const inputs = binding.inputs || ["text"];
  const needsText = inputs.includes("text");
  const needsImage = inputs.includes("image");
  const needsDocument = inputs.includes("document");
  if (needsText && !text) throw new JobError("Enter some text.", 400);
  if (needsText && text.length > binding.maxInputChars) throw new JobError(`Input is too long (max ${binding.maxInputChars} characters).`, 400);
  if ((needsImage || needsDocument) && !assetId) throw new JobError(needsDocument ? "Upload a PDF first." : "Upload an image first.", 400);

  const db = getAdminDb();
  const id = jobIdFor(user.uid, idempotencyKey);
  const jobRef = db.collection("generationJobs").doc(id);
  const genRef = db.collection("generations").doc(id);
  if ((await jobRef.get()).exists) return { id, created: false }; // duplicate request: return the same job

  // Same error for "missing" and "not yours".
  if (needsImage) {
    const asset = await getOwnedAssetMeta(assetId, user.uid);
    if (!asset || !asset.contentType?.startsWith("image/")) throw new JobError("That image could not be found. Upload it again.", 400);
  }
  if (needsDocument) {
    const asset = await getOwnedAssetMeta(assetId, user.uid);
    if (!asset || asset.contentType !== "application/pdf" || !(await documentExists(assetId, user.uid))) {
      throw new JobError("That document could not be found. Upload it again.", 400);
    }
  }

  const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
  const mine = () => db.collection("generations").where("userId", "==", user.uid).where("createdAt", ">=", startOfDay);
  if ((await count(mine())) >= LIMITS.maxJobsPerUserPerDay) throw new JobError(`Daily limit reached (${LIMITS.maxJobsPerUserPerDay} generations per day).`, 429);
  const typeCap = LIMITS.dailyCapsByType[binding.kind];
  if (typeCap && (await count(mine().where("type", "==", binding.kind))) >= typeCap) {
    throw new JobError(`Daily ${binding.kind} limit reached (${typeCap} per day).`, 429);
  }

  // Reserve credits at the SERVER-SIDE price. Idempotent per job id, so a retried request never charges twice.
  try {
    await credits.reserve({ uid: user.uid, jobId: id, amount: effective.credits });
  } catch (err) {
    if (err instanceof CreditError) throw new JobError(err.message, err.status);
    throw err;
  }

  const batch = db.batch();
  batch.create(jobRef, {
    userId: user.uid, toolSlug, kind: binding.kind, modelId: model.id, providerId: model.providerId,
    input: {
      text: needsText ? text : "",
      assetId: needsImage || needsDocument ? assetId : null,
      options: normalizeOptions(binding, options),
      history: binding.mode === "chat" ? normalizeHistory(history) : [],
    },
    status: "queued", attempts: 0, providerJobId: null, nextPollAt: null,
    usage: null, latencyMs: null, lastError: null, needsReview: false,
    redactAt: Timestamp.fromMillis(redactAtMs(Date.now(), LIMITS.inputRetentionDays)), // input text is erased after this (see maintenance)
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  batch.create(genRef, {
    userId: user.uid, toolSlug, toolName: effective.name, type: binding.kind, status: "queued",
    inputPreview: needsText ? text.slice(0, 200) : needsDocument ? "PDF document" : "Image", output: null, error: null,
    creditsEstimated: effective.credits, creditsCharged: null,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (err) {
    if (err?.code === 6 || /ALREADY_EXISTS/.test(String(err?.message))) return { id, created: false }; // lost a race: the winner's reservation is the same one
    await credits.release(id, "Job could not be created").catch((e) => console.error("[credits] refund failed:", e?.message));
    throw err;
  }
  return { id, created: true };
}
