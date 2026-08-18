# Format-aware success signals

Last updated: 2026-08-18
Owner: content ops
Code: `scripts/lib/format-signals.js` (the only place a signal definition may live)

---

## Why there is no engagement rate

A single engagement rate divides every post by the same denominator, so it asks
every post the same question. But formats don't earn the same currency:

- **carousels earn clicks** — someone opened it and went through it
- **videos earn watch time** — someone stayed
- **testimonials earn reactions** — someone felt something
- **advocacy earns reposts** — someone put their own name behind it

Normalising all of that through one fraction doesn't compare posts. It ranks
formats. The retired `engagement_rate` field reliably put document posts on top
because documents generate clicks structurally — which says nothing about
whether anyone cared. One LinkedIn document scored 133% "engagement" on 22
human interactions and 10,132 clicks.

**The replacement question is not "what rate did this get?" but "for a post of
this kind, did this one work?"**

---

## The model

Four things are tagged on every post, in `metrics.json` under `.signals`:

1. **`format`** — what kind of post this is
2. **`measured`** — the primary signal for that format, with raw values
3. **`percentiles`** + **`composite_percentile`** — where it landed against
   posts of the same format on the same platform, in a rolling window
4. **`tier`** — `worked` / `middle` / `underperformed` / `insufficient-data`

A carousel is only ever compared with other carousels. A text post is never
measured against a video.

---

## Format taxonomy

| Format | What it is | Resolved from |
|---|---|---|
| `single-image` | One still | LinkedIn `IMAGE`, IG `FEED_IMAGE`, FB `photo` |
| `multi-image` | Swipeable gallery of stills | LinkedIn `MULTIIMAGE`, IG `FEED_CAROUSEL_ALBUM`, FB `album`, TikTok `PHOTO` |
| `carousel-document` | PDF/document carousel | LinkedIn `DOCUMENT`, `asset_type: carousel` |
| `video` | Feed video, watched in-line | LinkedIn `VIDEO`, FB `video` |
| `short-form-video` | Vertical, algorithmic surface | Anything on TikTok, IG Reels, FB Reels |
| `text` | No visual asset | LinkedIn `TEXT`, FB `link` |

**Short-form is a surface, not a file property.** The same 40-second cut is a
Reel on Instagram and a feed video on LinkedIn, and the two are consumed
completely differently. Anything on a reels/shorts surface is
`short-form-video` regardless of what `asset_type` claims — `asset_type` is
frequently wrong here, labelling reels `single-image` from an older tagging
pass. The one exception is a TikTok photo slideshow, which is genuinely a
swipeable gallery.

`format_source` records how each tag was decided: `platform_type` (the
vendor's own type, authoritative), `asset_type` (repo metadata), or
`inferred:*` for the 21 older posts with no type at all, where format was
derived from a transcript, a non-zero video-view count, the slug, or the
presence of alt text. Audit those with `format_source` if a tier looks wrong.

---

## Primary signal per format

The rationale is the same each time: **what would a person actually do if this
particular kind of post landed?**

| Format | Signal | Weight | Why |
|---|---|---|---|
| `single-image` | reactions / impression | 1.0 | Nothing to click, nothing to watch. Did the image make someone react? |
| `multi-image` | reactions / impression | 0.6 | Baseline response |
| | reposts / impression | 0.4 | A gallery is browsed and passed on |
| `carousel-document` | clicks / impression | 0.7 | Opening it IS the engagement — the same clicks that were meaningless as a global rate are the whole point here |
| | saves / impression | 0.3 | Kept for later (Instagram only) |
| `video` | completion rate, or mean watch seconds | 0.6 | Did they stay? |
| | comments / impression | 0.4 | Did it provoke discussion? |
| `short-form-video` | total views (raw count) | 0.5 | On TikTok/Reels the algorithm decides reach, so how far it travelled IS the outcome, not the denominator |
| | shares / view | 0.5 | Shares are what buy distribution |
| `text` | reactions / impression | 0.5 | No asset to carry it |
| | comments / impression | 0.5 | The words have to earn the reply |

### Content roles (orthogonal to format)

Some posts are doing a job the format alone doesn't capture. Roles **add**
components rather than replacing them:

| Role | Added signal | Weight | Derived from |
|---|---|---|---|
| `advocacy` | reposts / impression | 0.5 | `customer_transformation`, `video_testimonial`, `customer_quote_card` |
| `sector-thesis` | reposts / impression | 0.35 | `industry_stance`, `thought_leadership`, `reactive_news` |
| | saves / impression | 0.35 | |
| `standard` | — | — | everything else |

Roles come from the repo's existing post-type classifier in
`build-content-intelligence.js`, so they use logic that already exists rather
than a new set of guesses. **Override any post manually** in
`analytics/post-roles.json`:

```json
{ "2026-06-17-what-pharmacy-owner-gets-six-weeks-off": "advocacy" }
```

Manual overrides always win and are recorded as `role_source: manual_override`.

### Missing components

A component the platform simply doesn't report (LinkedIn has no saves;
Facebook Reels has no shares column at all) is **dropped and the remaining
weights renormalised**, then listed in `unmeasurable`. It is never counted as
zero — that would silently push the post down for a reason that has nothing to
do with the post.

---

## Percentile and tier

**Cohort** = same platform + same format, published within a rolling window
ending at the post's own publish date. A post is judged against what we were
doing around the same time, which controls for audience growth and algorithm
drift — comparing a June 2026 video against a 2024 video measures the audience,
not the video.

**Window widening.** The window expands `90 → 180 → 365 → all-time` until the
cohort reaches `MIN_COHORT` (8). Below 8, a percentile is noise dressed up as a
rank, so the post is marked `insufficient-data` rather than given a fake
verdict. 472 of 482 posts rank inside a 90-day window; 10 don't rank at all.

**Scoring.** Each component is percentile-ranked within the cohort
independently (mid-rank: ties share the midpoint), then combined by normalised
weight. Percentiles are unitless, which is what lets a raw view count and a
per-impression rate sit in the same score without a shared denominator — the
exact problem that made a single ER impossible.

**Tier.**

| Tier | Condition |
|---|---|
| `worked` | composite percentile ≥ 75 — top quartile of its own kind |
| `middle` | 25 < p < 75 |
| `underperformed` | composite percentile ≤ 25 |
| `insufficient-data` | cohort smaller than 8 |

---

## Adding a new format

1. Add the name to `FORMATS` in `scripts/lib/format-signals.js`.
2. Add its signal components to `SIGNALS` — each with a `value(components)`
   function returning a number or `null`, a `weight`, and a `kind`
   (`'rate'` or `'count'`). Return `null` whenever the platform can't measure
   it so the weight renormalises instead of scoring a zero.
3. Map the platform's type strings to it in `TYPE_MAP` / `ASSET_TYPE_MAP`.
4. Nothing else. Percentiles, tiers and exports pick it up automatically.

## Adding a new platform

1. Add a profile to `PROFILES` in `scripts/ingest-metricool-csv.js`: a
   `detect` predicate keyed on a header column unique to that export, plus a
   `map` returning canonical components. Set `*_available` flags for anything
   the export doesn't carry.
2. Add it to `TARGETS` in `backfill-signals.js`, `DIRS` in
   `compute-format-percentiles.js`, and `PLATFORMS` in
   `build-platform-exports.js`.

---

## Onboarding a new Metricool CSV drop

```bash
# 1. Export from Metricool into a folder (one CSV per platform/format)
# 2. Ingest — profiles auto-detected from headers, no per-drop code needed
node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics --dry-run
node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics

# 3. Tag posts the drop didn't cover
node scripts/backfill-signals.js

# 4. Rank everything (REQUIRED — tiers are null until this runs)
node scripts/compute-format-percentiles.js

# 5. Rebuild exports and indexes
node scripts/build-linkedin-exports.js
node scripts/build-platform-exports.js
node scripts/build-indexes.js
node scripts/aggregate-metrics.js
node scripts/build-content-intelligence.js
```

Always dry-run first. It prints match rates, the format breakdown, and every
impression correction before touching a file.

**Impressions policy:** the ingest raises impressions when a fresh CSV is >20%
higher than what we hold — posts keep accruing after a sync. It never lowers
them: a smaller vendor number is nearly always a reporting-window artefact, and
silently deleting real impressions is unrecoverable. Below the 20% threshold
the stored figure is kept and used as the denominator, so an export's own
numbers always reproduce its own signal values. Every substitution is logged to
`analytics/metricool-ingest-report.json`.

**Match rates below 100% are normal.** The CSVs cover the whole account; the
repo only tracks posts we've archived.

---

## What the retired `engagement_rate` meant

Nothing consistent — that was the bug, on top of the deeper problem that a
single rate is the wrong shape. Depending on which sync last touched a row it
held one of four different things:

- **Metricool-refreshed rows** — `(reactions + comments + shares + clicks) / impressions`,
  the click-inflated vendor number. Source of the 100%+ values.
- **LinkedIn API rows** — LinkedIn's own definition, which folds in clicks differently.
- **notionsocial rows** — `(likes + comments + shares) / views`.
- **Untouched rows** — a stale value against impressions that had since grown.

All four sat in one field under one `source: "linkedin_api"` label, which is
what let the inconsistency hide. The field has been **removed** from per-post
`metrics.json`, from all exports, and from the scaffolds that
`notion-to-repo.js` writes for newly published posts. If you find it in old
code, replace it with `signals.tier` + `signals.composite_percentile`.

---

## Sanity checks

- A `tier` of `worked` means top quartile **of its own format cohort**, not
  top quartile overall. A `worked` text post and a `worked` carousel are not
  the same volume of anything.
- `composite_percentile` is `null` exactly when `tier` is `insufficient-data`.
  Never treat that as zero.
- Roughly 25% of ranked posts should be `worked` and 25% `underperformed` by
  construction. Current: 100 worked / 302 middle / 70 underperformed / 10
  insufficient. The mild skew toward `middle` is ties in low-volume cohorts
  sharing a midpoint percentile.
- `spec_version` is 2. Rows below that predate a definition change — re-run
  `backfill-signals.js --force` then `compute-format-percentiles.js`.
