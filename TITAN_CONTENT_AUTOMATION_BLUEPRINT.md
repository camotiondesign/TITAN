# TITAN CONTENT OPS AUTOMATION — COMPLETE TECHNICAL BLUEPRINT

**Created:** February 11, 2026  
**Author:** Cam (Content Strategist, Titan PMR / Titanverse) + Claude  
**Status:** Phase 1 FULLY COMPLETE — Notion syncs to repo daily at 7am GMT  
**Last Updated:** February 11, 2026 (Phase 1 confirmed working)  
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
+-------------------------------------------------------------+
|                    GITHUB REPO                               |
|              (Single Source of Truth)                         |
|                                                              |
|  /strategy/     -> Voice guides, playbooks, trackers         |
|  /data/         -> Post history, metrics, quote banks        |
|  /scripts/      -> All automation scripts                    |
|  /.github/      -> GitHub Actions (scheduled jobs)           |
|                                                              |
+----------+--------------+--------------+---------------------+
           |              |              |
     +-----v-----+  +----v----+  +------v------+
     |  NOTION   |  | CLAUDE  |  |  LINKEDIN   |
     |  DATABASE |  |  (MCP)  |  |  + TIKTOK   |
     |           |  |         |  |    APIs     |
     | Calendar  |  | Live    |  |             |
     | + Notion  |  | access  |  | Metrics +   |
     | Social    |  | to repo |  | media URLs  |
     | (posting) |  | + Notion|  |             |
     +-----+-----+  +----+----+  +------+------+
           |              |              |
           +--------------+--------------+
                          |
                   +------v------+
                   | CLAUDE API  |
                   | (Vision)    |
                   |             |
                   | Auto alt-   |
                   | text for    |
                   | images +    |
                   | videos      |
                   +-------------+
```

### Data Flow

```
PLANNING:
  Claude reads Notion (via MCP or synced JSON in repo)
  -> Claude generates schedule
  -> Script pushes to Notion via API
  -> Cam publishes via Notion Social

METRICS:
  GitHub Action runs weekly
  -> Pulls post data from LinkedIn API + TikTok API
  -> Downloads media (images, video thumbnails)
  -> Sends media to Claude API for alt-text generation
  -> Saves structured JSON to repo
  -> Commits automatically

LIVE PLANNING:
  Cam opens Claude Desktop with MCP
  -> Claude reads live repo (strategy docs, metrics, trackers)
  -> Claude reads live Notion (current calendar)
  -> Claude plans with full context
  -> Changes push directly to Notion
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
| Notion API library | Raw httpx (not notion-client) | notion-client SDK failed on Notion Social synced databases; httpx with direct REST calls works |

---

## 3. PHASE 0: FOUNDATION SETUP

**Estimated time:** 1-2 hours  
**Dependencies:** None  
**Outcome:** All API keys stored, MCP connected, repo structure ready  
**Status:** COMPLETE (Feb 11, 2026)

### Step 0.1 — Notion API Integration

**URL:** https://www.notion.so/my-integrations

1. Click **New integration**
2. Configuration:
   - **Name:** Titan Content Sync
   - **Associated workspace:** Cam's workspace with the Social Media Database
   - **Type:** Internal
   - **Capabilities:** Read content, Update content, Insert content (no user info needed)
3. Click **Submit**
4. Copy the **Internal Integration Secret** (starts with ntn_)
5. Store as GitHub secret: Name: NOTION_TOKEN (or NOTION_API_KEY — see notes)

**Cost:** Free (included with any Notion plan)

### Step 0.2 — Share Database with Integration

1. Open **Titan Social Media Database** in Notion (as full page)
2. Click ... menu (top right) -> **Connections**
3. Search for Titan Content Sync -> Connect
4. Get **Database ID** from URL: the 32 hex characters before ?v=
5. Store as GitHub secret: NOTION_DATABASE_ID

### Step 0.3 — Claude MCP Setup

Gives Claude Desktop direct, live access to your GitHub repo and Notion database.

**MCP config (claude_desktop_config.json):**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_GITHUB_PAT>"
      }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "<YOUR_NOTION_NTN_KEY>"
      }
    }
  }
}
```

**Note:** Use @notionhq/notion-mcp-server (official), NOT @modelcontextprotocol/server-notion.

### Step 0.4 — Repository Structure

```
TITAN/
+-- scripts/
|   +-- notion_sync.py          <- Phase 1: Notion read/write (18KB)
|   +-- requirements.txt        <- Python deps (httpx, python-dotenv)
+-- data/
|   +-- notion_export.json      <- Auto-generated daily by GitHub Action
|   +-- notion_schema.json      <- Auto-discovered schema
|   +-- sample_schedule.json    <- Example push format
+-- strategy/                   <- Strategy docs (accessible via MCP)
+-- linkedin posts/             <- Post archive (216+ Titan, 38+ Titanverse)
+-- .github/workflows/
|   +-- notion-sync.yml         <- Daily at 6am UTC
+-- TITAN_CONTENT_AUTOMATION_BLUEPRINT.md  <- THIS FILE
```

### Step 0.5 — Python Environment

scripts/requirements.txt:
```
httpx>=0.27.0
python-dotenv>=1.0.0
```

Note: Originally specified notion-client but rewritten to use raw httpx because notion-client SDK failed on Notion Social synced databases.

### Phase 0 Completion Checklist

- [x] Notion integration created (Feb 11)
- [x] API key stored as GitHub secret (Feb 11)
- [x] Database shared with integration (Feb 11)
- [x] Database ID stored as NOTION_DATABASE_ID secret (Feb 11)
- [x] GitHub PAT generated and stored locally (Feb 11)
- [x] Claude Desktop installed (Feb 11)
- [x] MCP config created with GitHub + Notion servers (Feb 11)
- [x] MCP tested — GitHub and Notion both working (Feb 11)
- [x] Node.js installed (Feb 11)
- [x] Repo folder structure created (Feb 11)
- [x] requirements.txt created (Feb 11)
- [x] Strategy docs migrated to /strategy/ (Feb 11)

---

## 4. PHASE 1: NOTION BIDIRECTIONAL SYNC

**Estimated time:** 2-3 hours  
**Dependencies:** Phase 0 complete  
**Outcome:** Never export/import a CSV again  
**Status:** COMPLETE (Feb 11, 2026) — GitHub Action running successfully

### What the Script Does

scripts/notion_sync.py (18KB) has three commands using raw httpx:

**pull** — Reads all rows from Notion, auto-discovers schema, saves to /data/notion_export.json
**push** — Reads a schedule JSON, creates or updates posts in Notion by Name matching
**shuffle** — Phase 3 placeholder for calendar rearrangement

### Implementation Notes (Lessons Learned)

| Issue | Resolution |
|-------|------------|
| notion-client SDK failed on synced databases | Rewrote using raw httpx with direct REST API calls |
| ReadTimeout on large database queries | Increased timeout to 60s |
| Schema discovery fails on synced databases | Falls back to reading property types from first row |
| Secret naming: NOTION_API_KEY vs NOTION_TOKEN | Workflow maps NOTION_TOKEN env var from secrets.NOTION_API_KEY |
| requirements.txt listed notion-client not httpx | Fixed Feb 11 — updated to httpx>=0.27.0 |
| GitHub Action couldn't push commits | Fixed Feb 11 — enabled read/write workflow permissions in repo settings |
| MCP server package | Use @notionhq/notion-mcp-server (official) |

### GitHub Action: Daily Notion Pull

File: .github/workflows/notion-sync.yml
Schedule: Daily at 6am UTC (7am GMT)
Also: Manual trigger via workflow_dispatch
Secrets used: NOTION_API_KEY (mapped to NOTION_TOKEN env var), NOTION_DATABASE_ID

### Phase 1 Completion Checklist

- [x] notion_sync.py created with pull command (Feb 11)
- [x] Schema discovery working (Feb 11)
- [x] First pull executed — notion_export.json 3.2MB (Feb 11)
- [x] push command created and tested (Feb 11)
- [x] Test post pushed to Notion and verified (Feb 11)
- [x] GitHub Action created (Feb 11)
- [x] GitHub Action running successfully (Feb 11)
- [ ] First CSV-free planning session (ready to do)

---

## 5. PHASE 2: METRICS SCRAPING & AUTO ALT-TEXT

**Estimated time:** 3-5 hours (plus API approval waiting time)  
**Dependencies:** Phase 1 complete  
**Outcome:** Metrics and visual descriptions update automatically every week  
**Status:** NOT STARTED

### 2A: LinkedIn Metrics

1. Create LinkedIn Developer App at linkedin.com/developers
2. Request Marketing API access (1-7 day approval wait)
3. Complete OAuth flow, store tokens as GitHub secrets
4. Build pull_linkedin_metrics.py
5. Fallback: Shield App (~20 GBP/month) if API approval is slow

### 2B: TikTok Metrics

1. Register at developers.tiktok.com
2. Request Business API access
3. Build pull_tiktok_metrics.py

### 2C: Auto Alt-Text Generation

1. Metrics scraper downloads media (images, video thumbnails, carousel slides)
2. Send to Claude API (Sonnet) for visual description
3. Cost estimate: ~4 GBP/month at current volume

### Phase 2 Completion Checklist

- [ ] LinkedIn Developer app created
- [ ] Marketing API access approved
- [ ] OAuth flow completed, tokens stored
- [ ] pull_linkedin_metrics.py working
- [ ] TikTok dev account created
- [ ] pull_tiktok_metrics.py working
- [ ] Anthropic API key stored as secret (already have ANTHROPIC_API_KEY)
- [ ] generate_alt_text.py working
- [ ] Weekly GitHub Action running
- [ ] Video transcription via Whisper
- [ ] Key quote extraction
- [ ] Live tracker auto-updates

---

## 6. PHASE 3: SMART PLANNING ENGINE

**Dependencies:** Phases 1-2 stable  
**Outcome:** Planning sessions become data-driven  
**Status:** NOT STARTED

- Performance pattern analysis (Claude reads /data/metrics/ via MCP)
- Platform-specific caption generation
- Cadence validator script
- Live tracker auto-updates on publish

---

## 7. PHASE 4: CLIENT-READY PRODUCT (Future)

- Frontend UI (Lovable or Next.js + Vercel)
- Multi-client support
- Onboarding flow

---

## 8-14. TECHNICAL SPECIFICATIONS

Sections 8-14 contain detailed specs for repo structure, data schemas, API credentials, GitHub Actions, MCP config, cadence rules engine, and cost analysis. Unchanged from original blueprint — refer to git history for full content.

---

## 15. DECISION LOG

| Date | Decision | Reasoning | Status |
|------|----------|-----------|--------|
| Feb 11 | Keep Notion as posting tool | Client likes it, affordable, Notion Social works | Confirmed |
| Feb 11 | GitHub repo as source of truth | Versioned, MCP-accessible, Actions-native | Confirmed |
| Feb 11 | Python for scripts | Cam has familiarity, best library ecosystem | Confirmed |
| Feb 11 | Claude API for alt-text (not OpenAI) | Consistency with planning, better vision | Confirmed |
| Feb 11 | Try LinkedIn API before Shield | Free first, fallback ready | Pending |
| Feb 11 | MCP for live access | Kills the file upload/download cycle | Working |
| Feb 11 | No frontend until Phases 1-3 proven | Avoid over-engineering | Confirmed |
| Feb 11 | Switch from notion-client to raw httpx | SDK failed on Notion Social synced databases | Done |
| Feb 11 | Use @notionhq/notion-mcp-server | Official package, works correctly | Done |
| Feb 11 | Keep secret as NOTION_API_KEY, map in workflow | Avoids regenerating key, workflow handles translation | Done |
| Feb 11 | Blueprint lives in repo only (not Claude Project) | Single source of truth, git-tracked, no drift | Done |
| Feb 11 | Enable read/write workflow permissions | Required for GitHub Action to push commits | Done |

---

## 16. PROGRESS TRACKER

### Phase 0: Foundation — COMPLETE (Feb 11)
All 13 steps done. Notion integration, secrets, MCP, repo structure, strategy docs migrated.

### Phase 1: Notion Sync — COMPLETE (Feb 11)
All 7 steps done. Script works locally and via GitHub Action. Daily auto-sync at 7am GMT confirmed.
Remaining: First CSV-free planning session (ready to do anytime).

### Phase 2: Metrics + Alt-Text — NOT STARTED
Next step: Create LinkedIn Developer App (submit early, approval takes 1-7 days).
Note: ANTHROPIC_API_KEY already stored as GitHub secret.

### Phase 3: Smart Planning — NOT STARTED
Blocked on Phase 2 data accumulation.

---

## SECURITY NOTE

On Feb 11, the Notion API key was briefly exposed in a commit to the workflow file. The key should be regenerated at notion.so/my-integrations and the NOTION_API_KEY secret updated in GitHub Settings. The commit containing the exposed key remains in git history.

---

## HOW TO USE THIS DOCUMENT

**New Claude conversation:** Reference this file and say "I'm on Phase X, Step Y. Let's continue."
**Working alone:** Follow the phase checklists step by step.
**Onboarding a developer:** This is the complete spec.

---

*Version 3.1 | February 11, 2026*  
*Single source of truth — lives in repo root only.*
