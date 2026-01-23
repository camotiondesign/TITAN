# Playground → Campaigns Workflow

**Complete guide for moving campaigns from playground to live**

---

## Overview

The playground is where you **build** campaigns. The campaigns folder is where **live** content lives.

**Workflow:** Build → Review → Move → Publish

---

## Step 1: Create Campaign in Playground

### Choose Your Pillar

Based on content type, choose the appropriate pillar:

- **product/** — Product features, workflows, capabilities
- **proof/** — Case studies, testimonials, results
- **insight/** — Industry analysis, NHS policy, education
- **community/** — Events, milestones, Titanverse, team content
- **leadership/** — Strategic vision, thought leadership, brand

### Create Campaign Folder

1. Copy `playground/_template/` 
2. Rename to `draft-[campaign-slug]` or `YYYY-MM-DD-[campaign-slug]` if you have a target date
3. Place in appropriate pillar folder: `playground/[pillar]/draft-[campaign-slug]/`

**Example:**
```
playground/proof/draft-priory-pharmacy-case-study/
```

---

## Step 2: Build Content

### Content Structure

Build your campaign using the full structure:

```
draft-[campaign-slug]/
├── content/
│   ├── blog.md            # Blog post
│   ├── carousel.md        # Carousel content
│   ├── single-image.md    # Single image posts
│   └── video.md           # Video scripts/transcripts
├── social/
│   ├── linkedin/
│   ├── tiktok/
│   └── youtube/
├── status.md              # Track progress
├── notes.md               # Internal notes
└── README.md              # Campaign overview
```

### Status Tracking

Update `status.md` as you progress:

- **draft** — Initial creation, content being written
- **review** — Content complete, awaiting review/approval
- **ready-to-publish** — Approved, ready to move to campaigns folder

### Collaboration

Use `notes.md` for:
- Internal collaboration
- Ideas and iterations
- Questions to resolve
- Reference links
- Brainstorming

---

## Step 3: Review & Refine

### Content Checklist

Before moving to campaigns, ensure:

- [ ] All content files are complete
- [ ] Social media captions are written
- [ ] Assets are ready (or placeholders noted)
- [ ] Status is `ready-to-publish`
- [ ] Notes are reviewed/resolved
- [ ] README.md has campaign overview

### Review Process

1. **Self-review** — Check content quality, completeness
2. **Peer review** — Get feedback from team (use `notes.md`)
3. **Final approval** — Mark status as `ready-to-publish`

---

## Step 4: Move to Campaigns Folder

### Determine Product Classification

Is this campaign for:
- **Titan PMR** → Move to `campaigns/TITAN/`
- **Titanverse** → Move to `campaigns/TITANVERSE/`

### Migration Steps

1. **Move folder** from `playground/[pillar]/draft-[campaign-slug]/` to `campaigns/[PRODUCT]/YYYY-MM-DD-[campaign-slug]/`

   **Important:** Rename folder to final date format when moving

2. **Remove playground files:**
   - Delete `status.md` (or archive if needed)
   - Delete `notes.md` (or archive if needed)

3. **Finalize campaign:**
   - Update `campaign-meta.json` with final details
   - Ensure `README.md` has complete overview
   - Add any missing content files

4. **Verify structure:**
   - Content files in place
   - Social folders ready
   - Performance folders ready (will be populated after posting)

### Example Migration

**Before:**
```
playground/proof/draft-priory-pharmacy-case-study/
├── status.md
├── notes.md
└── ...
```

**After:**
```
campaigns/TITAN/2025-07-01-priory-pharmacy-case-study/
├── campaign-meta.json (updated)
└── ... (status.md and notes.md removed)
```

---

## Step 5: Publish & Track

### After Moving to Campaigns

1. **Post content** — Publish to LinkedIn, TikTok, YouTube, etc.
2. **Link transcripts** — Create `transcript-source.md` referencing `/interviews/raw`
3. **Track performance** — Add analytics JSON files to `/performance`
4. **Document learnings** — Update `post-mortem.md` after completion

---

## Naming Conventions

### Playground Campaigns

- **Draft campaigns:** `draft-[campaign-slug]`
- **Dated campaigns:** `YYYY-MM-DD-[campaign-slug]` (if you have target date)

**Examples:**
- `draft-priory-pharmacy-case-study`
- `2025-07-01-priory-pharmacy-case-study` (if date is known)

### Live Campaigns

- **Final format:** `YYYY-MM-DD-[campaign-slug]`
- Use actual publish date when known
- Use `00` for day if unknown

**Examples:**
- `2025-07-01-priory-pharmacy-case-study`
- `2025-07-00-priory-pharmacy-case-study` (if day unknown)

---

## Quick Reference

### When to Use Playground

- Building new campaigns
- Iterating on content
- Collaborating with team
- Drafting before final approval
- Experimenting with ideas

### When to Use Campaigns Folder

- Content is approved and ready to post
- Campaign is going live
- Posting has begun
- Performance tracking is active

---

## Troubleshooting

### Campaign Not Ready?

- Keep in playground
- Update `status.md` to `draft` or `review`
- Continue iterating in `notes.md`

### Need to Make Changes After Publishing?

- Edit directly in `campaigns/` folder
- Don't move back to playground
- Update files in place

### Archive Old Drafts?

- Move to `archive/` if no longer needed
- Or delete if truly abandoned
- Don't clutter playground with old drafts

---

**Remember:** Playground is for building. Campaigns folder is for live content.










