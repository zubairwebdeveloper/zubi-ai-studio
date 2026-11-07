import { generateApiKey, hashKey } from "./keys.js";

export class ApiKeyError extends Error {
  constructor(code, message, status = 400) { super(message); this.name = "ApiKeyError"; this.code = code; this.status = status; }
}

const day = (t) => new Date(t).toISOString().slice(0, 10);
const LAST_USED_REFRESH_MS = 60 * 60_000;

// Database is injected so the same code runs on Firestore and on the test fake.
//   apiKeys/{sha256(key)}            : { ownerId, publicId, name, prefix, last4, createdAt, lastUsedAt, revokedAt }
//   apiUsage/{publicId}_{YYYY-MM-DD} : { publicId, ownerId, day, requests, jobsCreated }
export function createApiKeyService({ getDb, serverTimestamp, increment, now = () => Date.now(), maxKeys = 5, random }) {
  const db = () => getDb();
  const keys = () => db().collection("apiKeys");
  const owned = async (uid) => (await keys().where("ownerId", "==", uid).get()).docs;
  const view = (d) => { const x = d.data(); return { publicId: x.publicId, name: x.name, prefix: x.prefix, last4: x.last4, createdAt: x.createdAt ?? null, lastUsedAt: x.lastUsedAt ?? null, revoked: !!x.revokedAt }; };

  async function create({ uid, name }) {
    const clean = typeof name === "string" ? name.trim() : "";
    if (clean.length < 1 || clean.length > 60) throw new ApiKeyError("bad_name", "Enter a name (1 to 60 characters).");
    const active = (await owned(uid)).filter((d) => !d.data().revokedAt).length;
    if (active >= maxKeys) throw new ApiKeyError("too_many_keys", `You can have up to ${maxKeys} active keys. Revoke one first.`, 429);
    const k = generateApiKey(random);
    await keys().doc(k.hash).set({ ownerId: uid, publicId: k.publicId, name: clean, prefix: k.prefix, last4: k.last4, createdAt: serverTimestamp(), lastUsedAt: null, revokedAt: null });
    return { key: k.key, publicId: k.publicId, prefix: k.prefix, last4: k.last4, name: clean }; // the only time the secret exists outside the caller
  }

  async function list(uid) {
    return (await owned(uid)).map(view).sort((a, b) => Number(a.revoked) - Number(b.revoked));
  }

  // The same `false` for "not yours" and "does not exist"; revoking twice is harmless.
  async function revoke({ uid, publicId }) {
    const doc = (await owned(uid)).find((d) => d.data().publicId === publicId);
    if (!doc) return false;
    if (!doc.data().revokedAt) await keys().doc(doc.id).update({ revokedAt: serverTimestamp() });
    return true;
  }

  // -> { uid, publicId } or null. Unknown, malformed, revoked and suspended-owner all give the same null.
  async function authenticate(rawKey) {
    if (typeof rawKey !== "string") return null;
    const ref = keys().doc(hashKey(rawKey));
    const snap = await ref.get();
    if (!snap.exists) return null;
    const k = snap.data();
    if (k.revokedAt) return null;
    const owner = await db().collection("users").doc(k.ownerId).get();
    if (!owner.exists || owner.data().status !== "active") return null;
    if (!k.lastUsedAt || now() - Number(k.lastUsedAt) > LAST_USED_REFRESH_MS) {
      await ref.update({ lastUsedAt: now() }).catch(() => {}); // best effort, at most about once an hour
    }
    return { uid: k.ownerId, publicId: k.publicId };
  }

  async function recordUsage(auth, { requests = 1, jobs = 0 } = {}) {
    const d = day(now());
    await db().collection("apiUsage").doc(`${auth.publicId}_${d}`).set(
      { publicId: auth.publicId, ownerId: auth.uid, day: d, requests: increment(requests), jobsCreated: increment(jobs) }, { merge: true });
  }

  async function usage(uid, limit = 60) {
    const snap = await db().collection("apiUsage").where("ownerId", "==", uid).orderBy("day", "desc").limit(limit).get();
    return snap.docs.map((x) => { const u = x.data(); return { publicId: u.publicId, day: u.day, requests: u.requests || 0, jobsCreated: u.jobsCreated || 0 }; });
  }

  return { create, list, revoke, authenticate, recordUsage, usage };
}
