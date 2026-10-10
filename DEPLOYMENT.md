# Vercel CI/CD setup for BizMate AI

This repository uses GitHub Actions as the release controller: validate → deploy Preview/staging → wait for GitHub production-environment approval → build a production candidate without assigning domains → smoke-test it → promote it to production.

## One-time setup

### 1. Link the existing Vercel project

In Vercel, connect the existing `ARUNAGIRI011/microsaas` repository or select the existing BizMate AI project. Do not create a duplicate project. Confirm the Root Directory is the repository root and the framework is Vite.

Because GitHub Actions is the release controller, make sure a Vercel Git integration does not independently publish every `main` push to production and bypass approval. Disable automatic production deployments from the Git integration, or use the workflow as the only production release path.

### 2. Add GitHub Actions secrets

Open GitHub → repository Settings → Secrets and variables → Actions → New repository secret. Add these exact names:

- `VERCEL_TOKEN`: a Vercel access token with access to the intended team/project.
- `VERCEL_ORG_ID`: the Vercel team/account ID.
- `VERCEL_PROJECT_ID`: the ID of the existing BizMate AI Vercel project.

Find the project ID in Vercel Project Settings → General. The team/account ID is available in the Vercel project settings or the project's `.vercel/project.json` after linking locally. Generate the token in Vercel account settings.

Only enter values into GitHub's secret form. Do not commit them, put them in workflow YAML, paste them into chat, or print them in logs. The workflow fails early if any is missing.

### 3. Configure staging

Open GitHub → Settings → Environments and create an environment named `staging`. The workflow deploys a Vercel Preview deployment and tests `/api/health`.

In Vercel Project Settings → Environment Variables, configure required app variables for **Preview** (for example `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`). Use separate values where appropriate; never expose server-only keys through `VITE_*` variables.

### 4. Require production approval

Create a GitHub environment named `production`. Under its protection rules, enable **Required reviewers** and select the approver(s). The production job pauses at this environment before it can build or promote. Merely naming the environment in YAML does not enforce approval until required reviewers are configured in GitHub settings.

Set production environment variables separately in Vercel. Keep server secrets out of the browser bundle.

### 5. Run the pipeline

Push a reviewed commit to `main`, or manually run the workflow on `main`:

1. Type-check and build.
2. Deploy a Vercel Preview URL as staging.
3. Smoke-test the staging API health endpoint.
4. Wait for approval at GitHub's `production` environment.
5. Build a production candidate with domains skipped.
6. Smoke-test the candidate.
7. Promote it to the production domains.

## Important application notes

- `api/[...path].ts` is the serverless Express entrypoint; `server.ts` remains the local development/server entrypoint.
- This pipeline does not apply Supabase migrations. Database migrations remain a separately reviewed, manually triggered workflow.
- The app's in-memory data store is not durable across serverless invocations. Complete the Supabase persistence/auth migration before using the app for real customer data or payments.
- The current API has permissive CORS headers and legacy demo identity paths. Review those security issues before public production launch.
- Treat the first deployment as a setup/test run. Confirm Vercel CLI routing and `/api/health` behavior in Preview before enabling production releases.
