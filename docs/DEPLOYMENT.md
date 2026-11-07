# Deployment guide

Run `npm run verify` and `node --env-file=.env.production scripts/preflight.mjs --production` before every deploy.
Commands marked (confirm) are from memory of the vendors' tools; check them against current documentation.

## 1. Firebase project
1. Create a Firebase project. Enable **Authentication** (Email/Password and Google), **Firestore** (native mode) and **Storage**.
2. Authentication > Settings > **Authorized domains**: add your production domain.
3. Project settings > Service accounts > generate a private key. Put `project_id`, `client_email`, `private_key` into `FIREBASE_ADMIN_*`. Keep the key on ONE line with `\n` escapes.
4. Project settings > your web app: copy the config into the `NEXT_PUBLIC_FIREBASE_*` values.
5. Deploy rules and indexes (needs the Firebase CLI and `firebase use <project-id>`):
   `firebase deploy --only firestore:rules,firestore:indexes,storage`
   Indexes take a few minutes to build. Until then Projects, Notifications, History, Credits and the admin job lists show the error page.
6. **TTL policy** so spent rate-limit counters delete themselves (collection group `rateLimits`, field `expiresAt`): Firestore console > TTL, or (confirm) `gcloud firestore fields ttls update expiresAt --collection-group=rateLimits --enable-ttl`. The daily cleanup route also deletes them, so this is optional.

## 2. Environment variables
Copy `.env.example`. Anything prefixed `NEXT_PUBLIC_` is visible to every visitor: never put a secret there (the preflight and tests check this).
Required: all `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_SITE_URL` (public https address), `FIREBASE_ADMIN_*`, `CRON_SECRET` (32+ random characters, e.g. `openssl rand -hex 32`).
Providers (optional, one or more): a key AND a current model id per provider (`GEMINI_API_KEY` + `GEMINI_TEXT_MODEL`, `OPENAI_API_KEY` + `OPENAI_TEXT_MODEL` / `OPENAI_IMAGE_MODEL`, `REMOVE_BG_API_KEY`). A tool is Live only when its provider is configured.

## 3. Hosting
Any Node host works; Vercel is the easiest fit.
- Requires Next.js 15.1+ (`after()`). Image jobs run after the response and can take over a minute: the jobs route sets `maxDuration = 300`; check your plan's limit.
- Next.js 16 uses **`proxy.js`** (included). On Next.js 15 use `middleware.js` instead (rename the file and the function). Never keep both.
- Uploads pass through the server, so the host's request-body limit applies (about 4.5 MB on Vercel); the app limits uploads to 4 MB.

## 4. Scheduled jobs (required)
All three routes need `Authorization: Bearer <CRON_SECRET>` and accept POST (and GET for schedulers that only send GET).

| Route | How often | Does |
|---|---|---|
| `/api/jobs/reconcile` | every 5 min | re-runs jobs whose background run never started, polls async jobs, fails and refunds stuck jobs |
| `/api/credits/reconcile` | every 10 min | settles reservations left "held" after a crash |
| `/api/storage/cleanup` | daily | deletes expired uploads/outputs, erases job input text after 30 days, clears spent rate-limit counters |

Vercel Cron (confirm): it sends GET and, when `CRON_SECRET` is set as an environment variable, adds the Bearer header. Cron frequency depends on your plan (the free plan allows only daily). If you cannot schedule every 5 minutes, use Google Cloud Scheduler, a GitHub Actions schedule, or another cron service that can send a custom header.

## 5. First admin
Sign up once, then: `node --env-file=.env.local scripts/set-role.mjs you@example.com ADMIN`. SUPER_ADMIN additionally needs `--confirm-super`.

## 6. Before taking public traffic
- [ ] `npm run verify` passes; preflight passes with `--production`.
- [ ] Welcome credits (`config/credits.js`) and tool prices (`config/categories.js` + admin Tools page) reflect your real provider costs.
- [ ] Provider accounts have spending alerts/limits set at the provider.
- [ ] Privacy policy and Terms reviewed by a lawyer (they are drafts); contact details filled in.
- [ ] Backups on (see RUNBOOK). Scheduled jobs running (check the logs once).
- [ ] You tested the smoke checklist in RUNBOOK on the production URL.
