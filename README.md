# TITAN Content Vault

**Multi-Platform Content Operations + Automation**

A lean, production-focused content operations vault for Titan PMR and Titanverse across LinkedIn, TikTok, YouTube, Instagram, Facebook, and blog. Maximum organisation, minimum clutter, nothing duplicated, nothing that isn't strategically useful.

**Owner:** Cameron Moorcroft
**Last Updated:** February 2026
**Architecture Version:** Vault Mode v3.0 (Multi-Platform)

**For Claude:** Read `CLAUDE.md` at repo root for full orientation in one file.

---

## Architecture

```
TITAN/
├── CLAUDE.md               # Single-file Claude orientation (read this first)
├── posts/                  # Published content by platform
│   ├── _master-index.md   # Cross-brand summary (Claude reads this)
│   ├── linkedin/
│   │   ├── titan/
│   │   │   ├── published/ # 222 posts + _index.md
│   │   │   └── _drafts/   # Draft concepts
│   │   └── titanverse/
│   │       └── published/ # 42 posts + _index.md
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
│   ├── instagram/
│   ├── facebook/
│   └── _templates/
├── data/                   # Automated data outputs
│   ├── notion/
│   │   ├── notion_export.json  # Latest Notion DB state (auto-synced daily)
│   │   └── notion_schema.json  # Discovered property types
│   ├── cross-platform/
│   │   └── content-map.json    # Source-to-derivative tracking
│   ├── linkedin/metrics/
│   ├── youtube/metrics/
│   ├── tiktok/metrics/
│   ├── instagram/metrics/
│   ├── facebook/metrics/
│   └── sample_schedule.json
├── _interviews-raw/        # Raw interview transcripts (never edited)
├── scripts/                # Automation scripts
│   ├── notion_sync.py     # Notion bidirectional sync (pull/push/discover)
│   ├── aggregate-metrics.js # LinkedIn metrics aggregation
│   ├── build-indexes.js   # Generate _index.md files for Claude readability
│   ├── youtube_sync.py    # YouTube data sync
│   └── requirements.txt
├── .github/workflows/      # GitHub Actions
│   ├── notion-sync.yml    # Daily Notion pull (6am UTC)
│   ├── aggregate-metrics.yml
│   └── youtube-sync.yml
├── analytics/              # Aggregated performance data
├── brand/                  # Logos, type, templates
├── inspiration/            # Competitive intelligence
├── knowledge/              # Product knowledge base
├── systems/                # Workflow documentation
├── titan-ai-instructions.md
├── titan-ai-behaviour-context.json
├── TITAN_CONTENT_AUTOMATION_BLUEPRINT.md
├── repo-map.md
└── README.md
```

**Key rule:** LinkedIn is the ONLY platform with separate titan/ and titanverse/ folders. Every other platform is a shared account.

---

## Automation System (Active)

See `TITAN_CONTENT_AUTOMATION_BLUEPRINT.md` for the full specification.

### Phase 1: Notion Bidirectional Sync (Complete)
- `scripts/notion_sync.py` with three commands:
  - `discover` -- show Notion database schema
  - `pull` -- export all posts to `data/notion/notion_export.json`
  - `push schedule.json` -- create/update posts in Notion
- Auto-schema discovery (detects property types dynamically)
- Daily GitHub Action pulls Notion state at 6am UTC

### Phase 2: Metrics + Alt-Text (Pending)
- LinkedIn Marketing API access (awaiting super admin approval)
- Automated metrics scraping

### Phase 3: Smart Planning Engine (Future)
- Cadence validation
- Auto-shuffle for urgent posts

### Quick Start

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Set environment variables (or create .env in repo root)
export NOTION_TOKEN=ntn_...
export NOTION_DATABASE_ID=abc123...

# Discover your Notion schema
python scripts/notion_sync.py discover

# Pull all posts from Notion
python scripts/notion_sync.py pull

# Push a schedule to Notion
python scripts/notion_sync.py push data/sample_schedule.json

# Regenerate index files (after adding new posts)
node scripts/build-indexes.js
```

---

## Content Rules

All content follows the rules in `titan-ai-instructions.md`. Key principles:

- British English only, no em dashes
- Titan PMR and Titanverse are separate products with separate voices
- No AI hype, no empty marketing phrases
- TCPS (Total Content Performance Score) is the primary performance metric
- TITAN and TITANVERSE performance must never be compared against each other

---

## Posting Cadence

| Brand | Normal Week | Event Week |
|-------|------------|------------|
| Titan PMR | Mon / Wed / Fri | 4-5 posts |
| Titanverse | Tue / Thu | 3 posts |

Single-day gap rule: during Mon-Fri, neither brand should have more than one day without a post.

---

## Key Dates (2026)

| Event | Date |
|-------|------|
| TitanUp 2026 | Sunday 7 June, Birmingham |
| Pharmacy Show 2026 | 12-13 October |

---

## Rules

- Platform-First: content organised by platform, not campaign
- Index-First: Claude reads `_index.md` files, never browses post directories
- No Duplication: transcripts live in one place
- Lean Structure: no legacy folders
- Production Focus: everything serves active content creation
- Final Versions Only: no v1, v2 unless explicitly needed
