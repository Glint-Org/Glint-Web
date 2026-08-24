# Glint-Web — Agent Instructions

Glint-Web is the screenshot polishing editor in the Glint ecosystem.

## Core UI model

- Left sidebar: `Templates` · `Assets` · `Export`
- Right sidebar: design controls only (graphics, canvas, frame, screenshot style, typography)
- Center: infinite canvas

## Rules

1. Real UI only (do not fabricate app features)
2. `session.json` + PNGs are the import contract
3. Store sizes must stay correct:
   - Play: `1080x1920`
   - iOS phone: `1290x2796`
   - iPad: `2048x2732`
4. If app name is set, export ZIP as `{AppName}.zip`; else `glint.zip`

## Related docs

- `../Glint-Docs/guides/using-glint.md`
- `../Glint-Docs/guides/ai-workflow.md`
- `../Glint-Docs/reference/session-schema.md`
