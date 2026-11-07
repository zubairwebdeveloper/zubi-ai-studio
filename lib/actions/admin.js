"use server";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { adminActor } from "@/lib/admin/guard";
import { auditEntry } from "@/lib/admin/audit";
import { canActOn, canAssignRole } from "@/lib/admin/permissions";
import { validateStatusChange, validateRoleChange, validateCreditAdjustment, validateToolUpdate } from "@/lib/admin/validate";
import { invalidateToolOverrides } from "@/lib/admin/tool-store";
import { credits } from "@/lib/credits/service";
import { CreditError } from "@/lib/credits/ledger";
import { getTool } from "@/lib/tools/registry";

// Every action: 1) permission from the database role, 2) validate input, 3) outranking rule, 4) change + audit.
const FORBIDDEN = { ok: false, error: "You are not allowed to do that." };
const NOT_FOUND = { ok: false, error: "User not found." };
const audits = () => getAdminDb().collection("auditLogs");

async function loadUser(uid) {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  return snap.exists ? { ref: snap.ref, ...snap.data() } : null;
}

export async function setUserStatus(input) {
  const actor = await adminActor("users.suspend");
  if (!actor) return FORBIDDEN;
  const v = validateStatusChange(input);
  if (!v.ok) return { ok: false, error: v.error };
  if (v.value.uid === actor.uid) return { ok: false, error: "You cannot change your own account." };
  const target = await loadUser(v.value.uid);
  if (!target) return NOT_FOUND;
  if (!canActOn(actor.role, target.role)) return FORBIDDEN;

  const batch = getAdminDb().batch();
  batch.update(target.ref, { status: v.value.status, statusUpdatedAt: FieldValue.serverTimestamp() });
  batch.set(audits().doc(), auditEntry({ actor, action: v.value.status === "suspended" ? "user.suspend" : "user.unsuspend", targetType: "user", targetId: v.value.uid,
    details: { reason: v.value.reason, from: target.status || "active", to: v.value.status } }));
  await batch.commit();
  // Sessions are also refused because status is checked on every request; this ends refresh tokens too.
  if (v.value.status === "suspended") await getAdminAuth().revokeRefreshTokens(v.value.uid).catch((e) => console.error("[admin] revoke failed:", e?.message));
  revalidatePath("/admin/users", "layout");
  return { ok: true };
}

export async function setUserRole(input) {
  const actor = await adminActor("roles.manage");
  if (!actor) return FORBIDDEN;
  const v = validateRoleChange(input);
  if (!v.ok) return { ok: false, error: v.error };
  if (v.value.uid === actor.uid) return { ok: false, error: "You cannot change your own role." };
  const target = await loadUser(v.value.uid);
  if (!target) return NOT_FOUND;
  if (!canActOn(actor.role, target.role) || !canAssignRole(actor.role, target.role, v.value.role)) return FORBIDDEN;

  const batch = getAdminDb().batch();
  batch.update(target.ref, { role: v.value.role, roleUpdatedAt: FieldValue.serverTimestamp() });
  batch.set(audits().doc(), auditEntry({ actor, action: "user.role", targetType: "user", targetId: v.value.uid, details: { from: target.role, to: v.value.role } }));
  await batch.commit();
  revalidatePath("/admin/users", "layout");
  return { ok: true };
}

export async function adjustUserCredits(input) {
  const actor = await adminActor("credits.adjust");
  if (!actor) return FORBIDDEN;
  const v = validateCreditAdjustment(input, actor.role);
  if (!v.ok) return { ok: false, error: v.error };
  if (v.value.uid === actor.uid) return { ok: false, error: "You cannot adjust your own credits." };
  const target = await loadUser(v.value.uid);
  if (!target) return NOT_FOUND;
  if (!canActOn(actor.role, target.role)) return FORBIDDEN;

  let result;
  try {
    result = await credits.grant({ uid: v.value.uid, amount: v.value.amount, type: "adjust", reason: v.value.reason, idempotencyKey: v.value.idempotencyKey, actor: `admin:${actor.uid}` });
  } catch (err) {
    if (err instanceof CreditError) return { ok: false, error: err.message };
    console.error("[admin] adjust failed:", err?.message);
    return { ok: false, error: "Could not adjust credits." };
  }
  // The ledger entry (actor, reason, amount) is the primary record; this audit entry is written right after it.
  if (result !== "duplicate") {
    await audits().add(auditEntry({ actor, action: "credits.adjust", targetType: "user", targetId: v.value.uid, details: { amount: v.value.amount, reason: v.value.reason } }))
      .catch((e) => console.error("[admin] AUDIT WRITE FAILED for credits.adjust:", e?.message));
  }
  revalidatePath("/admin", "layout");
  return { ok: true, duplicate: result === "duplicate" };
}

export async function updateToolConfig(input) {
  const actor = await adminActor("tools.manage");
  if (!actor) return FORBIDDEN;
  const v = validateToolUpdate(input);
  if (!v.ok) return { ok: false, error: v.error };
  if (!getTool(v.value.slug)) return { ok: false, error: "Unknown tool." };

  const db = getAdminDb();
  const ref = db.collection("tools").doc(v.value.slug);
  const before = await ref.get();
  const batch = db.batch();
  batch.set(ref, { slug: v.value.slug, enabled: v.value.enabled, credits: v.value.credits, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
  batch.set(audits().doc(), auditEntry({ actor, action: "tool.config", targetType: "tool", targetId: v.value.slug,
    details: { from: before.exists ? { enabled: before.data().enabled, credits: before.data().credits ?? null } : null, to: { enabled: v.value.enabled, credits: v.value.credits } } }));
  await batch.commit();
  invalidateToolOverrides();
  revalidatePath("/admin/tools");
  return { ok: true };
}
