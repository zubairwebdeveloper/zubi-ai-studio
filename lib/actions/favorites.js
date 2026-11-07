"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { getTool } from "@/lib/tools/registry";
import { slugSchema } from "@/lib/validations/dashboard";
import { LIMITS } from "@/config/limits";
import { z } from "zod";

export async function toggleFavorite(slug) {
  const user = await requireUser();
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success || !getTool(parsed.data)) return { ok: false, error: "That tool does not exist." };

  const col = getAdminDb().collection("favorites");
  const ref = col.doc(`${user.uid}_${parsed.data}`);
  if ((await ref.get()).exists) {
    await ref.delete();
    return { ok: true, favorited: false };
  }
  const count = (await col.where("uid", "==", user.uid).count().get()).data().count;
  if (count >= LIMITS.maxFavoritesPerUser) return { ok: false, error: `You can save up to ${LIMITS.maxFavoritesPerUser} favorites.` };
  await ref.set({ uid: user.uid, toolSlug: parsed.data, createdAt: FieldValue.serverTimestamp() });
  return { ok: true, favorited: true };
}

// One-time import of favorites saved in the browser before the user signed in.
export async function importLocalFavorites(slugs) {
  const user = await requireUser();
  const parsed = z.array(z.string()).max(LIMITS.maxFavoritesPerUser).safeParse(slugs);
  if (!parsed.success) return { ok: false, error: "Invalid favorites list." };
  const valid = [...new Set(parsed.data)].filter((s) => getTool(s));
  const db = getAdminDb();
  const batch = db.batch();
  for (const s of valid) {
    batch.set(db.collection("favorites").doc(`${user.uid}_${s}`), { uid: user.uid, toolSlug: s, createdAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  await batch.commit();
  return { ok: true, imported: valid };
}
