# Phase 14 report: Live check

## Why
Thirteen phases of code had only ever run against test fakes. This adds one command that runs the highest-risk parts against your real Firebase project and tells you the truth.

## Built
- `npm run live-check` (`scripts/live-check.mjs` + `lib/ops/live-checks.js`): see `docs/LIVE-CHECK.md`.
- The same real service code (credits, shared rate limiter, API keys) is exercised against real Firestore transactions, including simultaneous requests; every composite index is probed; Storage is written and read back; an anonymous client probes the security rules of all collections and Storage; configured providers are pinged.
- Safe by construction: needs `--yes`, prints the project id first, uses only `livecheck_` documents, cleans up in a `finally`, never prints secrets (all tested).

## Verified (`npm run test:livecheck`, part of `npm run verify`: 11 suites)
The runner itself, against the in-memory fake: every fake-supported check passes, it removes everything it created, it reports (rather than crashes on) a broken database, and it FAILS when the database loses reservations (so the checks are not vacuous). The index probes match the required-index list and the repo's index file exactly. Building it exposed a test-fake inaccuracy (orderBy on a missing field), now fixed, and I removed a vacuous test I had written (`|| true`).

## NOT verified (this is the point of the tool)
The script has never run against real Firebase: Firebase Admin and client SDK calls, the contention behavior, the index error format (the link extraction is written from memory of Firestore's error message), and the anonymous rules probe. Expect that the first real run may itself need small fixes; send me the output.

## Known limits
Rules are probed only as an anonymous visitor. The 30-way concurrency test can legitimately WARN under real Firestore contention. It does not test sign-up, email, pages or `next build`.
