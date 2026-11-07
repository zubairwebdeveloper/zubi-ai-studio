import { redactJobInput } from "../ai/retention.js";

// Scheduled housekeeping, with Firestore injected so it can be tested.
//   redactExpiredInputs : erases job input text + the history preview once `redactAt` has passed
//   deleteExpiredRateLimits : removes spent rate-limit counters (a TTL policy can do this too)
export function createMaintenance({ getDb, toTimestamp, now = () => Date.now() }) {
  const db = () => getDb();

  async function redactExpiredInputs({ limit = 100 } = {}) {
    const snap = await db().collection("generationJobs").where("redactAt", "<=", toTimestamp(now())).limit(limit).get();
    let redacted = 0;
    for (const d of snap.docs) {
      const job = d.data();
      const batch = db().batch();
      batch.update(d.ref, { input: redactJobInput(job.input), redactAt: null }); // null = never matched again
      const gen = db().collection("generations").doc(d.id);
      if ((await gen.get()).exists) batch.update(gen, { inputPreview: "" });
      await batch.commit();
      redacted++;
    }
    return { redacted, more: snap.docs.length === limit };
  }

  async function deleteExpiredRateLimits({ limit = 200 } = {}) {
    const snap = await db().collection("rateLimits").where("expiresAt", "<=", toTimestamp(now())).limit(limit).get();
    const batch = db().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return { deleted: snap.docs.length, more: snap.docs.length === limit };
  }

  return { redactExpiredInputs, deleteExpiredRateLimits };
}
