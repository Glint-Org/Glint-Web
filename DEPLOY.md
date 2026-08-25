# Glint Web — Cloudflare Pages

1. Connect this repo (or the `Glint-Web` subdirectory) to Cloudflare Pages.
2. Build settings:
   - **Root directory:** `Glint-Web` (if monorepo) or `.`
   - **Build command:** `npm ci && npm run build`
   - **Output directory:** `dist`
3. Framework preset: Vite.
4. After deploy, set the public URL in the org README soft-launch section.

SPA fallback is configured via [`public/_redirects`](public/_redirects).
