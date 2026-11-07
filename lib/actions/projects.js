"use server";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { idSchema, projectSchema } from "@/lib/validations/dashboard";
import { LIMITS } from "@/config/limits";

const col = () => getAdminDb().collection("projects");

async function ownedProject(id, uid) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return null;
  const snap = await col().doc(parsed.data).get();
  return snap.exists && snap.data().ownerId === uid ? snap.ref : null;
}

export async function createProject(input) {
  const user = await requireUser();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  // Count check is not transactional; a rare race could exceed the cap by a few. Acceptable for a soft limit.
  const count = (await col().where("ownerId", "==", user.uid).count().get()).data().count;
  if (count >= LIMITS.maxProjectsPerUser) return { ok: false, error: `You can have up to ${LIMITS.maxProjectsPerUser} projects.` };
  await col().add({
    ownerId: user.uid, ...parsed.data, assetCount: 0,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath("/dashboard/projects");
  return { ok: true };
}

export async function updateProject(id, input) {
  const user = await requireUser();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const ref = await ownedProject(id, user.uid);
  if (!ref) return { ok: false, error: "Project not found." };
  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath("/dashboard/projects");
  return { ok: true };
}

export async function deleteProject(id) {
  const user = await requireUser();
  const ref = await ownedProject(id, user.uid);
  if (!ref) return { ok: false, error: "Project not found." };
  await ref.delete();
  revalidatePath("/dashboard/projects");
  return { ok: true };
}
