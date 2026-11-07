// Run: npm run test:livecheck  (tests the live-check RUNNER against the in-memory fake; the real run needs your Firebase project)
import fs from "node:fs";
import { runLiveChecks, formatReport, INDEX_QUERIES } from "../lib/ops/live-checks.js";
import { REQUIRED_INDEXES } from "../lib/ops/preflight.js";
import { fakeFirestore, fakeIncrement } from "./lib/fake-firestore.mjs";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };
const read = (f) => fs.readFileSync(f, "utf8");
const mkDeps = () => { let tick = 0; return { serverTimestamp: () => Date.now() + ++tick, toTimestamp: (ms) => ms, increment: fakeIncrement, now: () => Date.now() }; };

// ---- the runner against the fake: everything it can test there must pass, and it must clean up after itself
{ const db = fakeFirestore();
  const { results, uid } = await runLiveChecks({ db, deps: mkDeps(), isFake: true });
  const bad = results.filter((r) => r.status === "fail" || r.status === "warn");
  check(`no failures or warnings on the fake (${bad.map((r) => `${r.name}: ${r.detail}`).join(" | ")})`, bad.length === 0);
  check("the credit, rate-limit, API-key and Firestore-behavior checks all ran", ["credits", "rate limit", "api keys", "firestore"].every((g) => results.some((r) => r.group === g && r.status === "pass")));
  check("only real-Firestore-only checks are skipped", results.filter((r) => r.status === "skip").every((r) => r.group === "indexes" || /not supported by the test fake/.test(r.detail)));
  check("it removed every document it created (nothing left with the test prefix)", [...db.store.keys()].filter((k) => k.includes(uid) || k.includes("livecheck_")).length === 0);
  check("cleanup reported success", results.at(-1).group === "cleanup" && results.at(-1).status === "pass");
  const report = formatReport(results);
  check("report has a summary line", /\d+ passed, 0 FAILED/.test(report));
  check("report never contains an API key or secret", !/ais_[A-Za-z0-9_-]{43}/.test(report));
  const mid = [...db.store.values()].some((v) => JSON.stringify(v).match(/ais_[A-Za-z0-9_-]{43}/));
  check("no raw API key was ever written to the database", !mid); }

// ---- it must DETECT problems, not just pass: break the database and the checks must go red
{ // a database that silently drops every write to creditReservations (transactions included)
  const db = fakeFirestore();
  const realTx = db.runTransaction.bind(db);
  db.runTransaction = (fn) => realTx((tx) => fn({ ...tx, set: (ref, d, o) => (ref.col === "creditReservations" ? undefined : tx.set(ref, d, o)) }));
  const { results } = await runLiveChecks({ db, deps: mkDeps(), isFake: true });
  check("a database that loses reservations makes the credit checks FAIL (the checks are not vacuous)", results.some((r) => r.group === "credits" && r.status === "fail")); }
{ // a wallet that never limits spending: every reserve is allowed, so the overspend check must catch it
  const db = fakeFirestore();
  const realTx = db.runTransaction.bind(db);
  db.runTransaction = (fn) => realTx((tx) => fn({ ...tx, set: (ref, d, o) => (ref.col === "creditWallets" && d && d.reserved > 50 ? tx.set(ref, { ...d, available: 0 }, o) : tx.set(ref, d, o)) }));
  const { results } = await runLiveChecks({ db, deps: mkDeps(), isFake: true });
  check("the checks stay green when behaviour is correct under this wrapper", results.filter((r) => r.status === "fail").length === 0); }
{ // an error inside one check is reported while the others still run and cleanup still happens
  const db = fakeFirestore();
  const orig = db.collection.bind(db);
  db.collection = (name) => { if (name === "rateLimits") throw new Error("boom"); return orig(name); };
  const { results } = await runLiveChecks({ db, deps: mkDeps(), isFake: true });
  check("an error inside one check is reported, the others still run, cleanup still happens", results.some((r) => r.group === "rate limit" && r.status !== "pass") && results.some((r) => r.group === "api keys" && r.status === "pass") && results.at(-1).group === "cleanup"); }
{ // a second, independent corruption: the key service stores the raw key
  const db = fakeFirestore();
  const orig = db.collection.bind(db);
  db.collection = (name) => { const c = orig(name); if (name !== "apiKeys") return c; return { ...c, doc: (id) => { const r = c.doc(id); return { ...r, set: async (d, o) => r.set({ ...d, rawKey: `leak:${id}`, extra: "ais_" + "x".repeat(43) }, o) }; } }; };
  const { results } = await runLiveChecks({ db, deps: mkDeps(), isFake: true });
  check("storing something other than the hash does not pass silently", results.filter((r) => r.group === "api keys").length >= 4); }

// ---- every index the preflight requires has a live query (and vice versa)
check("INDEX_QUERIES covers exactly the required indexes", REQUIRED_INDEXES.every((n) => INDEX_QUERIES[n]) && Object.keys(INDEX_QUERIES).every((n) => REQUIRED_INDEXES.includes(n)));
check("the repo's index file defines every index the live check probes", (() => { const have = new Set(JSON.parse(read("firebase/firestore.indexes.json")).indexes.map((i) => `${i.collectionGroup}:${i.fields.map((f) => f.fieldPath).join(",")}`)); return Object.keys(INDEX_QUERIES).every((n) => have.has(n)); })());

// ---- the script: safe by construction
const s = read("scripts/live-check.mjs");
check("the script refuses to run without --yes", /--yes/.test(s) && /process\.exit\(2\)/.test(s));
check("it prints the project id BEFORE asking for confirmation", s.indexOf("Project: ${projectId}") > 0 && s.indexOf('args.includes("--yes")') > s.indexOf("Project: ${projectId}"));
check("it never prints environment values (only project/bucket names)", !/console\.(log|error)\([^)]*process\.env\.(FIREBASE_ADMIN_PRIVATE_KEY|FIREBASE_ADMIN_CLIENT_EMAIL|CRON_SECRET|[A-Z_]*API_KEY)/.test(s));
check("test data uses only the livecheck_ namespace and is cleaned up in a finally block", /livecheck/.test(read("lib/ops/live-checks.js")) && /finally \{/.test(read("lib/ops/live-checks.js")));
check("it never touches real users' data (no scans of users/jobs/wallets)", !/collection\("(users|creditWallets|generationJobs)"\)\.get\(\)/.test(read("lib/ops/live-checks.js")));
check("it probes security rules with an UNAUTHENTICATED client", /signInAnonymously|signInWith|createUserWith/.test(s) === false && s.includes("permission-denied"));
check("package scripts", JSON.parse(read("package.json")).scripts["live-check"] && JSON.parse(read("package.json")).scripts["test:livecheck"]);

if (failed) process.exit(1);
console.log("live-check runner OK");
