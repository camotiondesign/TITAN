#!/usr/bin/env python3
"""
Cleanup script for metrics.json files.
Fills in missing posted_at dates and campaign_slug fields from folder structure.
"""

import json
import os
import re
from pathlib import Path

def extract_date_from_folder(folder_name):
    """Extract YYYY-MM-DD date from folder name."""
    match = re.match(r'(\d{4}-\d{2}-\d{2})', folder_name)
    if match:
        return match.group(1)
    return None

def extract_campaign_slug_from_path(file_path):
    """Extract campaign slug from file path."""
    # Path format: campaigns/[PRODUCT]/[CAMPAIGN-DATE-campaign-name]/social/linkedin/[POST-DATE-post-slug]/metrics.json
    parts = Path(file_path).parts
    try:
        # Find the campaign folder (should be after TITAN or TITANVERSE)
        for i, part in enumerate(parts):
            if part in ['TITAN', 'TITANVERSE'] and i + 1 < len(parts):
                campaign_folder = parts[i + 1]
                return campaign_folder
    except:
        pass
    return None

def update_metrics_file(file_path):
    """Update a single metrics.json file with missing data."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated = False
        folder_name = Path(file_path).parent.name
        
        # Extract date from folder name
        post_date = extract_date_from_folder(folder_name)
        
        # Extract campaign slug from path
        campaign_slug = extract_campaign_slug_from_path(file_path)
        
        # Update posted_at if missing
        if not data.get('posted_at') or data.get('posted_at') == '':
            if post_date:
                data['posted_at'] = post_date
                updated = True
        
        # Update campaign_slug if missing
        if not data.get('campaign_slug') or data.get('campaign_slug') == '':
            if campaign_slug:
                data['campaign_slug'] = campaign_slug
                updated = True
        
        # Also check organic section for missing reach when impressions exist
        if 'organic' in data:
            organic = data['organic']
            if organic.get('impressions', 0) > 0 and organic.get('reach', 0) == 0:
                # Check if we can infer reach (typically 60-80% of impressions)
                # But we'll leave this as 0 since we don't have actual data
                pass
        
        if updated:
            # Write back with proper formatting
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main cleanup function."""
    base_path = Path('campaigns')
    metrics_files = list(base_path.rglob('**/metrics.json'))
    
    updated_count = 0
    error_count = 0
    
    print(f"Found {len(metrics_files)} metrics.json files")
    print("Starting cleanup...\n")
    
    for metrics_file in metrics_files:
        # Skip template files
        if '_template' in str(metrics_file) or '_example' in str(metrics_file):
            continue
        
        try:
            if update_metrics_file(metrics_file):
                updated_count += 1
                rel_path = str(metrics_file).replace(str(Path.cwd()) + '/', '')
                print(f"✓ Updated: {rel_path}")
        except Exception as e:
            error_count += 1
            print(f"✗ Error: {metrics_file} - {e}")
    
    print(f"\n✓ Updated {updated_count} files")
    if error_count > 0:
        print(f"✗ Errors: {error_count} files")

if __name__ == '__main__':
    main()

