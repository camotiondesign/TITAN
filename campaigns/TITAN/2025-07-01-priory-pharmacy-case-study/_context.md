# Campaign Context Notes

## Misfiled Assets/Metrics

### campaigns/TITAN/2025-07-01-priory-pharmacy-case-study/social/linkedin/2025-07-17-carousel/metrics.json
- **Issue:** Metrics file had incorrect campaign_slug reference (FIXED)
- **Original Issue:** metrics.json contained campaign_slug: '2025-07-01-priory-scaling-safely' but folder is '2025-07-01-priory-pharmacy-case-study'
- **Resolution:** Updated campaign_slug to '2025-07-01-priory-pharmacy-case-study' to match the campaign folder
- **Fixed Date:** 2025-12-14
- **Confidence:** HIGH

## Duplicate Campaign Resolution

### campaigns/TITAN/2025-07-01-priory-scaling-safely (DELETED)
- **Issue:** Duplicate campaign folder with no unique content
- **Investigation:** Performed comprehensive analysis per PRIORY_CAMPAIGN_DECISION.md
- **Findings:** 
  - Blog post identical (same MD5 hash)
  - Carousel slides identical
  - Carousel post duplicate (same metrics, same date)
  - Video transcript was template placeholder only
  - Performance files were templates, not real data
  - No unique published content
- **Resolution:** Deleted entire duplicate campaign folder `2025-07-01-priory-scaling-safely`
- **Action Date:** 2025-12-14
- **Method:** `git rm -rf` (preserves git history for reversibility)
- **Updated:** Removed entry from `campaigns-index.json`
- **Canonical Campaign:** This campaign (`2025-07-01-priory-pharmacy-case-study`) is the canonical version containing all published content and metrics







