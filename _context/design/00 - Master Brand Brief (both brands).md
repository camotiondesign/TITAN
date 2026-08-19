# Titanup 26 — Project Brief & Brand System

This file is the persistent brief for the **Titanup 26** event collateral. Read it before producing anything. It captures the brand system, the rules, the output spec, and the open decisions so any session starts with full context.

---

## What this project is

Screen and print collateral for **Titanup 26** — a pharmacy industry event by Titan PMR Ltd, held **7 June 2026 in Birmingham**. The headline deliverable is a pack of **1920×1080 layered SVG frames** built to drop into **After Effects** for animation.

There are three related brands in play:
- **TitanUp 26** — the parent *event* brand (acid green on black, dot grid, arrow mark)
- **Titan PMR** — the dispensary product (Titan blue)
- **Titanverse** — the clinical/services platform product (cosmic magenta)

---

## Brand systems

### TitanUp 26 (event brand)
- **Background**: pure black `#000000`
- **Primary accent**: acid green `#A0FF00`
- **Secondary green** (gradient pair / glow): pastel `#CDFD7C`
- **Dot grid**: `#282828` dots, 10px circle on a 20px pitch, edge to edge
- **Atmosphere**: soft radial green glow, usually bottom-right
- **Marks**: the `↗` arrow icon (green, 45°) is the core symbol. Event lockup is `↗ TITAN UP [26 badge]` — arrow + wordmark + a rounded-square "26" badge with a thin white stroke.
- **Card pattern**: rounded cards (`#0F0F0F` fill) with a subtle white 5%→0% diagonal sheen gradient. Active/"now" state = green outline + green title.
- **Voice**: directional, command-form. "Titan Up Your Pharmacy", "This Way Up".

### Titan PMR (dispensary product — Layer 02)
- **Gradient**: Titan blue `#2DA7FF` → `#2D40FF`
- Used the same way Titanverse uses magenta: product accent, highlighted stack bar, icon-slot strokes, wordmark second word.
- Wordmark: sparkle + `TITAN` (white) + `PMR` (blue gradient).

### Titanverse (services platform — Layer 03)
- **Background**: cosmic black, deep-purple radial glow centred low (`#1A0628` core → `#02010A` edge)
- **Gradient**: magenta `#FF65DD` → violet `#B752FF` (this is the canonical Titanverse gradient — CMYK-safe RGB values)
- **Marks**: four-point **sparkle** ✦ (gradient fill). Wordmark: sparkle + `TITAN` (white) + `VERSE` (magenta gradient).
- **Texture**: scattered faint white stars (occasional magenta star), soft magenta nebula glow top-left. NO dot grid.
- **Imagery**: floating rock/asteroid PNGs in `assets/titanverse/` (rock-1.png, rock-2.png).
- **Two-tone heading style**: one word white, the key word in the magenta→purple gradient. This is the signature Titanverse headline treatment.

---

## CRITICAL RULES

1. **Titan PMR and Titanverse screens carry NO TitanUp branding.** No green `↗` lockup, no `26` badge, no corner arrow, no acid green, no dot grid. They stand alone in their own product identity.
2. On those product screens, **labels/eyebrows are WHITE, not green** (green is a TitanUp-only colour).
3. **No dot grid** on Titan PMR or Titanverse screens — stars (Titanverse) or plain glow (Titan PMR) instead.
4. Acid green `#A0FF00` belongs to the **event brand only**.
5. **British English. No em dashes.** Use "to" or commas or full stops instead.
6. Render bracketed placeholders **literally** (e.g. `[TITLE TBC]`). Never invent titles. Specifically: Sajid Ramzan's title is `[TITLE TBC — DO NOT GUESS]`. Never write "Chief Food Officer".
7. Do not style external speakers as Titan staff.

---

## Fonts

- **Newake** (`assets/fonts/NewakeFont-Demo.otf`) — the LOGO typeface. Tall, condensed, heavy display caps. Used for ALL wordmarks/logos: `TITAN UP`, `TITAN UP 26`, `TITANVERSE`, `TITAN PMR`, product card names, hero wordmarks. It is embedded as a base64 data-URI in each SVG so it previews in-browser and in Figma. For After Effects, install Newake on the machine and the live text resolves automatically.
- **SF Pro** (Display + Text) — everything else: headlines, body, labels, agenda, etc.
- When applying Newake, the heavy metrics differ from SF Pro — check letter-spacing after swapping.

---

## Output spec (After Effects)

Every deliverable frame is:
- **1920×1080 exact**, landscape
- **Layered SVG**, root canvas transparent (hide `Background` layer for alpha export)
- **Every element on its own named group** (`id` + `inkscape:label`) so it maps 1:1 to an AE layer for stagger animation
- **All text live and editable** `<text>` — never outlined/baked
- **All graphics vector** — no flattened raster effects
- **Empty named slots** for user-supplied assets, following this convention:
  - `headshot-1` … `headshot-N` (speaker photos, circle-masked)
  - `logo-1` … `logo-N` (exhibitor/sponsor logos)
  - `qr` (QR codes — always inside a high-contrast white quiet-zone card)
  - `icon-titan-*` / `icon-titanverse-*` (product icon glyphs)
  - `ui-screen` (product screenshot drop zone)
- Canonical SVG: explicit closing tags, double-quoted attributes.

---

## The four-layer stack (product architecture)

Shown as a right-rail indicator on product frames and as a full diagram on the overview frame. Top to bottom:
1. **Layer 01 — Destination** (sub: Strategy) — *positioning frame; naming UNCONFIRMED, may not be a real product*
2. **Layer 02 — Dispensary** (sub: Titan PMR) — blue
3. **Layer 03 — Services Platform** (sub: Titanverse) — magenta *(was "Clinical Platform", widened because Titanverse > clinical)*
4. **Layer 04 — Shopfront** (sub: PharmAppy) — *PharmAppy framing pending Rhys's sign-off*

**Layer 02 (Titan PMR) content:** FIVE APPS (TITAN AI, Repeat, Batch, Mail, Mobile) + ELEVEN TOOLS (CD register, Intervention log, RP log, Stock Control, Patient Insights, Campaigns, eMARs, Dispensing Robots, MDS robots, Collection Machines, Group Ordering app).

**Layer 03 (Titanverse) content:** SEVEN APPS (NMS, Patient Activation, Ambient Transcription, AI Agents, Smart Booking, Documentation Templates, Titanverse Mobile [COMING badge]) + FOUR CONTROLS (Force Dispensing, Hold-back Claims, Specials & Concessions, Claims Management).

---

## The frame pack (in `svg/`, surfaced via `index.html`)

| # | File | Frame |
|---|---|---|
| 01 | `01-welcome.svg` | Welcome hero — "TITAN UP 26", 7 JUNE 2026, BIRMINGHAM |
| 02 | `02-speaker-wall.svg` | 10 speakers, 5×2, headshot slots |
| 03 | `03-sponsor-wall.svg` | 20 exhibitors, 5×4, logo slots + stand pills |
| 04 | `04-agenda.svg` | Full day, lunch highlighted, names only |
| 05 | `05-stack-1-destination.svg` | Layer 01 (TitanUp green) |
| 06 | `06-stack-2-dispensary.svg` | Layer 02 — Titan PMR (blue, no green/dots) |
| 07 | `07-stack-3-clinical.svg` | Layer 03 — Titanverse Services Platform (magenta) |
| 08 | `08-stack-4-shopfront.svg` | Layer 04 — PharmAppy |
| 09 | `09-stack-5-overview.svg` | Full stack overview |
| 10 | `10-qr-titanverse.svg` | Titanverse register-interest QR (magenta, no TitanUp) |
| 11 | `11-qr-questions.svg` | "Your questions. On stage." — evergreen, centred. Send questions via titanup.club (TitanUp green). No session specifics, no editable fields. *(Replaced the old selfie competition slide.)* |
| 12 | `12-bumper-1-hero-arrow.svg` | Brand bumper |
| 13 | `13-bumper-2-wordmark.svg` | Brand bumper |
| 14 | `14-bumper-3-arrow-pattern.svg` | Brand bumper |
| 15 | `15-titanverse-hero.svg` | Titanverse website-style hero |
| 16 | `16-advert-titanverse.svg` | Titanverse foyer advert (left text + `ui-screen` slot) |
| 17 | `17-advert-titan.svg` | Titan foyer advert (4-layer stack diagram) |

The agenda (names only — no titles, so the Sajid title issue can't surface). Speaker wall preserves bracketed TBC placeholders literally.

---

## Event facts

- **Date**: 7 June 2026
- **Location**: Birmingham
- **Host**: Titan PMR Ltd
- **Single stage** (no room labels on agenda)
- **Lunch**: 12:30–14:00, highlighted block

### Speakers
1. Tariq Muhammad — CEO, Titan PMR Ltd
2. Wahid Muhammad — CTO, Titan PMR Ltd
3. Hooman Ghalamkari — COO, Titan PMR Ltd
4. Jeff — Panellist, Titan PMR Ltd
5. Rhys Lloyd — Founder, PharmAppy *(external)*
6. Ghulam Haydar — Director for Governance & Compliance, Allied Health Training *(external)*
7. Rahul Puri — Pharmacy Owner, Puri Pharmacy *(external)*
8. Michael Holden — [TITLE TBC], [COMPANY TBC]
9. Victoria Steele — [TITLE TBC], [COMPANY TBC]
10. Sajid Ramzan — [TITLE TBC — DO NOT GUESS], Titan PMR Ltd

### Exhibitors (by stand; note no stand 17)
1 DemDx · 2 EMT · 3 Perfume Shark · 4 Clear Clinics · 5 Allied Health Training · 6 Cyberseigen · 7 Healthcare Plus Consulting · 8 PharmDel · 9 Drug Comparison · 10 EXPOS RX · 11 KP Pharma Health · 12 Health Point TV · 13 Skills4Pharmacy · 14 Prereg Shortcut · 15 MH Associates · 16 The Sublime Group · 18 Camascope · 19 IPCN · 20 PharmAppy · 21 Meditech

---

## Assets on disk

- `assets/fonts/NewakeFont-Demo.otf` — logo font
- `assets/titanverse/rock-1.png`, `rock-2.png` — cosmic asteroid imagery
- `uploads/` — original source: Arrow.svg, Event Lock up.svg, Titanverse Logo.svg, exhibitor logos (white-* and black-*), speaker/programme reference screens

---

## Open decisions (NOT yet actioned — confirm before changing)

1. **Layer 01 naming** — "Destination / Strategy": real product or positioning frame? Currently kept as-is.
2. **PharmAppy as Layer 04** — pending Rhys Lloyd's sign-off.
3. **TitanUp 26 badge on Titanverse frames** — currently removed (treated as generic Titanverse assets). If Layer 03 is specifically Wahid's event keynote slide, the badge should be restored to anchor it to the event. Decision pending.
4. **Icon glyphs** — all `icon-*` slots are still empty dashed drop-zones awaiting real SVG icons.

---

## Working notes

- The pack is delivered as loose SVGs (download the `svg/` folder, drag all into Figma in one go — each lands as an editable frame). There is no live Figma/AE connector available from this environment.
- When revising a frame, keep the named-group + named-slot structure intact.
- Prefer regenerating frames via script (consistent IDs/labels) over hand-editing geometry.
