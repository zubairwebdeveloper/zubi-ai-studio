"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { apiKeys } from "@/lib/api/service";
import { ApiKeyError } from "@/lib/api/keys-core";

// The secret is returned ONCE by createApiKey and never stored in plain text. Revoking is immediate.
export async function createApiKey(input) {
  const user = await requireUser();
  try {
    const k = await apiKeys.create({ uid: user.uid, name: input?.name });
    revalidatePath("/dashboard/developer");
    return { ok: true, key: k.key, name: k.name, prefix: k.prefix, last4: k.last4 };
  } catch (err) {
    if (err instanceof ApiKeyError) return { ok: false, error: err.message };
    console.error("[api-keys] create failed:", err?.message);
    return { ok: false, error: "Could not create the key." };
  }
}

export async function revokeApiKey(input) {
  const user = await requireUser();
  const done = await apiKeys.revoke({ uid: user.uid, publicId: typeof input?.publicId === "string" ? input.publicId : "" });
  revalidatePath("/dashboard/developer");
  return done ? { ok: true } : { ok: false, error: "Key not found." };
}
