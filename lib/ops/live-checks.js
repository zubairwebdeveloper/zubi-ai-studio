import { randomBytes } from "node:crypto";
import { createCreditService } from "../credits/service-core.js";
import { createSharedRateLimiter, rateLimitDocId } from "../security/rate-limit-core.js";
import { createApiKeyService } from "../api/keys-core.js";
import { hashKey } from "../api/keys.js";
import { REQUIRED_INDEXES } from "./preflight.js";

// Live self-test against a REAL Firestore (or the test fake). It uses only throwaway documents whose ids start with
// "livecheck_", never touches real users' data, and deletes everything it created. Firestore is injected.
const PROBE = "livecheck_probe";

// Every composite query the app runs, keyed like REQUIRED_INDEXES. A missing index makes Firestore reject the query.
export const INDEX_QUERIES = {
  "projects:ownerId,updatedAt": (db) => db.collection("projects").where("ownerId", "==", PROBE).orderBy("updatedAt", "desc").limit(1),
  "notifications:userId,createdAt": (db) => db.collection("notifications").where("userId", "==", PROBE).orderBy("createdAt", "desc").limit(1),
  "generations:userId,createdAt": (db) => db.collection("generations").where("userId", "==", PROBE).orderBy("createdAt", "desc").limit(1),
  "generations:userId,type,createdAt": (db) => db.collection("generations").where("userId", "==", PROBE).where("type", "==", "image").where("createdAt", ">=", new Date(0)).limit(1),
  "generations:status,createdAt": (db) => db.collection("generations").where("status", "==", "failed").orderBy("createdAt", "desc").limit(1),
  "generationJobs:status,updatedAt": (db, ts) => db.collection("generationJobs").where("status", "in", ["queued", "processing"]).where("updatedAt", "<", ts(Date.now())).limit(1),
  "generationJobs:needsReview,updatedAt": (db) => db.collection("generationJobs").where("needsReview", "==", true).orderBy("updatedAt", "desc").limit(1),
  "creditTransactions:userId,createdAt": (db) => db.collection("creditTransactions").where("userId", "==", PROBE).orderBy("createdAt", "desc").limit(1),
  "creditReservations:status,updatedAt": (db, ts) => db.collection("creditReservations").where("status", "==", "held").where("updatedAt", "<", ts(Date.now())).limit(1),
  "apiUsage:ownerId,day": (db) => db.collection("apiUsage").where("ownerId", "==", PROBE).orderBy("day", "desc").limit(1),
};

class Warn extends Error {}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

export async function runLiveChecks({ db, deps, isFake = false, namespace = "livecheck" }) {
  const id = randomBytes(5).toString("hex");
  const uid = `${namespace}_${id}`;
  const results = [];
  const refs = [], queries = [], collections = [];
  const track = (ref) => { refs.push(ref); return ref; };
  const trackQuery = (col, field, value) => queries.push([col, field, value]);
  const add = (group, name, status, detail = "") => results.push({ group, name, status, detail });
  const check = async (group, name, fn) => {
    try { const d = await fn(); d?.skip ? add(group, name, "skip", d.skip) : add(group, name, "pass", typeof d === "string" ? d : ""); }
    catch (e) { add(group, name, e instanceof Warn ? "warn" : "fail", String(e?.message || e)); }
  };
  const settled = async (n, fn) => {
    const r = await Promise.allSettled(Array.from({ length: n }, (_, i) => fn(i)));
    return { ok: r.filter((x) => x.status === "fulfilled").map((x) => x.value), errors: r.filter((x) => x.status === "rejected").map((x) => x.reason) };
  };
  const wallet = async (u) => (await db.collection("creditWallets").doc(u).get()).data();
  const conserved = (w) => w.available + w.reserved + w.lifetimeSpent + w.lifetimeRemoved === w.lifetimeGranted;

  try {
    // ============ credits (the real service, real transactions) ============
    const credits = createCreditService({ getDb: () => db, serverTimestamp: deps.serverTimestamp, toTimestamp: deps.toTimestamp, signupCredits: 50, maxDailyLimit: 1000, now: deps.now, log: { error: () => {} } });
    const gen = (job, status) => track(db.collection("generations").doc(job));
    const mkGen = async (job, status) => { await gen(job).set({ userId: uid, status, creditsCharged: null }); };
    const touch = (u) => { track(db.collection("creditWallets").doc(u)); trackQuery("creditTransactions", "userId", u); };
    touch(uid);

    await check("credits", "welcome credits are granted exactly once, even under 30 concurrent first calls", async () => {
      const { ok, errors } = await settled(30, () => credits.ensureWallet(uid));
      must(ok.length > 0, `every call failed: ${errors[0]?.message}`);
      const w = await wallet(uid);
      must(w.available === 50 && w.lifetimeGranted === 50, `wallet has ${w.available} (expected 50)`);
      const signups = (await db.collection("creditTransactions").where("userId", "==", uid).get()).docs.filter((d) => d.id.startsWith("signup_"));
      must(signups.length === 1, `${signups.length} welcome-grant records`);
      if (errors.length) throw new Warn(`correct, but ${errors.length}/30 concurrent calls errored (${errors[0]?.code ?? errors[0]?.message}); callers should retry`);
    });
    await check("credits", "reserve then capture: held first, then used; job record shows the charge", async () => {
      await mkGen(`${id}_a`, "succeeded");
      await credits.reserve({ uid, jobId: `${id}_a`, amount: 20 }); track(db.collection("creditReservations").doc(`${id}_a`));
      let w = await wallet(uid); must(w.available === 30 && w.reserved === 20, `after reserve: ${w.available}/${w.reserved}`);
      must((await credits.reserve({ uid, jobId: `${id}_a`, amount: 20 })) === "already_held", "duplicate reserve was not recognized");
      must((await credits.capture(`${id}_a`)) === "captured", "capture failed");
      must((await credits.capture(`${id}_a`)) === "already_captured", "second capture was not a no-op");
      w = await wallet(uid); must(w.reserved === 0 && w.lifetimeSpent === 20 && w.available === 30 && conserved(w), `after capture: ${JSON.stringify(w)}`);
      must((await db.collection("generations").doc(`${id}_a`).get()).data().creditsCharged === 20, "creditsCharged not mirrored on the job");
    });
    await check("credits", "reserve then release: full refund, never charged", async () => {
      await mkGen(`${id}_b`, "failed");
      await credits.reserve({ uid, jobId: `${id}_b`, amount: 12 }); track(db.collection("creditReservations").doc(`${id}_b`));
      must((await credits.release(`${id}_b`, "livecheck")) === "released", "release failed");
      must((await credits.release(`${id}_b`, "again")) === "already_released", "second release was not a no-op");
      must((await credits.capture(`${id}_b`)) === "released_before_capture", "capture after release must never charge");
      const w = await wallet(uid); must(w.available === 30 && w.reserved === 0 && conserved(w), `after release: ${JSON.stringify(w)}`);
    });
    await check("credits", "ledger has a record for every step", async () => {
      const names = (await db.collection("creditTransactions").where("userId", "==", uid).get()).docs.map((d) => d.id);
      for (const want of [`signup_${uid}`, `res_${id}_a`, `cap_${id}_a`, `res_${id}_b`, `rel_${id}_b`]) must(names.includes(want), `missing ledger entry ${want}`);
    });
    await check("credits", "30 concurrent jobs of 10 credits against a 50-credit wallet: money stays correct", async () => {
      const b = `${uid}_b`; touch(b);
      await credits.ensureWallet(b);
      const { ok, errors } = await settled(30, (i) => { track(db.collection("creditReservations").doc(`${id}_c${i}`)); return credits.reserve({ uid: b, jobId: `${id}_c${i}`, amount: 10 }); });
      const insufficient = errors.filter((e) => e?.code === "insufficient").length, other = errors.length - insufficient;
      const w = await wallet(b);
      must(w.available >= 0 && w.reserved >= 0 && conserved(w), `invariant broken: ${JSON.stringify(w)}`);
      must(ok.length <= 5, `${ok.length} reservations succeeded but only 5 fit: OVERSPEND`);
      must(w.reserved === ok.length * 10, `wallet holds ${w.reserved} but ${ok.length} reservations succeeded`);
      if (other > 0) throw new Warn(`money correct (${ok.length} succeeded, ${insufficient} refused for lack of credits), but ${other} calls failed with a contention-style error (${errors.find((e) => e?.code !== "insufficient")?.message?.slice(0, 80)}). Only ${ok.length}/5 slots were used; clients should retry`);
    });
    await check("credits", "daily spending limit is enforced", async () => {
      const c = `${uid}_c`; touch(c);
      await credits.ensureWallet(c); await credits.setDailyLimit(c, 25);
      await credits.reserve({ uid: c, jobId: `${id}_d1`, amount: 20 }); track(db.collection("creditReservations").doc(`${id}_d1`));
      let code = null; try { await credits.reserve({ uid: c, jobId: `${id}_d2`, amount: 6 }); } catch (e) { code = e.code; }
      must(code === "daily_limit", `expected daily_limit, got ${code}`);
    });
    await check("credits", "admin adjustments are idempotent per key", async () => {
      const args = { uid, amount: 40, type: "adjust", reason: "live check", idempotencyKey: `lc-${id}`, actor: "livecheck" };
      must((await credits.grant(args)) === "adjusted" && (await credits.grant(args)) === "duplicate", "second grant with the same key was applied");
      const w = await wallet(uid); must(w.available === 70 && conserved(w), `available ${w.available}, expected 70`);
    });

    // ============ shared rate limiter ============
    await check("rate limit", "50 concurrent requests against a limit of 10 (shared across servers)", async () => {
      const key = `livecheck:${id}`, windowMs = 3_600_000;
      let degraded = 0;
      const limiter = createSharedRateLimiter({ getDb: () => db, toTimestamp: deps.toTimestamp, now: deps.now, log: { error: () => { degraded++; } } });
      const ws = Math.floor(deps.now() / windowMs) * windowMs;
      for (const w of [ws, ws + windowMs]) track(db.collection("rateLimits").doc(rateLimitDocId(key, w)));
      const out = await Promise.all(Array.from({ length: 50 }, () => limiter(key, 10, windowMs)));
      const allowed = out.filter((r) => r.ok).length;
      must(allowed >= 10, `only ${allowed} allowed; expected at least 10`);
      must(allowed <= 10 + degraded, `${allowed} allowed (limit 10, ${degraded} fail-open): the limiter let too many through`);
      if (degraded > 0) throw new Warn(`${allowed} allowed: ${degraded} calls hit a database error and failed open (by design). Under heavy contention the limit is approximate`);
      return `${allowed} allowed`;
    });

    // ============ API keys ============
    const keySvc = createApiKeyService({ getDb: () => db, serverTimestamp: deps.serverTimestamp, increment: deps.increment, now: deps.now, maxKeys: 5 });
    let created = null, auth = null;
    track(db.collection("users").doc(uid)); trackQuery("apiKeys", "ownerId", uid); trackQuery("apiUsage", "ownerId", uid);
    await db.collection("users").doc(uid).set({ status: "active", role: "USER", email: `${uid}@livecheck.invalid` });
    await check("api keys", "a key is created and only its hash is stored", async () => {
      created = await keySvc.create({ uid, name: "livecheck" });
      const doc = await db.collection("apiKeys").doc(hashKey(created.key)).get();
      must(doc.exists, "no document under the key's hash");
      must(!JSON.stringify(doc.data()).includes(created.key), "the raw key is stored in the database");
    });
    await check("api keys", "the key authenticates; a wrong key does not", async () => {
      auth = await keySvc.authenticate(created.key);
      must(auth?.uid === uid, "valid key rejected");
      must((await keySvc.authenticate(created.key.slice(0, -1) + (created.key.at(-1) === "A" ? "B" : "A"))) === null, "a wrong key authenticated");
    });
    await check("api keys", "20 concurrent usage updates add up exactly", async () => {
      await Promise.all(Array.from({ length: 20 }, () => keySvc.recordUsage(auth)));
      const rows = await keySvc.usage(uid);
      must(rows.length === 1 && rows[0].requests === 20, `counted ${rows[0]?.requests} of 20`);
    });
    await check("api keys", "revoking takes effect immediately", async () => {
      must(await keySvc.revoke({ uid, publicId: created.publicId }), "revoke returned false");
      must((await keySvc.authenticate(created.key)) === null, "a revoked key still authenticates");
    });

    // ============ Firestore behavior our code relies on ============
    const scratch = `${namespace}_${id}_scratch`; collections.push(scratch);
    await check("firestore", "a field set to null is NOT matched by a '<=' timestamp query (retention relies on this)", async () => {
      const c = db.collection(scratch), now = deps.now();
      await c.doc("past").set({ redactAt: deps.toTimestamp(now - 60_000) });
      await c.doc("never").set({ redactAt: null });
      await c.doc("future").set({ redactAt: deps.toTimestamp(now + 3_600_000) });
      const got = (await c.where("redactAt", "<=", deps.toTimestamp(now)).get()).docs.map((d) => d.id);
      must(got.length === 1 && got[0] === "past", `matched [${got.join(", ")}] (expected only "past")`);
    });
    await check("firestore", "string fields order newest-first (usage rows are ordered by day)", async () => {
      const c = db.collection(scratch);
      await c.doc("d1").set({ day: "2026-01-01" }); await c.doc("d2").set({ day: "2026-01-02" });
      const first = (await c.orderBy("day", "desc").limit(1).get()).docs[0];
      must(first.id === "d2", `first row was ${first?.id}`);
    });
    await check("firestore", "'in' queries and count() aggregation work", async () => {
      if (isFake) return { skip: "not supported by the test fake" };
      const c = db.collection(scratch);
      must((await c.where("day", "in", ["2026-01-01", "2026-01-02"]).get()).size === 2, "'in' query failed");
      must((await c.count().get()).data().count >= 2, "count() failed");
    });

    // ============ composite indexes ============
    for (const name of REQUIRED_INDEXES) {
      await check("indexes", `index ${name}`, async () => {
        if (isFake) return { skip: "only checked against real Firestore" };
        const build = INDEX_QUERIES[name];
        must(build, "no live query defined for this index (update lib/ops/live-checks.js)");
        try { await build(db, deps.toTimestamp).get(); }
        catch (e) {
          const link = String(e?.message || "").match(/https:\/\/console\.firebase\.google\.com\S+/)?.[0];
          throw new Error(/index/i.test(e?.message || "") || e?.code === 9 ? `MISSING. Create it (or run: firebase deploy --only firestore:indexes).${link ? ` Direct link: ${link}` : ""}` : `query failed: ${e?.message}`);
        }
      });
    }
  } finally {
    // ============ cleanup (always) ============
    let cleaned = 0, failures = 0;
    for (const ref of refs) { try { await ref.delete(); cleaned++; } catch { failures++; } }
    for (const [col, field, value] of queries) {
      try { for (const d of (await db.collection(col).where(field, "==", value).get()).docs) { await d.ref.delete(); cleaned++; } } catch { failures++; }
    }
    for (const col of collections) {
      try { for (const d of (await db.collection(col).get()).docs) { await d.ref.delete(); cleaned++; } } catch { failures++; }
    }
    add("cleanup", "temporary test documents removed", failures ? "warn" : "pass", failures ? `${failures} deletions failed: look for ids starting with "${uid}" and remove them by hand` : `${cleaned} documents deleted`);
  }
  return { results, uid };
}

const ICON = { pass: "PASS", fail: "FAIL", warn: "WARN", skip: "SKIP" };
export function formatReport(results) {
  const lines = []; let group = "";
  for (const r of results) {
    if (r.group !== group) { group = r.group; lines.push(`\n== ${group} ==`); }
    lines.push(`[${ICON[r.status]}] ${r.name}${r.detail ? `\n       ${r.detail}` : ""}`);
  }
  const n = (s) => results.filter((r) => r.status === s).length;
  lines.push(`\n${n("pass")} passed, ${n("fail")} FAILED, ${n("warn")} warnings, ${n("skip")} skipped.`);
  return lines.join("\n");
}
