# TCPS Analysis Output Structure (Per-Branch)

This document shows the required output format for TCPS rankings and analysis, demonstrating the mandatory branch separation rule.

---

## TITAN TCPS RANKING

### Top 10 by TCPS

1. **TCPS: 322.2007**
   - Impressions: 1,996
   - Asset Type: short-video
   - Campaign: `2025-10-01-pharmacy-show-build-up`
   - Posted At: 2025-09-02
   - File: `campaigns/TITAN/2025-10-01-pharmacy-show-build-up/social/linkedin/2025-09-02-pharmacy-show-announcement/metrics.json`

2. **TCPS: 313.3775**
   - Impressions: 4,785
   - Asset Type: (empty)
   - Campaign: `2025-07-11-titan-1000th-pharmacy`
   - Posted At: 2025-07-11
   - File: `campaigns/TITAN/2025-07-11-titan-1000th-pharmacy/social/linkedin/2025-07-11-titan-1000th-milestone/metrics.json`

[... continue for top 10 ...]

### Bottom 10 by TCPS

1. **TCPS: 58.2427**
   - Impressions: 1,112
   - Asset Type: poll
   - Campaign: `2025-01-15-poll-top-pharmacy-priority`
   - Posted At: 2025-01-15
   - File: `campaigns/TITAN/2025-01-15-poll-top-pharmacy-priority/social/linkedin/2025-01-15-poll-top-pharmacy-priority/metrics.json`

[... continue for bottom 10 ...]

### TITAN Statistics
- **Total eligible posts scanned:** 120
- **Min TCPS:** 58.2427
- **Median TCPS:** 159.7625
- **Max TCPS:** 322.2007

---

## TITANVERSE TCPS RANKING

### Top 10 by TCPS

1. **TCPS: 529.517**
   - Impressions: 1,073
   - Asset Type: single-image
   - Campaign: `2025-10-08-titanverse-first-webinar`
   - Posted At: 2025-10-08
   - File: `campaigns/TITANVERSE/2025-10-08-titanverse-first-webinar/social/linkedin/2025-10-08-titanverse-first-webinar/metrics.json`

2. **TCPS: 480.4701**
   - Impressions: 687
   - Asset Type: carousel
   - Campaign: `2025-12-02-pharmacy-is-shifting-fast`
   - Posted At: 2025-12-02
   - File: `campaigns/TITANVERSE/2025-12-02-pharmacy-is-shifting-fast/social/linkedin/2025-12-02-pharmacy-is-shifting-fast/metrics.json`

[... continue for top 10 ...]

### Bottom 10 by TCPS

1. **TCPS: 31.4861**
   - Impressions: 794
   - Asset Type: short-video
   - Campaign: `2025-10-23-titanverse-one-app-one-flow`
   - Posted At: 2025-10-23
   - File: `campaigns/TITANVERSE/2025-10-23-titanverse-one-app-one-flow/social/linkedin/2025-10-23-titanverse-one-app-one-flow/metrics.json`

[... continue for bottom 10 ...]

### TITANVERSE Statistics
- **Total eligible posts scanned:** 30
- **Min TCPS:** 31.4861
- **Median TCPS:** 221.902
- **Max TCPS:** 529.517

---

## Notes

- Rankings are computed separately for each branch.
- Statistics (min/median/max) are calculated per branch, not globally.
- No cross-branch comparisons are made.
- Branch is determined strictly from file path: `campaigns/TITAN/` or `campaigns/TITANVERSE/`.
