# Repository Migration Plan
**Based on:** REPOSITORY_AUDIT_REPORT.md  
**Status:** PENDING APPROVAL  
**Estimated Time:** 4-6 hours

---

## Overview

This plan outlines the step-by-step migration to a clean, consistent directory structure. All changes are reversible and can be tested incrementally.

---

## Pre-Migration Checklist

- [ ] Review REPOSITORY_AUDIT_REPORT.md
- [ ] Backup repository: `git commit -am "Pre-migration backup"`
- [ ] Create migration branch: `git checkout -b structure-migration`
- [ ] Review and approve proposed structure
- [ ] Test on 1-2 campaigns first

---

## Phase 1: Create New Structure (30 minutes)

**Goal:** Create new folders without moving files yet.

### Step 1.1: Create `/shared/` folder structure

```bash
cd /Users/cameronmoorcroft/Documents/Repos/Clients/TITAN

# Create shared folder structure
mkdir -p shared/analytics
mkdir -p shared/transcripts/raw-interviews/titan/case-studies
mkdir -p shared/transcripts/raw-interviews/titan/leadership
mkdir -p shared/transcripts/raw-interviews/titan/product-vo
mkdir -p shared/transcripts/raw-interviews/titanverse/case-studies
mkdir -p shared/transcripts/raw-interviews/titanverse/leadership
mkdir -p shared/transcripts/raw-interviews/titanverse/product-vo
mkdir -p shared/transcripts/campaign-transcripts
mkdir -p shared/alt-text/carousels
mkdir -p shared/alt-text/single-images
```

**Verification:**
```bash
tree shared/ -L 3
```

---

## Phase 2: Move Shared Resources (1 hour)

**Goal:** Move root-level files and interview transcripts to shared folders.

### Step 2.1: Move analytics files

```bash
# Move analytics files from root to shared/analytics/
mv tcps_scores.csv shared/analytics/
mv tcps_scores.json shared/analytics/

# Verify move
ls -la shared/analytics/
```

**Update references:**
- Check scripts that reference `tcps_scores.csv/json`
- Update paths in scripts if needed

### Step 2.2: Move interview transcripts

```bash
# Move from research/interviews/ to shared/transcripts/raw-interviews/
mv research/interviews/titan/case-studies/*.txt shared/transcripts/raw-interviews/titan/case-studies/
mv research/interviews/titan/leadership/*.txt shared/transcripts/raw-interviews/titan/leadership/
mv research/interviews/titan/product-vo/*.txt shared/transcripts/raw-interviews/titan/product-vo/

# Verify move
ls -la shared/transcripts/raw-interviews/titan/case-studies/ | wc -l
```

**Update references:**
- Update CAMPAIGN-PLAYBOOK.md references
- Update any campaign README.md files that reference old paths
- Update scripts that reference interview transcripts

---

## Phase 3: Add Missing Core Files (2 hours)

**Goal:** Ensure all campaigns have README.md, campaign-meta.json, and post-mortem.md.

### Step 3.1: Identify campaigns missing files

```bash
# Find campaigns missing README.md
find campaigns/TITAN campaigns/TITANVERSE -type d -name "202*" | while read dir; do
  if [ ! -f "$dir/README.md" ]; then
    echo "$dir"
  fi
done > missing_readme.txt

# Find campaigns missing campaign-meta.json
find campaigns/TITAN campaigns/TITANVERSE -type d -name "202*" | while read dir; do
  if [ ! -f "$dir/campaign-meta.json" ]; then
    echo "$dir"
  fi
done > missing_meta.txt

# Find campaigns missing post-mortem.md
find campaigns/TITAN campaigns/TITANVERSE -type d -name "202*" | while read dir; do
  if [ ! -f "$dir/post-mortem.md" ]; then
    echo "$dir"
  fi
done > missing_postmortem.txt
```

### Step 3.2: Create missing files

**For each campaign missing README.md:**
- Copy template: `cp campaigns/_templates/campaign-template/README.md <campaign-dir>/README.md`
- Fill in campaign-specific details

**For each campaign missing campaign-meta.json:**
- Copy template: `cp campaigns/_templates/campaign-template/campaign-meta.json <campaign-dir>/campaign-meta.json`
- Extract metadata from campaign folder name and content

**For each campaign missing post-mortem.md:**
- Copy template: `cp campaigns/_templates/campaign-template/post-mortem.md <campaign-dir>/post-mortem.md`
- Mark as "TODO" if campaign is still active

**Note:** This step may require manual review for some campaigns.

---

## Phase 4: Standardize Alt Text (1 hour)

**Goal:** Move alt text to standardized locations in content folders.

### Step 4.1: Standardize carousel alt text

```bash
# Find all carousel alt text files
find campaigns -name "*alt*" -path "*/carousel/*" | while read file; do
  dir=$(dirname "$file")
  # Ensure it's named slides-alt-text.md
  if [[ "$file" != *"slides-alt-text.md" ]]; then
    mv "$file" "$dir/slides-alt-text.md"
  fi
done
```

### Step 4.2: Extract alt text from meta.json to content files

**For single images:**
- Check `social/linkedin/*/meta.json` for `image_alt_text`
- Create `content/single-image/alt-text.md` if missing
- Move alt text from meta.json to alt-text.md
- Update meta.json to reference: `"alt_text_source": "../../content/single-image/alt-text.md"`

**Script approach:**
```bash
# Find all single-image meta.json files with alt text
find campaigns -path "*/single-image/*" -name "meta.json" -exec grep -l "image_alt_text" {} \; | while read file; do
  campaign_dir=$(echo "$file" | sed 's|/social/.*||')
  alt_text=$(grep -A1 "image_alt_text" "$file" | tail -1 | sed 's/.*"\(.*\)".*/\1/')
  
  # Create alt-text.md if it doesn't exist
  if [ ! -f "$campaign_dir/content/single-image/alt-text.md" ]; then
    echo "# Alt Text" > "$campaign_dir/content/single-image/alt-text.md"
    echo "" >> "$campaign_dir/content/single-image/alt-text.md"
    echo "$alt_text" >> "$campaign_dir/content/single-image/alt-text.md"
  fi
done
```

---

## Phase 5: Remove Transcript Duplication (30 minutes)

**Goal:** Keep transcripts only in content/ folders, remove from social/ folders.

### Step 5.1: Identify duplicate transcripts

```bash
# Find transcripts in social folders
find campaigns -name "transcript.md" -path "*/social/*" > social_transcripts.txt

# For each, check if duplicate exists in content/
while read file; do
  campaign_dir=$(echo "$file" | sed 's|/social/.*||')
  # Check if similar transcript exists in content/
  if find "$campaign_dir/content" -name "transcript.md" | grep -q .; then
    echo "DUPLICATE: $file"
  fi
done < social_transcripts.txt
```

### Step 5.2: Remove duplicates

**Manual review recommended:**
- Compare transcripts in social/ vs content/
- If identical, remove from social/
- If different, keep both but document why
- Add reference in social/ folder pointing to content/ transcript

---

## Phase 6: Rename Placeholder Folders (1 hour)

**Goal:** Rename all `_example*` folders to actual post dates/names.

### Step 6.1: Map placeholder folders to real names

**This requires manual mapping based on:**
- Post dates from meta.json files
- Post names from caption.md files
- Campaign context

**Example mapping:**
```bash
# For each _example* folder, determine:
# 1. Actual post date (from meta.json or caption.md)
# 2. Descriptive name (from caption.md or campaign context)

# Template for renaming:
# _example-longform → YYYY-MM-DD-post-name
# _example-carousel → YYYY-MM-DD-post-name
# _example-clip-1 → YYYY-MM-DD-clip-name
```

### Step 6.2: Batch rename script

**Create rename script:**
```bash
#!/bin/bash
# rename_examples.sh

# Example: Rename _example-longform to actual date/name
# This requires manual mapping file: example_mapping.txt
# Format: old_path|new_name

while IFS='|' read -r old_path new_name; do
  if [ -d "$old_path" ]; then
    new_path=$(dirname "$old_path")/$new_name
    mv "$old_path" "$new_path"
    echo "Renamed: $old_path → $new_path"
    
    # Update meta.json references
    find campaigns -name "meta.json" -exec sed -i '' "s|$old_path|$new_path|g" {} \;
  fi
done < example_mapping.txt
```

**Note:** This step requires careful manual review and testing.

---

## Phase 7: Cleanup (30 minutes)

### Step 7.1: Remove nested template folder

```bash
# Remove duplicate template folder
rm -rf campaigns/TITANVERSE/2025-11-18-one-app-to-rule-them-all-meme/campaign-template/
```

### Step 7.2: Standardize carousel alt text naming

```bash
# Rename date-prefixed alt text files
find campaigns -name "*-slides-alt-text.md" -path "*/carousel/*" | while read file; do
  dir=$(dirname "$file")
  mv "$file" "$dir/slides-alt-text.md"
done
```

### Step 7.3: Update campaigns-index.json

```bash
# Regenerate index (if script exists)
python scripts/regenerate_index.py  # Adjust based on actual script
```

---

## Phase 8: Update Documentation (30 minutes)

### Step 8.1: Update README.md

- Update structure diagram
- Update paths to shared resources
- Update interview transcript paths

### Step 8.2: Update CAMPAIGN-PLAYBOOK.md

- Update transcript paths
- Update alt text locations
- Update folder naming conventions

### Step 8.3: Create structure reference

- Create `STRUCTURE_REFERENCE.md` with new structure
- Document all folder purposes
- Include examples

---

## Phase 9: Validation (30 minutes)

### Step 9.1: Verify structure

```bash
# Check all campaigns have core files
find campaigns/TITAN campaigns/TITANVERSE -type d -name "202*" | while read dir; do
  missing=""
  [ ! -f "$dir/README.md" ] && missing="$missing README.md"
  [ ! -f "$dir/campaign-meta.json" ] && missing="$missing campaign-meta.json"
  [ ! -f "$dir/post-mortem.md" ] && missing="$missing post-mortem.md"
  [ -n "$missing" ] && echo "$dir:$missing"
done
```

### Step 9.2: Verify no placeholder folders

```bash
# Check for remaining _example* folders
find campaigns -type d -name "_example*" | grep -v "_templates"
# Should return empty (except template folder)
```

### Step 9.3: Verify shared resources

```bash
# Check analytics files moved
ls shared/analytics/
# Should show tcps_scores.csv and tcps_scores.json

# Check transcripts moved
ls shared/transcripts/raw-interviews/titan/case-studies/ | wc -l
# Should show 28 files
```

### Step 9.4: Test scripts

- Run any automation scripts
- Verify they work with new structure
- Update scripts if needed

---

## Rollback Plan

If issues arise, rollback steps:

```bash
# Revert to pre-migration state
git checkout main
git branch -D structure-migration

# Or revert specific changes
git checkout HEAD -- tcps_scores.csv tcps_scores.json
git checkout HEAD -- research/interviews/
```

---

## Post-Migration Tasks

1. **Update all scripts** that reference old paths
2. **Notify team** of new structure
3. **Update CI/CD** if applicable
4. **Document** any manual steps required
5. **Monitor** for broken references

---

## Success Criteria

- [ ] All campaigns have README.md, campaign-meta.json, post-mortem.md
- [ ] 0 `_example*` folders (except templates)
- [ ] Analytics files in `/shared/analytics/`
- [ ] Transcripts in `/shared/transcripts/`
- [ ] Alt text in standardized locations
- [ ] No duplicate transcripts
- [ ] All documentation updated
- [ ] All scripts working
- [ ] campaigns-index.json regenerated

---

## Notes

- **Test incrementally:** Test each phase on 1-2 campaigns before full migration
- **Manual review:** Some steps require manual review (naming, content extraction)
- **Backup first:** Always backup before batch operations
- **Git commits:** Commit after each successful phase
- **Documentation:** Update docs as you go, not at the end

---

**Status:** Ready for review and approval
