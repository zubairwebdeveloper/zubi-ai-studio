# Security overview

What is enforced, how it is checked, and what is NOT covered. `npm run verify` runs the automated checks.

## Enforced (and tested)
| Area | Control |
|---|---|
| Sessions | Firebase ID token -> httpOnly, SameSite=Lax session cookie (Secure in production); revocation checked on every request; recent sign-in required; suspended accounts refused immediately |
| Authorization | Roles read from Firestore on every request, never from the client. Admin pages 404 for non-admins. Every server action authenticates first. Admins can act only on users they strictly outrank; SUPER_ADMIN is never assigned from the UI |
| Data access | Firestore rules: clients read only their own documents and can write nothing; everything else default-deny. All writes go through the Admin SDK on the server. Storage rules deny all client access |
| Money | Integer credits only; reserve -> capture/refund inside transactions; idempotent per job; balance never negative; every change in an immutable ledger; admin adjustments limited, reasoned and audit-logged |
| Providers | API keys only in server env, sent in headers (never URLs/bodies/logs); provider error text never shown to users; failed jobs refunded |
| Uploads | Type decided from file bytes (PNG/JPEG/WebP/PDF only, SVG refused), size caps, per-user quota, owner-only downloads with nosniff + sandbox CSP |
| Prompt injection | Document text is wrapped as untrusted data and the model is told never to follow instructions inside it; chat history is rebuilt server-side (a forged `system` turn is dropped) |
| Abuse | Per-user and per-IP rate limits shared across servers (Firestore), daily job caps, credit limits, user-set spending limit |
| Privacy | Prompts/pasted text/chat history erased from job records after 30 days; uploads kept 7 days, outputs 30 days; rate-limit counters hash their keys |
| Redirects / CSRF | `?next=` only accepts same-site paths; state-changing routes check the Origin header; Server Actions use Next.js's built-in origin check |
| Headers | nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS, COOP (`same-origin-allow-popups` so Google sign-in works) |
| Scheduled routes | Bearer `CRON_SECRET`, constant-time comparison |
| Secrets | Tests scan the code for hard-coded keys and for secrets read in client code; preflight rejects `NEXT_PUBLIC_` secrets |

## Known gaps (decide before launch)
- **No Content-Security-Policy.** A correct CSP for Next.js needs nonces and testing with Firebase Auth; it is deliberately not added blindly. Strongly recommended.
- **No MFA, no account deletion / data export** flow. Needed for most privacy laws.
- **No content moderation** of prompts or outputs; **no malware scanning** of uploads beyond type checks.
- **Rate limiting** is a fixed window (bursts up to 2x at a boundary) and trusts `X-Forwarded-For`, which is only reliable behind a proxy you control. It fails open if Firestore is unavailable.
- Admin credit adjustments write the audit entry just after the ledger entry; a failed audit write is logged (`AUDIT WRITE FAILED`) but not retried.
- Admin tool-config changes take up to 30 s to reach every server (per-instance cache).
- Dependency vulnerabilities: run `npm audit` regularly; nothing here checks it.
- Retention only covers jobs created after this phase (older job records have no `redactAt`).
- Not independently reviewed or penetration-tested. Treat this as a solid baseline, not a certification.
