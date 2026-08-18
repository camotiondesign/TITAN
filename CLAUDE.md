# TITAN Content Repo -- Claude Quick Reference

Last updated: 2026-02-12
Daily Notion sync: 7am GMT via GitHub Actions

---

## Where Things Are

### Strategy & Planning
| What | Path | Notes |
|------|------|-------|
| Monthly content formula | `content-formula.md` | **READ WHEN PLANNING.** 12 post types, tiered by performance, monthly templates for both brands, rotation rules, format mix targets. The source of truth for calendar structure. |
| Caption voice guide | `voice-guide.md` | **READ WHEN WRITING.** Golden era voice analysis: sentence rhythm, tone, vocabulary, emoji rules, CTA patterns, beat sequences, retention moves, signature moves, anti-patterns, pre-publish voice check. Every caption must pass this. |
| Brand positioning | `strategy/positioning.md` | Ecosystem narrative, Titan PMR positioning, Titanverse positioning, content framing questions. |
| Writing influences | `strategy/writing-influences.md` | The three frameworks: Atkins (structure), Hasan (persuasion), Ranganathan (voice). Read for the WHY behind the voice guide. |
| Anti-AI writing | `strategy/anti-ai-writing.md` | 13 categories of AI writing tells with phrase audit list. Run captions through this before publishing. |
| Visual strategy | `strategy/visual-strategy.md` | Design rules, campaign visual worlds, carousel structure. |
| Motion design guide | `strategy/motion-design.md` | Four layers (Idea, Structure, Design, Motion), storytelling techniques, failure modes, review questions. Essential for design briefs. |
| Competitor audit | `analytics/competitor-social-audit.md` | ClickUp/Semrush/Hootsuite + UK pharmacy competitor analysis |
| Pre-publish scorer | `scripts/score-post.js` | Score posts 0-50 before publishing (HOOK/HUMAN/SPECIFICITY/STAKES/FORMAT FIT) |
| Pharmacy news scan | `scripts/pharmacy-news-scan.py` | Weekly Monday scan of UK pharmacy RSS feeds for reactive post ideas |

### Data (read often)
| What | Path | Notes |
|------|------|-------|
| Notion DB snapshot | `data/notion/notion_export.json` | Full database, refreshed daily 7am GMT. 3MB+, don't read the whole file. Query Notion MCP instead for live data. Use this for bulk analysis only. |
| Notion DB schema | `data/notion/notion_schema.json` | Property names and types. Read this first if you need to query Notion. |
| LinkedIn metrics | `data/linkedin/metrics/` | Performance data from LinkedIn pages |
| YouTube metrics | `data/youtube/metrics/` | YouTube analytics |
| TikTok metrics | `data/tiktok/metrics/` | TikTok analytics |
| Instagram metrics | `data/instagram/metrics/` | Instagram analytics |
| Facebook metrics | `data/facebook/metrics/` | Facebook analytics |
| Aggregated LinkedIn metrics | `analytics/aggregated-linkedin-metrics.json` | Post-level metrics; prefer `posts/_master-index.md` for overview. Generated weekly by `scripts/aggregate-metrics.js`. |

### Exports (for ChatGPT / Claude chat upload)
| What | Path | Notes |
|------|------|-------|
| Titan PMR LinkedIn export | `exports/titan-linkedin.json` | All 274 Titan posts: caption, alt-text, transcript, comments, organic-only metrics. ~622KB. Upload to ChatGPT/Claude chat for analysis. |
| Titanverse LinkedIn export | `exports/titanverse-linkedin.json` | All 50 Titanverse posts, same format. ~100KB. |
| Transcript gold extracts | `exports/transcript-extracts.json` | 312 curated quotes, stats, soundbites, pain points from all 52 interview transcripts. 10 categories, 50 speakers, with topic/feature tags. ~317KB. Upload to ChatGPT/Claude chat for content ideation. |
| Content intelligence | `exports/content-intelligence.json` | **THE FEEDBACK LOOP.** Every post classified by formula type, scored with QES, analysed by cohort (type/format/customer/month/trend), with formula compliance checks and actionable recommendations. ~237KB. Regenerate after metrics update. |
| Titanverse knowledge base | `exports/titanverse-knowledge.json` | All 108 Titanverse help centre articles scraped from intercom-help.eu. 13 sections (Getting Started, NMS, Clinical Checks, Consultations, Patient Records, Calendar, Documents, Settings, FAQs, Release Notes, Partners, Billing, etc). ~127KB. Upload to ChatGPT/Claude chat for product Q&A, feature explanations, content ideation. |
| Instagram export | `exports/titan-instagram.json` | All Instagram posts, same shape as the LinkedIn exports, with format + tier fields. |
| Facebook export | `exports/titan-facebook.json` | All Facebook posts, same shape. |
| TikTok export | `exports/titan-tiktok.json` | All TikTok posts, same shape. |

Regenerate LinkedIn exports: `node scripts/build-linkedin-exports.js`
Regenerate IG/FB/TikTok exports: `node scripts/build-platform-exports.js`
Regenerate content intelligence: `node scripts/build-content-intelligence.js`
Regenerate transcript extracts: Re-run extraction agents (requires Claude — NLU, not scripted). See `scripts/merge-transcript-extracts.js` for the merge step.

---

## Post Performance — READ BEFORE CALLING ANY POST GOOD OR BAD

Full spec: **`docs/format-signals-definition.md`**. Definitions live in exactly
one place: `scripts/lib/format-signals.js`.

**There is no engagement rate. Do not compute one, do not ask for one.**
`engagement_rate` has been removed from every file. One rate over one
denominator ranks formats, not posts — carousels earn clicks, videos earn watch
time, testimonials earn reactions, advocacy earns reposts. The old field put
document posts on top every time because documents generate clicks
structurally; one scored 133% on 22 human interactions and 10,132 clicks.

**The question is "for a post of this kind, did this one work?"**

Every post carries `signals` (per-post `metrics.json`) / flattened fields
(exports):

| Field | Meaning |
|---|---|
| `format` | single-image / multi-image / carousel-document / video / short-form-video / text |
| `content_role` | advocacy / sector-thesis / standard — adds reposts/saves as first-class signals |
| `primary_signal` | the components that mean "worked" for THAT format, with raw values + percentiles |
| `composite_percentile` | 0–100 vs same format, same platform, rolling window |
| `tier` | **`worked`** (top 25%) / `middle` / **`underperformed`** (bottom 25%) / `insufficient-data` |

Rules:
- Quote `tier` and `composite_percentile`. Never invent a cross-format rate.
- `worked` means top quartile **of its own format** — a `worked` text post and a
  `worked` carousel are not the same volume of anything.
- `insufficient-data` means the cohort was under 8 posts. Not zero, not bad.
- Ranking posts across different formats by any raw number is the exact mistake
  this model exists to prevent. Compare percentiles, or compare within a format.
- Baseline (2026-08-18): 100 worked / 302 middle / 70 underperformed / 10 insufficient.

**New Metricool CSV drop** (Cam drops them in `~/Downloads/Metrics/`) — profiles
are auto-detected from CSV headers, so no new code is needed per drop:

```bash
node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics --dry-run   # always first
node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics
node scripts/backfill-signals.js             # posts the drop didn't cover
node scripts/compute-format-percentiles.js   # REQUIRED — tiers are null until this runs
node scripts/build-linkedin-exports.js && node scripts/build-platform-exports.js
node scripts/build-indexes.js && node scripts/aggregate-metrics.js && node scripts/build-content-intelligence.js
```

Ingest raises impressions when a fresh CSV is >20% higher (posts keep accruing);
it never lowers them. Every change is logged to `analytics/metricool-ingest-report.json`.
Adding a format or platform: follow the checklists in `docs/format-signals-definition.md`.
Override a post's content role in `analytics/post-roles.json`.

### Posts (archived published content)
| Path | What's in it |
|------|-------------|
| `posts/_master-index.md` | **READ THIS FIRST** -- Cross-brand summary, top performers, recent posts. One file = full picture. |
| `posts/linkedin/titan/published/_index.md` | Titan PMR index -- all 222 posts with metrics and caption previews |
| `posts/linkedin/titanverse/published/_index.md` | Titanverse index -- all 42 posts with metrics and caption previews |
| `posts/linkedin/titan/published/` | 222 published Titan PMR LinkedIn posts (individual dirs with caption.md, meta.json, metrics.json) |
| `posts/linkedin/titan/_drafts/` | Draft concepts and curriculum (not published) |
| `posts/linkedin/titanverse/published/` | 42 published Titanverse LinkedIn posts |
| `posts/tiktok/published/` | TikTok posts (shared account, no brand split) |
| `posts/youtube/shorts/published/` | YouTube Shorts |
| `posts/youtube/longform/published/` | YouTube long-form videos |
| `posts/instagram/published/` | Instagram posts (shared account) |
| `posts/facebook/published/` | Facebook posts (shared account) |
| `posts/blog/published/` | Blog articles |

**Key rule:** LinkedIn is the ONLY platform with separate titan/ and titanverse/ folders. Every other platform is a shared account.

**For Claude:** Don't browse individual post directories. Read the `_index.md` files instead -- they aggregate all post data (metrics, captions, types) into a single readable file. Run `node scripts/build-indexes.js` to regenerate.

**Post files:** Each post dir can have `caption.md`, `meta.json`, `metrics.json`, `alt-text.md`, `comments.md`. For **video posts**, put the full spoken transcript in `transcript.md` and keep `alt-text.md` for the visual/accessibility description only (what’s on screen, who’s speaking, summary of the message). Don’t embed long transcripts in alt text.

### Designs (After Effects .jsx files)
| Path | What's in it |
|------|-------------|
| `designs/linkedin/titan/` | Titan PMR LinkedIn post designs |
| `designs/linkedin/titanverse/` | Titanverse LinkedIn post designs |
| `designs/tiktok/` | TikTok designs (1080x1920, shared) |
| `designs/youtube/thumbnails/` | YouTube thumbnail designs (1280x720) |
| `designs/youtube/end-cards/` | YouTube end screen designs |
| `designs/instagram/` | Instagram designs (shared) |
| `designs/facebook/` | Facebook designs (shared) |
| `designs/_templates/` | Reusable base templates |

**Naming:** Files match their Notion post name. `TITAN_PostName.jsx`, `TV_PostName.jsx`, `TT_PostName.jsx`, `YT_Title_thumb.jsx`, `IG_PostName.jsx`

**Workflow:** Claude creates .jsx, pushes to the right folder, adds the GitHub raw URL to the Notion post's "Design File" property. Cam pulls it into After Effects.

### Raw interviews
| Path | What's in it |
|------|-------------|
| `_interviews-raw/titan/case-studies/raw/` | Titan PMR customer interview transcripts |
| `_interviews-raw/titan/leadership/raw/` | Leadership interview transcripts |
| `_interviews-raw/titanverse/case-studies/raw/` | Titanverse customer interview transcripts |

These are source material. Never edit them. The titan/titanverse split here is about product focus, not publishing platform.

---

## Notion Database Reference

| Property | Value |
|----------|-------|
| Database name | Titan Social Media Database |
| Database ID | `157f423bea8b8149b546e7279b4ea0c0` |
| Data Source ID | `157f423b-ea8b-8138-9844-000badd54012` |

### Key properties for creating posts
| Property | Example value | Notes |
|----------|--------------|-------|
| Name | `TITAN_PostName` or `TV_PostName` | Prefix determines brand |
| Post Status | `Concept for Review` | Always use this for new posts |
| Content Type | `Single Image`, `Carousel Post`, `Video` | Match to format |
| Platforms | `LI-PAGE@titanpmr` or `LI-PAGE@titanverse` | LinkedIn brand pages |
| Time | `2026-02-12` | Date only, no time |
| Campaign | `TitanUp 2026` | If applicable |
| Phase | `SEED`, `BUILD`, `CONVERT`, `FINAL PUSH` | TitanUp posts only |
| Post Caption | Full caption text | Use real line breaks |
| Idea | Design brief | 500+ chars for carousels |

### Platform tags for Notion
| Platform | Tag |
|----------|-----|
| LinkedIn (Titan PMR) | `LI-PAGE@titanpmr` |
| LinkedIn (Titanverse) | `LI-PAGE@titanverse` |
| TikTok | `TT@titan` |
| YouTube | `YT@titan` |
| Instagram | `IG@titan` |
| Facebook | `FB@titan` |
| Blog | `BLOG@titan` |

---

## Live Automation (scripts that run on schedule)

| Script | What it does | Schedule | Workflow file |
|--------|-------------|----------|--------------|
| `scripts/notion_sync.py pull` | Pulls full Notion DB to `data/notion/notion_export.json` | Daily 6am UTC | `.github/workflows/notion-sync.yml` |
| `scripts/notion-to-repo.js` | Creates post directories from published Notion posts (caption, meta, metrics pending, alt-text) | Daily 7am UTC | `.github/workflows/notion-to-repo.yml` |
| `scripts/youtube_sync.py` | Pulls YouTube analytics to `data/youtube/` | Scheduled | `.github/workflows/youtube-sync.yml` |
| `scripts/aggregate-metrics.js` | Aggregates LinkedIn performance metrics | Weekly | `.github/workflows/aggregate-metrics.yml` |

## Useful Manual Scripts

| Script | What it does | When to use |
|--------|-------------|-------------|
| `scripts/build-indexes.js` | Regenerates `_index.md` files from published posts | After new posts are added or metrics updated |
| `scripts/notion-to-repo.js --dry-run` | Preview what Notion posts would sync to repo | Before running a live sync |
| `scripts/notion-to-repo.js --since 7` | Sync only posts published in last 7 days | Quick sync of recent posts |
| `scripts/notion_sync.py discover` | Shows Notion DB schema and property types | When you need to check property names before querying |
| `scripts/notion_sync.py push FILE` | Pushes a schedule JSON file to Notion | Bulk post creation |
| `scripts/calculate-tcps.py` | Calculates TCPS scores from metrics | Performance analysis |
| `scripts/campaign_audit.py` | Audits content against strategy rules | Checking rotation, gaps |
| `scripts/build-linkedin-exports.js` | Builds JSON exports for ChatGPT/Claude chat (organic metrics only) | After new posts published or metrics updated |
| `scripts/build-content-intelligence.js` | Classifies posts, scores QES, runs cohort analysis, generates recommendations | After metrics updated — the feedback loop |

## Scripts (lean set)

The only scripts in active use are those in the tables above (Notion sync, notion-to-repo, build-indexes, aggregate-metrics, youtube_sync, calculate-tcps, campaign_audit). Anything else in `scripts/` (e.g. `ae/`, design .jsx) is design or one-off; don't rely on it for automation.

---

## What Claude Should Do at the Start of Each Conversation

1. Read this file (`CLAUDE.md`) -- one tool call, full orientation
2. If Cam asks about published content performance: read `posts/_master-index.md` (one file, full summary)
3. If Cam asks about a specific brand's posts: read `posts/linkedin/[brand]/published/_index.md`
4. If Cam asks about scheduling or current posts: query Notion MCP directly (live data)
5. If Cam asks about planning a month or calendar structure: read `content-formula.md` first, then query Notion
6. If Cam asks about bulk analysis (6+ weeks of themes, customer rotation): read `data/notion/notion_export.json`
7. If Cam asks about a specific post's details: check the individual post directory in `posts/linkedin/[brand]/published/[slug]/`
8. If Cam asks to create a design: check designs path table above, create .jsx, push to correct folder
9. If Cam asks to create or plan new posts: check `content-formula.md` for which post type fits the next open slot

**Analysis workflow (performance / verdict):** Read `posts/_master-index.md` first; then brand `_index.md` if needed. For a short metrics summary use `analytics/linkedin-metrics-summary.md` if present. Do not read the full `data/notion/notion_export.json` or `analytics/aggregated-linkedin-metrics.json` unless doing a bulk or query-style analysis.

**Never browse post directories one by one.** Always start with `_index.md` files.

Strategy, voice guide, positioning, writing influences, anti-AI writing guide, visual strategy, and motion design guide all live in the repo now (`voice-guide.md`, `content-formula.md`, `strategy/`). The repo is the single source of truth.
