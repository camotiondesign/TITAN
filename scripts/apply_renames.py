#!/usr/bin/env python3
"""
Apply high-confidence renames from RENAME_MANIFEST_DRYRUN.md
"""

import re
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple
import json

BASE_DIR = Path(__file__).parent.parent
MANIFEST = BASE_DIR / "RENAME_MANIFEST_DRYRUN.md"

def parse_manifest() -> List[Dict]:
    """Parse the rename manifest and extract high-confidence renames."""
    renames = []
    
    with open(MANIFEST, 'r') as f:
        content = f.read()
    
    # Pattern to match each rename entry
    pattern = r'## (campaigns/[^\n]+)\n- \*\*Current Name:\*\* `([^`]+)`\n- \*\*Proposed Name:\*\* `([^`]+)`\n- \*\*Confidence:\*\* (HIGH|MEDIUM|LOW)\n- \*\*Campaign:\*\* ([^\n]+)'
    
    for match in re.finditer(pattern, content):
        full_path = match.group(1)
        current_name = match.group(2)
        proposed_name = match.group(3)
        confidence = match.group(4)
        campaign = match.group(5)
        
        if confidence == 'HIGH':
            renames.append({
                'full_path': full_path,
                'current_name': current_name,
                'proposed_name': proposed_name,
                'campaign': campaign,
                'old_path': Path(BASE_DIR) / full_path,
                'new_path': Path(BASE_DIR) / full_path.replace(current_name, proposed_name)
            })
    
    return renames

def check_collision(new_path: Path) -> Tuple[Path, bool]:
    """Check if target path exists, return adjusted path and collision flag."""
    if not new_path.exists():
        return new_path, False
    
    # Collision detected - append -02, -03, etc.
    base = new_path.stem
    ext = new_path.suffix
    parent = new_path.parent
    
    counter = 2
    while True:
        adjusted = parent / f"{base}-{counter:02d}{ext}"
        if not adjusted.exists():
            return adjusted, True
        counter += 1
        if counter > 99:  # Safety limit
            raise ValueError(f"Too many collisions for {new_path}")

def find_references(old_path: Path, campaign_dir: Path) -> List[Path]:
    """Find files in campaign directory that reference the old filename."""
    references = []
    old_name = old_path.name
    
    # Search in markdown and json files
    for file_path in campaign_dir.rglob("*.md"):
        if file_path == old_path:
            continue
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if old_name in content:
                    references.append(file_path)
        except:
            pass
    
    for file_path in campaign_dir.rglob("*.json"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if old_name in content:
                    references.append(file_path)
        except:
            pass
    
    return references

def update_references(file_path: Path, old_name: str, new_name: str):
    """Update references to old_name with new_name in the given file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the filename (but be careful with paths)
        updated = content.replace(old_name, new_name)
        
        if updated != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated)
            return True
    except Exception as e:
        print(f"  Warning: Could not update {file_path}: {e}")
    
    return False

def git_mv(old_path: Path, new_path: Path) -> bool:
    """Execute git mv command."""
    try:
        result = subprocess.run(
            ['git', 'mv', str(old_path), str(new_path)],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error: git mv failed: {e.stderr}")
        return False

def main():
    """Main execution."""
    print("Parsing rename manifest...")
    renames = parse_manifest()
    
    print(f"Found {len(renames)} high-confidence renames")
    
    report = {
        'renames': [],
        'collisions': [],
        'updated_references': [],
        'skipped': [],
        'errors': []
    }
    
    for i, rename in enumerate(renames, 1):
        old_path = rename['old_path']
        new_path = rename['new_path']
        old_name = rename['current_name']
        new_name = rename['proposed_name']
        campaign_dir = old_path.parent.parent.parent  # Go up from content/single-image/image-01.md
        
        print(f"\n[{i}/{len(renames)}] {old_path.name} -> {new_name}")
        
        # Check if old file exists
        if not old_path.exists():
            print(f"  ⚠️  Old file does not exist, skipping")
            report['skipped'].append({
                'path': str(old_path),
                'reason': 'Old file does not exist'
            })
            continue
        
        # Check for collision
        final_path, had_collision = check_collision(new_path)
        if had_collision:
            print(f"  ⚠️  Collision detected, using: {final_path.name}")
            report['collisions'].append({
                'original_target': str(new_path),
                'adjusted_target': str(final_path)
            })
            new_name = final_path.name  # Update new_name for reference updates
        
        # Execute git mv
        print(f"  → git mv {old_path.name} {final_path.name}")
        if not git_mv(old_path, final_path):
            report['errors'].append({
                'path': str(old_path),
                'error': 'git mv failed'
            })
            continue
        
        # Find and update references
        references = find_references(old_path, campaign_dir)
        updated_files = []
        for ref_file in references:
            if update_references(ref_file, old_name, new_name):
                updated_files.append(str(ref_file))
                print(f"  ✓ Updated reference in {ref_file.relative_to(BASE_DIR)}")
        
        report['renames'].append({
            'old_path': str(old_path),
            'new_path': str(final_path),
            'had_collision': had_collision
        })
        
        if updated_files:
            report['updated_references'].append({
                'renamed_file': str(final_path),
                'updated_files': updated_files
            })
    
    # Generate report
    report_path = BASE_DIR / "RENAME_REPORT.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("# Rename Report\n\n")
        f.write(f"**Generated:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write(f"**Total High-Confidence Renames:** {len(renames)}\n")
        f.write(f"**Successfully Renamed:** {len(report['renames'])}\n")
        f.write(f"**Collisions:** {len(report['collisions'])}\n")
        f.write(f"**Skipped:** {len(report['skipped'])}\n")
        f.write(f"**Errors:** {len(report['errors'])}\n\n")
        
        if report['renames']:
            f.write("## Successful Renames\n\n")
            for r in report['renames']:
                f.write(f"- `{r['old_path']}` → `{r['new_path']}`")
                if r['had_collision']:
                    f.write(" ⚠️ (collision adjusted)")
                f.write("\n")
            f.write("\n")
        
        if report['collisions']:
            f.write("## Collisions (Adjusted Names)\n\n")
            for c in report['collisions']:
                f.write(f"- Original: `{c['original_target']}`\n")
                f.write(f"  Adjusted: `{c['adjusted_target']}`\n\n")
        
        if report['updated_references']:
            f.write("## Updated References\n\n")
            for ref in report['updated_references']:
                f.write(f"### {ref['renamed_file']}\n\n")
                f.write("References updated in:\n")
                for updated_file in ref['updated_files']:
                    f.write(f"- `{updated_file}`\n")
                f.write("\n")
        
        if report['skipped']:
            f.write("## Skipped Items\n\n")
            for s in report['skipped']:
                f.write(f"- `{s['path']}`: {s['reason']}\n")
            f.write("\n")
        
        if report['errors']:
            f.write("## Errors\n\n")
            for e in report['errors']:
                f.write(f"- `{e['path']}`: {e['error']}\n")
            f.write("\n")
        
        # List skipped medium-confidence items
        f.write("## Skipped Medium-Confidence Items\n\n")
        f.write("The following items were skipped (medium confidence only):\n\n")
        f.write("- `campaigns/TITAN/2025-11-12-barcode-safety-beep/content/single-image/image-01.md`\n")
        f.write("  - Proposed: `barcode-safety-beep-image.md`\n")
        f.write("  - Confidence: MEDIUM\n\n")
    
    print(f"\n✓ Report generated: {report_path}")
    print(f"\nSummary:")
    print(f"  - Renamed: {len(report['renames'])}")
    print(f"  - Collisions: {len(report['collisions'])}")
    print(f"  - Skipped: {len(report['skipped'])}")
    print(f"  - Errors: {len(report['errors'])}")

if __name__ == "__main__":
    main()







