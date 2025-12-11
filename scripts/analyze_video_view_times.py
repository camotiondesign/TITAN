#!/usr/bin/env python3
"""
Analyze average view time for all LinkedIn video posts.
"""

import json
import os
from pathlib import Path
from statistics import mean, median

def find_video_metrics_files(root_dir):
    """Find all metrics.json files for video posts."""
    video_files = []
    root = Path(root_dir)
    
    # Find all metrics.json files in LinkedIn directories
    for metrics_file in root.rglob("**/linkedin/**/metrics.json"):
        try:
            with open(metrics_file, 'r') as f:
                data = json.load(f)
                asset_type = data.get('asset_type', '')
                
                # Check if it's a video type
                if 'video' in asset_type.lower():
                    # Try to get avg duration from multiple possible locations
                    avg_duration = (
                        data.get('avg_view_duration_seconds') or
                        data.get('average_watch_time_seconds') or
                        (data.get('organic', {}).get('average_watch_time_seconds')) or
                        0
                    )
                    
                    # Try to get views from multiple possible locations
                    views = (
                        data.get('views') or
                        data.get('video_views') or
                        (data.get('organic', {}).get('video_views')) or
                        0
                    )
                    
                    # Include all videos with duration data
                    if avg_duration > 0:
                        # Extract campaign slug from file path if not in JSON
                        campaign_slug = data.get('campaign_slug', '')
                        if not campaign_slug:
                            # Try to extract from path: campaigns/TITAN/[campaign-slug]/...
                            path_parts = str(metrics_file).split('/')
                            if 'campaigns' in path_parts:
                                idx = path_parts.index('campaigns')
                                if idx + 2 < len(path_parts):
                                    campaign_slug = path_parts[idx + 2]
                        
                        video_files.append({
                            'file': str(metrics_file),
                            'asset_type': asset_type,
                            'avg_view_duration_seconds': avg_duration,
                            'views': views,
                            'watch_time_hours': data.get('watch_time_hours', 0),
                            'campaign_slug': campaign_slug,
                            'posted_at': data.get('posted_at', ''),
                            'impressions': data.get('impressions', 0) or (data.get('organic', {}).get('impressions', 0))
                        })
        except (json.JSONDecodeError, KeyError) as e:
            continue
    
    return video_files

def main():
    root_dir = Path(__file__).parent.parent
    video_data = find_video_metrics_files(root_dir)
    
    if not video_data:
        print("No video metrics found.")
        return
    
    # Extract view durations
    durations = [v['avg_view_duration_seconds'] for v in video_data]
    
    # Filter videos with actual views (> 0)
    videos_with_views = [v for v in video_data if v['views'] > 0]
    durations_with_views = [v['avg_view_duration_seconds'] for v in videos_with_views]
    
    # Calculate statistics for all videos
    avg_duration = mean(durations)
    median_duration = median(durations)
    min_duration = min(durations)
    max_duration = max(durations)
    total_videos = len(durations)
    
    # Calculate statistics for videos with views
    if durations_with_views:
        avg_duration_with_views = mean(durations_with_views)
        median_duration_with_views = median(durations_with_views)
    else:
        avg_duration_with_views = 0
        median_duration_with_views = 0
    
    print(f"\n{'='*60}")
    print(f"LINKEDIN VIDEO VIEW TIME ANALYSIS")
    print(f"{'='*60}\n")
    print(f"Total videos analyzed: {total_videos}")
    print(f"Videos with views > 0: {len(videos_with_views)}\n")
    print(f"Average view duration (all videos): {avg_duration:.2f} seconds ({avg_duration/60:.2f} minutes)")
    print(f"Average view duration (videos with views): {avg_duration_with_views:.2f} seconds ({avg_duration_with_views/60:.2f} minutes)")
    print(f"Median view duration: {median_duration:.2f} seconds ({median_duration/60:.2f} minutes)")
    print(f"Minimum view duration: {min_duration:.2f} seconds ({min_duration/60:.2f} minutes)")
    print(f"Maximum view duration: {max_duration:.2f} seconds ({max_duration/60:.2f} minutes)")
    
    # Group by asset type
    print(f"\n{'='*60}")
    print(f"BREAKDOWN BY VIDEO TYPE")
    print(f"{'='*60}\n")
    
    type_groups = {}
    for v in video_data:
        asset_type = v['asset_type']
        if asset_type not in type_groups:
            type_groups[asset_type] = []
        type_groups[asset_type].append(v['avg_view_duration_seconds'])
    
    for asset_type, durations in sorted(type_groups.items()):
        avg = mean(durations)
        count = len(durations)
        print(f"{asset_type}:")
        print(f"  Count: {count}")
        print(f"  Average: {avg:.2f} seconds ({avg/60:.2f} minutes)")
        print()
    
    # Show top performers (with views)
    print(f"\n{'='*60}")
    print(f"TOP 5 LONGEST VIEW TIMES (with actual views)")
    print(f"{'='*60}\n")
    sorted_by_duration = sorted(videos_with_views, key=lambda x: x['avg_view_duration_seconds'], reverse=True)
    for i, v in enumerate(sorted_by_duration[:5], 1):
        slug = v['campaign_slug'] or 'N/A'
        date = v['posted_at'] or 'N/A'
        print(f"{i}. {slug} ({date})")
        print(f"   Duration: {v['avg_view_duration_seconds']:.2f}s ({v['avg_view_duration_seconds']/60:.2f}m)")
        print(f"   Views: {v['views']:,}")
        print(f"   Impressions: {v['impressions']:,}")
        print()

if __name__ == "__main__":
    main()
