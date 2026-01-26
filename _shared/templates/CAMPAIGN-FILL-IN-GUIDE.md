# CAMPAIGN FILL-IN GUIDE

### How to document **existing content** into this repository

**This guide is NOT about creating new campaigns. It exists to help capture and archive past content in a clean, consistent format.**

Every time you import a past campaign, follow these steps in order.

---

## 1. Create the Campaign Folder

**Use the single template for ALL campaigns:**

- Case studies
- Leadership posts
- Blog releases
- Events / milestones
- Product announcements
- Multi-asset or single-asset posts
- Future series or revisited topics

**Template Location:** `/campaign-template`

Duplicate the template folder and rename it:

```
YYYY-MM-DD-short-slug
```

📌 The date should match the **first time ANY asset from the campaign went public**.

---

## 2. Gather Required Items Before Filling the Template

Collect the following **before pasting anything**:

| Asset | Where to get it | Required |
|------|-----------------|----------|
| Blog (if exists) | Website / drafts / final Google doc | Yes |
| Longform transcript (if video) | Video transcript or AI export | Yes |
| Short-form clips | Transcripts OR description of clip | Yes |
| Carousel copy slide-by-slide | PDF or Figma reference | Yes |
| Single image copy + alt text | On-image text + description | Yes |
| Captions per platform | LinkedIn / TikTok / YouTube | Yes |
| Comments (worth keeping) | Platform | Optional |
| Metrics | Platform analytics | Yes |
| Date posted | Platform timestamp | Yes |
| URL | Link to post | Yes |
| Notes / why it worked / context | Your insight | Optional but recommended |

### Minimum viable import:

**Transcript + Caption + Metrics + Date**

---

## 3. Where to Put Each Item in the Template

### BLOG

`content/blog/blog.md`

### LONGFORM VIDEO

`content/video/longform/transcript.md`

Optional:

`content/video/longform/notes.md`

### SHORTS / CLIPS

Duplicate folder:

`content/video/shorts/_example-clip-1`

Rename:

```
YYYY-MM-DD-slug
```

### CAROUSEL

`content/carousel/slides.md`

**Format:**

- Slide 1: On-slide text + alt description
- Repeat per slide

### SINGLE IMAGE

`content/single-image/image-01.md`

Add:

- On-image copy
- Alt text (describe visual)
- Where posted (LinkedIn/TikTok/YouTube)

---

## 4. Platform Posts (The Most Important Discipline)

For **EVERY platform** where this asset was posted:

Duplicate the appropriate folder:

```
social/<platform>/_example-*
```

Rename:

```
YYYY-MM-DD-descriptive-slug
```

Fill:

- `caption.md`
- `comments.md` (only useful ones)
- `metrics.json`
- `meta.json` (connects the post to the source asset)

🔗 `meta.json` MUST point back to:

- The transcript for videos
- The carousel markdown
- The single-image markdown

---

## 5. Filling metrics.json INTERNALLY

Metrics must be:

- Numeric only
- No commas
- Watch time in minutes OR seconds consistently

If a number is missing:

```
0
```

If sponsored & organic differ:

- Capture **both**
- Write notes inside metrics.json

---

## 6. Post-Mortem Basics (You Can Do This Later)

A simple structure:

```
What worked:

What underperformed:

Why:

What to test next time:
```

Don't try to be overly academic — this is pattern recognition.

---

## 7. Naming Rules (Non-Negotiable Standards)

| Asset | Format |
|-------|--------|
| Folders | `YYYY-MM-DD-slug` |
| Transcripts | `YYYY-MM-DD-slug.md` |
| Platform folders | Mirror the video/asset slug |
| Captions/comments | Markdown |
| Metrics | JSON |

Slugs should be:

- Short
- Lowercase
- Hyphens not spaces
- Verb-friendly (prab-longform, prab-carousel)

❌ prab-final-final  
❌ prab-edit-new  
❌ prab youtube upload  

✅ 2025-07-02-prab-longform  

---

## 8. Quality Control Checklist Before Committing

Tick YES before committing:

- [ ] All platform posts referencing same asset share the same slug.
- [ ] Every platform folder has caption, metrics, and date.
- [ ] Transcript exists for any video asset.
- [ ] Carousel was documented slide-by-slide.
- [ ] Single images include alt text.
- [ ] Meta.json correctly points to the source content.
- [ ] Metrics.json uses numbers only.

---

## 9. Light Philosophy (Read Once)

This repo is NOT:

- A scrapbook
- A dumping ground
- A gallery

This repo **IS**:

- A performance intelligence engine
- A library of what has worked
- A repeatable content machine

The value is not in the content.

The value is in the **pattern recognition.**

