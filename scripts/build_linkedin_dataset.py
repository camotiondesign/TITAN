#!/usr/bin/env python3
"""
Build LinkedIn Posts Dataset

This script walks through the repository, finds all LinkedIn posts with both
caption.md and metrics.json files, extracts data, and generates a CSV file.
"""

import json
import re
import csv
from pathlib import Path
from typing import Dict, Optional
import unicodedata


def extract_date_from_folder(folder_name: str) -> Optional[str]:
    """Extract date from folder name if it follows YYYY-MM-DD pattern."""
    date_pattern = r'(\d{4}-\d{2}-\d{2})'
    match = re.search(date_pattern, folder_name)
    return match.group(1) if match else None


def infer_post_type(asset_type: Optional[str], metrics: Dict) -> str:
    """Infer post type from asset_type or metrics."""
    if asset_type:
        asset_type_lower = asset_type.lower()
        if 'carousel' in asset_type_lower:
            return 'carousel'
        elif 'video' in asset_type_lower or 'longform' in asset_type_lower or 'short' in asset_type_lower:
            return 'video'
        elif 'single-image' in asset_type_lower or 'single_image' in asset_type_lower:
            return 'single_image'
        elif 'poll' in asset_type_lower:
            return 'poll'
        elif 'text' in asset_type_lower:
            return 'text_only'
    
    # Fallback: check if there are views (video indicator)
    if metrics.get('views', 0) > 0 or metrics.get('watch_time_hours', 0) > 0:
        return 'video'
    
    return 'text_only'


def get_metrics_value(metrics: Dict, organic: Dict, key: str, default=0):
    """Get metric value, preferring organic if available."""
    if organic and key in organic and organic[key] not in [None, 0, ""]:
        return organic[key]
    return metrics.get(key, default)


def clean_caption_text(caption_content: str) -> str:
    """Extract just the caption text, removing markdown headers and metadata."""
    lines = caption_content.split('\n')
    cleaned_lines = []
    skip_until_separator = False
    
    for line in lines:
        # Skip markdown headers
        if line.startswith('# '):
            skip_until_separator = True
            continue
        # Skip metadata lines
        if ':' in line and any(keyword in line.lower() for keyword in ['post date', 'platform', 'creative id', 'date:', 'platform:']):
            continue
        # Stop skipping after separator
        if line.strip() == '---':
            skip_until_separator = False
            continue
        if not skip_until_separator:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()


def analyze_caption(caption_content: str) -> Dict:
    """Analyze caption text and extract features."""
    cleaned = clean_caption_text(caption_content)
    
    # Word and character counts
    words = cleaned.split()
    word_count = len(words)
    char_count = len(cleaned)
    
    # Check for links (http/https, bit.ly, etc.)
    link_pattern = r'(https?://|www\.|bit\.ly/|t\.co/)'
    has_link = bool(re.search(link_pattern, cleaned, re.IGNORECASE))
    
    # Check for emojis
    has_emoji = False
    for char in cleaned:
        if unicodedata.category(char) == 'So' or char in ['✨', '💡', '👇', '➡️', '❗', '🔗']:
            has_emoji = True
            break
    
    # Check for hashtags
    hashtag_pattern = r'#\w+|hashtag#\w+'
    hashtags = re.findall(hashtag_pattern, cleaned, re.IGNORECASE)
    has_hashtags = len(hashtags) > 0
    num_hashtags = len(hashtags)
    
    return {
        'word_count': word_count,
        'char_count': char_count,
        'has_link': has_link,
        'has_emoji': has_emoji,
        'has_hashtags': has_hashtags,
        'num_hashtags': num_hashtags
    }


def process_post_folder(post_folder: Path, repo_root: Path) -> Optional[Dict]:
    """Process a single post folder and extract all data."""
    caption_path = post_folder / 'caption.md'
    metrics_path = post_folder / 'metrics.json'
    
    # Check if both files exist
    if not caption_path.exists() or not metrics_path.exists():
        return None
    
    # Extract post_id from folder name
    post_id = post_folder.name
    
    # Extract date from folder name
    date = extract_date_from_folder(post_id)
    
    # Read metrics.json
    try:
        with open(metrics_path, 'r', encoding='utf-8') as f:
            metrics = json.load(f)
    except Exception as e:
        print(f"Error reading metrics.json for {post_id}: {e}")
        return None
    
    # Get organic metrics if available
    organic = metrics.get('organic', {})
    
    # Extract metrics (prefer organic)
    impressions = get_metrics_value(metrics, organic, 'impressions', 0)
    engagements = get_metrics_value(metrics, organic, 'engagements', 0)
    engagement_rate = get_metrics_value(metrics, organic, 'engagement_rate', 0.0)
    clicks = get_metrics_value(metrics, organic, 'clicks', 0)
    click_through_rate = get_metrics_value(metrics, organic, 'click_through_rate', 0.0)
    reactions = get_metrics_value(metrics, organic, 'reactions', 0)
    comments = get_metrics_value(metrics, organic, 'comments', 0)
    reposts = get_metrics_value(metrics, organic, 'reposts', 0)
    
    # Infer post type
    asset_type = metrics.get('asset_type')
    post_type = infer_post_type(asset_type, metrics)
    
    # Read and analyze caption
    try:
        with open(caption_path, 'r', encoding='utf-8') as f:
            caption_content = f.read()
    except Exception as e:
        print(f"Error reading caption.md for {post_id}: {e}")
        caption_content = ""
    
    caption_analysis = analyze_caption(caption_content)
    
    # Combine all data
    return {
        'post_id': post_id,
        'date': date or metrics.get('posted_at', ''),
        'post_type': post_type,
        'impressions': impressions,
        'engagements': engagements,
        'engagement_rate': engagement_rate,
        'clicks': clicks,
        'click_through_rate': click_through_rate,
        'reactions': reactions,
        'comments': comments,
        'reposts': reposts,
        'word_count': caption_analysis['word_count'],
        'char_count': caption_analysis['char_count'],
        'has_link': caption_analysis['has_link'],
        'has_emoji': caption_analysis['has_emoji'],
        'has_hashtags': caption_analysis['has_hashtags'],
        'num_hashtags': caption_analysis['num_hashtags']
    }


def main():
    """Main function to build the dataset."""
    repo_root = Path(__file__).parent.parent
    campaigns_dir = repo_root / 'campaigns' / 'TITAN'
    output_file = repo_root / 'analytics' / 'linkedin_posts.csv'
    
    # Create analytics directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    posts_data = []
    
    # Walk through all campaign folders
    for campaign_folder in campaigns_dir.iterdir():
        if not campaign_folder.is_dir():
            continue
        
        linkedin_posts_dir = campaign_folder / 'social' / 'linkedin'
        
        if not linkedin_posts_dir.exists():
            continue
        
        # Process each post folder in this campaign
        for post_folder in linkedin_posts_dir.iterdir():
            if not post_folder.is_dir():
                continue
            
            post_data = process_post_folder(post_folder, repo_root)
            if post_data:
                posts_data.append(post_data)
    
    # Sort by date
    posts_data.sort(key=lambda x: x['date'] or '')
    
    # Write to CSV
    fieldnames = [
        'post_id', 'date', 'post_type', 'impressions', 'engagements',
        'engagement_rate', 'clicks', 'click_through_rate', 'reactions',
        'comments', 'reposts', 'word_count', 'char_count', 'has_link',
        'has_emoji', 'has_hashtags', 'num_hashtags'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(posts_data)
    
    print(f"✅ Generated {output_file}")
    print(f"✅ Processed {len(posts_data)} LinkedIn posts")
    
    # Print first 10 rows
    print("\n📊 First 10 rows:")
    print("-" * 120)
    for i, post in enumerate(posts_data[:10], 1):
        print(f"{i}. {post['post_id']}")
        print(f"   Date: {post['date']} | Type: {post['post_type']} | "
              f"Impressions: {post['impressions']} | Engagement Rate: {post['engagement_rate']}% | "
              f"Words: {post['word_count']} | Hashtags: {post['num_hashtags']}")
    print("-" * 120)


if __name__ == '__main__':
    main()





