# TCPS Specification: Tiered v3

**Version:** `linkedin_tcps_v3_tiered`  
**Last Updated:** 2025-01-XX  
**Status:** Canonical Reference

---

## 1. What TCPS Is For

**TCPS (Total Content Performance Score)** is a composite metric that measures content performance using two dimensions:

1. **Distribution (Organic Impressions as Algorithmic Endorsement)**
   - Organic impressions represent the platform's algorithmic decision to show content to users
   - Higher impressions indicate stronger algorithmic endorsement and broader reach
   - This dimension rewards content that achieves meaningful scale

2. **Efficiency (Actions Per Impression)**
   - Measures how effectively content converts impressions into meaningful actions
   - Normalizes engagement metrics (comments, reactions, reposts, follows, clicks) per 1,000 impressions
   - This dimension rewards content that drives high-quality engagement

**Critical Constraint:** TCPS is **branch-relative** and **not cross-comparable**:
- **TITAN** and **TITANVERSE** are separate product branches with distinct audiences and content strategies
- TCPS values are only meaningful when compared within the same branch
- TCPS values are only comparable within the same TCPS version
- TCPS is an **ordinal efficiency score**, not an absolute quality measure

---

## 2. Why Tiering Exists

### The Problem with TCPS v1/v2

Previous TCPS versions (v1 and v2) had a critical flaw: **low-sample posts could outrank flagship posts** due to:

- Small-sample bias: Posts with very few impressions could achieve high per-impression engagement rates by chance
- Soft bonus approach: Impressions were treated as a logarithmic bonus, allowing low-impression posts to compete directly with high-impression posts
- Misleading rankings: A post with 100 impressions and 50 engagements could outrank a post with 5,000 impressions and 200 engagements

### The Solution: Impression Tiers as Gates

TCPS v3 introduces **impression tiers as gates**, not soft bonuses:

- **Impressions act as a gate**: Posts must reach minimum impression thresholds to enter higher tiers
- **Tier separation**: All posts in Tier A outrank all posts in Tier B, regardless of efficiency scores
- **Within-tier ranking**: Posts are ranked by efficiency within their tier
- **Prevents small-sample dominance**: Low-impression posts cannot outrank flagship posts, even with exceptional engagement rates

This ensures that **distribution (scale) and efficiency (quality) are both required** for top-tier performance.

---

## 3. Impression Tiers (Based on TITAN Data)

Impression tiers are based on **organic impressions only** (excluding sponsored/boosted impressions from tier assignment).

| Tier | Organic Impressions | Description |
|------|---------------------|-------------|
| **A** | ≥ 3,500 | Flagship posts with broad algorithmic endorsement |
| **B** | 1,500–3,499 | Strong distribution, above-average reach |
| **C** | 500–1,499 | Moderate distribution, typical organic reach |
| **D** | < 500 | Low-sample posts, limited algorithmic endorsement |

### Tier Calibration Notes

- These thresholds are based on analysis of TITAN campaign data
- Tiers may be recalibrated in future versions using real impression distributions
- Tier boundaries are designed to create meaningful separation between distribution levels
- The goal is to ensure flagship posts (Tier A) represent content that achieved meaningful scale

---

## 4. TCPS v3 Maths (Exact)

### Step 0: Organic Impressions Normalization

**Rule:** Use organic impressions exclusively for TCPS calculation.

1. If `organic.impressions` exists, use it
2. If `organic.impressions` is missing but `impressions` exists and no sponsored data is present, use `impressions`
3. If only `total_impressions` exists, use it but flag with `impressions_not_confirmed_organic` warning
4. If impressions are 0 or missing, flag with `impressions_missing_or_zero` warning and use `max(1, impressions)` for calculation

**Stored Value:** `tcps_inputs.impressions_used` = the organic impressions value used for calculation

### Step 1: Per-1k Normalization

All engagement metrics are normalized per 1,000 impressions to enable cross-post comparison:

```
r_comments = (comments / max(1, impressions_used)) * 1000
r_reposts = (reposts / max(1, impressions_used)) * 1000
r_follows = (follows / max(1, impressions_used)) * 1000
r_reactions = (reactions / max(1, impressions_used)) * 1000
r_clicks = (clicks / max(1, impressions_used)) * 1000
```

**Note:** `max(1, impressions_used)` prevents division by zero while preserving the actual impression count for tier assignment.

### Step 2: Diminishing Returns on Clicks

Clicks receive diminishing returns treatment to prevent click-heavy posts from dominating:

```
click_signal = log(1 + r_clicks)
```

This logarithmic transformation ensures that:
- High click rates are rewarded, but not linearly
- Very high click rates (e.g., carousel posts) don't overwhelm other engagement signals
- The click signal contributes meaningfully but proportionally

### Step 3: Efficiency Score Calculation

The efficiency score combines normalized engagement rates with weighted importance:

```
tcps_efficiency_raw =
  (r_comments * 20) +
  (r_follows * 25) +
  (r_reposts * 12) +
  (r_reactions * 3) +
  (click_signal * 15)
```

**Weight Rationale:**
- **Follows (25)**: Highest weight - indicates strong brand affinity and future reach
- **Comments (20)**: High weight - indicates deep engagement and conversation
- **Clicks (15 via click_signal)**: Moderate weight - indicates interest but with diminishing returns
- **Reposts (12)**: Moderate weight - indicates shareability and amplification
- **Reactions (3)**: Lowest weight - indicates awareness but lowest commitment

### Step 4: Tier Assignment

Assign tier based on `impressions_used`:

```
if impressions_used >= 3500:
    tier = "A"
elif impressions_used >= 1500:
    tier = "B"
elif impressions_used >= 500:
    tier = "C"
else:
    tier = "D"
```

**Stored Value:** `tcps_impression_tier` = "A" | "B" | "C" | "D"

### Step 5: Tier Base Offsets

Each tier receives a base offset to ensure tier separation:

| Tier | Base Offset |
|------|-------------|
| A    | 3000       |
| B    | 2000       |
| C    | 1000       |
| D    | 0          |

These offsets guarantee that:
- All Tier A posts have `tcps_total_raw >= 3000`
- All Tier B posts have `2000 <= tcps_total_raw < 3000`
- All Tier C posts have `1000 <= tcps_total_raw < 2000`
- All Tier D posts have `tcps_total_raw < 1000`

### Step 6: Final Score Calculation

The final TCPS score combines tier base with efficiency:

```
tcps_total_raw = tier_base + tcps_efficiency_raw
```

**Example:**
- Post with 4,000 impressions, efficiency score of 220.71
- Tier: A (base = 3000)
- `tcps_total_raw = 3000 + 220.71 = 3220.71`

---

## 5. Stored Fields Per Asset

Each LinkedIn `metrics.json` file stores the following TCPS v3 fields:

### `tcps_version`
- **Type:** String
- **Value:** `"linkedin_tcps_v3_tiered"`
- **Purpose:** Identifies the TCPS calculation version used
- **Note:** Historical versions (v1, v2) are preserved and never overwritten

### `tcps_efficiency_raw`
- **Type:** Number (float, rounded to 4 decimal places)
- **Range:** 0 to ~600+ (theoretical maximum depends on engagement rates)
- **Purpose:** The efficiency component of TCPS, measuring engagement per impression
- **Calculation:** See Step 3 above

### `tcps_impression_tier`
- **Type:** String
- **Values:** `"A"` | `"B"` | `"C"` | `"D"`
- **Purpose:** The distribution tier assigned based on organic impressions
- **Calculation:** See Step 4 above

### `tcps_total_raw`
- **Type:** Number (float, rounded to 4 decimal places)
- **Range:** 
  - Tier A: 3000 to ~3600+
  - Tier B: 2000 to ~3000
  - Tier C: 1000 to ~2000
  - Tier D: 0 to ~1000
- **Purpose:** The final TCPS score used for ranking
- **Calculation:** `tier_base + tcps_efficiency_raw`

### `tcps_inputs`
- **Type:** Object
- **Purpose:** Stores all inputs used in TCPS calculation for transparency and debugging
- **Fields:**
  ```json
  {
    "impressions_used": <number>,      // Organic impressions used
    "r_comments": <number>,            // Comments per 1k (rounded to 4dp)
    "r_follows": <number>,             // Follows per 1k (rounded to 4dp)
    "r_reposts": <number>,             // Reposts per 1k (rounded to 4dp)
    "r_reactions": <number>,           // Reactions per 1k (rounded to 4dp)
    "r_clicks": <number>,              // Clicks per 1k (rounded to 4dp)
    "click_signal": <number>           // log(1 + r_clicks) (rounded to 4dp)
  }
  ```

### Optional: `tcps_warnings`
- **Type:** Array of strings
- **Purpose:** Flags data quality issues that may affect TCPS accuracy
- **Possible Values:**
  - `"impressions_missing_or_zero"`: Impressions were 0 or missing
  - `"impressions_not_confirmed_organic"`: Used total impressions when organic was unavailable
  - `"impressions_used_was_total_corrected_to_organic"`: Corrected from total to organic

---

## 6. How TCPS Should Be Used

### Ranking Rules

1. **Rank Within Branch Only**
   - Never compare TCPS across TITAN and TITANVERSE
   - Each branch has distinct audiences, content strategies, and performance baselines
   - Always scope rankings to a single branch

2. **Respect Tier Separation**
   - Tier A posts always outrank Tier B posts
   - Tier B posts always outrank Tier C posts
   - Tier C posts always outrank Tier D posts
   - Within the same tier, rank by `tcps_efficiency_raw` (descending)

3. **Compare Within Same Version**
   - Only compare TCPS values calculated with the same `tcps_version`
   - Historical versions (v1, v2) are preserved for reference but should not be compared with v3

### Analysis Use Cases

1. **Content Performance Ranking**
   - Identify top and bottom performers within a branch
   - Understand which content types, topics, or formats drive efficiency
   - Learn from high-performing content patterns

2. **Tier Distribution Analysis**
   - Understand how many posts reach each tier
   - Identify content that achieves flagship status (Tier A)
   - Recognize low-sample posts that may need distribution support

3. **Efficiency Optimization**
   - Compare efficiency scores within the same tier
   - Identify content that converts impressions effectively
   - Learn what drives high-quality engagement

4. **Learning and Strategy**
   - Use TCPS to inform content strategy and format decisions
   - Identify successful content patterns to replicate
   - Understand what resonates with the audience

### Limitations

- **Not a Business Impact Measure**: TCPS measures content performance, not business outcomes (leads, conversions, revenue)
- **Ordinal, Not Absolute**: TCPS values are meaningful for ranking, not as absolute quality scores
- **Context Required**: Always consider campaign objectives, audience, and external factors when interpreting TCPS
- **Version-Specific**: TCPS values are only comparable within the same version

---

## 7. Versioning Rules

### Historical Preservation

**Rule:** Historical TCPS values are **never rewritten** or deleted.

- When a new TCPS version is implemented, old fields are preserved
- Files may contain multiple TCPS versions simultaneously:
  ```json
  {
    "tcps_version": "linkedin_tcps_v3_tiered",
    "tcps_raw": 166.33,                    // v1 value (preserved)
    "tcps_efficiency_raw": 166.32,         // v2 value (preserved)
    "tcps_distribution_raw": 9.51,         // v2 value (preserved)
    "tcps_total_raw": 3166.32,            // v3 value (current)
    "tcps_impression_tier": "A"            // v3 value (current)
  }
  ```

### Version String Format

- **Format:** `"linkedin_tcps_v{N}_{descriptor}"`
- **Examples:**
  - `"linkedin_tcps_v1"`: Original TCPS calculation
  - `"linkedin_tcps_v1_organic"`: v1 with organic impressions normalization
  - `"linkedin_tcps_v2_efficiency_plus_distribution"`: Two-component model
  - `"linkedin_tcps_v3_tiered"`: Tiered gate model (current)

### Version Changes

**Any change to TCPS maths requires a new version string:**

- Formula changes (e.g., weight adjustments)
- Tier threshold changes
- Normalization method changes
- New component additions

**Non-breaking changes that do NOT require version changes:**
- Bug fixes that correct calculation errors
- Data quality improvements (e.g., fixing impressions_used)
- Documentation updates

### Migration Strategy

When implementing a new TCPS version:

1. Calculate new TCPS values for all eligible assets
2. Add new fields without removing old fields
3. Update `tcps_version` to the new version string
4. Preserve all historical TCPS fields for reference
5. Update this specification document

---

## Appendix: Quick Reference

### TCPS v3 Calculation Summary

```
1. impressions_used = organic.impressions (or fallback)
2. r_* = (engagement / max(1, impressions_used)) * 1000
3. click_signal = log(1 + r_clicks)
4. tcps_efficiency_raw = (r_comments * 20) + (r_follows * 25) + (r_reposts * 12) + (r_reactions * 3) + (click_signal * 15)
5. tier = assign_tier(impressions_used)  // A/B/C/D
6. tier_base = {A: 3000, B: 2000, C: 1000, D: 0}[tier]
7. tcps_total_raw = tier_base + tcps_efficiency_raw
```

### Tier Thresholds

- **Tier A:** ≥ 3,500 organic impressions
- **Tier B:** 1,500–3,499 organic impressions
- **Tier C:** 500–1,499 organic impressions
- **Tier D:** < 500 organic impressions

### Engagement Weights

- Follows: 25
- Comments: 20
- Clicks (via click_signal): 15
- Reposts: 12
- Reactions: 3

---

**This document is the canonical reference for TCPS Tiered v3. All calculations, tooling, and analysis must align with this specification.**
