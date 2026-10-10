# BizMate AI (V1) — Autonomous AI Marketing SaaS MVP

BizMate AI is a production-oriented AI marketing SaaS MVP that transforms a single business requirement into an omnichannel marketing campaign.

---

## 1. Implemented Features

### AI Creative Studio (8 Formats)
1. **Promotional Poster**: Dynamic high-contrast retail layouts with festive ornaments, discount badges, typography hierarchy, and instant vector SVG and PNG export.
2. **Omnichannel Marketing Copy**: Psychological ad copy with multi-channel variants for Instagram, Facebook, and WhatsApp, including hashtags and high-CTR hooks.
3. **Social Creatives**: Multi-aspect ratio formats (1:1 Square, 4:5 Portrait, 1.91:1 Landscape Ads).
4. **YouTube Thumbnail**: High-CTR 16:9 thumbnails with bold legible text for mobile feeds.
5. **Promotional Video Storyboard**: 30-second multi-scene commercial scripts with director visual descriptions, voiceovers, and suggested audio vibes.
6. **WhatsApp Broadcast Creative**: Formatted direct messages with bold text, bullet points, and one-click WhatsApp Web sharing.
7. **Email Newsletters**: Compelling subject line variants, preview text, and responsive layout templates with direct email mailto links.
8. **Executive Marketing Strategy Reports**: Comprehensive customer personas, channel budget breakdowns, expected ROAS, and key tracking KPIs.

### Single-Requirement Core Workflow
- **Requirement Analysis**: Powered by Google Gemini 3.8 Flash SDK to deconstruct user intent into business objectives, target audience personas, and recommended creative types.
- **Atomic Credit Reservation**: Check → Reserve → Generate → Reconcile with immutable transaction ledger (`usage_ledger`).
- **Live Graphic Preview**: Interactive Canvas & SVG engine allowing on-the-fly customization of headlines, badges, and colors before export.

### Security & Enterprise Architecture
- **Multi-Tenant Data Isolation (RLS)**: Row-Level Security checks preventing cross-tenant access.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `USER`, `ADMIN`, and `SUPER_ADMIN`.
- **Server-Side Payment Signature Integrity**: Razorpay order creation and cryptographic HMAC SHA-256 signature verification.
- **Rule 37 Security Acceptance Test Suite**: Live automated test runner verifying all 6 security assertions directly in the browser and API.
- **Honest Integrations (Rule 0 & 40)**: Unconfigured credentials transparently report `"NOT CONFIGURED / NOT TESTED"`.

---

## 2. Project Structure

```
├── .env.example                       # Documented environment variables
├── index.html                         # Entry HTML with meta tags & SEO
├── metadata.json                      # AI Studio permissions & capabilities
├── package.json                       # Dependencies & scripts
├── server.ts                          # Full-stack Express server + Vite middlewares
├── tsconfig.json                      # Strict TypeScript configuration
├── vite.config.ts                     # Tailwind CSS v4 & Vite config
├── src/
│   ├── main.tsx                       # React DOM entry point
│   ├── index.css                      # Tailwind CSS v4 styles
│   ├── App.tsx                        # Root layout, routing, and toast provider
│   ├── types/
│   │   └── client.ts                  # Client routes and UI interfaces
│   ├── context/
│   │   └── AppContext.tsx             # Global user, credit, and session state
│   ├── components/
│   │   ├── Navbar.tsx                 # Navigation with credit pill & role switcher
│   │   ├── Footer.tsx                 # Compliance, links, and security badges
│   │   ├── PosterCanvas.tsx           # Vector SVG & PNG graphic renderer
│   │   └── SecurityTestRunner.tsx     # Live execution of the 6 Rule 37 tests
│   ├── pages/
│   │   ├── HomePage.tsx               # Public landing page with prompt playground
│   │   ├── FeaturesPage.tsx           # Creative formats specification breakdown
│   │   ├── PricingPage.tsx            # Indian Rupee pricing & Razorpay checkout
│   │   ├── PublicPages.tsx            # About, Contact, Privacy, Terms, Refund, Docs
│   │   ├── AuthPages.tsx              # Login and Register with evaluator pre-fills
│   │   ├── DashboardOverview.tsx      # Metrics, remaining credits, recent jobs
│   │   ├── CreativeStudioPage.tsx     # Central multi-format generation hub
│   │   ├── ChatAssistantPage.tsx      # Grounded Gemini marketing strategist chat
│   │   ├── HistoryPage.tsx            # Past generation jobs audit table
│   │   ├── AssetsPage.tsx             # Private media asset library
│   │   ├── ReportsPage.tsx            # Campaign attribution, CSV & JSON exports
│   │   ├── SubscriptionPage.tsx       # Plan management and invoice history
│   │   ├── UsageLedgerPage.tsx        # Immutable credit ledger
│   │   └── AdminPage.tsx              # RBAC admin portal, MRR metrics, credit overrides
│   └── server/
│       ├── types/
│       │   └── index.ts               # Database models, plans, and job statuses
│       ├── db/
│       │   └── database.ts            # In-memory relational database with RLS
│       ├── services/
│       │   ├── gemini.service.ts      # Server-side Google Gemini 3.8 Flash SDK
│       │   ├── credit.service.ts      # Atomic reservation & ledger reconciliation
│       │   ├── generation.service.ts  # Job lifecycle, queuing & idempotency
│       │   ├── payment.service.ts     # Razorpay order creation & HMAC verification
│       │   ├── integrations.service.ts# Connectivity status for all 8 providers
│       │   └── security-test.service.ts# Live Rule 37 security test runner
│       └── routes/
│           └── api.routes.ts          # Unified Express REST API router (/api/v1)
```

---

## 3. Frontend Architecture

- **Framework**: React 19 SPA running on Vite 8 with TypeScript strict mode.
- **Styling**: Tailwind CSS v4 with modern dark theme design tokens (`neutral-950`, `amber-400`, `emerald-400`).
- **State Management**: React Context (`AppContext`) managing user session, credit balance, active jobs, route state, and toast notifications.
- **Graphics Pipeline**: `PosterCanvas` utilizes pure HTML5 Canvas and scalable inline SVG templates for responsive rendering across 1:1, 16:9, 9:16, 4:5, and 1.91:1 aspect ratios.
- **Zero-Flicker Role Switching**: Built-in header pill allows evaluators to toggle between standard `USER` and `SUPER_ADMIN` to test RLS boundaries and admin routes.

---

## 4. Backend Architecture

- **Entry Point**: `server.ts` running Express on port 3000, mounting `/api/v1` routes before attaching Vite's development middlewares.
- **AI Engine**: `@google/genai` TypeScript SDK using `gemini-3.8-flash` on the server with `User-Agent: aistudio-build`.
- **Database Engine**: Relational in-memory database with foreign keys, unique indexes, and RLS checking (`assertUserAccess`, `enforceRLS`).
- **Atomic Credit Ledger**:
  ```
  Check Balance → Reserve Credits (holding lock) → Run Generation → Finalize (Consume or Refund)
  ```
  Guarantees that double-spending and quota bypasses are rejected.

---

## 5. API Contracts (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/auth/me` | Fetch active user profile, subscription, and balance |
| `POST` | `/api/v1/auth/login` | Email/password login |
| `POST` | `/api/v1/auth/register` | Register new user with 50 bonus credits |
| `POST` | `/api/v1/auth/switch-role` | Evaluator role switcher (`USER` vs `SUPER_ADMIN`) |
| `POST` | `/api/v1/creative/analyze` | Deconstruct business prompt into marketing plan |
| `POST` | `/api/v1/generations` | Execute creative generation with atomic credit lock |
| `GET` | `/api/v1/generations` | List user generation jobs |
| `GET` | `/api/v1/credits/balance` | Query user credit balance |
| `GET` | `/api/v1/credits/ledger` | Retrieve immutable credit ledger |
| `GET` | `/api/v1/plans` | List plans and pricing in INR |
| `POST` | `/api/v1/payments/create-order` | Create Razorpay order |
| `POST` | `/api/v1/payments/verify` | Server-side cryptographic signature verification |
| `GET` | `/api/v1/assets/:id/download` | Authenticated media asset download |
| `POST` | `/api/v1/chat` | AI Marketing Strategist assistant |
| `GET` | `/api/v1/integrations/status` | Real health status for all 8 providers |
| `GET` | `/api/v1/admin/overview` | Calculated MRR, ARR, and failure rate (Admin only) |
| `POST` | `/api/v1/security/run-tests` | Run the 6 Rule 37 security acceptance tests |

---

## 6. Known Limitations & Credential Status

1. **Third-Party API Keys**: When `RAZORPAY_KEY_ID`, `WHATSAPP_ACCESS_TOKEN`, `RESEND_API_KEY`, or `YOUTUBE_CLIENT_ID` are not configured in `.env`, the system marks them as **"NOT CONFIGURED / NOT TESTED"** and provides sandbox simulations.
2. **Video Inference**: Open-source/Higgsfield external GPU inference endpoints are not attached by default; promotional video storyboard scripts and visual cues are generated via Gemini 3.8 Flash.
3. **Storage Engine**: Assets in this MVP are persisted in server-side private buffers and served through authenticated download endpoints. Connecting `SUPABASE_STORAGE` moves binaries to cloud buckets.
