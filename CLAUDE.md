# TITAN Content Repo -- Claude Quick Reference

Last updated: 2026-04-07 (titan-believes.md added; brief-template position-first rewrite; voice analysis locked in)
Notion sync: Manual (automated sync paused)

---

## Where Things Are

### Data (read often)
| What | Path | Notes |
|------|------|-------|
| Notion DB snapshot | `data/notion/notion_export.json` | Full database, refreshed daily 7am GMT. 3MB+, don't read the whole file. Query Notion MCP instead for live data. Use this for bulk analysis only. |
| Notion DB schema | `data/notion/notion_schema.json` | Property names and types. Read this first if you need to query Notion. |
| LinkedIn metrics | `data/linkedin/metrics/` | Performance data from LinkedIn pages |
| YouTube data | `data/youtube/channel_summary.json` | 117 videos with metadata + transcripts after `youtube_sync.py pull` |
| YouTube transcripts | `data/youtube/transcripts/` | Per-video transcripts synced to LinkedIn post dirs via `sync-transcripts.js` |
| Aggregated LinkedIn metrics | `analytics/aggregated-linkedin-metrics.json` | Post-level metrics; prefer `posts/_master-index.md` for overview. Generated weekly by `scripts/aggregate-metrics.js`. |

### Posts (archived published content)
| Path | What's in it |
|------|-------------|
| `posts/_master-index.md` | LinkedIn cross-brand summary, top performers, recent posts. Start here. |
| `posts/linkedin/titan/published/posts.json` | **FULL Titan LinkedIn data** -- all posts with complete captions, alt text, transcripts, metrics. Use for content analysis, writing, referencing. |
| `posts/linkedin/titanverse/published/posts.json` | **FULL Titanverse LinkedIn data** -- same as above. |
| `posts/linkedin/titan/published/_index.md` | Titan PMR overview -- top performers, content mix, truncated previews. |
| `posts/linkedin/titanverse/published/_index.md` | Titanverse overview -- same format. |
| `posts/blog/published/posts.json` | Blog posts from titanpmr.com and titanverse.co.uk. Populated by `sync-blog.js`. |
| `posts/linkedin/titan/published/` | Individual Titan post dirs. Source of truth. |
| `posts/linkedin/titan/_drafts/` | Draft concepts and curriculum (not published). |
| `posts/linkedin/titanverse/published/` | Individual Titanverse post dirs. Source of truth. |

**LinkedIn is the primary platform.** TikTok, Instagram, Facebook, YouTube post directories are intentionally empty — LinkedIn is the KPI that matters.

**For Claude:** Don't browse individual post directories. Read `posts.json` for full content/data, `_index.md` for LinkedIn overview. Run `node scripts/build-indexes.js` to regenerate everything.

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

### Caption Toolkit (use for writing)
| Path | What's in it |
|------|-------------|
| `_caption-toolkit/titan-believes.md` | **Start here.** Titan's actual positions on pharmacy — what the brand is willing to defend publicly. Every caption should be traceable to a belief in this file. |
| `_caption-toolkit/brief-template.md` | Fill-in brief before writing any caption. Position-first structure. Single image / carousel / video / case study / Titanverse variants |
| `_caption-toolkit/patterns-from-winners.md` | Hook patterns, body structure, CTA types, voice fingerprint — extracted from top performers. Includes inside vs. outside voice principle (Section 9). |
| `_caption-toolkit/case-study-patterns.md` | Interview → post workflow, 7 types of extractable moments, 8-signal scoring system |

**For Claude:** When Cam asks you to write a LinkedIn caption:
1. Read `titan-believes.md` — find the belief this post is built around
2. Read `brief-template.md` — fill in POSITION and READER TENSION before anything structural
3. Read `patterns-from-winners.md` — apply the right structure and voice
4. For case studies: read `_interviews-processed/[Name].md` first

**The position comes before the structure. Always.**

### Interview Memory Layer
| Path | What's in it |
|------|-------------|
| `_interviews-processed/_index.md` | All interviews sorted by urgency + estimated posts remaining |
| `_interviews-processed/[Name].md` | Per-interview brief: before/after stats, best quotes, what's been used, what's still available |

**For Claude:** Before writing a case study post, read the relevant `_interviews-processed/[Name].md` first. It tells you what quotes, numbers, and moments exist AND which ones have already been used in published posts. Don't re-use material that's already been posted.

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

---

## Live Automation (scripts that run on schedule)

| Script | What it does | Schedule | Workflow file |
|--------|-------------|----------|--------------|
| `scripts/notion_sync.py pull` | Pulls full Notion DB to `data/notion/notion_export.json` | Daily 6am UTC | `.github/workflows/notion-sync.yml` |
| `scripts/notion-to-repo.js` | Creates post directories from published Notion posts (caption, meta, metrics pending, alt-text) | **Manual only** (automated sync paused) | `.github/workflows/notion-to-repo.yml` |
| `scripts/youtube_sync.py` | Pulls YouTube analytics to `data/youtube/` | Scheduled | `.github/workflows/youtube-sync.yml` |
| `scripts/aggregate-metrics.js` | Aggregates LinkedIn performance metrics | Weekly | `.github/workflows/aggregate-metrics.yml` |

## Useful Manual Scripts

| Script | What it does | When to use |
|--------|-------------|-------------|
| `scripts/build-indexes.js` | Regenerates `_index.md` files + `posts.json` files for Titan and Titanverse | After new posts are added or metrics updated |
| `scripts/notion-to-repo.js --dry-run` | Preview what Notion posts would sync to repo | Before running a live sync |
| `scripts/notion-to-repo.js --since 7` | Sync only posts published in last 7 days | Quick sync of recent posts |
| `scripts/notion_sync.py discover` | Shows Notion DB schema and property types | When you need to check property names before querying |
| `scripts/notion_sync.py push FILE` | Pushes a schedule JSON file to Notion | Bulk post creation |
| `scripts/calculate-tcps.py` | Calculates TCPS scores from metrics | Performance analysis |
| `scripts/campaign_audit.py` | Audits content against strategy rules | Checking rotation, gaps |
| `scripts/sync-transcripts.js` | Matches YouTube transcripts to LinkedIn video posts | After `youtube_sync.py pull` |
| `scripts/sync-blog.js` | Scrapes titanpmr.com + titanverse.co.uk blogs into `posts/blog/published/` | Run periodically to keep blog posts current |

## Scripts (lean set)

The only scripts in active use are those in the tables above (Notion sync, notion-to-repo, build-indexes, aggregate-metrics, youtube_sync, calculate-tcps, campaign_audit, sync-transcripts, sync-blog). Anything else in `scripts/` is one-off; don't rely on it for automation.

---

## What Claude Should Do at the Start of Each Conversation

1. Read this file (`CLAUDE.md`) -- one tool call, full orientation
2. If Cam asks about published content performance: read `posts/_master-index.md` for overview, then the relevant `posts.json` if you need full captions or details
3. If Cam asks about LinkedIn posts (writing, analysis, referencing): read `posts/linkedin/[brand]/published/posts.json`
4. If Cam asks about blog content: read `posts/blog/published/posts.json`
5. If Cam asks about scheduling or current posts: query Notion MCP directly (live data)
6. If Cam asks about bulk analysis (6+ weeks of themes, customer rotation): read `data/notion/notion_export.json`
7. If Cam asks about a specific post's details: check the individual post directory (only when posts.json isn't enough)
8. If Cam asks to create a design: check designs path table above, create .jsx, push to correct folder

**Analysis workflow (performance / verdict):** Read `posts/_master-index.md` first; then `posts/linkedin/[brand]/published/posts.json` for full post content. For a short metrics summary use `analytics/linkedin-metrics-summary.md` if present. Do not read the full `data/notion/notion_export.json` or `analytics/aggregated-linkedin-metrics.json` unless doing bulk analysis.

**Caption writing workflow:** Read `_caption-toolkit/titan-believes.md` first — identify the belief the post will defend. Then `_caption-toolkit/brief-template.md` for the brief structure (position-first). Then `_caption-toolkit/patterns-from-winners.md` for voice and structure. For case studies, read `_interviews-processed/[Name].md` before writing. Writing starts from a position, not from a format choice.

**Interview workflow:** When Cam brings a new interview, read `_caption-toolkit/case-study-patterns.md` for the extraction framework. Create a new `_interviews-processed/[Name].md` file. Then write captions from the brief.

**Never browse post directories one by one.** Use `posts.json` for full data, `_index.md` for LinkedIn overview.

Strategy, voice guide, curriculum trackers, quote banks, and posting cadence rules are all in the Claude Project files, not the repo. Don't look for them here.
