---
name: glint-screenshot-workflow
description: End-to-end Glint screenshot workflow for AI agents — real Capture, Web polish, headless ZIP.
---

# Glint Screenshot Workflow

Use when a user needs Play / App Store screenshots. **Real UI only** — never invent screens (App Store 2.3.10).

## Preferred pipeline

1. **Capture (Flutter)** — add `glint_capture` (`ref: v0.1.0`), `glint init`, write `GLINTRule`s for real widgets, `glint capture` (**pixel9** soft launch).
2. **Validate** — MCP `glint_validate_session` or check `session.json` + PNGs exist.
3. **Polish** — open Glint Web → import folder → template (Blink / Warm Glow) → captions / colors / Design chrome.
4. **Export** — ZIP from Web, or MCP `glint_export` / `npm run headless:export` when Web preview is running.
5. **QA** — Copy for Glint View → paste on device.

## Agent / MCP tools

See [Glint-MCP/README.md](../../../../Glint-MCP/README.md):

- `glint_init`, `glint_capture`, `glint_validate_session`, `glint_export`, `glint_ecosystem_info`

Headless export needs `npm run build && npm run preview` in Glint-Web (+ Playwright).

## Web-only polish (screenshots already exist)

1. Import folder in Assets (`session.json` + PNGs)
2. Pick one **template pack**
3. Short benefit captions (3–6 words)
4. Brand colors; map screenshots onto devices
5. Export ZIP (`{AppName}.zip` or `glint.zip`); optional Fastlane layout
6. **Copy for Glint View** for listing QA

## Guardrails

- Never invent product capabilities or fake UI
- Soft launch: one device (`pixel9`) unless user asks otherwise
- Do not rebuild the editor inside Glint View
- Prefer Capture over simulator HTML mockup generators
