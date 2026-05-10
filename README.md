# Telor Web

Telor Web — lightweight editor to frame, style, preview, and export Play Store–ready screenshots.

What this repo does
- Accepts screenshots (upload or live from Telor Bridge) and produces framed, themed PNG assets ready for export.

Core tech
- React + Vite
- TailwindCSS
- Fabric.js (canvas editing)

Quick start
1. Install: `npm install`
2. Dev: `npm run dev`

Integration
- Connects to a local Telor Bridge WebSocket (ws://localhost:7700) or imports session JSON/ZIP exports.

License
- No backend or auth included; intended for local use. See repository LICENSE for details.
