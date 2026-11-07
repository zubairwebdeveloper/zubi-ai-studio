# Phase 3 report: User dashboard

## Built
- Dashboard shell: sidebar (mobile drawer), top bar with unread badge, theme toggle, logout, skip link. Loading skeleton and error boundary.
- Overview: generation counts (total / succeeded / failed), subscription label, recent activity, favorite tools.
- Tools: search and category filter over the registry, favorites saved to Firestore with optimistic update and rollback on failure. Favorites saved in the browser before login are imported once.
- Favorites, Projects (create, rename, delete with confirm, 50-project cap), History (latest 25 generations), Notifications (mark read / mark all read), Settings (change name, password reset email).
- A welcome notification is created when a profile is first created.

## Security model
- All writes are Server Actions that call `requireUser()` first, validate input with Zod, and check ownership. `npm run test:dashboard` fails if any action lacks `requireUser`.
- Firestore rules: clients can only READ their own docs; every client write is denied.
- Client components never import server-only modules (checked).

## Not real yet (shown honestly)
- Credits show "Not set up": the wallet is built in Phase 10.
- Subscription shows "Free plan" with no billing.
- History and recent activity stay empty until Phase 4 creates `generations` documents. Expected fields: `userId, toolSlug, toolName, type, status (queued|processing|succeeded|failed), creditsCharged, createdAt`.
- "Recently used tools" and usage charts need real generation data and are not included.
- Tool cards open the public tool page; per-tool workspaces come with the studios (Phases 5+).

## Verified
`test:dashboard`, `test:auth`, `test:registry` pass. 99 JS/JSX files parse, all imports resolve.

## NOT verified
Real Firestore reads/writes, `next build`, the new composite indexes, mobile layout in a browser.

## Deploy
`firebase deploy --only firestore:rules,firestore:indexes`. Indexes take a few minutes to build; until then Projects, Notifications and History show the error page.

## Known limits
- Project and favorite caps are checked with a count (not transactional): a rare race can exceed them slightly.
- Deleting a project does not yet remove its assets (none exist until Phase 5).
- Notifications are plain documents; there is no push or email delivery yet.
