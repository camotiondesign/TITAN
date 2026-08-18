# Engagement rate — the single definition

Last updated: 2026-08-17
Owner: content ops
Code: `scripts/lib/engagement.js` (the only place a formula may live)

---

## The rule

```
social_er_pct = (reactions + comments + reposts) / impressions × 100
```

That is the number we chart, rank, report and argue about. Same formula, same
denominator, every platform, every post, forever.

**Never create a field called `engagement_rate` again.** That name is what
caused this whole problem: it meant four different things in four places and
nothing in the field name told you which.

---

## The three fields

Every post carries all three. They are not interchangeable.

| Field | What it is | Use it for |
|---|---|---|
| `social_er_pct` | Ours. Human interactions ÷ delivery count. | Everything. Ranking, trends, reporting, deciding what to make more of. |
| `platform_er_pct` | The vendor's own headline rate. Different numerator **and** denominator per platform. | Reconciling against the Metricool dashboard when someone asks "why doesn't this match". Nothing else. |
| `raw_er_pct` | Whatever the deprecated `engagement_rate` held before the 2026-08-17 migration. | Audit trail. Never chart it. |

They live in `metrics.json` under `.engagement`, and are flattened into
`metrics.social_er_pct` etc. in the JSON exports.

---

## Why clicks are excluded

Because they are consumption, not interaction, and they wreck comparability.

A click means someone tapped a link preview, opened a document, or swiped a
carousel. It says nothing about whether the content landed. Worse, click volume
is a property of the *format*, not the content: documents and multi-image posts
generate clicks structurally, videos and text posts don't.

Real numbers from this repo:

| Post | Reactions+Comments+Shares | Clicks | Impressions | social_er | platform_er |
|---|---|---|---|---|---|
| 2026-06-07 "just getting started" | 73 | 10,132 | 7,325 | **1.00%** | 139.30% |
| 2026-06-09 "get this one thing wrong" | 29 | 4,382 | 2,945 | **0.98%** | 149.78% |
| 2026-05-17 "dispensing for care homes" | 27 | 50 | 960 | **2.81%** | 8.02% |

The vendor's number exceeded 100% on 20+ posts, and topped out at 160%. A rate
that can exceed 100% is not a rate. Meanwhile the first two posts look like
runaway winners on `platform_er_pct` and are actually **below median** on
`social_er_pct` (Titan PMR median: 1.86%).

Ranking by the old field was ranking by "how many links did this post contain".

---

## Why impressions, not reach

`social_er_pct` divides by the delivery count — impressions on LinkedIn and
Facebook, views on Instagram and TikTok.

Reach (unique people) would be the purer denominator. We can't use it:
**Metricool exposes no reach for LinkedIn or TikTok.** A metric that only exists
on half our platforms is not a cross-platform metric.

This is also why `platform_er_pct` runs structurally higher than `social_er_pct`
even before clicks: Instagram and Facebook divide by reach, which is always
smaller than impressions.

---

## Per-platform reference

The **numerator of `social_er_pct` is identical everywhere** — reactions +
comments + reposts. That is deliberate and must not be varied. Only the
denominator name changes.

| Platform | Reactions | Reposts | Denominator | Vendor's own formula (`platform_er_pct`) |
|---|---|---|---|---|
| LinkedIn | Reactions | Shares | Impressions | (reactions + comments + shares + **clicks**) / impressions |
| Instagram | Likes | Shares + Reposts | Views | interactions (incl. **saves**) / **reach** |
| Facebook | Reactions | Shared | Impressions (Organic) | (reactions + comments + shares + **clicks**) / **reach** |
| TikTok | Likes | Shares | Views | (likes + comments + shares) / views |

All four vendor formulas were verified against the 2026-08-16 CSV drop and
reproduce Metricool's `Engagement` column exactly (LinkedIn 136/136,
IG posts 48/48, IG reels 107/107, FB posts 99/99).

### Saves (Instagram only)

Saves are captured in `engagement.components.saves` and **excluded** from
`social_er_pct`. A save is a real signal — arguably Instagram's strongest — but
no other platform has an equivalent, so counting it would make Instagram
structurally un-comparable. Report saves separately when they matter.

### Facebook Reels

The Metricool reels export has **no shares column at all**. Those rows carry
`flags: ["reposts_unavailable_in_source"]` and their `social_er_pct` is a
**floor, not a measurement**. Don't compare FB reels against FB posts without
saying so.

---

## Adding a new platform

1. Add an entry to `SPECS` in `scripts/lib/engagement.js`. Keep `social` as
   `['reactions','comments','reposts']` — that is the invariant. Set `denomName`
   and describe the vendor's formula in `platformEr`.
2. Add a mapper to `PROFILES` in `scripts/ingest-metricool-csv.js`: a `detect`
   predicate keyed on a header column unique to that export, plus a `map` that
   returns canonical components.
3. List any component the export genuinely omits in `unavailable` so rows get
   flagged rather than silently deflated.
4. Add the platform to `TARGETS` in `scripts/backfill-engagement.js` and to
   `PLATFORMS` in `scripts/build-platform-exports.js`.

No formula may be written anywhere else. If you find arithmetic on engagement
outside `lib/engagement.js`, that is a bug.

---

## Onboarding a new Metricool CSV drop

```bash
# 1. Export from Metricool into a folder (one CSV per platform/format)
# 2. Ingest — profiles are auto-detected from headers
node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics --dry-run
node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics

# 3. Cover posts the drop didn't include
node scripts/backfill-engagement.js

# 4. Rebuild exports and indexes
node scripts/build-linkedin-exports.js
node scripts/build-platform-exports.js
node scripts/build-indexes.js
node scripts/aggregate-metrics.js
node scripts/build-content-intelligence.js
```

Always dry-run first. It prints match rates and every impression correction
before touching a file.

**Impressions policy:** the ingest raises impressions when a fresh CSV is >20%
higher than what we hold — posts keep accruing after a sync. It never lowers
them: a smaller vendor number is nearly always a reporting-window artefact, and
silently deleting real impressions is unrecoverable. Every substitution is
logged to `analytics/metricool-ingest-report.json`.

**Match rates below 100% are normal.** The CSVs cover the whole account; the
repo only tracks posts we've archived. Unmatched rows are listed in the report.

---

## What the deprecated `engagement_rate` meant

Nothing consistent. That was the bug. Depending on which sync last touched a
row it held:

- **Metricool-refreshed rows** — `(reactions + comments + shares + clicks) / impressions`,
  the click-inflated vendor number. This is where the 100%+ values came from.
- **LinkedIn API rows** — LinkedIn's own definition, which also folds in clicks
  but counts them differently.
- **notionsocial rows** — `(likes + comments + shares) / views`, which is
  actually close to `social_er_pct`.
- **Untouched rows** — a stale value from whenever that post was last synced,
  against impressions that had since grown.

All four were stored in one field, under one `source: "linkedin_api"` label,
which is precisely what let the inconsistency hide. Mean gap between the old
field and `social_er_pct` was **−20.11pp** on Titan PMR.

It survives one release as `engagement_rate_DEPRECATED` (exports) and
`engagement_rate` + `engagement_rate_deprecated_note` (per-post metrics.json),
then gets removed. Do not build anything on it.

---

## Sanity checks

- `social_er_pct` above ~15% on a post with meaningful impressions is
  suspicious — check the components.
- `social_er_pct` **cannot** exceed 100%. If it does, the denominator is wrong.
- `null` means no denominator yet (unpublished, or metrics not synced). It is
  **not** zero, and must never be averaged as zero.
- `spec_version` is 1. If a row's `engagement.spec_version` is lower than
  `SPEC_VERSION` in the lib, it predates a formula change — re-run the backfill
  with `--force`.

Current baselines (2026-08-17): Titan PMR median `social_er_pct` **1.86%**,
Titanverse **2.61%**.
