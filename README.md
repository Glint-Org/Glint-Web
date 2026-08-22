# Glint Web

Browser-based editor that turns app screenshots into store-ready marketing visuals with viral templates. Frame, theme, batch export — no login, no backend.

## Features

- **Session import** — drag `session.json` + PNGs from `glint_capture` or Glint Bridge
- **Viral templates** — 12 curated Play Store / App Store layout presets
- **Batch export** — apply one template to all screenshots, export as ZIP
- **Upload** — drag & drop or import from Glint Bridge via WebSocket
- **Device frames** — Pixel, Samsung, iPhone, iPad bezels
- **Export presets** — Play Store (1080×1920), App Store (1290×2796), iPad (2048×2732)
- **QR export** — generate QR for Glint View preview on device

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Workflow

1. Run `dart run glint_capture` in your Flutter app (or capture via Bridge)
2. Import the output folder into Glint Web
3. Pick a viral template
4. Export all screenshots as ZIP
5. Scan QR with Glint View to preview

## Tech Stack

- React 19 + Vite
- TailwindCSS 4
- Fabric.js 7 (canvas + template rendering)
- JSZip (batch exports)
- qrcode (session QR for Glint View)

## Templates

Templates live in `public/templates/` as JSON definitions. Each template defines layers (background, headline, device frame, screenshot, badge, bullets).

## Integration

- **Glint Capture:** Import `build/glint_screenshots/` folder
- **Glint Bridge:** WebSocket at `ws://localhost:7700` for live capture
- **Glint View:** QR code or paste session JSON for preview

## License

MIT
