# TITAN Content Repo -- Claude Quick Reference

Last updated: 2026-02-12
Daily Notion sync: 7am GMT via GitHub Actions

---

## Where Things Are

### Data (read often)
| What | Path | Notes |
|------|------|-------|
| Notion DB snapshot | `data/notion/notion_export.json` | Full database, refreshed daily 7am GMT. 3MB+, don't read the whole file. Query Notion MCP instead for live data. Use this for bulk analysis only. |
| Notion DB schema | `data/notion/notion_schema.json` | Property names and types. Read this first if you need to query Notion. |
| Content map | `data/cross-platform/content-map.json` | Maps source content (interviews, filming) to platform derivatives. Check this to see what's been created from each source. |
| LinkedIn metrics | `data/linkedin/metrics/` | Performance data from LinkedIn pages |
| YouTube metrics | `data/youtube/metrics/` | YouTube analytics |
| TikTok metrics | `data/tiktok/metrics/` | TikTok analytics |
| Instagram metrics | `data/instagram/metrics/` | Instagram analytics |
| Facebook metrics | `data/facebook/metrics/` | Facebook analytics |

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

## Ignore These (one-off analysis, not maintained)

Everything else in `scripts/` was used for historical analysis or one-time migrations. Don't rely on them being current. Key ones to ignore:
- `migrate-campaign-content-to-posts.py` (migration complete)
- `migrate-titanverse-campaign-content-to-posts.py` (migration complete)
- `restructure-*.js` (repo restructure scripts, done)
- `apply_renames.py` (one-time rename operation)
- `cleanup_metrics.py` (one-time cleanup)
- `standardize-asset-types.py` (one-time fix)

---

## Content Map Schema

`data/cross-platform/content-map.json` tracks how source content (one interview, one filming session) becomes multiple posts across platforms.

### Structure
```json
{
  "sources": [
    {
      "source_id": "customer_pharmacy_YYYY_MM",
      "source_type": "customer_interview | leadership_filming | event_footage | product_demo | reactive_content",
      "customer": "Name",
      "pharmacy": "Pharmacy Name",
      "filmed_date": "YYYY-MM-DD",
      "raw_transcript": "_interviews-raw/.../file.md",
      "derivatives": [
        {
          "platform": "linkedin | tiktok | youtube | instagram | facebook | blog",
          "brand": "titan | titanverse | null",
          "post_name": "TITAN_PostName",
          "format": "video | single_image | carousel | short_clip | longform | short | reel | article",
          "status": "not_started | concept | scripted | editing | scheduled | published",
          "published_date": "YYYY-MM-DD | null",
          "file_path": "posts/platform/.../file.md | null"
        }
      ]
    }
  ]
}
```

`brand` is `"titan"` or `"titanverse"` for LinkedIn. `null` for all shared platforms.

---

## What Claude Should Do at the Start of Each Conversation

1. Read this file (`CLAUDE.md`) -- one tool call, full orientation
2. If Cam asks about published content performance: read `posts/_master-index.md` (one file, full summary)
3. If Cam asks about a specific brand's posts: read `posts/linkedin/[brand]/published/_index.md`
4. If Cam asks about scheduling or current posts: query Notion MCP directly (live data)
5. If Cam asks about bulk analysis (6+ weeks of themes, customer rotation): read `data/notion/notion_export.json`
6. If Cam asks about a specific post's details: check the individual post directory in `posts/linkedin/[brand]/published/[slug]/`
7. If Cam asks to create a design: check designs path table above, create .jsx, push to correct folder
8. If Cam asks what content exists from a source: check `data/cross-platform/content-map.json`

**Never browse post directories one by one.** Always start with `_index.md` files.

Strategy, voice guide, curriculum trackers, quote banks, and posting cadence rules are all in the Claude Project files, not the repo. Don't look for them here.
