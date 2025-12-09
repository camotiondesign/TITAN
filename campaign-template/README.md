# Campaign Template

Copy this folder and rename to `YYYY-MM-DD-[TYPE]-[slug]`

Valid TYPE values: `case-study`, `thought-leadership`, `blog`, `event`

## Structure

```
YYYY-MM-DD-slug/
├── content/
│   ├── blog.md            # Blog post (if exists)
│   ├── carousel.md        # Carousel content (if exists)
│   ├── single-image.md    # Single image posts (if exists)
│   └── video/             # Video transcripts
│       └── <slug>/
│           ├── transcript.md
│           └── meta.json
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
├── post-mortem.md
└── README.md
```

## Key Principles

- **Campaign folder = ONE story, MANY assets**
- **Raw interviews NEVER live inside campaigns** (archived in `/_interviews-raw`)
- **No duplicates anywhere**
- **Social posts** use date-slugged folders with `caption.md` (not .txt)
- **Metrics** stored as JSON files with consistent structure
