# Phase 11 report: Admin dashboard

## Built (all under /admin, ADMIN or SUPER_ADMIN only; everyone else gets a 404)
| Page | What it does |
|---|---|
| Overview | Users, suspended users, generations today, failed today, jobs needing review (live counts) |
| Users | Search by email prefix or user id, cursor pagination; detail page with account, wallet, recent jobs and ledger |
| User actions | Suspend / restore (ends sessions), change role (SUPER_ADMIN only), adjust credits (limited, reason required) |
| Jobs | All / Failed / Needs review (provider may have been charged but output was lost) |
| Credits | Global credit ledger, latest 50 |
| Tools | Search + filter; per-tool ON/OFF and credit price override; shows Live / Coming soon |
| Providers | Which providers have keys set, which models are available, admin-triggered health check (keys never shown) |
| Roles | Read-only permission matrix and the rules below |
| Audit log | Latest 100 admin actions |

## Rules (enforced on the server, unit-tested)
- Permissions come from the database role (never from the browser). Every page calls `requirePermission`, every action calls `adminActor` first.
- An admin can act on a user only if they STRICTLY outrank them: ADMIN cannot touch ADMIN or SUPER_ADMIN; nobody can touch a SUPER_ADMIN from the UI.
- SUPER_ADMIN can never be assigned from the UI (command-line script only). Nobody can change their own role, status or credits.
- Credit adjustments: whole numbers, max 500 (ADMIN) / 10,000 (SUPER_ADMIN) per action, reason required, double-submit safe (idempotency key), go through the same ledger as everything else.
- Suspending ends the user's sessions immediately (status is checked on every request) and revokes refresh tokens.
- Every change writes an audit entry (actor, role, target, before/after). Role, status and tool changes are written in the SAME batch as the change. Credit adjustments are written right after the ledger entry (which already records the actor and reason); a failed audit write is logged loudly.
- Tool overrides take effect in job creation: a turned-off tool is refused, and the override price is what gets charged. If the config cannot be read, job creation fails closed.

## Verified (`npm run test:admin`, no Firebase)
Permission matrix, outranking rules, role assignment, credit adjustment limits and validation, tool-config fallbacks for corrupt data, and structure checks (every action checks permission first and writes an audit entry, every admin page checks a permission, server-only boundaries, no client rule for `auditLogs`/`tools`). Tests found and fixed two real issues: `canActOn` let a PRO user "outrank" a USER, and the admin user page read wallets directly (now through a read-only `credits.peek` that never creates a wallet). All earlier suites pass; 176 files parse; all imports resolve.

## NOT verified
Real Firestore queries and the 2 new composite indexes (`generations`: status+createdAt, `generationJobs`: needsReview+updatedAt), `next build`, every page in a browser, `revokeRefreshTokens` against real Firebase Auth.

## Not built
- Organizations, Subscriptions, Payments, Transactions (money), Coupons, Affiliates, Blog CMS, Support tickets, Notifications broadcast, Platform settings editor, API usage analytics, Workflow templates: they depend on billing, teams or features that do not exist yet.
- Revenue, provider cost and usage charts (need billing and priced provider usage).
- Moderation queue, bulk actions, CSV export, audit log filtering and pagination (latest 100 only).
- Changing a user's email, deleting users or data export (needs a privacy/legal policy first).
- The 30 s tool-config cache is per server instance.

## Setup
`npm install` then `firebase deploy --only firestore:rules,firestore:indexes` (indexes take a few minutes; until then Jobs > Failed and Needs review show the error page). Make yourself admin: sign up once, then `node --env-file=.env.local scripts/set-role.mjs you@example.com ADMIN`.
