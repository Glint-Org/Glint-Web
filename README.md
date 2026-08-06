# Telor Web

Browser-based editor that turns Android screenshots into Play Store–ready marketing visuals. Frame, theme, arrange, and export — no login, no backend.

## Features

- **Upload** — drag & drop or import from Telor Bridge via WebSocket
- **Device frames** — bezel overlays for Pixel, Samsung, and generic devices
- **Background themes** — gradient, blur glass, solid dark/light
- **Text overlays** — app name and tagline rendered on the canvas
- **Layout tools** — reorder screenshots, grid/carousel preview
- **Export** — single PNG or batch ZIP (1080×1920 default)

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. For Bridge integration, start Telor Bridge first — the editor shows "Bridge Connected" automatically.

## Tech Stack

- React 19 + Vite
- TailwindCSS 4
- Fabric.js 7 (canvas editing)
- JSZip (batch exports)

## Integration

Telor Web connects to a local [Telor Bridge](https://github.com/Telor-Org/Telor-Bridge) instance at `ws://localhost:7700`. Screenshots appear in the editor as they're captured. You can also upload images directly.

## License

MIT
