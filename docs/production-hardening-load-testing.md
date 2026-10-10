# Production hardening and load-test runbook

## Status and limitations

A successful build is not evidence that the service supports 1,000 concurrent users. The current application still contains in-memory user, credit, generation, and payment stores. These are not safe as authoritative state across Vercel serverless instances or cold starts. Legacy routes also use `x-user-id` lookup rather than consistently validating a Supabase access token. Do not accept live payments or claim a 1,000-user SLA until these are resolved.

## Run the staged smoke/load test

Use a staging deployment only. Obtain explicit approval before running load against production; load tests can consume provider quota, create bills, and trigger abuse protection.

Install k6 using the official instructions: https://grafana.com/docs/k6/latest/set-up/install-k6/

Run:
```bash
k6 run -e BASE_URL=https://YOUR-STAGING-URL.vercel.app tests/load/bizmate-smoke-load.js
```

The script ramps through 25, 100, 250, 500 and 1,000 virtual users. It only calls the health endpoint and public plans endpoint, so it does not generate paid AI assets, create payments, or verify authenticated workflows. Its thresholds are initial targets, not a contractual SLA. A failed run should be investigated before any higher-impact scenario.

## Functional test matrix before production

- Registration: valid input, invalid email, weak password, duplicate account, email-confirmation flow.
- Login/session: valid and invalid credentials, expired token, missing token, user A cannot read or modify user B resources.
- Generation: each creative type, unsupported input, provider timeout/429/5xx, idempotency key replay, credit reservation/refund, concurrent duplicate requests.
- Payments: Razorpay test-mode order creation, invalid signature, wrong order owner, repeated callback, webhook replay, no double crediting. Never use real charges for load tests.
- Persistence: restart/cold start and multi-instance reads preserve users, balances, jobs, payments, and usage ledger.
- Admin: non-admin blocked; provider spend and audit records durable.
- Operations: health/readiness, structured logs with request ID, error rates, p95/p99 latency, provider latency, queue depth, DB pool usage, rate-limit counters, alerts and rollback.

## Required architecture work for a real 1,000-concurrent-user target

1. Use Supabase/Postgres as the authoritative store for users, subscriptions, payments, credit ledger, jobs, and usage telemetry. Enforce row-level security and transactional/idempotent credit updates.
2. Validate Supabase access tokens on every protected route; remove trust in client-supplied `x-user-id`. Separate admin authorization.
3. Use distributed rate limiting (for example, Upstash Redis) by IP and authenticated user, with tighter limits for login, registration, generation, and payment endpoints.
4. Move long-running generation into a durable queue/worker (for example, a managed queue) with bounded concurrency, provider timeouts, exponential backoff with jitter, retry budgets, and dead-letter handling. Return a job ID and poll/stream status instead of holding serverless requests open.
5. Add request/body limits, schema validation, idempotency for billable operations, webhook signature verification, CORS allowlisting, security headers, and secrets rotation.
6. Verify Vercel function limits, region, database connection pooling, provider rate limits/quotas, and cost budget. Capacity depends on workload mix, not just concurrent HTTP connections.

## Exit criteria

- Type-check, unit/integration tests and build pass in CI.
- Staging functional scenarios pass with provider test credentials.
- k6 1,000-VU run completes with <1% failed requests, p95 <800 ms and p99 <2 s for these lightweight endpoints, with no sustained DB/provider saturation.
- A separate controlled test exercises authenticated read/write workflows and async generation with mocked providers before any bounded provider-backed test.
- Payment reconciliation and persistence are verified across duplicate events and cold starts.
- Rollback procedure and alerts are tested.

Do not run provider-backed generation/payment load tests against production by default. Use isolated test accounts, provider sandbox keys, strict spending caps, and an agreed test window.
