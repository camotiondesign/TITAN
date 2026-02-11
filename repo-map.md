# Repository Map

## Architecture

```
TITAN/
├── campaigns/              # All active campaigns
│   ├── TITAN/             # Titan PMR campaigns
│   └── TITANVERSE/        # Titanverse campaigns
├── campaign-template/      # Template for new campaigns
├── _interviews-raw/        # Raw interview transcripts (never edited)
│   ├── titan/
│   │   ├── case-studies/raw
│   │   ├── leadership/raw
│   │   └── product-vo/raw
│   └── titanverse/
│       ├── case-studies/raw
│       ├── leadership/raw
│       └── product-vo/raw
├── inspiration/            # Competitive intelligence library
├── knowledge/              # Product knowledge base
├── brand/                  # Logos, type, templates
├── analytics/              # Aggregated performance data
├── scripts/                # Automation scripts
│   ├── notion_sync.py     # Notion bidirectional sync (pull/push/discover)
│   ├── requirements.txt   # Python dependencies
│   ├── aggregate-metrics.js # Weekly metrics aggregation
│   └── [analysis scripts] # Historical analysis tools
├── data/                   # Automated data outputs
│   ├── notion_export.json # Latest Notion database state
│   ├── notion_schema.json # Discovered property types
│   └── sample_schedule.json
├── .github/workflows/      # GitHub Actions
│   ├── aggregate-metrics.yml
│   └── notion-sync.yml    # Daily 6am UTC Notion pull
├── systems/                # Workflow documentation
├── _reports/               # Generated analysis reports
├── _shared/                # Shared assets
├── audit_results/          # Audit outputs
├── playground/             # Draft workspace
├── research/               # Research materials
├── campaigns-index.json
├── titan-ai-instructions.md
├── titan-ai-behaviour-context.json
├── TITAN_CONTENT_AUTOMATION_BLUEPRINT.md
├── repo-map.md             # This file
└── README.md
```

## Campaign Structure

Every campaign follows this structure:

```
YYYY-MM-DD-slug/
├── content/
│   ├── blog.md
│   ├── carousel.md
│   ├── single-image.md
│   └── video/
│       └── <slug>/
│           ├── transcript.md
│           └── meta.json
├── social/
│   ├── linkedin/
│   │   └── <YYYY-MM-DD-slug>/
│   │       ├── caption.md
│   │       ├── comments.md
│   │       ├── metrics.json
│   │       └── meta.json
│   ├── tiktok/
│   └── youtube/
├── performance/
│   ├── linkedin.json
│   ├── tiktok.json
│   └── youtube.json
├── assets/
├── post-mortem.md
└── README.md
```

## Automation Scripts

| Script | Purpose | Trigger |
|--------|---------|---------|
| `notion_sync.py discover` | Show Notion DB schema | Manual |
| `notion_sync.py pull` | Pull all Notion rows to JSON | Daily (6am UTC) + manual |
| `notion_sync.py push FILE` | Push schedule JSON to Notion | Manual |
| `aggregate-metrics.js` | Aggregate LinkedIn metrics | Weekly Action |

## Key Principles

- Campaign folder = ONE story, MANY assets
- Raw interviews NEVER live inside campaigns
- No duplicates anywhere
- If a folder has no purpose, delete it
- Notion is the calendar, GitHub is the archive
- Automation eliminates manual CSV workflows

Last updated: February 2026
