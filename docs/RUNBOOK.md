# Operations runbook

## Log lines worth alerting on
| Search for | Meaning | Action |
|---|---|---|
| `[billing] capture failed` / `release failed` | credit settlement failed after a job finished | wait for `/api/credits/reconcile`; if it repeats, check Firestore status |
| `finished after its reservation was released` | job succeeded after being refunded | review that job in Admin > Jobs; no extra charge was made |
| `AUDIT WRITE FAILED` | an admin credit adjustment was not audit-logged | the ledger entry still has actor and reason; add a note manually |
| `[rate-limit] shared check failed` | limiter degraded (fail-open) | check Firestore health |
| `[credits] summary failed` | a wallet read failed | check Firestore |
Admin > Jobs > **Needs review**: the provider may have been paid but the output was lost (the user was refunded). Reconcile with the provider's dashboard.

## Common situations
- **A provider is down or too expensive:** Admin > Tools > switch the tool Off (effective within 30 s). Users get "currently turned off"; nobody is charged.
- **A user says they were charged for a failed job:** Admin > Users > open the user: the ledger shows reserve/capture/release per job. A failed job always shows a release. If wrong, adjust credits with a reason.
- **Abusive user:** Admin > Users > Suspend with a reason (ends their sessions immediately).
- **Stuck jobs / held credits:** both reconcilers fix these automatically; run them manually with `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/jobs/reconcile` (and `/api/credits/reconcile`).
- **Rotate a provider key:** create a new key at the provider, update the env var, redeploy, revoke the old key.
- **Rotate `CRON_SECRET`:** update the env var and the scheduler header together.
- **Leaked service-account key:** revoke it in Google Cloud IAM, create a new one, update `FIREBASE_ADMIN_*`, redeploy.
- **Give or take credits by hand:** Admin > Users, or `scripts/grant-credits.mjs`.

## Backups (confirm commands against current gcloud docs)
Turn on Firestore point-in-time recovery and a scheduled backup, for example:
`gcloud firestore databases update --enable-pitr` and `gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=7d`.
Test a restore into a separate project once before launch. Firebase Storage files are not covered by Firestore backups; enable object versioning or a bucket backup if you need them.

## Smoke test after every deploy (10 minutes)
1. Sign up with a new email; verify the email; you land on the dashboard with welcome credits.
2. Log out and in again; Google sign-in works.
3. Run one text tool: credits drop by its price, the result appears, History shows it, Credits shows reserve then use.
4. Run a tool with a bad provider key (or switch a tool Off): the job fails/refuses and no credits are lost.
5. Upload a PDF, ask a question; upload a PNG to Background Remover; download the result.
6. As a non-admin open `/admin`: you get a 404. As an admin: Users, Jobs, Tools load.
7. Check the scheduled jobs ran (logs) and `npm run verify` / preflight are still green.
