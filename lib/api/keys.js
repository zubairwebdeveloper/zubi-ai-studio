import { createHash, randomBytes } from "node:crypto";

// Pure helpers for API keys. A key is shown to its owner ONCE; only its SHA-256 hash is stored.
// Keys are 256 bits of randomness, so a fast hash is safe (nobody can brute-force them).
export const KEY_PREFIX = "ais_";
const KEY_RE = /^ais_[A-Za-z0-9_-]{43}$/;

export const hashKey = (key) => createHash("sha256").update(key).digest("hex");

export function generateApiKey(random = randomBytes) {
  const key = KEY_PREFIX + random(32).toString("base64url");
  const hash = hashKey(key);
  return { key, hash, publicId: hash.slice(0, 16), prefix: key.slice(0, 8), last4: key.slice(-4) };
}

// "Authorization: Bearer ais_..." -> the key, or null. The format is checked BEFORE any database read.
export function parseBearer(header) {
  if (typeof header !== "string") return null;
  const m = /^Bearer ([^\s]+)$/i.exec(header.trim());
  return m && KEY_RE.test(m[1]) ? m[1] : null;
}

// Only tools whose input is plain text can be used through the API (no uploads yet).
export const apiSupports = (binding) => !!binding && (binding.inputs || ["text"]).every((i) => i === "text");

export const IDEMPOTENCY_RE = /^[A-Za-z0-9_-]{16,64}$/;

// Validates the JSON body of POST /api/v1/jobs. Everything here is untrusted.
export function validateApiJobBody(body) {
  const fail = (error) => ({ ok: false, error });
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Body must be a JSON object.");
  if (typeof body.tool !== "string" || !/^[a-z0-9-]{1,100}$/.test(body.tool)) return fail('"tool" must be a tool slug, e.g. "ai-translator".');
  if (body.text !== undefined && (typeof body.text !== "string" || body.text.length > 50_000)) return fail('"text" must be a string.');
  let options;
  if (body.options !== undefined) {
    if (!body.options || typeof body.options !== "object" || Array.isArray(body.options)) return fail('"options" must be an object of strings.');
    const entries = Object.entries(body.options);
    if (entries.length > 10 || entries.some(([k, v]) => typeof v !== "string" || k.length > 40 || v.length > 80)) return fail('"options" must be an object of short strings.');
    options = Object.fromEntries(entries);
  }
  let history;
  if (body.history !== undefined) {
    if (!Array.isArray(body.history) || body.history.length > 12 || body.history.some((m) => !m || !["user", "assistant"].includes(m.role) || typeof m.text !== "string" || m.text.length > 4000)) {
      return fail('"history" must be an array of up to 12 {role: "user"|"assistant", text} items.');
    }
    history = body.history.map((m) => ({ role: m.role, text: m.text }));
  }
  return { ok: true, value: { toolSlug: body.tool, text: typeof body.text === "string" ? body.text.trim() : "", options, history } };
}
