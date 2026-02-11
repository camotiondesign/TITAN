# TITAN Content Vault

**Streamlined Campaign-Led Content System + Automation**

A lean, production-focused content operations vault for Titan PMR and Titanverse LinkedIn content. Maximum organisation, minimum clutter, nothing duplicated, nothing that isn't strategically useful.

**Owner:** Cameron Moorcroft
**Last Updated:** February 2026
**Architecture Version:** Vault Mode v2.0 (Automation)

---

## Architecture

```
TITAN/
├── campaigns/              # All active campaigns (live content)
│   ├── TITAN/             # Titan PMR campaigns
│   └── TITANVERSE/        # Titanverse campaigns
├── playground/             # Draft workspace (build before publishing)
├── campaign-template/      # Template for new campaigns
├── _interviews-raw/        # Raw interview transcripts (never edited)
├── inspiration/            # Competitive intelligence library
├── knowledge/              # Product knowledge base
├── brand/                  # Logos, type, templates
├── analytics/              # Aggregated performance data
├── scripts/                # Automation scripts (Phase 1+)
│   ├── notion_sync.py     # Notion bidirectional sync (pull/push/discover)
│   ├── requirements.txt   # Python dependencies
│   └── [analysis scripts] # Historical analysis tools
├── data/                   # Automated data outputs
│   ├── notion_export.json # Latest Notion database state (auto-synced daily)
│   ├── notion_schema.json # Discovered Notion property types
│   └── sample_schedule.json # Template for push command
├── .github/workflows/      # GitHub Actions (automated jobs)
│   ├── aggregate-metrics.yml  # Weekly metrics aggregation
│   └── notion-sync.yml       # Daily Notion pull (6am UTC)
├── systems/                # Workflow documentation
├── campaigns-index.json    # Automated campaign index
├── titan-ai-instructions.md    # AI content rules
├── titan-ai-behaviour-context.json
├── TITAN_CONTENT_AUTOMATION_BLUEPRINT.md  # Full automation spec
└── repo-map.md             # This file's companion
```

---

## Automation System (Active)

The repo now includes a content operations automation system that eliminates manual CSV workflows. See `TITAN_CONTENT_AUTOMATION_BLUEPRINT.md` for the full specification.

### Phase 0: Foundation (Complete)
- Notion API integration connected
- GitHub secrets stored (NOTION_API_KEY, NOTION_DATABASE_ID)
- MCP configuration ready

### Phase 1: Notion Bidirectional Sync (Complete)
- `scripts/notion_sync.py` with three commands:
  - `discover` -- show Notion database schema
  - `pull` -- export all posts to `data/notion_export.json`
  - `push schedule.json` -- create/update posts in Notion
- Auto-schema discovery (detects property types dynamically)
- Daily GitHub Action pulls Notion state at 6am UTC
- Pagination handles databases of any size

### Phase 2: Metrics + Alt-Text (Pending)
- LinkedIn Marketing API access (awaiting super admin approval)
- Automated metrics scraping
- Claude Vision for auto-generated alt-text
- OpenAI Whisper for video transcription

### Phase 3: Smart Planning Engine (Future)
- Cadence validation
- Auto-shuffle for urgent posts
- Tracker auto-updates on publish

### Quick Start

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Set environment variables (or create .env in repo root)
export NOTION_API_KEY=ntn_...
export NOTION_DATABASE_ID=abc123...

# Discover your Notion schema
python scripts/notion_sync.py discover

# Pull all posts from Notion
python scripts/notion_sync.py pull

# Push a schedule to Notion
python scripts/notion_sync.py push data/sample_schedule.json
```

---

## Campaign Structure

Every campaign follows this structure:

```
YYYY-MM-DD-campaign-name/
├── content/
│   ├── blog.md
│   ├── carousel.md
│   ├── single-image.md
│   └── video/
├── social/
│   └── linkedin/
│       └── YYYY-MM-DD-slug/
│           ├── caption.md
│           ├── comments.md
│           ├── metrics.json
│           └── meta.json
├── performance/
├── assets/
├── post-mortem.md
└── README.md
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

- Campaign-First: all content belongs to a campaign
- No Duplication: transcripts live in one place
- Lean Structure: no legacy folders
- Production Focus: everything serves active content creation
- Final Versions Only: no v1, v2 unless explicitly needed
