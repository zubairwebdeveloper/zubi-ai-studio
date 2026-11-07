"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { credits } from "@/lib/credits/service";
import { CreditError } from "@/lib/credits/ledger";

// A user can cap their own daily spending (0 = no limit). Validation lives in the credit service.
export async function setDailyLimit(input) {
  const user = await requireUser();
  try {
    await credits.setDailyLimit(user.uid, Number(input?.limit));
  } catch (err) {
    if (err instanceof CreditError) return { ok: false, error: err.message };
    console.error("[credits] setDailyLimit failed:", err?.message);
    return { ok: false, error: "Could not save your limit." };
  }
  revalidatePath("/dashboard/credits");
  return { ok: true };
}
