import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const col = () => getAdminDb().collection("documentTexts");

// Document id = asset id, so deleting the asset deletes its text (see deleteAsset). Server-only collection.
export async function saveDocumentText({ assetId, ownerId, text, pageCount, totalPages, truncated }) {
  await col().doc(assetId).set({ ownerId, text, pageCount, totalPages, truncated, createdAt: FieldValue.serverTimestamp() });
}

export async function loadDocumentText(assetId, uid) {
  if (!assetId) return null;
  const snap = await col().doc(assetId).get();
  return snap.exists && snap.data().ownerId === uid ? snap.data() : null;
}

export async function documentExists(assetId, uid) {
  const snap = await col().doc(assetId).select("ownerId").get();
  return snap.exists && snap.data().ownerId === uid;
}
