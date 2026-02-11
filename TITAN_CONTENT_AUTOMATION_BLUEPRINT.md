# TITAN CONTENT OPS AUTOMATION — COMPLETE TECHNICAL BLUEPRINT

**Created:** February 11, 2026  
**Author:** Cam (Content Strategist, Titan PMR / Titanverse) + Claude  
**Status:** Phase 1 Complete — GitHub Action needs re-run after requirements.txt fix  
**Last Updated:** February 11, 2026 (progress tracker updated to reflect actual state)  
**Purpose:** This is the single source of truth for the entire automation build. If a conversation ends, any new Claude session or developer should be able to read this document and continue from wherever Cam left off.

---

## TABLE OF CONTENTS

1. [Context & Background](#1-context--background)
2. [System Architecture](#2-system-architecture)
3. [Phase 0: Foundation Setup](#3-phase-0-foundation-setup)
4. [Phase 1: Notion Bidirectional Sync](#4-phase-1-notion-bidirectional-sync)
5. [Phase 2: Metrics Scraping & Auto Alt-Text](#5-phase-2-metrics-scraping--auto-alt-text)
6. [Phase 3: Smart Planning Engine](#6-phase-3-smart-planning-engine)
7. [Phase 4: Client-Ready Product (Future)](#7-phase-4-client-ready-product-future)
8. [Repo Structure Specification](#8-repo-structure-specification)
9. [Data Schema Specifications](#9-data-schema-specifications)
10. [API Reference & Credentials](#10-api-reference--credentials)
11. [GitHub Actions Specifications](#11-github-actions-specifications)
12. [MCP Configuration](#12-mcp-configuration)
13. [Cadence Rules Engine Specification](#13-cadence-rules-engine-specification)
14. [Cost Analysis](#14-cost-analysis)
15. [Decision Log](#15-decision-log)
16. [Progress Tracker](#16-progress-tracker)

---

## 1. CONTEXT & BACKGROUND

### Who Is Cam

Cam is a content strategist managing LinkedIn (and TikTok) content for two UK pharmacy technology brands:

- **Titan PMR** — Cloud-based pharmacy management system (dispensing automation)
- **Titanverse** — Clinical services platform (consultations, prescribing)

Both brands post to LinkedIn company pages. Titan PMR also has a TikTok presence. Content is planned, designed, and published via a Notion database using Notion Social for direct LinkedIn posting.

### Current Pain Points (What We're Solving)

1. **CSV Hell:** To plan content, Cam exports the entire Notion database as CSV, brings it to Claude, plans the schedule, generates a new CSV, deletes all future posts in Notion, and reimports. This is done every time the calendar needs adjusting.

2. **Manual Metrics:** Cam manually inputs LinkedIn post metrics (impressions, reactions, comments, shares) into a GitHub repo. For each post, Cam also manually writes alt-text descriptions of every image, carousel slide, and video so Claude can understand visual context. This takes hours weekly.

3. **Stale Project Files:** Claude Projects stores static files that Cam manually uploads and versions. When strategy docs or trackers change, Cam has to delete and re-upload files. There's no live connection.

4. **No Automation:** Everything is manual — planning, metrics tracking, theme rotation checking, gap analysis, customer rotation. Cam is the system, and that doesn't scale.

### What Already Exists

- **GitHub Repo:** Large local repo (connected via Git) containing:
  - `/linkedin posts/titan/published/` — 216+ published posts with meta.json, caption.md, metrics.json, comments.md, alt-text.md
  - `/linkedin posts/titanverse/published/` — 38+ published posts
  - Unpublished concepts, curriculum posts, needs-metrics folders
  - Various strategy docs and trackers

- **Notion Database:** "Titan Social Media Database" with 20 columns:
  - Name, Asset For Reviewal, Assigned, Campaign, Comments, Content Type, Idea, Likes, Media, Notionsocial, Phase, Platforms, Post Caption, Post Status, Post URL, Publish Status, Shares, Sourced Assets, Time, Views

- **Claude Project:** Contains strategy docs, voice guides, trackers, quote banks as static uploaded files. These are the project knowledge files Claude references for planning.

- **Notion Social:** Connected to LinkedIn company pages for direct posting from Notion.

### Cam's Technical Comfort Level

- Has set up a GitHub repo, connected it via Git
- Has used GitHub Actions for data aggregation
- Has connected APIs (OpenAI) with secret keys
- Has built apps with Lovable
- Understands HTML and basic CSS
- Can follow technical instructions and debug with help
- Prefers: things that run automatically, buttons to click, minimal ongoing maintenance

---

## 2. SYSTEM ARCHITECTURE

### Overview Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GITHUB REPO                          │
│              (Single Source of Truth)                    │
│                                                         │
│  /strategy/     → Voice guides, playbooks, trackers     │
│  /data/         → Post history, metrics, quote banks    │
│  /scripts/      → All automation scripts                │
│  /.github/      → GitHub Actions (scheduled jobs)       │
│                                                         │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
     ┌─────▼─────┐  ┌────▼────┐  ┌──────▼──────┐
     │  NOTION   │  │ CLAUDE  │  │  LINKEDIN   │
     │  DATABASE │  │  (MCP)  │  │  + TIKTOK   │
     │           │  │         │  │    APIs     │
     │ Calendar  │  │ Live    │  │             │
     │ + Notion  │  │ access  │  │ Metrics +   │
     │ Social    │  │ to repo │  │ media URLs  │
     │ (posting) │  │ + Notion│  │             │
     └─────┬─────┘  └────┬────┘  └──────┬──────┘
           │              │              │
           └──────────────┴──────────────┘
                          │
                   ┌──────▼──────┐
                   │ CLAUDE API  │
                   │ (Vision)    │
                   │             │
                   │ Auto alt-   │
                   │ text for    │
                   │ images +    │
                   │ videos      │
                   └─────────────┘
```

### Data Flow

```
PLANNING:
  Claude reads Notion (via MCP or synced JSON in repo)
  → Claude generates schedule
  → Script pushes to Notion via API
  → Cam publishes via Notion Social

METRICS:
  GitHub Action runs weekly
  → Pulls post data from LinkedIn API + TikTok API
  → Downloads media (images, video thumbnails)
  → Sends media to Claude API for alt-text generation
  → Saves structured JSON to repo
  → Commits automatically

LIVE PLANNING:
  Cam opens Claude Desktop with MCP
  → Claude reads live repo (strategy docs, metrics, trackers)
  → Claude reads live Notion (current calendar)
  → Claude plans with full context
  → Changes push directly to Notion
```

### Key Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Source of truth | GitHub repo | Versioned, accessible via MCP, GitHub Actions native |
| Posting tool | Notion Social | Already working, cheap, client likes it |
| Planning interface | Claude conversation | Most flexible, no UI to build yet |
| Language | Python | Cam has some familiarity, best library ecosystem |
| Scheduling | GitHub Actions | Free tier sufficient, Cam has used before |
| Alt-text generation | Claude API (Vision) | Best visual understanding, consistent with planning |
| Metrics source | LinkedIn Marketing API (primary), Shield (fallback) | Free first, paid backup |
| Notion API library | Raw `httpx` (not `notion-client`) | `notion-client` SDK failed on Notion Social synced databases; `httpx` with direct REST calls works |

---

## 3. PHASE 0: FOUNDATION SETUP

**Estimated time:** 1-2 hours  
**Dependencies:** None  
**Outcome:** All API keys stored, MCP connected, repo structure ready  
**Status:** ✅ COMPLETE (Feb 11, 2026)

### Step 0.1 — Notion API Integration

**URL:** https://www.notion.so/my-integrations

1. Click **"New integration"**
2. Configuration:
   - **Name:** `Titan Content Sync`
   - **Associated workspace:** [Cam's workspace with the Social Media Database]
   - **Type:** Internal
   - **Capabilities:**
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
     - ❌ No user information needed
3. Click **Submit**
4. Copy the **Internal Integration Secret** (starts with `ntn_`)
5. Store as GitHub secret:
   - Repo → Settings → Secrets and variables → Actions → New repository secret
   - **Name:** `NOTION_TOKEN`
   - **Value:** the `ntn_` key

**Cost:** Free (included with any Notion plan)

### Step 0.2 — Share Database with Integration

1. Open **Titan Social Media Database** in Notion (as full page)
2. Click `...` menu (top right) → **Connections**
3. Search for `Titan Content Sync` → Connect
4. Get **Database ID** from URL:
   - URL format: `https://www.notion.so/workspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=YYYY`
   - The `XXXXX...` part (32 hex characters) is the database ID
   - Sometimes it's formatted with hyphens: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Either format works with the API
5. Store as GitHub secret:
   - **Name:** `NOTION_DATABASE_ID`
   - **Value:** the 32-character ID

### Step 0.3 — Claude MCP Setup

**What MCP does:** Gives Claude Desktop direct, live access to your GitHub repo and Notion database during conversations. No more uploading files.

**Install Claude Desktop:** https://claude.ai/download (macOS or Windows)

**Configure MCP servers:**

1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config
3. This opens a JSON config file. Add the following:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_GITHUB_PAT>"
      }
    },
    "notion": {
      "command": "npx",
      "args": [
        "-y",
        "@notionhq/notion-mcp-server"
      ],
      "env": {
        "NOTION_TOKEN": "<YOUR_NOTION_NTN_KEY>"
      }
    }
  }
}
```

**Note on Notion MCP server:** Use `@notionhq/notion-mcp-server` (the official Notion package), NOT `@modelcontextprotocol/server-notion`. This was verified during setup — the official package works correctly.

**To get the GitHub Personal Access Token (PAT):**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control of private repositories)
4. Copy the token
5. Paste it into the MCP config above

**IMPORTANT:** The MCP config file is LOCAL to your machine. These keys are not uploaded anywhere. But don't commit this file to your repo.

4. Save the config file
5. Restart Claude Desktop
6. **Test:** Start a new conversation in Claude Desktop and ask:
   - "Can you read the README from my GitHub repo [repo-name]?"
   - "Can you list the pages in my Notion workspace?"
   - If both work, MCP is live.

**Note:** MCP currently works in Claude Desktop only, not in claude.ai browser. For browser-based work (like this current project), Cam would still use the synced JSON approach or upload the latest data. MCP is for the desktop planning workflow.

### Step 0.4 — Repository Structure

Core folders created:

```
TITAN/
├── scripts/
│   ├── notion_sync.py          ← Phase 1: Notion read/write (18KB, fully functional)
│   └── requirements.txt        ← Python dependencies (httpx, python-dotenv)
│
├── data/
│   ├── notion_export.json      ← Auto-generated: current Notion state (3.2MB)
│   ├── notion_schema.json      ← Auto-discovered schema
│   └── sample_schedule.json    ← Example push format
│
├── strategy/                   ← Strategy docs migrated from Claude Projects
│   ├── (all strategy docs)
│   └── (all CSV trackers)
│
├── linkedin posts/             ← Existing post archive (216+ Titan, 38+ Titanverse)
│
├── .github/
│   └── workflows/
│       └── notion-sync.yml     ← Daily at 6am UTC
│
└── TITAN_CONTENT_AUTOMATION_BLUEPRINT.md  ← THIS FILE
```

### Step 0.5 — Python Environment

`scripts/requirements.txt`:

```
httpx>=0.27.0
python-dotenv>=1.0.0
```

**⚠️ Note:** The original blueprint specified `notion-client>=2.0.0` but the script was rewritten to use raw `httpx` because `notion-client` SDK failed on Notion Social synced databases. The requirements.txt was updated to match on Feb 11, 2026.

### Phase 0 Completion Checklist

- [x] Notion integration created at notion.so/my-integrations
- [x] API key stored as `NOTION_TOKEN` GitHub secret
- [x] Database shared with integration (via Connections menu)
- [x] Database ID stored as `NOTION_DATABASE_ID` GitHub secret
- [x] GitHub PAT generated and stored locally
- [x] Claude Desktop installed
- [x] MCP config file created with GitHub + Notion servers
- [x] Claude Desktop can read from GitHub repo (tested)
- [x] Claude Desktop can query Notion (tested)
- [x] Node.js installed (required for MCP npx commands)
- [x] Repo folder structure created
- [x] `scripts/requirements.txt` created

---

## 4. PHASE 1: NOTION BIDIRECTIONAL SYNC

**Estimated time:** 2-3 hours (building together with Claude)  
**Dependencies:** Phase 0 complete  
**Outcome:** Never export/import a CSV again  
**Status:** ✅ COMPLETE (Feb 11, 2026) — script works locally; GitHub Action needs re-run after requirements.txt fix

### What the Script Does

`scripts/notion_sync.py` (18KB) has three commands, using raw `httpx` for all Notion API calls:

#### Command 1: `pull`
```bash
python scripts/notion_sync.py pull
```
- Reads ALL rows from the Notion Social Media Database via API
- Auto-discovers schema on every pull (handles synced database quirks)
- Converts to structured JSON with proper property extraction for all Notion types
- Saves to `/data/notion_export.json` (currently 3.2MB)
- When run via GitHub Action, auto-commits the file

#### Command 2: `push`
```bash
python scripts/notion_sync.py push schedule.json
```
- Reads a JSON file containing new/updated posts
- For each post: queries Notion for existing page by Name
- If found → UPDATE (patch properties)
- If not found → CREATE (new page)
- Uses `PUSH_KEY_MAP` to translate JSON keys to Notion property names

#### Command 3: `shuffle` (Phase 3 placeholder)
```bash
python scripts/notion_sync.py shuffle --urgent "TITAN_BreakingNews" --date "2026-03-15" --platform "LI-PAGE@titanpmr"
```
- Currently just prints placeholder info about future functionality

### Implementation Notes (Lessons Learned)

| Issue | Resolution |
|-------|------------|
| `notion-client` SDK failed on synced databases | Rewrote using raw `httpx` with direct REST API calls |
| `ReadTimeout` on large database queries | Increased timeout to 60s (`httpx.Timeout(60.0, connect=10.0)`) |
| Schema discovery fails on synced databases | Falls back to reading property types from first row |
| `PUSH_KEY_MAP` needed tuning | Updated to match verified Notion schema property names |
| Secret naming inconsistency | Renamed `NOTION_API_KEY` → `NOTION_TOKEN` everywhere |
| MCP server package | Switched to `@notionhq/notion-mcp-server` (official) |
| `requirements.txt` mismatch | Updated from `notion-client` to `httpx` after rewrite (Feb 11 fix) |

### Push Schedule JSON Format

When Claude generates a schedule during a planning session, it outputs this format:

```json
{
  "generated": "2026-02-11T14:30:00Z",
  "action": "merge",
  "posts": [
    {
      "name": "TITAN_AbsoluteAgony_Jeet",
      "platform": "LI-PAGE@titanpmr",
      "content_type": "Single Image",
      "date": "2026-02-11",
      "campaign": "HEAD OFFICE",
      "phase": "",
      "status": "Concept for Review",
      "caption": "Full caption text here...",
      "idea": "Design brief here..."
    }
  ]
}
```

### GitHub Action: Daily Notion Pull

File: `.github/workflows/notion-sync.yml`

```yaml
name: Notion Sync

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6am UTC (7am GMT)
  workflow_dispatch:        # Manual trigger from GitHub UI

jobs:
  pull:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r scripts/requirements.txt

      - name: Pull from Notion
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: python scripts/notion_sync.py pull

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Auto-sync: Notion pull $(date +%Y-%m-%d)"
          git push
```

### Phase 1 Completion Checklist

- [x] `scripts/notion_sync.py` created with `pull` command
- [x] Schema discovery run — auto-discovers on every pull
- [x] First pull executed — JSON file in `/data/notion_export.json` (3.2MB)
- [x] `push` command created and tested (create + update)
- [x] Successfully pushed a test post to Notion and verified it appeared
- [x] GitHub Action created for daily pull (`.github/workflows/notion-sync.yml`)
- [ ] **Action running successfully on GitHub** — failed due to stale `requirements.txt` (fixed Feb 11, awaiting re-run)
- [ ] First CSV-free planning session completed

---

## 5. PHASE 2: METRICS SCRAPING & AUTO ALT-TEXT

**Estimated time:** 3-5 hours (plus API approval waiting time)  
**Dependencies:** Phase 1 complete (GitHub Action running)  
**Outcome:** Metrics and visual descriptions update automatically every week  
**Status:** ⬜ NOT STARTED

### 2A: LinkedIn Metrics — API Route

**Application process:**

1. Go to https://www.linkedin.com/developers/
2. Click **Create App**
3. Fill in:
   - App name: `Titan Content Analytics`
   - LinkedIn Page: Select Titan PMR's company page
   - App logo: Any logo
4. Under **Products**, request access to:
   - **Marketing API** (for company page post analytics)
   - This requires admin approval — may take 1-7 days
5. Once approved, go to **Auth** tab:
   - Copy **Client ID** and **Client Secret**
   - Set redirect URL (can be `https://localhost:3000/callback` for local use)
6. Store as GitHub secrets:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`

**OAuth flow (one-time manual step):**

LinkedIn requires OAuth 2.0 with user authorization. The first time, Cam will need to:

1. Run a local script that opens a browser
2. Log in to LinkedIn and authorize the app
3. The script captures the access token and refresh token
4. Tokens stored as GitHub secrets: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_REFRESH_TOKEN`

The refresh token lasts 365 days. The GitHub Action will auto-refresh the access token (60-day expiry) using the refresh token before each pull.

**What the scraper pulls (per post):**

```python
# LinkedIn Marketing API endpoints
# GET /rest/posts?author=urn:li:organization:{org_id}
# GET /rest/socialActions/{post_urn}

# Per post data:
{
    "post_urn": "urn:li:share:1234567890",
    "text": "Full post caption",
    "created_at": "2026-02-11T09:00:00Z",
    "media_urls": ["https://media.licdn.com/..."],
    "media_type": "IMAGE",  # or VIDEO, ARTICLE, CAROUSEL
    "metrics": {
        "impressions": 1847,
        "unique_impressions": 1523,
        "reactions": 23,
        "comments": 7,
        "shares": 3,
        "clicks": 45,
        "engagement_rate": 1.78
    }
}
```

**For both company pages:** The script needs the organization IDs for both Titan PMR and Titanverse. These can be found in the LinkedIn page admin URL or via the API.

Store as GitHub secrets: `LINKEDIN_ORG_ID_TITANPMR`, `LINKEDIN_ORG_ID_TITANVERSE`

**Fallback — Shield App:**

If LinkedIn API approval is slow or the OAuth maintenance is too painful:

1. Sign up at https://shieldapp.ai (~£20/month)
2. Connect both LinkedIn company pages
3. Shield has an API: `GET /api/v1/posts?page_id={id}`
4. Store `SHIELD_API_KEY` as GitHub secret
5. Simpler script, more reliable, but costs money

### 2B: TikTok Metrics

**Application process:**

1. Go to https://developers.tiktok.com/
2. Register as a developer
3. Create an app
4. Request **Business API** access (for business account analytics)
5. Get **Client Key** and **Client Secret**
6. Store as GitHub secrets: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

### 2C: Auto Alt-Text Generation

**The pipeline:**

```
1. Metrics scraper downloads media:
   - Images: Full resolution download
   - Videos: Thumbnail/cover frame download
   - Carousels: Each slide as separate image

2. For each piece of media:
   → Send to Claude API (Sonnet) for description
   → Alt-text describes layout, text content, brand elements, tone

3. For carousels: Run for each slide, numbered

4. For videos: Use thumbnail + post caption to generate description
```

**Cost estimate:** Claude Sonnet vision calls cost approximately $0.003 per image. At ~30 posts/week = ~$0.09/week = ~$4/month.

### Phase 2 Completion Checklist

- [ ] LinkedIn Developer app created
- [ ] Marketing API access approved (expect 1-7 day wait)
- [ ] OAuth flow completed, tokens stored
- [ ] `pull_linkedin_metrics.py` pulling post data + metrics
- [ ] TikTok dev account created
- [ ] `pull_tiktok_metrics.py` pulling TikTok data
- [ ] Anthropic API key stored as secret
- [ ] `generate_alt_text.py` generating descriptions via Claude API
- [ ] Weekly GitHub Action running
- [ ] Video transcription via Whisper working
- [ ] Key quote extraction working
- [ ] Live tracker auto-updates on publish

---

## 6. PHASE 3: SMART PLANNING ENGINE

**Dependencies:** Phases 1-2 stable and generating data  
**Outcome:** Planning sessions become data-driven. Calendar auto-manages itself.  
**Status:** ⬜ NOT STARTED

### 3A: Performance Pattern Analysis

With structured metrics data accumulating weekly, Claude can calculate rolling averages, spot declining themes, identify overperforming patterns, and recommend content mix changes.

**Implementation:** No new scripts needed. Claude reads the `/data/metrics/` folder via MCP and analyses during planning sessions.

### 3B: Platform-Specific Caption Generation

When Cam drops a video or image into conversation, Claude analyses it and generates platform-specific captions (LinkedIn, TikTok, YouTube) while checking current calendar state.

### 3C: Cadence Validator

`scripts/cadence_validator.py` — See Section 13 for full specification.

### 3D: Live Tracker Updates

When a post is published (status changes to "Done" in Notion), curriculum tracker and quote bank auto-update.

### Phase 3 Completion Checklist

- [ ] Cadence validator script created and tested
- [ ] Auto-shuffle working via `notion_sync.py shuffle`
- [ ] Caption generation following platform-specific patterns
- [ ] Tracker auto-updates on publish

---

## 7. PHASE 4: CLIENT-READY PRODUCT (Future)

This section is intentionally high-level. Details to be specified when Phases 1-3 are proven.

### What Changes

- **Frontend UI:** Lovable or Next.js + Vercel (calendar view, analytics dashboard, caption generator)
- **Multi-client support:** Each client gets voice guide config, cadence rules config, theme curriculum
- **Onboarding flow:** Connect LinkedIn → Connect Notion → Configure voice → Set cadence → Go

---

## 8-14. [TECHNICAL SPECIFICATIONS — UNCHANGED]

*Sections 8-14 contain detailed technical specifications for repo structure, data schemas, API credentials, GitHub Actions, MCP configuration, cadence rules engine, and cost analysis. These sections remain valid and unchanged from the original blueprint. Refer to git history for full content.*

---

## 15. DECISION LOG

Track decisions made during the build so future sessions have context.

| Date | Decision | Reasoning | Status |
|------|----------|-----------|--------|
| 2026-02-11 | Keep Notion as posting tool | Client likes it, affordable, Notion Social works | ✅ Confirmed |
| 2026-02-11 | GitHub repo as source of truth | Versioned, MCP-accessible, Actions-native | ✅ Confirmed |
| 2026-02-11 | Python for scripts | Cam has familiarity, best Notion SDK | ✅ Confirmed |
| 2026-02-11 | Claude API for alt-text (not OpenAI) | Consistency with planning, better vision | ✅ Confirmed |
| 2026-02-11 | Try LinkedIn API before Shield | Free first, fallback ready | Pending |
| 2026-02-11 | MCP for live access | Kills the file upload/download cycle | ✅ Working |
| 2026-02-11 | No frontend until Phases 1-3 proven | Avoid over-engineering | ✅ Confirmed |
| 2026-02-11 | Switch from `notion-client` to raw `httpx` | SDK failed on Notion Social synced databases | ✅ Done |
| 2026-02-11 | Use `@notionhq/notion-mcp-server` | Official package, works correctly | ✅ Done |
| 2026-02-11 | Rename secret `NOTION_API_KEY` → `NOTION_TOKEN` | Consistency with official docs | ✅ Done |
| 2026-02-11 | Blueprint lives in repo only (not Claude Project) | Single source of truth, git-tracked, no drift | ✅ Done |

---

## 16. PROGRESS TRACKER

Update this as each step completes.

### Phase 0: Foundation — ✅ COMPLETE
| Step | Status | Date | Notes |
|------|--------|------|-------|
| Notion integration created | ✅ Done | Feb 11 | `Titan Content Sync` internal integration |
| API key stored as `NOTION_TOKEN` secret | ✅ Done | Feb 11 | |
| Database shared with integration | ✅ Done | Feb 11 | Via Connections menu |
| Database ID stored as `NOTION_DATABASE_ID` secret | ✅ Done | Feb 11 | |
| GitHub PAT generated | ✅ Done | Feb 11 | Stored locally for MCP |
| Claude Desktop installed | ✅ Done | Feb 11 | |
| MCP config created | ✅ Done | Feb 11 | GitHub + Notion servers |
| MCP tested (GitHub) | ✅ Done | Feb 11 | Can read repo files |
| MCP tested (Notion) | ✅ Done | Feb 11 | Can query database |
| Node.js installed | ✅ Done | Feb 11 | Required for npx/MCP |
| Repo folder structure created | ✅ Done | Feb 11 | scripts/, data/, strategy/, .github/ |
| requirements.txt created | ✅ Done | Feb 11 | `httpx>=0.27.0`, `python-dotenv>=1.0.0` |
| Strategy docs migrated to /strategy/ | ✅ Done | Feb 11 | All docs accessible via MCP |

### Phase 1: Notion Sync — ✅ COMPLETE (local), ⚠️ GitHub Action needs verification
| Step | Status | Date | Notes |
|------|--------|------|-------|
| Schema discovery | ✅ Done | Feb 11 | Auto-discovers on every pull |
| `notion_sync.py` pull working | ✅ Done | Feb 11 | 18KB script, raw httpx, 60s timeout |
| `notion_sync.py` push working | ✅ Done | Feb 11 | Create + update by Name matching |
| `data/notion_export.json` generated | ✅ Done | Feb 11 | 3.2MB, full database export |
| `data/notion_schema.json` generated | ✅ Done | Feb 11 | Auto-generated on pull |
| Test post pushed to Notion | ✅ Done | Feb 11 | Verified visible in Notion |
| GitHub Action created | ✅ Done | Feb 11 | `.github/workflows/notion-sync.yml` (daily 6am UTC) |
| **GitHub Action running successfully** | ⚠️ Failed | Feb 11 | `requirements.txt` had stale `notion-client` instead of `httpx`. Fixed Feb 11 — **awaiting re-run** |
| First CSV-free planning session | ⏳ Ready | | Blocked on Action working |

### Phase 2: Metrics + Alt-Text — ⬜ NOT STARTED
| Step | Status | Date | Notes |
|------|--------|------|-------|
| LinkedIn dev app created | ⬜ | | |
| LinkedIn API access approved | ⬜ | | Expect 1-7 day wait |
| OAuth flow completed | ⬜ | | |
| `pull_linkedin_metrics.py` working | ⬜ | | |
| TikTok dev account created | ⬜ | | |
| `pull_tiktok_metrics.py` working | ⬜ | | |
| Anthropic API key stored | ⬜ | | |
| `generate_alt_text.py` working | ⬜ | | |
| Weekly GitHub Action running | ⬜ | | |
| Video transcription via Whisper | ⬜ | | |
| Key quote extraction | ⬜ | | |
| Live tracker auto-updates | ⬜ | | |

### Phase 3: Smart Planning — ⬜ NOT STARTED
| Step | Status | Date | Notes |
|------|--------|------|-------|
| `cadence_validator.py` created | ⬜ | | |
| Auto-shuffle working | ⬜ | | |
| Caption generation per platform | ⬜ | | |
| Tracker auto-updates | ⬜ | | |

---

## CURRENT BLOCKER (as of Feb 11, 2026)

**GitHub Action for Notion Sync needs a successful run.** The `requirements.txt` was fixed (swapped `notion-client` for `httpx`). Cam needs to re-run the workflow from GitHub Actions tab. Once that passes, Phase 1 is fully complete and we can move to Phase 2 or do a CSV-free planning session.

---

## HOW TO USE THIS DOCUMENT

### If Starting a New Claude Conversation

Upload or reference this file and say:

> "I'm building the Titan Content Automation system. Here's the blueprint. I'm currently on [Phase X, Step Y]. Let's continue from there."

Claude will have full context of the architecture, decisions, and specifications.

### If Working Alone (Without Claude)

Follow the Phase 0 checklist step by step. Everything is documented with enough detail to execute independently.

### If Onboarding a Developer

This document is the complete spec. A developer should be able to read it and build the entire system without additional context.

---

*Version 3.0 | February 11, 2026*  
*This document lives in the repo root as the single source of truth.*  
*Update the Progress Tracker as steps complete.*  
*Previous version (v2.0) had all progress checkboxes as unchecked — corrected in v3.0.*
