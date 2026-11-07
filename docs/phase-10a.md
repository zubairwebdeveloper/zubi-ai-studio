# Phase 10 (part A) report: Credit wallet and accounting

The payment gateway and subscription plans are NOT in this part (see "Not built").

## What it does
- **Wallet** (`creditWallets/{uid}`): `available` and `reserved` are separate. Every change is recorded in an immutable ledger (`creditTransactions`). Reservations live in `creditReservations/{jobId}` (server-only).
- **Lifecycle:** a job reserves its credits when created (server-side price from the tool registry, never a client value) -> captured when the job succeeds -> refunded in full when it fails for any reason (including provider errors, stuck jobs, and output-storage failures).
- **Welcome credits:** 50 per account, granted once (idempotent, safe under concurrent requests) the first time the wallet is touched. Set the number in `config/credits.js`.
- **Daily spending limit:** each user can cap their own spending (`/dashboard/credits`). A refund frees the allowance.
- **Dashboard:** credits chip in the top bar, real balance on the overview, `/dashboard/credits` with balance, on-hold, lifetime totals, limit form and the last 50 ledger entries. "Buy credits" is shown disabled.
- **Admin:** `node --env-file=.env.local scripts/grant-credits.mjs user@example.com 100 "reason" --key unique-key` (negative amounts remove credits, never below zero; the key makes a re-run harmless; every change is audit-logged).
- **Safety nets:** `POST /api/credits/reconcile` settles reservations left "held" after a crash (succeeded job -> capture, failed/missing -> refund, still running -> waits). The jobs reconciler now refunds stuck jobs. Both use `CRON_SECRET`.

## Safety guarantees (all tested)
Integers only; non-integer, negative, zero, NaN and oversized amounts are rejected; a corrupt wallet is refused instead of used; balance can never go negative; `available + reserved + used + removed = received` after every operation (3000 random operations tested); a job is charged at most once; capture after refund and refund after capture are no-ops; 30 concurrent jobs against 50 credits succeed exactly 5 times; billing outages never change a finished job's result.

## Verified (`npm run test:credits`, no Firebase)
The real service code runs against an in-memory Firestore fake that enforces "all reads before writes" and "update needs an existing document". Also: engine billing hooks, job-creation wiring, rules/index structure, and that only the credit service writes wallets. A test found one real gap (a deleted wallet with an existing signup record was not recreated), now fixed. All earlier suites pass; syntax and imports verified.

## NOT verified
- Real Firestore transaction behavior under contention (the fake serializes transactions, like retries would, but is not the real thing), the two new composite indexes, `next build`, the new pages in a browser.

## Not built (needs your decisions)
- **Payment gateway and purchases.** Which gateway depends on your business country (Stripe is not available everywhere). Needed: gateway choice, verified webhooks, invoices, refunds, coupons.
- **Subscription plans, monthly credit grants, promotional daily credits, plan-based limits** (the roles PRO/AGENCY should follow subscriptions).
- **Credit prices are placeholders** (per-category defaults in `config/categories.js`). Set them from real provider costs, with a margin, before launch.
- Admin UI for adjustments (Phase 11); team/shared credits (Phase 12).

## Before public launch
Run `firebase deploy --only firestore:rules,firestore:indexes`, schedule `/api/credits/reconcile` every ~10 minutes and `/api/jobs/reconcile` every few minutes, and review the welcome-credit amount and tool prices.
