// Run: npm run test:credits  (no Firebase, no network)
// The REAL service code runs against an in-memory Firestore fake that enforces transaction rules.
import fs from "node:fs";
import path from "node:path";
import { CreditError, planReserve, planCapture, planRelease, planGrant, normalizeWallet, emptyWallet, conserved, dayKey } from "../lib/credits/ledger.js";
import { createCreditService } from "../lib/credits/service-core.js";
import { executeJob } from "../lib/ai/engine.js";
import { fromHttpStatus } from "../lib/ai/errors.js";
import { fakeFirestore } from "./lib/fake-firestore.mjs";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };
const read = (f) => fs.readFileSync(f, "utf8");
const throwsCode = (fn) => { try { fn(); } catch (e) { return e?.code; } return null; };
const athrowsCode = async (fn) => { try { await fn(); } catch (e) { return e?.code; } return null; };

// ======================= A. pure ledger =======================
const NOW = Date.parse("2026-11-04T10:00:00Z");
const W = (o = {}) => normalizeWallet({ available: 100, lifetimeGranted: 100, ...o }, NOW);

{ const p = planReserve({ wallet: W(), reservation: null, uid: "u", jobId: "j1", amount: 30, now: NOW });
  check("reserve moves available -> reserved", p.wallet.available === 70 && p.wallet.reserved === 30 && p.wallet.daySpent === 30 && p.reservation.status === "held");
  check("reserve writes a ledger entry", p.txn.type === "reserve" && p.txn.delta === -30 && p.txn.id === "res_j1" && p.txn.availableAfter === 70);
  check("conserved after reserve", conserved(p.wallet));
  const c = planCapture({ wallet: p.wallet, reservation: p.reservation, jobId: "j1", now: NOW });
  check("capture spends the reservation", c.wallet.reserved === 0 && c.wallet.available === 70 && c.wallet.lifetimeSpent === 30 && c.reservation.status === "captured" && conserved(c.wallet));
  const r = planRelease({ wallet: p.wallet, reservation: p.reservation, jobId: "j1", now: NOW });
  check("release refunds everything", r.wallet.available === 100 && r.wallet.reserved === 0 && r.wallet.lifetimeSpent === 0 && r.wallet.daySpent === 0 && conserved(r.wallet));
  check("capture after capture is a no-op", planCapture({ wallet: c.wallet, reservation: c.reservation, jobId: "j1", now: NOW }).noop);
  check("release after capture never refunds a finished job", planRelease({ wallet: c.wallet, reservation: c.reservation, jobId: "j1", now: NOW }).code === "already_captured");
  check("release twice is a no-op", planRelease({ wallet: r.wallet, reservation: r.reservation, jobId: "j1", now: NOW }).noop);
  check("capture after release never double-charges", planCapture({ wallet: r.wallet, reservation: r.reservation, jobId: "j1", now: NOW }).code === "released_before_capture");
  check("duplicate reserve is a no-op", planReserve({ wallet: p.wallet, reservation: p.reservation, uid: "u", jobId: "j1", amount: 30, now: NOW }).noop);
  check("another user cannot reuse a reservation", throwsCode(() => planReserve({ wallet: p.wallet, reservation: p.reservation, uid: "evil", jobId: "j1", amount: 30, now: NOW })) === "forbidden");
  check("capture/release with no reservation is a safe no-op", planCapture({ wallet: W(), reservation: null, jobId: "x" }).noop && planRelease({ wallet: W(), reservation: null, jobId: "x" }).noop); }

check("insufficient credits refused with exact numbers", (() => { try { planReserve({ wallet: W({ available: 5 }), reservation: null, uid: "u", jobId: "j", amount: 6, now: NOW }); } catch (e) { return e.code === "insufficient" && e.status === 402 && /needs 6/.test(e.message) && /have 5/.test(e.message); } })());
check("exact balance can be spent down to zero", planReserve({ wallet: W({ available: 5 }), reservation: null, uid: "u", jobId: "j", amount: 5, now: NOW }).wallet.available === 0);
for (const bad of [0, -1, 1.5, NaN, Infinity, "5", null, undefined, 2_000_000])
  check(`bad amount rejected: ${String(bad)}`, throwsCode(() => planReserve({ wallet: W(), reservation: null, uid: "u", jobId: "j", amount: bad, now: NOW })) === "bad_amount");
for (const bad of [{ available: -1 }, { available: 1.5 }, { reserved: "3" }, { available: NaN }])
  check(`corrupt wallet refused: ${JSON.stringify(bad)}`, throwsCode(() => planReserve({ wallet: { ...W(), ...bad }, reservation: null, uid: "u", jobId: "j", amount: 1, now: NOW })) === "corrupt_wallet");

{ const limited = W({ dailyLimit: 50 });
  const a = planReserve({ wallet: limited, reservation: null, uid: "u", jobId: "a", amount: 30, now: NOW });
  check("daily limit allows up to the limit", a.wallet.daySpent === 30);
  check("daily limit blocks the next job", throwsCode(() => planReserve({ wallet: a.wallet, reservation: null, uid: "u", jobId: "b", amount: 21, now: NOW })) === "daily_limit");
  const tomorrow = NOW + 24 * 3600_000;
  check("daily counter resets on a new UTC day", planReserve({ wallet: a.wallet, reservation: null, uid: "u", jobId: "c", amount: 50, now: tomorrow }).wallet.daySpent === 50);
  const rel = planRelease({ wallet: a.wallet, reservation: a.reservation, jobId: "a", now: tomorrow });
  check("refunding yesterday's job does not underflow today's counter", rel.wallet.daySpent === 0 && rel.wallet.available === 100);
  const relSame = planRelease({ wallet: a.wallet, reservation: a.reservation, jobId: "a", now: NOW });
  check("refund frees the daily allowance", relSame.wallet.daySpent === 0); }

{ const g = planGrant({ wallet: null, existingTxn: null, txnId: "signup_u", uid: "u", amount: 50, type: "grant", reason: "Welcome", now: NOW });
  check("grant adds credits and lifetimeGranted", g.wallet.available === 50 && g.wallet.lifetimeGranted === 50 && conserved(g.wallet));
  check("duplicate grant is a no-op", planGrant({ wallet: g.wallet, existingTxn: g.txn, txnId: "signup_u", uid: "u", amount: 50, type: "grant", now: NOW }).noop);
  check("grant must be positive", throwsCode(() => planGrant({ wallet: null, existingTxn: null, txnId: "t", uid: "u", amount: -5, type: "grant", now: NOW })) === "bad_amount");
  const down = planGrant({ wallet: g.wallet, existingTxn: null, txnId: "t", uid: "u", amount: -20, type: "adjust", reason: "fix", now: NOW });
  check("negative adjustment removes credits, stays conserved", down.wallet.available === 30 && down.wallet.lifetimeRemoved === 20 && conserved(down.wallet) && down.txn.delta === -20 && down.txn.amount === 20);
  check("cannot adjust below zero", throwsCode(() => planGrant({ wallet: g.wallet, existingTxn: null, txnId: "t", uid: "u", amount: -51, type: "adjust", now: NOW })) === "insufficient");
  check("adjust of 0 rejected", throwsCode(() => planGrant({ wallet: g.wallet, existingTxn: null, txnId: "t", uid: "u", amount: 0, type: "adjust", now: NOW })) === "bad_amount");
  check("unknown type rejected", throwsCode(() => planGrant({ wallet: g.wallet, existingTxn: null, txnId: "t", uid: "u", amount: 5, type: "mint", now: NOW })) === "bad_type"); }

// property test: random operation sequences can never break the invariants
{ let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  let w = normalizeWallet(null, NOW), reservations = {}, n = 0, ok = true;
  w = planGrant({ wallet: w, existingTxn: null, txnId: "s", uid: "u", amount: 500, type: "grant", now: NOW }).wallet;
  for (let i = 0; i < 3000 && ok; i++) {
    const op = Math.floor(rnd() * 5), ids = Object.keys(reservations), pick = ids[Math.floor(rnd() * ids.length)];
    try {
      if (op === 0) { const id = `j${n++}`; const p = planReserve({ wallet: w, reservation: null, uid: "u", jobId: id, amount: 1 + Math.floor(rnd() * 40), now: NOW }); w = p.wallet; reservations[id] = p.reservation; }
      else if (op === 1 && pick) { const p = planCapture({ wallet: w, reservation: reservations[pick], jobId: pick, now: NOW }); w = p.wallet; if (p.reservation) reservations[pick] = p.reservation; }
      else if (op === 2 && pick) { const p = planRelease({ wallet: w, reservation: reservations[pick], jobId: pick, now: NOW }); w = p.wallet; if (p.reservation) reservations[pick] = p.reservation; }
      else if (op === 3) { w = planGrant({ wallet: w, existingTxn: null, txnId: `g${i}`, uid: "u", amount: 1 + Math.floor(rnd() * 30), type: "grant", now: NOW }).wallet; }
      else if (op === 4) { w = planGrant({ wallet: w, existingTxn: null, txnId: `a${i}`, uid: "u", amount: -(1 + Math.floor(rnd() * 30)), type: "adjust", now: NOW }).wallet; }
    } catch (e) { if (!(e instanceof CreditError) || e.code === "corrupt_wallet") { ok = false; console.error("unexpected", e); } }
    if (!(conserved(w) && w.available >= 0 && w.reserved >= 0)) ok = false;
  }
  const heldSum = Object.values(reservations).filter((r) => r.status === "held").reduce((s, r) => s + r.amount, 0);
  check("3000 random operations: never negative, always conserved", ok);
  check("reserved balance always equals the sum of held reservations", w.reserved === heldSum); }

// ======================= B. real service on an in-memory Firestore fake =======================
const mkService = (overrides = {}) => {
  let t = Date.parse("2026-11-04T10:00:00Z"), tick = 0;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const fdb = fakeFirestore();
  const service = createCreditService({
    getDb: () => fdb, serverTimestamp: () => t + ++tick, toTimestamp: (ms) => ms, signupCredits: 50, maxDailyLimit: 1000,
    now: () => t, log: { error: () => {} }, ...overrides,
  });
  return { service, fdb, clock };
};
const wallet = (fdb, uid) => fdb.store.get(`creditWallets/${uid}`);

{ const { service, fdb } = mkService();
  await Promise.all(Array.from({ length: 25 }, () => service.ensureWallet("u1")));
  check("welcome credits granted exactly once under 25 concurrent calls", wallet(fdb, "u1").available === 50 && [...fdb.store.keys()].filter((k) => k.startsWith("creditTransactions/signup_")).length === 1);
  fdb.store.delete("creditWallets/u1");
  await service.ensureWallet("u1");
  check("deleted wallet is not re-granted (signup txn exists)", wallet(fdb, "u1").available === 0); }

{ const { service, fdb } = mkService();
  fdb.store.set("generations/job1", { userId: "u1", status: "queued", creditsCharged: null });
  check("reserve returns 'reserved'", await service.reserve({ uid: "u1", jobId: "job1", amount: 20 }) === "reserved");
  check("duplicate reserve does not charge twice", await service.reserve({ uid: "u1", jobId: "job1", amount: 20 }) === "already_held" && wallet(fdb, "u1").available === 30 && wallet(fdb, "u1").reserved === 20);
  check("capture settles and records creditsCharged on the job", await service.capture("job1") === "captured" && wallet(fdb, "u1").reserved === 0 && wallet(fdb, "u1").lifetimeSpent === 20 && fdb.store.get("generations/job1").creditsCharged === 20);
  check("second capture is a no-op", await service.capture("job1") === "already_captured" && wallet(fdb, "u1").lifetimeSpent === 20);
  check("release after capture refuses to refund", await service.release("job1", "x") === "already_captured" && wallet(fdb, "u1").available === 30);
  check("capture/release for an unknown job is harmless", await service.capture("nope") === "no_reservation" && await service.release("nope") === "no_reservation");
  check("ledger has exactly: signup, reserve, capture", [...fdb.store.keys()].filter((k) => k.startsWith("creditTransactions/")).sort().join() === "creditTransactions/cap_job1,creditTransactions/res_job1,creditTransactions/signup_u1"); }

{ const { service, fdb } = mkService();
  fdb.store.set("generations/job2", { userId: "u1", status: "failed" });
  await service.reserve({ uid: "u1", jobId: "job2", amount: 12 });
  check("release refunds in full and sets creditsCharged to 0", await service.release("job2", "Job failed") === "released" && wallet(fdb, "u1").available === 50 && wallet(fdb, "u1").reserved === 0 && fdb.store.get("generations/job2").creditsCharged === 0);
  check("double release refunds once", await service.release("job2", "again") === "already_released" && wallet(fdb, "u1").available === 50);
  check("capture after release never charges", await service.capture("job2") === "released_before_capture" && wallet(fdb, "u1").lifetimeSpent === 0);
  check("a job without a generation doc still settles (no crash)", (await service.reserve({ uid: "u1", jobId: "orphan", amount: 5 })) === "reserved" && await service.release("orphan", "x") === "released" && !fdb.store.has("generations/orphan")); }

{ const { service, fdb } = mkService();
  const results = await Promise.all(Array.from({ length: 30 }, (_, i) => service.reserve({ uid: "u1", jobId: `c${i}`, amount: 10 }).then(() => "ok", (e) => e.code)));
  check("30 concurrent reserves of 10 against 50 credits: exactly 5 succeed", results.filter((r) => r === "ok").length === 5 && results.filter((r) => r === "insufficient").length === 25);
  const w = wallet(fdb, "u1");
  check("balance never negative, still conserved", w.available === 0 && w.reserved === 50 && conserved(w)); }

{ const { service, fdb } = mkService();
  await service.setDailyLimit("u1", 25);
  await service.reserve({ uid: "u1", jobId: "d1", amount: 20 });
  check("daily limit enforced by the service", await athrowsCode(() => service.reserve({ uid: "u1", jobId: "d2", amount: 6 })) === "daily_limit");
  await service.release("d1", "x");
  check("a refund frees the limit", await service.reserve({ uid: "u1", jobId: "d3", amount: 25 }) === "reserved");
  for (const bad of [-1, 1.5, 1001, NaN, "5"]) check(`setDailyLimit rejects ${String(bad)}`, await athrowsCode(() => service.setDailyLimit("u1", bad)) === "bad_limit");
  check("limit 0 means no limit", (await service.setDailyLimit("u1", 0), wallet(fdb, "u1").dailyLimit === 0)); }

{ const { service, fdb } = mkService();
  check("grant is applied once per idempotency key", await service.grant({ uid: "u1", amount: 40, type: "adjust", reason: "support", idempotencyKey: "key-abcdefgh", actor: "cli" }) === "adjusted"
    && await service.grant({ uid: "u1", amount: 40, type: "adjust", reason: "support", idempotencyKey: "key-abcdefgh", actor: "cli" }) === "duplicate" && wallet(fdb, "u1").available === 90);
  check("grant needs a reason and a valid key", await athrowsCode(() => service.grant({ uid: "u1", amount: 5, type: "grant", reason: " ", idempotencyKey: "key-abcdefgh2" })) === "bad_reason"
    && await athrowsCode(() => service.grant({ uid: "u1", amount: 5, type: "grant", reason: "x", idempotencyKey: "short" })) === "bad_key");
  check("admin removal cannot overdraw", await athrowsCode(() => service.grant({ uid: "u1", amount: -500, type: "adjust", reason: "x", idempotencyKey: "key-abcdefgh3" })) === "insufficient" && wallet(fdb, "u1").available === 90); }

{ const { service, fdb, clock } = mkService();
  for (const [id, status] of [["r1", "succeeded"], ["r2", "failed"], ["r3", "queued"], ["r4", null]]) {
    if (status) fdb.store.set(`generations/${id}`, { userId: "u1", status, creditsCharged: null });
    await service.reserve({ uid: "u1", jobId: id, amount: 5 });
  }
  check("recent reservations are left alone", (await service.reconcileHeld({ maxAgeMs: 15 * 60_000 })).captured === 0 && wallet(fdb, "u1").reserved === 20);
  clock.advance(20 * 60_000);
  const rep = await service.reconcileHeld({ maxAgeMs: 15 * 60_000 });
  check("reconcile: succeeded->captured, failed/missing->released, running->waiting", rep.captured === 1 && rep.released === 2 && rep.waiting === 1);
  const w = wallet(fdb, "u1");
  check("reconcile result is conserved (5 used, 5 still held, 10 refunded)", w.lifetimeSpent === 5 && w.reserved === 5 && w.available === 40 && conserved(w)); }

{ const { service, fdb } = mkService();
  check("peek returns null for a user with no wallet", await service.peek("ghost") === null);
  check("peek does NOT create a wallet or grant welcome credits", !fdb.store.has("creditWallets/ghost") && ![...fdb.store.keys()].some((k) => k.includes("ghost")));
  await service.ensureWallet("real");
  const p = await service.peek("real");
  check("peek reads an existing wallet", p.available === 50 && p.reserved === 0); }

{ const { service } = mkService();
  await service.reserve({ uid: "alice", jobId: "a1", amount: 5 }); await service.reserve({ uid: "bob", jobId: "b1", amount: 7 });
  const a = await service.listTransactions("alice"), b = await service.listTransactions("bob");
  check("transactions are per user, newest first", a.every((t) => t.userId === "alice") && b.every((t) => t.userId === "bob") && a[0].type === "reserve" && a.at(-1).type === "grant");
  check("a user cannot touch another user's reservation", await athrowsCode(() => service.reserve({ uid: "bob", jobId: "a1", amount: 5 })) === "forbidden"); }

// ======================= C. engine + billing hooks =======================
function memStore(job) {
  const j = { status: "queued", attempts: 0, providerJobId: null, nextPollAt: null, ...job };
  return { j, async claim() { if (j.status !== "queued") return null; j.status = "processing"; return { ...j }; }, async progress(_i, p) { Object.assign(j, p); },
    async complete(_i, p) { Object.assign(j, p, { status: "succeeded" }); }, async fail(_i, p) { Object.assign(j, p, { status: "failed" }); } };
}
const ok = { state: "succeeded", output: { text: "x" } };
const noSleep = async () => {};
const hooks = () => { const log = []; return { log, billing: { capture: async (id) => log.push(["capture", id]), release: async (id, r) => log.push(["release", id, r]) } }; };

{ const h = hooks(); await executeJob({ jobId: "j", store: memStore(), getAdapter: () => ({ submit: async () => ok }), billing: h.billing, sleep: noSleep });
  check("success -> capture once, no release", h.log.length === 1 && h.log[0][0] === "capture"); }
{ const h = hooks(); await executeJob({ jobId: "j", store: memStore(), getAdapter: () => ({ submit: async () => { throw fromHttpStatus(400, "bad"); } }), billing: h.billing, sleep: noSleep });
  check("failure -> release (refund) once, no capture", h.log.length === 1 && h.log[0][0] === "release"); }
{ const h = hooks(); let n = 0;
  await executeJob({ jobId: "j", store: memStore(), getAdapter: () => ({ submit: async () => { if (++n < 3) throw fromHttpStatus(503, "x"); return ok; } }), billing: h.billing, sleep: noSleep });
  check("retries then success -> charged once", h.log.length === 1 && h.log[0][0] === "capture"); }
{ const h = hooks(); await executeJob({ jobId: "j", store: memStore({ status: "succeeded" }), getAdapter: () => ({ submit: async () => ok }), billing: h.billing, sleep: noSleep });
  check("skipped job -> no billing", h.log.length === 0); }
{ const h = hooks(); await executeJob({ jobId: "j", store: memStore(), getAdapter: () => ({ submit: async () => ({ state: "processing", providerJobId: "p", pollAfterSec: 60 }) }), billing: h.billing, sleep: noSleep });
  check("job still running -> no billing yet", h.log.length === 0); }
{ const s = memStore(); const orig = console.error; console.error = () => {};
  const r = await executeJob({ jobId: "j", store: s, getAdapter: () => ({ submit: async () => ok }), billing: { capture: async () => { throw new Error("db down"); } }, sleep: noSleep });
  console.error = orig;
  check("a billing outage does not fail a finished job (reconciler repairs it)", r.status === "succeeded" && s.j.status === "succeeded"); }

// ======================= D. wiring and security (structure) =======================
const jobs = read("lib/ai/jobs.js");
check("createJob reserves BEFORE creating the job", jobs.includes("credits.reserve(") && jobs.indexOf("credits.reserve(") < jobs.indexOf("batch.commit()"));
check("createJob refunds if creating the job fails", /catch \(err\)[\s\S]*credits\.release\(id/.test(jobs));
check("createJob charges the server-side price (registry + admin override), never a client value", jobs.includes("amount: effective.credits") && !/amount:\s*(text|options|history|assetId)/.test(jobs));
check("credit errors surface with their HTTP status (402/429)", jobs.includes("CreditError"));
const run = read("lib/ai/run-job.js");
check("runJob wires capture + release", run.includes("credits.capture") && run.includes("credits.release") && run.includes("billing"));
const rec = read("app/api/jobs/reconcile/route.js");
check("stuck jobs are refunded by the job reconciler", rec.includes("credits.release("));
const cr = read("app/api/credits/reconcile/route.js");
check("credit reconcile route requires the cron secret", cr.includes("timingSafeEqual") && cr.includes("reconcileHeld"));
const rules = read("firebase/firestore.rules");
check("wallets and transactions: owner read, no client write", /creditWallets\/\{uid\}[^\n]*isOwner\(uid\)[^\n]*allow write: if false/.test(rules) && /creditTransactions\/\{id\}[^\n]*request\.auth\.uid[^\n]*allow write: if false/.test(rules));
check("reservations have no client access (default deny)", !/match \/creditReservations/.test(rules));
const idx = JSON.parse(read("firebase/firestore.indexes.json")).indexes.map((i) => `${i.collectionGroup}:${i.fields.map((f) => f.fieldPath).join(",")}`);
check("indexes for transactions list and reservation sweep", idx.includes("creditTransactions:userId,createdAt") && idx.includes("creditReservations:status,updatedAt"));
check("credit action authenticates first", /requireUser\(/.test(read("lib/actions/credits.js")));
check("credit service is server-only", read("lib/credits/service.js").includes('import "server-only"'));
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f === ".next") continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|mjs)$/.test(f) && out.push(p); } return out; }
const writers = walk(".").filter((f) => /collection\("creditWallets"\)/.test(read(f)) && !f.startsWith("scripts/verify"));
// Allowed: the service itself, and the diagnostic live-check, which only READS a wallet to verify the service and deletes its own temporary test wallet.
check("only the credit service (and the live-check diagnostic) touch creditWallets", writers.length === 2 && writers.some((f) => f.endsWith("lib/credits/service-core.js")) && writers.some((f) => f.endsWith("lib/ops/live-checks.js")));
for (const f of walk(".")) if (/^["']use client["']/.test(read(f).trimStart())) check(`client file must not import the credit service: ${f}`, !/lib\/credits\/(service|service-core)/.test(read(f)));
for (const f of ["components/dashboard/text-tool-runner.jsx", "components/dashboard/image-tool-runner.jsx", "components/dashboard/chat-runner.jsx"])
  check(`${f} no longer claims credits are free`, !/not charged until billing/i.test(read(f)));
check("nav links to the credits page", read("config/dashboard-nav.js").includes('"/dashboard/credits"') && fs.existsSync("app/dashboard/credits/page.jsx"));

if (failed) process.exit(1);
console.log("credits OK");
