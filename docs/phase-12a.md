# Phase 12 (part A) report: Developer API

## Built
- **API keys:** create (max 5 active), list, revoke, in the dashboard (`/dashboard/developer`). The secret (`ais_` + 256 random bits) is shown once; only its SHA-256 hash is stored (as the document id). Lists show a short prefix and the last 4 characters only.
- **Public API** (`/api/v1`): `GET /tools`, `POST /jobs`, `GET /jobs/{id}`, `GET /assets/{id}`, documented in `docs/API.md`. It runs through the SAME `createJob` pipeline as the dashboard, so credits (hold, use, refund), daily caps, admin tool on/off and price overrides, and retention all apply. Text-input tools only.
- **Authentication:** Bearer key; the format is checked before any database read; unknown, malformed, revoked and suspended-owner keys all give one identical 401; per-IP limit before the lookup, then a per-key limit (shared across servers). No cookies are ever used, so there is no CSRF exposure. No CORS headers, so keys cannot be used from browsers.
- **Safety:** `Idempotency-Key` is required on job creation (a retry cannot charge twice); the user comes from the key, never from the body; job and file reads are owner-only; usage writes never block or fail a request; keys are never logged.
- **Usage analytics:** requests and jobs started per key per day (last 14 days on the Developer page).

## Verified (`npm run test:api`, no Firebase)
Key generation (format, 2000 unique), hashing, strict Bearer parsing (12 malformed variants), request-body validation (15 invalid variants; `assetId` can never come from the API), the real service against the in-memory Firestore (the secret appears nowhere in the database, list never exposes secret or hash, revoke is owner-only and instant, key limit, suspended owner, throttled last-used, concurrent usage counting, per-day rows), and structural checks of every v1 route. Tests found and fixed a gap in the test fake (string ordering). `npm run verify`: all 10 suites pass; 198 files parse; all imports resolve.

## NOT verified
Real Firestore (including the new `apiUsage` index), `FieldValue.increment` in real Firestore, `next build`, the new pages in a browser, any real API call end to end. The v1 routes were checked structurally (their handlers were not executed because the sandbox has no Next.js installed).

## Not built
Webhooks and outbound events, plan-gated API access (the master prompt gives API to Business plans; there are no plans yet, so every verified user can create keys within the limits), API-specific billing, per-key scopes or spending caps, key expiry/rotation helpers, IP allow-lists, admin screens to view or revoke other users' keys (suspending the owner stops their keys), uploads/PDF through the API.

## Setup
`firebase deploy --only firestore:indexes` (new index: `apiUsage` by `ownerId`, `day`).
