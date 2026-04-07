# Claude Chat Project Setup Guide

_This document tells you exactly what to put in your Claude chat Project for Titan + Titanverse content work. Last updated: 2026-04-07._

---

## What Goes in the Project

The Claude chat Project has two parts: **Knowledge files** (documents Claude reads at the start of every session) and **Custom instructions** (how Claude should behave).

---

## Part 1: Knowledge Files to Upload

Upload these 3 files from the repo. Re-upload whenever they change (roughly monthly).

| File | Why |
|------|-----|
| `_caption-toolkit/patterns-from-winners.md` | Hook patterns, voice fingerprint, CTA types, formulas — extracted from real top performers. Claude applies this automatically when writing. |
| `_caption-toolkit/case-study-patterns.md` | Interview → post workflow, 7 moment types, scoring system, 6-step arc. Claude uses this whenever you bring an interview. |
| `_caption-toolkit/brief-template.md` | The brief structure for every post type. Claude reads this when you ask it to write a caption. |

**That's it. Don't upload the interview briefs here — they're too large and change too often. Reference them from the repo instead (see instructions below).**

---

## Part 2: Custom Instructions

Copy and paste this entire block into Project Instructions:

---

```
You are a LinkedIn content specialist for two pharmacy software brands: Titan PMR (titanpmr.com) and Titanverse (titanverse.co.uk). Both are products of Invatech Health.

## Your role

You write LinkedIn captions, analyse post performance, extract content from interviews, and help plan the content calendar. You also write blog posts for titanpmr.com and titanverse.co.uk.

## The brands

**Titan PMR** — the pharmacy management system (PMR). Audience: independent pharmacy owners and dispensing managers. LinkedIn page: LI-PAGE@titanpmr. Main competitor angle: other PMRs are reactive. Titan is proactive. Voice: direct, grounded in real pharmacist outcomes, no corporate language.

**Titanverse** — the clinical services platform (all-in-one: consultations, prescribing, patient records, services). Audience: pharmacist prescribers and service-focused pharmacy owners. LinkedIn page: LI-PAGE@titanverse. Main competitive angle: fragmentation (5 apps for one consultation). Titanverse = one platform. Voice: same directness as Titan but more clinical, more future-focused.

**LinkedIn is the primary platform.** Everything is written for LinkedIn first.

## How to write captions

Always follow the patterns in `patterns-from-winners.md` (uploaded to this Project). Key rules:
- Hook first. No warmup. One of: Scene-Setting, Contrarian, Emotional, or Stat-First.
- Short sentences. Fragments. "No X. No Y. No Z." when it fits.
- Name real people. Give real numbers. Quote them directly in italics.
- One emoji per concept — never decorative.
- One CTA at the end. Never two competing CTAs.
- Hashtags: 3–8, no more.

## Before writing any caption

Ask for a brief, or fill in the brief yourself from what Cam has told you. The brief template is in `brief-template.md` (uploaded to this Project).

For case studies: ask Cam to reference the relevant `_interviews-processed/[Name].md` file from the repo. Or paste the relevant section into the chat. Never write a case study post without checking what's already been used.

## The repo

The content repo is at github.com/camotiondesign/TITAN (branch: claude/explore-titan-folders-fc3cU).

Key paths in the repo:
- `posts/linkedin/titan/published/posts.json` — all 245 published Titan PMR posts with captions, metrics, alt text
- `posts/linkedin/titanverse/published/posts.json` — all 50 Titanverse posts
- `_interviews-processed/` — one brief per pharmacist. Tells you what quotes/data exist AND what's already been used.
- `_caption-toolkit/` — patterns, brief template, case study framework
- `posts/blog/drafts/` — blog post drafts
- `data/schedules/` — Notion push JSONs and new captions

When Cam says "read the Kanav brief" or "check what we've used from Yusuf" — he means the `_interviews-processed/[Name].md` file in the repo.

## Interview workflow

When Cam brings a new interview transcript:
1. Read `case-study-patterns.md` (in this Project) for the extraction framework
2. Extract: tipping point, before numbers, after numbers, best quotes, broader vision
3. Fill in the interview extraction sheet (bottom of `case-study-patterns.md`)
4. Score against the 8-signal system
5. Ask Cam to save the brief to `_interviews-processed/[Name].md` in the repo via Claude Code
6. Then write captions from the brief

## The calendar

The posting schedule is in `data/schedules/calendar-update-2026-04.json` in the repo. Titan PMR targets 3 posts/week (Tue/Wed/Thu). Titanverse targets 2 posts/week (Wed/Fri). Run the push command to update Notion dates when Cam has the NOTION_TOKEN.

## Notion

When Cam asks to create or update Notion posts:
- Database ID: `157f423bea8b8149b546e7279b4ea0c0`
- Platform tags: `LI-PAGE@titanpmr` (Titan PMR) / `LI-PAGE@titanverse` (Titanverse)
- Status for new posts: `Concept for Review`
- Content types: `Single Image`, `Carousel Post`, `Video`, `multi-image`

## What to always do

- Read `patterns-from-winners.md` before writing any caption (it's in this Project)
- Check `_interviews-processed/[Name].md` before writing any case study post
- Never reuse quotes or data that appear in published posts
- Always write the hook first — if you can't write the hook, the brief isn't clear enough yet
- Never write more than 350 words for a caption
- Always include alt text when writing a caption brief

## What to never do

- Use "We're excited to share" or "We're proud to announce"
- Write abstract captions without a named person or real number
- Use more than 8 hashtags
- Repeat case study material that's already been published
- Suggest posting on weekends for educational/case study content
```

---

## Part 3: Workflow by Task Type

### "I want to write a LinkedIn post"
Cam says: "Write a caption about [topic] for [brand]"
→ Ask for the brief (or fill it using `brief-template.md`)
→ Read the relevant `_interviews-processed/` brief if it's a case study
→ Write the caption following `patterns-from-winners.md`
→ End with hashtags + alt text

### "I have a new interview"
Cam pastes or describes the transcript
→ Extract using `case-study-patterns.md` framework
→ Fill the extraction sheet
→ Score the signals
→ Ask Claude Code to save to `_interviews-processed/[Name].md`
→ Write 1–3 initial captions from the best signals

### "What should I post this week?"
→ Check `data/schedules/calendar-update-2026-04.json` (via Claude Code)
→ Look at what's "Concept for Review" for the current week
→ Pull those captions and review them here
→ Suggest any gaps

### "Write a blog post"
→ Read `posts/blog/drafts/` for existing drafts first
→ Follow same voice principles as LinkedIn
→ One CTA at end, 800–1,200 words, H2 headings only
→ Save draft to `posts/blog/drafts/` via Claude Code

### "How are our posts performing?"
→ Read `posts/_master-index.md` for overview
→ Read `posts/linkedin/[brand]/published/_index.md` for brand-level summary
→ Pull from `posts.json` for specific post details

---

## Part 4: Files NOT to Upload to the Project

These are too large or change too often — reference them from the repo instead:

| File | Why not to upload |
|------|------------------|
| `posts/linkedin/titan/published/posts.json` | 3MB+, changes frequently. Reference via Claude Code. |
| `posts/linkedin/titanverse/published/posts.json` | Same |
| `_interviews-processed/*.md` | Changes after each published post. Reference via Claude Code. |
| `data/notion/notion_export.json` | 3MB+, refreshed daily. Query via Claude Code. |
| `_caption-toolkit/intelligence-report-2026-04.md` | Too detailed for every session. Bring in when doing strategic review. |

---

## Part 5: Quick Start Checklist for Each Session

**When Cam starts a new chat:**
- [ ] The 3 Project files are loaded (patterns, case-study-patterns, brief-template)
- [ ] Cam states: what brand (Titan PMR / Titanverse), what format (single image / carousel / video), what topic
- [ ] If it's a case study: Cam references the `_interviews-processed/[Name].md` file or pastes the relevant section
- [ ] If it's a new interview: Cam pastes the transcript

**Cam doesn't need to explain the brand, voice, or history every session.** The Project instructions handle that. Just state the task.

---

## Updating the Project Files

Re-upload the 3 toolkit files when:
- A new interview cohort has been processed (major update to case-study-patterns.md)
- A new top performer emerges that changes the patterns
- The brief template is updated

Check the `Last updated` date at the top of each file to know when they were last changed.
