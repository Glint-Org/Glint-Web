---
name: glint-screenshot-workflow
description: End-to-end Glint screenshot workflow for AI agents - real Capture/Bridge, Web polish, headless ZIP.
---

# Glint Screenshot Workflow

Use when a user needs Play / App Store screenshots. **Real UI only** - never invent screens (App Store 2.3.10).

**You are the AI.** Do not ask the user for Capture API keys.

## Modes (same verbs, different surface)

| Mode | When | Docs |
|------|------|------|
| **1 Manual** | User polishes in Glint Web | [using-glint](../../../../Glint-Docs/guides/using-glint.md) |
| **2 Headless / MCP** | You drive Capture/export offstage (default for agents) | [AI workflow](../../../../Glint-Docs/guides/ai-workflow.md), [MCP](../../../../Glint-MCP/README.md) |
| **3 Copilot** | Live shared editor + teach-by-edit *(roadmap)* | [editor-modes](../../../../Glint-Docs/reference/editor-modes.md), [copilot-mode](../../../../Glint-Docs/guides/copilot-mode.md) |

Prefer **Mode 2** unless the user asks to watch/edit live together.

## Preferred pipeline

1. **Capture (Flutter, no device)**  
   - Discover real screens (`glint discover --write` / `glint capture --auto` / write `GLINTRule`s yourself)  
   - Soft launch: **pixel9** only  
   **Or Bridge:** manual capture / crawl / MCP Bridge tools
2. **Validate** - MCP `glint_validate_session` or check `session.json` + PNGs.
3. **Polish** - Mode 2: `glint_render` / export tools; Mode 1: Glint Web import → template → captions / colors / scale / rotation.
4. **Export** - ZIP from Web, or MCP `glint_export`.
5. **QA** - Copy for Glint View → paste on device.

## Agent / MCP tools

See [Glint-MCP/README.md](../../../../Glint-MCP/README.md):

- `glint_init`, `glint_discover`, `glint_capture`, Bridge tools, `glint_validate_session`, `glint_render`, `glint_export`

## Guardrails

- Never invent product UI bitmaps
- Never ask for OpenAI/Anthropic keys for Capture
- Soft launch: one device (`pixel9`) unless user asks otherwise
- Prefer Capture discover/rules or Bridge crawl over HTML mockups
- In Copilot (when available): re-read editor state after human edits; honor Pause / Take over
