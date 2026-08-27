# Glint Web

Browser editor that turns real app screenshots into store-ready frames. No login, no backend.

## Features

- **Frames board** - 1–10 store-size artboards (AppLaunchpad-style), not an infinite canvas
- **Graphic templates** - Play Store & App Store packs by device (phone, tablet, TV, Wear, Chromebook, iPhone, iPad) with premium frames where they apply
- **Assets** - import screenshots, sessions, or Bridge captures; map 1:1 onto frames
- **Layers** - drag to restack, device right-click → import screenshot
- **Export** - store PNG ZIP, **`.glintpack`** (editable round-trip), Copy for Glint View
- **Glint View handoff** - pack import/share, or Preview → **Copy for Glint View**

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Workflow

1. Capture with [Glint Capture](../Glint-Capture) or [Glint Bridge](../Glint-Bridge)
2. Import the folder (or drop PNGs) in **Assets**
3. Pick a template in **Templates** (loads a frame pack)
4. Edit frames on the board; manage layers in **Frames**
5. **Export** → Download `.glintpack` (editable) and/or store PNG ZIP → optional Copy for Glint View

## Tech Stack

- React 19 + Vite + Tailwind CSS 4
- Fabric.js 7 (per-frame canvases)
- JSZip + qrcode

## Templates

JSON packs in `public/templates/`. Device layers composite screenshots inside SVG bezels under `public/frames/`.

## Integration

| Tool | How |
|------|-----|
| **Capture** | Import output folder (`session.json` + PNGs) |
| **Bridge** | `ws://127.0.0.1:7700` + pairing token; captures arrive as data URLs |
| **View** | Export → Copy for Glint View (full screenshots). QR = metadata only |

## Future work

Community marketplace / contribute-via-`.glintpack` is planned but **not** in scope yet — see [docs/FUTURE-marketplace-glintpack.md](docs/FUTURE-marketplace-glintpack.md).

## License

MIT
