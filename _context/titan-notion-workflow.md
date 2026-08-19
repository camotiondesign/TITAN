# Titan Notion Workflow

The authority on how content moves through Notion: the production pipeline, the two-lane status model, card anatomy, the transcript-to-ideation front end, the date-timing rule, and all publishing mechanics against the live schema. Check this file first before any board operation.

This file is mechanics only. Strategy lives in foundations, voice in the voice guide. When this file and memory disagree, this file is the authority until updated.

**Status:** v1.1. Originally shipped 24 June 2026; dropped from project knowledge during the v2 file shuffle and rebuilt 3 July 2026 from the original drafting session, with every schema detail re-verified against the live database. Section 9 adds post-ship learnings under the doctrine-capture rule.

---

## 1. The database

- **Active database:** Titan Social Media Database
- **Collection ID:** `157f423b-ea8b-8138-9844-000badd54012`
- **Scoped search URL:** `collection://157f423b-ea8b-8138-9844-000badd54012`
- **Legacy Titanverse database** (`23ff423b-ea8b-8156-b47e-d6de1694207a`): ignore. Both PMR and Titanverse run through the active database above.

Both stack layers live in one database. There is no separate Titanverse calendar. Layer is expressed through the Platforms property.

---

## 2. The two lanes

Two status fields exist. Do not confuse them.

- **Post Status** is the production pipeline. This is Claude's lane. Claude moves cards along it (Idea → In Production → Sign-off → Ready → Posted → Archive).
- **Publish Status** (🕒 Scheduled / ✅ Published / ✅ Done) is the publishing control. This is Cam's lane only. **Claude never sets, clears, or touches Publish Status.** Cam handles all actual publishing manually through it.

So Post Status tracks where a piece is in the making. Publish Status tracks whether it has gone live. Claude owns the first and never the second.

---

## 3. The pipeline (Post Status stages)

| Stage | What it means | What is true at this stage |
|---|---|---|
| **Idea** | Captured and refined, not committed | Content Type set, one-line summary in Idea field, source material linked. No date. This is the undated reservoir. |
| **In Production** | Committed and being built | A target date has been set. It is being edited, animated, designed. Caption written here if not already. |
| **Sign-off** | Made, waiting on approval | Sent to the right person (Hooman, Tariq, Saj, Wahid, as relevant). |
| **Ready** | Approved and publish-ready | Signed off, media attached, scheduled. Sitting in the queue to fire. |
| **Posted** | Live | Cam has published it. |
| **Archive** | Parked or dead | Ideas not proceeding, or old content cleared out. |

A Kanban board view named **Pipeline** exists on the database for working these stages.

---

## 4. The flow, end to end

**1. Raw material in → ideation.** Cam drops a transcript, interview, clip, or a description of footage. Claude and Cam generate and refine several ideas from that single source, back and forth, until the strong ones are agreed. (See section 6.)

**2. Agreed ideas become Idea cards.** Each becomes a card: Content Type set, a one-line summary in the Idea field, source material linked (section 5). A caption may or may not exist yet. No date.

**3. Commit + date → In Production.** During weekly planning, Cam decides what is going out and assigns a target date, roughly two weeks ahead. **Setting the target date is what moves a card into Production.** Nothing enters production without a committed slot. If the caption is not written, it gets written here.

**4. Sign-off.** The finished piece goes to the right person for approval.

**5. Ready.** Approved, media attached. It now sits in the queue. The target date becomes the live publish time only at this point (section 7).

**6. Posted.** Cam publishes through Publish Status. Card moves to Posted.

**7. Archive.** Anything dropped along the way.

**The date-timing rule (the thing that keeps breaking):** the date set at step 3 is a target for planning and deadline. It cannot fire while the card is unmade, because firing requires media attached and Cam's manual Publish Status step. So a target date on an unmade card is safe. Work two weeks ahead, and keep a few evergreen posts sitting Ready at all times so a slipped slot is filled by a swap, not a hole.

---

## 5. Card anatomy

Cards use **existing schema fields only**. No new properties, no ad hoc conventions.

- **Name** — the card name. Descriptive, findable.
- **Idea** (text) — the one-line summary or brief. Working notes and manual-action flags also live here.
- **Content Type** — set at Idea stage.
- **transcript** (file) — the source transcript attached to the card where one exists.
- **Design File** (url) — the link home for bulky source material (see section 6).
- **Page body** — **reserved for the caption.** Notionsocial publishes the body, so the body carries nothing but the final caption. No briefs, no transcripts, no leftover working notes in the body.
- **Post Caption** (text property) — the same caption, for calendar display (section 7).

Keeps the card light and the body clear for the eventual caption.

---

## 6. The transcript-to-ideation front end

Bulky source material (transcripts, long scripts, interview extracts) does not get pasted into cards. The route:

1. Cam drops the material in chat.
2. Ideas are mined and refined in conversation before any card is made.
3. When the material needs a durable home, Claude writes it into a **Google Doc in Cam's Drive** and puts the link in the card's **Design File** field. Shorter transcripts can attach directly to the **transcript** file field.
4. Only the agreed ideas become cards.

This keeps the board a planning surface, not a dumping ground.

---

## 7. Publishing mechanics

### Timestamp formula
Notionsocial publishes roughly **one hour after** the Notion timestamp. Notion times are stored in **UTC**. So two offsets stack.

- **During BST (late March to late October, UTC+1):** Notion `date:Time:start` = intended live time minus **2 hours** (1 for BST→UTC, 1 for the lag).
- **During GMT (late October to late March, UTC+0):** minus **1 hour** only (the lag). Re-check at each clock change so posts do not drift an hour early.

Worked examples (BST):

| Intended live (BST) | Notion `date:Time:start` |
|---|---|
| 7:00am | `2026-06-18T05:00:00.000Z` |
| 12:00pm (noon) | `2026-06-22T10:00:00.000Z` |
| 1:00pm | `2026-06-24T11:00:00.000Z` |
| 9:00pm | `2026-06-22T19:00:00.000Z` |

Always set `date:Time:is_datetime: 1` alongside `date:Time:start`. Omit it and Notion drops the time and treats it as an all-day entry, which breaks scheduling.

### Caption in two places
The **Post Caption** property drives the calendar display. The page **body** is what Notionsocial reads at publish. Both must carry the same caption. On an update this is **two separate calls**: one `update_properties` for Post Caption, one body write (`replace_content` for full rewrites, `update_content` with `old_str`/`new_str` for targeted edits). Use `<br><br>` between paragraphs in the body; `\n` line breaks in the property. Preserve curly apostrophes and quotes exactly; unicode escapes work reliably in body calls. Links as standard markdown `[text](url)`.

### Platform arrays
Multi-select, exact handles. Automated standard array: `["TIKTOK@titanpmr","FB@TITAN PMR","YT@titanpmr","IN@titanpmr"]`. Note `FB@TITAN PMR` is uppercase with a space, the odd one out. LinkedIn handles exist (`LI-PAGE@titanpmr`, `LI-PAGE@titanverse`) but **LinkedIn is manual-only and never goes in an automated array** — a date on a LinkedIn card serves calendar visibility only.

### Media gate
Notionsocial silently skips any post with an empty Media field. No error, no flag, it just does not fire. Media is attached manually by Cam. Always state explicitly when a card is staged but waiting on media.

### Other
- Fill **YT Title** if YouTube is in the array.
- Duplicate-check the database before creating any card.
- For date authority, fetch the page directly by ID. `notion-search` is semantic and unreliable for dates. The SQL and view-query tools are gated behind a Business plan with Notion AI and currently return an upsell error, so they cannot be used for filtering.

---

## 8. Schema reference (live property names)

Data source / collection ID: `157f423b-ea8b-8138-9844-000badd54012`. Verified against the live schema 3 July 2026.

- **Name** (title) — card name.
- **Idea** (text) — the summary / brief.
- **Content Type** (select) — Single Image, Carousel, Video, Short-Form Clip, Article, Meme, Poll, Multi-Image.
- **Platforms** (multi-select) — TIKTOK@titanpmr, FB@TITAN PMR, YT@titanpmr, IN@titanpmr, LI-PAGE@titanverse, LI-PAGE@titanpmr.
- **Post Status** (status) — Claude's pipeline lane (sections 2–3). Options: Idea, In Production, Sign-off, Ready, Posted, Archive.
- **Publish Status** (select) — Cam's lane. Options: 🕒 Scheduled, ✅ Published, ✅ Done. Never touched by Claude.
- **Time** (date) — target date, then live publish time. Needs `is_datetime: 1`.
- **Media** (file) — the asset. Must be present to publish.
- **transcript** (file) — source transcript.
- **Design File** (url) — source-doc link home (Google Doc for long material).
- **Post Caption** (text) — caption for calendar display.
- **YT Title** (text) — YouTube title when YT is a platform.
- **Phase** (select) — SEED, BUILD, CONVERT, FINAL PUSH (Content Inc subscription hierarchy).
- **Campaign** (select) — TitanUp 2026, TV Case Study, Advocacy, Rahul Case Study, HEAD OFFICE, Tariq Documentary, Marketplace.
- **Assigned** (person), **Place** (place), **UTM Link** (url) — present in schema, rarely used in the pipeline.
- **Post URL** (text), **Notionsocial** (text, error messages; clear it to republish), and engagement metrics (Views, Likes, Comments, Shares) are system-managed. Do not write to these.

---

## 9. Post-ship learnings (doctrine capture, added v1.1)

Learnings established in sessions after 24 June, folded in per the doctrine-capture rule:

- **Platforms accepts only one value per MCP write.** Passing arrays or comma-joined strings does not set multiple values. The reliable pattern: set one value via tool, flag the second for manual addition in the Notion UI, and note the pending value in the card's Idea field. Every board-writing session ends with a manual-actions list covering these.
- **"Review" is not a status.** Anything described as review-stage maps to **Sign-off** in the live pipeline.
- **The reliable status-filter pattern:** `notion-search` scoped to the collection to surface candidates, then `notion-fetch` on each page ID to confirm actual property values before acting. Search alone cannot filter by status.
- **Gmail attachments cannot be added via MCP** — where a Notion card's output feeds an email, PDFs are attached manually by Cam; flag in the manual-actions list.

---

## 10. Pre-publish checklist

A card is only Ready when all are true:

- [ ] Target date set, `is_datetime: 1`, run through the section 7 formula
- [ ] Caption in both the Post Caption property and the page body
- [ ] Body is caption-only (no leftover brief or transcript)
- [ ] Platform array correct, LinkedIn excluded from automation
- [ ] Media attached, or explicitly flagged as waiting
- [ ] YT Title filled if YouTube is included
- [ ] Layer correct, no unintended cross-layer contamination
- [ ] Duplicate check done

Claude moves the card to Ready. Cam takes it from there through Publish Status.
