// Run: npm run test:api  (no network, no Firebase)
import fs from "node:fs";
import path from "node:path";
import { generateApiKey, hashKey, parseBearer, apiSupports, validateApiJobBody, IDEMPOTENCY_RE, KEY_PREFIX } from "../lib/api/keys.js";
import { createApiKeyService, ApiKeyError } from "../lib/api/keys-core.js";
import { fakeFirestore, fakeIncrement } from "./lib/fake-firestore.mjs";
import { toolBindings } from "../config/tool-bindings.js";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };
const read = (f) => fs.readFileSync(f, "utf8");
const throwsCode = async (fn) => { try { await fn(); } catch (e) { return e?.code; } return null; };
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f === ".next") continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|mjs)$/.test(f) && out.push(p.replaceAll("\\", "/")); } return out; }

// ======================= pure helpers =======================
{ const k = generateApiKey();
  check("key format: ais_ + 43 url-safe chars", /^ais_[A-Za-z0-9_-]{43}$/.test(k.key) && k.key.startsWith(KEY_PREFIX));
  check("hash is sha256 hex and is not the key", /^[0-9a-f]{64}$/.test(k.hash) && !k.hash.includes(k.key) && hashKey(k.key) === k.hash);
  check("publicId = first 16 hash chars; prefix/last4 reveal little", k.publicId === k.hash.slice(0, 16) && k.prefix.length === 8 && k.last4.length === 4 && k.key.length === 47);
  const set = new Set(Array.from({ length: 2000 }, () => generateApiKey().key));
  check("2000 generated keys are all unique", set.size === 2000); }
check("hash differs for different keys", hashKey("a") !== hashKey("b"));

{ const k = generateApiKey().key;
  check("parseBearer accepts a valid header (case-insensitive scheme)", parseBearer(`Bearer ${k}`) === k && parseBearer(`bearer ${k}`) === k);
  for (const bad of [undefined, null, "", "Bearer", `Bearer  ${k}x`, `Basic ${k}`, `Bearer ${k.slice(0, -1)}`, `Bearer ${k}A`, `Bearer ${"x".repeat(47)}`, `Bearer ais_${"!".repeat(43)}`, `Bearer ${k} extra`, 12345])
    check(`parseBearer rejects: ${String(bad).slice(0, 30)}`, parseBearer(bad) === null); }

check("apiSupports: text-only tools yes, image/doc inputs no", apiSupports(toolBindings["ai-translator"]) && apiSupports(toolBindings["ai-image-generator"]) && apiSupports(toolBindings["ai-chat-assistant"])
  && !apiSupports(toolBindings["ai-background-remover"]) && !apiSupports(toolBindings["ai-image-editor"]) && !apiSupports(toolBindings["pdf-summarizer"]) && !apiSupports(toolBindings["chat-with-pdf"]) && !apiSupports(undefined));
check("idempotency key format", IDEMPOTENCY_RE.test("a".repeat(16)) && !IDEMPOTENCY_RE.test("short") && !IDEMPOTENCY_RE.test("has spaces in it!!") && !IDEMPOTENCY_RE.test("a".repeat(65)));

{ const ok = validateApiJobBody({ tool: "ai-translator", text: "  hello ", options: { targetLanguage: "Urdu" } });
  check("valid body", ok.ok && ok.value.toolSlug === "ai-translator" && ok.value.text === "hello" && ok.value.options.targetLanguage === "Urdu");
  check("assetId is never accepted from the API", !("assetId" in validateApiJobBody({ tool: "a", assetId: "x" }).value));
  for (const bad of [null, [], "x", 5, {}, { tool: 5 }, { tool: "../x" }, { tool: "a", text: 5 }, { tool: "a", text: "x".repeat(50_001) }, { tool: "a", options: [] }, { tool: "a", options: { k: 5 } }, { tool: "a", options: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, "v"])) },
    { tool: "a", history: "x" }, { tool: "a", history: [{ role: "system", text: "x" }] }, { tool: "a", history: Array(13).fill({ role: "user", text: "x" }) }])
    check(`invalid body rejected: ${JSON.stringify(bad)?.slice(0, 50)}`, !validateApiJobBody(bad).ok);
  check("history only keeps role+text", JSON.stringify(validateApiJobBody({ tool: "a", history: [{ role: "user", text: "hi", evil: 1 }] }).value.history) === '[{"role":"user","text":"hi"}]'); }

// ======================= key service (fake Firestore) =======================
function mk(extra = {}) {
  let t = Date.parse("2026-11-04T10:00:00Z"), tick = 0; const fdb = fakeFirestore(); let reads = 0;
  const counting = new Proxy(fdb, { get: (o, p) => (p === "collection" ? (...a) => { reads++; return o.collection(...a); } : o[p]) });
  const service = createApiKeyService({ getDb: () => counting, serverTimestamp: () => t + ++tick, increment: fakeIncrement, now: () => t, ...extra });
  return { service, fdb, advance: (ms) => { t += ms; }, reads: () => reads };
}
const addUser = (fdb, uid, status = "active") => fdb.store.set(`users/${uid}`, { status, role: "USER" });

{ const { service, fdb } = mk(); addUser(fdb, "u1");
  const c = await service.create({ uid: "u1", name: " Production " });
  check("create returns the secret once", /^ais_/.test(c.key) && c.name === "Production");
  const stored = [...fdb.store.entries()].filter(([p]) => p.startsWith("apiKeys/"));
  check("only the hash is stored: the secret appears nowhere in the database", stored.length === 1 && stored[0][0] === `apiKeys/${hashKey(c.key)}` && !JSON.stringify([...fdb.store.values()]).includes(c.key));
  const listed = await service.list("u1");
  check("list never exposes the secret or the hash", listed.length === 1 && !JSON.stringify(listed).includes(c.key) && !JSON.stringify(listed).includes(hashKey(c.key)) && listed[0].publicId === c.publicId && listed[0].last4 === c.last4);
  const auth = await service.authenticate(c.key);
  check("authenticate returns the owner", auth?.uid === "u1" && auth.publicId === c.publicId);
  check("a wrong key (even one character off) does not authenticate", await service.authenticate(c.key.slice(0, -1) + (c.key.at(-1) === "A" ? "B" : "A")) === null);
  check("non-string input is rejected", await service.authenticate(undefined) === null && await service.authenticate({ a: 1 }) === null);
  check("names must be 1-60 chars", await throwsCode(() => service.create({ uid: "u1", name: "  " })) === "bad_name" && await throwsCode(() => service.create({ uid: "u1", name: "x".repeat(61) })) === "bad_name" && await throwsCode(() => service.create({ uid: "u1", name: 5 })) === "bad_name");

  check("another user cannot revoke my key", (await service.revoke({ uid: "u2", publicId: c.publicId })) === false && (await service.authenticate(c.key)) !== null);
  check("revoking an unknown id returns false", (await service.revoke({ uid: "u1", publicId: "nope" })) === false);
  check("owner can revoke; the key stops working immediately", (await service.revoke({ uid: "u1", publicId: c.publicId })) === true && (await service.authenticate(c.key)) === null);
  check("revoking twice is harmless", (await service.revoke({ uid: "u1", publicId: c.publicId })) === true);
  check("revoked keys are listed as revoked", (await service.list("u1"))[0].revoked === true); }

{ const { service, fdb } = mk(); addUser(fdb, "u1");
  const keys = []; for (let i = 0; i < 5; i++) keys.push(await service.create({ uid: "u1", name: `k${i}` }));
  check("the 6th active key is refused", await throwsCode(() => service.create({ uid: "u1", name: "k6" })) === "too_many_keys");
  await service.revoke({ uid: "u1", publicId: keys[0].publicId });
  check("revoked keys do not count against the limit", (await service.create({ uid: "u1", name: "k6" })).key.startsWith("ais_"));
  check("another user is not affected by this user's limit", (await service.create({ uid: "u2", name: "mine" })).key.startsWith("ais_"));
  check("list shows only my keys, active first", (await service.list("u1")).length === 6 && (await service.list("u1"))[0].revoked === false && (await service.list("u2")).length === 1); }

{ const { service, fdb } = mk(); addUser(fdb, "u1");
  const c = await service.create({ uid: "u1", name: "k" });
  fdb.store.set("users/u1", { status: "suspended", role: "USER" });
  check("a suspended owner's key stops working", await service.authenticate(c.key) === null);
  fdb.store.set("users/u1", { status: "active", role: "USER" });
  check("restoring the account restores the key", (await service.authenticate(c.key)) !== null);
  fdb.store.delete("users/u1");
  check("a key whose owner no longer exists is refused", await service.authenticate(c.key) === null); }

{ const { service, fdb, advance } = mk(); addUser(fdb, "u1");
  const c = await service.create({ uid: "u1", name: "k" });
  const hk = `apiKeys/${hashKey(c.key)}`;
  await service.authenticate(c.key);
  const first = fdb.store.get(hk).lastUsedAt;
  advance(5 * 60_000); await service.authenticate(c.key);
  check("lastUsedAt is throttled (not rewritten on every request)", fdb.store.get(hk).lastUsedAt === first);
  advance(2 * 3600_000); await service.authenticate(c.key);
  check("lastUsedAt refreshes after an hour", fdb.store.get(hk).lastUsedAt > first); }

{ const { service, fdb, advance } = mk(); addUser(fdb, "u1");
  const c = await service.create({ uid: "u1", name: "k" }); const auth = await service.authenticate(c.key);
  await Promise.all(Array.from({ length: 20 }, () => service.recordUsage(auth)));
  await service.recordUsage(auth, { requests: 0, jobs: 1 });
  const row = [...fdb.store.entries()].find(([p]) => p.startsWith("apiUsage/"))[1];
  check("usage counts requests and jobs per key per day", row.requests === 20 && row.jobsCreated === 1 && row.ownerId === "u1" && row.publicId === c.publicId);
  advance(24 * 3600_000); await service.recordUsage(auth);
  const rows = await service.usage("u1");
  check("a new day starts a new usage row; newest first", rows.length === 2 && rows[0].day > rows[1].day && rows[0].requests === 1);
  check("usage is private to the owner", (await service.usage("u2")).length === 0); }

{ const { service, reads } = mk(); const before = reads();
  await service.authenticate(null).catch(() => {});
  check("junk input costs no database read", reads() === before); }

// ======================= wiring and security (structure) =======================
const v1 = walk("app/api/v1").filter((f) => f.endsWith("/route.js"));
check("v1 routes exist (tools, jobs, jobs/[id], assets/[id])", v1.length === 4);
for (const f of v1) {
  const s = read(f);
  check(`${f}: API-key auth, never cookies`, s.includes("authenticateApiRequest") && !s.includes("getSessionUser") && !s.includes("cookies("));
  check(`${f}: no wildcard CORS (keys must not be used from browsers)`, !/Access-Control-Allow-Origin/i.test(s));
}
const auth = read("lib/api/auth.js");
check("auth: per-IP limit BEFORE any key lookup, then per-key limit", auth.indexOf("apiip") > 0 && auth.indexOf("apiip") < auth.indexOf("authenticate(") && auth.indexOf("authenticate(") < auth.indexOf("apikey"));
check("auth: format check happens before the database (parseBearer)", auth.includes("parseBearer("));
check("auth: one uniform 401 for missing/invalid/revoked", (auth.match(/"unauthorized"/g) || []).length === 1);
check("auth: responses are never cached", auth.includes('"Cache-Control": "no-store"'));
const jobs = read("app/api/v1/jobs/route.js");
check("POST /v1/jobs requires an Idempotency-Key (no accidental double charge)", jobs.includes("idempotency-key") && jobs.includes("IDEMPOTENCY_RE"));
check("POST /v1/jobs runs the SAME pipeline as the dashboard (createJob: credits, caps, overrides)", jobs.includes("createJob(") && jobs.includes("runJob(") && jobs.includes("apiSupports("));
check("POST /v1/jobs takes the user from the key, not from the body", jobs.includes("uid: a.auth.uid") && !/body\.(uid|userId|user)\b/.test(jobs));
check("job results are owner-scoped", /userId !== a\.auth\.uid/.test(read("app/api/v1/jobs/[id]/route.js")) && read("app/api/v1/assets/[id]/route.js").includes("loadOwnedAsset(id.data, a.auth.uid)"));
check("tools endpoint lists only API-usable, live tools", read("app/api/v1/tools/route.js").includes("apiSupports(") && read("app/api/v1/tools/route.js").includes("liveSlugs"));
check("keys-core stays free of Firebase imports", !/from "(firebase|@\/)/.test(read("lib/api/keys-core.js")) && !/from "(firebase|@\/)/.test(read("lib/api/keys.js")));
check("service wiring is server-only", read("lib/api/service.js").includes('import "server-only"') && read("lib/api/auth.js").includes('import "server-only"'));
const act = read("lib/actions/api-keys.js");
check("key actions authenticate first and never return the hash", (act.match(/await requireUser\(/g) || []).length === (act.match(/export async function/g) || []).length && !/hash/i.test(act));
const rules = read("firebase/firestore.rules");
check("apiKeys/apiUsage have no client access (default deny)", !/match \/apiKeys/.test(rules) && !/match \/apiUsage/.test(rules));
check("index for the usage query", JSON.parse(read("firebase/firestore.indexes.json")).indexes.some((i) => i.collectionGroup === "apiUsage" && i.fields.map((f) => f.fieldPath).join() === "ownerId,day"));
for (const f of walk(".")) if (/^["']use client["']/.test(read(f).trimStart())) check(`client file must not import the API key service: ${f}`, !/lib\/api\/(service|auth|keys-core)/.test(read(f)));
check("the key is only ever shown in the create response, never logged", !/console\.(log|error|warn)\([^)]*\bkey\b/.test(read("lib/api/service.js") + read("lib/api/auth.js") + act));
check("nav links to the developer page", read("config/dashboard-nav.js").includes('"/dashboard/developer"') && fs.existsSync("app/dashboard/developer/page.jsx"));

if (failed) process.exit(1);
console.log("developer api OK");
