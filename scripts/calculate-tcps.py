#!/usr/bin/env python3
"""
Titan Content Performance Score (TCPS) Calculator

Calculates a 0-100 performance score for all LinkedIn posts that:
- Corrects for inflated carousel engagement (swipes counted as clicks)
- Normalizes for format differences
- Prioritizes real human signals over vanity metrics

Preserves ALL original metrics for reference.
"""

import json
import csv
import os
from pathlib import Path
from typing import Dict, Optional, Any

# Format average impressions (baseline for normalization)
FORMAT_AVG_IMPRESSIONS = {
    "carousel": 1750,
    "short-video": 1400,
    "video-longform": 3800,
    "single-image": 1200,
    "multi-image": 2900,
    "poll": 1108
}

def safe_get(data: Dict, *keys, default=0):
    """Safely get nested values from dict, handling missing keys and None values."""
    current = data
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key)
        if current is None:
            return default
    # Handle string percentages like "5.6%" or "76.8%"
    if isinstance(current, str):
        current = current.replace("%", "").strip()
        try:
            return float(current)
        except (ValueError, TypeError):
            return default
    try:
        return float(current) if current else default
    except (TypeError, ValueError):
        return default

def get_asset_type(metrics: Dict, file_path: str) -> str:
    """Determine asset type from metrics.json, meta.json, or file path."""
    # Try metrics.json first
    asset_type = metrics.get("asset_type")
    if asset_type:
        asset_type = str(asset_type).lower().replace("_", "-")
        if asset_type in FORMAT_AVG_IMPRESSIONS:
            return asset_type
    
    # Try meta.json if it exists
    meta_path = file_path.replace("metrics.json", "meta.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r') as f:
                meta = json.load(f)
                asset_type = meta.get("asset_type")
                if asset_type:
                    asset_type = str(asset_type).lower().replace("_", "-")
                    if asset_type in FORMAT_AVG_IMPRESSIONS:
                        return asset_type
        except:
            pass
    
    # Infer from folder name
    path_lower = file_path.lower()
    if "carousel" in path_lower:
        return "carousel"
    elif "single-image" in path_lower or "single_image" in path_lower:
        return "single-image"
    elif "short-video" in path_lower or "short_video" in path_lower or "short" in path_lower:
        return "short-video"
    elif "longform" in path_lower or "long-form" in path_lower:
        return "video-longform"
    elif "multi-image" in path_lower or "multi_image" in path_lower:
        return "multi-image"
    elif "poll" in path_lower:
        return "poll"
    
    # Default fallback
    return "single-image"

def correct_carousel_clicks(clicks: float, reactions: float, comments: float, 
                           reposts: float, page_views: float) -> float:
    """
    Correct carousel clicks by removing swipe inflation.
    LinkedIn counts carousel swipes as clicks, inflating the number.
    """
    real_engagement = reactions + comments + reposts
    if real_engagement == 0:
        # No real engagement, likely all swipes
        return min(clicks, page_views * 2) if page_views > 0 else clicks * 0.1
    
    # If clicks > 5x real engagement, likely heavily inflated
    if clicks > real_engagement * 5:
        # Estimate: real clicks = 2x real engagement + page views
        estimated_real_clicks = (real_engagement * 2) + page_views
        return min(clicks, estimated_real_clicks)
    
    return clicks

def calculate_tcps(metrics: Dict, file_path: str) -> Dict[str, Any]:
    """
    Calculate Titan Content Performance Score (TCPS) for a post.
    
    Returns dict with:
    - tcps: 0-100 score
    - reach_score: 0-40 (normalized impressions)
    - engagement_score: 0-60 (weighted engagement signals)
    - breakdown: detailed component scores
    - original_metrics: ALL original metrics preserved
    """
    # Extract impressions (handle missing values as 0)
    impressions = safe_get(metrics, "impressions") or safe_get(metrics, "total_impressions", default=0)
    asset_type = get_asset_type(metrics, file_path)
    
    # Get engagement metrics (check organic section for boosted posts)
    organic = metrics.get("organic", {})
    if organic and isinstance(organic, dict):
        reactions = safe_get(organic, "reactions") or safe_get(metrics, "reactions", default=0)
        comments = safe_get(organic, "comments") or safe_get(metrics, "comments", default=0)
        reposts = safe_get(organic, "reposts") or safe_get(metrics, "reposts", default=0)
        clicks = safe_get(organic, "clicks") or safe_get(metrics, "clicks", default=0)
        page_views = safe_get(organic, "page_views") or safe_get(organic, "page_viewers") or \
                    safe_get(metrics, "page_views") or safe_get(metrics, "page_viewers", default=0)
        # Use organic impressions if available for boosted posts
        if safe_get(organic, "impressions", default=0) > 0:
            impressions = safe_get(organic, "impressions")
    else:
        reactions = safe_get(metrics, "reactions", default=0)
        comments = safe_get(metrics, "comments", default=0)
        reposts = safe_get(metrics, "reposts", default=0)
        clicks = safe_get(metrics, "clicks", default=0)
        page_views = safe_get(metrics, "page_views") or safe_get(metrics, "page_viewers", default=0)
    
    # Store original clicks before correction
    original_clicks = clicks
    
    # Skip if no impressions (post not published or no data)
    if impressions == 0:
        return {
            "tcps": 0,
            "reach_score": 0,
            "engagement_score": 0,
            "breakdown": {},
            "original_metrics": metrics.copy()
        }
    
    # 1. REACH SCORE (no cap - can exceed baseline)
    # Normalize impressions relative to format average
    format_avg = FORMAT_AVG_IMPRESSIONS.get(asset_type, 1200)
    reach_ratio = impressions / format_avg if format_avg > 0 else 0
    reach_score = reach_ratio * 40  # No cap - allows scores above baseline
    
    # 2. ENGAGEMENT QUALITY SCORE (no cap - can exceed baseline)
    # Correct carousel clicks for swipe inflation
    if asset_type == "carousel":
        clicks = correct_carousel_clicks(clicks, reactions, comments, reposts, page_views)
    
    # Calculate engagement components (scaled, no caps)
    # Comments: baseline 25 points (highest signal - real engagement)
    # Scale: 1 comment per 100 impressions = 25 points
    comment_scale = 100 / format_avg if format_avg > 0 else 0.083
    comment_score = (comments / comment_scale) * 25 if comment_scale > 0 else 0
    
    # Reposts: baseline 20 points (sharing = strong signal)
    # Scale: 1 repost per 200 impressions = 20 points
    repost_scale = 200 / format_avg if format_avg > 0 else 0.167
    repost_score = (reposts / repost_scale) * 20 if repost_scale > 0 else 0
    
    # Reactions: baseline 10 points (easy engagement)
    # Scale: 1 reaction per 50 impressions = 10 points
    reaction_scale = 50 / format_avg if format_avg > 0 else 0.042
    reaction_score = (reactions / reaction_scale) * 10 if reaction_scale > 0 else 0
    
    # Link clicks (page_views): baseline 5 points (business action)
    # Scale: 1 page view per 500 impressions = 5 points
    link_scale = 500 / format_avg if format_avg > 0 else 0.417
    link_score = (page_views / link_scale) * 5 if link_scale > 0 else 0
    
    # Adjusted clicks: baseline 5 points (reduced weight, especially for carousels)
    # Scale: 1 click per 200 impressions = 5 points (but carousels get 50% weight)
    click_weight = 0.5 if asset_type == "carousel" else 1.0
    click_scale = 200 / format_avg if format_avg > 0 else 0.167
    click_score = (clicks / click_scale) * 5 * click_weight if click_scale > 0 else 0
    
    engagement_score = comment_score + repost_score + reaction_score + link_score + click_score
    # No cap - allows exceptional posts to score above baseline
    
    # Total TCPS
    tcps = reach_score + engagement_score
    
    # Preserve ALL original metrics
    original_metrics = metrics.copy()
    
    return {
        "tcps": round(tcps, 2),
        "reach_score": round(reach_score, 2),
        "engagement_score": round(engagement_score, 2),
        "breakdown": {
            "comments": round(comment_score, 2),
            "reposts": round(repost_score, 2),
            "reactions": round(reaction_score, 2),
            "link_clicks": round(link_score, 2),
            "clicks": round(click_score, 2)
        },
        "raw_metrics": {
            "impressions": impressions,
            "reactions": reactions,
            "comments": comments,
            "reposts": reposts,
            "clicks_original": original_clicks,
            "clicks_adjusted": clicks,
            "page_views": page_views,
            "asset_type": asset_type
        },
        "original_metrics": original_metrics
    }

def process_all_posts(repo_path: str) -> list:
    """Process all metrics.json files and calculate TCPS."""
    results = []
    metrics_files = list(Path(repo_path).glob("**/social/linkedin/**/metrics.json"))
    
    # Filter out template/example files
    metrics_files = [f for f in metrics_files if "_example" not in str(f) and "_templates" not in str(f)]
    
    for metrics_file in metrics_files:
        try:
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
            
            # Skip if not LinkedIn
            if metrics.get("platform", "").lower() not in ["linkedin"]:
                continue
            
            tcps_data = calculate_tcps(metrics, str(metrics_file))
            
            # Create post identifier
            post_id = str(metrics_file.relative_to(repo_path))
            
            # Extract additional metadata
            campaign_slug = metrics.get("campaign_slug", "")
            posted_at = metrics.get("posted_at", "")
            post_url = metrics.get("post_url", "")
            boosted = metrics.get("boosted", False)
            
            results.append({
                "post_id": post_id,
                "campaign_slug": campaign_slug,
                "posted_at": posted_at,
                "post_url": post_url,
                "boosted": boosted,
                **tcps_data
            })
        except Exception as e:
            print(f"Error processing {metrics_file}: {e}")
            continue
    
    return results

if __name__ == "__main__":
    repo_path = "/Users/cameronmoorcroft/Documents/Repos/Clients/TITAN"
    results = process_all_posts(repo_path)
    
    # Sort by TCPS descending (using raw uncapped scores for ranking)
    results.sort(key=lambda x: x["tcps"], reverse=True)
    
    # Normalize TCPS scores to 0-1000 range for readability
    # 
    # Approach: Min-Max Normalization (linear transformation)
    # Formula: normalized = ((score - min) / (max - min)) * 1000
    # 
    # Why this approach:
    # - Preserves relative differences perfectly (linear transformation maintains spacing)
    # - Makes scores easy to read and compare (0-1000 range)
    # - Worst post gets 0, best post gets 1000, everything else proportionally spaced
    # - Ranking and distance between posts stays identical to raw scores
    # 
    # Alternative approaches considered:
    # - Divide by constant: Would require arbitrary factor, doesn't adapt to data range
    # - Logarithmic scaling: Would compress large differences, changing relative spacing
    if results:
        tcps_scores = [post["tcps"] for post in results]
        min_tcps = min(tcps_scores)
        max_tcps = max(tcps_scores)
        
        # Apply min-max normalization: (score - min) / (max - min) * 1000
        # This scales all scores to 0-1000 range while preserving relative spacing
        if max_tcps > min_tcps:  # Avoid division by zero
            for post in results:
                raw_tcps = post["tcps"]
                # Store original uncapped score for reference
                post["tcps_raw"] = raw_tcps
                # Apply normalized score (0-1000 range)
                post["tcps"] = ((raw_tcps - min_tcps) / (max_tcps - min_tcps)) * 1000
        else:
            # All scores are identical - set all to 1000 (or could be 0, but 1000 makes more sense for "perfect")
            for post in results:
                post["tcps_raw"] = post["tcps"]
                post["tcps"] = 1000.0
    
    # Output results
    print(f"Processed {len(results)} posts\n")
    print("Top 20 Posts by TCPS (normalized to 0-1000 range):")
    print("-" * 120)
    for i, post in enumerate(results[:20], 1):
        raw = post["raw_metrics"]
        tcps_normalized = post['tcps']
        tcps_raw = post.get('tcps_raw', post['tcps'])
        print(f"{i:2d}. TCPS: {tcps_normalized:6.1f} (raw: {tcps_raw:,.0f}) | "
              f"Reach: {post['reach_score']:4.1f} | "
              f"Engagement: {post['engagement_score']:4.1f} | "
              f"Type: {raw['asset_type']:15s} | "
              f"Impressions: {raw['impressions']:5.0f} | "
              f"C: {raw['comments']:2.0f} R: {raw['reposts']:2.0f} | "
              f"{post['post_id']}")
    
    print(f"\nBottom 10 Posts by TCPS (normalized to 0-1000 range):")
    print("-" * 120)
    for i, post in enumerate(results[-10:], len(results) - 9):
        raw = post["raw_metrics"]
        tcps_normalized = post['tcps']
        tcps_raw = post.get('tcps_raw', post['tcps'])
        print(f"{i:2d}. TCPS: {tcps_normalized:6.1f} (raw: {tcps_raw:,.0f}) | "
              f"Reach: {post['reach_score']:4.1f} | "
              f"Engagement: {post['engagement_score']:4.1f} | "
              f"Type: {raw['asset_type']:15s} | "
              f"Impressions: {raw['impressions']:5.0f} | "
              f"C: {raw['comments']:2.0f} R: {raw['reposts']:2.0f} | "
              f"{post['post_id']}")
    
    # Save full results to JSON (preserves all original metrics)
    output_json = os.path.join(repo_path, "tcps_scores.json")
    with open(output_json, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nFull results (with all original metrics) saved to: {output_json}")
    
    # Also save CSV for easy analysis (includes key metrics)
    output_csv = os.path.join(repo_path, "tcps_scores.csv")
    if results:
        fieldnames = [
            "post_id", "campaign_slug", "posted_at", "boosted",
            "tcps", "tcps_raw", "reach_score", "engagement_score",
            "breakdown_comments", "breakdown_reposts", "breakdown_reactions", 
            "breakdown_link_clicks", "breakdown_clicks",
            "impressions", "reactions", "comments", "reposts", 
            "clicks_original", "clicks_adjusted", "page_views", "asset_type",
            "engagement_rate", "click_through_rate"
        ]
        
        with open(output_csv, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for post in results:
                breakdown = post.get("breakdown", {})
                raw_metrics = post.get("raw_metrics", {})
                row = {
                    "post_id": post.get("post_id", ""),
                    "campaign_slug": post.get("campaign_slug", ""),
                    "posted_at": post.get("posted_at", ""),
                    "boosted": post.get("boosted", False),
                    "tcps": post.get("tcps", 0),
                    "tcps_raw": post.get("tcps_raw", post.get("tcps", 0)),
                    "reach_score": post.get("reach_score", 0),
                    "engagement_score": post.get("engagement_score", 0),
                    "breakdown_comments": breakdown.get("comments", 0),
                    "breakdown_reposts": breakdown.get("reposts", 0),
                    "breakdown_reactions": breakdown.get("reactions", 0),
                    "breakdown_link_clicks": breakdown.get("link_clicks", 0),
                    "breakdown_clicks": breakdown.get("clicks", 0),
                    "impressions": raw_metrics.get("impressions", 0),
                    "reactions": raw_metrics.get("reactions", 0),
                    "comments": raw_metrics.get("comments", 0),
                    "reposts": raw_metrics.get("reposts", 0),
                    "clicks_original": raw_metrics.get("clicks_original", 0),
                    "clicks_adjusted": raw_metrics.get("clicks_adjusted", 0),
                    "page_views": raw_metrics.get("page_views", 0),
                    "asset_type": raw_metrics.get("asset_type", ""),
                    "engagement_rate": safe_get(post.get("original_metrics", {}), "engagement_rate", default=0),
                    "click_through_rate": safe_get(post.get("original_metrics", {}), "click_through_rate") or 
                                        safe_get(post.get("original_metrics", {}), "ctr", default=0)
                }
                writer.writerow(row)
        print(f"CSV summary saved to: {output_csv}")
