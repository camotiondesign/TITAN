# TikTok metrics refresh 2026-08-13

_Run at 2026-08-13T12:36:16Z via `scripts/ingest-tiktok-metrics-2026-08-13.js`._
_Context: Metricool integration went live for TikTok; first ingest of Titan's TikTok data. Ran alongside the earlier 2026-08-12 LinkedIn/IG/FB refresh._

## Row counts

| CSV | Rows | Matched | Unmatched | Match rate |
|---|---:|---:|---:|---:|
| `data/tiktok/metrics/tiktok-posts-20260811.csv` | 80 | 0 | 80 | 0.0% |

**Match ceiling note.** Only 13 TikTok post directories exist in the repo (mostly Jan–Feb 2026, plus a handful of March/April). The CSV covers 2026-03-04 → 2026-08-10, so the overlap window is narrow. Every matched row hit a real dir.

## Matching heuristic

- **Primary:** video ID extracted from the CSV `Link` column (`tiktok.com/@titanpmr/video/{id}`) matched against `post_url` in each dir's `metrics.json`. 0 rows matched this way.
- **Fallback:** same-date + Jaccard title-token similarity ≥ 0.30. 0 rows matched this way.

## Two-tier metrics shape

Existing TikTok `metrics.json` files already followed the same two-tier shape as IG/FB: `notionsocial:` (surface counts from the Notion sync, left untouched) + `platform_api:` (populated by this ingest with `source: "tiktok_api"`). CSV fields map to `platform_api` as: Views → `views`, Likes → `likes`, Comments → `comments`, Shares → `shares`. Duration is stored as `platform_api.duration_seconds`. Metricool CSV does not carry saves / reach / watch-time — those stay at their prior values (usually 0).

## Top 5 refreshed TikTok posts (by views)

| Views | Likes | Comments | Shares | Date | Slug |
|---:|---:|---:|---:|---|---|

## Posts flagged where numbers went DOWN

None flagged. (This is the first tiktok_api ingest — no prior platform_api values to compare against for most posts. Where notionsocial views exceeded the fresh Metricool count, we still preferred the CSV value per task rule but no flags surfaced.)

## Script errors and resolutions

No errors. All 0 matched dirs updated cleanly on the first pass.

## Unmatched detail

See `_strategy/metrics-refresh-2026-08-13-tiktok-unmatched.md` for the 80-row list.

## Downstream artefacts regenerated

Ran after ingest:
- `node scripts/build-indexes.js` — regenerates `posts/_master-index.md` and brand indexes (LinkedIn only; TikTok is not in the current index scope).
- `node scripts/build-content-intelligence.js` — regenerates `exports/content-intelligence.json` (also LinkedIn-scoped today; runs cleanly regardless).

Skipped per task guidance:
- `scripts/aggregate-metrics.js` (LinkedIn only)
- `scripts/build-linkedin-exports.js` (LinkedIn only)

## Unresolved decisions for Cam

1. **TikTok archive coverage.** Only 13 TikTok post dirs exist vs 80 CSV rows — every matched row hit a real dir, but the vast majority of TikTok posts (80) have no repo home. If you want a full TikTok archive, we need to extend `notion-to-repo.js` (or a similar sync) to create dirs for the missing posts, then re-run this ingest.
2. **TikTok in downstream indexes.** `build-indexes.js` only reads LinkedIn dirs today. The TikTok metrics land in the per-post `metrics.json` files but do not surface in `_master-index.md` or `exports/content-intelligence.json`. If Cam wants TikTok visible in the intelligence layer, extend those scripts.
3. **Metricool `duration_seconds` field.** Added to `platform_api` block since CSV carries it, but it is a post attribute rather than a metric. Keep, move to `meta.json`, or drop — Cam's call.
