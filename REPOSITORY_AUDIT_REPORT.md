# TITAN Repository Audit Report
**Date:** 2025-12-10  
**Auditor:** AI Assistant  
**Scope:** Complete repository structure analysis and reorganization proposal

---

## Executive Summary

This audit examined **112 campaigns** across TITAN and TITANVERSE products, identifying structural inconsistencies, missing metadata, duplicate content, and opportunities for standardization. The repository shows good organization overall but requires cleanup and standardization to improve maintainability and discoverability.

**Key Findings:**
- ✅ **112 campaigns** organized by product (TITAN/TITANVERSE)
- ⚠️ **46 campaigns** missing README.md files (41%)
- ⚠️ **46 campaigns** missing campaign-meta.json (41%)
- ⚠️ **52 campaigns** missing post-mortem.md (46%)
- ⚠️ **184 folders** still using `_example*` naming (should be renamed)
- ⚠️ **Transcript duplication** across content/ and social/ folders
- ⚠️ **Inconsistent alt text** storage (3 different locations)
- ⚠️ **Root-level analytics files** that should be centralized
- ⚠️ **Interview transcripts** in `/research/interviews/` but docs reference `/_interviews-raw/`

---

## 1. Current State Analysis

### 1.1 Campaign Structure

**Total Campaigns:** 112
- TITAN: ~60 campaigns
- TITANVERSE: ~52 campaigns

**Campaign Completeness:**
- ✅ **66 campaigns** have README.md (59%)
- ✅ **66 campaigns** have campaign-meta.json (59%)
- ✅ **60 campaigns** have post-mortem.md (54%)
- ✅ **92 campaigns** have performance JSON files (82%)

### 1.2 File Organization Issues

#### Missing Core Files
- **46 campaigns** missing `README.md`
- **46 campaigns** missing `campaign-meta.json`
- **52 campaigns** missing `post-mortem.md`

#### Naming Inconsistencies
- **184 folders** still named `_example*` (should be renamed to actual post dates)
- Examples:
  - `social/linkedin/_example-longform/` → should be `2025-12-05-post-name/`
  - `content/video/shorts/_example-clip-1/` → should be `2025-12-05-clip-name/`

#### Duplicate Content
- **Transcripts duplicated** in multiple locations:
  - `content/video/shorts/YYYY-MM-DD-transcript.md`
  - `social/linkedin/YYYY-MM-DD-post/transcript.md`
  - Both contain same content (e.g., knight-street campaign)

#### Inconsistent Alt Text Storage
Found alt text in **3 different locations**:
1. `content/carousel/slides-alt-text.md` (some campaigns)
2. `content/single-image/image-01.md` (inconsistent - many missing)
3. `social/linkedin/YYYY-MM-DD-post/meta.json` (some campaigns)

**Alt Text Coverage:**
- Carousels: ~10 campaigns have dedicated alt text files
- Single images: ~13 of 50+ campaigns have alt text in content files
- Many campaigns store alt text only in meta.json

### 1.3 Root-Level Files

**Files that may belong in shared folders:**
- `tcps_scores.csv` - Analytics data → should be in `/analytics/`
- `tcps_scores.json` - Analytics data → should be in `/analytics/`
- `folder_structure.md` - Very large (246KB), possibly outdated documentation
- `repo-map.md` - Duplicate of README.md content

**Files that should stay in root:**
- `README.md` - Main documentation ✅
- `campaigns-index.json` - Campaign index ✅
- `titan-ai-instructions.md` - AI instructions ✅
- `titan-ai-behaviour-context.json` - AI context ✅

### 1.4 Interview/Transcript Organization

**Current State:**
- Raw interviews stored in `/research/interviews/titan/` (28 files)
- Documentation references `/_interviews-raw/` (doesn't exist)
- Campaigns contain duplicate transcripts in multiple locations

**Issues:**
- Path mismatch between docs and actual location
- Transcripts duplicated in campaigns (should reference source only)
- No clear separation between raw interviews and campaign transcripts

### 1.5 Template Issues

**Found nested template folder:**
- `campaigns/TITANVERSE/2025-11-18-one-app-to-rule-them-all-meme/campaign-template/`
  - This is a duplicate template folder inside a campaign
  - Should be removed (campaign already has proper structure)

### 1.6 Analytics & Performance Data

**Current Distribution:**
- Performance JSON files: 92 campaigns have them
- Metrics JSON files: 314 files (one per social post)
- Meta JSON files: 314 files (one per social post)
- Root-level analytics: `tcps_scores.csv/json` (should be centralized)

**Missing:**
- Centralized analytics folder for cross-campaign analysis
- Aggregated performance reports

---

## 2. Proposed Directory Structure

### 2.1 Root Structure

```
TITAN/
├── README.md                          # Main documentation
├── campaigns-index.json               # Campaign index (keep)
├── titan-ai-instructions.md          # AI instructions (keep)
├── titan-ai-behaviour-context.json   # AI context (keep)
│
├── campaigns/                         # All campaigns
│   ├── _templates/                    # Template files
│   │   └── campaign-template/         # Campaign template
│   ├── TITAN/                         # TITAN campaigns
│   └── TITANVERSE/                    # TITANVERSE campaigns
│
├── shared/                            # NEW: Shared resources
│   ├── analytics/                    # NEW: Cross-campaign analytics
│   │   ├── tcps_scores.csv
│   │   ├── tcps_scores.json
│   │   └── aggregated-reports/       # Future aggregated reports
│   ├── transcripts/                  # NEW: Centralized transcripts
│   │   ├── raw-interviews/           # Raw interview transcripts
│   │   │   ├── titan/
│   │   │   │   ├── case-studies/
│   │   │   │   ├── leadership/
│   │   │   │   └── product-vo/
│   │   │   └── titanverse/
│   │   └── campaign-transcripts/     # Campaign-specific transcripts
│   └── alt-text/                     # NEW: Centralized alt text library
│       ├── carousels/
│       └── single-images/
│
├── brand/                             # Brand assets (keep)
├── research/                          # Research files (keep)
├── scripts/                           # Automation scripts (keep)
├── inspiration/                       # Inspiration library (keep)
└── audit_results/                     # Audit reports (keep)
```

### 2.2 Standardized Campaign Structure

**Every campaign should have:**

```
YYYY-MM-DD-campaign-name/
├── README.md                          # REQUIRED: Campaign overview
├── campaign-meta.json                 # REQUIRED: Campaign metadata
├── post-mortem.md                     # REQUIRED: Campaign learnings
│
├── content/                           # Source content
│   ├── blog/
│   │   └── blog.md
│   ├── carousel/
│   │   ├── slides.md
│   │   └── alt-text.md               # STANDARDIZED: Alt text here
│   ├── single-image/
│   │   ├── image-01.md
│   │   └── alt-text.md               # STANDARDIZED: Alt text here
│   ├── video/
│   │   ├── longform/
│   │   │   ├── transcript.md
│   │   │   └── notes.md
│   │   └── shorts/
│   │       └── YYYY-MM-DD-clip-name/  # RENAME: Remove _example*
│   │           ├── transcript.md
│   │           └── notes.md
│   └── poll/
│       └── poll.md
│
├── social/                            # Published social posts
│   ├── linkedin/
│   │   └── YYYY-MM-DD-post-name/     # RENAME: Remove _example*
│   │       ├── caption.md
│   │       ├── meta.json
│   │       ├── metrics.json
│   │       └── comments.md            # Optional
│   ├── tiktok/
│   │   └── YYYY-MM-DD-clip-name/     # RENAME: Remove _example*
│   │       ├── caption.md
│   │       ├── meta.json
│   │       ├── metrics.json
│   │       └── comments.md
│   └── youtube/
│       ├── YYYY-MM-DD-longform/      # RENAME: Remove _example*
│       └── YYYY-MM-DD-short/         # RENAME: Remove _example*
│
├── performance/                       # Campaign-level performance
│   ├── linkedin.json
│   ├── tiktok.json
│   └── youtube.json
│
└── references/                        # NEW: References to shared resources
    └── transcript-sources.md          # Links to shared/transcripts/raw-interviews/
```

### 2.3 Key Changes

1. **New `/shared/` folder** for:
   - Analytics data (moved from root)
   - Centralized transcripts (moved from `/research/interviews/`)
   - Alt text library (for reusable patterns)

2. **Standardized alt text location:**
   - `content/carousel/alt-text.md`
   - `content/single-image/alt-text.md`
   - Remove alt text from meta.json (keep reference only)

3. **Remove transcript duplication:**
   - Campaigns reference transcripts in `/shared/transcripts/`
   - No duplicate transcripts in campaigns

4. **Rename all `_example*` folders:**
   - Use actual post dates and descriptive names
   - Remove placeholder naming

5. **Add `references/` folder:**
   - Links to shared resources
   - Transcript source references
   - Reusable content references

---

## 3. Issues & Inconsistencies Found

### 3.1 Critical Issues

#### ❌ Missing Core Files
- **46 campaigns** missing `README.md`
- **46 campaigns** missing `campaign-meta.json`
- **52 campaigns** missing `post-mortem.md`

**Impact:** Reduced discoverability, missing context, incomplete documentation

#### ❌ Placeholder Folders Not Renamed
- **184 folders** still named `_example*`
- Examples:
  - `social/linkedin/_example-longform/`
  - `content/video/shorts/_example-clip-1/`
  - `social/youtube/_example-short/`

**Impact:** Confusing structure, unclear which are templates vs. actual posts

#### ❌ Transcript Duplication
- Transcripts stored in both `content/video/` and `social/linkedin/` folders
- Same content duplicated (e.g., knight-street campaign)

**Impact:** Maintenance burden, potential inconsistencies

### 3.2 Moderate Issues

#### ⚠️ Inconsistent Alt Text Storage
- **3 different locations:**
  1. `content/carousel/slides-alt-text.md` (some campaigns)
  2. `content/single-image/image-01.md` (inconsistent)
  3. `social/linkedin/YYYY-MM-DD-post/meta.json` (some campaigns)

**Impact:** Hard to find, inconsistent access patterns

#### ⚠️ Interview Path Mismatch
- Actual location: `/research/interviews/titan/`
- Documentation references: `/_interviews-raw/`
- Git status shows deleted `_interviews-raw/` files

**Impact:** Confusion, broken references

#### ⚠️ Root-Level Analytics Files
- `tcps_scores.csv` and `tcps_scores.json` in root
- Should be in centralized analytics folder

**Impact:** Cluttered root, harder to find analytics

### 3.3 Minor Issues

#### ⚠️ Nested Template Folder
- `campaigns/TITANVERSE/2025-11-18-one-app-to-rule-them-all-meme/campaign-template/`
- Duplicate template inside campaign

**Impact:** Confusion, unnecessary duplication

#### ⚠️ Inconsistent Carousel Alt Text Naming
- Most: `slides-alt-text.md`
- One: `2025-08-13-puri-health-hub-slides-alt-text.md` (date-prefixed)

**Impact:** Inconsistent naming patterns

#### ⚠️ Missing Alt Text
- Many single-image content files missing alt text
- Some campaigns have alt text only in meta.json

**Impact:** Accessibility issues, incomplete documentation

---

## 4. Missing Metadata Analysis

### 4.1 Campaign-Level Metadata

**Missing `campaign-meta.json` (46 campaigns):**
- All campaigns should have standardized metadata
- Required fields: title, type, brand, status, dates, owner

**Missing `README.md` (46 campaigns):**
- Campaign overview, objectives, key assets
- Essential for understanding campaign context

**Missing `post-mortem.md` (52 campaigns):**
- Performance learnings, what worked/didn't work
- Critical for pattern recognition

### 4.2 Content-Level Metadata

**Missing Alt Text:**
- Single images: ~37 campaigns missing alt text in content files
- Some have alt text only in meta.json (should be in content files)

**Missing Transcripts:**
- Some video campaigns missing transcripts
- Some transcripts only in social folders, not content folders

**Missing Meta.json:**
- All social posts should have meta.json
- Current: 314 meta.json files (good coverage)

---

## 5. Files That Should Live in Shared Folders

### 5.1 Analytics Files → `/shared/analytics/`

**Move from root:**
- `tcps_scores.csv`
- `tcps_scores.json`

**Future additions:**
- Aggregated performance reports
- Cross-campaign analysis
- Trend reports

### 5.2 Transcripts → `/shared/transcripts/`

**Move from `/research/interviews/`:**
- All raw interview transcripts (28 files)
- Organize by product and type:
  - `raw-interviews/titan/case-studies/`
  - `raw-interviews/titan/leadership/`
  - `raw-interviews/titan/product-vo/`

**Create:**
- `campaign-transcripts/` for campaign-specific transcripts
- Reference system linking campaigns to transcripts

### 5.3 Alt Text → `/shared/alt-text/` (Optional)

**For reusable patterns:**
- Common alt text templates
- Reusable descriptions
- Pattern library

**Note:** Campaign-specific alt text stays in campaigns, this is for shared patterns only.

---

## 6. Migration Plan

### Phase 1: Create New Structure (No File Moves)

**Step 1.1: Create `/shared/` folder structure**
```bash
mkdir -p shared/analytics
mkdir -p shared/transcripts/raw-interviews/titan/{case-studies,leadership,product-vo}
mkdir -p shared/transcripts/raw-interviews/titanverse/{case-studies,leadership,product-vo}
mkdir -p shared/transcripts/campaign-transcripts
mkdir -p shared/alt-text/{carousels,single-images}
```

**Step 1.2: Update documentation**
- Update README.md with new structure
- Update CAMPAIGN-PLAYBOOK.md with new paths
- Create migration guide

### Phase 2: Move Shared Resources

**Step 2.1: Move analytics files**
```bash
mv tcps_scores.csv shared/analytics/
mv tcps_scores.json shared/analytics/
```

**Step 2.2: Move interview transcripts**
```bash
# Move from research/interviews/ to shared/transcripts/raw-interviews/
mv research/interviews/titan/case-studies/*.txt shared/transcripts/raw-interviews/titan/case-studies/
mv research/interviews/titan/leadership/*.txt shared/transcripts/raw-interviews/titan/leadership/
mv research/interviews/titan/product-vo/*.txt shared/transcripts/raw-interviews/titan/product-vo/
```

**Step 2.3: Update references**
- Update all campaign references to new transcript paths
- Update documentation references

### Phase 3: Standardize Campaign Structure

**Step 3.1: Add missing core files**
- Create `README.md` for 46 campaigns missing it
- Create `campaign-meta.json` for 46 campaigns missing it
- Create `post-mortem.md` for 52 campaigns missing it

**Step 3.2: Standardize alt text location**
- Move alt text from meta.json to dedicated files:
  - `content/carousel/alt-text.md`
  - `content/single-image/alt-text.md`
- Keep reference in meta.json pointing to content file

**Step 3.3: Remove transcript duplication**
- Identify duplicate transcripts in campaigns
- Remove duplicates from `social/` folders (keep in `content/` only)
- Add references to shared transcripts where applicable

### Phase 4: Rename Placeholder Folders

**Step 4.1: Identify all `_example*` folders**
- List all 184 folders
- Map to actual post dates and names

**Step 4.2: Batch rename**
- Rename `_example-longform` → `YYYY-MM-DD-post-name`
- Rename `_example-carousel` → `YYYY-MM-DD-post-name`
- Rename `_example-clip-1` → `YYYY-MM-DD-clip-name`
- Update all references in meta.json files

**Step 4.3: Update references**
- Update meta.json files with new folder names
- Update any scripts that reference old paths

### Phase 5: Cleanup

**Step 5.1: Remove nested template**
- Delete `campaigns/TITANVERSE/2025-11-18-one-app-to-rule-them-all-meme/campaign-template/`

**Step 5.2: Standardize carousel alt text naming**
- Rename date-prefixed files to `slides-alt-text.md`
- Ensure consistent naming

**Step 5.3: Update campaigns-index.json**
- Regenerate index with new structure
- Verify all campaigns indexed correctly

### Phase 6: Validation

**Step 6.1: Verify structure**
- All campaigns have README.md, campaign-meta.json, post-mortem.md
- All `_example*` folders renamed
- No duplicate transcripts
- Alt text in standardized locations

**Step 6.2: Update documentation**
- Finalize README.md
- Update CAMPAIGN-PLAYBOOK.md
- Create structure reference guide

---

## 7. Detailed File Inventory

### 7.1 Campaign Files

**Total Campaigns:** 112
- TITAN: ~60
- TITANVERSE: ~52

**File Completeness:**
- README.md: 66/112 (59%)
- campaign-meta.json: 66/112 (59%)
- post-mortem.md: 60/112 (54%)
- performance/*.json: 92/112 (82%)

### 7.2 Social Post Files

**Total Social Posts:** ~314
- meta.json: 314/314 (100%) ✅
- metrics.json: 314/314 (100%) ✅
- caption.md: ~314/314 (~100%) ✅
- comments.md: ~200/314 (~64%) ⚠️

### 7.3 Content Files

**Video Transcripts:** 73 files
- In `content/video/`: ~40 files
- In `social/linkedin/`: ~10 files (duplicates)
- Missing: ~23 campaigns with video but no transcript

**Alt Text Files:**
- Carousel alt text: ~10 files
- Single image alt text: ~13 files with alt text in content
- Missing: ~37 single-image campaigns without alt text in content files

### 7.4 Root-Level Files

**Keep in Root:**
- README.md ✅
- campaigns-index.json ✅
- titan-ai-instructions.md ✅
- titan-ai-behaviour-context.json ✅

**Move to `/shared/analytics/`:**
- tcps_scores.csv
- tcps_scores.json

**Review/Archive:**
- folder_structure.md (246KB, possibly outdated)
- repo-map.md (duplicate of README.md)

---

## 8. Recommendations

### 8.1 Immediate Actions (High Priority)

1. **Create `/shared/` folder structure**
   - Set up analytics, transcripts, alt-text folders
   - Move root-level analytics files

2. **Add missing core files**
   - Generate README.md for 46 campaigns
   - Generate campaign-meta.json for 46 campaigns
   - Create post-mortem.md templates for 52 campaigns

3. **Standardize alt text**
   - Move alt text to dedicated files in content folders
   - Update meta.json to reference content files

### 8.2 Short-Term Actions (Medium Priority)

4. **Rename placeholder folders**
   - Batch rename 184 `_example*` folders
   - Update all references

5. **Remove transcript duplication**
   - Keep transcripts in `content/video/` only
   - Remove duplicates from `social/` folders
   - Add references to shared transcripts

6. **Move interview transcripts**
   - Move from `/research/interviews/` to `/shared/transcripts/raw-interviews/`
   - Update all documentation references

### 8.3 Long-Term Actions (Low Priority)

7. **Create alt text library**
   - Build reusable alt text patterns
   - Document best practices

8. **Generate aggregated analytics**
   - Create cross-campaign performance reports
   - Build trend analysis

9. **Archive old documentation**
   - Review `folder_structure.md` and `repo-map.md`
   - Archive or consolidate if outdated

---

## 9. Risk Assessment

### 9.1 Low Risk Changes
- ✅ Creating new `/shared/` folders
- ✅ Moving root-level analytics files
- ✅ Adding missing README.md files
- ✅ Standardizing alt text location

### 9.2 Medium Risk Changes
- ⚠️ Moving interview transcripts (requires reference updates)
- ⚠️ Removing duplicate transcripts (verify no broken links)
- ⚠️ Renaming `_example*` folders (requires meta.json updates)

### 9.3 High Risk Changes
- ⚠️ Batch renaming 184 folders (requires careful testing)
- ⚠️ Updating all meta.json references (verify scripts still work)

**Mitigation:**
- Test changes on a subset first
- Keep backups before batch operations
- Update scripts and automation after structure changes
- Verify campaigns-index.json regeneration works

---

## 10. Success Criteria

### 10.1 Structure Completeness
- ✅ 100% of campaigns have README.md
- ✅ 100% of campaigns have campaign-meta.json
- ✅ 100% of campaigns have post-mortem.md
- ✅ 0 `_example*` folders remaining
- ✅ No duplicate transcripts

### 10.2 Standardization
- ✅ Alt text in standardized locations
- ✅ Consistent folder naming
- ✅ All references updated
- ✅ Documentation matches structure

### 10.3 Discoverability
- ✅ All shared resources in `/shared/`
- ✅ Clear separation of concerns
- ✅ Easy to find analytics, transcripts, alt text
- ✅ Clear campaign structure

---

## 11. Next Steps

1. **Review this audit report** with stakeholders
2. **Approve proposed structure** and migration plan
3. **Execute Phase 1** (create new structure, no moves)
4. **Test Phase 2** on subset of campaigns
5. **Execute full migration** after validation
6. **Update all documentation** and scripts
7. **Validate** final structure meets success criteria

---

## Appendix A: File Counts Summary

- **Total Campaigns:** 112
- **Total Social Posts:** ~314
- **Total Transcripts:** 73
- **Total Alt Text Files:** ~23
- **Placeholder Folders:** 184
- **Missing README.md:** 46
- **Missing campaign-meta.json:** 46
- **Missing post-mortem.md:** 52

---

## Appendix B: Example Campaign Structure (After Migration)

```
2025-12-05-knight-street-pharmacy-site-visit/
├── README.md
├── campaign-meta.json
├── post-mortem.md
│
├── content/
│   ├── single-image/
│   │   ├── image-01.md
│   │   └── alt-text.md              # NEW: Standardized location
│   └── video/
│       └── shorts/
│           └── 2025-12-05-knight-street-batch-flow/  # RENAMED: Was _example-clip-1
│               ├── transcript.md
│               └── notes.md
│
├── social/
│   └── linkedin/
│       ├── 2025-12-05-knight-street-batch-flow-video/  # RENAMED: Was _example-longform
│       │   ├── caption.md
│       │   ├── meta.json
│       │   ├── metrics.json
│       │   └── comments.md
│       └── 2025-12-06-tumi-batch-flow-single-image/
│           ├── caption.md
│           ├── meta.json
│           ├── metrics.json
│           └── comments.md
│
├── performance/
│   └── linkedin.json
│
└── references/                       # NEW: References to shared resources
    └── transcript-sources.md        # Links to shared/transcripts/
```

---

**End of Audit Report**
