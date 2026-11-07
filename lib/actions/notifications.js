"use server";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { idSchema } from "@/lib/validations/dashboard";

export async function markNotificationRead(id) {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Notification not found." };
  const ref = getAdminDb().collection("notifications").doc(parsed.data);
  const snap = await ref.get();
  if (!snap.exists || snap.data().userId !== user.uid) return { ok: false, error: "Notification not found." };
  await ref.update({ read: true });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  const db = getAdminDb();
  const snap = await db.collection("notifications").where("userId", "==", user.uid).where("read", "==", false).limit(400).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
