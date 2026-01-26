# Campaign Creation Playbook

**Version:** 2.0  
**Last Updated:** December 2025

This playbook explains how to use the campaign template to organize, track, and learn from content campaigns in the TITAN repository.

**Important:** This template is used primarily for **collating historical campaigns**, not generating new ones (yet).

---

## Table of Contents

1. [Campaign Philosophy](#campaign-philosophy)
2. [What Qualifies as a Campaign](#what-qualifies-as-a-campaign)
3. [Setting Up a New Campaign](#setting-up-a-new-campaign)
4. [Content Structure](#content-structure)
5. [Social Media Asset Structure](#social-media-asset-structure)
6. [Performance Tracking](#performance-tracking)
7. [Post-Mortem Process](#post-mortem-process)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Campaign Philosophy

**One folder = One strategic story = All aligned assets + metrics + comments + transcripts**

The objective: Collate existing content in a structured and queryable way for pattern recognition and performance intelligence.

This repository is:
- A performance intelligence engine
- A library of what has worked
- A repeatable content machine

The value is not in the content. The value is in the **pattern recognition**.

---

## What Qualifies as a Campaign

**Any content that leaves the building and is published on at least one platform is a campaign.**

This includes:

- **Case studies** - Pharmacy stories, customer success stories
- **Leadership posts** - Thought leadership, opinion pieces
- **Blog releases** - Blog post launches with supporting social
- **Events / milestones** - Product launches, announcements, achievements
- **Product announcements** - New features, updates, releases
- **Multi-asset posts** - Campaigns with multiple formats (video, carousel, blog)
- **Single-asset posts** - One strong post with variants across platforms
- **Future series** - Ongoing content series or revisited topics

**Template Location:** `campaigns/_templates/campaign-template`

**Reference Campaign:** `campaigns/TITAN/2025-07-01-priory-scaling-safely`

---

## Setting Up a New Campaign

### Step 1: Copy the Template

```bash
cp -r campaigns/_templates/campaign-template campaigns/TITAN/YYYY-MM-DD-campaign-name
```

### Step 2: Rename the Folder

Use the format: `YYYY-MM-DD-[slug]`

**Slug Rules:**
- Lowercase only
- Hyphens for word separation
- Descriptive but short
- No numbers unrelated to date
- No marketing headline copy

**Examples:**
- ✅ `2025-07-01-priory-scaling-safely`
- ✅ `2025-12-15-titanverse-launches`
- ❌ `2025-07-01-the-amazing-priory-pharmacy-case-study`
- ❌ `2025-07-01-priory-pharmacy-2025`

### Step 3: Classify by Product

Move the campaign folder to the correct product directory:
- `campaigns/TITAN/` - For Titan PMR campaigns
- `campaigns/TITANVERSE/` - For Titanverse campaigns

### Step 4: Update README.md

Replace template placeholders with your campaign details:
- Campaign name
- Campaign objective
- Key assets planned
- Timeline

### Step 5: Clean Up Unused Folders

Delete any folders you won't use:
- If no TikTok content: delete `social/tiktok/`
- If no YouTube: delete `social/youtube/`
- If no carousel: delete `content/carousel/`
- If no single images: delete `content/single-image/`

**Keep the structure clean** - empty folders create confusion.

---

## Content Structure

### Blog Post

**Location:** `content/blog/blog.md`

**Structure:**
- Before State (problem, pain points) - if applicable
- The Shift (how Titan changed operations) - if applicable
- After State (results, outcomes) - if applicable
- Key Quotes (integrate direct quotes) - if applicable
- Clear headings and subheadings
- 500-1500 words depending on campaign type
- Adhere to `titan-ai-instructions.md` tone

### Video Content

**Location:** `content/video/`

**Longform Video:**
- `longform/transcript.md` - Full transcript with timestamps
- `longform/notes.md` - Edit notes, key beats, pull-quotes (optional)

**Short Clips:**
- Duplicate `shorts/_example-clip-1/` folder
- Rename to `YYYY-MM-DD-slug`
- Add `transcript.md` with clip transcript

**Video Documentation Structure:**
- Overview and purpose
- Full timestamped transcript
- Cut-down opportunities with timestamps
- Pull quotes for reuse
- Future angle notes
- Risk + compliance notes
- Related social posts
- Performance summary (add after posting)

### Carousel

**Location:** `content/carousel/slides.md`

**Structure:**
Follow 6-slide dopamine curve:
1. **Hook** - Stop the scroll
2. **Pain** - Problem or lived reality
3. **Insight** - Hopeful shift or new understanding
4. **Shift** - Transformation or change
5. **Proof** - Evidence or result
6. **CTA** - Call to action

**Format:**
- Slide 1: On-slide text + alt description
- Repeat per slide

### Single Image

**Location:** `content/single-image/image-01.md`

**Include:**
- On-image copy
- Alt text (describe visual)
- Where posted (LinkedIn/TikTok/YouTube)

---

## Social Media Asset Structure

### LinkedIn Video Posts

**Location:** `social/linkedin/_example-longform/` (duplicate and rename)

**Required Files:**
- `caption.md` - Full caption text
- `meta.json` - Video metadata (title, length, URLs, etc.)
- `metrics.json` - Performance metrics (add after posting)

**Optional Files:**
- `comments.md` - Comments and engagement

**Naming Convention:**
- Use the actual post date (not filming date)
- Slug should match the video content
- Example: `2025-07-02-prab-longform` (posted July 2, filmed July 1)

### LinkedIn Carousels

**Location:** `social/linkedin/_example-carousel/` (duplicate and rename)

**Required Files:**
- `caption.md` - LinkedIn caption
- `metrics.json` - Performance metrics (add after posting)

**Optional Files:**
- `comments.md` - Comments and engagement

### LinkedIn Single Images

**Location:** `social/linkedin/_example-single-image/` (duplicate and rename)

**Required Files:**
- `caption.md` - Caption if image has accompanying text
- `metrics.json` - Performance metrics (add after posting)

**Optional Files:**
- `comments.md` - Comments and engagement

### TikTok Posts

**Location:** `social/tiktok/_example-clip-1/` (duplicate and rename)

**Required Files:**
- `caption.md` - TikTok caption
- `metrics.json` - Performance metrics (add after posting)

**Optional Files:**
- `comments.md` - Comments and engagement

### YouTube Uploads

**Location:** `social/youtube/_example-longform/` or `_example-short/` (duplicate and rename)

**Required Files:**
- `description.md` - Video description
- `metrics.json` - Performance metrics (add after posting)

**Optional Files:**
- `comments.md` - Comments and engagement

---

## Performance Tracking

### Individual Post Metrics

Store metrics in JSON format for each post:

**LinkedIn Metrics Structure:**
```json
{
  "platform": "linkedin",
  "captured_at": "YYYY-MM-DD",
  "impressions": 13437,
  "reach": 3687,
  "clicks": 716,
  "ctr": 10.7,
  "reactions": 105,
  "comments": 13,
  "reposts": 6,
  "video_views": 3468,
  "watch_time_hours": 23.34,
  "average_view_duration_seconds": 24
}
```

**TikTok Metrics Structure:**
```json
{
  "platform": "tiktok",
  "captured_at": "YYYY-MM-DD",
  "views": 4337,
  "likes": 234,
  "comments": 12,
  "shares": 8,
  "watch_time_hours": 22.6
}
```

**YouTube Metrics Structure:**
```json
{
  "platform": "youtube",
  "captured_at": "YYYY-MM-DD",
  "views": 473,
  "watch_time_hours": 9.7,
  "average_view_duration": "1:13",
  "average_percentage_viewed": 69.6,
  "subscribers_gained": 2
}
```

### Aggregated Campaign Metrics

Store aggregated metrics in `performance/` folder:

- `linkedin.json` - All LinkedIn posts combined
- `tiktok.json` - All TikTok posts combined
- `youtube.json` - All YouTube uploads combined
- `website.json` - Website/blog metrics (GA4) for case studies and blog posts

**Update these files** after each post to track campaign-level performance.

### Website Metrics (GA4)

For campaigns with blog posts or case studies published on the website, capture Google Analytics 4 metrics in `performance/website.json`:

**Website Metrics Structure:**
```json
{
  "platform": "website",
  "source": "ga4",
  "campaign_slug": "2025-07-01-brighton-hill-case-study",
  "page_path": "/case-studies/how-brighton-hill-pharmacy-scaled-without-slowing-down",
  "captured_at": "2025-01-XX",
  "views": 105,
  "active_users": 83,
  "views_per_active_user": 1.27,
  "avg_engagement_time_seconds": 29,
  "event_count": 284,
  "percent_of_total_views": 21.34,
  "percent_of_total_users": 23.58,
  "percent_of_total_events": 19.93,
  "notes": ""
}
```

**When to capture:**
- Case studies published on website
- Blog posts published on website
- Any written content with a dedicated page path

**How to capture:**
1. Extract metrics from GA4 for the specific page path
2. Map the page path slug to the campaign folder
3. Convert engagement time to seconds (e.g., "1m 06s" = 66 seconds)
4. Include percentage calculations if available in GA4 export
5. Update `captured_at` date when metrics are pulled

---

## Post-Mortem Process

### When to Write Post-Mortem

After campaign completion (typically 2-4 weeks after last post).

### What to Include

1. **Campaign Summary**
   - Objective
   - Key assets created
   - Timeline

2. **Performance**
   - Overall metrics
   - Top performing assets
   - What surprised you

3. **Learnings**
   - What worked
   - What didn't work
   - Audience insights

4. **Recommendations**
   - For future similar campaigns
   - Content adjustments
   - Process improvements

5. **Next Steps**
   - Action items
   - Follow-up opportunities

### Template Location

`post-mortem.md` in each campaign folder.

---

## Best Practices

### File Organization

- **Date-slugged folders** for all social posts
- **One folder per post** - don't mix multiple posts in one folder
- **Delete empty folders** - keep structure clean
- **No duplicates** - raw transcripts live in `/_interviews-raw`

### Naming Conventions

- **Campaign folders:** `YYYY-MM-DD-slug`
- **Social post folders:** `YYYY-MM-DD-slug`
- **Video transcripts:** `YYYY-MM-DD-slug-transcript.md`
- **Metrics files:** `metrics.json`

### Content Guidelines

- **Tone:** Calm, precise, clinical leaning, grounded in operational reality
- **Language:** British English only
- **Structure:** Problem first, solution second
- **Quotes:** Use direct quotes from interviews
- **Compliance:** Follow risk + compliance notes in video documentation

### Metrics Tracking

- **Update metrics weekly** during active campaign
- **Use JSON format** for consistency
- **Mark deprecated files** as DEPRECATED
- **Aggregate at campaign level** in `performance/` folder

### Cleanup

- **Delete placeholder files** after adding real content
- **Remove empty folders** regularly
- **Archive old campaigns** if needed (move to `/archive`)
- **Keep README.md updated** as campaign evolves

---

## Troubleshooting

### "Where do transcripts go?"

- **Raw transcripts:** `/_interviews-raw/[product]/[type]/raw/`
- **Campaign transcripts:** `content/video/longform/transcript.md` or `content/video/shorts/YYYY-MM-DD-slug/transcript.md`

### "How do I name social post folders?"

Use the **post date**, not filming date:
- Filmed: July 1, 2025
- Posted: July 2, 2025
- Folder: `2025-07-02-prab-longform`

### "What if I don't need all these folders?"

**Delete them.** Keep only what you use. Clean structure is better than empty folders.

### "Where do I put performance metrics?"

- **Individual posts:** In the post folder (`social/linkedin/_example-longform/metrics.json`)
- **Campaign aggregate:** In `performance/` folder

### "What assets belong in a campaign?"

All assets that are part of the same strategic story:
- Blog posts
- Video content (longform and clips)
- Carousels
- Single images
- Social posts across all platforms
- Performance metrics
- Comments and engagement data
- Transcripts

---

## Quick Reference

### Template Location

- **Campaign Template:** `campaigns/_templates/campaign-template`

### Reference Campaigns

- **Gold Standard:** `campaigns/TITAN/2025-07-01-priory-scaling-safely`

### Key Documents

- **Fill-In Guide:** `campaigns/_templates/CAMPAIGN-FILL-IN-GUIDE.md`
- **Content Guidelines:** `titan-ai-instructions.md`
- **Brand Context:** `titan-ai-behaviour-context.json`
- **Repository Structure:** `README.md`

---

## Getting Help

If you're unsure about:
- Template structure
- File naming
- Folder organization
- Content guidelines

**Check the reference campaign first:**
`campaigns/TITAN/2025-07-01-priory-scaling-safely`

If still unclear, review this playbook or check `titan-ai-instructions.md` for content-specific guidance.

---

**Last Updated:** December 2025  
**Maintained By:** Content Operations Team
