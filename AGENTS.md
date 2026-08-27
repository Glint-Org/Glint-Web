# Glint-Web - Agent Instructions

Glint-Web is the frames editor (AppLaunchpad-style board).

## Sidebars

**Left** (workflow tabs): Templates · Assets · Frames · Export

**Right** (Design tabs):
- `Device` — visual device bezel tiles (replace selected / active artboard device)
- `Graphics` — visual graphic preview tiles
- `Colors` — background swatches
- `Design` — text insert, fonts, typography

**Center:** frames board. Active artboard has accent ring; Fabric objects use gold selection handles.

## Rules

1. Real UI only
2. `session.json` + PNGs import contract
3. Store sizes: Play `1080x1920`, iOS phone `1290x2796`, iPad `2048x2732`
4. ZIP `{AppName}.zip` or `glint.zip`
5. View handoff via Copy for Glint View (`data:` screens)

## Future (do not implement unless asked)

Marketplace / contribute `.glintpack` → community gallery: `docs/FUTURE-marketplace-glintpack.md`.
