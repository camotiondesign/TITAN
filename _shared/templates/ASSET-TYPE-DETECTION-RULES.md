# Asset Type Detection Rules

This document defines the standard asset types for LinkedIn posts and how they should be stored and detected.

## Standard Asset Type Values

All asset types use kebab-case (lowercase with hyphens):

- `carousel` - Multi-slide carousel posts
- `single-image` - Single static image post
- `multi-image` - Album/multiple images uploaded together
- `video-longform` - Long-form video content (typically 2+ minutes)
- `short-video` - Short video clips/reels (typically under 2 minutes)
- `poll` - LinkedIn poll posts
- `meme-single-image` - Meme format (single image with text overlay)
- `full-animated-video` - Fully animated video content

## Storage Requirements

**Both files must contain `asset_type`:**

1. **`meta.json`** - Primary source of truth for content structure
2. **`metrics.json`** - Required for analytics and analysis

### Why Both Files?

- `meta.json` describes the content structure (created before posting)
- `metrics.json` contains performance data (added after posting)
- Analysis tools need to read from either file reliably
- Having it in both ensures consistency and redundancy

## Detection Priority Order

When determining asset type, use this priority:

1. **`meta.json` → `asset_type`** (highest priority)
2. **`metrics.json` → `asset_type`** (fallback)
3. **`meta.json` → `image_type: "album"`** → `multi-image`
4. **Folder name patterns** (e.g., `*carousel*`, `*album*`, `*video*`)
5. **Content folder structure** (e.g., `content/carousel/`, `content/single-image/`)

## Standardization Rules

The standardization script normalizes these variations:

| Input Variation | Standard Output |
|----------------|-----------------|
| `single_image` | `single-image` |
| `video_longform` | `video-longform` |
| `longform_video` | `video-longform` |
| `longform-video` | `video-longform` |
| `short_video` | `short-video` |
| `shortform-video` | `short-video` |
| `video_short` | `short-video` |
| `multi_image` | `multi-image` |
| `multi-image-album` | `multi-image` |
| `meme_single_image` | `meme-single-image` |

## Examples

### Carousel Post

**meta.json:**
```json
{
  "asset_type": "carousel",
  "platform": "linkedin",
  "slide_count": 6
}
```

**metrics.json:**
```json
{
  "platform": "linkedin",
  "asset_type": "carousel",
  "engagement_rate": 50.2
}
```

### Multi-Image Album

**meta.json:**
```json
{
  "asset_type": "multi-image",
  "platform": "linkedin",
  "image_type": "album",
  "event_type": "trade-show-post-event"
}
```

**metrics.json:**
```json
{
  "platform": "linkedin",
  "asset_type": "multi-image",
  "engagement_rate": 43.9
}
```

### Video Post

**meta.json:**
```json
{
  "asset_type": "video-longform",
  "platform": "linkedin",
  "content_source": "content/video/longform/transcript.md"
}
```

**metrics.json:**
```json
{
  "platform": "linkedin",
  "asset_type": "video-longform",
  "engagement_rate": 11.5,
  "average_watch_time_seconds": 28
}
```

## Folder Structure Detection

If `asset_type` is missing from both JSON files, the system detects from:

- **Folder name:** `*carousel*` → `carousel`
- **Folder name:** `*album*` → `multi-image`
- **Folder name:** `*video*` or `*longform*` → `video-longform`
- **Folder name:** `*short*` or `*clip*` → `short-video`
- **Content folder:** `content/carousel/` → `carousel`
- **Content folder:** `content/single-image/` → `single-image`
- **Content folder:** `content/video/longform/` → `video-longform`

## Running Standardization

To ensure all posts have consistent asset types:

```bash
python3 scripts/standardize-asset-types.py
```

This script:
- Scans all LinkedIn post folders
- Ensures `asset_type` exists in both `meta.json` and `metrics.json`
- Normalizes values to standard format
- Reports any posts that need manual review

## Best Practices

1. **Always set `asset_type` in `meta.json`** when creating a new post
2. **Copy `asset_type` to `metrics.json`** when adding metrics after posting
3. **Use standard values only** - don't create new variations
4. **Run standardization script** periodically to catch inconsistencies
5. **Check template files** before creating new posts to see correct format

## Troubleshooting

**Problem:** Analysis shows incorrect content type
- **Solution:** Check both `meta.json` and `metrics.json` have matching `asset_type`

**Problem:** Script can't detect asset type
- **Solution:** Manually add `asset_type` to `meta.json` based on content structure

**Problem:** Inconsistent values (e.g., `single_image` vs `single-image`)
- **Solution:** Run standardization script to normalize all values
