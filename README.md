# Telor Web

Browser-based editor that turns app screenshots into store-ready marketing visuals with viral templates. Frame, theme, batch export — no login, no backend.

## Features

- **Session import** — drag `session.json` + PNGs from `telor_capture` or Telor Bridge
- **Viral templates** — 12 curated Play Store / App Store layout presets
- **Batch export** — apply one template to all screenshots, export as ZIP
- **Upload** — drag & drop or import from Telor Bridge via WebSocket
- **Device frames** — Pixel, Samsung, iPhone, iPad bezels
- **Export presets** — Play Store (1080×1920), App Store (1290×2796), iPad (2048×2732)
- **QR export** — generate QR for Telor View preview on device

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Workflow

1. Run `dart run telor_capture` in your Flutter app (or capture via Bridge)
2. Import the output folder into Telor Web
3. Pick a viral template
4. Export all screenshots as ZIP
5. Scan QR with Telor View to preview

## Tech Stack

- React 19 + Vite
- TailwindCSS 4
- Fabric.js 7 (canvas + template rendering)
- JSZip (batch exports)
- qrcode (session QR for Telor View)

## Templates

Templates live in `public/templates/` as JSON definitions. Each template defines layers (background, headline, device frame, screenshot, badge, bullets).

## Integration

- **Telor Capture:** Import `build/telor_screenshots/` folder
- **Telor Bridge:** WebSocket at `ws://localhost:7700` for live capture
- **Telor View:** QR code or paste session JSON for preview

## License

MIT
