// Pure credit accounting. No Firebase, no clock except what is passed in, so every rule is unit-testable.
// All amounts are positive integers (credits are never fractional). Each plan* function returns the NEW
// documents to write; the service applies them inside one Firestore transaction.
//
// Wallet:  available + reserved + lifetimeSpent + lifetimeRemoved === lifetimeGranted   (always)
//   reserve : available -> reserved          (a job starts)
//   capture : reserved  -> spent             (the job succeeded)
//   release : reserved  -> available         (the job failed: refund)

export class CreditError extends Error {
  constructor(code, message, status = 400) { super(message); this.name = "CreditError"; this.code = code; this.status = status; }
}

const MAX_AMOUNT = 1_000_000;
const NUM = ["available", "reserved", "lifetimeGranted", "lifetimeSpent", "lifetimeRemoved", "dailyLimit", "daySpent"];

export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export const emptyWallet = (now = Date.now()) => ({
  available: 0, reserved: 0, lifetimeGranted: 0, lifetimeSpent: 0, lifetimeRemoved: 0, dailyLimit: 0, dayKey: dayKey(now), daySpent: 0,
});

// Fills defaults, resets the per-day counter on a new UTC day, and refuses to work on a corrupt wallet.
export function normalizeWallet(wallet, now = Date.now()) {
  const w = { ...emptyWallet(now), ...(wallet || {}) };
  for (const k of NUM) {
    if (!Number.isInteger(w[k]) || w[k] < 0) throw new CreditError("corrupt_wallet", "Wallet data is invalid. Contact support.", 500);
  }
  if (w.dayKey !== dayKey(now)) { w.dayKey = dayKey(now); w.daySpent = 0; }
  return w;
}

function assertAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) throw new CreditError("bad_amount", "Invalid credit amount.", 400);
}

const txn = (id, uid, type, amount, delta, w, extra = {}) => ({
  id, userId: uid, type, amount, delta, availableAfter: w.available, reservedAfter: w.reserved,
  refType: null, refId: null, reason: "", actor: "system", ...extra,
});

export function planReserve({ wallet, reservation, uid, jobId, amount, now = Date.now() }) {
  assertAmount(amount);
  if (reservation) {
    if (reservation.userId !== uid) throw new CreditError("forbidden", "Not allowed.", 403);
    return { noop: true, code: `already_${reservation.status}`, wallet };
  }
  const w = normalizeWallet(wallet, now);
  if (w.available < amount) {
    throw new CreditError("insufficient", `Not enough credits (this needs ${amount}, you have ${w.available}).`, 402);
  }
  if (w.dailyLimit > 0 && w.daySpent + amount > w.dailyLimit) {
    throw new CreditError("daily_limit", `This would pass your daily spending limit of ${w.dailyLimit} credits.`, 429);
  }
  const next = { ...w, available: w.available - amount, reserved: w.reserved + amount, daySpent: w.daySpent + amount };
  return {
    noop: false, code: "reserved", wallet: next,
    reservation: { userId: uid, jobId, amount, status: "held", dayKey: w.dayKey },
    txn: txn(`res_${jobId}`, uid, "reserve", amount, -amount, next, { refType: "job", refId: jobId, reason: "Held for a job" }),
  };
}

export function planCapture({ wallet, reservation, jobId, now = Date.now() }) {
  if (!reservation) return { noop: true, code: "no_reservation", wallet };
  if (reservation.status === "captured") return { noop: true, code: "already_captured", wallet };
  if (reservation.status === "released") return { noop: true, code: "released_before_capture", wallet }; // flag for review; never double-charge
  const w = normalizeWallet(wallet, now);
  if (w.reserved < reservation.amount) throw new CreditError("corrupt_wallet", "Reserved balance is lower than the reservation.", 500);
  const next = { ...w, reserved: w.reserved - reservation.amount, lifetimeSpent: w.lifetimeSpent + reservation.amount };
  return {
    noop: false, code: "captured", wallet: next, reservation: { ...reservation, status: "captured" },
    txn: txn(`cap_${jobId}`, reservation.userId, "capture", reservation.amount, 0, next, { refType: "job", refId: jobId, reason: "Used by a completed job" }),
  };
}

export function planRelease({ wallet, reservation, jobId, reason = "Job did not complete", now = Date.now() }) {
  if (!reservation) return { noop: true, code: "no_reservation", wallet };
  if (reservation.status === "released") return { noop: true, code: "already_released", wallet };
  if (reservation.status === "captured") return { noop: true, code: "already_captured", wallet }; // a finished job is never refunded here
  const w = normalizeWallet(wallet, now);
  if (w.reserved < reservation.amount) throw new CreditError("corrupt_wallet", "Reserved balance is lower than the reservation.", 500);
  const sameDay = reservation.dayKey === w.dayKey;
  const next = {
    ...w, reserved: w.reserved - reservation.amount, available: w.available + reservation.amount,
    daySpent: sameDay ? Math.max(0, w.daySpent - reservation.amount) : w.daySpent,
  };
  return {
    noop: false, code: "released", wallet: next, reservation: { ...reservation, status: "released" },
    txn: txn(`rel_${jobId}`, reservation.userId, "release", reservation.amount, reservation.amount, next, { refType: "job", refId: jobId, reason: String(reason).slice(0, 200) }),
  };
}

// type "grant": positive amount (welcome credits, promotions, purchases).
// type "adjust": signed, non-zero (admin correction). Removing more than `available` is refused.
export function planGrant({ wallet, existingTxn, txnId, uid, amount, type = "grant", reason = "", actor = "system", now = Date.now() }) {
  if (existingTxn) return { noop: true, code: "duplicate", wallet };
  if (type === "grant") assertAmount(amount);
  else if (type === "adjust") { if (amount === 0) throw new CreditError("bad_amount", "Invalid credit amount.", 400); assertAmount(Math.abs(amount)); }
  else throw new CreditError("bad_type", "Invalid transaction type.", 400);

  const w = normalizeWallet(wallet, now);
  let next;
  if (amount > 0) next = { ...w, available: w.available + amount, lifetimeGranted: w.lifetimeGranted + amount };
  else {
    const remove = -amount;
    if (w.available < remove) throw new CreditError("insufficient", "Cannot remove more than the available balance.", 400);
    next = { ...w, available: w.available - remove, lifetimeRemoved: w.lifetimeRemoved + remove };
  }
  return { noop: false, code: type === "grant" ? "granted" : "adjusted", wallet: next,
    txn: txn(txnId, uid, type, Math.abs(amount), amount, next, { reason: String(reason).slice(0, 200), actor }) };
}

export const conserved = (w) => w.available + w.reserved + w.lifetimeSpent + w.lifetimeRemoved === w.lifetimeGranted;
