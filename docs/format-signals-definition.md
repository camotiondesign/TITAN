# Format-aware success signals

Last updated: 2026-08-18 (spec_version 3)
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

**Everything is a raw count.** No rates, no per-impression denominators.

For Titan's B2B audience, **reach is the outcome, not the denominator**. A still
that reached 7,338 people and pulled 65 reactions did more work than one that
reached 762 and pulled 37 — even though the second has the prettier rate.
Dividing by impressions actively penalises the posts that travelled furthest,
which is backwards for a business trying to get in front of pharmacy owners.

| Format | Signals (raw counts) | Weights |
|---|---|---|
| `single-image` | impressions, reactions | 0.6, 0.4 |
| `multi-image` | impressions, reactions, clicks | 0.5, 0.3, 0.2 |
| `carousel-document` | impressions, clicks | 0.5, 0.5 |
| `video` | impressions, reactions, watch-time seconds (comments when watch time is unavailable) | 0.5, 0.3, 0.2 |
| `short-form-video` | views, shares | 0.6, 0.4 |
| `text` | impressions, reactions, comments | 0.5, 0.3, 0.2 |

Watch time and comments are **separate keys on purpose**. A percentile compares
like with like, so pooling seconds and comment counts under one key would rank
nonsense. Posts with watch time score on watch time; posts without fall back to
comments, and the weights renormalise.

### No decay factor

Deliberately none. Today's newspaper is tomorrow's fish-and-chip wrapper: social
posts settle within about 30 days and then stop moving. The 90-day rolling
cohort already isolates every post to its own generation, so a decay multiplier
would be double-counting the same effect.

### Content roles (orthogonal to format)

Some posts are doing a job the format alone doesn't capture. Roles **add**
components rather than replacing them:

| Role | Added signal | Weight | Derived from |
|---|---|---|---|
| `advocacy` | reposts (count) | 0.3 | `customer_transformation`, `video_testimonial`, `customer_quote_card` |
| `sector-thesis` | reposts (count) | 0.25 | `industry_stance`, `thought_leadership`, `reactive_news` |
| | saves (count) | 0.25 | |
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
verdict. 394 of 482 posts rank inside a 90-day window; 41 are withheld (small cohort or under the volume floor).

**Scoring.** Each component is percentile-ranked within the cohort
independently, then combined by normalised weight. Percentiles are unitless,
which is what lets counts measured in different things — people reached,
seconds watched, clicks — combine without a shared unit.

Percent rank anchors **best in cohort = 100, worst = 0**, using an `(n-1)`
denominator. The naive mid-rank form `(below + 0.5*equal) / n` has a ceiling
that depends on cohort size — the top post scores 96.67 among 15 peers but
98.15 among 27 — which made composites incomparable across cohorts. Under that
form a video that was #1 on *every* signal among its 15 peers ranked below a
weaker post that was #1 among 27. Fixed in spec_version 3.

**Raw ranks.** Alongside the percentiles, every post records its plain
standing in the cohort so the underlying number is always inspectable and no
verdict rests on a composite nobody can check:

```json
"raw_ranks": {
  "impressions": { "rank": 3, "of": 136, "value": 5517 },
  "reactions":   { "rank": 21, "of": 136, "value": 30 }
}
```

**Tier.**

| Tier | Condition |
|---|---|
| `worked` | composite percentile ≥ 75 — top quartile of its own kind |
| `middle` | 25 < p < 75 |
| `underperformed` | composite percentile ≤ 25 |
| `insufficient-data` | cohort smaller than 8, **or** fewer than 100 impressions |

**Volume floor.** A post needs enough delivery for its rate to mean anything.
On 27 impressions a single reaction is a 3.7% reaction rate — good enough to
beat most of its cohort on arithmetic alone, while telling you nothing. Below
`MIN_IMPRESSIONS` (100) the percentile is still recorded and `low_volume: true`
is set, but the tier is withheld. This caught 4 posts that were otherwise
reading as hits on 27–134 impressions.

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
  construction. Current: 97 worked / 276 middle / 68 underperformed / 41
  insufficient. The mild skew toward `middle` is ties in small cohorts sharing
  a midpoint percentile.
- `spec_version` is 3. Rows below that predate a definition change — re-run
  `backfill-signals.js --force` then `compute-format-percentiles.js`.
