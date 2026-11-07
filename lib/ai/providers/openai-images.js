import { postJson } from "./http.js";
import { postForm } from "./form.js";
import { ProviderError, emptyOutputError, networkError } from "../errors.js";
import { EXT } from "../../storage/validate.js";

const BASE = "https://api.openai.com/v1";
const headers = () => ({ Authorization: `Bearer ${process.env.OPENAI_API_KEY}` });
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

// Newer image models return base64; older ones return a short-lived URL. Handle both, without
// sending response_format (some models reject it).
async function toBuffer(data) {
  const item = data?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) {
    const url = new URL(item.url);
    if (url.protocol !== "https:") throw new ProviderError("Provider returned a non-HTTPS image URL", { code: "bad_url", publicKey: "unavailable" });
    let res;
    try { res = await fetch(url, { signal: AbortSignal.timeout(60_000) }); } catch (e) { throw networkError(e); }
    if (!res.ok) throw new ProviderError(`Image download failed: HTTP ${res.status}`, { retryable: res.status >= 500, publicKey: "unavailable" });
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new ProviderError("Image too large", { code: "too_large", publicKey: "unavailable" });
    return buf;
  }
  throw emptyOutputError("no image in response");
}

export async function generateImage({ model, prompt }) {
  const data = await postJson(`${BASE}/images/generations`, { headers: headers(), body: { model, prompt, n: 1 }, timeoutMs: 180_000 });
  return toBuffer(data);
}

export async function editImage({ model, prompt, buffer, contentType }) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("image", new Blob([buffer], { type: contentType }), `image.${EXT[contentType] || "png"}`);
  const data = await postForm(`${BASE}/images/edits`, { headers: headers(), form, response: "json", timeoutMs: 180_000 });
  return toBuffer(data);
}
