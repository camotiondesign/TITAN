# Content Marketing Prompts

## Purpose

This folder contains standardized prompts and design references for creating marketing assets across all campaigns. These prompts enable external designers and content creators to work independently while maintaining visual and messaging consistency.

**Objectives:**
- Store reusable design prompts for future campaigns
- Version improvements to prompt structure
- Maintain consistency in visuals and messaging
- Enable external designers to work independently using standardized prompts
- Reduce back-and-forth by providing comprehensive briefs upfront

---

## Folder Structure

```
content-marketing-prompts/
├── design-reference/          # Visual style guides, brand rules, layout logic, typography
├── carousel-prompts/          # Reusable prompts for carousel design
├── single-image-prompts/      # Reusable prompts for single image design
├── video-prompts/             # Reusable prompts for video production
└── tone-and-copy-structures/  # Copy guidelines, tone references, messaging frameworks
```

---

## How to Use This System

### Workflow

1. **Design Reference First**: Before creating prompts, review or add design references in `/design-reference/`
2. **Create Campaign-Specific Prompt**: Generate detailed prompt using templates and referencing design files
3. **Store Reusable Patterns**: Extract reusable elements into template files for future use
4. **Version Improvements**: Update templates as you learn what works

### For Designers/Content Creators

1. Read the relevant prompt file for your asset type
2. Review design references in `/design-reference/`
3. Check campaign-specific content in `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/content/`
4. Generate asset following prompt specifications
5. Save final assets to `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`

---

## Prompt Writing Guidelines

### General Principles

**Every prompt should include:**

1. **Visual Style Reference**
   - Reference design files in `/design-reference/`
   - Specify brand colors, typography, layout patterns
   - Include examples from top-performing campaigns

2. **Campaign Context**
   - Link to campaign folder: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/`
   - Reference content source: `content/[asset-type]/[file].md`
   - Include campaign objectives and messaging

3. **Technical Specifications**
   - Dimensions, format, file type
   - Platform requirements (LinkedIn, TikTok, YouTube)
   - Accessibility requirements (alt text, contrast)

4. **Content Requirements**
   - Exact copy from campaign content files
   - Typography hierarchy
   - Visual elements (icons, illustrations, photos)

5. **Performance Context**
   - Reference top-performing similar assets
   - Include what worked in past campaigns
   - Note any specific requirements based on performance data

---

## Carousel Prompts

**File Location:** `/carousel-prompts/[campaign-slug]-carousel-prompt.md`

**Structure:**

```markdown
# Carousel Design Prompt: [Campaign Name]

## Campaign Context
- **Campaign Folder:** `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/`
- **Content Source:** `content/carousel/slides.md`
- **Objective:** [Campaign objective]
- **Target Audience:** [Audience description]

## Design Reference
- **Visual Style:** Reference `/design-reference/[style-guide].md`
- **Top Performer Examples:** 
  - [Campaign name] - [Engagement rate]% engagement
  - Visual pattern: [Description]

## Slide-by-Slide Specifications

### Slide 1 - [Slide Name]
- **Copy:** [Exact copy from slides.md]
- **Visual Style:** [Description from alt text]
- **Layout:** [Layout pattern]
- **Typography:** [Font, size, hierarchy]
- **Colors:** [Brand colors]
- **Reference:** Similar to [top performer] slide [X]

[Repeat for each slide]

## Technical Specifications
- **Dimensions:** [LinkedIn carousel dimensions]
- **Format:** [PNG, JPG, etc.]
- **File Naming:** `[campaign-slug]-slide-[number].png`
- **Save Location:** `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`

## Performance Context
- **Top Performer Pattern:** [What visual pattern worked]
- **Engagement Driver:** [What drove engagement in similar campaigns]
```

**What to Include:**
- Exact copy from `content/carousel/slides.md`
- Visual descriptions from alt text
- Reference to design style guide
- Reference to top-performing carousels
- Specific layout patterns that worked
- Color coding and visual hierarchy

**How to Reference Campaign Assets:**
- Use relative paths: `content/carousel/slides.md`
- Reference specific slides: "Slide 1 - Hook (see slides.md)"
- Link to performance data: "Similar to [campaign] (55.7% engagement)"

---

## Single Image Prompts

**File Location:** `/single-image-prompts/[campaign-slug]-single-image-prompt.md`

**Structure:**

```markdown
# Single Image Design Prompt: [Campaign Name]

## Campaign Context
- **Campaign Folder:** `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/`
- **Content Source:** `content/single-image/image-01.md`
- **Objective:** [Campaign objective]
- **Platform:** [LinkedIn/TikTok/etc.]

## Design Reference
- **Visual Style:** Reference `/design-reference/[style-guide].md`
- **Top Performer Examples:**
  - [Campaign name] - [Impressions] impressions, [Followers] followers gained
  - Visual pattern: [Description]

## Visual Specifications
- **On-Image Copy:** [Exact copy from image-01.md]
- **Visual Description:** [Alt text description]
- **Layout:** [Layout pattern]
- **Typography:** [Font, size, hierarchy]
- **Colors:** [Brand colors]
- **Visual Style:** [Reference to top performer]

## Technical Specifications
- **Dimensions:** [Platform-specific dimensions]
- **Format:** [PNG, JPG, etc.]
- **File Naming:** `[campaign-slug]-single-image.png`
- **Save Location:** `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`

## Performance Context
- **Top Performer Pattern:** [What visual pattern worked]
- **Hook Format:** [First 2 lines format that worked]
```

**What to Include:**
- Exact copy from `content/single-image/image-01.md`
- Alt text description as visual guide
- Reference to design style guide
- Reference to top-performing single images
- Hook format (first 2 lines) if applicable
- Typography and color specifications

**How to Reference Campaign Assets:**
- Use relative paths: `content/single-image/image-01.md`
- Reference caption: "See `social/linkedin/[post-folder]/caption.md`"
- Link to performance: "Similar to [campaign] (2,019 impressions, 9 followers)"

---

## Video Prompts

**File Location:** `/video-prompts/[campaign-slug]-video-prompt.md`

**Structure:**

```markdown
# Video Production Prompt: [Campaign Name]

## Campaign Context
- **Campaign Folder:** `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/`
- **Content Source:** `content/video/[type]/transcript.md`
- **Objective:** [Campaign objective]
- **Platform:** [LinkedIn/TikTok/YouTube]
- **Video Type:** [Longform/Short/Explainer/etc.]

## Design Reference
- **Visual Style:** Reference `/design-reference/[style-guide].md`
- **Top Performer Examples:**
  - [Campaign name] - [Views] views, [Watch time]
  - Visual pattern: [Description]

## Content Specifications
- **Script/Transcript:** See `content/video/[type]/transcript.md`
- **Key Moments:** [Timestamps and key beats]
- **Visual Style:** [Description]
- **B-Roll Requirements:** [What footage is needed]
- **Graphics/Animation:** [Requirements]

## Technical Specifications
- **Duration:** [Length]
- **Aspect Ratio:** [Platform-specific]
- **Format:** [MP4, MOV, etc.]
- **File Naming:** `[campaign-slug]-video-[type].mp4`
- **Save Location:** `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`

## Performance Context
- **Top Performer Pattern:** [What worked]
- **Engagement Driver:** [What drove watch time]
```

**What to Include:**
- Transcript/script from `content/video/[type]/transcript.md`
- Key moments and timestamps
- Visual style requirements
- B-roll and graphics needs
- Reference to top-performing videos
- Platform-specific requirements

**How to Reference Campaign Assets:**
- Use relative paths: `content/video/[type]/transcript.md`
- Reference notes: "See `content/video/[type]/notes.md` for key beats"
- Link to performance: "Similar to [campaign] (930 views, 10s avg watch time)"

---

## Tone and Copy Structures

**File Location:** `/tone-and-copy-structures/[type]-guide.md`

**Purpose:** Store reusable copy frameworks, tone guidelines, and messaging structures.

**Types:**
- `carousel-copy-structure.md` - Carousel caption frameworks
- `single-image-copy-structure.md` - Single image caption frameworks
- `video-script-structure.md` - Video script frameworks
- `hook-formats.md` - Proven hook patterns
- `tone-reference.md` - Tone guidelines by product/campaign type

**Structure:**

```markdown
# [Type] Copy Structure Guide

## Proven Formats

### Format 1: [Name]
**Structure:**
- Line 1: [Hook pattern]
- Line 2: [Support pattern]
- Body: [Structure]
- CTA: [Pattern]

**Example:**
[Example from top performer]

**Performance:**
- Engagement Rate: [X]%
- CTR: [X]%
- Impressions: [X]

**When to Use:**
[Context]

## Tone Guidelines
- **Titan PMR:** [Tone description]
- **Titanverse:** [Tone description]
- **Campaign Type:** [Tone variations]
```

**What to Include:**
- Proven copy structures from top performers
- Hook formats (first 2 lines)
- Tone guidelines by product
- Performance context for each format
- When to use each structure

**How to Reference Campaign Assets:**
- Reference caption files: "See `social/linkedin/[post-folder]/caption.md`"
- Link to hooks catalog: "See `inspiration/hooks/best-hooks-catalog.md`"
- Reference performance: "See `post-mortem.md` for full analysis"

---

## Design Reference

**File Location:** `/design-reference/[reference-name].md`

**Purpose:** Store visual style guides, brand rules, layout patterns, typography specifications.

**Types:**
- `titanverse-visual-style.md` - Titanverse brand visual guidelines
- `titan-pmr-visual-style.md` - Titan PMR brand visual guidelines
- `carousel-layout-patterns.md` - Proven carousel layout patterns
- `typography-guide.md` - Font specifications and hierarchy
- `color-palette.md` - Brand color specifications

**Structure:**

```markdown
# [Reference Name]

## Visual Style
- **Brand Colors:** [Colors with hex codes]
- **Typography:** [Font families, sizes, hierarchy]
- **Layout Patterns:** [Proven layouts]
- **Visual Elements:** [Icons, illustrations, photography style]

## Top Performer Examples
- [Campaign name] - [Visual pattern] - [Performance metrics]
- Visual reference: See `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`

## Usage Guidelines
- **When to Use:** [Context]
- **What Works:** [Proven patterns]
- **What to Avoid:** [Common mistakes]
```

**What to Include:**
- Brand color specifications (hex codes)
- Typography system (fonts, sizes, hierarchy)
- Layout patterns from top performers
- Visual element guidelines (icons, illustrations, photos)
- Examples with performance data

**How to Reference Campaign Assets:**
- Link to assets: "See `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`"
- Reference visual analysis: "See `inspiration/visual/best-carousel-visuals-analysis.md`"
- Link to top performers: "Based on [campaign] (55.7% engagement)"

---

## Version Control and Improvement

### Updating Prompts

1. **After Campaign Performance:**
   - Review performance data in `post-mortem.md`
   - Identify what worked visually
   - Update relevant prompt templates with learnings

2. **Versioning:**
   - Keep previous versions if making major changes
   - Document what changed and why
   - Reference performance data that drove changes

3. **Template Evolution:**
   - Extract reusable patterns from campaign-specific prompts
   - Update templates with proven patterns
   - Remove patterns that didn't work

### Best Practices

- **Always reference performance data** when updating prompts
- **Include "why it works"** based on metrics
- **Link to top performers** for visual reference
- **Keep prompts actionable** - designers should be able to execute independently
- **Update design references** when brand guidelines change

---

## Example: Creating a Campaign Prompt

### Step 1: Review Design Reference
Check `/design-reference/` for relevant visual style guides.

### Step 2: Review Campaign Content
Read campaign content files:
- `content/carousel/slides.md` (for carousels)
- `content/single-image/image-01.md` (for single images)
- `content/video/[type]/transcript.md` (for videos)

### Step 3: Review Top Performers
Check performance data and visual patterns:
- `inspiration/hooks/best-hooks-catalog.md`
- `inspiration/visual/best-carousel-visuals-analysis.md`
- Campaign `post-mortem.md` files

### Step 4: Create Prompt
Use template structure, include:
- Campaign context with file paths
- Design reference links
- Exact copy from content files
- Visual specifications from alt text
- Performance context from top performers
- Technical specifications

### Step 5: Store Prompt
Save to appropriate folder:
- `/carousel-prompts/[campaign-slug]-carousel-prompt.md`
- `/single-image-prompts/[campaign-slug]-single-image-prompt.md`
- `/video-prompts/[campaign-slug]-video-prompt.md`

---

## Quick Reference

**Campaign Content Paths:**
- Carousel: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/content/carousel/slides.md`
- Single Image: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/content/single-image/image-01.md`
- Video: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/content/video/[type]/transcript.md`

**Performance Data:**
- Campaign metrics: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/social/[platform]/[post-folder]/metrics.json`
- Post-mortem: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/post-mortem.md`

**Reference Materials:**
- Hooks: `/inspiration/hooks/best-hooks-catalog.md`
- Visuals: `/inspiration/visual/best-carousel-visuals-analysis.md`
- Tone: `/titan-ai-instructions.md`

**Asset Storage:**
- Final assets: `/campaigns/[PRODUCT]/[CAMPAIGN-SLUG]/assets/`


