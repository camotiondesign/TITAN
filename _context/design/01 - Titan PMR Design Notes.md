# Titan PMR — Design Notes (reusable)

General design + production reference for Titan PMR collateral. Brand-agnostic of any single asset. Read before producing visuals; pair with the project `CLAUDE.md` for the full brand-system rules.

---

## Brand essentials

### Fonts
- **Newake** — display / logo typeface. Tall, heavy, condensed caps. Use for wordmarks, "TITAN", hero headlines, product/card names. Files in `Innovation Day/fonts/NewakeFont-Demo.otf`.
- **SF Pro** (Text + Display) — everything else: body, labels, eyebrows, agenda, details. Files: `fonts/SF-Pro-Text-{Light,Medium,Bold}.otf`.
- After swapping into Newake, re-check letter-spacing — its metrics differ a lot from SF Pro.

### Colour
- **Titan PMR blue gradient (signature):** `#2DA7FF → #2D40FF`. Solid accent `#2D40FF`.
- **Dark mode (default brand):** ground `#000000`; cards `#0C0F14`/`#0F0F0F`; borders `#16243A`/`#1E3354`; soft blue radial glow.
- **White mode:** ground `#FFFFFF`; ink `#0E1A2E`; body `#5A6678`; dim `#8A95A6`; mid `#36425A`. Subtle whitish-blue panel to lift a zone off white: **`#ECF2FC`** (lighter `#F2F6FD`, stronger `#E4ECF9`, hairline `#D8E3F4`).
- Titanverse (separate product) = magenta→violet `#FF65DD → #B752FF` on cosmic black. Don't mix with Titan PMR blue.
- Acid green `#A0FF00` is the **TitanUp event brand only** — never on Titan PMR / Titanverse product work.
- The four-point **sparkle / star** mark belongs to **Titanverse only**. Never put sparkles or scattered stars on Titan PMR work. The Titan PMR logo is the Newake **TITAN** wordmark (with **PMR** in the blue gradient when the full lockup is wanted); a bare **TITAN** wordmark in a single flat colour (ink on light, white on dark) is also valid — no sparkle.

### Voice / rules
- British English. **No em dashes** (use "to", commas, full stops).
- Titan PMR and Titanverse screens carry **no** TitanUp branding (no green, no dot grid, no arrow). Product eyebrows/labels are white, not green.
- Render bracketed placeholders literally (e.g. `[TITLE TBC]`). Never invent titles.
- Bias to minimalism. No filler, no data slop, no AI-slop tropes (gratuitous gradients, emoji, rounded-box-with-left-accent, Inter/Roboto). Ask before adding content.

---

## Format conventions
- Fixed-size canvas, scaled to fit the viewport (letterbox on the ground colour); controls outside the scaled element.
- Common sizes: slides/frames **1920×1080**; social portrait **1080×1350 (4:5)**; story 1080×1920; A-portrait poster ≈ 1080×1528 (A4 ratio).
- Min type: ≥24px on 1920×1080; ≥12pt print; 44px mobile hit targets.
- Decks → `deck_stage.js` starter. Side-by-side options → `design_canvas.jsx`. Variations → Tweaks panel, not N files.

---

## SVG production pipeline (key technique)
For deliverables that must render anywhere (no font installs), produce a **layered SVG** with text either live (master) or **outlined to vector paths** (portable deliverable). Keep two files: an editable **master** (live `<text>` + embedded fonts) and an outlined **deliverable**.

**Critical gotchas learned:**
1. **Never edit a font-embedded SVG with the str_replace tool** — it re-serialises and silently strips the `<style>`/`@font-face` block, breaking the custom font. Always regenerate with `run_script` + raw `saveFile` (raw writes preserve `<style>` + base64).
2. `@font-face` inside an SVG `<style>` does **not** hoist into an HTML doc if the SVG is inlined — but it does apply when the SVG is the root document / rasterised standalone. To preview an SVG's fidelity in the iframe, declare the fonts at document level in a wrapper, or rasterise the standalone SVG.
3. `createCanvas()` in `run_script` returns an **OffscreenCanvas** (no `toDataURL`) — use `convertToBlob()` then FileReader to get a data URI.
4. **opentype.js loads from CDN inside `run_script`** via a dynamically-appended `<script>` tag (fetch is blocked cross-origin, but script tags execute): `https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js`. Then `opentype.parse(arrayBuffer)` and `font.getPath(char, x, baseline, size).toPathData()` per glyph to outline text.

**Outlining maths:** replicate CSS `dominant-baseline:central` with `baseline = cy + ((ascender + descender)/2) * (size / unitsPerEm)`. Handle letter-spacing and text-anchor (start/middle/end) manually by laying glyphs left-to-right and measuring total advance for the anchor offset. Multi-colour runs → one `<path>` per run (so gradient fills map across the whole word, not per glyph).

**Self-contained assets:** embed the custom font (Newake, ~67KB) as base64; reference SF Pro by name (system font on Macs). Embed photos as downscaled JPEG data URIs. Name every group with `id` + `inkscape:label`; leave empty named slots for user assets (`logo-*`, `headshot-*`, `qr`, `ui-screen`).

**Exact-size PNG from HTML** (when the preview pane is smaller than the canvas): capture full-res tiles at `scale(1)` with the stage pinned, then stitch/crop in `run_script` via a canvas. Or just rasterise the finished SVG at 1× or 2×.

---

## Working method
- Explore brand/design-system files first; copy out the fonts/colours/components you need (don't reference cross-project paths in output).
- State the system up front (layouts, type scale, 1–2 background colours) before building.
- Photo-led layouts: grade the image (darken top/bottom, or a navy multiply for dusk) so type sits cleanly; keep one accent colour; lots of air.
- Keep a single source-of-truth generator script for regenerating an asset; iterate by re-running it, not hand-patching output.
