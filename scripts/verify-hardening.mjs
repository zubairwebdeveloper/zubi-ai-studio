// Run: npm run test:hardening  (no network, no Firebase)
import fs from "node:fs";
import path from "node:path";
import { fakeFirestore } from "./lib/fake-firestore.mjs";
import { createSharedRateLimiter, rateLimitDocId } from "../lib/security/rate-limit-core.js";
import { redactJobInput, redactAtMs, DAY_MS } from "../lib/ai/retention.js";
import { createMaintenance } from "../lib/ops/maintenance-core.js";
import { runPreflight, REQUIRED_INDEXES, REQUIRED_PUBLIC, REQUIRED_SERVER } from "../lib/ops/preflight.js";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };
const read = (f) => fs.readFileSync(f, "utf8");
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f === ".next") continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|mjs)$/.test(f) && out.push(p.replaceAll("\\", "/")); } return out; }

// ======================= 1. shared rate limiter =======================
const MIN = 60_000;
const mkLimiter = (opts = {}) => {
  let t = Date.parse("2026-11-04T10:00:10Z"); const fdb = fakeFirestore();
  const limiter = createSharedRateLimiter({ getDb: () => fdb, toTimestamp: (ms) => ms, now: () => t, log: { error: () => {} }, ...opts });
  return { limiter, fdb, advance: (ms) => { t += ms; }, at: () => t };
};
{ const { limiter, advance } = mkLimiter();
  const r = []; for (let i = 0; i < 12; i++) r.push(await limiter("jobs:u1", 10, MIN));
  check("allows exactly `limit` requests per window", r.filter((x) => x.ok).length === 10 && r.slice(10).every((x) => !x.ok));
  check("denial carries a sane Retry-After", r[10].retryAfter >= 1 && r[10].retryAfter <= 60);
  check("other keys are unaffected", (await limiter("jobs:u2", 10, MIN)).ok);
  advance(MIN);
  check("the next window starts fresh", (await limiter("jobs:u1", 10, MIN)).ok); }
{ const { limiter } = mkLimiter();
  const res = await Promise.all(Array.from({ length: 50 }, () => limiter("session:1.2.3.4", 10, MIN)));
  check("50 concurrent requests across 'instances': exactly 10 pass", res.filter((x) => x.ok).length === 10); }
{ const { limiter, fdb, at } = mkLimiter();
  await limiter("session:203.0.113.7", 5, MIN);
  const keys = [...fdb.store.keys()];
  check("no raw user id / IP is stored (hashed)", keys.length === 1 && !keys[0].includes("203.0.113.7") && keys[0].startsWith("rateLimits/"));
  check("doc id is stable per key+window and differs per key", rateLimitDocId("a", 1) === rateLimitDocId("a", 1) && rateLimitDocId("a", 1) !== rateLimitDocId("b", 1) && rateLimitDocId("a", 1) !== rateLimitDocId("a", 2));
  const w = Math.floor(at() / MIN) * MIN;
  check("expiresAt is set for TTL cleanup (two windows ahead)", [...fdb.store.values()][0].expiresAt === w + 2 * MIN); }
{ const bad = createSharedRateLimiter({ getDb: () => { throw new Error("db down"); }, toTimestamp: (m) => m, log: { error: () => {} } });
  const r = await bad("x", 1, MIN);
  check("database outage fails OPEN (flagged degraded)", r.ok === true && r.degraded === true); }

// ======================= 2. retention =======================
{ const r = redactJobInput({ text: "my secret idea", assetId: "a1", options: { tone: "Casual" }, history: [{ role: "user", text: "hi" }] });
  check("redaction erases text + history, keeps asset and options", r.text === "" && r.history.length === 0 && r.redacted === true && r.assetId === "a1" && r.options.tone === "Casual");
  check("redaction tolerates empty input", redactJobInput(undefined).redacted === true);
  check("redactAt = created + N days", redactAtMs(1000, 30) === 1000 + 30 * DAY_MS); }
{ const fdb = fakeFirestore(); const T = 1_000_000_000_000;
  const m = createMaintenance({ getDb: () => fdb, toTimestamp: (ms) => ms, now: () => T });
  fdb.store.set("generationJobs/old", { userId: "u", input: { text: "private prompt", history: [{ role: "user", text: "x" }], assetId: null }, redactAt: T - 1000 });
  fdb.store.set("generations/old", { userId: "u", inputPreview: "private prompt", status: "succeeded" });
  fdb.store.set("generationJobs/fresh", { userId: "u", input: { text: "keep me" }, redactAt: T + DAY_MS });
  fdb.store.set("generationJobs/legacy", { userId: "u", input: { text: "no redactAt field (pre-policy job)" } });
  fdb.store.set("generationJobs/nogen", { userId: "u", input: { text: "no generation doc" }, redactAt: T - 5 });
  const r1 = await m.redactExpiredInputs();
  check("expired jobs are redacted (incl. one without a generation doc)", r1.redacted === 2 && fdb.store.get("generationJobs/old").input.text === "" && fdb.store.get("generationJobs/nogen").input.text === "");
  check("history preview is cleared too", fdb.store.get("generations/old").inputPreview === "");
  check("unexpired and legacy jobs are untouched", fdb.store.get("generationJobs/fresh").input.text === "keep me" && fdb.store.get("generationJobs/legacy").input.text.startsWith("no redactAt"));
  check("redacted jobs are not selected again (redactAt = null)", fdb.store.get("generationJobs/old").redactAt === null && (await m.redactExpiredInputs()).redacted === 0);
  check("the user's generation record itself survives", fdb.store.get("generations/old").status === "succeeded");
  fdb.store.set("rateLimits/a", { count: 1, expiresAt: T - 1 }); fdb.store.set("rateLimits/b", { count: 1, expiresAt: T + 1000 });
  const r2 = await m.deleteExpiredRateLimits();
  check("only spent rate-limit counters are deleted", r2.deleted === 1 && !fdb.store.has("rateLimits/a") && fdb.store.has("rateLimits/b")); }

// ======================= 3. preflight =======================
const indexesJson = JSON.parse(read("firebase/firestore.indexes.json")), rulesText = read("firebase/firestore.rules");
const goodEnv = () => ({
  NEXT_PUBLIC_SITE_URL: "https://studio.example.com", NEXT_PUBLIC_FIREBASE_API_KEY: "x", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "x", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "x",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "x", NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1", NEXT_PUBLIC_FIREBASE_APP_ID: "1:2:web:3",
  FIREBASE_ADMIN_PROJECT_ID: "p", FIREBASE_ADMIN_CLIENT_EMAIL: "svc@p.iam.gserviceaccount.com",
  FIREBASE_ADMIN_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n", CRON_SECRET: "s".repeat(40),
  GEMINI_API_KEY: "k", GEMINI_TEXT_MODEL: "m",
});
const pf = (env, o = {}) => runPreflight({ env, indexesJson, rulesText, production: true, ...o });
const levelOf = (res, id) => res.findings.find((f) => f.id === id)?.level;
check("a complete production env passes", pf(goodEnv()).failed === 0);
for (const k of [...REQUIRED_PUBLIC, ...REQUIRED_SERVER]) { const e = goodEnv(); delete e[k]; check(`missing ${k} fails`, levelOf(pf(e), k) === "fail"); }
{ const e = goodEnv(); e.CRON_SECRET = "short"; check("short CRON_SECRET fails", levelOf(pf(e), "CRON_SECRET") === "fail"); }
{ const e = goodEnv(); e.FIREBASE_ADMIN_PRIVATE_KEY = "not a key"; check("non-PEM private key fails", levelOf(pf(e), "PRIVATE_KEY") === "fail"); }
{ const e = goodEnv(); e.NEXT_PUBLIC_SITE_URL = "http://localhost:3000"; check("localhost/http site URL fails in production but not in dev", levelOf(pf(e), "SITE_URL") === "fail" && levelOf(pf(e, { production: false }), "SITE_URL") === undefined); }
{ const e = goodEnv(); e.NEXT_PUBLIC_SITE_URL = "nope"; check("invalid site URL fails", levelOf(pf(e), "SITE_URL") === "fail"); }
for (const k of ["NEXT_PUBLIC_OPENAI_API_KEY", "NEXT_PUBLIC_CRON_SECRET", "NEXT_PUBLIC_REMOVE_BG_API_KEY", "NEXT_PUBLIC_FIREBASE_PRIVATE_KEY"]) { const e = goodEnv(); e[k] = "x"; check(`${k} is flagged as exposed`, levelOf(pf(e), k) === "fail"); }
{ const e = goodEnv(); e.NEXT_PUBLIC_FIREBASE_APP_ID = "1:2:web:3"; check("normal NEXT_PUBLIC_FIREBASE_* values are not flagged", pf(e).failed === 0); }
{ const e = goodEnv(); delete e.GEMINI_API_KEY; delete e.GEMINI_TEXT_MODEL; const r = pf(e); check("no provider is a warning, not a failure", r.failed === 0 && levelOf(r, "PROVIDERS") === "warn"); }
{ const e = goodEnv(); delete e.GEMINI_TEXT_MODEL; check("key without model id warns", levelOf(pf(e), "GEMINI_TEXT_MODEL") === "warn"); }
{ const e = goodEnv(); e.OPENAI_API_KEY = "k"; e.OPENAI_TEXT_MODEL = "m"; check("OpenAI key without an image model warns", levelOf(pf(e), "OPENAI_IMAGE_MODEL") === "warn"); }
{ const r = runPreflight({ env: goodEnv(), indexesJson: { indexes: indexesJson.indexes.slice(1) }, rulesText, production: true }); check("a missing composite index fails", r.failed >= 1); }
{ const r = runPreflight({ env: goodEnv(), indexesJson, rulesText: "service cloud.firestore {}", production: true }); check("missing default-deny rule fails", levelOf(r, "RULES") === "fail"); }
check("the repo's index file contains every index the preflight requires", runPreflight({ env: goodEnv(), indexesJson, rulesText, production: true }).findings.every((f) => !f.id.startsWith("INDEX")));
{ const text = JSON.stringify(pf({ ...goodEnv(), FIREBASE_ADMIN_PRIVATE_KEY: "SUPER-SECRET-VALUE" })); check("preflight output never contains secret values", !text.includes("SUPER-SECRET-VALUE")); }

// ======================= 4. route protection audit =======================
const routes = walk("app/api").filter((f) => f.endsWith("/route.js"));
check("API routes found", routes.length >= 13);
for (const f of routes) {
  const src = read(f);
  const cron = src.includes("timingSafeEqual") && src.includes("CRON_SECRET");
  const authed = src.includes("getSessionUser") || src.includes("authenticateApiRequest"); // cookie session OR API key
  const publicByDesign = f === "app/api/auth/session/route.js"; // exchanges a verified Firebase ID token for a cookie
  check(`API route is authenticated, secret-protected or public-by-design: ${f}`, cron || authed || publicByDesign);
  const bearerOnly = src.includes("authenticateApiRequest") && !src.includes("getSessionUser"); // no cookies, so no CSRF risk
  if (/export async function (POST|DELETE)/.test(src) && !cron && !bearerOnly) check(`state-changing route checks same-origin: ${f}`, src.includes("sameOrigin"));
  if (!cron && /export async function POST/.test(src) && f !== "app/api/uploads/route.js" && f !== "app/api/uploads/document/route.js" && !bearerOnly) check(`POST route is rate limited: ${f}`, src.includes("limitRequest") || src.includes("rateLimit"));
}
for (const f of ["app/api/jobs/route.js", "app/api/uploads/route.js", "app/api/uploads/document/route.js", "app/api/auth/session/route.js"]) check(`${f} uses the shared limiter`, read(f).includes("limitRequest("));
for (const f of ["app/api/jobs/reconcile/route.js", "app/api/credits/reconcile/route.js", "app/api/storage/cleanup/route.js"]) {
  const src = read(f);
  check(`${f}: GET alias delegates to the same secret-checked handler`, /export async function GET\(request\) \{ return POST\(request\); \}/.test(src) && src.includes("timingSafeEqual"));
}
check("cleanup route also runs retention + rate-limit cleanup", read("app/api/storage/cleanup/route.js").includes("redactExpiredInputs") && read("app/api/storage/cleanup/route.js").includes("deleteExpiredRateLimits"));

// ======================= 5. secrets never reach the browser =======================
const sources = walk(".").filter((f) => !f.startsWith("scripts/") && !f.startsWith("docs/"));
const clientFiles = sources.filter((f) => /^["']use client["']/.test(read(f).trimStart())).concat(["lib/firebase/client.js", "lib/auth/client.js"]);
for (const f of clientFiles) {
  const bad = (read(f).match(/process\.env\.(\w+)/g) || []).filter((m) => !/process\.env\.(NEXT_PUBLIC_\w+|NODE_ENV)$/.test(m));
  check(`client code reads only NEXT_PUBLIC_ env vars: ${f}`, bad.length === 0);
}
for (const f of sources) {
  const src = read(f);
  check(`no hardcoded provider/API key or private key: ${f}`, !/sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA )?PRIVATE KEY-----\s*[A-Za-z0-9+\/\\n]{40,}/.test(src));
}
{ const rx = /sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA )?PRIVATE KEY-----\s*[A-Za-z0-9+\/\\n]{40,}/;
  check("secret scan catches an OpenAI-style key", rx.test("const k = 'sk-" + "a".repeat(30) + "'"));
  check("secret scan catches a Google API key", rx.test("AIza" + "B".repeat(35)));
  check("secret scan catches a pasted private key", rx.test("-----BEGIN PRIVATE KEY-----\n" + "MIIEvQIBADANBgkqhkiG9w0B".repeat(4)));
  check("secret scan ignores the words 'BEGIN PRIVATE KEY'", !rx.test('key.includes("BEGIN PRIVATE KEY")')); }
check(".env files are git-ignored", /\.env\.local/.test(read(".gitignore")) && /^\.env$/m.test(read(".gitignore")));
check(".env.example has no real-looking values", !/=\s*(sk-|AIza|-----BEGIN)/.test(read(".env.example")));

// ======================= 6. no internal error text leaks =======================
for (const f of sources.filter((x) => x.startsWith("app/api/") || x.startsWith("lib/actions/"))) {
  read(f).split("\n").forEach((line, i) => {
    if (/error:\s*(err|e)\b[.?]/.test(line) || /\.stack\b/.test(line)) check(`error text only returned for known error classes (${f}:${i + 1})`, /instanceof/.test(line) && !/\.stack\b/.test(line));
  });
}

// ======================= 7. headers, Next 16, firebase config =======================
const cfg = read("next.config.mjs");
for (const h of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Strict-Transport-Security"]) check(`security header present: ${h}`, cfg.includes(h));
check("COOP allows popups (Google sign-in) and is never plain same-origin", /Cross-Origin-Opener-Policy", value: "same-origin-allow-popups"/.test(cfg));
check("X-Powered-By is off", cfg.includes("poweredByHeader: false"));
check("Next 16 proxy.js exists and exports proxy + matcher", fs.existsSync("proxy.js") && /export function proxy\(/.test(read("proxy.js")) && /matcher:\s*\["\/dashboard/.test(read("proxy.js")));
check("middleware.js is gone (having both proxy.js and middleware.js is an error in Next 16)", !fs.existsSync("middleware.js"));
check("the proxy still only gates on the session cookie (real checks stay in layouts)", read("proxy.js").includes("__session") && /requireUser\(/.test(read("app/dashboard/layout.jsx")) && /requireRole\(/.test(read("app/admin/layout.jsx")));
const fj = JSON.parse(read("firebase.json"));
check("firebase.json points at existing rules and indexes files", [fj.firestore?.rules, fj.firestore?.indexes, fj.storage?.rules].every((p) => p && fs.existsSync(p)));

// ======================= 8. wiring =======================
check("createJob stamps redactAt from the retention setting", read("lib/ai/jobs.js").includes("redactAt: Timestamp.fromMillis(redactAtMs(Date.now(), LIMITS.inputRetentionDays))"));
check("retention is configured", /inputRetentionDays:\s*\d+/.test(read("config/limits.js")));
check("limit.js and maintenance.js are server-only", read("lib/security/limit.js").includes('import "server-only"') && read("lib/ops/maintenance.js").includes('import "server-only"'));
const pkg = JSON.parse(read("package.json"));
check("package scripts: verify + preflight", pkg.scripts.verify && pkg.scripts.preflight && pkg.scripts["test:hardening"]);
check("every test suite is picked up by `npm run verify`", fs.readdirSync("scripts").filter((f) => /^verify-.+\.mjs$/.test(f) && f !== "verify-all.mjs").length >= 9);

if (failed) process.exit(1);
console.log("hardening OK");
