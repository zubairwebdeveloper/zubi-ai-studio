import "server-only";
import { NextResponse } from "next/server";
import { limitRequest } from "@/lib/security/limit";
import { clientIp } from "@/lib/security/request";
import { apiKeys } from "@/lib/api/service";
import { parseBearer } from "@/lib/api/keys";
import { LIMITS } from "@/config/limits";

export const apiJson = (body, status = 200, headers = {}) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
export const apiError = (code, message, status, headers) => apiJson({ error: { code, message } }, status, headers);

// 1) cheap per-IP limit (protects the key lookup from being hammered)  2) format check  3) key lookup  4) per-key limit.
// Missing, malformed, unknown, revoked and suspended-owner keys all get the same 401.
export async function authenticateApiRequest(request) {
  const ip = await limitRequest({ bucket: "apiip", id: clientIp(request), limit: LIMITS.apiRequestsPerMinutePerIp });
  if (!ip.ok) return { ok: false, response: apiError("rate_limited", "Too many requests.", 429, { "Retry-After": String(ip.retryAfter) }) };

  const key = parseBearer(request.headers.get("authorization"));
  const auth = key ? await apiKeys.authenticate(key) : null;
  if (!auth) return { ok: false, response: apiError("unauthorized", "Missing or invalid API key.", 401, { "WWW-Authenticate": "Bearer" }) };

  const lim = await limitRequest({ bucket: "apikey", id: auth.publicId, limit: LIMITS.apiRequestsPerMinutePerKey });
  if (!lim.ok) return { ok: false, response: apiError("rate_limited", "Too many requests for this key.", 429, { "Retry-After": String(lim.retryAfter) }) };

  apiKeys.recordUsage(auth).catch((err) => console.error("[api] usage write failed:", err?.message)); // never blocks or fails a request
  return { ok: true, auth };
}
