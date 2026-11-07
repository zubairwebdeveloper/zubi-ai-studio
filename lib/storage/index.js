import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { extFor } from "@/lib/storage/validate";
import { LIMITS } from "@/config/limits";

export class StorageError extends Error {
  constructor(message, status = 500) { super(message); this.status = status; }
}

const assets = () => getAdminDb().collection("projectAssets");
const DAY = 86_400_000;

// Stores bytes in Firebase Storage (server only) and records ownership in projectAssets.
// Clients can never read the bucket directly; every download goes through /api/assets/[id].
export async function saveBuffer({ uid, kind, buffer, contentType, source = null }) {
  const ext = extFor(contentType);
  if (ext === "bin") throw new StorageError("Unsupported file type.", 400);
  const db = getAdminDb();

  const used = (await db.collection("users").doc(uid).get()).data()?.storageBytes || 0;
  if (used + buffer.length > LIMITS.maxStorageBytesPerUser) throw new StorageError("Storage limit reached. Delete old files and try again.", 413);

  const ref = assets().doc();
  const path = `users/${uid}/${kind}/${ref.id}.${ext}`;
  const file = getAdminBucket().file(path);
  await file.save(buffer, { contentType, resumable: false, metadata: { cacheControl: "private, no-store" } });

  try {
    const days = kind === "upload" ? LIMITS.uploadRetentionDays : LIMITS.outputRetentionDays;
    const batch = db.batch();
    batch.create(ref, {
      ownerId: uid, projectId: null, kind, path, contentType, size: buffer.length, source,
      createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + days * DAY),
    });
    batch.set(db.collection("users").doc(uid), { storageBytes: FieldValue.increment(buffer.length) }, { merge: true });
    await batch.commit();
  } catch (err) {
    await file.delete().catch(() => {}); // do not leave an unowned file behind
    throw err;
  }
  return { id: ref.id, contentType, size: buffer.length };
}

// Returns the asset only if it belongs to `uid`. Same result for "missing" and "someone else's".
export async function loadOwnedAsset(id, uid) {
  const snap = await assets().doc(id).get();
  if (!snap.exists || snap.data().ownerId !== uid) return null;
  const meta = snap.data();
  const [buffer] = await getAdminBucket().file(meta.path).download();
  return { id, contentType: meta.contentType, size: meta.size, kind: meta.kind, buffer };
}

export async function getOwnedAssetMeta(id, uid) {
  const snap = await assets().doc(id).get();
  return snap.exists && snap.data().ownerId === uid ? { id, ...snap.data() } : null;
}

// Deletes file, record and quota usage. `uid` null = trusted cleanup job (expired assets).
export async function deleteAsset(id, uid = null) {
  const ref = assets().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const meta = snap.data();
  if (uid && meta.ownerId !== uid) return false;
  await getAdminBucket().file(meta.path).delete({ ignoreNotFound: true });
  const db = getAdminDb();
  const batch = db.batch();
  batch.delete(ref);
  batch.delete(db.collection("documentTexts").doc(id)); // extracted PDF text lives and dies with the file
  batch.set(db.collection("users").doc(meta.ownerId), { storageBytes: FieldValue.increment(-meta.size) }, { merge: true });
  await batch.commit();
  return true;
}
