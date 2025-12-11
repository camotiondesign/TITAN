# Campaign Template

This template is for **all campaigns**:
- Case studies
- Leadership posts
- Blog releases
- Events / milestones
- Product announcements
- Multi-asset or single-asset posts
- Future series or revisited topics

**Any content that leaves the building and is published on at least one platform is a campaign.**

Use this **only for collating and structuring existing content**.

## Folder Map

- `campaign-meta.json`  
  High-level metadata about this campaign.

- `content/`
  - `blog/blog.md` – The canonical written content (if exists).
  - `video/longform/transcript.md` – Transcript of the main hero video (if exists).
  - `video/longform/notes.md` – Edit notes, key beats, pull-quotes (optional).
  - `video/shorts/_example-clip-1/transcript.md` – Transcript for a short/clip (if exists).
  - `carousel/slides.md` – Slide-by-slide copy + alt text (if exists).
  - `single-image/image-01.md` – Copy + alt text for stat/hero images (if exists).

- `social/`
  - `linkedin/_example-longform/` – One LinkedIn video post:
    - `caption.md`
    - `comments.md`
    - `metrics.json`
    - `meta.json`
  - `linkedin/_example-carousel/` – One carousel post (same structure).
  - `linkedin/_example-single-image/` – One single image post.
  - `tiktok/_example-clip-1/` – One TikTok post.
  - `youtube/_example-longform/` – Longform upload.
  - `youtube/_example-short/` – Short/reel upload.

- `performance/`
  - Platform-level rollup per campaign, not per post.
  - `linkedin.json` - All LinkedIn posts combined
  - `tiktok.json` - All TikTok posts combined
  - `youtube.json` - All YouTube uploads combined
  - `website.json` - Website/blog metrics (GA4) for case studies and blog posts

- `assets/`
  - Thumbs, exported filenames, notes. (Can stay empty if not used.)

- `post-mortem.md`
  - What worked, what did not, and what to change next time.

## How to Use for a Real Campaign

1. **Copy this template**
   - Duplicate the whole folder.
   - Rename the folder to: `YYYY-MM-DD-slug` (eg, `2025-07-01-priory-scaling-safely`).

2. **Fill `campaign-meta.json`**
   - Set title, brand (TITAN/TITANVERSE), campaign type, dates.

3. **Drop in content**
   - Paste blog into `content/blog/blog.md` (if exists).
   - Paste video transcripts into `content/video/.../transcript.md` (if exists).
   - Document carousel per slide in `content/carousel/slides.md` (if exists).
   - Add single image copy/alt text into `content/single-image/*.md` (if exists).

4. **Log social posts**
   - For each LinkedIn/TikTok/YouTube post:
     - Duplicate an `_example-*` folder.
     - Rename to `YYYY-MM-DD-slug`.
     - Fill `caption.md`, `comments.md`, and `metrics.json`.

5. **Update performance rollups**
   - Summarise platform performance in `performance/*.json`.
   - For campaigns with blog/case study content, add GA4 metrics to `performance/website.json`.

This template is for **structure and consistency**, not for generating content.

## Campaign Philosophy

**One folder = One strategic story = All aligned assets + metrics + comments + transcripts**

The objective: Collate existing content in a structured and queryable way for pattern recognition and performance intelligence.
