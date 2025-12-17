#!/usr/bin/env python3
"""
LinkedIn Posts Data Analysis

Comprehensive analysis of LinkedIn posts performance data.
"""

import csv
import statistics
from pathlib import Path
from typing import List, Dict
from collections import defaultdict


def read_csv_data(filepath: str) -> List[Dict]:
    """Read CSV file and return list of dictionaries."""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert numeric fields
            for key in ['impressions', 'engagements', 'clicks', 'reactions', 
                       'comments', 'reposts', 'word_count', 'char_count', 
                       'num_hashtags']:
                try:
                    row[key] = int(row[key]) if row[key] else 0
                except ValueError:
                    row[key] = 0
            
            for key in ['engagement_rate', 'click_through_rate']:
                try:
                    row[key] = float(row[key]) if row[key] else 0.0
                except ValueError:
                    row[key] = 0.0
            
            # Convert boolean fields
            for key in ['has_link', 'has_emoji', 'has_hashtags']:
                row[key] = row[key].lower() == 'true'
            
            data.append(row)
    return data


def calculate_stats(values: List[float]) -> Dict:
    """Calculate statistics for a list of values."""
    if not values:
        return {'mean': 0, 'median': 0, 'min': 0, 'max': 0}
    return {
        'mean': statistics.mean(values),
        'median': statistics.median(values),
        'min': min(values),
        'max': max(values)
    }


def print_table(title: str, headers: List[str], rows: List[List[str]], col_widths: List[int] = None):
    """Print a formatted table."""
    print(f"\n{'='*100}")
    print(f"{title:^100}")
    print('='*100)
    
    if not rows:
        print("No data")
        return
    
    # Calculate column widths if not provided
    if not col_widths:
        col_widths = [max(len(str(h)), max(len(str(r[i])) for r in rows)) for i, h in enumerate(headers)]
    
    # Print header
    header_row = " | ".join(str(h).ljust(w) for h, w in zip(headers, col_widths))
    print(header_row)
    print("-" * len(header_row))
    
    # Print rows
    for row in rows:
        print(" | ".join(str(c).ljust(w) for c, w in zip(row, col_widths)))


def analyze_top_performers_by_reach(data: List[Dict]) -> Dict:
    """Analyze top 10% by impressions."""
    sorted_data = sorted(data, key=lambda x: x['impressions'], reverse=True)
    top_10_percent = sorted_data[:max(1, len(sorted_data) // 10)]
    
    # Calculate averages
    word_counts = [p['word_count'] for p in top_10_percent]
    engagement_rates = [p['engagement_rate'] for p in top_10_percent]
    ctrs = [p['click_through_rate'] for p in top_10_percent]
    
    # Post type distribution
    post_types = defaultdict(int)
    for p in top_10_percent:
        post_types[p['post_type']] += 1
    
    # Link usage
    with_links = sum(1 for p in top_10_percent if p['has_link'])
    
    # Hashtag stats
    hashtag_counts = [p['num_hashtags'] for p in top_10_percent]
    
    return {
        'count': len(top_10_percent),
        'avg_word_count': statistics.mean(word_counts) if word_counts else 0,
        'post_type_distribution': dict(post_types),
        'link_usage_pct': (with_links / len(top_10_percent) * 100) if top_10_percent else 0,
        'avg_hashtags': statistics.mean(hashtag_counts) if hashtag_counts else 0,
        'avg_engagement_rate': statistics.mean(engagement_rates) if engagement_rates else 0,
        'avg_ctr': statistics.mean(ctrs) if ctrs else 0,
        'posts': top_10_percent
    }


def analyze_top_performers_by_action(data: List[Dict]) -> Dict:
    """Analyze top 10% by clicks and CTR."""
    sorted_by_clicks = sorted(data, key=lambda x: x['clicks'], reverse=True)
    sorted_by_ctr = sorted(data, key=lambda x: x['click_through_rate'], reverse=True)
    
    top_10_clicks = sorted_by_clicks[:max(1, len(data) // 10)]
    top_10_ctr = sorted_by_ctr[:max(1, len(data) // 10)]
    
    def calc_stats_for_group(group):
        word_counts = [p['word_count'] for p in group]
        engagement_rates = [p['engagement_rate'] for p in group]
        ctrs = [p['click_through_rate'] for p in group]
        post_types = defaultdict(int)
        for p in group:
            post_types[p['post_type']] += 1
        with_links = sum(1 for p in group if p['has_link'])
        hashtag_counts = [p['num_hashtags'] for p in group]
        
        return {
            'count': len(group),
            'avg_word_count': statistics.mean(word_counts) if word_counts else 0,
            'post_type_distribution': dict(post_types),
            'link_usage_pct': (with_links / len(group) * 100) if group else 0,
            'avg_hashtags': statistics.mean(hashtag_counts) if hashtag_counts else 0,
            'avg_engagement_rate': statistics.mean(engagement_rates) if engagement_rates else 0,
            'avg_ctr': statistics.mean(ctrs) if ctrs else 0,
        }
    
    return {
        'by_clicks': calc_stats_for_group(top_10_clicks),
        'by_ctr': calc_stats_for_group(top_10_ctr)
    }


def analyze_caption_length(data: List[Dict]) -> Dict:
    """Analyze performance by caption length buckets."""
    buckets = {
        '0-40': [],
        '41-80': [],
        '81-150': [],
        '151+': []
    }
    
    for post in data:
        wc = post['word_count']
        if wc <= 40:
            buckets['0-40'].append(post)
        elif wc <= 80:
            buckets['41-80'].append(post)
        elif wc <= 150:
            buckets['81-150'].append(post)
        else:
            buckets['151+'].append(post)
    
    results = {}
    for bucket_name, posts in buckets.items():
        if posts:
            impressions = [p['impressions'] for p in posts]
            engagement_rates = [p['engagement_rate'] for p in posts]
            ctrs = [p['click_through_rate'] for p in posts]
            
            results[bucket_name] = {
                'count': len(posts),
                'mean_impressions': statistics.mean(impressions),
                'median_impressions': statistics.median(impressions),
                'mean_engagement_rate': statistics.mean(engagement_rates),
                'mean_ctr': statistics.mean(ctrs)
            }
        else:
            results[bucket_name] = {
                'count': 0,
                'mean_impressions': 0,
                'median_impressions': 0,
                'mean_engagement_rate': 0,
                'mean_ctr': 0
            }
    
    return results


def analyze_links_vs_no_links(data: List[Dict]) -> Dict:
    """Compare posts with and without links."""
    with_links = [p for p in data if p['has_link']]
    without_links = [p for p in data if not p['has_link']]
    
    def calc_group_stats(group):
        if not group:
            return {'count': 0, 'avg_impressions': 0, 'avg_engagement_rate': 0, 'avg_ctr': 0}
        impressions = [p['impressions'] for p in group]
        engagement_rates = [p['engagement_rate'] for p in group]
        ctrs = [p['click_through_rate'] for p in group]
        return {
            'count': len(group),
            'avg_impressions': statistics.mean(impressions),
            'avg_engagement_rate': statistics.mean(engagement_rates),
            'avg_ctr': statistics.mean(ctrs)
        }
    
    return {
        'with_links': calc_group_stats(with_links),
        'without_links': calc_group_stats(without_links)
    }


def analyze_format_performance(data: List[Dict]) -> Dict:
    """Analyze performance by post type."""
    post_types = defaultdict(list)
    for post in data:
        post_types[post['post_type']].append(post)
    
    results = {}
    for post_type, posts in post_types.items():
        impressions = [p['impressions'] for p in posts]
        engagement_rates = [p['engagement_rate'] for p in posts]
        ctrs = [p['click_through_rate'] for p in posts]
        
        results[post_type] = {
            'count': len(posts),
            'avg_impressions': statistics.mean(impressions),
            'avg_engagement_rate': statistics.mean(engagement_rates),
            'avg_ctr': statistics.mean(ctrs)
        }
    
    return results


def analyze_hashtag_usage(data: List[Dict]) -> Dict:
    """Analyze performance by hashtag count."""
    buckets = {
        '0': [],
        '1-3': [],
        '4-6': [],
        '7+': []
    }
    
    for post in data:
        num = post['num_hashtags']
        if num == 0:
            buckets['0'].append(post)
        elif num <= 3:
            buckets['1-3'].append(post)
        elif num <= 6:
            buckets['4-6'].append(post)
        else:
            buckets['7+'].append(post)
    
    results = {}
    for bucket_name, posts in buckets.items():
        if posts:
            impressions = [p['impressions'] for p in posts]
            engagement_rates = [p['engagement_rate'] for p in posts]
            ctrs = [p['click_through_rate'] for p in posts]
            
            results[bucket_name] = {
                'count': len(posts),
                'avg_impressions': statistics.mean(impressions),
                'mean_engagement_rate': statistics.mean(engagement_rates),
                'mean_ctr': statistics.mean(ctrs)
            }
        else:
            results[bucket_name] = {
                'count': 0,
                'avg_impressions': 0,
                'mean_engagement_rate': 0,
                'mean_ctr': 0
            }
    
    return results


def main():
    """Main analysis function."""
    repo_root = Path(__file__).parent.parent
    csv_file = repo_root / 'analytics' / 'linkedin_posts.csv'
    
    print("📊 LinkedIn Posts Performance Analysis")
    print("=" * 100)
    
    # Read data
    data = read_csv_data(str(csv_file))
    print(f"\n✅ Loaded {len(data)} LinkedIn posts")
    
    # 1. Top performers by reach
    print("\n" + "="*100)
    print("1. TOP PERFORMERS BY REACH (Top 10% by Impressions)")
    print("="*100)
    top_reach = analyze_top_performers_by_reach(data)
    
    rows = [
        ['Metric', 'Value'],
        ['Number of Posts', str(top_reach['count'])],
        ['Avg Word Count', f"{top_reach['avg_word_count']:.1f}"],
        ['Avg Engagement Rate', f"{top_reach['avg_engagement_rate']:.1f}%"],
        ['Avg CTR', f"{top_reach['avg_ctr']:.1f}%"],
        ['Posts with Links', f"{top_reach['link_usage_pct']:.1f}%"],
        ['Avg Hashtags', f"{top_reach['avg_hashtags']:.1f}"]
    ]
    print_table("Summary Statistics", ['Metric', 'Value'], rows)
    
    print("\nPost Type Distribution:")
    for post_type, count in top_reach['post_type_distribution'].items():
        print(f"  {post_type}: {count} ({count/top_reach['count']*100:.1f}%)")
    
    # 2. Top performers by action
    print("\n" + "="*100)
    print("2. TOP PERFORMERS BY ACTION")
    print("="*100)
    top_action = analyze_top_performers_by_action(data)
    
    print("\n📈 Top 10% by CLICKS:")
    rows = [
        ['Metric', 'Value'],
        ['Number of Posts', str(top_action['by_clicks']['count'])],
        ['Avg Word Count', f"{top_action['by_clicks']['avg_word_count']:.1f}"],
        ['Avg Engagement Rate', f"{top_action['by_clicks']['avg_engagement_rate']:.1f}%"],
        ['Avg CTR', f"{top_action['by_clicks']['avg_ctr']:.1f}%"],
        ['Posts with Links', f"{top_action['by_clicks']['link_usage_pct']:.1f}%"],
        ['Avg Hashtags', f"{top_action['by_clicks']['avg_hashtags']:.1f}"]
    ]
    print_table("Summary", ['Metric', 'Value'], rows)
    print("\nPost Type Distribution:")
    for post_type, count in top_action['by_clicks']['post_type_distribution'].items():
        print(f"  {post_type}: {count}")
    
    print("\n📈 Top 10% by CTR:")
    rows = [
        ['Metric', 'Value'],
        ['Number of Posts', str(top_action['by_ctr']['count'])],
        ['Avg Word Count', f"{top_action['by_ctr']['avg_word_count']:.1f}"],
        ['Avg Engagement Rate', f"{top_action['by_ctr']['avg_engagement_rate']:.1f}%"],
        ['Avg CTR', f"{top_action['by_ctr']['avg_ctr']:.1f}%"],
        ['Posts with Links', f"{top_action['by_ctr']['link_usage_pct']:.1f}%"],
        ['Avg Hashtags', f"{top_action['by_ctr']['avg_hashtags']:.1f}"]
    ]
    print_table("Summary", ['Metric', 'Value'], rows)
    print("\nPost Type Distribution:")
    for post_type, count in top_action['by_ctr']['post_type_distribution'].items():
        print(f"  {post_type}: {count}")
    
    # 3. Caption length analysis
    print("\n" + "="*100)
    print("3. CAPTION LENGTH ANALYSIS")
    print("="*100)
    caption_analysis = analyze_caption_length(data)
    
    rows = [
        ['Word Count', 'Count', 'Mean Impressions', 'Median Impressions', 'Mean Engagement Rate', 'Mean CTR']
    ]
    for bucket, stats in caption_analysis.items():
        rows.append([
            bucket,
            str(stats['count']),
            f"{stats['mean_impressions']:.0f}",
            f"{stats['median_impressions']:.0f}",
            f"{stats['mean_engagement_rate']:.1f}%",
            f"{stats['mean_ctr']:.1f}%"
        ])
    print_table("Performance by Caption Length", 
                ['Word Count', 'Count', 'Mean Impressions', 'Median Impressions', 'Mean Engagement Rate', 'Mean CTR'],
                rows)
    
    # 4. Links vs no links
    print("\n" + "="*100)
    print("4. LINKS VS NO LINKS")
    print("="*100)
    links_analysis = analyze_links_vs_no_links(data)
    
    rows = [
        ['Metric', 'With Links', 'Without Links'],
        ['Count', str(links_analysis['with_links']['count']), str(links_analysis['without_links']['count'])],
        ['Avg Impressions', f"{links_analysis['with_links']['avg_impressions']:.0f}", 
         f"{links_analysis['without_links']['avg_impressions']:.0f}"],
        ['Avg Engagement Rate', f"{links_analysis['with_links']['avg_engagement_rate']:.1f}%",
         f"{links_analysis['without_links']['avg_engagement_rate']:.1f}%"],
        ['Avg CTR', f"{links_analysis['with_links']['avg_ctr']:.1f}%",
         f"{links_analysis['without_links']['avg_ctr']:.1f}%"]
    ]
    print_table("Comparison", ['Metric', 'With Links', 'Without Links'], rows)
    
    # 5. Format performance
    print("\n" + "="*100)
    print("5. FORMAT PERFORMANCE (by Post Type)")
    print("="*100)
    format_analysis = analyze_format_performance(data)
    
    rows = [
        ['Post Type', 'Count', 'Avg Impressions', 'Avg Engagement Rate', 'Avg CTR']
    ]
    for post_type, stats in sorted(format_analysis.items(), key=lambda x: x[1]['count'], reverse=True):
        rows.append([
            post_type,
            str(stats['count']),
            f"{stats['avg_impressions']:.0f}",
            f"{stats['avg_engagement_rate']:.1f}%",
            f"{stats['avg_ctr']:.1f}%"
        ])
    print_table("Performance by Post Type", 
                ['Post Type', 'Count', 'Avg Impressions', 'Avg Engagement Rate', 'Avg CTR'],
                rows)
    
    # 6. Hashtag usage
    print("\n" + "="*100)
    print("6. HASHTAG USAGE ANALYSIS")
    print("="*100)
    hashtag_analysis = analyze_hashtag_usage(data)
    
    rows = [
        ['Hashtags', 'Count', 'Avg Impressions', 'Avg Engagement Rate', 'Avg CTR']
    ]
    for bucket, stats in hashtag_analysis.items():
        rows.append([
            bucket,
            str(stats['count']),
            f"{stats['avg_impressions']:.0f}",
            f"{stats['mean_engagement_rate']:.1f}%",
            f"{stats['mean_ctr']:.1f}%"
        ])
    print_table("Performance by Hashtag Count", 
                ['Hashtags', 'Count', 'Avg Impressions', 'Avg Engagement Rate', 'Avg CTR'],
                rows)
    
    # Generate insights
    print("\n" + "="*100)
    print("📝 KEY INSIGHTS & PATTERNS")
    print("="*100)
    
    # Calculate overall averages for comparison
    all_impressions = [p['impressions'] for p in data]
    all_engagement_rates = [p['engagement_rate'] for p in data]
    all_ctrs = [p['click_through_rate'] for p in data]
    
    overall_avg_impressions = statistics.mean(all_impressions)
    overall_avg_engagement = statistics.mean(all_engagement_rates)
    overall_avg_ctr = statistics.mean(all_ctrs)
    
    print(f"\nOverall Averages:")
    print(f"  Impressions: {overall_avg_impressions:.0f}")
    print(f"  Engagement Rate: {overall_avg_engagement:.1f}%")
    print(f"  CTR: {overall_avg_ctr:.1f}%")
    
    # Generate insights
    insights = []
    
    # Top reach insights
    if top_reach['avg_engagement_rate'] > overall_avg_engagement:
        insights.append(f"Top reach posts have {top_reach['avg_engagement_rate'] - overall_avg_engagement:.1f}% higher engagement rate than average")
    
    # Caption length insights
    best_bucket = max(caption_analysis.items(), key=lambda x: x[1]['mean_engagement_rate'])
    insights.append(f"Best performing caption length: {best_bucket[0]} words (avg {best_bucket[1]['mean_engagement_rate']:.1f}% engagement)")
    
    # Links insights
    if links_analysis['with_links']['avg_engagement_rate'] > links_analysis['without_links']['avg_engagement_rate']:
        diff = links_analysis['with_links']['avg_engagement_rate'] - links_analysis['without_links']['avg_engagement_rate']
        insights.append(f"Posts with links perform {diff:.1f}% better in engagement rate")
    else:
        diff = links_analysis['without_links']['avg_engagement_rate'] - links_analysis['with_links']['avg_engagement_rate']
        insights.append(f"Posts without links perform {diff:.1f}% better in engagement rate")
    
    # Format insights
    best_format = max(format_analysis.items(), key=lambda x: x[1]['avg_engagement_rate'])
    insights.append(f"Best performing format: {best_format[0]} ({best_format[1]['avg_engagement_rate']:.1f}% avg engagement)")
    
    # Hashtag insights
    best_hashtag_bucket = max(hashtag_analysis.items(), key=lambda x: x[1]['mean_engagement_rate'])
    insights.append(f"Optimal hashtag count: {best_hashtag_bucket[0]} ({best_hashtag_bucket[1]['mean_engagement_rate']:.1f}% avg engagement)")
    
    print("\n" + "\n".join(f"  • {insight}" for insight in insights))
    
    # 5 Punchy Takeaways
    print("\n" + "="*100)
    print("🎯 5 PUNCHY TAKEAWAYS")
    print("="*100)
    
    takeaways = []
    
    # Takeaway 1: Best format
    best_format_name = best_format[0]
    best_format_rate = best_format[1]['avg_engagement_rate']
    takeaways.append(f"DOUBLE DOWN: {best_format_name.upper()} posts average {best_format_rate:.1f}% engagement — your strongest format")
    
    # Takeaway 2: Caption length
    best_length = best_bucket[0]
    best_length_rate = best_bucket[1]['mean_engagement_rate']
    takeaways.append(f"DOUBLE DOWN: {best_length}-word captions drive {best_length_rate:.1f}% engagement — sweet spot identified")
    
    # Takeaway 3: Hashtags
    best_hashtag_count = best_hashtag_bucket[0]
    best_hashtag_rate = best_hashtag_bucket[1]['mean_engagement_rate']
    worst_hashtag_bucket = min(hashtag_analysis.items(), key=lambda x: x[1]['mean_engagement_rate'] if x[1]['count'] > 0 else 999)
    if worst_hashtag_bucket[1]['count'] > 0:
        worst_hashtag_rate = worst_hashtag_bucket[1]['mean_engagement_rate']
        if best_hashtag_rate > worst_hashtag_rate + 5:
            takeaways.append(f"DOUBLE DOWN: {best_hashtag_count} hashtags = {best_hashtag_rate:.1f}% engagement vs {worst_hashtag_bucket[0]} = {worst_hashtag_rate:.1f}% — hashtag strategy matters")
    
    # Takeaway 4: Links
    if links_analysis['with_links']['avg_engagement_rate'] > links_analysis['without_links']['avg_engagement_rate'] + 2:
        takeaways.append(f"DOUBLE DOWN: Posts with links drive {links_analysis['with_links']['avg_engagement_rate']:.1f}% engagement vs {links_analysis['without_links']['avg_engagement_rate']:.1f}% without — include links")
    elif links_analysis['without_links']['avg_engagement_rate'] > links_analysis['with_links']['avg_engagement_rate'] + 2:
        takeaways.append(f"STOP: Links are hurting engagement ({links_analysis['with_links']['avg_engagement_rate']:.1f}% vs {links_analysis['without_links']['avg_engagement_rate']:.1f}%) — remove links")
    
    # Takeaway 5: Worst format
    worst_format = min(format_analysis.items(), key=lambda x: x[1]['avg_engagement_rate'])
    if worst_format[1]['count'] > 5:  # Only if significant sample
        worst_format_rate = worst_format[1]['avg_engagement_rate']
        if worst_format_rate < overall_avg_engagement - 5:
            takeaways.append(f"STOP: {worst_format[0].upper()} posts underperform at {worst_format_rate:.1f}% engagement — deprioritize this format")
    
    # Fill remaining takeaways if needed
    if len(takeaways) < 5:
        # Add CTR insight
        best_ctr_format = max(format_analysis.items(), key=lambda x: x[1]['avg_ctr'])
        if best_ctr_format[1]['avg_ctr'] > overall_avg_ctr + 10:
            takeaways.append(f"DOUBLE DOWN: {best_ctr_format[0].upper()} posts have {best_ctr_format[1]['avg_ctr']:.1f}% CTR — highest click-through")
    
    for i, takeaway in enumerate(takeaways[:5], 1):
        print(f"\n{i}. {takeaway}")
    
    print("\n" + "="*100)


if __name__ == '__main__':
    main()





