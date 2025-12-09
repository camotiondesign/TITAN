# TITAN Content Vault

**Streamlined Campaign-Led Content System**

A lean, production-focused content operations vault. Maximum organisation, minimum clutter, nothing duplicated, nothing that isn't strategically useful.

---

## Architecture

```
TITAN/
├── campaigns/              # All active campaigns
│   ├── TITAN/             # Titan PMR campaigns
│   └── TITANVERSE/        # Titanverse campaigns
├── campaign-template/      # Template for new campaigns
├── inspiration/            # Competitive intelligence library
│   ├── hooks/
│   ├── frameworks/
│   ├── visual/
│   ├── competitors/
│   └── triggers/
├── interviews/             # Raw interview transcripts
│   └── raw/               # Full transcripts, never edited
├── strategy/               # Messaging, positioning, frameworks
├── brand/                  # Logos, type, templates
├── archive/                # Dead assets only
├── campaigns-index.json   # Automated index
├── titan-ai-instructions.md
└── titan-ai-behaviour-context.json
```

---

## Campaign Structure

Every campaign follows this streamlined structure:

```
YYYY-MM-DD-campaign-name/
├── content/
│   ├── blog.md            # Blog post (if exists)
│   ├── carousel.md        # Carousel content (if exists)
│   ├── single-image.md    # Single image posts (if exists)
│   └── video.md           # Video content or script.md
├── performance/
│   ├── linkedin.json      # LinkedIn analytics
│   ├── tiktok.json        # TikTok analytics
│   ├── youtube.json       # YouTube analytics
│   └── notes.md           # Performance notes
├── transcripts/           # Campaign-specific transcripts
│   └── transcript-source.md  # References to interviews/raw
├── assets/                 # Thumbnails and final exports only
├── post-mortem.md         # Campaign learnings
└── README.md              # Campaign overview
```

**Key Principles:**
- No nested platform folders
- Consolidated content files (not separate folders per asset)
- Only final versions (no v1, v2 unless explicitly needed)
- Compressed assets (thumbnails, final exports)

---

## Interviews

**Single Source of Truth**

All raw interview transcripts are stored in `/interviews/raw`. Campaigns contain only `transcript-source.md` files that reference the archive location.

**Format:**
- Filename
- Speaker(s)
- Recording date
- Archive path

This eliminates duplication and ensures one authoritative source.

---

## Inspiration Library

**Competitive Intelligence & Creative Replication**

The `/inspiration` folder is a weaponized library:

- **hooks/** — Openings that stop the scroll
- **frameworks/** — Narrative structures and story patterns
- **visual/** — Layouts, illustration styles, typography
- **competitors/** — Competitive analysis and angles
- **triggers/** — Psychological triggers and retention tactics

See `inspiration/ideas-to-steal.md` for usage guidelines.

---

## Archive

**Dead Assets Only**

The `/archive` folder contains:
- Historical data no longer in active use
- Legacy content structures
- Assets not tied to campaigns

**Not for active workflow material.**

---

## Campaign Naming

**Format:** `YYYY-MM-DD-campaign-name`

- Use actual publish date when known
- Use `00` for day if unknown
- Lowercase, hyphenated, descriptive

**Examples:**
- `2025-12-15-titanverse-launches-into-pharmacy-space`
- `2025-12-00-from-dispensing-to-health-hub-the-future-of-community-pharmacy`

---

## Workflow

1. **Create Campaign**: Copy `/campaign-template` → rename to `YYYY-MM-DD-campaign-name`
2. **Classify Product**: Move to `/campaigns/TITAN` or `/campaigns/TITANVERSE`
3. **Add Content**: Create files in `/content` folder (blog.md, carousel.md, etc.)
4. **Link Transcripts**: Create `transcript-source.md` referencing `/interviews/raw`
5. **Track Performance**: Add analytics JSON files to `/performance`
6. **Document Learnings**: Update `post-mortem.md` after completion

---

## Rules

- **Campaign-First**: All content belongs to a campaign
- **No Duplication**: Transcripts live in one place (`/interviews/raw`)
- **Lean Structure**: No legacy folders, no archives pretending to be active
- **Production Focus**: Everything serves active content creation
- **Final Versions Only**: No v1, v2 unless explicitly needed with reasoning

---

## Automation

`campaigns-index.json` automatically indexes:
- All campaigns and locations
- Asset types (blog, carousel, single-image, video)
- Product classification
- Date distribution

Use for automation, reporting, and content audits.

---

**Owner:** Cameron Moorcroft  
**Last Updated:** December 2025  
**Architecture Version:** Vault Mode v1.0
