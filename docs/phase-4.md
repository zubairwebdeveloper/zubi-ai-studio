# Phase 4 report: AI engine

## What exists
- Provider-independent core (`lib/ai/`): error model with user-safe messages, retry with backoff (retryable errors only), idempotent job ids, and `executeJob`, a state machine with an atomic claim so a job can never run twice.
- Providers (raw HTTP, keys read from server env only): **Gemini** and **OpenAI**, text generation only, plus health checks.
- Registry: a model is available only if its provider key AND its model-id env var are set (`GEMINI_TEXT_MODEL`, `OPENAI_TEXT_MODEL`). Model ids are not hard-coded because providers retire them.
- Tool bindings (`config/tool-bindings.js`): 4 text tools are wired end to end: AI Chat Assistant, AI Text Summarizer, AI Paraphrasing, AI Grammar Checker. A tool shows Live in the dashboard only if it has a binding AND a configured model. Otherwise "Coming soon".
- API: `POST /api/jobs` (returns 202 immediately; the provider call runs after the response via `after()`), `GET /api/jobs/[id]` (owner only, user-facing fields only), `POST /api/jobs/reconcile` (cron, secret-protected), `GET /api/ai/health` (admin only).
- Firestore: `generationJobs` (internal: provider, attempts, usage, latency, errors) and `generations` (user-facing). Clients cannot write either.
- UI: `/dashboard/tools/[slug]` runner with idempotency key reuse on network failure, polling, copy, error states.

## Security and cost
- Keys: header-only to providers, never in URLs, bodies, client code or `NEXT_PUBLIC_*` (tested).
- Provider error text never reaches the browser (tested).
- Auth + verified email + same-origin + per-user rate limit on job creation.
- **No credits are charged yet** (wallet is Phase 10). Interim guard: 20 generations per user per UTC day (`config/limits.js`). Do not enable real keys for public traffic before Phase 10.

## Verified (`npm run test:ai`, no network)
Retry then success, retries exhausted, no retry on 400, double-run prevention, async submit/poll path, terminal jobs skipped, idempotent ids, registry availability rules, request shape for Gemini and OpenAI against a mocked `fetch`, empty/blocked output handling, server-only boundaries. The test found and fixed one real bug (`pollAfterSec: 0`).

## NOT verified
- Any real call to Gemini or OpenAI (no network or keys here). Request shapes follow each provider's documented REST format; confirm with one real call.
- Firestore transactions and the new index, `next build`, `after()` on your host.

## Known limits
- `after()` is best-effort. If the host kills it, reconcile re-runs queued jobs after 2 min. Schedule `POST /api/jobs/reconcile` every few minutes with `Authorization: Bearer $CRON_SECRET`.
- Video-length jobs need a real queue (Cloud Tasks, Inngest...) in Phase 7; the adapter `submit/poll` contract and `providerJobId` are ready for it. No webhook endpoint yet because no current provider uses one.
- Not included yet: Replicate, fal.ai, remove.bg, Hugging Face, ElevenLabs adapters (they need file storage, Phase 5/7); credit reservation/refund (Phase 10); cost estimation in money (pricing not configured; only token usage is recorded); content moderation; model comparison playground.
- Input text is stored in `generationJobs` for retries. Add a retention policy before launch.
