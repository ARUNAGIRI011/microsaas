# Google Antigravity & Deployment Guide — BizMate AI

This repository is configured for direct use with **Google Antigravity** (Google's agent-first IDE and platform) and can be synced to GitHub and deployed via Vercel CI/CD.

---

## 1. Google Antigravity Workspace Setup

BizMate AI includes native Antigravity workspace manifests:

1. **Manifest File (`antigravity.json`)**:
   - Defines the runtime, dev (`npm run dev`), build (`npm run build`), test (`npm test`), and lint commands.
   - Designates the default agent runtime as `antigravity-preview-09-2026`.

2. **Model Context Protocol (`.agents/mcp_config.json`)**:
   - Configures the local filesystem MCP server for autonomous code indexing and tooling in the Antigravity sandbox.

3. **Opening in Google Antigravity IDE / CLI**:
   ```bash
   # From the project directory:
   antigravity .
   # or with Antigravity CLI:
   antigravity run "Run npm test and verify poster generation"
   ```

---

## 2. Syncing to GitHub (`ARUNAGIRI011/microsaas`)

Direct pushes from this sandboxed environment require your GitHub authentication token. To sync these improvements to your repository:

### Option A: Apply the Prepared Patch (Recommended)
A unified git patch file `antigravity.patch` is included in this repository.

On your local machine or terminal:
```bash
git fetch origin main
git checkout main
git apply antigravity.patch
git add .
git commit -m "feat(antigravity): add Antigravity manifests, fix poster XML entities, and add 8/8 automated tests"
git push origin main
```

### Option B: Push Directly Using GitHub Personal Access Token (PAT)
```bash
git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/ARUNAGIRI011/microsaas.git
git add .
git commit -m "feat(antigravity): publish Antigravity workspace config and poster hardening"
git push origin main
```

---

## 3. Verified Verification Status

All checks have been executed and pass:
- **Test Suite (`npm test`)**: 8/8 PASSED
  - 8 concept themes produce valid XML SVG
  - All 5 aspect ratios (`1:1`, `16:9`, `9:16`, `4:5`, `1.91:1`) render accurate geometry
  - Ampersands, special XML entities (`&`, `<`, `>`, `"`, `'`), and Tamil Unicode text preserved safely
  - Missing optional fields normalize without exceptions
  - Long text wrapping preserves SVG structure
  - Logo and product image data URLs render without clipping
  - Credit rollback on failed generations
  - Idempotency prevents duplicate charges
- **TypeScript & Linting (`npm run lint`)**: 0 errors
- **Production Build (`npm run build`)**: Vite bundle succeeds
