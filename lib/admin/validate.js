// Pure input validators for admin actions. Everything from the browser is untrusted.
import { ASSIGNABLE_ROLES, adjustLimitFor } from "./permissions.js";

const fail = (error) => ({ ok: false, error });
export const isUid = (v) => typeof v === "string" && /^[A-Za-z0-9]{20,40}$/.test(v);
export const isIdemKey = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(v);
const cleanReason = (v, min) => { const r = typeof v === "string" ? v.trim() : ""; return r.length >= min && r.length <= 200 ? r : null; };

export function validateStatusChange(input) {
  if (!isUid(input?.uid)) return fail("Invalid user.");
  if (input.status !== "active" && input.status !== "suspended") return fail("Invalid status.");
  const reason = cleanReason(input.reason, 5);
  if (!reason) return fail("Enter a reason (5 to 200 characters).");
  return { ok: true, value: { uid: input.uid, status: input.status, reason } };
}

export function validateRoleChange(input) {
  if (!isUid(input?.uid)) return fail("Invalid user.");
  if (!ASSIGNABLE_ROLES.includes(input.role)) return fail("That role cannot be assigned here.");
  return { ok: true, value: { uid: input.uid, role: input.role } };
}

export function validateCreditAdjustment(input, actorRole) {
  if (!isUid(input?.uid)) return fail("Invalid user.");
  const amount = input.amount;
  if (!Number.isInteger(amount) || amount === 0) return fail("Enter a whole number other than 0 (negative removes credits).");
  const limit = adjustLimitFor(actorRole);
  if (Math.abs(amount) > limit) return fail(`Your limit per adjustment is ${limit} credits.`);
  const reason = cleanReason(input.reason, 5);
  if (!reason) return fail("Enter a reason (5 to 200 characters).");
  if (!isIdemKey(input.idempotencyKey)) return fail("Invalid request. Reload the page and try again.");
  return { ok: true, value: { uid: input.uid, amount, reason, idempotencyKey: input.idempotencyKey } };
}

export function validateToolUpdate(input) {
  if (typeof input?.slug !== "string" || !/^[a-z0-9-]{1,100}$/.test(input.slug)) return fail("Invalid tool.");
  if (typeof input.enabled !== "boolean") return fail("Invalid setting.");
  let credits = null;
  if (input.credits !== null && input.credits !== undefined && input.credits !== "") {
    if (!Number.isInteger(input.credits) || input.credits < 1 || input.credits > 10_000) return fail("Credits must be a whole number from 1 to 10000, or empty for the default.");
    credits = input.credits;
  }
  return { ok: true, value: { slug: input.slug, enabled: input.enabled, credits } };
}
