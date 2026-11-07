"use server";
import { revalidatePath } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validations/dashboard";

export async function updateProfileName(input) {
  const user = await requireUser({ verified: false });
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await getAdminAuth().updateUser(user.uid, { displayName: parsed.data.name });
  await getAdminDb().collection("users").doc(user.uid).update({ displayName: parsed.data.name });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
