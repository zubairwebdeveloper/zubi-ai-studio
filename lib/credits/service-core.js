import { CreditError, normalizeWallet, planReserve, planCapture, planRelease, planGrant } from "./ledger.js";

// All wallet changes go through here, each inside ONE transaction. Firestore is injected so the exact same
// code runs against the real database and against the in-memory fake used by the tests.
//   getDb()            -> Firestore-like object (collection().doc(), runTransaction(), where().orderBy().limit().get())
//   serverTimestamp()  -> value to store as a timestamp
//   toTimestamp(ms)    -> value comparable with stored timestamps
export function createCreditService({ getDb, serverTimestamp, toTimestamp, signupCredits, maxDailyLimit = 100_000, now = () => Date.now(), log = console }) {
  const db = () => getDb();
  const ref = {
    wallet: (uid) => db().collection("creditWallets").doc(uid),
    reservation: (id) => db().collection("creditReservations").doc(id),
    txn: (id) => db().collection("creditTransactions").doc(id),
    generation: (id) => db().collection("generations").doc(id),
  };
  const ts = () => serverTimestamp();
  const walletDoc = (w) => ({ ...w, updatedAt: ts() });
  const txnDoc = ({ id, ...rest }) => ({ ...rest, createdAt: ts() });
  const data = (snap) => (snap.exists ? snap.data() : null);

  // Creates the wallet with the one-time welcome grant. Safe to call any number of times, concurrently.
  async function ensureWallet(uid) {
    return db().runTransaction(async (tx) => {
      const wSnap = await tx.get(ref.wallet(uid));
      if (wSnap.exists) return normalizeWallet(wSnap.data(), now());
      const signupId = `signup_${uid}`;
      const tSnap = await tx.get(ref.txn(signupId));
      const plan = planGrant({ wallet: null, existingTxn: data(tSnap), txnId: signupId, uid, amount: signupCredits, type: "grant", reason: "Welcome credits", now: now() });
      if (plan.noop) {
        // The welcome grant was already recorded but the wallet is gone: recreate it EMPTY. Never grant twice.
        const empty = normalizeWallet(null, now());
        tx.set(ref.wallet(uid), walletDoc(empty));
        return empty;
      }
      tx.set(ref.wallet(uid), walletDoc(plan.wallet));
      tx.set(ref.txn(plan.txn.id), txnDoc(plan.txn));
      return plan.wallet;
    });
  }

  async function reserve({ uid, jobId, amount }) {
    await ensureWallet(uid);
    return db().runTransaction(async (tx) => {
      const [w, r] = await Promise.all([tx.get(ref.wallet(uid)), tx.get(ref.reservation(jobId))]);
      const plan = planReserve({ wallet: data(w), reservation: data(r), uid, jobId, amount, now: now() });
      if (plan.noop) return plan.code;
      tx.set(ref.wallet(uid), walletDoc(plan.wallet));
      tx.set(ref.reservation(jobId), { ...plan.reservation, createdAt: ts(), updatedAt: ts() });
      tx.set(ref.txn(plan.txn.id), txnDoc(plan.txn));
      return plan.code;
    });
  }

  // Shared by capture/release: reads reservation, then wallet + job, applies the plan, mirrors the result on the job.
  async function settle(jobId, planFn, extra, creditsCharged) {
    return db().runTransaction(async (tx) => {
      const r = await tx.get(ref.reservation(jobId));
      if (!r.exists) return "no_reservation";
      const reservation = r.data();
      const [w, g] = await Promise.all([tx.get(ref.wallet(reservation.userId)), tx.get(ref.generation(jobId))]);
      const plan = planFn({ wallet: data(w), reservation, jobId, now: now(), ...extra });
      if (plan.noop) {
        if (plan.code === "released_before_capture") log.error(`[credits] job ${jobId} finished after its reservation was released: needs review`);
        return plan.code;
      }
      tx.set(ref.wallet(reservation.userId), walletDoc(plan.wallet));
      tx.update(ref.reservation(jobId), { status: plan.reservation.status, updatedAt: ts() });
      tx.set(ref.txn(plan.txn.id), txnDoc(plan.txn));
      if (g.exists) tx.update(ref.generation(jobId), { creditsCharged: creditsCharged(reservation) });
      return plan.code;
    });
  }

  const capture = (jobId) => settle(jobId, planCapture, {}, (r) => r.amount);
  const release = (jobId, reason) => settle(jobId, planRelease, { reason }, () => 0);

  // Admin/system changes. `idempotencyKey` makes a repeated call a no-op.
  async function grant({ uid, amount, type = "grant", reason, idempotencyKey, actor = "system" }) {
    if (typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) throw new CreditError("bad_key", "A valid idempotency key is required.", 400);
    if (!reason || !String(reason).trim()) throw new CreditError("bad_reason", "A reason is required.", 400);
    await ensureWallet(uid);
    return db().runTransaction(async (tx) => {
      const txnId = `${type}_${idempotencyKey}`;
      const [w, t] = await Promise.all([tx.get(ref.wallet(uid)), tx.get(ref.txn(txnId))]);
      const plan = planGrant({ wallet: data(w), existingTxn: data(t), txnId, uid, amount, type, reason, actor, now: now() });
      if (plan.noop) return plan.code;
      tx.set(ref.wallet(uid), walletDoc(plan.wallet));
      tx.set(ref.txn(plan.txn.id), txnDoc(plan.txn));
      return plan.code;
    });
  }

  async function setDailyLimit(uid, limit) {
    if (!Number.isInteger(limit) || limit < 0 || limit > maxDailyLimit) throw new CreditError("bad_limit", `Enter a whole number from 0 to ${maxDailyLimit}. Use 0 for no limit.`, 400);
    await ensureWallet(uid);
    await db().runTransaction(async (tx) => {
      const w = await tx.get(ref.wallet(uid));
      tx.set(ref.wallet(uid), walletDoc({ ...normalizeWallet(w.data(), now()), dailyLimit: limit }));
    });
  }

  async function getSummary(uid) {
    const w = await ensureWallet(uid);
    return { available: w.available, reserved: w.reserved, lifetimeGranted: w.lifetimeGranted, lifetimeSpent: w.lifetimeSpent, dailyLimit: w.dailyLimit, daySpent: w.daySpent };
  }

  // Read-only: returns null if the user has no wallet yet. Unlike getSummary it NEVER creates one
  // (an admin looking at a user must not hand that user welcome credits).
  async function peek(uid) {
    const snap = await ref.wallet(uid).get();
    if (!snap.exists) return null;
    const w = normalizeWallet(snap.data(), now());
    return { available: w.available, reserved: w.reserved, lifetimeGranted: w.lifetimeGranted, lifetimeSpent: w.lifetimeSpent };
  }

  async function listTransactions(uid, limit = 50) {
    const snap = await db().collection("creditTransactions").where("userId", "==", uid).orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Safety net: reservations still "held" long after the job ended (a crash between job and billing).
  async function reconcileHeld({ maxAgeMs = 15 * 60_000, limit = 50 } = {}) {
    const snap = await db().collection("creditReservations").where("status", "==", "held").where("updatedAt", "<", toTimestamp(now() - maxAgeMs)).limit(limit).get();
    const report = { captured: 0, released: 0, waiting: 0 };
    for (const d of snap.docs) {
      const g = await ref.generation(d.id).get();
      const status = g.exists ? g.data().status : null;
      if (status === "succeeded") { await capture(d.id); report.captured++; }
      else if (status === "failed" || status === null) { await release(d.id, "Reconciled: job did not complete"); report.released++; }
      else report.waiting++; // still queued/processing: the job reconciler owns it
    }
    return report;
  }

  return { ensureWallet, reserve, capture, release, grant, setDailyLimit, getSummary, peek, listTransactions, reconcileHeld };
}
