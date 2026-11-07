import { ProviderError, fromHttpStatus, networkError } from "../errors.js";

const MAX_RESPONSE_BYTES = 25 * 1024 * 1024;

// multipart/form-data POST. We do not set Content-Type ourselves: fetch adds the boundary.
export async function postForm(url, { headers = {}, form, timeoutMs = 120_000, response = "json" }) {
  let res;
  try {
    res = await fetch(url, { method: "POST", headers, body: form, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    throw networkError(err);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // 402 = the provider account is out of credit: our problem, not retryable, not the user's input.
    if (res.status === 402) throw new ProviderError(`HTTP 402: ${detail.slice(0, 200)}`, { status: 402, publicKey: "auth", code: "http_402" });
    throw fromHttpStatus(res.status, detail);
  }
  if (response === "buffer") {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_RESPONSE_BYTES) throw new ProviderError("Provider response too large", { code: "too_large", publicKey: "unavailable" });
    return buf;
  }
  try { return await res.json(); } catch { throw fromHttpStatus(502, "Invalid JSON from provider"); }
}
