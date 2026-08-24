# Glint Web

Browser-based editor that turns app screenshots into store-ready marketing visuals with curated templates. Frame, theme, batch export - no login, no backend.

## Features

- **Session import** - drag `session.json` + PNGs from `glint_capture` or Glint Bridge
- **Curated templates** - 7 simple Play Store / App Store / iPad layouts
- **Figma-like editor** - pan/zoom canvas, add/delete text, background color picker, fonts
- **Batch export** - apply one template to all screenshots, export as ZIP
- **Upload** - drag & drop or import from Glint Bridge via WebSocket
- **Device frames** - Pixel, Samsung, iPhone, iPad with screenshot compositing
- **Export presets** - Play Store (1080×1920), App Store (1290×2796), iPad (2048×2732)
- **QR export** - generate QR for Glint View preview on device

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Workflow

1. Run `dart run glint_capture` in your Flutter app (or capture via Bridge)
2. Import the output folder into Glint Web
3. Pick a curated template
4. Customize text, background, frames on the canvas
5. Export all screenshots as ZIP
6. Scan QR with Glint View to preview

## Tech Stack

- React 19 + Vite
- TailwindCSS 4
- Fabric.js 7 (canvas + template rendering)
- JSZip (batch exports)
- qrcode (session QR for Glint View)

## Templates

Templates live in `public/templates/` as JSON definitions. Each template defines layers (`background`, `headline`, `device`, `bullets`, …). The `device` layer composites a screenshot inside a frame SVG.

## Integration

- **Glint Capture:** Import `build/glint_screenshots/` folder
- **Glint Bridge:** WebSocket at `ws://localhost:7700` for live capture
- **Glint View:** QR code or paste session JSON for preview

## License

MIT
