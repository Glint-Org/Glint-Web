---
name: glint-screenshot-workflow
description: End-to-end Glint screenshot workflow for AI agents.
---

# Glint Screenshot Workflow (Web-side)

Use when a user asks to polish store screenshots with templates, captions, and export.

## Inputs

- Screenshot files (or session folder)
- Optional `session.json` with app/tagline/store/screen order

## Steps

1. Import folder in Assets (`session.json` + PNGs)
2. Pick one graphic template
3. Write short benefit captions (3-6 words each screen)
4. Match brand colors (graphics + text)
5. Validate frame/no-frame styling
6. Export ZIP:
   - `{AppName}.zip` if app name exists
   - `glint.zip` fallback

## Guardrails

- Never invent product capabilities in captions
- Keep copy concise and store-safe
- Use real UI screenshots only
