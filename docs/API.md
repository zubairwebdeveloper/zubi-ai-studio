# AI Studio API (v1)

Call AI Studio from your own server. API calls spend the same credits as the dashboard and follow the same rules: credits are held when a job starts, used when it succeeds, and refunded in full if it fails.

**Base URL:** `https://YOUR_DOMAIN/api/v1` &nbsp; **Auth:** `Authorization: Bearer ais_...`

## Keys
Create keys in the dashboard under **Developer** (up to 5 active keys). A key is shown **once**; only a hash is stored, so a lost key cannot be recovered, only replaced. Revoking is immediate. A suspended account's keys stop working. Keep keys on your server: never put one in browser code, a mobile app or a public repository (browsers are blocked from calling the API on purpose).

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/tools` | Tools you can call now, with price in credits, options and input limit |
| POST | `/jobs` | Start a job (returns `202` immediately) |
| GET | `/jobs/{id}` | Status and result |
| GET | `/assets/{id}` | Download an output file (for example a generated image) |

Only tools that take plain text are available through the API (writing, chat, translation, image generation). Tools that need an uploaded image or PDF are not available yet.

### POST /jobs
Headers: `Authorization`, `Content-Type: application/json`, and **`Idempotency-Key`** (16-64 characters: letters, digits, `_`, `-`). The key is required: if your request times out, send it again with the same key and you will get the same job and be charged once.
```json
{ "tool": "ai-translator", "text": "Hello", "options": { "targetLanguage": "Urdu" } }
```
`options` and `history` (chat tools: up to 12 `{role: "user"|"assistant", text}` items) are validated against the tool; invalid option values fall back to the tool's first choice.
Response `202`: `{ "id": "...", "status": "queued" }`

### GET /jobs/{id}
```json
{ "id": "...", "status": "succeeded", "tool": "ai-translator", "output": { "text": "..." }, "error": null, "credits_charged": 1 }
```
`status` is `queued`, `processing`, `succeeded` or `failed`. Poll every 1-2 seconds (images can take up to a minute or two). For images, `output` is `{ "assetId": "...", "contentType": "image/png" }`; download it with `GET /assets/{assetId}`. On `failed`, `error` has a safe message and `credits_charged` is `0` (refunded).

## Errors
`{ "error": { "code": "...", "message": "..." } }`

| HTTP | code | Meaning |
|---|---|---|
| 400 | `invalid_request`, `idempotency_key_required`, `tool_not_supported` | Fix the request |
| 401 | `unauthorized` | Missing, malformed, revoked or unknown key (always the same answer) |
| 402 | `insufficient_credits` | Not enough credits for this tool |
| 404 | `tool_not_found`, `not_found` | Unknown tool, or a job/file that is not yours |
| 429 | `rate_limited`, `limit_reached` | Too many requests (see `Retry-After`) or a daily limit |
| 503 | `tool_unavailable` | The tool is turned off or has no provider right now |

## Limits
30 requests per minute per key, 120 per minute per IP, plus the account's daily job limits and your credit balance and optional daily spending limit. Responses are never cached.

## Example (Node.js)
```js
const base = "https://YOUR_DOMAIN/api/v1";
const headers = { Authorization: `Bearer ${process.env.AIS_KEY}`, "Content-Type": "application/json" };
const key = crypto.randomUUID().replaceAll("-", "");          // reuse this when retrying
const res = await fetch(`${base}/jobs`, { method: "POST", headers: { ...headers, "Idempotency-Key": key },
  body: JSON.stringify({ tool: "ai-translator", text: "Hello", options: { targetLanguage: "Urdu" } }) });
const { id } = await res.json();
let job;
do { await new Promise((r) => setTimeout(r, 1500)); job = await (await fetch(`${base}/jobs/${id}`, { headers })).json(); }
while (job.status === "queued" || job.status === "processing");
console.log(job.output?.text ?? job.error);
```

## Not available yet
Webhooks (poll instead), file uploads, API-specific billing or plans (calls use account credits), team or per-key permissions, key expiry, IP allow-lists.
