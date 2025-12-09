# Repository Map

## Architecture

```
TITAN/
├── campaigns/              # All active campaigns
│   ├── TITAN/             # Titan PMR campaigns
│   └── TITANVERSE/        # Titanverse campaigns
├── campaign-template/      # Template for new campaigns
├── _interviews-raw/        # Raw interview transcripts (never edited)
│   ├── titan/
│   │   ├── case-studies/raw
│   │   ├── leadership/raw
│   │   └── product-vo/raw
│   └── titanverse/
│       ├── case-studies/raw
│       ├── leadership/raw
│       └── product-vo/raw
├── inspiration/            # Competitive intelligence library
├── strategy/               # Messaging, positioning, frameworks
├── brand/                  # Logos, type, templates
├── campaigns-index.json   # Automated index
├── repo-map.md            # This file
├── titan-ai-instructions.md
└── titan-ai-behaviour-context.json
```

## Campaign Structure

Every campaign follows this structure:

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
│   ├── linkedin.json
│   ├── tiktok.json
│   └── youtube.json
├── assets/                 # Thumbnails and final exports only
├── post-mortem.md
└── README.md
```

## Key Principles

- **Campaign folder = ONE story, MANY assets**
- **Raw interviews NEVER live inside campaigns**
- **No duplicates anywhere**
- **If a folder has no purpose, delete it**
