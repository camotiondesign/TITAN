# Campaign Template

Copy this folder to the appropriate pillar folder and rename to `draft-[campaign-slug]` or `YYYY-MM-DD-[campaign-slug]`

## Structure

```
draft-[campaign-slug]/
├── content/
│   ├── blog.md            # Blog post (if exists)
│   ├── carousel.md        # Carousel content (if exists)
│   ├── single-image.md    # Single image posts (if exists)
│   └── video.md           # Video content or script.md
├── social/
│   ├── linkedin/
│   │   └── <YYYY-MM-DD-slug>/
│   │       ├── caption.md
│   │       ├── comments.md
│   │       ├── metrics.json
│   │       └── meta.json
│   ├── tiktok/
│   └── youtube/
├── performance/
│   ├── linkedin-performance.json
│   ├── tiktok-performance.json
│   └── youtube-performance.json
├── assets/                 # Thumbnails and final exports only
├── status.md              # Track: draft → review → ready-to-publish
├── notes.md               # Internal notes, ideas, collaboration
├── post-mortem.md
└── README.md
```

## Status Tracking

Update `status.md` as you progress:
- **draft** — Initial creation, content being written
- **review** — Content complete, awaiting review/approval
- **ready-to-publish** — Approved, ready to move to campaigns folder

## Notes

Use `notes.md` for:
- Internal collaboration
- Ideas and iterations
- Questions to resolve
- Reference links
- Brainstorming

## When Ready to Publish

1. Move entire folder from `playground/[pillar]/` to `campaigns/TITAN/` or `campaigns/TITANVERSE/`
2. Remove `status.md` and `notes.md` (or archive them)
3. Update `campaign-meta.json` with final details
4. Campaign is now live and ready for posting
