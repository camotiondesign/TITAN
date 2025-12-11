#!/usr/bin/env python3
"""
Standardize asset_type across all LinkedIn posts.

Ensures asset_type exists in both meta.json and metrics.json files,
with intelligent fallback detection when data is missing.
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, List, Tuple

# Standard asset type mappings
ASSET_TYPE_MAPPINGS = {
    "single_image": "single-image",
    "single-image": "single-image",
    "video-longform": "video-longform",
    "video_longform": "video-longform",
    "longform_video": "video-longform",
    "longform-video": "video-longform",
    "longform": "video-longform",
    "short_video": "short-video",
    "short-video": "short-video",
    "shortform-video": "short-video",
    "shortform_video": "short-video",
    "video_short": "short-video",
    "video": "short-video",
    "multi-image": "multi-image",
    "multi_image": "multi-image",
    "multi-image-album": "multi-image",
    "carousel": "carousel",
    "poll": "poll",
    "meme_single_image": "meme-single-image",
    "meme-single-image": "meme-single-image",
    "full_animated_video": "full-animated-video",
    "full-animated-video": "full-animated-video",
}

def normalize_asset_type(asset_type: str) -> str:
    """Normalize asset type to standard value."""
    if not asset_type:
        return None
    return ASSET_TYPE_MAPPINGS.get(asset_type.lower(), asset_type.lower())

def detect_asset_type_from_folder(post_folder: Path) -> Optional[str]:
    """Detect asset type from folder structure and content."""
    folder_name = post_folder.name.lower()
    
    # Check folder name patterns
    if "carousel" in folder_name:
        return "carousel"
    if "album" in folder_name:
        return "multi-image"
    if "video" in folder_name or "longform" in folder_name:
        return "video-longform"
    if "short" in folder_name or "clip" in folder_name:
        return "short-video"
    if "poll" in folder_name:
        return "poll"
    if "meme" in folder_name:
        return "meme-single-image"
    
    # Check content folder structure
    content_folder = post_folder.parent.parent.parent / "content"
    if content_folder.exists():
        if (content_folder / "carousel").exists():
            return "carousel"
        if (content_folder / "single-image").exists():
            return "single-image"
        if (content_folder / "video" / "longform").exists():
            return "video-longform"
        if (content_folder / "video" / "shorts").exists():
            return "short-video"
        if (content_folder / "poll").exists():
            return "poll"
        if (content_folder / "multi-image").exists():
            return "multi-image"
    
    return None

def read_json_file(file_path: Path) -> Optional[Dict]:
    """Safely read JSON file."""
    try:
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"  Warning: Could not read {file_path}: {e}")
    return None

def write_json_file(file_path: Path, data: Dict):
    """Safely write JSON file with proper formatting."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
    except IOError as e:
        print(f"  Error: Could not write {file_path}: {e}")

def process_post_folder(post_folder: Path) -> Tuple[str, bool, bool]:
    """
    Process a single LinkedIn post folder.
    Returns: (asset_type, meta_updated, metrics_updated)
    """
    meta_path = post_folder / "meta.json"
    metrics_path = post_folder / "metrics.json"
    
    meta_data = read_json_file(meta_path) if meta_path.exists() else {}
    metrics_data = read_json_file(metrics_path) if metrics_path.exists() else {}
    
    # Get asset_type from various sources (priority order)
    asset_type = None
    
    # 1. Check meta.json
    if meta_data and "asset_type" in meta_data:
        asset_type = normalize_asset_type(meta_data["asset_type"])
    
    # 2. Check metrics.json
    if not asset_type and metrics_data and "asset_type" in metrics_data:
        asset_type = normalize_asset_type(metrics_data["asset_type"])
    
    # 3. Check meta.json for image_type (for albums)
    if not asset_type and meta_data and meta_data.get("image_type") == "album":
        asset_type = "multi-image"
    
    # 4. Detect from folder structure
    if not asset_type:
        asset_type = detect_asset_type_from_folder(post_folder)
    
    if not asset_type:
        return (None, False, False)
    
    meta_updated = False
    metrics_updated = False
    
    # Update meta.json if needed
    if meta_path.exists():
        if meta_data.get("asset_type") != asset_type:
            meta_data["asset_type"] = asset_type
            write_json_file(meta_path, meta_data)
            meta_updated = True
    else:
        # Create meta.json if it doesn't exist
        meta_data = {
            "asset_type": asset_type,
            "platform": "linkedin"
        }
        write_json_file(meta_path, meta_data)
        meta_updated = True
    
    # Update metrics.json if needed
    if metrics_path.exists():
        if metrics_data.get("asset_type") != asset_type:
            metrics_data["asset_type"] = asset_type
            write_json_file(metrics_path, metrics_data)
            metrics_updated = True
    else:
        # Don't create metrics.json if it doesn't exist (metrics are added after posting)
        pass
    
    return (asset_type, meta_updated, metrics_updated)

def main():
    """Main function to process all LinkedIn posts."""
    repo_root = Path(__file__).parent.parent
    campaigns_dir = repo_root / "campaigns"
    
    if not campaigns_dir.exists():
        print(f"Error: Campaigns directory not found at {campaigns_dir}")
        return
    
    # Find all LinkedIn post folders
    linkedin_posts = list(campaigns_dir.rglob("social/linkedin/*/"))
    linkedin_posts = [p for p in linkedin_posts if p.is_dir() and not p.name.startswith("_")]
    
    print(f"Found {len(linkedin_posts)} LinkedIn post folders\n")
    
    results = {
        "processed": 0,
        "meta_updated": 0,
        "metrics_updated": 0,
        "no_asset_type": [],
        "errors": []
    }
    
    for post_folder in sorted(linkedin_posts):
        try:
            asset_type, meta_updated, metrics_updated = process_post_folder(post_folder)
            
            if asset_type:
                results["processed"] += 1
                if meta_updated:
                    results["meta_updated"] += 1
                if metrics_updated:
                    results["metrics_updated"] += 1
                
                if meta_updated or metrics_updated:
                    print(f"✓ {post_folder.relative_to(repo_root)}: {asset_type}")
            else:
                results["no_asset_type"].append(str(post_folder.relative_to(repo_root)))
                print(f"⚠ {post_folder.relative_to(repo_root)}: Could not determine asset_type")
        
        except Exception as e:
            results["errors"].append((str(post_folder.relative_to(repo_root)), str(e)))
            print(f"✗ {post_folder.relative_to(repo_root)}: Error - {e}")
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total posts processed: {results['processed']}")
    print(f"meta.json files updated: {results['meta_updated']}")
    print(f"metrics.json files updated: {results['metrics_updated']}")
    print(f"Posts without asset_type: {len(results['no_asset_type'])}")
    print(f"Errors: {len(results['errors'])}")
    
    if results["no_asset_type"]:
        print("\nPosts that need manual review:")
        for post in results["no_asset_type"]:
            print(f"  - {post}")
    
    if results["errors"]:
        print("\nErrors encountered:")
        for post, error in results["errors"]:
            print(f"  - {post}: {error}")

if __name__ == "__main__":
    main()
