# Pilot readiness: Redis, Kafka, user experience and data integrity

This checklist extends the Redis/Kafka rollout with an explicit end-user quality gate. It is part of the same pilot branch and must be completed before calling the app ready for ten real free-trial users.

## Product experience requirements

- Distinctive, consistent type system: Manrope for headings and DM Sans for body/UI, clear hierarchy, legible labels, responsive spacing, keyboard-visible focus and reduced-motion support.
- Keep the existing dark espresso / warm bronze identity consistent across public pages, dashboard, creative studio, pricing and account screens.
- Each end-user flow must have clear loading, success, empty and failure states; actionable error copy; disabled duplicate-submit states; and a safe retry path.
- Keep generated results visible and downloadable, with clear labels for actual AI output versus fallback output.
- Forms validate required fields, preserve user-entered data after recoverable failures, and do not claim an asset/payment/job succeeded until the server confirms it.
- Use accessible labels, sufficient contrast, keyboard navigation, responsive mobile layout, and confirmation before destructive actions.

## Correct merging of user/business data

Create one typed Brand Profile model and one normalization/merge function shared by Creative Studio and the server-side generation pipeline. Merge priority:

1. Explicit values entered for this generation (highest priority).
2. Saved authenticated user's brand profile (business name, tagline, contact details, language, logo and product image).
3. Organization defaults, if an organization profile exists.
4. Safe empty/default values. Never inject demo-user data into another account.

Rules:
- Merge field-by-field; never replace a complete profile object with a partial form payload.
- Ignore undefined/empty values when applying lower-priority defaults, but allow an explicit clear action to remove a saved field.
- Validate and length-limit strings server-side; sanitize uploads and restrict MIME type/size.
- Scope profile reads/writes and generated assets to the authenticated user and organization. Never expose another user's logo, contact details, job, credits or output.
- Persist profile changes in Postgres/Supabase; React state, sessionStorage, Maps, Redis and Kafka are not authoritative storage.
- Snapshot the resolved brand profile into each generation job so retries are deterministic after profile edits. Include a profile version or normalized fingerprint for traceability.
- Never log access tokens, passwords, raw uploads or sensitive prompt contents.

## Data correctness and async job lifecycle

- PostgreSQL/Supabase is source of truth for users, profiles, subscriptions, credit ledger, idempotency keys, jobs, outputs, payments and audit events.
- Reserve free-trial credits with a database transaction and unique idempotency key before enqueueing.
- Write job + credit reservation + outbox event atomically. An outbox publisher forwards events to Kafka; Kafka delivery alone is not the only record of a job.
- Return HTTP 202 with a job ID for queued work. A separate worker consumes Kafka with bounded concurrency and idempotent handling, then persists status/result.
- Reuse the same job ID and reservation on retry. On permanent failure, mark the job failed and refund once transactionally. Dead-letter exhausted events and expose useful status to users.
- Polling endpoints authorize ownership and return persisted status. Avoid long AI-provider calls inside user-facing Vercel requests when async mode is enabled.

## Ten-user free-trial acceptance matrix

Use ten distinct staging accounts and synthetic business data only.

1. Registration/login and invalid/expired token.
2. Two accounts with different brand profiles, logos and contact details; verify no cross-user leakage.
3. Partial profile update preserves untouched fields; explicit clear removes only selected field.
4. Generate Tamil and English copy/poster; check text, font legibility, logo placement, contact details and responsive preview.
5. Submit the same idempotency key twice concurrently; one job and one credit reservation only.
6. Submit ten distinct generation jobs; queue remains bounded and UI returns promptly with a job ID.
7. Worker restart, duplicate Kafka delivery, provider timeout, retry and dead-letter path.
8. Successful job consumes credits once; failed job refunds credits once.
9. Refresh or sign in on another browser; profile, jobs, outputs and credit balance persist.
10. Rate-limit overflow yields 429; Redis outage yields controlled 503 in required mode; no unbounded provider retries.
11. Payment UI uses Razorpay test mode only; no payment or paid-provider stress tests.
12. Verify keyboard access, mobile layout, contrast, loading/empty/error/success states and no console errors.

## Rollout gates

- Gate A: type-check, production build and existing tests pass.
- Gate B: staging integration checks pass with Redis configured.
- Gate C: persistent profile/credit/job tables and a separate Kafka worker are deployed and verified.
- Gate D: ten-account functional test and 10-VU k6 smoke test pass with saved evidence.
- Gate E: ramp to 25, 50, then 100 concurrent users; monitor p95/p99, error rate, queue lag, retry count, Redis availability, database connections and provider spend.
- Only after those gates pass should a 1,000-user test be planned with a provider quota and cost budget.

## Current implementation boundary

Redis rate-limiting middleware, Kafka REST producer adapter, 10-VU k6 script, and type-system polish are added on the pilot branch. Kafka is intentionally not wired into billable generation until database-backed jobs/credits and a durable worker exist. The product checklist records required data-integrity and end-user acceptance work; it is not a claim that all items have already passed.
