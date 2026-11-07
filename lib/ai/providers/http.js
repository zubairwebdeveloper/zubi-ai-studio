import { fromHttpStatus, networkError } from "../errors.js";

async function request(url, { method, headers = {}, body, timeoutMs = 60_000 }) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw networkError(err);
  }
  if (!res.ok) throw fromHttpStatus(res.status, await res.text().catch(() => ""));
  try { return await res.json(); } catch { throw fromHttpStatus(502, "Invalid JSON from provider"); }
}

export const postJson = (url, opts) => request(url, { ...opts, method: "POST" });
export const getJson = (url, opts) => request(url, { ...opts, method: "GET" });
