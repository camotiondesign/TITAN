# Repository Map

## Architecture

```
TITAN/
├── CLAUDE.md               # Single-file Claude orientation (read this first)
├── posts/                  # Published content by platform
│   ├── _master-index.md   # Cross-brand summary (Claude reads this first)
│   ├── linkedin/
│   │   ├── titan/
│   │   │   ├── published/  # 222 posts (each with caption.md, meta.json, metrics.json)
│   │   │   │   └── _index.md  # Aggregated index of all Titan posts
│   │   │   └── _drafts/    # Draft concepts and curriculum
│   │   └── titanverse/
│   │       └── published/  # 42 posts
│   │           └── _index.md  # Aggregated index of all Titanverse posts
│   ├── tiktok/published/
│   ├── youtube/
│   │   ├── shorts/published/
│   │   └── longform/published/
│   ├── instagram/published/
│   ├── facebook/published/
│   └── blog/published/
├── designs/                # After Effects .jsx files by platform
│   ├── linkedin/
│   │   ├── titan/
│   │   └── titanverse/
│   ├── tiktok/
│   ├── youtube/
│   │   ├── thumbnails/
│   │   └── end-cards/
│   ├── instagram/
│   ├── facebook/
│   ├── _templates/
│   └── README.md
├── data/                   # Automated data outputs
│   ├── notion/
│   │   ├── notion_export.json
│   │   └── notion_schema.json
│   ├── cross-platform/
│   │   └── content-map.json
│   ├── linkedin/metrics/
│   ├── youtube/metrics/
│   ├── tiktok/metrics/
│   ├── instagram/metrics/
│   ├── facebook/metrics/
│   └── sample_schedule.json
├── _interviews-raw/        # Raw interview transcripts (never edited)
│   ├── titan/
│   │   ├── case-studies/raw
│   │   ├── leadership/raw
│   │   └── product-vo/raw
│   └── titanverse/
│       ├── case-studies/raw
│       ├── leadership/raw
│       └── product-vo/raw
├── scripts/                # Automation scripts
│   ├── notion_sync.py     # Notion bidirectional sync (pull/push/discover)
│   ├── aggregate-metrics.js # LinkedIn metrics aggregation
│   ├── build-indexes.js   # Generate _index.md files for Claude readability
│   ├── notion-to-repo.js  # Create post dirs from published Notion posts
│   ├── youtube_sync.py    # YouTube data sync
│   ├── calculate-tcps.py  # TCPS score calculation
│   ├── campaign_audit.py  # Content audit against strategy rules
│   ├── requirements.txt   # Python dependencies
│   └── [analysis scripts] # Historical analysis tools (not maintained)
├── .github/workflows/      # GitHub Actions
│   ├── notion-sync.yml    # Daily 6am UTC Notion pull
│   ├── notion-to-repo.yml # Daily 7am UTC: create post dirs from Notion
│   ├── aggregate-metrics.yml # LinkedIn metrics aggregation
│   └── youtube-sync.yml   # YouTube data sync
├── analytics/              # Aggregated performance data
├── brand/                  # Logos, type, templates
├── inspiration/            # Competitive intelligence library
├── knowledge/              # Product knowledge base
├── systems/                # Workflow documentation
├── _reports/               # Generated analysis reports
├── _shared/                # Shared assets
├── titan-ai-instructions.md
├── titan-ai-behaviour-context.json
├── TITAN_CONTENT_AUTOMATION_BLUEPRINT.md
├── repo-map.md             # This file
└── README.md
```

**Key rule:** LinkedIn is the ONLY platform with separate titan/ and titanverse/ folders. Every other platform is a shared account. The titan/titanverse split in `_interviews-raw/` is about product focus, not publishing platform.

## Index Files (Claude-Readable)

| File | Purpose |
|------|---------|
| `posts/_master-index.md` | Cross-brand overview: totals, top performers, recent posts |
| `posts/linkedin/titan/published/_index.md` | All 222 Titan posts with metrics and caption previews |
| `posts/linkedin/titanverse/published/_index.md` | All 42 Titanverse posts with metrics and caption previews |

**Regenerate:** `node scripts/build-indexes.js`

## Automation Scripts

| Script | Purpose | Trigger |
|--------|---------|---------|
| `build-indexes.js` | Generate _index.md files from published posts | Manual (after adding posts) |
| `notion-to-repo.js` | Create post dirs from published Notion posts | Daily (7am UTC) + manual |
| `notion_sync.py discover` | Show Notion DB schema | Manual |
| `notion_sync.py pull` | Pull all Notion rows to JSON | Daily (6am UTC) + manual |
| `notion_sync.py push FILE` | Push schedule JSON to Notion | Manual |
| `aggregate-metrics.js` | Aggregate LinkedIn metrics | Daily Action |
| `youtube_sync.py` | Pull YouTube analytics | Weekly Action |
| `calculate-tcps.py` | Calculate TCPS scores | Manual |
| `campaign_audit.py` | Audit content against strategy | Manual |

## Key Principles

- Platform-First: content organised by publishing platform
- Index-First: Claude reads `_index.md` files, never browses post directories
- Raw interviews NEVER live inside posts
- No duplicates anywhere
- If a folder has no purpose, delete it
- Notion is the calendar, GitHub is the archive
- Automation eliminates manual CSV workflows

Last updated: February 2026
