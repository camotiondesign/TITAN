# TITAN Content Vault

**Streamlined Campaign-Led Content System**

A lean, production-focused content operations vault. Maximum organisation, minimum clutter, nothing duplicated, nothing that isn't strategically useful.

---

## Architecture

```
TITAN/
├── campaigns/              # All active campaigns (live content)
│   ├── TITAN/             # Titan PMR campaigns
│   └── TITANVERSE/        # Titanverse campaigns
├── playground/             # Draft workspace (build before publishing)
│   ├── product/           # Product pillar campaigns
│   ├── proof/             # Proof pillar campaigns
│   ├── insight/           # Insight pillar campaigns
│   ├── community/         # Community pillar campaigns
│   ├── leadership/        # Leadership pillar campaigns
│   └── _template/         # Template for new playground campaigns
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

### Building Campaigns (Playground)

1. **Create in Playground**: Copy `playground/_template/` → rename to `draft-[campaign-slug]` or `YYYY-MM-DD-[campaign-slug]`
2. **Choose Pillar**: Place in appropriate pillar folder (`product/`, `proof/`, `insight/`, `community/`, `leadership/`)
3. **Build Content**: Write blog posts, carousels, video scripts, social captions
4. **Track Status**: Update `status.md` (draft → review → ready-to-publish)
5. **Collaborate**: Use `notes.md` for ideas, questions, feedback
6. **Review & Refine**: Iterate until content is polished

### Publishing Campaigns

When ready to publish:
1. **Move to Campaigns**: Move entire folder from `playground/[pillar]/` to `campaigns/TITAN/` or `campaigns/TITANVERSE/`
2. **Clean Up**: Remove `status.md` and `notes.md` (or archive them)
3. **Finalize**: Update `campaign-meta.json` with final details
4. **Post**: Campaign is now live and ready for posting

### Post-Publishing

1. **Link Transcripts**: Create `transcript-source.md` referencing `/interviews/raw`
2. **Track Performance**: Add analytics JSON files to `/performance`
3. **Document Learnings**: Update `post-mortem.md` after completion

**See `playground/README.md` for detailed playground workflow.**

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
