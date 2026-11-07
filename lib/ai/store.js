import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const db = () => getAdminDb();
const jobs = () => db().collection("generationJobs");
const gens = () => db().collection("generations");
const now = () => FieldValue.serverTimestamp();

// Firestore implementation of the engine's store. Every state change is a transaction on both documents:
// generationJobs (internal: provider ids, attempts, usage) and generations (what the user sees).
export const firestoreStore = {
  // Atomically moves queued -> processing (or a due poll). Returns null if someone else owns the job.
  async claim(id) {
    return db().runTransaction(async (tx) => {
      const ref = jobs().doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const j = snap.data();
      const due = j.status === "processing" && j.providerJobId && (j.nextPollAt || 0) <= Date.now();
      if (j.status !== "queued" && !due) return null;
      tx.update(ref, { status: "processing", attempts: FieldValue.increment(1), updatedAt: now() });
      tx.update(gens().doc(id), { status: "processing", updatedAt: now() });
      return { id, ...j, status: "processing" };
    });
  },

  async progress(id, { providerJobId, nextPollAt }) {
    await jobs().doc(id).update({ providerJobId, nextPollAt, updatedAt: now() });
  },

  async complete(id, { output, usage, latencyMs }) {
    await db().runTransaction(async (tx) => {
      const ref = jobs().doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().status !== "processing") return; // never overwrite a terminal state
      tx.update(ref, { status: "succeeded", usage, latencyMs, nextPollAt: null, updatedAt: now() });
      tx.update(gens().doc(id), { status: "succeeded", output, error: null, updatedAt: now() });
    });
  },

  async fail(id, { publicMessage, internalMessage, code, retryable, needsReview }) {
    await db().runTransaction(async (tx) => {
      const ref = jobs().doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data().status === "succeeded") return;
      tx.update(ref, { status: "failed", lastError: { code, message: internalMessage, retryable }, needsReview, nextPollAt: null, updatedAt: now() });
      tx.update(gens().doc(id), { status: "failed", error: publicMessage, updatedAt: now() });
    });
  },
};
