# Redis + Kafka pilot rollout

## Implemented in this branch

- API-wide distributed fixed-window rate limiting backed by Upstash Redis REST.
- Per-identity buckets: auth 10/minute, generation-related routes 20/minute, other API routes 120/minute.
- Rate-limit response headers, HTTP 429 on limit, and fail-closed HTTP 503 if Redis is missing/unavailable in required mode.
- Serverless-safe Kafka REST publisher for Upstash Kafka.
- Bounded 10-VU / 2-minute k6 smoke test for health and public plans.

## Staging environment variables

Set server-side only; never prefix these with `VITE_`:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_KAFKA_REST_URL`
- `UPSTASH_KAFKA_REST_TOKEN`
- `UPSTASH_KAFKA_TOPIC` (optional; defaults to `bizmate-generation-events`)
- `RATE_LIMIT_MODE=required`

For local development only, set `RATE_LIMIT_MODE=local` to bypass the remote limiter if Redis is not configured. Production ignores that bypass.

## Kafka safety boundary

The producer and event contract exist, but billable generation is **not yet switched to Kafka**. The current job and credit ledger are in-memory, so a separate worker cannot safely reconcile credits or persist results across cold starts. Do not enable generation publishing/consumption as a source of truth until durable Postgres tables and transactional credit reservations are implemented. A production worker needs bounded concurrency, idempotency, retries with jitter, a dead-letter topic, and persistent status/results.

## First pilot: 10 free-trial users

1. Deploy this branch to a dedicated staging project, not production.
2. Add Redis credentials to staging and set `RATE_LIMIT_MODE=required`.
3. Configure Kafka credentials and verify the topic exists. The queue publisher is not yet called by user requests.
4. Run:
   ```bash
   k6 run -e BASE_URL=https://YOUR-STAGING-URL.vercel.app tests/load/bizmate-pilot-10-users.js
   ```
5. Check: zero HTTP failures, p95 under 800 ms, p99 under 2 seconds, no unexpected 429/503 responses, and `RateLimit-*` headers on API responses.
6. With ten distinct staging accounts, run functional checks: registration/login, token validation, user isolation, free-credit balance, generation validation, idempotency replay, provider timeout/refund, and job polling. Do not run real paid-provider or payment load tests.
7. Review the results before enabling async generation. Then ramp to 25, 50 and 100 users, monitoring queue lag, provider quotas, errors, latency, Redis health, DB pool saturation and spend.

## Blockers before a production or 1,000-user claim

- Redis rate limiting does not replace authentication or database persistence.
- Kafka is not a database and must not be used to mutate in-memory credit state.
- Legacy `x-user-id` authentication and in-memory user/job/credit/payment state still need migration.
- No 10-user test has been run until a real staging URL is available and test output is reviewed.
