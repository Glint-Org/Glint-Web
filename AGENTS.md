# Glint-Web - Agent Instructions

Glint-Web is the frames editor in the Glint ecosystem (AppLaunchpad-style board, not an infinite canvas).

## Core UI model

- Left sidebar: `Templates` · `Assets` · `Frames` · `Export`
- Center: **frames board** (1–10 store-size artboards)
- Right sidebar: design controls for the selected frame/object

## Rules

1. Real UI only (do not fabricate app features)
2. `session.json` + PNGs are the import contract
3. Store sizes must stay correct:
   - Play: `1080x1920`
   - iOS phone: `1290x2796`
   - iPad: `2048x2732`
4. If app name is set, export ZIP as `{AppName}.zip`; else `glint.zip`
5. View handoff: after Preview/Export, **Copy for Glint View** embeds `data:` screens (QR is metadata-only)

## Related docs

- `../Glint-Docs/guides/using-glint.md`
- `../Glint-Docs/guides/ai-workflow.md`
- `../Glint-Docs/reference/session-schema.md`
