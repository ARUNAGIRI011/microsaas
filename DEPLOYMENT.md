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

### 5. Configure Resend transactional email

The Supabase registration endpoint sends a best-effort welcome email through Resend. Add these server-side variables in **Vercel → Project Settings → Environment Variables** for both Preview and Production:

- `RESEND_API_KEY`: a Resend API key with sending permission only.
- `EMAIL_FROM`: a sender address on a domain verified in Resend (for example, `BizMate AI <hello@your-verified-domain.com>`).

Never use a `VITE_*` prefix for the API key. Verify your sending domain and its DNS records in Resend before sending to customers. Resend currently has no verified domains in the connected account, so production delivery will not work until a domain you control is added and verified. If email settings are absent or Resend rejects a message, registration still succeeds and the API reports `welcomeEmailSent: false`; provider errors are logged server-side without exposing credentials.

### 6. Configure low-cost AI poster generation and UGC video
Poster generation now supports a provider switch through `POSTER_IMAGE_PROVIDER`:
- `huggingface` (default): Hugging Face Inference Providers using FLUX.1-schnell. Configure server-only `HF_TOKEN` with Inference Providers permission. Hugging Face's free account currently includes a small monthly credit (listed as $0.10 and subject to change), not unlimited generation. This text-to-image endpoint does not apply uploaded logo/product reference images.
- `gemini`: configure `GEMINI_API_KEY`; the default model is `gemini-3.1-flash-lite-image`. Gemini text models can have a free tier, but native image-generation models are currently listed without a standard free API tier. Choose this provider only if you accept the current image-generation pricing.
- `muapi`: uses the legacy Open-Higgsfield-compatible `nano-banana` poster job and supports uploaded references. Configure server-only `MUAPI_API_KEY`; model usage may be billed.
The default is Hugging Face to avoid silently falling back to a paid provider. If its credit is exhausted or its selected model/provider is unavailable, the API reports the error rather than switching to a paid provider unexpectedly. Set `HF_IMAGE_ENDPOINT` only if you intentionally use a different compatible endpoint; default: `https://router.huggingface.co/fal-ai/fal-ai/flux/schnell`.

For UGC videos, the existing MuAPI/Seedance integration still requires `MUAPI_API_KEY` and can be billed. Open-Higgsfield is an open-source studio/model catalogue, not a free self-hosted inference engine. No provider keys belong in `VITE_*` variables or source control.

To configure on Vercel, add the needed variables separately to Preview and Production. For a lower-cost first test, set `POSTER_IMAGE_PROVIDER=huggingface`, add `HF_TOKEN`, and submit one small poster before enabling customer traffic. Use the editable SVG poster for exact logos, typography, and contact details; image models may render text or branding imperfectly.

Reference: [Hugging Face image generation and inference providers](https://huggingface.co/docs/inference-providers/guides/first-api-call), [Hugging Face pricing](https://huggingface.co/docs/inference-providers/pricing), [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), and [Open-Higgsfield-AI](https://github.com/Autom8AI/Open-Higgsfield-AI).

### 7. Run the pipeline

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
