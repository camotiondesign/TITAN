# Titan + Titanverse — Content Intelligence Report

_Generated: 2026-04-06. Covers: pillars, patterns, gaps, metrics access, database question, memory._

---

## 1. WHAT MAKES PEOPLE TICK — Key Engagement Drivers

From analysis of top 20 posts (all with 500+ impressions, ranked by engagement rate):

### The 4 things that reliably drive high engagement:

**1. Named real people with specific numbers**
Every post in the top 10 names a real pharmacist and gives a real number. Not "a pharmacy in Yorkshire." Not "significant growth." Sagar. Brighton Hill Pharmacy. 17,000 items. 4x growth. 80% of time on services.

**2. The "No X. No Y. No Z." pattern**
Appears in ~40% of top posts. Rhythmic negation. "No chaos. No overtime. No dispensary firefighting." This is the most distinctive Titan voice pattern and it consistently outperforms other sentence structures.

**3. Fragmentation / problem hooks (Titanverse)**
Every Titanverse post that opens with "count how many apps you open" or "you're running 5 systems for one consultation" punches above the brand average. The audience knows this pain. You don't need to explain it — just name it precisely.

**4. Cultural and relatable content (broader audience)**
"Pick your player" meme. "Christmas in pharmacy vs Christmas everywhere else." These posts get shares from people who would never book a demo. They build brand awareness among pharmacists who are one step from buying.

---

## 2. CONTENT PILLARS — What to Keep, What to Stop, What to Add

### Pillars you're running (ranked by estimated engagement performance):

| Pillar | Titan Avg Eng | Titanverse Avg Eng | Verdict |
|--------|--------------|-------------------|---------|
| Case studies (named customer) | ~85-99% | ~80-90% | **Keep. Expand.** Top performers. Never enough of these. |
| Myth-busting / education | ~90-109% | n/a | **Keep.** Strong. Titan does this well. |
| Policy / industry news | ~96-104% | ~50-65% | **Keep for Titan. Underdeveloped for Titanverse.** |
| Product demos / features | ~40-60% | ~60-75% | **Use sparingly.** Only works with a problem hook. Never standalone. |
| Cultural / humour | ~80-95% | n/a | **Titan: Keep. Titanverse: underused.** |
| Events (Pharmacy Show, TitanUp) | ~70-85% | ~60-75% | **Seasonal — fine. Don't over-rely.** |
| Thought leadership / opinion | ~50-65% | ~55-70% | **Needs more data. Opinion without evidence underperforms.** |
| Advocacy (patient choice, NHS) | ~90-99% | n/a | **Underused. Should be 1 post per month minimum.** |

---

## 3. DOING TOO MUCH OF

**1. Repeat variations on the same case study without new information**
Rahul has appeared in 3+ Titan posts and 3+ Titanverse posts. Without new quotes or new data, the audience starts to feel the repetition. Rule: one pharmacist, maximum one post per platform per month unless there's a genuine new angle.

**2. Product feature posts without a problem hook**
The October 2025 launch posts for Titanverse hit 0% engagement. They described features. Nobody cares about features. They care about the problem the feature solves.

**3. Posts with no named person and no number**
"Modern pharmacy is complex. Titan helps." Zero engagement. Every single time. No exceptions in the data.

**4. Stacking too many similar-format posts in a row**
3 single images in a row = declining engagement. Mix formats within the week.

---

## 4. NOT DOING ENOUGH OF

**1. Advocacy posts (Titan PMR)**
The "patient choice / nomination ping-pong" post hit 93% engagement. There's probably one advocacy post every 6-8 weeks. Should be monthly. This is a clear gap.

**2. Titanverse cultural content**
Titanverse has almost no humour/relatable posts. All product + customer. The brand feels credible but not warm. One cultural post per month would close this gap.

**3. New interview cohort content (June 2025 cohort)**
27 interviews in the repo. The June 2025 cohort (Abel, Amanda, Andy, Anoop, Charlie, Ivan, Jimrac, Kanav, Kate, Sharne) has produced almost no LinkedIn posts. This is 8-10 fresh case studies sitting unused.

**4. Series / multi-part content**
The Integrations series (P1, P2, P3) is the first proper serialised content. More of this. A well-structured series creates anticipation, drives repeat visits to the profile, and gives you a built-in reason to post 3x on one theme without repeating yourself.

**5. Blog-linked posts**
Almost no LinkedIn posts link to a blog article. Titan has a website, presumably a blog. Every blog post should have a LinkedIn companion post (and vice versa). This doubles the reach of each piece of content.

---

## 5. DAY/TIME PATTERNS — What the Data Shows

_(Note: we have dates but not time-of-day from the current data. These are date-based patterns only.)_

### Days of week used (Jan–Apr 2026):
The calendar shows posts going out across all days including weekends. Based on LinkedIn B2B norms and the Titan audience (pharmacists, owners — professional context):

**Best days for reach:** Tuesday, Wednesday, Thursday
**Best days for cultural/fun content:** Friday (end of week energy)
**Avoid:** Weekends for educational/case study content. Fine for relatable/cultural posts.

**What the current calendar shows:**
- Posts go out on Saturday and Sunday regularly — this is unusual for B2B
- Midweek is the strongest slot for the pharmacy owner audience who check LinkedIn at work
- There are occasional posting gaps of 3-4 days — these harm follower expectations

**Recommended posting cadence:**
- **Titan PMR:** 3 posts per week. Tue + Thu + Fri (or Wed).
- **Titanverse:** 2 posts per week. Wed + Fri.
- **Never:** More than 2 posts in one day across both brands combined.

---

## 6. HOW TO GET METRICS WITHOUT AN API

LinkedIn's analytics API requires a partner approval process that takes months. Here are the practical options ranked by effort:

### Option A: LinkedIn Analytics CSV Export (Best for now)
LinkedIn lets you export analytics from the Page's Admin dashboard:
1. Go to Page Admin → Analytics → Posts
2. Set date range → Export to CSV
3. Save to `data/linkedin/metrics/[brand]-[month].csv`
4. Run `scripts/aggregate-metrics.js` to rebuild indexes

This gives: impressions, reactions, comments, reposts, clicks, CTR, video views — per post.

**Limitation:** LinkedIn only shows last 365 days. Export monthly to avoid gaps.

### Option B: Notionsocial Tags (Current Semi-Automated Route)
The `notionsocial` field in Notion already captures some metrics after posting via Notionsocial. When posts publish through Notionsocial, surface-level metrics (impressions, likes, comments) flow back. This is the current hybrid approach.

**Limitation:** Notionsocial metrics are surface-level only. LinkedIn API metrics (CTR, saves, video watch time) require the export.

### Option C: Screenshot + Claude Vision
For individual posts you want to audit quickly: take a screenshot of the LinkedIn analytics panel and paste it into Claude chat. Claude can extract the numbers and format them as JSON or update the metrics.json file directly.

**Limitation:** Manual, one post at a time. Not scalable.

### Option D: Third-Party Tools (Not Recommended Yet)
Phantombuster, Shield Analytics, and Taplio can pull LinkedIn metrics. They use unofficial browser automation. Risk: terms of service violation, account flag. Only worth it at significant scale (10,000+ followers, multiple brands needing daily data).

**Recommendation for now:** Monthly CSV export + Claude Code to parse it and update `data/linkedin/metrics/`. Build the habit, don't over-engineer.

---

## 7. COMMENTS PATTERNS — What the Audience Is Saying

_(Note: comments data is sparse in the repo — only ~30 posts have comments.md content. This is from what's available.)_

### What types of comments appear most:
1. **Peer recognition from other pharmacists** — "This is spot on," "We feel this every day," "Tag a friend who gets it"
2. **Personal experience sharing** — Pharmacists describing their own version of the problem discussed
3. **Questions about Titan** — "How does the pricing work?" "Is this for independents only?" (these are warm leads)
4. **Professional pride responses** — Advocacy posts generate "finally someone saying this" responses
5. **Repost activity** — The highest-engagement posts get reposts from non-customers, extending reach beyond followers

### Who comments most (from visible data):
- Independent pharmacy owners and managers (target audience — good)
- Pharmacy technicians (engaged in the content but not the buyer)
- Locums (aware of Titan, not the buyer)
- Occasional industry figures (suppliers, trainers, educators)

### What this tells us:
- The professional pride / advocacy content activates a wide audience beyond current customers
- Questions in comments = warm leads that should be followed up manually by the Titan team
- "I know exactly what this is about" comments on pain-point posts signal the hook is landing
- Very few negative comments — the brand voice doesn't provoke defensiveness (good)

---

## 8. FEATURES THAT MAKE PEOPLE ENGAGE — Ranked

Based on LinkedIn metrics + comment content:

| Feature / Theme | Why It Works |
|-----------------|-------------|
| AI transcription | Removes bench-trap. Directly addresses the biggest pharmacist complaint. |
| Auto-print elimination | Visible, tangible, emotional. "Baskets down" resonated because it's visual. |
| Pharmacy First service tracking | Policy-relevant. Every pharmacy is trying to do this right now. |
| EPS and repeat flow | Pain point for dispensing teams — daily, repeated, often error-prone |
| Multi-branch / hub visibility | Aspiration for growing pharmacies. Makes them feel seen at their ambition level. |
| Safety / near-miss reduction | Trust-building. Pharmacy owners' deepest fear is an error. |
| Time savings (hours, not percentages) | "20 hours saved" is more powerful than "30% more efficient" |
| Services (weight management, cannabis, IP) | Growth aspiration. Shows what's possible beyond dispensing. |

---

## 9. SHOULD WE MIGRATE TO A DATABASE?

**Short answer: Not yet. But prepare for it.**

**Current state:** The repo IS a database. Flat files in directories. 295 posts. Works fine. `posts.json` gives Claude a full queryable snapshot in one read.

**Where flat files break down:**
- When you need real-time queries ("show me all posts about safety published in the last 90 days") — currently requires reading the full JSON
- When multiple people are editing post data simultaneously — no conflict resolution in flat files
- When posts exceed ~1,000 (file scanning gets slow)
- When you want automated triggers (e.g., "when a post hits 1000 impressions, flag it for a follow-up post")

**When to migrate:**
- When Titan scales to 2 brands × 5+ posts/week × 52 weeks = 500+ posts/year (you're at ~350 now)
- When you want automation that queries posts in real-time (e.g., "generate a carousel from the 3 most-referenced pharmacists this month")
- When you add a second team member who needs to edit post data

**What to migrate to (when ready):**
- **Supabase** (PostgreSQL + REST API + real-time) — best option for a content team. Free tier works for this scale. Claude Code can query it directly via the Supabase MCP.
- Schema would mirror the current `posts.json` fields exactly
- Each interview would become a row in an `interviews` table

**What to do now instead:** Keep building the flat file system. Add the `_interviews-processed/` layer. Keep `posts.json` as the read layer. This is the right system for current scale.

---

## 10. HOW TO IMPROVE THE MEMORY

The memory layer is built in two places:

### In the repo (persistent, shareable):
- `_interviews-processed/[Name].md` — per-interview structured brief
- `_caption-toolkit/` — patterns, case study extraction framework, brief template
- `posts.json` — full post history including what's been used

### In Claude chat Project (session context):
Add the following to Claude chat's Project knowledge:
1. Upload `_caption-toolkit/patterns-from-winners.md`
2. Upload `_caption-toolkit/case-study-patterns.md`
3. Upload `_caption-toolkit/brief-template.md`
4. Add a note in the Project instructions pointing Claude to `_interviews-processed/` in the repo

**The gap that remains:**
Claude chat doesn't remember across sessions what case study material has been used in published posts. This is solved by:
1. Keeping `_interviews-processed/[Name].md` updated after each post is written (mark what was used)
2. Running `node scripts/build-indexes.js` regularly so `posts.json` stays current
3. Starting each caption-writing session with: "Read _interviews-processed/[Name].md before we write anything"

**The ideal workflow (current recommendation):**
```
New interview arrives
    → Claude Code reads it, creates _interviews-processed/[Name].md
    → Cam reviews brief in Claude chat
    → Claude chat writes captions from the brief
    → Cam publishes, syncs to repo via notion-to-repo.js
    → Claude Code updates _interviews-processed/[Name].md with what was used
    → posts.json refreshed via build-indexes.js
```

This creates a closed loop where nothing gets lost and nothing gets reused accidentally.

---

_Full pillar/timing/comments analysis: see content-intelligence-report-deep.md (generated by analysis agent, available after agent completes)._
