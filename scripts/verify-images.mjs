// Run: npm run test:images  (no network, no Firebase: providers use a mocked fetch, storage is injected)
import fs from "node:fs";
import path from "node:path";
import { sniffImageType, validateImageBuffer } from "../lib/storage/validate.js";
import { removeBackground } from "../lib/ai/providers/removebg.js";
import { generateImage, editImage } from "../lib/ai/providers/openai-images.js";
import { createImageAdapter } from "../lib/ai/adapters/image.js";
import { executeJob } from "../lib/ai/engine.js";
import { getAvailableModels, getModel } from "../lib/ai/registry.js";
import { toolBindings } from "../config/tool-bindings.js";
import { getTool } from "../lib/tools/registry.js";

let failed = 0;
const check = (name, cond) => { if (!cond) { failed++; console.error("FAIL:", name); } };

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 2)]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(16)]);

// ---- 1. file sniffing / validation
check("png", sniffImageType(PNG) === "image/png");
check("jpeg", sniffImageType(JPG) === "image/jpeg");
check("webp", sniffImageType(WEBP) === "image/webp");
check("svg rejected", sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')) === null);
check("gif rejected", sniffImageType(Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(20)])) === null);
check("exe rejected", sniffImageType(Buffer.concat([Buffer.from("MZ"), Buffer.alloc(30)])) === null);
check("html rejected", sniffImageType(Buffer.from("<html><body>hello world</body></html>")) === null);
check("truncated rejected", sniffImageType(PNG.subarray(0, 6)) === null);
check("empty rejected", !validateImageBuffer(Buffer.alloc(0), { maxBytes: 100 }).ok);
check("oversize rejected", !validateImageBuffer(PNG, { maxBytes: 10 }).ok);
check("valid accepted", validateImageBuffer(PNG, { maxBytes: 1000 }).contentType === "image/png");
// a disguised file: .png name is irrelevant, bytes decide
check("fake image bytes rejected", !validateImageBuffer(Buffer.from("not really a png at all, just text"), { maxBytes: 1000 }).ok);

// ---- 2. providers against mocked fetch
const realFetch = globalThis.fetch;
let seen;
const reply = (body, init = { status: 200 }) => async (url, i) => { seen = { url: String(url), init: i }; return new Response(body, init); };
process.env.REMOVE_BG_API_KEY = "RBG_SECRET"; process.env.OPENAI_API_KEY = "OAI_SECRET";

globalThis.fetch = reply(PNG);
{ const out = await removeBackground({ buffer: JPG, contentType: "image/jpeg" });
  const form = seen.init.body;
  check("removebg returns bytes", Buffer.isBuffer(out) && sniffImageType(out) === "image/png");
  check("removebg url + header-only key", seen.url === "https://api.remove.bg/v1.0/removebg" && seen.init.headers["X-Api-Key"] === "RBG_SECRET" && !seen.url.includes("RBG_SECRET"));
  check("removebg multipart fields", form instanceof FormData && form.get("image_file") instanceof Blob && form.get("image_file").type === "image/jpeg" && form.get("format") === "png");
  check("multipart: no manual content-type", !Object.keys(seen.init.headers).some((h) => h.toLowerCase() === "content-type")); }

globalThis.fetch = reply("no credits", { status: 402 });
{ let e; try { await removeBackground({ buffer: JPG, contentType: "image/jpeg" }); } catch (x) { e = x; }
  check("402 non-retryable, sanitized", e && !e.retryable && !/402|credit/i.test(e.publicMessage)); }
globalThis.fetch = reply("slow down", { status: 429 });
{ let e; try { await removeBackground({ buffer: JPG, contentType: "image/jpeg" }); } catch (x) { e = x; }
  check("429 retryable", e?.retryable === true); }

globalThis.fetch = reply(JSON.stringify({ data: [{ b64_json: PNG.toString("base64") }] }));
{ const out = await generateImage({ model: "m", prompt: "a cat" });
  const body = JSON.parse(seen.init.body);
  check("openai generate (b64)", sniffImageType(out) === "image/png");
  check("openai generate request", seen.url.endsWith("/images/generations") && body.model === "m" && body.prompt === "a cat" && body.n === 1 && !("response_format" in body));
  check("openai key in header only", seen.init.headers.Authorization === "Bearer OAI_SECRET" && !seen.init.body.includes("OAI_SECRET")); }

{ let calls = 0;
  globalThis.fetch = async (url, i) => { calls++; seen = { url: String(url), init: i };
    return calls === 1 ? new Response(JSON.stringify({ data: [{ url: "https://img.example/x.png" }] })) : new Response(PNG); };
  const out = await generateImage({ model: "m", prompt: "p" });
  check("openai generate (url fallback)", calls === 2 && sniffImageType(out) === "image/png"); }
globalThis.fetch = reply(JSON.stringify({ data: [{ url: "http://insecure.example/x.png" }] }));
{ let e; try { await generateImage({ model: "m", prompt: "p" }); } catch (x) { e = x; } check("non-https image url rejected", e?.code === "bad_url"); }
globalThis.fetch = reply(JSON.stringify({ data: [] }));
{ let e; try { await generateImage({ model: "m", prompt: "p" }); } catch (x) { e = x; } check("no image in response -> empty_output", e?.code === "empty_output" && !e.retryable); }

globalThis.fetch = reply(JSON.stringify({ data: [{ b64_json: PNG.toString("base64") }] }));
{ await editImage({ model: "m", prompt: "sunset", buffer: JPG, contentType: "image/jpeg" });
  const f = seen.init.body;
  check("edit multipart", seen.url.endsWith("/images/edits") && f.get("model") === "m" && f.get("prompt") === "sunset" && f.get("image") instanceof Blob && f.get("image").type === "image/jpeg"); }
globalThis.fetch = realFetch;

// ---- 3. registry availability for image models
const env = (o) => { for (const k of ["OPENAI_API_KEY", "OPENAI_IMAGE_MODEL", "REMOVE_BG_API_KEY"]) delete process.env[k]; Object.assign(process.env, o); };
env({}); check("nothing configured -> no image models", !getAvailableModels("image-generate").length && !getAvailableModels("image-remove-bg").length);
env({ OPENAI_API_KEY: "k" }); check("openai key without image model id -> unavailable", !getAvailableModels("image-generate").length);
env({ OPENAI_API_KEY: "k", OPENAI_IMAGE_MODEL: "img-1" });
check("openai image generate+edit available", getAvailableModels("image-generate")[0]?.providerModel === "img-1" && getAvailableModels("image-edit").length === 1);
env({ REMOVE_BG_API_KEY: "k" }); check("removebg needs only a key", getAvailableModels("image-remove-bg").length === 1 && getModel("removebg")?.providerId === "removebg");
env({});

// ---- 4. adapter + engine with injected storage
function memStore(job) {
  const j = { status: "queued", attempts: 0, providerJobId: null, nextPollAt: null, ...job };
  return { j,
    async claim() { if (j.status !== "queued") return null; j.status = "processing"; return { ...j }; },
    async progress() {}, async complete(_i, p) { Object.assign(j, p, { status: "succeeded" }); },
    async fail(_i, p) { Object.assign(j, p, { status: "failed" }); } };
}
const jobFor = (slug, input) => ({ id: "j", userId: "u1", toolSlug: slug, kind: "image", modelId: toolBindings[slug].modelKind === "image-remove-bg" ? "removebg" : toolBindings[slug].modelKind === "image-edit" ? "openai-image-edit" : "openai-image-generate", input });
const runAdapter = (job, deps) => { const s = memStore(job); return executeJob({ jobId: "j", store: s, getAdapter: () => createImageAdapter(deps), sleep: async () => {} }).then(() => s.j); };

env({ OPENAI_API_KEY: "k", OPENAI_IMAGE_MODEL: "img-1", REMOVE_BG_API_KEY: "k" });
{ let saved; globalThis.fetch = reply(JSON.stringify({ data: [{ b64_json: PNG.toString("base64") }] }));
  const j = await runAdapter(jobFor("ai-image-generator", { text: "cat", assetId: null }), {
    loadAsset: async () => { throw new Error("should not load"); }, saveOutput: async (a) => { saved = a; return { id: "out1" }; } });
  check("generate: stored + output assetId", j.status === "succeeded" && j.output.assetId === "out1" && saved.uid === "u1" && saved.contentType === "image/png" && saved.toolSlug === "ai-image-generator"); }

{ let loadedFor; globalThis.fetch = reply(PNG);
  const j = await runAdapter(jobFor("ai-background-remover", { text: "", assetId: "a1" }), {
    loadAsset: async (id, uid) => { loadedFor = [id, uid]; return { buffer: JPG, contentType: "image/jpeg" }; }, saveOutput: async () => ({ id: "out2" }) });
  check("remove-bg: loads the OWNER's asset", j.status === "succeeded" && loadedFor[0] === "a1" && loadedFor[1] === "u1"); }

{ globalThis.fetch = reply(JSON.stringify({ data: [{ b64_json: PNG.toString("base64") }] }));
  const j = await runAdapter(jobFor("ai-image-editor", { text: "sunset", assetId: "a1" }), {
    loadAsset: async () => ({ buffer: PNG, contentType: "image/png" }), saveOutput: async () => ({ id: "out3" }) });
  check("edit path succeeds", j.status === "succeeded" && seen.url.endsWith("/images/edits")); }

{ const j = await runAdapter(jobFor("ai-background-remover", { text: "", assetId: "gone" }), { loadAsset: async () => null, saveOutput: async () => ({ id: "x" }) });
  check("missing/foreign asset fails safely", j.status === "failed" && j.code === "asset_missing" && !j.retryable); }

{ let providerCalls = 0; globalThis.fetch = async () => { providerCalls++; return new Response(PNG); };
  const j = await runAdapter(jobFor("ai-background-remover", { text: "", assetId: "a1" }), {
    loadAsset: async () => ({ buffer: JPG, contentType: "image/jpeg" }), saveOutput: async () => { throw new Error("bucket down"); } });
  check("storage failure after provider success: no retry (no double charge)", providerCalls === 1 && j.status === "failed" && j.needsReview === true && !j.retryable);
  check("storage failure message is sanitized", !/bucket/.test(j.publicMessage)); }

{ globalThis.fetch = reply("<html>not an image</html>");
  const j = await runAdapter(jobFor("ai-background-remover", { text: "", assetId: "a1" }), { loadAsset: async () => ({ buffer: JPG, contentType: "image/jpeg" }), saveOutput: async () => ({ id: "x" }) });
  check("non-image provider output rejected", j.status === "failed" && j.code === "bad_output"); }
globalThis.fetch = realFetch; env({});

// ---- 5. bindings
for (const slug of ["ai-image-generator", "ai-text-to-image", "ai-image-editor", "ai-background-remover"]) {
  const b = toolBindings[slug];
  check(`image binding valid: ${slug}`, !!getTool(slug) && b.kind === "image" && ["generate", "edit", "remove-bg"].includes(b.operation) && b.modelKind && Array.isArray(b.inputs));
  check(`text input has a limit: ${slug}`, !b.inputs.includes("text") || b.maxInputChars > 0);
}
for (const slug of ["ai-product-photography", "ai-image-upscaler", "ai-photo-enhancer", "ai-object-remover"]) check(`${slug} stays Coming soon (no provider yet)`, !toolBindings[slug]);

// ---- 6. structure and security
const read = (f) => fs.readFileSync(f, "utf8");
function walk(d, out = []) { for (const f of fs.readdirSync(d)) { if (f === "node_modules" || f === ".next") continue; const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|mjs)$/.test(f) && out.push(p); } return out; }
for (const f of walk(".")) if (/^["']use client["']/.test(read(f).trimStart())) check(`client file must not import server code: ${f}`, !/lib\/(ai|storage)\/|lib\/firebase\/admin/.test(read(f)));
check("storage service is server-only", read("lib/storage/index.js").includes('import "server-only"'));
check("storage rules deny all client access", /match \/\{allPaths=\*\*\} \{ allow read, write: if false; \}/.test(read("firebase/storage.rules")));
check("projectAssets rules owner-read, no client write", /projectAssets\/\{id\}[^\n]*ownerId == request\.auth\.uid[^\n]*allow write: if false/.test(read("firebase/firestore.rules")));
const up = read("app/api/uploads/route.js");
check("uploads: auth + origin + rate limit + content sniffing", up.includes("getSessionUser") && up.includes("sameOrigin") && up.includes("limitRequest") && up.includes("validateImageBuffer"));
check("uploads: size checked before and after reading", up.includes("content-length") && up.includes("file.size"));
const as = read("app/api/assets/[id]/route.js");
check("assets: owner-only, nosniff, sandbox CSP, no-store", as.includes("loadOwnedAsset(id.data, user.uid)") && as.includes("nosniff") && as.includes("sandbox") && as.includes("no-store"));
check("assets: delete checks origin", /DELETE[\s\S]*sameOrigin/.test(as));
check("cleanup requires secret", read("app/api/storage/cleanup/route.js").includes("timingSafeEqual"));
check("no provider key in public env", !/NEXT_PUBLIC_(REMOVE|OPENAI)/.test(read(".env.example")));
check("composite index for image daily cap", JSON.parse(read("firebase/firestore.indexes.json")).indexes.some((i) => i.fields.map((f) => f.fieldPath).join() === "userId,type,createdAt"));

if (failed) process.exit(1);
console.log("image studio OK");
