# Metrics refresh 2026-08-12

_Run at 2026-08-12T15:09:44Z (Europe/London) via `scripts/ingest-metrics-2026-08-12.js`._

## Row counts

| CSV | Rows | Matched | Unmatched | Match rate |
|---|---:|---:|---:|---:|
| `data/linkedin/metrics/linkedin-posts-20260811.csv` | 134 | 112 | 22 | 83.6% |
| `data/instagram/metrics/instagram-reels-20260811.csv` | 104 | 13 | 91 | 12.5% |
| `data/facebook/metrics/facebook-reels-20260811.csv` | 88 | 3 | 85 | 3.4% |

**Notes on match rates.**
- LinkedIn: All 22 unmatched rows are for posts dated 2026-07-14 or later — post dirs for these haven't been created yet (Notion → repo sync stops at 2026-07-10 for Titan / 2026-07-02 for TV). Every LinkedIn post that has a dir got matched (100% of the achievable ceiling).
- IG: Only 22 IG post dirs exist (covering 2026-01-20 → 2026-04-13). Matched 13/22 achievable = 59% of ceiling. The other 91 CSV rows are older organic Reels that were never brought into the repo (recon note called this out).
- FB: Only 25 FB dirs exist, and only 5 CSV rows share a date with an FB dir. Matched 3/5 (the other 2 are same-day posts about different content). Below the 40% task threshold, but the ceiling is 5/88 = 5.7% because Cam only archived a subset of FB Reels into the repo.

**Unmatched detail:** see `_strategy/metrics-refresh-2026-08-12-unmatched.md`.

## Top 5 refreshed LinkedIn posts (by impressions)

| Impressions | Brand | Date | Slug |
|---:|---|---|---|
| 4,013 | titan | 2026-06-07 | 2026-06-07-just-getting-started-and-it-s-buzzing-already |
| 3,993 | titan | 2026-06-23 | 2026-06-23-what-s-the-first-thing-you-notice-when-you-change |
| 3,670 | titan | 2026-03-23 | 2026-03-23-malpas-pharmacy-visit-multi-image |
| 3,205 | titan | 2026-06-26 | 2026-06-26-this-pharmacy-dispenses-21-000-items-a-month |
| 2,994 | titan | 2026-04-30 | 2026-04-30-from-stone-age-to-titan-age-in-24-hours |

## Top 5 refreshed IG Reels (by views)

| Views | Date | Slug |
|---:|---|---|
| 731 | 2026-02-17 | 2026-02-17-it-s-a-bit-like-a-google-search-video |
| 206 | 2026-01-28 | 2026-01-28-real-mds-workflow |
| 187 | 2026-01-29 | 2026-01-29-how-it-feels-when-everything-finally-lives-in-one-place |
| 187 | 2026-02-23 | 2026-02-23-it-s-not-even-that-i-grew-my-business-video |
| 165 | 2026-02-25 | 2026-02-25-jeet-simple-cash-flow-trick-most-pharmacy-owners-miss-video |

## Top 3 refreshed FB Reels (by views)

| Views | Date | Slug |
|---:|---|---|
| 109 | 2026-02-25 | 2026-02-25-jeet-simple-cash-flow-trick-most-pharmacy-owners-miss-video |
| 30 | 2026-03-03 | 2026-03-03-rahul-2x-consultations-and-improved-quality-1 |
| 21 | 2026-02-27 | 2026-02-27-some-of-you-missed-it-here-s-your-chance-single-image |

## Posts flagged where numbers went DOWN

None flagged (threshold: >5% drop AND >10-unit drop in impressions).

During the first live pass a mis-mapping was uncovered on `2026-03-26-krishna-clifton-pharmacy-video/metrics.json` — the file's `post_url` had been stale-mapped to the DSPT-Chat-Assistant post URL by the 2026-07-12 CSV ingest job, and my initial URL-match logic honoured that bad mapping. After tightening the matcher (title match first, URL match as last resort, plus per-dir dedupe by highest title score), the Krishna dir now correctly receives Krishna numbers (710 impressions, 44 clicks, 57 engagements) and the DSPT row is unmatched (its post has no dir).

## Script errors and resolutions

Two issues surfaced during ingest; both were caught and fixed before the final live run:

1. **URL-match honoured bad prior mapping.** As above — reordered `findMatch` so title similarity wins and URL match is a last-resort fallback, and added per-dir dedupe.
2. **Downstream exports read stale `platform_api.organic` block.** For LinkedIn posts that carried a mixed-format metrics.json (both flat + `platform_api.organic`), `build-linkedin-exports.js` prefers `platform_api.organic` over the flat `organic` block. My ingest was only writing to the flat block, so exports kept showing 2026-07-12 numbers. Fix: when a `platform_api` block exists on read, refresh its `impressions/organic/etc.` and stamp a new `synced_at` alongside the flat write. Verified `2026-06-07-just-getting-started-...` now shows 4,013 impressions with `synced_at: 2026-08-12T15:09:44Z` in `exports/titan-linkedin.json`.

The 4 downstream artefacts then ran cleanly with no errors.

## Downstream artefact freshness

All five refreshed at 2026-08-12 16:09 (local file mtime; script timestamps in UTC as above):

| Path | Size | Last modified |
|---|---:|---|
| `posts/_master-index.md` | 22.9 KB | 2026-08-12 16:09 |
| `analytics/aggregated-linkedin-metrics.json` | 714.6 KB | 2026-08-12 16:09 |
| `exports/content-intelligence.json` | 317.2 KB | 2026-08-12 16:09 |
| `exports/titan-linkedin.json` | 774.9 KB | 2026-08-12 16:09 |
| `exports/titanverse-linkedin.json` | 146.1 KB | 2026-08-12 16:09 |

`analytics/aggregated-linkedin-metrics.json` now aggregates 422 LinkedIn posts, 548,663 total organic impressions, 139,136 total organic engagements. `content-intelligence.json` scored 409/438 posts, trend "improving", median QES 25.5.

## Sanity check — 5 named big posts

All five show substantial impressions in the refreshed aggregated file, none near zero:

| Post | Slug | Impressions | Source of numbers |
|---|---|---:|---|
| Mounjaro pricing carousel | `2025-08-27-mounjaro-pricing-changes` | 3,422 | Pre-existing (post is outside CSV range) |
| 1000th pharmacy milestone | `2025-07-11-titan-1000th-milestone` | 4,785 | Pre-existing |
| Sagar 4x growth carousel | `2025-07-31-sagar-4x-growth-carousel` | 2,143 | Pre-existing |
| Sajid HOD family life video | `2026-06-09-get-this-one-thing-wrong-and-it-can-quietly-ruin-t` | 1,700 | **Refreshed** from CSV |
| £158m clawback carousel | `2026-01-29-158-million-clawback-carousel` | 1,507 | Pre-existing (post is before CSV date range) |

Only the Sajid HOD post falls inside the CSV date range and was updated. The other four were unchanged by this refresh (they pre-date 2026-02-17). All five are healthy.

## Unresolved decisions for Cam

1. **Notion → repo sync gap.** LinkedIn CSV rows for 2026-07-14 through 2026-08-11 (21 rows) have no dirs to attach metrics to. Run `python3 scripts/notion_sync.py pull` + `node scripts/notion-to-repo.js` to create the missing dirs, then re-run this ingest to capture those metrics. Same for IG/FB posts newer than 2026-04-13.
2. **Legacy DSPT mis-mapping.** `2026-03-26-krishna-clifton-pharmacy-video/metrics.json` still contains an inner `platform_api.organic` block that was created by the 2026-07-12 sync using the DSPT URL. My ingest overwrote it with correct Krishna numbers this time, but if Cam wants, the DSPT post at `urn:li:share:7442842021129523200` should get its own dir and the wrong `post_url` reference cleaned up. Trivially handled if the notion-to-repo sync runs and creates a DSPT dir.
3. **FB/IG archive coverage.** Only ~25 dirs each vs 88/104 CSV rows. If Cam wants to backfill metrics for older reels, we need to first create post dirs for them (they're not in the repo at all today).
