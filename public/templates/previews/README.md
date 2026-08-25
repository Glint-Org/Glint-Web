# Static template preview strips

Drop one image per template id here for fast gallery/home tiles.

| File | Example |
|------|---------|
| `{template-id}.webp` (preferred) | `blink-play.webp` |
| `{template-id}.png` | `warm-glow-ios.png` |
| `{template-id}.jpg` | `mint-tags-play.jpg` |

Exact store aspect, all frames side-by-side (Figma export). When present, Glint Web uses the static file; otherwise it live-renders with Fabric.

Generate drafts after a production build:

```bash
cd Glint-Web
npm run build
npm run generate:previews
```

Requires Playwright (`npx playwright install chromium`) for the generator script.
