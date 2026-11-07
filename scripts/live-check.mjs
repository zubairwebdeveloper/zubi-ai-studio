// Live self-test against YOUR real Firebase project.
//   node --env-file=.env.local scripts/live-check.mjs --yes
// Options: --skip-rules  --skip-storage  --skip-providers
// It creates temporary documents whose ids start with "livecheck_", never reads or changes real users' data, and
// deletes everything it created. It prints names and counts only, never secrets. Send the output to your developer/assistant.
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { runLiveChecks, formatReport } from "../lib/ops/live-checks.js";
import { checkProvidersHealth } from "../lib/ai/registry.js";

const args = process.argv.slice(2);
const results = [];
const add = (group, name, status, detail = "") => results.push({ group, name, status, detail });
const guard = async (group, name, fn) => { try { const d = await fn(); d?.skip ? add(group, name, "skip", d.skip) : add(group, name, d?.warn ? "warn" : "pass", d?.warn || (typeof d === "string" ? d : "")); } catch (e) { add(group, name, "fail", String(e?.message || e)); } };

// ---- environment (names only)
const required = ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) { console.error(`Missing environment variables: ${missing.join(", ")}.\nRun with: node --env-file=.env.local scripts/live-check.mjs --yes`); process.exit(1); }
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const bucketName = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
console.log(`Project: ${projectId}\nStorage bucket: ${bucketName || "(not set)"}`);
console.log('This creates and deletes temporary documents named "livecheck_..." in this project.');
if (!args.includes("--yes")) { console.log("\nRun again with --yes to start:\n  node --env-file=.env.local scripts/live-check.mjs --yes"); process.exit(2); }

initializeApp({
  credential: cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") }),
  storageBucket: bucketName || undefined,
});
const db = getFirestore();

// ---- 1. environment
const pkgVersion = (name) => { try { return JSON.parse(fs.readFileSync(`node_modules/${name}/package.json`, "utf8")).version; } catch { return null; } };
await guard("environment", "Node.js 20 or newer", () => { const major = Number(process.versions.node.split(".")[0]); if (major < 20) throw new Error(`Node ${process.version} is too old; use 20 or newer`); return process.version; });
await guard("environment", "dependencies are installed", () => { const v = { next: pkgVersion("next"), react: pkgVersion("react"), "firebase-admin": pkgVersion("firebase-admin"), unpdf: pkgVersion("unpdf") }; if (!v.next || !v["firebase-admin"]) throw new Error("run npm install first"); return Object.entries(v).map(([k, x]) => `${k} ${x ?? "NOT INSTALLED"}`).join(", "); });
await guard("environment", "request gate file matches your Next.js version (proxy.js on 16, middleware.js on 15)", () => {
  const major = Number((pkgVersion("next") || "0").split(".")[0]);
  const proxy = fs.existsSync("proxy.js"), mw = fs.existsSync("middleware.js");
  if (proxy && mw) throw new Error("BOTH proxy.js and middleware.js exist: delete one (Next.js 16 refuses to build with both)");
  if (major >= 16 && !proxy) return { warn: "Next.js 16 but no proxy.js: /dashboard and /admin are still protected by their layouts, but the cookie gate is missing" };
  if (major === 15 && proxy && !mw) return { warn: "Next.js 15 ignores proxy.js: rename it to middleware.js (function name: middleware). Layouts still protect the pages" };
  return `Next.js ${major}: ${proxy ? "proxy.js" : mw ? "middleware.js" : "no gate file"}`;
});

// ---- 2. Firebase Auth reachable with the service account
await guard("firebase", "Admin credentials work (Authentication)", async () => { await getAuth().listUsers(1); return "ok"; });

// ---- 3. the real checks: credits, rate limiter, API keys, Firestore behavior, indexes
try {
  const live = await runLiveChecks({
    db,
    deps: { serverTimestamp: () => FieldValue.serverTimestamp(), toTimestamp: (ms) => Timestamp.fromMillis(ms), increment: (n) => FieldValue.increment(n), now: () => Date.now() },
  });
  results.push(...live.results);
} catch (e) { add("firestore", "live checks could not run", "fail", String(e?.message || e)); }

// ---- 4. Storage (server side)
if (!args.includes("--skip-storage")) {
  await guard("storage", "write, read back and delete a file in your bucket", async () => {
    if (!bucketName) throw new Error("no bucket configured (FIREBASE_ADMIN_STORAGE_BUCKET)");
    const file = getStorage().bucket(bucketName).file(`livecheck/${randomBytes(5).toString("hex")}.txt`);
    try {
      await file.save(Buffer.from("livecheck"), { contentType: "text/plain", resumable: false });
      const [buf] = await file.download();
      if (buf.toString() !== "livecheck") throw new Error("file content did not match");
    } finally { await file.delete({ ignoreNotFound: true }).catch(() => {}); }
    return "ok";
  });
}

// ---- 5. security rules, probed by an UNAUTHENTICATED client (what a stranger on the internet can do)
const COLLECTIONS = ["users", "creditWallets", "creditTransactions", "creditReservations", "generations", "generationJobs", "favorites", "projects", "notifications",
  "projectAssets", "documentTexts", "apiKeys", "apiUsage", "tools", "auditLogs", "rateLimits", "platformSettings", "livecheck_unknown_collection"];
if (!args.includes("--skip-rules")) {
  const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) add("security rules", "probe with an unauthenticated client", "skip", "NEXT_PUBLIC_FIREBASE_* not set");
  else {
    const { initializeApp: initClient, deleteApp } = await import("firebase/app");
    const { getFirestore: clientFirestore, doc, getDoc, setDoc, terminate } = await import("firebase/firestore");
    const client = initClient(cfg, `livecheck-${randomBytes(3).toString("hex")}`);
    const cdb = clientFirestore(client);
    const timeout = (p, ms = 15000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("timed out"), { code: "timeout" })), ms))]);
    const probe = async (name, fn, deniedCodes) => {
      try { await timeout(fn()); add("security rules", name, "fail", "ALLOWED: a stranger can do this. Deploy firebase/firestore.rules and storage.rules"); }
      catch (e) { deniedCodes.includes(e?.code) ? add("security rules", name, "pass") : add("security rules", name, "warn", `inconclusive (${e?.code || e?.message}): check your network and that the rules are deployed`); }
    };
    try {
      for (const col of COLLECTIONS) {
        await probe(`anonymous user cannot READ ${col}`, () => getDoc(doc(cdb, col, "livecheck_probe")), ["permission-denied"]);
        await probe(`anonymous user cannot WRITE ${col}`, () => setDoc(doc(cdb, col, "livecheck_probe"), { probe: true }), ["permission-denied"]);
      }
      if (!args.includes("--skip-storage") && cfg.storageBucket) {
        const { getStorage: clientStorage, ref, uploadString, getMetadata } = await import("firebase/storage");
        const st = clientStorage(client), r = ref(st, "users/livecheck_probe/probe.txt");
        await probe("anonymous user cannot UPLOAD to Storage", () => uploadString(r, "x"), ["storage/unauthorized", "storage/unauthenticated"]);
        await probe("anonymous user cannot READ from Storage", () => getMetadata(r), ["storage/unauthorized", "storage/unauthenticated"]);
      }
    } finally {
      await terminate(cdb).catch(() => {}); await deleteApp(client).catch(() => {});
      // if any write was wrongly allowed, remove the probe documents it created
      for (const col of COLLECTIONS) await db.collection(col).doc("livecheck_probe").delete().catch(() => {});
      if (bucketName) await getStorage().bucket(bucketName).file("users/livecheck_probe/probe.txt").delete({ ignoreNotFound: true }).catch(() => {});
    }
  }
}

// ---- 6. providers (free "list models / account" calls; nothing is generated or billed)
if (!args.includes("--skip-providers")) {
  try {
    for (const p of await checkProvidersHealth()) {
      if (!p.configured) add("providers", `${p.name}`, "skip", "not configured");
      else add("providers", `${p.name} is reachable and the key is accepted`, p.ok ? "pass" : "fail", p.ok ? `${p.latencyMs} ms` : p.error);
    }
  } catch (e) { add("providers", "health check could not run", "fail", String(e?.message || e)); }
}

console.log(formatReport(results));
console.log("\nWhat this does NOT test: sign-up/login flows, email delivery, the web pages, `next build`, or rules for signed-in users. See docs/RUNBOOK.md for the manual smoke test.");
process.exit(results.some((r) => r.status === "fail") ? 1 : 0);
