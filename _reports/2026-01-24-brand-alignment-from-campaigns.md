# Brand Alignment from Campaigns — 2026-01-24

## Overview

- **Posts identified as Titan (from campaigns):** 74
- **Posts identified as Titanverse (from campaigns):** 25

## Moves

| Brand | Published | Needs-metrics | Unpublished |
|-------|-----------|---------------|-------------|
| Titan | 73 | 5 | 9 |
| Titanverse | 2 | 1 | 0 |

## Brand conflicts (slug in both TITAN and TITANVERSE)

(none)

## Referenced in campaigns but not found under /posts

(none)

## Still under /posts/published, /posts/unpublished, or /posts/needs-metrics

These posts were not referenced in any campaign `posts` array (or could not be assigned a brand). They remain in the legacy locations.

(none)

## Recommended manual fixes

1. Assign brand (Titan vs Titanverse) for "still legacy" posts, e.g. by adding them to the appropriate campaign `posts` arrays and re-running this script, or by moving them manually into `/posts/titan/**` or `/posts/titanverse/**` and updating `meta.json` + `post-index.json`.
2. Resolve any brand conflicts by updating campaigns so each slug appears in only one brand.
3. Run `git add` and commit after reviewing changes.
