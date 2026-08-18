#!/usr/bin/env python3
"""
Consolidate metrics data from organic section to top level where appropriate.
"""

import json
import os
from pathlib import Path

def consolidate_metrics(file_path):
    """Consolidate organic metrics to top level if top level is all zeros."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        updated = False
        
        # Check if top-level metrics are zeros but organic has data
        if 'organic' in data:
            organic = data['organic']
            
            # Check if top level is zeros but organic has data
            top_level_has_data = (
                data.get('impressions', 0) > 0 or
                data.get('reach', 0) > 0 or
                data.get('engagements', 0) > 0 or
                data.get('clicks', 0) > 0
            )
            
            organic_has_data = (
                organic.get('impressions', 0) > 0 or
                organic.get('reach', 0) > 0 or
                organic.get('engagements', 0) > 0 or
                organic.get('clicks', 0) > 0
            )
            
            # If top level is zeros but organic has data, consolidate
            if not top_level_has_data and organic_has_data:
                # Only consolidate if this appears to be an organic-only post
                # (not boosted/sponsored)
                if not data.get('boosted', False) and organic.get('impressions', 0) > 0:
                    data['impressions'] = organic.get('impressions', 0)
                    data['reach'] = organic.get('reach', 0)
                    data['engagements'] = organic.get('engagements', 0)
                    data['engagement_rate'] = organic.get('engagement_rate', 0)
                    data['clicks'] = organic.get('clicks', 0)
                    data['ctr'] = organic.get('click_through_rate', 0)
                    data['reactions'] = organic.get('reactions', 0)
                    data['comments'] = organic.get('comments', 0)
                    data['reposts'] = organic.get('reposts', 0)
                    
                    # Video-specific metrics
                    if 'video_views' in organic:
                        data['views'] = organic.get('video_views', 0)
                    if 'average_watch_time_seconds' in organic:
                        data['avg_view_duration_seconds'] = organic.get('average_watch_time_seconds', 0)
                    if 'watch_time_total' in organic and organic.get('watch_time_total'):
                        # Parse watch time if needed
                        pass
                    
                    updated = True
        
        if updated:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main consolidation function."""
    base_path = Path('campaigns')
    metrics_files = list(base_path.rglob('**/metrics.json'))
    
    updated_count = 0
    
    print(f"Found {len(metrics_files)} metrics.json files")
    print("Consolidating metrics...\n")
    
    for metrics_file in metrics_files:
        # Skip template files
        if '_template' in str(metrics_file) or '_example' in str(metrics_file):
            continue
        
        if consolidate_metrics(metrics_file):
            updated_count += 1
            rel_path = str(metrics_file).replace(str(Path.cwd()) + '/', '')
            print(f"✓ Consolidated: {rel_path}")
    
    print(f"\n✓ Consolidated {updated_count} files")

if __name__ == '__main__':
    main()

