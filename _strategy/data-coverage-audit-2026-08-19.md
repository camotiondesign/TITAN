# Data Coverage Audit — Metricool API vs the per-post repo corpus

Date: 2026-08-19
Scope: what analytics data actually exists, where, and for which date ranges — after the Metricool API sync shipped.
Method: direct queries against the production Neon database (`SyncedPost`, `SyncRun`, `MetricoolBrand`) reconciled against a filesystem scan of `posts/**/metrics.json` in the TITAN repo.
Cost: £0.00 — no LLM calls. All numbers are SQL aggregates or filesystem counts.

---

## 1. Headline — the 24-month assumption is wrong

The working assumption was that Metricool's Advanced plan retains ~24 months, and that the API sync therefore replaced the historical corpus outright. **It does not, and it has not.**

The all-time backfill has already been run. `SyncRun` shows a `trigger: "backfill"` run with `windowFrom: null` (no lower bound — fetch everything) that returned **605 posts total** and created all 605 rows. A second identical backfill and the nightly cron since have added zero new posts. So 605 is not a window artefact or a missed step — it is the entire history Metricool will return for these profiles.

What the API actually holds is **from the date each profile was connected to Metricool**, not a rolling 24-month retention:

| Platform | Metricool history starts | Effective depth |
|---|---|---|
| Facebook | 2025-01-08 | ~19 months (with a gap, see §4) |
| Instagram | 2025-12-18 | ~8 months |
| LinkedIn (both brands) | 2026-02-17 | **~6 months** |
| TikTok | 2026-03-03 | **~5.5 months** |
| YouTube | — | **not connected at all** |

LinkedIn is the brand's primary surface and the API only reaches back six months. **The per-post repo corpus is not legacy — it is the only source of the 2025 LinkedIn baseline**, which is exactly the data any era-over-era or "what changed" analysis depends on.

---

## 2. Reconciliation table

| Brand | Platform | Metricool API range | Repo per-post range | Tier flags | Notes |
|---|---|---|---|---|---|
| Titan PMR | LinkedIn | 2026-02-17 to 2026-08-17 (137) | 2024-12-16 to 2026-07-10 (365) | API 137/137 · repo 344/365 | **API starts late.** Repo is sole source pre-2026-02. Overlap 2026-02→2026-07. |
| Titanverse | LinkedIn | 2026-02-19 to 2026-08-12 (37) | 2025-07-30 to 2026-07-02 (82) | API 37/37 · repo 78/82 | Same late start. Repo covers 2025-07 onward. |
| Titan PMR | Facebook | 2025-01-08 to 2026-08-17 (191) | 2026-01-20 to 2026-04-13 (25) | API 191/191 · repo 25/25 | Deepest API history but **149/191 tier `insufficient-data`** — see §4. |
| Titan PMR | Instagram | 2025-12-18 to 2026-08-17 (156) | 2026-01-20 to 2026-04-13 (22) | API 156/156 · repo 22/22 | API is now the better source. 37/156 insufficient-data. |
| Titan PMR | TikTok | 2026-03-03 to 2026-08-14 (84) | 2026-01-20 to 2026-04-13 (13) | API 84/84 · repo 13/13 | **API starts 2026-03.** Repo holds Jan–Feb 2026 that the API never will. |
| Titan PMR | YouTube | — none — | 2026-01-20 to 2026-04-13 (17) | API 0 · repo **0/17** | Not a Metricool-connected platform. Repo posts carry no signals block. |

**Totals:** Metricool `SyncedPost` = 605 rows across 5 brand×platform buckets. Repo = 524 posts carrying a `metrics.json`, of which 482 have a computed tier.

Note on repo counts: the on-disk `meta.json` uses inconsistent platform casing (`LinkedIn` / `Linkedin` / `linkedin`) and inconsistent brand keys (`titan`, `titanpmr`, and blank). Counts above are normalised — platform lowercased, brand derived from the directory path. Anything reading that corpus programmatically has to normalise the same way or it will silently under-count LinkedIn by roughly two thirds.

---

## 3. Where each date range is actually covered

```
2024-12 ──────── 2025-07 ── 2025-12 ─ 2026-02 ─ 2026-03 ──────── 2026-08
LI Titan  ████████████████████████████████████████████████░░░░░  repo → 2026-07
                                      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  API 2026-02 →
LI Tverse          ██████████████████████████████████░░░░░░░░░░  repo → 2026-07
                                      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  API 2026-02 →
Facebook  ░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  API 2025-01 →
Instagram ░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  API 2025-12 →
TikTok    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  API 2026-03 →
YouTube   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  neither
             █ repo only    ▓ API    ░ no data
```

- **The API is authoritative from 2026-03 onward** on every platform except YouTube.
- **The repo is authoritative before 2026-02** on LinkedIn — the only place the 2025 baseline exists.
- **2026-02 to 2026-07 is genuine overlap** on LinkedIn and can be used to sanity-check the two sources against each other.
- **The repo stops at 2026-07-10** (Titan) / 2026-07-02 (Titanverse) — it is no longer being maintained now the sync exists, so from 2026-07 the API is the only live source.

---

## 4. Gaps and quality flags

**4a. LinkedIn API history starts 2026-02-17 — six months, not 24.**
The single most important finding. Any question of the form "how does 2026 compare to 2025" cannot be answered from Prisma alone today. Flagged because it directly contradicts the plan assumption.

**4b. TikTok API starts 2026-03-03.**
Explicitly asked about, and confirmed: TikTok is the shallowest surface. There are 13 repo posts from 2026-01/02 that the API will never backfill. TikTok month-over-month comparisons only have five full months to work with, and any "vs last year" on TikTok is impossible.

**4c. Facebook is technically deep but analytically thin.**
191 rows back to 2025-01, but **149 of them (78%) tier as `insufficient-data`**. Breakdown from the last sync's `byFormat` stats: `facebook|single-image` 44 of 45 insufficient, `facebook|short-form-video` 62 of 91, `facebook|video` 26 of 36. Facebook has produced exactly **3 `worked` posts in the entire corpus**. Facebook numbers should be shown but not leaned on — the platform is present in the data without being measurable.

**4d. Facebook has a real hole from 2025-02 to 2025-08.**
Monthly counts go 2025-01 (2 posts), then nothing until 2025-09 (10). Either posting genuinely stopped for seven months or the profile was disconnected and reconnected. Worth Cam confirming which, because it changes whether that period is a content gap or a data gap.

**4e. YouTube is in neither system.**
Not connected to Metricool, and the 17 repo YouTube posts have no `signals` block, so they carry no tier. The existing dashboard's YouTube panel reads `data/youtube/channel_summary.json` from the TITAN repo via GitHub — that remains the only YouTube source and it is channel-level, not per-post.

**4f. 21 Titan LinkedIn repo posts and 4 Titanverse have no signals block.**
These are the 0-impression / never-measured posts the caption analysis also skipped. They exist as folders but contribute nothing to any tier calculation.

**4g. Tier flags are cohort-relative, and the two sources ranked different cohorts.**
The repo tiers came from the TITAN-side format-signals run over the repo corpus; the API tiers were computed by `src/lib/format-signals.ts` over the 605 synced posts. A post in the 2026-02→07 overlap can legitimately hold a different tier in each source because it was ranked against a different peer set. They are not contradictory, but they are not interchangeable either — do not mix them in one percentile calculation.

---

## 5. What this means for the dashboard

1. **Live "last 30 / 90 days" work is fine on Prisma alone.** Everything from 2026-03 forward is fully covered by the API on the platforms that matter.
2. **Era comparison (2025 vs 2026) cannot come from `SyncedPost`.** It has to come from the repo corpus. To keep the dashboard on live database queries rather than reading the filesystem (which does not exist on Vercel), the 474-post analysed corpus from `caption-features-vs-tiers-analysis-2026-08-18.md` has been imported into Prisma as a `CorpusPost` table, re-runnable from `features.jsonl`. That is the source for the era-comparison and abandoned-pattern sections.
3. **Do not compute a single blended percentile across both sources** — see §4g.
4. **Facebook should be visible but de-weighted** in any "what's working" ranking, given 78% insufficient-data.
5. **A monthly export of the API data into the repo corpus would close the long-term gap.** Metricool's history is a rolling window anchored on connection date, not an archive; the repo is the only durable record. Right now the repo stopped being written in July 2026, so history is accruing only inside a third party's system. That is worth fixing separately.

---

## 6. Reproducing this audit

- Both sides in one go: `npx tsx --env-file=.env.local scripts/data-coverage-audit.ts` in `titan-dashboard` — API coverage per surface, monthly volume buckets, and the imported corpus counts.
- Repo side: filesystem scan of `posts/**/meta.json` + `metrics.json` with platform casing normalised and brand derived from path.
- Corpus import: `npx tsx --env-file=.env.local scripts/import-corpus.ts` in `titan-dashboard`, reading `TITAN/scripts/analysis-tmp/features.jsonl`.
