# Phase 5 report: Image Studio

## Live when configured (4 tools)
| Tool | Provider | Needs |
|---|---|---|
| AI Background Remover | remove.bg | `REMOVE_BG_API_KEY` |
| AI Image Generator, AI Text to Image | OpenAI Images | `OPENAI_API_KEY` + `OPENAI_IMAGE_MODEL` |
| AI Image Editor (prompt-based edit of an uploaded image) | OpenAI Images `/images/edits` | same; the model must support edits |

## Still "Coming soon" on purpose
Image Upscaler, Photo Enhancer, Object Remover, Product Photography and the rest of the image tools. They need a model-specific provider (Replicate, fal.ai...) and I did not guess those schemas. Tell me which provider and model you have keys for and I will add them.

## Storage (Firebase Storage, server access only)
- Uploads go through `POST /api/uploads` (PNG/JPEG/WebP only, 4 MB, type decided from the file's bytes, SVG refused). 4 MB because the upload passes through the server; larger files need signed direct-to-bucket uploads (not built).
- Files live at `users/{uid}/{upload|output}/{id}.ext`; ownership is a `projectAssets` document. Storage rules deny all client access.
- Downloads: `GET /api/assets/[id]`, owner only, `nosniff`, sandbox CSP, `no-store`. `DELETE` supported.
- Provider outputs are copied into our storage immediately (provider URLs are never relied on).
- Retention: uploads 7 days, outputs 30 days. `POST /api/storage/cleanup` (Bearer `CRON_SECRET`) deletes expired files; schedule daily.
- Quota: 200 MB per user, tracked in `users/{uid}.storageBytes`.

## Safety and cost guards
- Daily caps: 20 jobs, of which 10 image jobs (`config/limits.js`). Credits are still not charged (Phase 10): do not open this to public traffic before then.
- If storing the output fails after the provider already succeeded, the job is NOT retried (no double charge) and is flagged `needsReview`.
- Job creation checks that the input image belongs to the requesting user.

## Verified (`npm run test:images`, no network)
File sniffing (png/jpeg/webp accepted; svg, gif, exe, html, truncated, fake-extension rejected); remove.bg and OpenAI request shapes (multipart, key only in headers); 402/429 handling; b64 and URL responses, non-HTTPS URL refused; adapter + engine with injected storage (ownership, missing asset, storage failure, non-image output); registry availability rules; route/rules/index structure checks. All earlier suites still pass; 134 files parse; all imports resolve.

## NOT verified
- Any real call to remove.bg or OpenAI. Request shapes follow their documented REST APIs; run one real job per tool.
- Firebase Storage writes/reads, Firestore rules/indexes, `next build`, browser behavior of the runner.
- Image-edit quality and which OpenAI models accept `/images/edits`: check your model.

## Known limits
- No content moderation yet. No per-project asset linking in the UI (`projectId` is stored as null). History shows a "View" link; there is no gallery page.
- remove.bg and OpenAI bill you per call even for failed-for-us requests we cannot detect; the `needsReview` flag and `generationJobs.usage` are the audit trail.
