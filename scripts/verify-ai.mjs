// Run: npm run test:ai
// Tests the engine with an in-memory store and mock adapters/fetch. No network, no real provider is called.
import fs from "node:fs";
import path from "node:path";
import { executeJob } from "../lib/ai/engine.js";
import { ProviderError, fromHttpStatus } from "../lib/ai/errors.js";
import { withRetry } from "../lib/ai/retry.js";
import { jobIdFor } from "../lib/ai/ids.js";
import { getAvailableModels } from "../lib/ai/registry.js";
import { gemini } from "../lib/ai/providers/gemini.js";
import { openai } from "../lib/ai/providers/openai.js";
import { toolBindings } from "../config/tool-bindings.js";
import { getTool } from "../lib/tools/registry.js";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };
const noSleep = async () => {};

function memStore(job) {
  const j = { status: "queued", attempts: 0, providerJobId: null, nextPollAt: null, ...job };
  return {
    j,
    async claim() {
      const due = j.status === "processing" && j.providerJobId && (j.nextPollAt || 0) <= Date.now();
      if (j.status !== "queued" && !due) return null;
      j.status = "processing"; j.attempts++; return { ...j };
    },
    async progress(_id, p) { Object.assign(j, p); },
    async complete(_id, p) { if (j.status === "processing") Object.assign(j, p, { status: "succeeded" }); },
    async fail(_id, p) { if (j.status !== "succeeded") Object.assign(j, p, { status: "failed" }); },
  };
}
const run = (store, adapter) => executeJob({ jobId: "x", store, getAdapter: () => adapter, sleep: noSleep });
const ok = { state: "succeeded", output: { text: "hi" }, usage: { inputTokens: 1, outputTokens: 2 } };

// 1. success
{ const s = memStore(); await run(s, { submit: async () => ok });
  check("success path", s.j.status === "succeeded" && s.j.output.text === "hi" && s.j.usage.outputTokens === 2); }

// 2. retryable failures then success
{ let n = 0; const s = memStore();
  await run(s, { submit: async () => { if (++n < 3) throw fromHttpStatus(503, "x"); return ok; } });
  check("retries then succeeds", n === 3 && s.j.status === "succeeded"); }

// 3. retries exhausted -> failed, no provider internals in public message
{ let n = 0; const s = memStore();
  await run(s, { submit: async () => { n++; throw fromHttpStatus(503, "secret upstream detail"); } });
  check("exhausts retries (1 + 2)", n === 3 && s.j.status === "failed" && s.j.retryable === true);
  check("public message hides internals", !/503|secret|HTTP/.test(s.j.publicMessage) && /secret/.test(s.j.internalMessage)); }

// 4. non-retryable: exactly one attempt
{ let n = 0; const s = memStore();
  await run(s, { submit: async () => { n++; throw fromHttpStatus(400, "bad"); } });
  check("no retry on 400", n === 1 && s.j.status === "failed" && s.j.retryable === false); }

// 5. two workers racing for one job: provider is called once
{ let n = 0; const s = memStore();
  const adapter = { submit: async () => { n++; return ok; } };
  await Promise.all([run(s, adapter), run(s, adapter)]);
  check("double execution prevented", n === 1); }

// 6. async provider: submit returns a provider id, a later run polls
{ let submits = 0, polls = 0; const s = memStore();
  const adapter = {
    submit: async () => { submits++; return { state: "processing", providerJobId: "p1", pollAfterSec: 0 }; },
    poll: async ({ job }) => { polls++; return job.providerJobId === "p1" ? ok : (() => { throw new Error("no id"); })(); },
  };
  await run(s, adapter);
  check("async: parked as processing", s.j.status === "processing" && s.j.providerJobId === "p1");
  await new Promise((r) => setTimeout(r, 5));
  await run(s, adapter);
  check("async: polled once, submitted once", submits === 1 && polls === 1 && s.j.status === "succeeded"); }

// 7. terminal jobs are never re-run
{ let n = 0; const s = memStore({ status: "succeeded" });
  const r = await run(s, { submit: async () => { n++; return ok; } });
  check("terminal job skipped", n === 0 && r.status === "skipped"); }

// 8. unknown adapter result fails safely
{ const s = memStore(); await run(s, { submit: async () => ({ state: "weird" }) });
  check("bad adapter result fails", s.j.status === "failed"); }

// 9. ids / errors / retry helpers
check("jobId deterministic", jobIdFor("u1", "k".repeat(20)) === jobIdFor("u1", "k".repeat(20)));
check("jobId differs per user", jobIdFor("u1", "k".repeat(20)) !== jobIdFor("u2", "k".repeat(20)));
check("http classification", fromHttpStatus(429).retryable && fromHttpStatus(500).retryable && !fromHttpStatus(400).retryable && !fromHttpStatus(401).retryable);
{ let n = 0; try { await withRetry(async () => { n++; throw new ProviderError("x", { retryable: true }); }, { retries: 1, sleep: noSleep }); } catch {}
  check("withRetry respects limit", n === 2); }

// 10. registry: available only with key AND model id
const env = (o) => { for (const k of ["GEMINI_API_KEY","GEMINI_TEXT_MODEL","OPENAI_API_KEY","OPENAI_TEXT_MODEL","AI_PREFERRED_PROVIDER"]) delete process.env[k]; Object.assign(process.env, o); };
env({}); check("nothing configured -> no models", getAvailableModels("text").length === 0);
env({ GEMINI_API_KEY: "k" }); check("key without model id -> unavailable", getAvailableModels("text").length === 0);
env({ GEMINI_API_KEY: "k", GEMINI_TEXT_MODEL: "m1" }); check("gemini available", getAvailableModels("text")[0]?.providerModel === "m1");
env({ GEMINI_API_KEY: "k", GEMINI_TEXT_MODEL: "m1", OPENAI_API_KEY: "o", OPENAI_TEXT_MODEL: "m2", AI_PREFERRED_PROVIDER: "openai" });
check("preferred provider first", getAvailableModels("text")[0]?.providerId === "openai");

// 11. provider request shape (mock fetch): key in header not URL, correct body and parsing
const realFetch = globalThis.fetch;
let seen;
globalThis.fetch = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify(seen.url.includes("googleapis")
  ? { candidates: [{ content: { parts: [{ text: "G" }] } }], usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4 } }
  : { choices: [{ message: { content: "O" } }], usage: { prompt_tokens: 5, completion_tokens: 6 } }), { status: 200 }); };
env({ GEMINI_API_KEY: "SECRET_G", OPENAI_API_KEY: "SECRET_O" });
{ const r = await gemini.generateText({ model: "models/m1", system: "s", prompt: "p", maxOutputTokens: 9 });
  const body = JSON.parse(seen.init.body);
  check("gemini parse+usage", r.text === "G" && r.usage.inputTokens === 3 && r.usage.outputTokens === 4);
  check("gemini key in header only", seen.init.headers["x-goog-api-key"] === "SECRET_G" && !seen.url.includes("SECRET_G"));
  check("gemini url/body", seen.url.includes("/models/m1:generateContent") && body.contents[0].parts[0].text === "p" && body.generationConfig.maxOutputTokens === 9); }
{ const r = await openai.generateText({ model: "m2", system: "s", prompt: "p", maxOutputTokens: 7 });
  const body = JSON.parse(seen.init.body);
  check("openai parse+usage", r.text === "O" && r.usage.outputTokens === 6);
  check("openai auth header, key not in URL/body", seen.init.headers.Authorization === "Bearer SECRET_O" && !seen.url.includes("SECRET_O") && !seen.init.body.includes("SECRET_O"));
  check("openai body", body.model === "m2" && body.max_completion_tokens === 7 && body.messages[1].content === "p"); }
globalThis.fetch = async () => new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY" }] }), { status: 200 });
{ let err; try { await gemini.generateText({ model: "m", system: "s", prompt: "p", maxOutputTokens: 1 }); } catch (e) { err = e; }
  check("empty output is a non-retryable error", err?.code === "empty_output" && !err.retryable); }
globalThis.fetch = async () => new Response("rate limited", { status: 429 });
{ let err; try { await openai.generateText({ model: "m", system: "s", prompt: "p", maxOutputTokens: 1 }); } catch (e) { err = e; }
  check("429 is retryable and sanitized", err?.retryable === true && !/429/.test(err.publicMessage)); }
globalThis.fetch = realFetch; env({});

// 12. bindings reference real tools and have sane limits
for (const [slug, b] of Object.entries(toolBindings)) {
  check(`binding tool exists: ${slug}`, !!getTool(slug));
  if (b.kind === "text") check(`text binding limits: ${slug}`, b.system && b.maxInputChars > 0 && b.maxOutputTokens > 0);
  else check(`non-text binding declares operation + inputs: ${slug}`, ["image", "document"].includes(b.kind) && b.operation && Array.isArray(b.inputs) && b.inputs.length > 0);
}

// 13. structure: server-only boundary and secrets
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f === ".next") continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|mjs)$/.test(f) && out.push(p); } return out; }
for (const f of walk(".")) {
  const src = fs.readFileSync(f, "utf8");
  if (/^["']use client["']/.test(src.trimStart())) check(`client file must not import lib/ai or admin: ${f}`, !/lib\/ai\/|lib\/firebase\/admin/.test(src));
}
for (const f of ["lib/ai/store.js", "lib/ai/jobs.js", "lib/ai/run-job.js", "lib/ai/availability.js"]) check(`${f} is server-only`, fs.readFileSync(f, "utf8").includes('import "server-only"'));
check("no provider key in NEXT_PUBLIC vars", !/NEXT_PUBLIC_(GEMINI|OPENAI|REPLICATE|FAL|ELEVEN|REMOVE|HUGGING)/.test(fs.readFileSync(".env.example", "utf8")));
for (const f of ["app/api/jobs/route.js", "app/api/jobs/[id]/route.js", "app/api/ai/health/route.js"]) check(`${f} authenticates`, fs.readFileSync(f, "utf8").includes("getSessionUser"));
check("reconcile requires secret", fs.readFileSync("app/api/jobs/reconcile/route.js", "utf8").includes("timingSafeEqual"));

if (failed) process.exit(1);
console.log("ai engine OK");
