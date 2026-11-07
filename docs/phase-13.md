# Phase 13 report: Production readiness

## Added
- **Shared rate limiter** (Firestore, all servers) on login-session, job creation and both upload routes, on top of the in-memory layer. Keys are hashed. Fails open if the database is down.
- **Input retention:** job input text and chat history are erased 30 days after creation (`LIMITS.inputRetentionDays`), together with the history preview. Runs in the daily cleanup route.
- **Next.js 16:** `proxy.js` replaces `middleware.js` (delete `middleware.js`; on Next 15 keep the old file).
- **Security headers:** added Permissions-Policy, HSTS and a COOP that keeps Google sign-in working.
- **`firebase.json`** (it was missing, so earlier `firebase deploy` instructions would have failed).
- **GET aliases** for the three scheduled routes (same secret check) so GET-only schedulers work.
- **`npm run verify`** runs every suite; **`npm run preflight`** checks env, indexes and rules before launch (never prints secrets).
- **Docs:** DEPLOYMENT.md, SECURITY.md, RUNBOOK.md.

## Verified (`npm run verify`: 9 suites, no network/Firebase)
Rate limiter (exact limit under 50 concurrent calls, window reset, key isolation, hashed keys, fail-open), retention (redaction, idempotence, legacy jobs untouched), preflight (every missing variable, weak secret, bad key, exposed secrets, missing index/rules, no secret in output), route protection audit over every API route, secret scans (with self-tests proving the scan catches real keys), no internal error text returned, headers, Next 16 files, wiring. `npm run verify` caught two older tests that referred to the renamed limiter (fixed). 186 files parse; all imports resolve.

## NOT verified
Everything that needs real services: Firestore (rate limiter and cleanup against the real database), Firebase Auth, providers, `next build` on Next 16, the proxy file on Next 16 (written from knowledge of the rename, never run), the cron routes on your host, backups and TTL commands. Nobody has run the app end to end yet: do the smoke test in RUNBOOK.md.

## Not done
No CSP, MFA, account deletion/export, content moderation, malware scanning, load testing, or independent security review (see SECURITY.md). No payment gateway or subscriptions (needs your decision). Video and audio (Phase 7) need your provider choice. Teams, white-label, developer API, affiliate and support (Phase 12) are not built.
