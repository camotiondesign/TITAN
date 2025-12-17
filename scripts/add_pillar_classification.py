#!/usr/bin/env python3
"""
Add pillar classification to LinkedIn posts CSV and analyze performance by pillar.
"""

import csv
import json
import re
import statistics
from pathlib import Path
from typing import Dict, Optional


def clean_caption_text(caption_content: str) -> str:
    """Clean caption text by removing markdown headers and metadata."""
    lines = caption_content.split('\n')
    cleaned_lines = []
    skip_until_separator = False
    
    for line in lines:
        if line.startswith('# '):
            skip_until_separator = True
            continue
        if ':' in line and any(kw in line.lower() for kw in ['post date', 'platform', 'creative id']):
            continue
        if line.strip() == '---':
            skip_until_separator = False
            continue
        if not skip_until_separator:
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()


def classify_pillar(caption_content: str, post_id: str) -> str:
    """Classify a post into one of five pillars."""
    text = clean_caption_text(caption_content).lower()
    post_id_lower = post_id.lower()
    
    # Keywords for each pillar
    proof_keywords = [
        'testimonial', 'case study', 'customer', 'pharmacy', 'growth', 'saved', 
        'hours', 'efficiency', 'results', 'wins', '4x', 'transformed', 
        'before and after', 'success story', 'read how', 'how he did it',
        'how she did it', 'milestone', 'achievement', 'review', 'trustpilot',
        '5-star', 'star review', 'pharmacist', 'owner', 'team at', 'site visit',
        'brighton hill', 'priory', 'puri', 'drayton', 'howletts', 'medichem',
        'bmp', 'gareth', 'sagar', 'kanav', 'mustafa', 'kieren', 'jagdeep',
        'cameron', 'ash', 'tumi', 'zack', 'sachin', 'prab', 'zainab', 'hooman'
    ]
    
    insight_keywords = [
        'nhs', 'independent prescribing', 'legislation', 'regulation', 'policy',
        'industry', 'analysis', 'context', 'education', 'learn', 'understanding',
        'pharmacy first', 'hub and spoke', 'substitution', 'prescribing rights',
        '10-year plan', 'strategy', 'plan', 'future of pharmacy', 'pharmacy show',
        'conference', 'agm', 'devon pharmacy', 'cpgm', 'why independent',
        'barriers', 'opd', 'eps', 'wales rollout'
    ]
    
    product_keywords = [
        'titan pmr', 'titan ai', 'ai filtering', 'safety', 'workflow', 'batch flow',
        'features', 'automation', 'checks', 'accuracy', 'script', 'prescription',
        'pmr', 'system', 'platform', 'tool', 'software', 'digital', 'paperless',
        'barcode', 'gtin', 'safety beep', 'audit trail', 'clinical ready',
        'faz nav', 'serial checker', 'airlock', 'backup', 'burnout'
    ]
    
    leadership_keywords = [
        'tariq', 'keynote', 'talk', 'strategic', 'vision', 'brand', 'reflection',
        'thought leadership', 'leadership', 'future', 'next generation', 'way forward',
        'philosophy', 'mission', 'values', 'why we', 'our approach', 'we believe',
        'innovator', 'imitator'
    ]
    
    community_keywords = [
        'titanverse', 'early adopters', 'events', 'meetup', 'meet-up', 'team',
        'pharmacy show', 'conference', 'day', 'gathering', 'together', 'community',
        'pharmacists in that room', 'thank you to', 'celebration', 'milestone',
        '1000th', 'anniversary', 'wrapped', 'recap', 'montage', 'album',
        'bbq', 'titanverse', 'early adopter', 'pharmacy show day', 'show album'
    ]
    
    # Score each pillar
    scores = {
        'proof': sum(1 for kw in proof_keywords if kw in text),
        'insight': sum(1 for kw in insight_keywords if kw in text),
        'product': sum(1 for kw in product_keywords if kw in text),
        'leadership': sum(1 for kw in leadership_keywords if kw in text),
        'community': sum(1 for kw in community_keywords if kw in text)
    }
    
    # Boost scores based on post_id
    if any(kw in post_id_lower for kw in ['testimonial', 'case-study', 'case study']):
        scores['proof'] += 3
    if 'titan-wrapped' in post_id_lower or 'wrapped' in post_id_lower:
        scores['community'] += 3
    if 'tariq' in post_id_lower or 'keynote' in post_id_lower:
        scores['leadership'] += 3
    if 'titanverse' in post_id_lower:
        scores['community'] += 3
    if 'nhs' in post_id_lower or 'legislation' in post_id_lower:
        scores['insight'] += 2
    if 'pharmacy-show' in post_id_lower or 'conference' in post_id_lower:
        scores['community'] += 2
    
    # Return pillar with highest score, default to product if tie
    if max(scores.values()) == 0:
        return 'product'  # Default fallback
    
    return max(scores.items(), key=lambda x: x[1])[0]


def find_caption_file(post_id: str, repo_root: Path) -> Optional[Path]:
    """Find caption.md file for a post."""
    campaigns_dir = repo_root / 'campaigns' / 'TITAN'
    
    for campaign_folder in campaigns_dir.iterdir():
        if not campaign_folder.is_dir():
            continue
        
        linkedin_dir = campaign_folder / 'social' / 'linkedin'
        if not linkedin_dir.exists():
            continue
        
        for post_folder in linkedin_dir.iterdir():
            if not post_folder.is_dir():
                continue
            
            if post_id in post_folder.name or post_folder.name.startswith(post_id[:10]):
                caption_file = post_folder / 'caption.md'
                if caption_file.exists():
                    return caption_file
    
    return None


def update_csv_with_pillars(csv_path: Path, repo_root: Path):
    """Update CSV with pillar classification."""
    posts = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            posts.append(row)
    
    print(f"Classifying {len(posts)} posts...")
    classified = 0
    
    for post in posts:
        post_id = post['post_id']
        caption_file = find_caption_file(post_id, repo_root)
        
        if caption_file and caption_file.exists():
            try:
                caption_content = caption_file.read_text(encoding='utf-8')
                pillar = classify_pillar(caption_content, post_id)
                post['pillar'] = pillar
                classified += 1
            except Exception as e:
                print(f"Error processing {post_id}: {e}")
                post['pillar'] = 'product'  # Default
        else:
            pillar = classify_pillar('', post_id)
            post['pillar'] = pillar
    
    print(f"✅ Classified {classified} posts from captions")
    
    # Write updated CSV
    fieldnames = list(posts[0].keys())
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(posts)
    
    print(f"✅ Updated CSV with pillar column")


def analyze_by_pillar(csv_path: Path) -> Dict:
    """Analyze performance metrics by pillar."""
    posts_by_pillar = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pillar = row.get('pillar', 'unknown')
            if pillar not in posts_by_pillar:
                posts_by_pillar[pillar] = []
            
            try:
                impressions = int(row['impressions']) if row['impressions'] else 0
                engagement_rate = float(row['engagement_rate']) if row['engagement_rate'] else 0.0
                ctr = float(row['click_through_rate']) if row['click_through_rate'] else 0.0
                
                posts_by_pillar[pillar].append({
                    'impressions': impressions,
                    'engagement_rate': engagement_rate,
                    'ctr': ctr
                })
            except (ValueError, KeyError):
                continue
    
    results = {}
    for pillar, posts in posts_by_pillar.items():
        if posts:
            impressions = [p['impressions'] for p in posts]
            engagement_rates = [p['engagement_rate'] for p in posts]
            ctrs = [p['ctr'] for p in posts]
            
            results[pillar] = {
                'count': len(posts),
                'avg_impressions': statistics.mean(impressions),
                'median_impressions': statistics.median(impressions),
                'avg_engagement_rate': statistics.mean(engagement_rates),
                'avg_ctr': statistics.mean(ctrs)
            }
    
    return results


def print_analysis(results: Dict):
    """Print formatted analysis tables."""
    print("\n" + "="*100)
    print("PERFORMANCE ANALYSIS BY PILLAR")
    print("="*100)
    
    sorted_results = sorted(results.items(), key=lambda x: x[1]['count'], reverse=True)
    
    print(f"\n{'Pillar':<15} | {'Count':<8} | {'Avg Impressions':<18} | {'Median Impressions':<20} | {'Avg Engagement Rate':<22} | {'Avg CTR':<12}")
    print("-" * 100)
    
    for pillar, stats in sorted_results:
        print(f"{pillar:<15} | {stats['count']:<8} | {stats['avg_impressions']:<18.0f} | {stats['median_impressions']:<20.0f} | {stats['avg_engagement_rate']:<22.1f}% | {stats['avg_ctr']:<12.1f}%")


def generate_strategic_summary(results: Dict):
    """Generate strategic summary and recommendations."""
    print("\n" + "="*100)
    print("STRATEGIC SUMMARY")
    print("="*100)
    
    by_reach = sorted(results.items(), key=lambda x: x[1]['avg_impressions'], reverse=True)
    by_action = sorted(results.items(), key=lambda x: x[1]['avg_ctr'], reverse=True)
    by_engagement = sorted(results.items(), key=lambda x: x[1]['avg_engagement_rate'], reverse=True)
    
    print("\n📈 PILLARS DRIVING REACH (by Avg Impressions):")
    for i, (pillar, stats) in enumerate(by_reach, 1):
        print(f"  {i}. {pillar.upper()}: {stats['avg_impressions']:.0f} avg impressions ({stats['count']} posts)")
    
    print("\n🎯 PILLARS DRIVING ACTION (by Avg CTR):")
    for i, (pillar, stats) in enumerate(by_action, 1):
        print(f"  {i}. {pillar.upper()}: {stats['avg_ctr']:.1f}% CTR ({stats['count']} posts)")
    
    print("\n💡 PILLARS DRIVING ENGAGEMENT (by Avg Engagement Rate):")
    for i, (pillar, stats) in enumerate(by_engagement, 1):
        print(f"  {i}. {pillar.upper()}: {stats['avg_engagement_rate']:.1f}% engagement ({stats['count']} posts)")
    
    weakest = min(results.items(), key=lambda x: x[1]['avg_engagement_rate'])
    
    print("\n" + "="*100)
    print("WHERE TO FOCUS CONTENT ENERGY NEXT")
    print("="*100)
    
    print(f"\n✅ DOUBLE DOWN ON:")
    print(f"   • {by_engagement[0][0].upper()} — Highest engagement ({by_engagement[0][1]['avg_engagement_rate']:.1f}%)")
    if by_action[0][0] != by_engagement[0][0]:
        print(f"   • {by_action[0][0].upper()} — Highest CTR ({by_action[0][1]['avg_ctr']:.1f}%)")
    
    print(f"\n⚠️  RETHINK:")
    print(f"   • {weakest[0].upper()} — Lowest engagement ({weakest[1]['avg_engagement_rate']:.1f}%)")
    print(f"     Consider: Is the messaging resonating? Are we using the right format?")
    
    total_posts = sum(s['count'] for s in results.values())
    print(f"\n📊 CURRENT CONTENT MIX:")
    for pillar, stats in sorted(results.items(), key=lambda x: x[1]['count'], reverse=True):
        pct = (stats['count'] / total_posts * 100) if total_posts > 0 else 0
        print(f"   • {pillar}: {stats['count']} posts ({pct:.1f}%)")
    
    print(f"\n💡 RECOMMENDED SHIFT:")
    top_pillar = by_engagement[0][0]
    top_count = results[top_pillar]['count']
    top_pct = (top_count / total_posts * 100) if total_posts > 0 else 0
    print(f"   • Increase {top_pillar.upper()} from {top_pct:.1f}% to 30-40% of content")
    print(f"   • Maintain {by_reach[0][0].upper()} for reach (currently {by_reach[0][1]['count']} posts)")
    print(f"   • Reduce {weakest[0].upper()} or experiment with new angles")


def main():
    """Main execution."""
    repo_root = Path(__file__).parent.parent
    csv_path = repo_root / 'analytics' / 'linkedin_posts.csv'
    
    print("🔍 Adding Pillar Classification to LinkedIn Posts CSV")
    print("="*100)
    
    update_csv_with_pillars(csv_path, repo_root)
    
    print("\n📊 Analyzing performance by pillar...")
    results = analyze_by_pillar(csv_path)
    
    print_analysis(results)
    generate_strategic_summary(results)
    
    print("\n" + "="*100)
    print("✅ Analysis complete!")
    print(f"✅ Updated CSV: {csv_path}")
    print("="*100)


if __name__ == '__main__':
    main()





