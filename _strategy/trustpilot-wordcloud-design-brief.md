# Trustpilot Word Cloud — Design Brief

**For:** a fresh Claude design agent · **From:** Cam Moorcroft · **Date:** 7 Aug 2026

---

## What we're trying to accomplish

A dynamic word cloud that celebrates 400 Titan PMR Trustpilot reviews by letting the language of the reviewers do the work. Each word sized by how often it appears across the corpus. The picture that emerges IS the proof.

Not an infographic. Not a data-viz card. A living, moving cloud of words that feels like the reviews themselves are talking.

## The finding it has to communicate

The reviews are dominated by named people from the Titan implementation team. **Nas** appears 126 times — more than any product, feature, or outcome word. The visual should reflect this truth. Nas is visibly the biggest, most magnetic thing on the canvas.

---

## Non-negotiables

1. **Just the word cloud. No chrome.** No kicker text at the top. No TITAN wordmark in the corner. No footer badge. No "Word size = times mentioned" legend. The cloud IS the piece. If we need context, it lives in the LinkedIn caption, not on the asset.

2. **Bubble sizes must be mathematically proportional to word frequency.** Nas at 126 has to be visibly larger than "amazing" at 36, which has to be visibly larger than "relief" at 5. Use a **square-root scale** on radius so smaller words stay readable but the hierarchy is honest. Set min radius so the smallest word is still legible, and max radius so Nas anchors without swallowing the canvas.

3. **Every bubble contains BOTH the word AND its count.**
   - Word on top, bold, main visual weight
   - Count below the word, roughly 40-50% the size, muted colour/lower opacity
   - Same stat-card treatment on every bubble regardless of size
   - Example: `Nas` big on top, `126` smaller below it

4. **Bubbles must not overlap.** Tight packing preferred over loose scatter. Use d3-force with collision, d3.pack, or any packing algo that guarantees non-overlap.

5. **It has to feel dynamic, not laid-out.** Ways to earn that:
   - **Full-bleed composition** — bubbles fill the entire canvas edge to edge. Some bubbles clip the edges so the cloud feels bigger than what you can see.
   - **Animation is core, not optional** (see below).
   - **Break the grid** — no visible rows, columns, or symmetry. Organic packing, felt rather than measured.
   - **Depth** — subtle scale/opacity variation between bubbles at the "front" and "back" of the cloud so it reads as a 3D-ish mass, not a flat mosaic.
   - **Occasional negative space** — pockets of dark between clusters make the whole thing breathe. Not empty margins, but small gaps within the pack.

## Animation (this is what makes it feel alive)

- **Idle:** every bubble breathes on its own randomised cycle. Subtle scale + drift + rotate a few degrees. Randomised per-bubble delay and duration (5-9 seconds each) so nothing pulses in sync. Reader should feel movement in peripheral vision even while focused on one word.
- **Reveal:** bubbles fade + spring in from scale(0.3) to scale(1) with slight overshoot. Largest first — Nas anchors, then Atique / Nour / Maj / recommend / great, then everything else in ripple. Total ~4 seconds, then idle takes over.
- **Hover (interactive only):** bubble scales up ~15%, neighbours nudge aside via force sim, tooltip optional showing which theme it belongs to.
- **Optional secondary motion:** every ~20 seconds the whole cloud drifts slowly (rotate 5°, translate a few px) as if breathing. Barely perceptible, but keeps it alive if someone leaves the tab open.

## Data source

`/TITAN/analytics/trustpilot-word-frequency.csv` — 80 terms, ranked, tagged by theme.

Filter out anything tagged `other`. Aim for 50-70 meaningful terms in the final composition.

## Layout

- **Canvas:** 4:5 aspect ratio (1080 × 1350 for LinkedIn feed native)
- **No chrome zones** — the whole canvas is bubble area, edge to edge

## Brand

Use Titan PMR's existing brand system — pre-loaded at `/TITAN/_context/design/`. Colour-code by theme so clusters are visually distinguishable, but keep it restrained. Fewer high-contrast colours (avoid heavy black bubbles that pull the eye out of proportion). The people cluster earns the brightest treatment.

## Deliverables

Save under `/TITAN/designs/social/trustpilot-400-cloud/`:

- `titan-trustpilot-cloud.html` — standalone HTML, self-contained, opens in any browser
- `titan-trustpilot-cloud.png` — static export at 1080 × 1350 for LinkedIn feed
- `titan-trustpilot-cloud.mp4` — 15-second loop for social video (this is what makes the animation useful for LinkedIn)

## What NOT to do

- No chrome text on the canvas (no kicker, no wordmark, no footer, no legend)
- No bubbly Wordle-style random scatter
- No linear scaling on radius
- No word without its count inside the bubble
- No visible grid, no obvious symmetry, no centred composition inside a bordered panel
- No hard-sell CTA in the composition

## Reference docs

- `/TITAN/analytics/trustpilot-word-frequency.csv` — the data
- `/TITAN/_context/design/` — brand system
- `/TITAN/_strategy/trustpilot-wordcloud-brief.md` — strategic context

END BRIEF
