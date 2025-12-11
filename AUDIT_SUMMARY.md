# Repository Audit Summary
**Quick Reference** | Full report: `REPOSITORY_AUDIT_REPORT.md` | Migration plan: `MIGRATION_PLAN.md`

---

## Key Numbers

- **112 campaigns** total (TITAN + TITANVERSE)
- **46 campaigns** missing README.md (41%)
- **46 campaigns** missing campaign-meta.json (41%)
- **52 campaigns** missing post-mortem.md (46%)
- **184 folders** still named `_example*` (should be renamed)
- **314 social posts** (good metadata coverage)
- **73 transcripts** (some duplicated)

---

## Critical Issues Found

### ❌ Missing Core Files
- 46 campaigns missing README.md
- 46 campaigns missing campaign-meta.json
- 52 campaigns missing post-mortem.md

### ❌ Placeholder Folders
- 184 folders still using `_example*` naming
- Should be renamed to actual post dates/names

### ❌ Transcript Duplication
- Transcripts stored in both `content/video/` and `social/linkedin/`
- Same content duplicated

### ⚠️ Inconsistent Alt Text
- Stored in 3 different locations:
  1. `content/carousel/slides-alt-text.md`
  2. `content/single-image/image-01.md`
  3. `social/linkedin/*/meta.json`

### ⚠️ Path Mismatches
- Interviews in `/research/interviews/` but docs reference `/_interviews-raw/`
- Root-level analytics files should be centralized

---

## Proposed Structure

```
TITAN/
├── campaigns/              # All campaigns (keep)
├── shared/                # NEW: Shared resources
│   ├── analytics/         # Analytics data (moved from root)
│   ├── transcripts/      # Centralized transcripts
│   └── alt-text/         # Reusable alt text patterns
├── brand/                # Brand assets (keep)
├── research/             # Research files (keep)
├── scripts/              # Scripts (keep)
└── audit_results/        # Audit reports (keep)
```

---

## Standardized Campaign Structure

```
YYYY-MM-DD-campaign-name/
├── README.md                    # REQUIRED
├── campaign-meta.json           # REQUIRED
├── post-mortem.md               # REQUIRED
├── content/
│   ├── carousel/
│   │   ├── slides.md
│   │   └── alt-text.md          # STANDARDIZED
│   ├── single-image/
│   │   ├── image-01.md
│   │   └── alt-text.md          # STANDARDIZED
│   └── video/
│       └── shorts/
│           └── YYYY-MM-DD-name/ # RENAMED (was _example*)
├── social/
│   └── linkedin/
│       └── YYYY-MM-DD-name/     # RENAMED (was _example*)
└── performance/
    └── linkedin.json
```

---

## Migration Phases

1. **Phase 1:** Create `/shared/` structure (30 min)
2. **Phase 2:** Move shared resources (1 hour)
3. **Phase 3:** Add missing core files (2 hours)
4. **Phase 4:** Standardize alt text (1 hour)
5. **Phase 5:** Remove transcript duplication (30 min)
6. **Phase 6:** Rename placeholder folders (1 hour)
7. **Phase 7:** Cleanup (30 min)
8. **Phase 8:** Update documentation (30 min)
9. **Phase 9:** Validation (30 min)

**Total estimated time:** 4-6 hours

---

## Files to Move

### From Root → `/shared/analytics/`
- `tcps_scores.csv`
- `tcps_scores.json`

### From `/research/interviews/` → `/shared/transcripts/raw-interviews/`
- All `.txt` interview files (28 files)

---

## Next Steps

1. ✅ Review `REPOSITORY_AUDIT_REPORT.md` (full details)
2. ✅ Review `MIGRATION_PLAN.md` (step-by-step guide)
3. ⏳ **APPROVE** proposed structure
4. ⏳ Execute migration (test on 1-2 campaigns first)
5. ⏳ Validate results

---

## Questions?

See full audit report: `REPOSITORY_AUDIT_REPORT.md`
