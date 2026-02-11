# TITAN CONTENT OPS AUTOMATION â€” COMPLETE TECHNICAL BLUEPRINT

**Created:** February 11, 2026  
**Author:** Cam (Content Strategist, Titan PMR / Titanverse) + Claude  
**Status:** Phase 1 Complete — Testing locally
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

- **Titan PMR** â€” Cloud-based pharmacy management system (dispensing automation)
- **Titanverse** â€” Clinical services platform (consultations, prescribing)

Both brands post to LinkedIn company pages. Titan PMR also has a TikTok presence. Content is planned, designed, and published via a Notion database using Notion Social for direct LinkedIn posting.

### Current Pain Points (What We're Solving)

1. **CSV Hell:** To plan content, Cam exports the entire Notion database as CSV, brings it to Claude, plans the schedule, generates a new CSV, deletes all future posts in Notion, and reimports. This is done every time the calendar needs adjusting.

2. **Manual Metrics:** Cam manually inputs LinkedIn post metrics (impressions, reactions, comments, shares) into a GitHub repo. For each post, Cam also manually writes alt-text descriptions of every image, carousel slide, and video so Claude can understand visual context. This takes hours weekly.

3. **Stale Project Files:** Claude Projects stores static files that Cam manually uploads and versions. When strategy docs or trackers change, Cam has to delete and re-upload files. There's no live connection.

4. **No Automation:** Everything is manual â€” planning, metrics tracking, theme rotation checking, gap analysis, customer rotation. Cam is the system, and that doesn't scale.

### What Already Exists

- **GitHub Repo:** Large local repo (connected via Git) containing:
  - `/linkedin posts/titan/published/` â€” 216+ published posts with meta.json, caption.md, metrics.json, comments.md, alt-text.md
  - `/linkedin posts/titanverse/published/` â€” 38+ published posts
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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    GITHUB REPO                          â”‚
â”‚              (Single Source of Truth)                    â”‚
â”‚                                                         â”‚
â”‚  /strategy/     â†’ Voice guides, playbooks, trackers     â”‚
â”‚  /data/         â†’ Post history, metrics, quote banks    â”‚
â”‚  /scripts/      â†’ All automation scripts                â”‚
â”‚  /.github/      â†’ GitHub Actions (scheduled jobs)       â”‚
â”‚                                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           â”‚              â”‚              â”‚
     â”Œâ”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”
     â”‚  NOTION   â”‚  â”‚ CLAUDE  â”‚  â”‚  LINKEDIN   â”‚
     â”‚  DATABASE â”‚  â”‚  (MCP)  â”‚  â”‚  + TIKTOK   â”‚
     â”‚           â”‚  â”‚         â”‚  â”‚    APIs     â”‚
     â”‚ Calendar  â”‚  â”‚ Live    â”‚  â”‚             â”‚
     â”‚ + Notion  â”‚  â”‚ access  â”‚  â”‚ Metrics +   â”‚
     â”‚ Social    â”‚  â”‚ to repo â”‚  â”‚ media URLs  â”‚
     â”‚ (posting) â”‚  â”‚ + Notionâ”‚  â”‚             â”‚
     â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
           â”‚              â”‚              â”‚
           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                          â”‚
                   â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”
                   â”‚ CLAUDE API  â”‚
                   â”‚ (Vision)    â”‚
                   â”‚             â”‚
                   â”‚ Auto alt-   â”‚
                   â”‚ text for    â”‚
                   â”‚ images +    â”‚
                   â”‚ videos      â”‚
                   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Data Flow

```
PLANNING:
  Claude reads Notion (via MCP or synced JSON in repo)
  â†’ Claude generates schedule
  â†’ Script pushes to Notion via API
  â†’ Cam publishes via Notion Social

METRICS:
  GitHub Action runs weekly
  â†’ Pulls post data from LinkedIn API + TikTok API
  â†’ Downloads media (images, video thumbnails)
  â†’ Sends media to Claude API for alt-text generation
  â†’ Saves structured JSON to repo
  â†’ Commits automatically

LIVE PLANNING:
  Cam opens Claude Desktop with MCP
  â†’ Claude reads live repo (strategy docs, metrics, trackers)
  â†’ Claude reads live Notion (current calendar)
  â†’ Claude plans with full context
  â†’ Changes push directly to Notion
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

---

## 3. PHASE 0: FOUNDATION SETUP

**Estimated time:** 1-2 hours  
**Dependencies:** None  
**Outcome:** All API keys stored, MCP connected, repo structure ready

### Step 0.1 â€” Notion API Integration

**URL:** https://www.notion.so/my-integrations

1. Click **"New integration"**
2. Configuration:
   - **Name:** `Titan Content Sync`
   - **Associated workspace:** [Cam's workspace with the Social Media Database]
   - **Type:** Internal
   - **Capabilities:**
     - âœ… Read content
     - âœ… Update content
     - âœ… Insert content
     - âŒ No user information needed
3. Click **Submit**
4. Copy the **Internal Integration Secret** (starts with `ntn_`)
5. Store as GitHub secret:
   - Repo â†’ Settings â†’ Secrets and variables â†’ Actions â†’ New repository secret
   - **Name:** `NOTION_API_KEY`
   - **Value:** the `ntn_` key

**Cost:** Free (included with any Notion plan)

### Step 0.2 â€” Share Database with Integration

1. Open **Titan Social Media Database** in Notion (as full page)
2. Click `...` menu (top right) â†’ **Connections**
3. Search for `Titan Content Sync` â†’ Connect
4. Get **Database ID** from URL:
   - URL format: `https://www.notion.so/workspace/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?v=YYYY`
   - The `XXXXX...` part (32 hex characters) is the database ID
   - Sometimes it's formatted with hyphens: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Either format works with the API
5. Store as GitHub secret:
   - **Name:** `NOTION_DATABASE_ID`
   - **Value:** the 32-character ID

### Step 0.3 â€” Claude MCP Setup

**What MCP does:** Gives Claude Desktop direct, live access to your GitHub repo and Notion database during conversations. No more uploading files.

**Install Claude Desktop:** https://claude.ai/download (macOS or Windows)

**Configure MCP servers:**

1. Open Claude Desktop
2. Go to Settings â†’ Developer â†’ Edit Config
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
        "@modelcontextprotocol/server-notion"
      ],
      "env": {
        "NOTION_API_KEY": "<YOUR_NOTION_NTN_KEY>"
      }
    }
  }
}
```

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

### Step 0.4 â€” Repository Structure

Create these directories and files in the repo:

```
titan-content-repo/                    (or whatever the repo is named)
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ notion_sync.py                 â† Phase 1: Notion read/write
â”‚   â”œâ”€â”€ pull_linkedin_metrics.py       â† Phase 2: LinkedIn API scraper
â”‚   â”œâ”€â”€ pull_tiktok_metrics.py         â† Phase 2: TikTok API scraper
â”‚   â”œâ”€â”€ generate_alt_text.py           â† Phase 2: Vision API descriptions
â”‚   â”œâ”€â”€ cadence_validator.py           â† Phase 3: Rule enforcement engine
â”‚   â””â”€â”€ requirements.txt               â† Python dependencies
â”‚
â”œâ”€â”€ data/
â”‚   â”œâ”€â”€ notion_export.json             â† Auto-generated: current Notion state
â”‚   â”œâ”€â”€ metrics/
â”‚   â”‚   â”œâ”€â”€ linkedin/
â”‚   â”‚   â”‚   â”œâ”€â”€ titanpmr/              â† Per-post JSON files
â”‚   â”‚   â”‚   â””â”€â”€ titanverse/
â”‚   â”‚   â””â”€â”€ tiktok/
â”‚   â”‚       â””â”€â”€ titanpmr/
â”‚   â””â”€â”€ alt_text/
â”‚       â”œâ”€â”€ linkedin/                  â† Auto-generated descriptions
â”‚       â””â”€â”€ tiktok/
â”‚
â”œâ”€â”€ strategy/                          â† Moved from Claude Projects
â”‚   â”œâ”€â”€ TITAN_CONTENT_STRATEGY_MASTER_v2.md
â”‚   â”œâ”€â”€ TITAN_POSTING_CADENCE_v3.md
â”‚   â”œâ”€â”€ TITAN_VOICE_GUIDE.md
â”‚   â”œâ”€â”€ TITANVERSE_CONTENT_ENGINE_v2.md
â”‚   â”œâ”€â”€ TITANUP_2026_PRE_EVENT_STRATEGY_v3.md
â”‚   â”œâ”€â”€ TITANUP_2026_TARIQ_CONTENT_PLAN_v3.md
â”‚   â”œâ”€â”€ ... (all current project files)
â”‚   â”œâ”€â”€ titan_quote_bank.csv
â”‚   â”œâ”€â”€ titanverse_quote_bank.csv
â”‚   â”œâ”€â”€ titan_curriculum_tracker_v3.csv
â”‚   â””â”€â”€ titanverse_curriculum_tracker_v2.csv
â”‚
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ workflows/
â”‚       â”œâ”€â”€ notion_sync.yml            â† Daily Notion pull
â”‚       â”œâ”€â”€ linkedin_metrics.yml       â† Weekly LinkedIn metrics
â”‚       â”œâ”€â”€ tiktok_metrics.yml         â† Weekly TikTok metrics
â”‚       â””â”€â”€ alt_text_generation.yml    â† Runs after metrics pull
â”‚
â””â”€â”€ TITAN_CONTENT_AUTOMATION_BLUEPRINT.md  â† THIS FILE
```

### Step 0.5 â€” Python Environment

In the repo root, create `scripts/requirements.txt`:

```
notion-client>=2.0.0
anthropic>=0.18.0
openai>=1.0.0
requests>=2.31.0
Pillow>=10.0.0
```

**Local setup:**
```bash
cd scripts
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

GitHub Actions will install these automatically.

### Phase 0 Completion Checklist

- [ ] Notion integration created at notion.so/my-integrations
- [ ] API key stored as `NOTION_API_KEY` GitHub secret
- [ ] Database shared with integration (via Connections menu)
- [ ] Database ID stored as `NOTION_DATABASE_ID` GitHub secret
- [ ] GitHub PAT generated and stored locally
- [ ] Claude Desktop installed
- [ ] MCP config file created with GitHub + Notion servers
- [ ] Claude Desktop can read from GitHub repo (tested)
- [ ] Claude Desktop can query Notion (tested)
- [ ] Repo folder structure created
- [ ] `scripts/requirements.txt` created
- [ ] Strategy docs copied to `/strategy/` in repo (or plan to migrate)

---

## 4. PHASE 1: NOTION BIDIRECTIONAL SYNC

**Estimated time:** 2-3 hours (building together with Claude)  
**Dependencies:** Phase 0 complete  
**Outcome:** Never export/import a CSV again

### What the Script Does

`scripts/notion_sync.py` has three commands:

#### Command 1: `pull`
```bash
python scripts/notion_sync.py pull
```
- Reads ALL rows from the Notion Social Media Database via API
- Converts to structured JSON
- Saves to `/data/notion_export.json`
- When run via GitHub Action, auto-commits the file

**Notion API call:**
```python
from notion_client import Client

notion = Client(auth=os.environ["NOTION_API_KEY"])
database_id = os.environ["NOTION_DATABASE_ID"]

results = notion.databases.query(database_id=database_id)
# Paginate if >100 rows:
all_results = []
while True:
    response = notion.databases.query(
        database_id=database_id,
        start_cursor=cursor if cursor else undefined
    )
    all_results.extend(response["results"])
    if not response["has_more"]:
        break
    cursor = response["next_cursor"]
```

**Property mapping (Notion property types â†’ JSON):**

| Notion Column | Notion Type | JSON Key | Extraction |
|---------------|-------------|----------|------------|
| Name | title | `name` | `page["properties"]["Name"]["title"][0]["plain_text"]` |
| Campaign | select or text | `campaign` | Depends on property type |
| Content Type | select | `content_type` | `["properties"]["Content Type"]["select"]["name"]` |
| Platforms | select or text | `platform` | Check property type |
| Post Caption | rich_text | `caption` | `["properties"]["Post Caption"]["rich_text"][0]["plain_text"]` |
| Post Status | select or status | `status` | `["properties"]["Post Status"]["select"]["name"]` |
| Time | date | `date` | `["properties"]["Time"]["date"]["start"]` |
| Phase | select or text | `phase` | Check property type |
| Idea | rich_text | `idea` | Full rich text extraction |
| Likes | number | `likes` | `["properties"]["Likes"]["number"]` |
| Comments | number | `comments` | `["properties"]["Comments"]["number"]` |
| Shares | number | `shares` | `["properties"]["Shares"]["number"]` |
| Views | number | `views` | `["properties"]["Views"]["number"]` |
| Media | files or url | `media` | Extract file URLs |
| Post URL | url | `post_url` | `["properties"]["Post URL"]["url"]` |

**IMPORTANT:** The exact property types need to be discovered on first run. The script should call `notion.databases.retrieve(database_id)` first to inspect the schema, then map properties dynamically. Notion property types can be: `title`, `rich_text`, `number`, `select`, `multi_select`, `date`, `url`, `files`, `checkbox`, `status`, etc.

**First-run schema discovery:**
```python
db = notion.databases.retrieve(database_id=database_id)
for prop_name, prop_config in db["properties"].items():
    print(f"{prop_name}: {prop_config['type']}")
```

Run this FIRST to see exact types, then build the extraction logic.

#### Command 2: `push`
```bash
python scripts/notion_sync.py push schedule.json
```
- Reads a JSON file containing new/updated posts
- For each post:
  - Queries Notion for existing page with matching Name
  - If found â†’ UPDATE (patch properties)
  - If not found â†’ CREATE (new page)
- Logs all actions

**Create a page:**
```python
notion.pages.create(
    parent={"database_id": database_id},
    properties={
        "Name": {"title": [{"text": {"content": post["name"]}}]},
        "Content Type": {"select": {"name": post["content_type"]}},
        "Platforms": {"select": {"name": post["platform"]}},  # or rich_text
        "Time": {"date": {"start": post["date"]}},
        "Post Status": {"select": {"name": "Concept for Review"}},
        "Campaign": {"select": {"name": post["campaign"]}},  # or rich_text
        "Phase": {"select": {"name": post["phase"]}},  # or rich_text
        "Post Caption": {"rich_text": [{"text": {"content": post["caption"]}}]},
        "Idea": {"rich_text": [{"text": {"content": post["idea"]}}]},
    }
)
```

**Update a page:**
```python
notion.pages.update(
    page_id=existing_page_id,
    properties={
        "Time": {"date": {"start": new_date}},
        "Campaign": {"select": {"name": new_campaign}},
        # Only update fields that changed
    }
)
```

**Finding existing pages by Name:**
```python
results = notion.databases.query(
    database_id=database_id,
    filter={"property": "Name", "title": {"equals": post_name}}
)
if results["results"]:
    existing_page = results["results"][0]
    page_id = existing_page["id"]
```

#### Command 3: `shuffle`
```bash
python scripts/notion_sync.py shuffle --urgent "TITAN_BreakingNews" --date "2026-03-15" --platform "LI-PAGE@titanpmr"
```
- Pulls current schedule from Notion
- Inserts the urgent post on the specified date
- Runs cadence validator (see Phase 3 / Section 13)
- If conflicts detected, shifts displaced posts forward
- Applies minimum moves to restore valid cadence
- Shows proposed changes for approval
- Pushes approved changes to Notion

This command is Phase 3 functionality but the flag/placeholder should exist from Phase 1.

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

```yaml
# .github/workflows/notion_sync.yml
name: Notion Sync

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6am UTC
  workflow_dispatch:        # Manual trigger

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
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: python scripts/notion_sync.py pull
      
      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/notion_export.json
          git diff --staged --quiet || git commit -m "Auto-sync: Notion pull $(date +%Y-%m-%d)"
          git push
```

### Phase 1 Completion Checklist

- [ ] `scripts/notion_sync.py` created with `pull` command
- [ ] First pull executed â€” JSON file in `/data/notion_export.json`
- [ ] Schema discovery run â€” property types documented
- [ ] `push` command created and tested (create + update)
- [ ] Successfully pushed a test post to Notion and verified it appeared
- [ ] GitHub Action created for daily pull
- [ ] Action tested and running
- [ ] Full planning session completed using live Notion data (no CSV)

---

## 5. PHASE 2: METRICS SCRAPING & AUTO ALT-TEXT

**Estimated time:** 3-5 hours (plus API approval waiting time)  
**Dependencies:** Phase 1 complete  
**Outcome:** Metrics and visual descriptions update automatically every week

### 2A: LinkedIn Metrics â€” API Route

**Application process:**

1. Go to https://www.linkedin.com/developers/
2. Click **Create App**
3. Fill in:
   - App name: `Titan Content Analytics`
   - LinkedIn Page: Select Titan PMR's company page
   - App logo: Any logo
4. Under **Products**, request access to:
   - **Marketing API** (for company page post analytics)
   - This requires admin approval â€” may take 1-7 days
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

**Fallback â€” Shield App:**

If LinkedIn API approval is slow or the OAuth maintenance is too painful:

1. Sign up at https://shieldapp.ai (~Â£20/month)
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

**What the scraper pulls:**

```python
# TikTok Business API
# GET /business/get/videos/
{
    "video_id": "1234567890",
    "title": "Video caption",
    "create_time": 1707648000,
    "cover_image_url": "https://...",
    "video_url": "https://...",
    "metrics": {
        "views": 5200,
        "likes": 340,
        "comments": 28,
        "shares": 15
    }
}
```

### 2C: Auto Alt-Text Generation

**The pipeline:**

```
1. Metrics scraper downloads media:
   - Images: Full resolution download
   - Videos: Thumbnail/cover frame download
   - Carousels: Each slide as separate image (LinkedIn API provides these)

2. For each piece of media:
   anthropic_client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
   
   response = anthropic_client.messages.create(
       model="claude-sonnet-4-20250514",
       max_tokens=500,
       messages=[{
           "role": "user",
           "content": [
               {
                   "type": "image",
                   "source": {
                       "type": "base64",
                       "media_type": "image/jpeg",
                       "data": base64_image_data
                   }
               },
               {
                   "type": "text",
                   "text": """Describe this LinkedIn post image for a content strategist. Include:
                   - Layout and visual style (colours, typography, design elements)
                   - All text content visible in the image (exact words)
                   - Brand elements (logos, gradients, URLs)
                   - Customer name and pharmacy if visible
                   - Content theme (quote card, stat graphic, carousel slide, etc.)
                   - Overall tone and impression
                   Keep it factual and detailed. 2-4 sentences."""
               }
           ]
       }]
   )
   
   alt_text = response.content[0].text

3. For carousels: Run the above for each slide, number them:
   "Slide 1: [description]. Slide 2: [description]. ..."

4. For videos: Use thumbnail + post caption to generate:
   "Video thumbnail shows [description]. Caption context: [first 200 chars of caption]. 
    Video type: [estimated from caption - interview/clip/montage/talking head]."
```

**Store ANTHROPIC_API_KEY as GitHub secret.** This is Cam's existing API key (already has one from previous OpenAI setup â€” but this needs to be an Anthropic key for Claude API).

**Cost estimate:** Claude Sonnet vision calls cost approximately $0.003 per image. At ~30 posts/week = ~$0.09/week = ~$4/month.

### 2D: Output Format

Each post gets a JSON file in `/data/metrics/linkedin/titanpmr/` (or titanverse):

**Filename:** `{YYYY-MM-DD}_{post_name}.json`

```json
{
  "name": "TITAN_AbsoluteAgony_Jeet",
  "post_urn": "urn:li:share:1234567890",
  "platform": "LI-PAGE@titanpmr",
  "date_published": "2026-02-11",
  "content_type": "Single Image",
  "campaign": "HEAD OFFICE",
  "caption": "Full LinkedIn caption text...",
  "metrics": {
    "impressions": 1847,
    "unique_impressions": 1523,
    "reactions": 23,
    "comments": 7,
    "shares": 3,
    "clicks": 45,
    "engagement_rate": 1.78,
    "pulled_at": "2026-02-18T07:00:00Z"
  },
  "media": [
    {
      "type": "image",
      "url": "https://media.licdn.com/...",
      "alt_text": "Quote card on dark navy background. Large white text reads 'It was absolute agony.' Attribution below: Jeet, [Pharmacy Name]. Titan PMR blue gradient accent strip on left edge. Professional, stark tone. Customer voice format.",
      "generated_at": "2026-02-18T07:05:00Z"
    }
  ],
  "notable_comments": []
}
```

### GitHub Action: Weekly Metrics Pull

```yaml
# .github/workflows/linkedin_metrics.yml
name: LinkedIn Metrics Pull

on:
  schedule:
    - cron: '0 7 * * 1'  # Every Monday at 7am UTC
  workflow_dispatch:

jobs:
  pull-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install -r scripts/requirements.txt
      
      - name: Refresh LinkedIn token
        env:
          LINKEDIN_CLIENT_ID: ${{ secrets.LINKEDIN_CLIENT_ID }}
          LINKEDIN_CLIENT_SECRET: ${{ secrets.LINKEDIN_CLIENT_SECRET }}
          LINKEDIN_REFRESH_TOKEN: ${{ secrets.LINKEDIN_REFRESH_TOKEN }}
        run: python scripts/refresh_linkedin_token.py
      
      - name: Pull LinkedIn metrics
        env:
          LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}
          LINKEDIN_ORG_ID_TITANPMR: ${{ secrets.LINKEDIN_ORG_ID_TITANPMR }}
          LINKEDIN_ORG_ID_TITANVERSE: ${{ secrets.LINKEDIN_ORG_ID_TITANVERSE }}
        run: python scripts/pull_linkedin_metrics.py
      
      - name: Generate alt text
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: python scripts/generate_alt_text.py
      
      - name: Commit
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Auto: LinkedIn metrics $(date +%Y-%m-%d)"
          git push
```

### Phase 2 Completion Checklist

- [ ] LinkedIn Developer app created
- [ ] Marketing API access approved
- [ ] OAuth flow completed, tokens stored
- [ ] `pull_linkedin_metrics.py` pulling post data + metrics
- [ ] `pull_tiktok_metrics.py` pulling TikTok data
- [ ] `generate_alt_text.py` generating descriptions via Claude API
- [ ] Anthropic API key stored as secret
- [ ] GitHub Actions running weekly
- [ ] First full automated pull completed and committed
- [ ] Claude can access metrics + alt text in planning sessions via MCP

---

## 6. PHASE 3: SMART PLANNING ENGINE

**Dependencies:** Phases 1-2 stable and generating data  
**Outcome:** Planning sessions become data-driven. Calendar auto-manages itself.

### 3A: Performance Pattern Analysis

With structured metrics data accumulating weekly, Claude can:

- Calculate rolling averages by content type, day, campaign, customer
- Identify declining themes (engagement trending down over 4+ posts)
- Spot overperforming patterns (specific hook structures, visual styles)
- Recommend content mix changes based on actual data
- Compare Titan PMR vs Titanverse performance trends

**Implementation:** No new scripts needed. Claude reads the `/data/metrics/` folder via MCP and analyses during planning sessions. The data structure from Phase 2 already supports this.

### 3B: Platform-Specific Caption Generation

When Cam drops a video or image into conversation:

1. Claude analyses visual content (same pipeline as alt-text but interactive)
2. Checks current calendar state via Notion MCP
3. Generates captions per platform:

**LinkedIn:** Follows patterns from `TITAN_VOICE_GUIDE.md`:
- Hook line (curiosity gap, unexpected angle, "I've noticed..." pattern)
- Story/observation (2-3 paragraphs)
- CTA or question
- 3-5 hashtags max
- Matches proven structures from top-performing posts in metrics data

**TikTok:** Short, punchy:
- Hook in first 2 seconds of caption
- 1-2 sentences max
- Trending hashtags
- Call to action

**YouTube (when relevant):** Follows `TITAN_YOUTUBE_PLAYBOOK_CONSOLIDATED.md`:
- Thumbnail-bait title pattern
- Description with timestamps
- Tags based on theme

4. Suggests optimal posting day based on:
   - Content type (video â†’ Tuesday, single â†’ Monday, etc.)
   - Current calendar gaps
   - Customer rotation status
   - Theme coverage balance

### 3C: Cadence Validator

`scripts/cadence_validator.py` â€” See Section 13 for full specification.

This is the rule enforcement engine. Called by `notion_sync.py shuffle` and also available standalone:

```bash
python scripts/cadence_validator.py validate data/notion_export.json
```

Outputs:
```
âœ… Titan PMR: No weekday gaps > 1 day
âš ï¸  Titanverse: 3-day gap Apr 16 â†’ Apr 21
âœ… Carousel limit: Max 1/brand/week respected
âš ï¸  Customer rotation: Rahul featured Feb 17 and Feb 24 (1 week gap, need 3)
âœ… Theme rotation: No theme repeated within 2 weeks
```

### 3D: Live Tracker Updates

When a post is published (status changes to "Done" in Notion):
- Curriculum tracker auto-updates (theme coverage, times_covered, last_covered date)
- Quote bank marks quotes as used
- Customer rotation tracker updates last-featured date

**Implementation:** Part of the daily Notion pull Action. After pulling, the script checks for newly published posts and updates the CSV trackers in `/strategy/`.

### Phase 3 Completion Checklist

- [ ] Cadence validator script created and tested
- [ ] Auto-shuffle working via `notion_sync.py shuffle`
- [ ] Caption generation following platform-specific patterns
- [ ] Curriculum trackers auto-updating on publish
- [ ] Quote bank auto-marking used quotes
- [ ] Full planning session using data-driven recommendations

---

## 7. PHASE 4: CLIENT-READY PRODUCT (Future)

This section is intentionally high-level. Details to be specified when Phases 1-3 are proven.

### What Changes

- **Frontend UI:** Lovable or Next.js + Vercel
  - Calendar view with drag-and-drop
  - Cadence rule violations highlighted in real-time
  - Analytics dashboard
  - Caption generator interface
  - Multi-brand toggle

- **Multi-client support:**
  - Each client gets: voice guide config, cadence rules config, theme curriculum
  - Shared infrastructure, client-specific data
  - Separate Notion databases per client (or one with client filter)

- **Onboarding flow:**
  - Connect LinkedIn page â†’ OAuth
  - Connect Notion database â†’ API key
  - Configure voice guide â†’ template questions
  - Set cadence rules â†’ form builder
  - Go

### Revenue Model Sketch

| Tier | What | Price Point |
|------|------|-------------|
| Setup | Voice guide, cadence rules, theme curriculum config | One-time fee |
| Basic | Automated metrics + weekly planning session with Claude | Monthly |
| Pro | Full caption generation + auto-scheduling + analytics dashboard | Monthly |
| Enterprise | Custom UI, multiple brands, dedicated strategy | Monthly |

---

## 8. REPO STRUCTURE SPECIFICATION

### Final Target State

```
titan-content-repo/
â”‚
â”œâ”€â”€ README.md
â”œâ”€â”€ TITAN_CONTENT_AUTOMATION_BLUEPRINT.md    â† THIS FILE
â”‚
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â”œâ”€â”€ notion_sync.py                       â† Notion CRUD operations
â”‚   â”œâ”€â”€ pull_linkedin_metrics.py             â† LinkedIn API scraper
â”‚   â”œâ”€â”€ pull_tiktok_metrics.py               â† TikTok API scraper
â”‚   â”œâ”€â”€ refresh_linkedin_token.py            â† OAuth token refresh
â”‚   â”œâ”€â”€ generate_alt_text.py                 â† Claude Vision API pipeline
â”‚   â”œâ”€â”€ transcribe_videos.py                 â† OpenAI Whisper transcription
â”‚   â”œâ”€â”€ cadence_validator.py                 â† Schedule rule enforcement
â”‚   â””â”€â”€ update_trackers.py                   â† Auto-update curriculum/quote trackers
â”‚
â”œâ”€â”€ data/
â”‚   â”œâ”€â”€ notion_export.json                   â† Latest Notion database state
â”‚   â”œâ”€â”€ metrics/
â”‚   â”‚   â”œâ”€â”€ linkedin/
â”‚   â”‚   â”‚   â”œâ”€â”€ titanpmr/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ 2026-02-11_TITAN_AbsoluteAgony_Jeet.json
â”‚   â”‚   â”‚   â””â”€â”€ titanverse/
â”‚   â”‚   â”‚       â””â”€â”€ 2026-02-12_TV_YusufVoiceFirst.json
â”‚   â”‚   â””â”€â”€ tiktok/
â”‚   â”‚       â””â”€â”€ titanpmr/
â”‚   â”‚           â””â”€â”€ 2026-02-11_TITAN_HOD_OperatingWithoutDoubleCover.json
â”‚   â””â”€â”€ schedules/
â”‚       â””â”€â”€ 2026-02-11_schedule_push.json    â† Archive of pushed schedules
â”‚
â”œâ”€â”€ strategy/
â”‚   â”œâ”€â”€ TITAN_CONTENT_STRATEGY_MASTER_v2.md
â”‚   â”œâ”€â”€ TITAN_POSTING_CADENCE_v3.md
â”‚   â”œâ”€â”€ TITANVERSE_CONTENT_ENGINE_v2.md
â”‚   â”œâ”€â”€ TITAN_VOICE_GUIDE.md
â”‚   â”œâ”€â”€ TITAN_VISUAL_DESIGN_SYSTEM.md
â”‚   â”œâ”€â”€ TITANUP_2026_PRE_EVENT_STRATEGY_v3.md
â”‚   â”œâ”€â”€ TITANUP_2026_TARIQ_CONTENT_PLAN_v3.md
â”‚   â”œâ”€â”€ TITANUP_VIDEO_PRODUCTION_BRIEF.md
â”‚   â”œâ”€â”€ TitanUp_Filming_Proposal_UPDATED.md
â”‚   â”œâ”€â”€ ANNUAL_CONTENT_MATRIX_v3.md
â”‚   â”œâ”€â”€ CONTENT_TYPE_REFERENCE_MATRIX_UPDATED.md
â”‚   â”œâ”€â”€ PERFORMANCE_INSIGHTS_UPDATED.md
â”‚   â”œâ”€â”€ TITAN_LEADERSHIP_TEAM_REFERENCE.md
â”‚   â”œâ”€â”€ TITAN_ECOSYSTEM_EXPLAINER.md
â”‚   â”œâ”€â”€ TITAN_YOUTUBE_PLAYBOOK_CONSOLIDATED.md
â”‚   â”œâ”€â”€ BLOG_CASE_STUDY_PLAYBOOK.md
â”‚   â”œâ”€â”€ THINKING_LIKE_SEMRUSH.md
â”‚   â”œâ”€â”€ VIRAL_SCRIPTS_ANALYSIS.md
â”‚   â”œâ”€â”€ NOTION_CSV_EXPORT_GUIDE.md           â† Eventually deprecated
â”‚   â”œâ”€â”€ titan_quote_bank.csv
â”‚   â”œâ”€â”€ titanverse_quote_bank.csv
â”‚   â”œâ”€â”€ titan_curriculum_tracker_v3.csv
â”‚   â””â”€â”€ titanverse_curriculum_tracker_v2.csv
â”‚
â”œâ”€â”€ linkedin_posts/                          â† Existing post archive
â”‚   â”œâ”€â”€ titan/
â”‚   â”‚   â”œâ”€â”€ published/
â”‚   â”‚   â”œâ”€â”€ unpublished/
â”‚   â”‚   â””â”€â”€ needs-metrics/
â”‚   â””â”€â”€ titanverse/
â”‚       â”œâ”€â”€ published/
â”‚       â”œâ”€â”€ unpublished/
â”‚       â””â”€â”€ needs-metrics/
â”‚
â””â”€â”€ .github/
    â””â”€â”€ workflows/
        â”œâ”€â”€ notion_sync.yml                  â† Daily at 6am UTC
        â”œâ”€â”€ linkedin_metrics.yml             â† Monday 7am UTC
        â”œâ”€â”€ tiktok_metrics.yml               â† Monday 7:30am UTC
        â””â”€â”€ alt_text_generation.yml          â† Triggered after metrics
```

---

## 9. DATA SCHEMA SPECIFICATIONS

### Notion Export JSON (`data/notion_export.json`)

```json
{
  "exported_at": "2026-02-11T06:00:00Z",
  "database_id": "abc123...",
  "total_rows": 151,
  "schema": {
    "Name": "title",
    "Campaign": "select",
    "Content Type": "select"
  },
  "posts": [
    {
      "page_id": "notion-page-uuid",
      "name": "TITAN_AbsoluteAgony_Jeet",
      "campaign": "HEAD OFFICE",
      "content_type": "Single Image",
      "platform": "LI-PAGE@titanpmr",
      "date": "2026-02-11",
      "status": "Concept for Review",
      "phase": "",
      "caption": "Full caption...",
      "idea": "Design brief...",
      "likes": 0,
      "comments": 0,
      "shares": 0,
      "views": 0,
      "post_url": "",
      "media": "",
      "asset_for_reviewal": "",
      "assigned": "",
      "sourced_assets": ""
    }
  ]
}
```

### LinkedIn Metrics JSON (per post)

See Section 5, subsection 2D for full schema.

### Schedule Push JSON

See Section 4, "Push Schedule JSON Format" for full schema.

---

## 10. API REFERENCE & CREDENTIALS

### All Required Secrets (GitHub Repository Secrets)

| Secret Name | Source | Phase | Required |
|-------------|--------|-------|----------|
| `NOTION_API_KEY` | notion.so/my-integrations | 0 | âœ… |
| `NOTION_DATABASE_ID` | Notion database URL | 0 | âœ… |
| `ANTHROPIC_API_KEY` | console.anthropic.com | 2 | âœ… |
| `LINKEDIN_CLIENT_ID` | linkedin.com/developers | 2 | âœ… |
| `LINKEDIN_CLIENT_SECRET` | linkedin.com/developers | 2 | âœ… |
| `LINKEDIN_ACCESS_TOKEN` | OAuth flow | 2 | âœ… |
| `LINKEDIN_REFRESH_TOKEN` | OAuth flow | 2 | âœ… |
| `LINKEDIN_ORG_ID_TITANPMR` | LinkedIn page admin | 2 | âœ… |
| `LINKEDIN_ORG_ID_TITANVERSE` | LinkedIn page admin | 2 | âœ… |
| `TIKTOK_CLIENT_KEY` | developers.tiktok.com | 2 | âœ… |
| `TIKTOK_CLIENT_SECRET` | developers.tiktok.com | 2 | âœ… |
| `OPENAI_API_KEY` | platform.openai.com | 2 | âœ… (Cam already has) |

### Local-Only Credentials (NOT in GitHub)

| Credential | Where Stored | Purpose |
|------------|-------------|---------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Claude Desktop MCP config (local file) | MCP GitHub access |
| `NOTION_API_KEY` (copy) | Claude Desktop MCP config (local file) | MCP Notion access |

### API Documentation Links

| API | Docs URL |
|-----|----------|
| Notion API | https://developers.notion.com/reference |
| Notion SDK (Python) | https://github.com/ramnes/notion-sdk-py |
| LinkedIn Marketing API | https://learn.microsoft.com/en-us/linkedin/marketing/ |
| TikTok Business API | https://developers.tiktok.com/doc/business-api-overview |
| Claude API (Anthropic) | https://docs.anthropic.com/en/docs |
| GitHub Actions | https://docs.github.com/en/actions |

---

## 11. GITHUB ACTIONS SPECIFICATIONS

### Action 1: Daily Notion Sync
- **File:** `.github/workflows/notion_sync.yml`
- **Schedule:** Daily at 06:00 UTC
- **What it does:** Pulls full Notion database â†’ saves to `/data/notion_export.json` â†’ commits
- **Full YAML:** See Section 4

### Action 2: Weekly LinkedIn Metrics
- **File:** `.github/workflows/linkedin_metrics.yml`
- **Schedule:** Monday at 07:00 UTC
- **What it does:** Refreshes OAuth token â†’ pulls all posts from last 7 days â†’ downloads media â†’ generates alt text â†’ saves to `/data/metrics/linkedin/` â†’ commits
- **Full YAML:** See Section 5

### Action 3: Weekly TikTok Metrics
- **File:** `.github/workflows/tiktok_metrics.yml`
- **Schedule:** Monday at 07:30 UTC
- **What it does:** Pulls all TikTok posts from last 7 days â†’ downloads thumbnails â†’ generates alt text â†’ saves to `/data/metrics/tiktok/` â†’ commits

### Action 4: Tracker Updates
- **File:** `.github/workflows/update_trackers.yml`
- **Trigger:** After notion_sync.yml completes (workflow_run)
- **What it does:** Checks for newly published posts â†’ updates curriculum trackers â†’ updates quote bank usage â†’ commits

---

## 12. MCP CONFIGURATION

### Claude Desktop Config File Location

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Full Config

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    },
    "notion": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-notion"
      ],
      "env": {
        "NOTION_API_KEY": "ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Prerequisites

- **Node.js** must be installed (for `npx`): https://nodejs.org/ (LTS version)
- **npm** comes with Node.js

### Testing MCP

After config and restart, in Claude Desktop:
- "List the files in [repo-owner]/[repo-name]"
- "Read the file strategy/TITAN_POSTING_CADENCE_v3.md from my repo"
- "Query my Notion database and show me posts scheduled for next week"

---

## 13. CADENCE RULES ENGINE SPECIFICATION

### Rules to Enforce (from TITAN_POSTING_CADENCE_v3.md)

```python
RULES = {
    # Posting frequency
    "titan_posts_per_week_normal": (3, 3),          # min, max
    "titanverse_posts_per_week_normal": (2, 3),
    "titan_posts_per_week_event": (4, 5),
    "titanverse_posts_per_week_event": (3, 3),
    
    # Gap rules
    "max_weekday_gap_days": 1,                       # Per brand, Mon-Fri
    
    # Format limits
    "max_carousels_per_brand_per_week": 1,
    "max_carousels_total_per_week": 2,
    "min_memes_per_week": 1,                         # Across both brands
    "min_industry_posts_per_week": 1,                # Across both brands
    
    # Rotation
    "customer_min_gap_weeks": 3,
    "theme_min_gap_weeks": 2,
    "industry_theme_min_gap_weeks": 3,
    "same_quote_min_gap_months": 3,
    
    # Day optimization (warnings, not hard rules)
    "video_preferred_days": ["Tuesday", "Wednesday"],
    "clips_preferred_days": ["Wednesday", "Thursday"],
    "quotes_preferred_days": ["Monday"],
    "light_content_preferred_days": ["Friday"],
    "carousel_avoid_days": ["Friday"],
}
```

### Validation Output Format

```json
{
  "valid": false,
  "errors": [
    {
      "rule": "max_weekday_gap_days",
      "brand": "Titanverse", 
      "detail": "3-day gap: 2026-04-16 (Thu) â†’ 2026-04-21 (Mon)",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "rule": "video_preferred_days",
      "detail": "TITANUP_CampaignEdit (Video) scheduled on Friday â€” consider Tuesday or Wednesday",
      "severity": "warning"
    }
  ]
}
```

---

## 14. COST ANALYSIS

### Monthly Running Costs (Once Fully Built)

| Item | Cost/Month | Notes |
|------|-----------|-------|
| Notion (current plan) | Already paying | No change |
| Notion API | Free | Included |
| GitHub Actions | Free | Free tier: 2,000 mins/month |
| Claude API (alt-text) | ~Â£5 | ~120 images/month Ã— $0.003 |
| LinkedIn API | Free | If using Marketing API |
| TikTok API | Free | Business API |
| Shield App (if needed) | Â£20 | Only if LinkedIn API fails |
| **TOTAL** | **Â£5-25/month** | |

### One-Time Costs

| Item | Cost | Notes |
|------|------|-------|
| Claude Desktop | Free | Already available |
| Node.js | Free | For MCP |
| Time investment | ~10-15 hours | Across all phases |

---

## 15. DECISION LOG

Track decisions made during the build so future sessions have context.

| Date | Decision | Reasoning | Status |
|------|----------|-----------|--------|
| 2026-02-11 | Keep Notion as posting tool | Client likes it, affordable, Notion Social works | âœ… Confirmed |
| 2026-02-11 | GitHub repo as source of truth | Versioned, MCP-accessible, Actions-native | âœ… Confirmed |
| 2026-02-11 | Python for scripts | Cam has familiarity, best Notion SDK | âœ… Confirmed |
| 2026-02-11 | Claude API for alt-text (not OpenAI) | Consistency with planning, better vision | âœ… Confirmed |
| 2026-02-11 | Try LinkedIn API before Shield | Free first, fallback ready | Pending |
| 2026-02-11 | MCP for live access | Kills the file upload/download cycle | Pending setup |
| 2026-02-11 | No frontend until Phases 1-3 proven | Avoid over-engineering | âœ… Confirmed |
| 2026-02-11 | TitanUp SEED pushed to Feb 18 | Client decision | âœ… Done in CSV |

---

## 16. PROGRESS TRACKER

Update this as each step completes.

### Phase 0: Foundation
| Step | Status | Date Completed | Notes |
|------|--------|---------------|-------|
| Notion integration created | ✅ Done | | |
| API key stored as secret | ✅ Done | | |
| Database shared with integration | ✅ Done | | |
| Database ID stored as secret | ✅ Done | | |
| GitHub PAT generated | ✅ Done | | |
| Claude Desktop installed | ✅ Done | | |
| MCP config created | ✅ Done | | |
| MCP tested (GitHub) | ✅ Done | | |
| MCP tested (Notion) | ✅ Done | | |
| Node.js installed | ✅ Done | | |
| Repo folder structure created | ✅ Done | | |
| requirements.txt created | ✅ Done | | |

### Phase 1: Notion Sync
| Step | Status | Date Completed | Notes |
|------|--------|---------------|-------|
| Schema discovery run | ✅ Done (auto-discovers on every pull) | | |
| notion_sync.py pull working | ✅ Done | | |
| notion_sync.py push working | ✅ Done | | |
| GitHub Action (daily pull) | ✅ Done | | |
| First CSV-free planning session | ⏳ Ready to test | | |

### Phase 2: Metrics + Alt-Text
| Step | Status | Date Completed | Notes |
|------|--------|---------------|-------|
| LinkedIn dev app created | â¬œ Not started | | |
| LinkedIn API access approved | â¬œ Not started | | Expect 1-7 day wait |
| OAuth flow completed | â¬œ Not started | | |
| pull_linkedin_metrics.py working | â¬œ Not started | | |
| TikTok dev account created | â¬œ Not started | | |
| pull_tiktok_metrics.py working | â¬œ Not started | | |
| Anthropic API key stored | â¬œ Not started | | |
| generate_alt_text.py working | â¬œ Not started | | |
| Weekly GitHub Action running | â¬œ Not started | | |
| Video transcription via Whisper working | â¬œ Not started | | |
| Key quote extraction working | â¬œ Not started | | |
| Live tracker auto-updates on publish | â¬œ Not started | | |

### Phase 3: Smart Planning
| Step | Status | Date Completed | Notes |
|------|--------|---------------|-------|
| cadence_validator.py created | â¬œ Not started | | |
| Auto-shuffle working | â¬œ Not started | | |
| Caption generation per platform | â¬œ Not started | | |
| Tracker auto-updates | â¬œ Not started | | |

---

## 17. LIVE TRACKER UPDATES

### The Mental Model

**Repo = the past** (what was published, how it performed)  
**Notion = the future** (what's planned, what's scheduled)  
**Trackers = the bridge** (merged view of both, used for rotation decisions)

### How Trackers Stay Current

The daily Notion sync Action already pulls the full database. After each pull, an additional step checks for state changes:

**When a post moves to "Done" (published):**

```python
# In update_trackers.py

# 1. Load current notion export
# 2. Load previous notion export (committed yesterday)
# 3. Diff: find posts where status changed to "Done" since last pull

newly_published = [
    post for post in current_posts
    if post["status"] == "Done" 
    and get_previous_status(post["name"]) != "Done"
]

for post in newly_published:
    # Update curriculum tracker
    update_curriculum_tracker(
        theme=post["theme"],          # Derived from post name/campaign
        last_covered=post["date"],
        post_title=post["name"]
    )
    
    # Update quote bank (if post uses a customer quote)
    if post["campaign"] == "HEAD OFFICE" or is_quote_post(post):
        mark_quote_used(
            customer=extract_customer(post["name"]),
            post_number=post["name"]
        )
    
    # Update customer rotation
    update_customer_rotation(
        customer=extract_customer(post["name"]),
        last_featured=post["date"],
        brand=extract_brand(post["platform"])
    )
```

**When Claude plans future content:**

Claude reads BOTH the trackers (past) AND the Notion calendar (future) to make rotation decisions:

```
Planning query: "Is Rahul available for next week?"

Check 1: Curriculum tracker â†’ last featured Feb 24 (past, published)
Check 2: Notion calendar â†’ scheduled for Mar 5 (future, not yet published)
Result: "Rahul was last published Feb 24 and is scheduled Mar 5. 
         Next available after Mar 26 (3-week gap from Mar 5)."
```

This prevents double-booking a customer even when their future posts haven't published yet.

### GitHub Action Addition

Add this step to the daily `notion_sync.yml` after the pull:

```yaml
      - name: Update trackers
        run: python scripts/update_trackers.py
      
      - name: Commit all changes
        run: |
          git add data/ strategy/
          git diff --staged --quiet || git commit -m "Auto: sync + tracker update $(date +%Y-%m-%d)"
          git push
```

### Tracker File Updates

The existing CSV trackers get modified in place:

**`titan_curriculum_tracker_v3.csv`:**
- `last_covered` â†’ updated to publish date
- `times_covered` â†’ incremented by 1
- `last_post_title` â†’ set to post name

**`titan_quote_bank.csv`:**
- `used` â†’ set to "Yes"
- `used_in_post` â†’ set to post identifier

**`titanverse_curriculum_tracker_v2.csv` and `titanverse_quote_bank.csv`:**
- Same pattern

---

## 18. VIDEO TRANSCRIPTION PIPELINE

### Why Transcripts Matter

Alt-text describes what a video looks like. Transcripts capture what was said. For planning, Claude needs both â€” knowing that Tariq said "pharmacy is being killed by admin" in a specific clip means Claude can avoid reusing that exact talking point and can reference it accurately in future posts.

### The Pipeline

```
Video published on LinkedIn / TikTok
  â”‚
  â–¼
Weekly metrics scraper downloads video file
  â”‚
  â–¼
ffmpeg extracts audio track
  $ ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 audio.wav
  â”‚
  â–¼
Audio sent to OpenAI Whisper API
  â”‚
  â–¼
Timestamped transcript returned
  â”‚
  â–¼
Video thumbnail sent to Claude Vision API (existing alt-text pipeline)
  â”‚
  â–¼
Combined rich context file saved to repo
```

### Whisper API Integration

```python
# In scripts/transcribe_videos.py

import openai
from pathlib import Path

client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def transcribe_video(video_path: str) -> dict:
    # Extract audio
    audio_path = video_path.replace(".mp4", ".wav")
    os.system(f'ffmpeg -i "{video_path}" -vn -acodec pcm_s16le -ar 16000 "{audio_path}" -y')
    
    # Transcribe via Whisper
    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )
    
    # Clean up audio file
    os.remove(audio_path)
    
    return {
        "text": transcript.text,
        "segments": [
            {
                "start": seg.start,
                "end": seg.end, 
                "text": seg.text
            }
            for seg in transcript.segments
        ],
        "duration": transcript.segments[-1].end if transcript.segments else 0,
        "language": transcript.language
    }
```

### Updated Output Format (Video Posts)

The per-post JSON in `/data/metrics/` now includes transcripts for video content:

```json
{
  "name": "TITANUP_TariqPharmacyKilled",
  "post_urn": "urn:li:share:1234567890",
  "platform": "LI-PAGE@titanpmr",
  "date_published": "2026-03-09",
  "content_type": "Video",
  "campaign": "TitanUp 2026",
  "phase": "BUILD",
  "caption": "LinkedIn caption text...",
  "metrics": {
    "impressions": 3200,
    "reactions": 45,
    "comments": 12,
    "shares": 8,
    "engagement_rate": 2.03,
    "pulled_at": "2026-03-16T07:00:00Z"
  },
  "media": [
    {
      "type": "video",
      "url": "https://media.licdn.com/...",
      "thumbnail_url": "https://media.licdn.com/thumb/...",
      "alt_text": "Tariq Muhammad speaking directly to camera. Professional lighting, dark background. Titan PMR branding visible. Passionate delivery, gesturing with hands.",
      "transcript": {
        "full_text": "Pharmacy is being killed. Not by Amazon. Not by online prescriptions. It's being killed by admin. Every single day, pharmacists are drowning in paperwork that should have been automated ten years ago...",
        "segments": [
          {"start": 0.0, "end": 3.2, "text": "Pharmacy is being killed."},
          {"start": 3.2, "end": 5.8, "text": "Not by Amazon. Not by online prescriptions."},
          {"start": 5.8, "end": 8.1, "text": "It's being killed by admin."}
        ],
        "duration_seconds": 87,
        "key_quotes": [
          "Pharmacy is being killed by admin",
          "Pharmacists are drowning in paperwork that should have been automated ten years ago"
        ],
        "speakers": ["Tariq Muhammad"]
      },
      "generated_at": "2026-03-16T07:05:00Z"
    }
  ]
}
```

### Speaker Identification

Whisper doesn't identify speakers, just transcribes. For speaker identification:

**Simple approach (good enough for now):** The post name and campaign usually tell us who's speaking. `TITANUP_TariqPharmacyKilled` â†’ Tariq. `LEADERS_SajidWhatIsTitan` â†’ Sajid. Script maps known name patterns to speakers.

**Advanced approach (future):** Use a speaker diarization model to separate voices in multi-speaker videos (panels, interviews). Not needed for Phase 2 â€” most clips are single-speaker.

### Key Quote Extraction

After transcription, send the transcript to Claude API to extract key quotes:

```python
response = anthropic_client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=300,
    messages=[{
        "role": "user",
        "content": f"""Extract the 2-3 most impactful, quotable lines from this video transcript. 
        These should be the kind of lines that would work as standalone quote graphics.
        Return as a JSON array of strings.
        
        Transcript: {transcript_text}"""
    }]
)
```

This auto-populates potential quote bank entries from every video â€” quotes you might want to turn into future Single Image posts.

### Cost

| Item | Cost | Volume |
|------|------|--------|
| Whisper API | $0.006/min | ~60 mins/month = $0.36 |
| Claude API (key quote extraction) | ~$0.003/call | ~20 videos/month = $0.06 |
| ffmpeg | Free | Open source |
| **Monthly total** | **~$0.42** | Basically nothing |

### Additional GitHub Secret Required

| Secret Name | Source | Notes |
|-------------|--------|-------|
| `OPENAI_API_KEY` | platform.openai.com | Cam already has this |

### Otter.ai Note

Otter.ai's API is enterprise-only (no consumer API access). Since Cam already has an OpenAI API key and Whisper is cheaper and more controllable, use Whisper for all social media transcription. Continue using Otter separately for meeting/call transcription if desired â€” no integration needed.

---

## 19. PLATFORM METRICS DEPTH

### What Each API Actually Gives You (Admin-Level, Not Surface)

These are official authenticated APIs. You get the SAME data as logging in as the page admin.

#### LinkedIn Marketing API (Company Page Admin)

| Metric | Available | Notes |
|--------|-----------|-------|
| Impressions | âœ… | Total views of the post |
| Unique impressions | âœ… | Deduplicated viewers |
| Clicks | âœ… | All clicks (content, links, profile) |
| Click-through rate | âœ… | Clicks / impressions |
| Reactions (total) | âœ… | Sum of all reaction types |
| Reactions (by type) | âœ… | Like, Celebrate, Support, Love, Insightful, Funny â€” individually |
| Comments | âœ… | Total comment count |
| Shares | âœ… | Repost count |
| Engagement rate | âœ… | (Clicks + reactions + comments + shares) / impressions |
| Video views | âœ… | For video posts |
| Video completion rate | âœ… | What % watched to end |
| Follower count | âœ… | Current page followers |
| Follower growth | âœ… | Gain/loss over period |
| Follower demographics | âœ… | Industry, company size, job function, seniority, location |
| Post content + media URLs | âœ… | Full caption text, image/video file URLs |

#### TikTok Business API

| Metric | Available | Notes |
|--------|-----------|-------|
| Views | âœ… | Total video views |
| Likes | âœ… | |
| Comments | âœ… | |
| Shares | âœ… | |
| Average watch time | âœ… | In seconds |
| Total watch time | âœ… | |
| Video completion rate | âœ… | % who watched to end |
| Traffic source | âœ… | For You page, profile, search, following, other |
| Audience territories | âœ… | Country breakdown |
| Audience demographics | âœ… | Age ranges, gender split |
| Video URL + thumbnail | âœ… | Downloadable for transcription |

#### YouTube Data API v3

| Metric | Available | Notes |
|--------|-----------|-------|
| Views | âœ… | |
| Watch time (total) | âœ… | In minutes |
| Average view duration | âœ… | |
| Likes | âœ… | |
| Dislikes | âœ… | Removed from public view but available via API |
| Comments | âœ… | |
| Shares | âœ… | |
| Subscriber gain/loss | âœ… | Per video |
| Impressions | âœ… | Thumbnail shown in feeds |
| Thumbnail CTR | âœ… | Click-through rate on thumbnail |
| Traffic sources | âœ… | Search, suggested, browse, external, etc. |
| Audience retention curve | âœ… | Second-by-second where people drop off |
| Auto-generated captions | âœ… | Free transcript â€” no Whisper needed |
| Revenue data | âœ… | If monetised |
| Top search terms | âœ… | What queries led to your video |

**Note:** YouTube provides auto-captions via the Captions API. This means we DON'T need Whisper for YouTube videos â€” pull the captions directly for free.

#### Instagram Graph API (Meta)

| Metric | Available | Notes |
|--------|-----------|-------|
| Reach | âœ… | Unique accounts |
| Impressions | âœ… | Total views |
| Engagement | âœ… | Total interactions |
| Saves | âœ… | Instagram-specific, valuable metric |
| Shares | âœ… | DM shares |
| Profile visits | âœ… | From this post |
| Follows from post | âœ… | |
| Reel plays | âœ… | For Reels |
| Reel interactions | âœ… | |
| Story metrics | âœ… | Exits, replies, taps forward/back, sticker taps |
| Follower demographics | âœ… | Age, gender, location |
| Media URLs | âœ… | Downloadable images/videos |

#### Facebook Graph API (Meta)

| Metric | Available | Notes |
|--------|-----------|-------|
| Reach | âœ… | Unique people |
| Impressions | âœ… | Total views |
| Engagement | âœ… | All interactions |
| Reactions (by type) | âœ… | Like, Love, Haha, Wow, Sad, Angry |
| Clicks | âœ… | Link clicks, photo clicks, other clicks |
| Shares | âœ… | |
| Comments | âœ… | |
| Video views | âœ… | |
| Video retention | âœ… | |
| Page followers | âœ… | |
| Post-level + page-level analytics | âœ… | |

### Summary

Every platform gives full admin-level analytics via their API. This is NOT scraping â€” it's authenticated access to the same data you see in each platform's native analytics dashboard. You get everything: engagement breakdown, audience demographics, content performance, video completion rates, traffic sources.

---

## 20. NAMING STRATEGY & CONTENT MATCHING

### The Problem

Repo filenames use: `YYYY-MM-DD_post_name` (e.g., `2026-02-11_TITAN_AbsoluteAgony_Jeet.json`)
Notion titles use: `post_name` (e.g., `TITAN_AbsoluteAgony_Jeet`)
Platform IDs use: `urn:li:share:1234567890` (LinkedIn) or `video:789012` (TikTok)

These need to map to each other without requiring exact matches everywhere.

### The Solution: Three-Layer Matching

```
Priority 1: Platform ID (definitive, unique, never changes)
  â†’ Every post on every platform has a unique ID
  â†’ Once scraped, this ID is stored in both the repo JSON AND Notion
  â†’ All future matching uses this ID

Priority 2: Post Name (human-readable key)
  â†’ Used for matching before a post is published (no platform ID yet)
  â†’ Notion title = repo name (minus date prefix)
  â†’ Script strips "YYYY-MM-DD_" from repo filenames when matching to Notion

Priority 3: Date + Platform (fallback)
  â†’ If names somehow diverge, date + platform narrows to 1-2 candidates
  â†’ Manual review only needed in edge cases
```

### Practical Implications

- You do NOT need to rename anything in your existing repo
- You do NOT need to change your Notion naming convention  
- The sync script handles the translation automatically
- Once a post is published and scraped, the platform ID becomes the permanent link
- For planning (future posts), the Name field is the key â€” just keep it consistent between Claude's output and Notion

### For Historical Content Already in the Repo

Your existing repo posts have filenames like `2026-02-11_TITAN_AbsoluteAgony_Jeet/`. The initial backfill scraper will:

1. Pull all historical posts from each platform
2. Attempt to match each scraped post to an existing repo entry using: date + name similarity (fuzzy match)
3. Where it matches, it adds the platform ID to the existing repo entry
4. Where it doesn't match (or for platforms not yet in the repo), it creates a new entry

After the initial backfill, everything has platform IDs and matching is bulletproof going forward.

---

## 21. HISTORICAL BACKFILL

### What It Is

A one-time operation to scrape ALL historical content from every platform and get it into the repo. After this, the weekly/daily scrapers only pull NEW content.

### Per Platform

#### LinkedIn (Titan PMR + Titanverse)
- **What:** All posts ever published on both company pages
- **Volume estimate:** ~250 posts (216 Titan + 38 Titanverse already in repo)
- **What's new:** Metrics update for all existing posts + any posts not yet in repo
- **Video transcription:** Any video posts not yet transcribed
- **API limit:** 100 posts per request, paginated â€” no issue

#### TikTok (Titan PMR)
- **What:** All videos ever published
- **Volume estimate:** Unknown â€” Cam to confirm
- **Everything is new:** No TikTok content currently in repo
- **All videos need transcription**

#### YouTube (Both brands if applicable)  
- **What:** All videos ever uploaded
- **Volume estimate:** Unknown â€” Cam to confirm
- **Captions:** YouTube provides auto-captions â€” no Whisper needed, free
- **Everything is new** if not yet in repo

#### Instagram (If applicable)
- **What:** All posts from business account
- **API limit:** ~200 most recent posts in some cases
- **Everything is new** if not yet in repo

#### Facebook (If applicable)
- **What:** All page posts
- **Everything is new** if not yet in repo

### Backfill Script

```bash
# One-time command
python scripts/backfill.py --platform linkedin --org titanpmr
python scripts/backfill.py --platform linkedin --org titanverse  
python scripts/backfill.py --platform tiktok
python scripts/backfill.py --platform youtube
python scripts/backfill.py --platform instagram
python scripts/backfill.py --platform facebook
```

Each command:
1. Pulls all historical posts from that platform
2. Matches to existing repo entries where possible
3. Downloads all media (images, video files)
4. Transcribes all videos (Whisper for non-YouTube, Captions API for YouTube)
5. Generates alt-text for all images via Claude Vision
6. Saves everything to `/data/metrics/{platform}/`
7. Updates the transcription log (so nothing gets processed twice)

### One-Time Backfill Cost Estimate

| Item | Volume | Cost |
|------|--------|------|
| Whisper (LinkedIn videos) | ~40 videos Ã— 2 min avg = 80 min | $0.48 |
| Whisper (TikTok videos) | ~100 videos Ã— 1 min avg = 100 min | $0.60 |
| YouTube captions | All videos | Free (API provides them) |
| Whisper (Instagram reels) | ~30 videos Ã— 0.5 min avg = 15 min | $0.09 |
| Claude Vision (all images) | ~300 images | $0.90 |
| **Total backfill** | | **~$2.07** |

Actual volumes will vary â€” this is a conservative estimate. Even if you have 5x this volume, it's under Â£10 one-time.

---

## 22. DEDUPLICATION & COST CONTROL

### The Deduplication System

Every piece of content processing (transcription, alt-text generation) is tracked in a log file to prevent duplicate work.

**File:** `/data/processing_log.json`

```json
{
  "transcriptions": {
    "urn:li:share:123456": {
      "processed_at": "2026-03-16T07:00:00Z",
      "whisper_cost_usd": 0.012,
      "output_file": "data/metrics/linkedin/titanpmr/2026-03-09_TITANUP_TariqPharmacyKilled.json"
    },
    "tiktok:video:789012": {
      "processed_at": "2026-03-16T07:05:00Z",
      "whisper_cost_usd": 0.006,
      "output_file": "data/metrics/tiktok/titanpmr/2026-03-09_TariqClip.json"
    }
  },
  "alt_text": {
    "image:sha256:abc123": {
      "processed_at": "2026-03-16T07:10:00Z",
      "claude_cost_usd": 0.003,
      "output_file": "data/metrics/linkedin/titanpmr/2026-02-11_TITAN_AbsoluteAgony_Jeet.json"
    }
  },
  "totals": {
    "whisper_total_usd": 2.07,
    "claude_vision_total_usd": 0.90,
    "total_usd": 2.97,
    "last_updated": "2026-03-16T07:15:00Z"
  }
}
```

### How It Prevents Duplicate Processing

```python
def should_transcribe(platform_id: str) -> bool:
    log = load_processing_log()
    return platform_id not in log["transcriptions"]

def should_generate_alt_text(image_hash: str) -> bool:
    log = load_processing_log()
    return f"image:{image_hash}" not in log["alt_text"]
```

Every script checks the log BEFORE making any API call. If the content has already been processed, it skips. This means:

- Running daily costs essentially nothing (0-1 new posts per day)
- Running the backfill twice is safe (skips everything already done)
- Accidentally triggering the Action manually won't waste money

### Cost Monitoring

The processing log tracks cumulative costs. The GitHub Action can include a cost check:

```python
def check_cost_limit():
    log = load_processing_log()
    if log["totals"]["total_usd"] > MONTHLY_LIMIT:
        print(f"âš ï¸ Monthly cost limit ${MONTHLY_LIMIT} reached. Skipping processing.")
        return False
    return True
```

**Recommended monthly limit:** $10 USD (~Â£8). This is extremely generous for your volume â€” you'll likely never hit it. But it's a safety net.

### Daily vs Weekly â€” Cost Impact

| Schedule | New content/run | Whisper cost/run | Claude Vision/run | Monthly total |
|----------|----------------|------------------|-------------------|---------------|
| Weekly | ~5-7 posts | ~$0.04 | ~$0.02 | ~$0.25 |
| Daily | ~0-1 posts | ~$0.006 | ~$0.003 | ~$0.25 |

**Same monthly cost either way** because deduplication means you only process each item once regardless of how often the script runs. Daily just means fresher data.

**Recommendation:** Run daily. It costs the same and your metrics are always current.

---

## 23. FUTURE CONSIDERATIONS

### Potential Platform Expansions

| Platform | API Status | Transcript Available | Notes |
|----------|-----------|---------------------|-------|
| LinkedIn | Marketing API | No (use Whisper) | Video download + transcribe |
| TikTok | Business API | No (use Whisper) | Video download + transcribe |
| YouTube | Data API v3 | Yes (auto-captions) | YouTube provides captions natively |
| Instagram | Meta Graph API | No (use Whisper) | Reels download + transcribe |
| X/Twitter | API v2 | No (use Whisper) | Video download + transcribe |

### YouTube Caption Pull (When Relevant)

YouTube automatically generates captions. The YouTube Data API can pull these directly without needing Whisper:

```python
# YouTube captions are free to pull via Data API
from googleapiclient.discovery import build

youtube = build('youtube', 'v3', developerKey=API_KEY)
captions = youtube.captions().list(part='snippet', videoId=VIDEO_ID).execute()
# Then download the caption track
```

This is a Phase 3+ addition when YouTube content ramps up.

---

## HOW TO USE THIS DOCUMENT

### If Starting a New Claude Conversation

Upload or reference this file and say:

> "I'm building the Titan Content Automation system. Here's the blueprint. I'm currently on [Phase X, Step Y]. Let's continue from there."

Claude will have full context of the architecture, decisions, and specifications.

### If Working Alone (Without Claude)

Follow the Phase 0 checklist step by step. Everything is documented with enough detail to execute independently. For script building in Phases 1-2, bring this document into a Claude conversation and build together.

### If Onboarding a Developer

This document is the complete spec. A developer should be able to read it and build the entire system without additional context.

---

*Version 2.0 | February 11, 2026*  
*This document should be stored in the repo root AND uploaded to the Claude Project.*  
*Update the Progress Tracker as steps complete.*
