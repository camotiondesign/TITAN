#!/usr/bin/env python3
"""
Migrate content from campaigns to published posts.

This script:
1. Finds matching campaigns and published posts
2. Migrates video transcripts to alt-text.md
3. Migrates alt text from carousel/single-image content
4. Reports what was migrated and what's still missing
"""

import os
import json
import re
from pathlib import Path

def find_video_transcripts(campaign_path):
    """Find all video transcripts in a campaign - search thoroughly"""
    transcripts = []
    video_dir = campaign_path / 'content' / 'video'
    if video_dir.exists():
        # Recursively find ALL .md files in video directory
        for md_file in video_dir.rglob('*.md'):
            # Skip README and notes files
            if 'readme' in md_file.name.lower() or 'notes' in md_file.name.lower():
                continue
            
            # Determine type based on path
            if 'longform' in str(md_file):
                transcripts.append({
                    'type': 'longform',
                    'path': md_file,
                    'name': md_file.stem
                })
            elif 'short' in str(md_file) or 'shorts' in str(md_file):
                transcripts.append({
                    'type': 'short',
                    'path': md_file,
                    'name': md_file.stem
                })
            else:
                # Default to video transcript
                transcripts.append({
                    'type': 'video',
                    'path': md_file,
                    'name': md_file.stem
                })
    
    return transcripts

def find_alt_text_sources(campaign_path):
    """Find alt text sources in campaign"""
    alt_sources = []
    
    # Check carousel (handle various naming patterns)
    carousel_dir = campaign_path / 'content' / 'carousel'
    if carousel_dir.exists():
        # Check for slides.md or any *slides.md files
        for carousel_file in carousel_dir.glob('*slides*.md'):
            alt_sources.append({
                'type': 'carousel',
                'path': carousel_file
            })
        # Also check for any .md files in carousel
        for carousel_file in carousel_dir.glob('*.md'):
            if carousel_file not in [a['path'] for a in alt_sources]:
                alt_sources.append({
                    'type': 'carousel',
                    'path': carousel_file
                })
    
    # Check single-image
    single_image_dir = campaign_path / 'content' / 'single-image'
    if single_image_dir.exists():
        for img_file in single_image_dir.glob('*.md'):
            alt_sources.append({
                'type': 'single-image',
                'path': img_file,
                'name': img_file.stem
            })
    
    # Check poll content (for poll posts)
    poll_dir = campaign_path / 'content' / 'poll'
    if poll_dir.exists():
        for poll_file in poll_dir.glob('*.md'):
            alt_sources.append({
                'type': 'poll',
                'path': poll_file,
                'name': poll_file.stem
            })
    
    # Check blog content (extract relevant parts for alt-text)
    blog_dir = campaign_path / 'content' / 'blog'
    if blog_dir.exists():
        for blog_file in blog_dir.glob('*.md'):
            alt_sources.append({
                'type': 'blog',
                'path': blog_file,
                'name': blog_file.stem
            })
    
    # Check social/linkedin for alt-text
    linkedin_dir = campaign_path / 'social' / 'linkedin'
    if linkedin_dir.exists():
        for item in linkedin_dir.iterdir():
            if item.is_dir():
                alt_text = item / 'alt-text.md'
                if alt_text.exists():
                    alt_sources.append({
                        'type': 'linkedin-alt',
                        'path': alt_text,
                        'name': item.name
                    })
    
    return alt_sources

def migrate_content(campaign_path, post_path, force=False):
    """Migrate content from campaign to post"""
    migrations = []
    post_alt = post_path / 'alt-text.md'
    
    # Check if alt-text.md is empty or missing or has minimal content (< 10 bytes)
    needs_migration = False
    current_content = ""
    
    if not post_alt.exists():
        needs_migration = True
    else:
        size = post_alt.stat().st_size
        if size == 0 or size < 10:  # Empty or just whitespace
            needs_migration = True
        else:
            # Read current content to check if it's the right match
            try:
                current_content = post_alt.read_text(encoding='utf-8').lower()
            except:
                needs_migration = True
    
    # Always try to migrate if we have content (force check for better matches)
    # But only write if empty or if we find a clearly better match
    
    # 1. Check for video transcripts first (highest priority)
    transcripts = find_video_transcripts(campaign_path)
    if transcripts:
        # Try to find the best matching transcript based on post name
        post_name_lower = post_path.name.lower()
        best_transcript = None
        best_score = 0
        
        for transcript in transcripts:
            transcript_name_lower = transcript['name'].lower()
            transcript_path_str = str(transcript['path']).lower()
            score = 0
            
            # Extract post date
            post_date_match = re.search(r'(\d{4}-\d{2}-\d{2})', post_path.name)
            if post_date_match:
                post_date = post_date_match.group(1)
                # Exact date match in transcript name or path - highest priority
                if post_date in transcript_name_lower or post_date in transcript_path_str:
                    score += 50
                # Same month
                elif post_date[:7] in transcript_name_lower or post_date[:7] in transcript_path_str:
                    score += 20
            
            # Extract key identifying words from post name (remove dates and common suffixes)
            post_words = set(re.findall(r'[a-z]+', post_name_lower))
            post_words.discard('video')
            post_words.discard('short')
            post_words.discard('longform')
            
            # Check if these words appear in transcript name or path
            transcript_text = transcript_name_lower + ' ' + transcript_path_str
            for word in post_words:
                if word in transcript_text and len(word) > 3:  # Only meaningful words
                    score += 5
            
            # Prefer longform for longform posts, short for short posts
            if 'longform' in post_name_lower and 'longform' in transcript_text:
                score += 15
            elif 'short' in post_name_lower and ('short' in transcript_text or 'shorts' in transcript_path_str):
                score += 15
            
            # Check if transcript filename contains post slug
            post_slug = '-'.join(post_name_lower.split('-')[3:])  # Everything after date
            if post_slug in transcript_name_lower or any(word in transcript_name_lower for word in post_slug.split('-') if len(word) > 3):
                score += 10
            
            if score > best_score:
                best_score = score
                best_transcript = transcript
        
        # Use best match, or first one if no good match
        transcript_to_use = best_transcript if best_transcript else transcripts[0]
        transcript_content = transcript_to_use['path'].read_text(encoding='utf-8')
        
        # Check if current content is clearly wrong (e.g., short transcript for longform post)
        should_write = True
        if current_content and not needs_migration:
            # If post is longform but current content mentions "short", replace it
            if 'longform' in post_path.name.lower() and 'short' in current_content:
                should_write = True
                migrations.append(f"Replacing wrong transcript (short in longform post)")
            # If post is short but current content mentions "longform", replace it
            elif 'short' in post_path.name.lower() and 'longform' in current_content:
                should_write = True
                migrations.append(f"Replacing wrong transcript (longform in short post)")
            # If date in transcript matches post date better than current content
            elif best_score > 30:  # High confidence match
                should_write = True
                migrations.append(f"Found better matching transcript (score: {best_score})")
            else:
                should_write = False
        
        if should_write:
            post_alt.write_text(transcript_content, encoding='utf-8')
            migrations.append(f"Migrated {transcript_to_use['type']} transcript: {transcript_to_use['name']}")
            return migrations  # Transcripts take priority
        elif not needs_migration:
            return migrations  # Already has content and it seems correct
    
    # 2. Check for alt text sources
    alt_sources = find_alt_text_sources(campaign_path)
    if alt_sources:
        for alt_source in alt_sources:
            try:
                content = alt_source['path'].read_text(encoding='utf-8')
                if content.strip():  # Only write if content is not empty
                    # For blog/poll content, use as-is (they may contain alt-text descriptions)
                    post_alt.write_text(content, encoding='utf-8')
                    migrations.append(f"Migrated {alt_source['type']} content: {alt_source.get('name', alt_source['path'].name)}")
                    break
            except Exception as e:
                migrations.append(f"Error reading {alt_source['path']}: {e}")
    
    return migrations

def find_matching_campaign(post_name, campaigns_dict):
    """Find matching campaign by exact date match or slug match - be very flexible"""
    # Try exact match first
    if post_name in campaigns_dict:
        return campaigns_dict[post_name]
    
    # Extract date and slug from post
    post_match = re.match(r'^(\d{4}-\d{2}-\d{2})-(.+)$', post_name)
    if not post_match:
        return None
    
    post_date = post_match.group(1)
    post_slug = post_match.group(2)
    
    # Normalize slug (remove common suffixes)
    post_slug_clean = re.sub(r'-(single|carousel|video|blog|poll|short-video|longform|single-image)$', '', post_slug)
    
    # Try slug-based match (more flexible)
    best_match = None
    best_score = 0
    
    for campaign_name, campaign_path in campaigns_dict.items():
        # Extract date and slug from campaign
        camp_match = re.match(r'^(\d{4}-\d{2}-\d{2})-(.+)$', campaign_name)
        if not camp_match:
            continue
        
        camp_date = camp_match.group(1)
        camp_slug = camp_match.group(2)
        camp_slug_clean = re.sub(r'-(single|carousel|video|blog|poll|short-video|longform|single-image|case-study)$', '', camp_slug)
        
        score = 0
        
        # If dates match exactly, higher score
        if post_date == camp_date:
            score += 10
        # If dates are within same month, medium score
        elif post_date[:7] == camp_date[:7]:
            score += 5
        
        # Slug matching
        if post_slug == camp_slug:
            score += 20
        elif post_slug_clean == camp_slug_clean:
            score += 15
        elif post_slug_clean in camp_slug_clean or camp_slug_clean in post_slug_clean:
            score += 10
        elif post_slug in camp_slug or camp_slug in post_slug:
            score += 5
        
        # Check if post slug keywords appear in campaign
        post_keywords = set(post_slug_clean.split('-'))
        camp_keywords = set(camp_slug_clean.split('-'))
        common_keywords = post_keywords.intersection(camp_keywords)
        if len(common_keywords) > 0:
            score += len(common_keywords) * 2
        
        if score > best_score:
            best_score = score
            best_match = campaign_path
    
    # Only return if we have a reasonable match (score > 5)
    if best_score > 5:
        return best_match
    
    return None

def main():
    campaigns_base = Path('campaigns/TITAN')
    posts_base = Path('posts/titan/published')
    
    # Find all published posts
    published_posts = {}
    for post_dir in posts_base.iterdir():
        if post_dir.is_dir() and re.match(r'^\d{4}-\d{2}-\d{2}-', post_dir.name):
            published_posts[post_dir.name] = post_dir
    
    # Find all campaigns
    campaigns = {}
    for campaign_dir in campaigns_base.iterdir():
        if campaign_dir.is_dir() and re.match(r'^\d{4}-\d{2}-\d{2}-', campaign_dir.name):
            campaigns[campaign_dir.name] = campaign_dir
    
    # Migrate content
    migration_summary = []
    no_match = []
    no_content = []
    
    for post_name, post_path in published_posts.items():
        campaign_path = find_matching_campaign(post_name, campaigns)
        
        if not campaign_path:
            no_match.append(post_name)
            continue
        
        migrations = migrate_content(campaign_path, post_path)
        
        if migrations:
            migration_summary.append({
                'post': post_name,
                'campaign': campaign_path.name,
                'migrations': migrations
            })
        else:
            # Check if campaign has any content at all
            transcripts = find_video_transcripts(campaign_path)
            alt_sources = find_alt_text_sources(campaign_path)
            if not transcripts and not alt_sources:
                no_content.append({
                    'post': post_name,
                    'campaign': campaign_path.name
                })
    
    # Print summary
    print("=" * 70)
    print("CAMPAIGN TO POST CONTENT MIGRATION SUMMARY")
    print("=" * 70)
    print(f"\nTotal published posts: {len(published_posts)}")
    print(f"Total campaigns: {len(campaigns)}")
    print(f"Posts migrated: {len(migration_summary)}")
    print(f"Posts with no matching campaign: {len(no_match)}")
    print(f"Posts with matching campaign but no content: {len(no_content)}")
    
    if migration_summary:
        print(f"\n{'=' * 70}")
        print("MIGRATED CONTENT:")
        print(f"{'=' * 70}")
        for item in migration_summary:
            print(f"\n{item['post']}")
            print(f"  Campaign: {item['campaign']}")
            for m in item['migrations']:
                print(f"  ✓ {m}")
    
    if no_match:
        print(f"\n{'=' * 70}")
        print(f"POSTS WITH NO MATCHING CAMPAIGN ({len(no_match)}):")
        print(f"{'=' * 70}")
        for post in no_match[:20]:
            print(f"  - {post}")
        if len(no_match) > 20:
            print(f"  ... and {len(no_match) - 20} more")
    
    if no_content:
        print(f"\n{'=' * 70}")
        print(f"POSTS WITH MATCHING CAMPAIGN BUT NO CONTENT ({len(no_content)}):")
        print(f"{'=' * 70}")
        for item in no_content[:20]:
            print(f"  - {item['post']} (campaign: {item['campaign']})")
        if len(no_content) > 20:
            print(f"  ... and {len(no_content) - 20} more")

if __name__ == '__main__':
    main()
