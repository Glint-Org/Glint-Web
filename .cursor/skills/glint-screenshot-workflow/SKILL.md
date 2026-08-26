---
name: glint-screenshot-workflow
description: End-to-end Glint screenshot workflow for AI agents — real Capture/Bridge, Web polish, headless ZIP.
---

# Glint Screenshot Workflow

Use when a user needs Play / App Store screenshots. **Real UI only** — never invent screens (App Store 2.3.10).

**You are the AI.** Do not ask the user for Capture API keys.

## Preferred pipeline

1. **Capture (Flutter, no device)**  
   - Discover real screens (`glint discover --write` / `glint capture --auto` / write `GLINTRule`s yourself)  
   - Soft launch: **pixel9** only  
   **Or Bridge:** manual capture / crawl / MCP `glint_bridge_crawl`
2. **Validate** — MCP `glint_validate_session` or check `session.json` + PNGs.
3. **Polish** — Glint Web → import → template → captions / colors.
4. **Export** — ZIP from Web, or MCP `glint_export`.
5. **QA** — Copy for Glint View → paste on device.

## Agent / MCP tools

See [Glint-MCP/README.md](../../../../Glint-MCP/README.md):

- `glint_init`, `glint_discover`, `glint_capture`, `glint_bridge_crawl`, `glint_validate_session`, `glint_export`

## Guardrails

- Never invent product UI bitmaps
- Never ask for OpenAI/Anthropic keys for Capture
- Soft launch: one device (`pixel9`) unless user asks otherwise
- Prefer Capture discover/rules or Bridge crawl over HTML mockups
