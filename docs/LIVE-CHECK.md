# Live check: test the app against your real Firebase project

Everything before this was tested with fakes. This command runs the important parts against your real services and tells you what actually works. Run it once after setup, and again after every change to rules, indexes or the credit/rate-limit code.

```
npm install
firebase deploy --only firestore:rules,firestore:indexes,storage    # wait for the indexes to finish building
node --env-file=.env.local scripts/live-check.mjs --yes
```
Without `--yes` it only prints which project it would use. Options: `--skip-rules`, `--skip-storage`, `--skip-providers`.

## What it does (and does not do)
- Uses **temporary documents whose ids start with `livecheck_`**, never reads or changes real users' data, and deletes everything it created (it tells you if a deletion fails).
- Prints names, counts and messages only. It never prints keys, secrets or private data.
- Calls the providers' free "account / list models" endpoints only. Nothing is generated or billed.

## What it checks
| Group | What it proves on the REAL database |
|---|---|
| environment | Node 20+, dependencies installed, `proxy.js` vs `middleware.js` matches your Next.js version |
| firebase | the service-account credentials work |
| credits | welcome credits granted exactly once under 30 concurrent first calls; reserve, capture, refund; duplicate calls never double-charge; **30 simultaneous jobs against a 50-credit wallet never overspend**; daily limit; idempotent admin adjustments; full ledger |
| rate limit | 50 simultaneous requests against a limit of 10 |
| api keys | only the hash is stored; auth works and a wrong key fails; 20 simultaneous usage updates add up exactly; revoke is instant |
| firestore | `null` timestamps are not matched by the retention query; string ordering; `in` and `count()` |
| indexes | every composite query the app runs; a missing index shows a **direct link to create it** |
| storage | write, read back and delete a file in your bucket |
| security rules | an **anonymous** client (what any stranger on the internet can do) cannot read or write any of 17 collections, nor upload to or read Storage |
| providers | each configured provider is reachable and accepts its key |

## Reading the result
- `PASS`: verified. `FAIL`: a real problem: send me the output. `WARN`: works but with a caveat (the message explains it). `SKIP`: not applicable here.
- A **WARN about contention** on the concurrent credit test means: money stayed correct, but some simultaneous requests failed with a contention error instead of being served. In real use that only happens when one user starts many jobs at the same instant; clients should retry.
- If an index check fails: open the link in the message (or run the deploy command again and wait a few minutes).

## What it cannot check
Sign-up and login screens, verification emails, the web pages, `next build`, and security rules for signed-in users (it only probes as an anonymous visitor). Do the manual smoke test in `docs/RUNBOOK.md` for those.
