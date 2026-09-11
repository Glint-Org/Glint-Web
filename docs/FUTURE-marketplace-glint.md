# Future plan: Community marketplace & glint contribution

**Status:** Future work - do **not** implement or integrate in the current release track.  
**Owner:** Glint Web  
**Related today:** `.glint` (`src/utils/projectPack.js`), templates (`public/templates/`), Export / SessionImporter

This document is the product + technical plan for a free community marketplace where designers contribute editable designs and others reuse them as templates or full projects.

---

## 1. Why

Glint already ships a small set of first-party templates. Scaling that only with in-house design does not scale. Professional designers (and power users) should be able to:

1. Build a polished set in the editor  
2. Contribute it once  
3. Appear in a browseable gallery with previews  
4. Let others open it as an editable project **or** start from a clean template recipe  

That becomes a **free marketplace** of community designs - not a paid store in v1.

---

## 2. Non-goals (for this future track)

- Paid listings, revenue share, or Stripe  
- Live “push to GitHub from the browser” without review  
- Replacing first-party `public/templates/*.json` with packs only  
- Building backend auth / accounts unless a later phase requires it  
- Merging Capture `session.json` and `.glint` into one format  

Implementing any of the above early will make the editor and repo messy. Keep shipping templates and glint round-trip as they are until this plan is scheduled.

---

## 3. Core concepts (keep these distinct)

| Concept | What it is | User intent |
|---------|------------|-------------|
| **Template** | Layout recipe JSON (slots, placeholders, canvas). No user screenshots required. | “Start fresh with *my* shots.” |
| **`.glint`** | ZIP project pack: `project.json` + shots + previews + Fabric bitmaps. Editable round-trip. | “Open this exact set / remix it.” |
| **Marketplace listing** | Catalog entry pointing at a template and/or a pack, plus preview + metadata. | “Browse and pick.” |
| **Capture session** | `session.json` + PNGs from Capture/Bridge. Shots only. | Import raw captures - **not** marketplace inventory. |

**Rule:** Marketplace can list both templates and packs. Never treat a pack as a catalog template until it has been **promoted** (shots stripped / placeholders normalized).

---

## 4. Product vision

### 4.1 Surfaces

1. **Home / Marketplace tab** - gallery of community + official listings (filters: store, device, type, author).  
2. **Editor → Export (or Contribute)** - “Contribute your design” entry point (secondary CTA; primary remains Download `.glint` / store ZIP).  
3. **Listing detail** - larger preview strip, description, license, Use template / Open pack.

### 4.2 User journeys

**Contributor**

1. Finish a set in the editor.  
2. Click **Contribute your design**.  
3. Fill metadata (title, description, author credit, store, license).  
4. App builds `.glint` + preview images.  
5. Submission goes to a **review pipeline** (not a silent push to `main`).  
6. After approval, listing appears in the marketplace.

**Consumer**

1. Browse marketplace; see preview strips.  
2. Choose:  
   - **Use as template** → loads layout; empty/placeholder slots for their screenshots.  
   - **Open glint** → full editable restore (current pack import path).  
3. Edit, re-export store ZIP / pack as usual.

### 4.3 Contribute CTA copy (intent)

Something like: *Contribute your design* → explains that the design may be reviewed and published under the chosen license for free reuse. Avoid implying instant publish.

---

## 5. What `.glint` already contains (reuse)

Do not invent a second pack format. Marketplace packs should remain schema-compatible with today’s format (`GLINT_FORMAT`, `schemaVersion: 1`):

```
*.glint  (ZIP)
├── project.json
└── assets/
    ├── shots/frame-N.png       # raw device screenshots
    ├── previews/frame-N.png    # rendered store frames (gallery + View)
    └── fabric/frame-N/*.png    # bitmaps extracted from Fabric JSON
```

`project.json` (today) already carries: app, tagline, store, exportedAt, editor settings, light template meta, per-frame design + fabric.

**Marketplace may extend metadata** (see §7) without breaking parse - additive fields only, bump `schemaVersion` when required.

---

## 6. Repo / catalog layout (proposed)

When work starts, prefer a dedicated tree so first-party templates stay clean:

```
public/
  templates/                 # first-party recipes (unchanged)
  marketplace/               # FUTURE - community catalog
    catalog.json             # index of listings
    listings/
      {listing-id}/
        meta.json            # listing metadata
        preview.jpg          # or strip WebP
        design.glint         # optional full pack
        template.json        # optional promoted recipe
```

Alternatives acceptable at implementation time:

- Host packs on GitHub Releases / CDN and keep only `catalog.json` + previews in-repo.  
- Separate `glint-marketplace` repo if pack binaries bloat Glint-Web.

**Default recommendation:** metadata + previews in-repo; large packs via Release assets or object storage linked from `catalog.json`.

---

## 7. Catalog & listing schema (draft)

### 7.1 `catalog.json`

```json
{
  "format": "glint-marketplace",
  "schemaVersion": 1,
  "updatedAt": "ISO-8601",
  "listings": [
    {
      "id": "community-blink-remix-01",
      "title": "Aurora Phone Set",
      "author": "Jane Designer",
      "authorUrl": "https://…",
      "description": "Short blurb",
      "store": "play/phone",
      "type": "pack",
      "license": "CC-BY-4.0",
      "preview": "/marketplace/listings/community-blink-remix-01/preview.jpg",
      "packUrl": "/marketplace/listings/…/design.glint",
      "templateId": null,
      "official": false,
      "tags": ["play", "gradient", "minimal"],
      "createdAt": "ISO-8601"
    }
  ]
}
```

### 7.2 Listing `type`

| `type` | Meaning | Primary CTA |
|--------|---------|-------------|
| `pack` | Full `.glint` | Open pack |
| `template` | Recipe only (`templateId` or inline `template.json`) | Use template |
| `both` | Promoted recipe + pack available | Prefer template; pack as “Open example” |

### 7.3 License

v1: free reuse only (e.g. MIT / CC-BY-4.0). Reject submissions that claim “all rights reserved” or unclear ownership of brand assets / screenshots.

---

## 8. Contribute pipeline (do not shortcut)

**Wrong:** browser → commit to `main` with a GitHub token.  
**Right:** staged submission + human (or automated) review.

### Phase A - Minimal viable contribute

1. Client builds pack + preview (reuse `buildGlintPackBlob`).  
2. User downloads a **contribution bundle** (pack + `meta.json` draft) **or** uploads via a form to an issue/PR bot.  
3. Maintainer reviews and merges into `marketplace/`.  
4. Catalog regenerates (script or CI).

### Phase B - One-click contribute

1. GitHub App or Cloudflare Worker receives upload.  
2. Opens PR against marketplace tree / release.  
3. CI validates pack schema, preview presence, file size limits, malware scan (zip bomb checks).  
4. Maintainer merges; CDN/catalog updates.

### Phase C - Soft accounts (optional)

- Optional GitHub OAuth for author identity.  
- Still no requirement to log in to *use* free listings.

---

## 9. Promote pack → template

Contribution often starts as a pack (with example screenshots). Official-quality reuse needs a **promotion** step:

1. Strip or replace shots with neutral placeholders.  
2. Normalize text to placeholders (`App Name`, `Tagline`, …).  
3. Emit `public/templates/{id}.json` (or marketplace `template.json`) matching existing template engine schema.  
4. Register in template config / marketplace `type: both`.  
5. Generate static preview strip (existing `gen-template-previews` pattern).

Until promotion exists, marketplace can ship **pack-only** listings safely.

---

## 10. UI plan (when scheduled)

| Area | Work |
|------|------|
| Home | Marketplace section or route; cards with preview, author, store badge, type |
| Export | Secondary **Contribute your design** → metadata wizard → submit/download bundle |
| SessionImporter / Assets | Keep **Open .glint**; optionally “Browse marketplace” deep-link |
| Editor leave warn | Already mentions downloading `.glint`; contribute can reuse same pack build |

Do **not** clutter first viewport of Home with marketplace until the catalog has enough quality listings.

---

## 11. Technical building blocks (reuse vs new)

| Already exists | Still needed |
|----------------|--------------|
| `buildGlintPackBlob` / `parseGlintPack` | `catalog.json` loader + listing detail |
| Pack import in SessionImporter | Contribute wizard UI |
| Template loader + engine | Promote-pack tooling (script OK at first) |
| Template preview strips | Marketplace gallery + filters |
| Export Download `.glint` | Review/PR pipeline + size/license checks |

Prefer scripts and static hosting over a new backend until traffic forces it.

---

## 12. Quality, legal, safety

- Max pack size (e.g. 50-100 MB); reject oversized ZIPs.  
- Require contributor attestation: they own or may share screenshots/branding.  
- Strip EXIF / unexpected executables inside ZIP.  
- Preview must be generated from Glint render, not an arbitrary unrelated image (or clearly labeled).  
- DMCA / takedown process documented in marketplace README.  
- No auto-enable of community templates in `TEMPLATE_ENABLED` without review.

---

## 13. Phased delivery (suggested order)

| Phase | Deliverable | Ship when |
|-------|-------------|-----------|
| **0** | This doc + keep first-party templates + pack round-trip solid | Done (planning only) |
| **1** | Static `marketplace/catalog.json` + a few curated hand-added packs + gallery browse/open | First marketplace MVP |
| **2** | Contribute → download submission bundle + CONTRIBUTING guide for PRs | Low-ops community |
| **3** | Automated PR/upload worker + CI validation | When volume justifies |
| **4** | Promote pack → template tooling + `type: both` | When packs should become starters |
| **5** | Optional OAuth / author profiles / search | Later polish |

Do not jump to Phase 3-5 before Phase 1 has real listings and UX.

---

## 14. Success criteria

- User can browse ≥ N community listings with accurate previews.  
- Opening a pack restores an editable project (parity with today’s import).  
- Using a promoted template behaves like first-party templates.  
- Contribute path never writes to `main` without review.  
- First-party template workflow remains unchanged and uncluttered.

---

## 15. Explicit deferral

Until this plan is scheduled as a project:

- No marketplace routes, catalog, or Contribute button.  
- No GitHub App / Worker for uploads.  
- No changes to `projectPack` schema for marketplace fields unless needed for an unrelated bugfix.  
- Continue adding first-party templates via `public/templates/` as today.

When work begins, treat this file as the source of truth and update **Status** at the top to `In progress` / `Shipped` per phase.
