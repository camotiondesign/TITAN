# Repository Map

## Architecture

```
TITAN/
├── CLAUDE.md               # Single-file Claude orientation (read this first)
├── posts/                  # Published and draft content by platform
│   ├── linkedin/
│   │   ├── titan/
│   │   │   ├── published/
│   │   │   ├── unpublished/
│   │   │   └── needs-metrics/
│   │   └── titanverse/
│   │       ├── published/
│   │       ├── unpublished/
│   │       └── needs-metrics/
│   ├── tiktok/
│   │   ├── published/
│   │   ├── unpublished/
│   │   └── needs-metrics/
│   ├── youtube/
│   │   ├── shorts/
│   │   │   ├── published/
│   │   │   ├── unpublished/
│   │   │   └── needs-metrics/
│   │   └── longform/
│   │       ├── published/
│   │       ├── unpublished/
│   │       └── needs-metrics/
│   ├── instagram/
│   │   ├── published/
│   │   ├── unpublished/
│   │   └── needs-metrics/
│   ├── facebook/
│   │   ├── published/
│   │   ├── unpublished/
│   │   └── needs-metrics/
│   └── blog/
│       ├── published/
│       └── drafts/
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
│   ├── aggregate-metrics.js # Weekly LinkedIn metrics aggregation
│   ├── youtube_sync.py    # YouTube data sync
│   ├── calculate-tcps.py  # TCPS score calculation
│   ├── campaign_audit.py  # Content audit against strategy rules
│   ├── requirements.txt   # Python dependencies
│   └── [analysis scripts] # Historical analysis tools (not maintained)
├── .github/workflows/      # GitHub Actions
│   ├── notion-sync.yml    # Daily 6am UTC Notion pull
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

## Automation Scripts

| Script | Purpose | Trigger |
|--------|---------|---------|
| `notion_sync.py discover` | Show Notion DB schema | Manual |
| `notion_sync.py pull` | Pull all Notion rows to JSON | Daily (6am UTC) + manual |
| `notion_sync.py push FILE` | Push schedule JSON to Notion | Manual |
| `aggregate-metrics.js` | Aggregate LinkedIn metrics | Daily Action |
| `youtube_sync.py` | Pull YouTube analytics | Weekly Action |
| `calculate-tcps.py` | Calculate TCPS scores | Manual |
| `campaign_audit.py` | Audit content against strategy | Manual |

## Key Principles

- Platform-First: content organised by publishing platform
- Raw interviews NEVER live inside posts
- No duplicates anywhere
- If a folder has no purpose, delete it
- Notion is the calendar, GitHub is the archive
- Automation eliminates manual CSV workflows

Last updated: February 2026
