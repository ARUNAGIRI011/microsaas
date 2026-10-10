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

### 6. Configure Open-Higgsfield-compatible image/video generation

BizMate AI now calls the MuAPI endpoints used by the [Open-Higgsfield-AI open-source project](https://github.com/Autom8AI/Open-Higgsfield-AI) for poster images and UGC video jobs. The project is a Next.js studio/UI and model catalogue; its README says inference is performed by MuAPI and requires a MuAPI API key. Open source does **not** mean the generation compute/API is unlimited or free.

Add `MUAPI_API_KEY` as a **server-only** environment variable in Vercel Preview and Production. Do not use a `VITE_*` prefix. Create the key in the MuAPI account and check its free quota/pricing before allowing customer generation. No MuAPI key is embedded in the repository.

- Poster, Instagram creative, and YouTube thumbnail generation submits a `flux-dev-image` job.
- UGC video generation submits a Seedance 2.0 text-to-video job, or image-to-video when a supported product/logo reference is uploaded.
- The API uses `POST /api/v1/{model-endpoint}` and polls `GET /api/v1/predictions/{request_id}/result`, matching the upstream project pattern.
- Output images/videos are shown in the Creative Studio when the provider reports a completed job.
- Uploaded PNG/JPEG/WebP references are forwarded through MuAPI's upload endpoint. Generated model text may not preserve logos, phone numbers, or addresses exactly; keep the existing SVG poster as a precise, editable brand-layout option.

Reference: [Open-Higgsfield-AI README and API details](https://github.com/Autom8AI/Open-Higgsfield-AI) and [MuAPI endpoint example](https://github.com/Anil-matcha/Seedance-2.0-API).

## Recommended export formats

- Posters/social feed: PNG for crisp text and transparent assets; JPEG for smaller photo-heavy files. Keep SVG as an optional editable/vector export.
- Instagram feed creative: 1080×1350 (4:5) or 1080×1080 (1:1).
- YouTube thumbnail: 1280×720 (16:9), PNG or JPEG, under YouTube's current upload-size limit.
- Reels/Shorts/TikTok UGC video: MP4 (H.264 video + AAC audio), vertical 9:16, typically 1080×1920; use a 5–15 second first cut for ads, then extend as needed.
- Landscape video: MP4, 16:9 for YouTube/web.
- Keep the text-only .txt export removed from the poster canvas. Use image/video formats for the actual creative; keep JSON only as an optional editable layout blueprint.

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
