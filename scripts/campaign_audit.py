#!/usr/bin/env python3
"""
Campaign Audit Script
Identifies misfiled assets/metrics, duplicates, and generic filenames across campaigns.
"""

import json
import re
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime
import os

BASE_DIR = Path(__file__).parent.parent
CAMPAIGNS_DIR = BASE_DIR / "campaigns"

def extract_date_from_path(path: Path) -> Optional[str]:
    """Extract date from campaign folder name (YYYY-MM-DD-*)."""
    match = re.match(r'(\d{4}-\d{2}-\d{2})', path.name)
    if match:
        return match.group(1)
    match = re.match(r'(\d{4}-\d{2}-00)', path.name)
    if match:
        return match.group(1)
    return None

def read_json_safe(path: Path) -> Optional[Dict]:
    """Safely read JSON file."""
    try:
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except:
        pass
    return None

def read_text_safe(path: Path) -> Optional[str]:
    """Safely read text file."""
    try:
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
    except:
        pass
    return None

def infer_campaign_intent(campaign_path: Path, meta: Optional[Dict]) -> str:
    """Infer campaign intent from folder name and metadata."""
    folder_name = campaign_path.name
    
    # Try metadata first
    if meta:
        if 'title' in meta:
            return meta['title']
        if 'campaign_name' in meta:
            return meta['campaign_name']
        if 'purpose' in meta:
            return meta['purpose'][:100]
    
    # Extract from folder name
    parts = folder_name.split('-')
    if len(parts) >= 4:
        intent = ' '.join(parts[3:]).replace('-', ' ').title()
        return intent
    
    return "Unknown intent"

def scan_campaign(campaign_path: Path) -> Dict:
    """Scan a single campaign folder."""
    result = {
        'path': str(campaign_path.relative_to(BASE_DIR)),
        'folder_name': campaign_path.name,
        'campaign_date': extract_date_from_path(campaign_path),
        'meta': None,
        'meta_exists': False,
        'readme_exists': False,
        'post_mortem_exists': False,
        'content_types': [],
        'platforms': [],
        'metrics': [],
        'social_posts': [],
        'anomalies': [],
        'generic_filenames': []
    }
    
    # Check for campaign-meta.json
    meta_path = campaign_path / "campaign-meta.json"
    if meta_path.exists():
        result['meta'] = read_json_safe(meta_path)
        result['meta_exists'] = True
        result['inferred_intent'] = infer_campaign_intent(campaign_path, result['meta'])
    else:
        result['inferred_intent'] = infer_campaign_intent(campaign_path, None)
    
    # Check for README
    if (campaign_path / "README.md").exists():
        result['readme_exists'] = True
    
    # Check for post-mortem
    if (campaign_path / "post-mortem.md").exists():
        result['post_mortem_exists'] = True
    
    # Scan content folder
    content_dir = campaign_path / "content"
    if content_dir.exists():
        if (content_dir / "blog" / "blog.md").exists():
            result['content_types'].append('blog')
        if (content_dir / "carousel" / "slides.md").exists():
            result['content_types'].append('carousel')
        if (content_dir / "video").exists():
            result['content_types'].append('video')
            # Check for longform/shorts
            if (content_dir / "video" / "longform").exists():
                result['content_types'].append('video-longform')
            if (content_dir / "video" / "shorts").exists():
                result['content_types'].append('video-shorts')
        if (content_dir / "single-image").exists():
            result['content_types'].append('single-image')
            # Check for generic filenames
            for img_file in (content_dir / "single-image").glob("image-*.md"):
                result['generic_filenames'].append({
                    'path': str(img_file.relative_to(BASE_DIR)),
                    'type': 'single-image',
                    'current_name': img_file.name
                })
        if (content_dir / "poll" / "poll.md").exists():
            result['content_types'].append('poll')
    
    # Scan social folder
    social_dir = campaign_path / "social"
    if social_dir.exists():
        # LinkedIn
        linkedin_dir = social_dir / "linkedin"
        if linkedin_dir.exists():
            result['platforms'].append('LinkedIn')
            for post_folder in linkedin_dir.iterdir():
                if post_folder.is_dir() and not post_folder.name.startswith('_'):
                    result['social_posts'].append({
                        'platform': 'LinkedIn',
                        'folder': post_folder.name,
                        'path': str(post_folder.relative_to(BASE_DIR))
                    })
                    # Check for metrics
                    metrics_path = post_folder / "metrics.json"
                    if metrics_path.exists():
                        metrics_data = read_json_safe(metrics_path)
                        post_date = extract_date_from_path(post_folder)
                        result['metrics'].append({
                            'platform': 'LinkedIn',
                            'path': str(metrics_path.relative_to(BASE_DIR)),
                            'post_folder': post_folder.name,
                            'post_date': post_date,
                            'campaign_date': result['campaign_date'],
                            'data': metrics_data
                        })
                        # Check for date mismatch
                        if post_date and result['campaign_date']:
                            if post_date != result['campaign_date']:
                                result['anomalies'].append({
                                    'type': 'date_mismatch',
                                    'severity': 'medium',
                                    'message': f"Post date {post_date} doesn't match campaign date {result['campaign_date']}",
                                    'path': str(metrics_path.relative_to(BASE_DIR))
                                })
                        # Check campaign_slug in metrics
                        if metrics_data and 'campaign_slug' in metrics_data:
                            metrics_slug = metrics_data['campaign_slug']
                            if metrics_slug != campaign_path.name:
                                result['anomalies'].append({
                                    'type': 'slug_mismatch',
                                    'severity': 'high',
                                    'message': f"Metrics campaign_slug '{metrics_slug}' doesn't match folder '{campaign_path.name}'",
                                    'path': str(metrics_path.relative_to(BASE_DIR)),
                                    'expected_slug': campaign_path.name,
                                    'found_slug': metrics_slug
                                })
        
        # TikTok
        tiktok_dir = social_dir / "tiktok"
        if tiktok_dir.exists():
            result['platforms'].append('TikTok')
            for metrics_file in tiktok_dir.glob("*.json"):
                if metrics_file.name == "metrics.json":
                    result['metrics'].append({
                        'platform': 'TikTok',
                        'path': str(metrics_file.relative_to(BASE_DIR))
                    })
        
        # YouTube
        youtube_dir = social_dir / "youtube"
        if youtube_dir.exists():
            result['platforms'].append('YouTube')
            for metrics_file in youtube_dir.glob("*.json"):
                if metrics_file.name == "metrics.json":
                    result['metrics'].append({
                        'platform': 'YouTube',
                        'path': str(metrics_file.relative_to(BASE_DIR))
                    })
    
    # Check performance folder
    performance_dir = campaign_path / "performance"
    if performance_dir.exists():
        for metrics_file in performance_dir.glob("*.json"):
            platform = metrics_file.stem  # linkedin, tiktok, youtube
            if platform in ['linkedin', 'tiktok', 'youtube']:
                result['platforms'].append(platform.capitalize())
                metrics_data = read_json_safe(metrics_file)
                result['metrics'].append({
                    'platform': platform.capitalize(),
                    'path': str(metrics_file.relative_to(BASE_DIR)),
                    'data': metrics_data
                })
    
    # Check for metrics without matching social posts
    linkedin_metrics = [m for m in result['metrics'] if m['platform'] == 'LinkedIn']
    linkedin_posts = [p for p in result['social_posts'] if p['platform'] == 'LinkedIn']
    if len(linkedin_metrics) > len(linkedin_posts):
        result['anomalies'].append({
            'type': 'orphan_metrics',
            'severity': 'low',
            'message': f"Found {len(linkedin_metrics)} LinkedIn metrics but only {len(linkedin_posts)} post folders",
            'metrics_count': len(linkedin_metrics),
            'posts_count': len(linkedin_posts)
        })
    
    return result

def find_duplicate_campaigns(campaigns: List[Dict]) -> List[Dict]:
    """Find potentially duplicate or overlapping campaigns."""
    duplicates = []
    
    # Group by inferred intent (simplified)
    intent_groups = defaultdict(list)
    for campaign in campaigns:
        intent_key = campaign['inferred_intent'].lower()[:50]  # First 50 chars
        intent_groups[intent_key].append(campaign)
    
    for intent, group in intent_groups.items():
        if len(group) > 1:
            # Check if they're actually duplicates or just similar
            dates = [c['campaign_date'] for c in group if c['campaign_date']]
            if len(set(dates)) < len(dates):
                duplicates.append({
                    'intent': intent,
                    'campaigns': group,
                    'confidence': 'high',
                    'reason': 'Same intent and overlapping dates'
                })
            else:
                duplicates.append({
                    'intent': intent,
                    'campaigns': group,
                    'confidence': 'medium',
                    'reason': 'Similar intent but different dates'
                })
    
    return duplicates

def find_misfiled_metrics(campaigns: List[Dict]) -> List[Dict]:
    """Find metrics that appear to be in the wrong campaign."""
    misfiles = []
    
    # Template patterns to ignore
    template_patterns = ['yyyy-mm-dd-slug', 'campaign-slug', 'example', 'template']
    
    for campaign in campaigns:
        for metric in campaign['metrics']:
            if 'data' in metric and metric['data']:
                data = metric['data']
                # Check campaign_slug mismatch
                if 'campaign_slug' in data:
                    slug = data['campaign_slug']
                    # Skip template placeholders
                    if any(template in slug.lower() for template in template_patterns):
                        continue
                    
                    if slug != campaign['folder_name']:
                        # Try to find the correct campaign
                        correct_campaign = None
                        for other_campaign in campaigns:
                            if other_campaign['folder_name'] == slug:
                                correct_campaign = other_campaign
                                break
                        
                        misfiles.append({
                            'metric_path': metric['path'],
                            'current_campaign': campaign['path'],
                            'current_campaign_name': campaign['folder_name'],
                            'metric_slug': slug,
                            'correct_campaign': correct_campaign['path'] if correct_campaign else None,
                            'confidence': 'high' if correct_campaign else 'medium',
                            'evidence': f"metrics.json contains campaign_slug: '{slug}' but folder is '{campaign['folder_name']}'"
                        })
                
                # Check posted_at date vs campaign date (only flag significant mismatches)
                if 'posted_at' in data and campaign['campaign_date']:
                    posted_date = data['posted_at']
                    if posted_date and posted_date != campaign['campaign_date']:
                        # Calculate date difference (only flag if > 30 days for regular campaigns, > 90 for case studies)
                        try:
                            posted_dt = datetime.strptime(posted_date, '%Y-%m-%d')
                            campaign_dt = datetime.strptime(campaign['campaign_date'], '%Y-%m-%d')
                            days_diff = abs((posted_dt - campaign_dt).days)
                            
                            # For case studies, allow posts over time (but flag if > 90 days)
                            is_case_study = 'case-study' in campaign['folder_name'].lower() or (campaign.get('meta') and 'case-study' in str(campaign['meta']).lower())
                            threshold = 90 if is_case_study else 30
                            
                            if days_diff > threshold:
                                # Check if there's a campaign with matching date
                                matching_campaign = None
                                for other_campaign in campaigns:
                                    if other_campaign['campaign_date'] == posted_date:
                                        # Check if the metric content matches
                                        caption_path = Path(BASE_DIR) / metric['path'].replace('metrics.json', 'caption.md')
                                        caption = read_text_safe(caption_path)
                                        if caption:
                                            # Simple check: does the other campaign's intent appear in caption?
                                            other_intent = other_campaign['inferred_intent'].lower()
                                            if other_intent[:30] in caption.lower():
                                                matching_campaign = other_campaign
                                                break
                                
                                if matching_campaign:
                                    misfiles.append({
                                        'metric_path': metric['path'],
                                        'current_campaign': campaign['path'],
                                        'current_campaign_name': campaign['folder_name'],
                                        'posted_date': posted_date,
                                        'days_diff': days_diff,
                                        'correct_campaign': matching_campaign['path'],
                                        'confidence': 'medium',
                                        'evidence': f"posted_at is {posted_date} (campaign is {campaign['campaign_date']}, {days_diff} days difference) and content matches other campaign"
                                    })
                                elif days_diff > 60:  # Only flag large mismatches without matching campaign
                                    misfiles.append({
                                        'metric_path': metric['path'],
                                        'current_campaign': campaign['path'],
                                        'current_campaign_name': campaign['folder_name'],
                                        'posted_date': posted_date,
                                        'days_diff': days_diff,
                                        'correct_campaign': None,
                                        'confidence': 'low',
                                        'evidence': f"posted_at is {posted_date} (campaign is {campaign['campaign_date']}, {days_diff} days difference) - may need separate campaign"
                                    })
                        except (ValueError, TypeError):
                            pass  # Invalid date format, skip
    
    return misfiles

def find_duplicate_assets(campaigns: List[Dict]) -> List[Dict]:
    """Find duplicate assets within campaigns."""
    duplicates = []
    
    for campaign in campaigns:
        # Check for duplicate transcripts
        transcripts = []
        content_dir = Path(BASE_DIR) / campaign['path'] / "content"
        if content_dir.exists():
            for transcript_file in content_dir.rglob("transcript*.md"):
                content = read_text_safe(transcript_file)
                if content:
                    # Simple hash: first 200 chars
                    content_hash = content[:200]
                    transcripts.append({
                        'path': str(transcript_file.relative_to(BASE_DIR)),
                        'hash': content_hash
                    })
        
        # Find duplicates by hash
        hash_counts = Counter(t['hash'] for t in transcripts)
        for hash_val, count in hash_counts.items():
            if count > 1:
                dup_files = [t for t in transcripts if t['hash'] == hash_val]
                duplicates.append({
                    'campaign': campaign['path'],
                    'type': 'transcript',
                    'files': dup_files,
                    'confidence': 'high'
                })
    
    return duplicates

def generate_rename_proposals(campaigns: List[Dict]) -> List[Dict]:
    """Generate rename proposals for generic filenames."""
    proposals = []
    
    for campaign in campaigns:
        for generic_file in campaign['generic_filenames']:
            file_path = Path(BASE_DIR) / generic_file['path']
            content = read_text_safe(file_path)
            
            # Try to infer better name from content or campaign
            new_name = None
            confidence = 'low'
            
            if content:
                # Look for alt text or description
                alt_match = re.search(r'alt[:\s]+["\']?([^"\'\n]+)["\']?', content, re.I)
                if alt_match:
                    alt_text = alt_match.group(1)
                    # Clean and create filename
                    clean_name = re.sub(r'[^\w\s-]', '', alt_text.lower())
                    clean_name = re.sub(r'\s+', '-', clean_name)
                    new_name = f"{clean_name}.md"
                    confidence = 'high'
            
            # Fallback: use campaign intent
            if not new_name:
                intent = campaign['inferred_intent'].lower()
                intent_clean = re.sub(r'[^\w\s-]', '', intent)
                intent_clean = re.sub(r'\s+', '-', intent_clean)
                new_name = f"{intent_clean}-image.md"
                confidence = 'medium'
            
            proposals.append({
                'current_path': generic_file['path'],
                'current_name': generic_file['current_name'],
                'proposed_name': new_name,
                'confidence': confidence,
                'campaign': campaign['path']
            })
    
    return proposals

def main():
    """Main audit function."""
    print("Starting campaign audit...")
    
    all_campaigns = []
    
    # Scan TITAN campaigns
    titan_dir = CAMPAIGNS_DIR / "TITAN"
    if titan_dir.exists():
        for campaign_folder in sorted(titan_dir.iterdir()):
            if campaign_folder.is_dir() and not campaign_folder.name.startswith('_'):
                print(f"Scanning {campaign_folder.name}...")
                campaign_data = scan_campaign(campaign_folder)
                campaign_data['product'] = 'TITAN'
                all_campaigns.append(campaign_data)
    
    # Scan TITANVERSE campaigns
    titanverse_dir = CAMPAIGNS_DIR / "TITANVERSE"
    if titanverse_dir.exists():
        for campaign_folder in sorted(titanverse_dir.iterdir()):
            if campaign_folder.is_dir() and not campaign_folder.name.startswith('_'):
                print(f"Scanning {campaign_folder.name}...")
                campaign_data = scan_campaign(campaign_folder)
                campaign_data['product'] = 'TITANVERSE'
                all_campaigns.append(campaign_data)
    
    print(f"\nScanned {len(all_campaigns)} campaigns")
    
    # Generate reports
    print("\nGenerating reports...")
    
    # 1. Campaign Inventory
    inventory = generate_inventory_report(all_campaigns)
    inventory_path = BASE_DIR / "AUDIT_CAMPAIGN_INVENTORY.md"
    with open(inventory_path, 'w', encoding='utf-8') as f:
        f.write(inventory)
    print(f"✓ Created {inventory_path}")
    
    # 2. Misfile Report
    misfiles = find_misfiled_metrics(all_campaigns)
    duplicates = find_duplicate_campaigns(all_campaigns)
    asset_duplicates = find_duplicate_assets(all_campaigns)
    misfile_report = generate_misfile_report(misfiles, duplicates, asset_duplicates, all_campaigns)
    misfile_path = BASE_DIR / "AUDIT_MISFILE_REPORT.md"
    with open(misfile_path, 'w', encoding='utf-8') as f:
        f.write(misfile_report)
    print(f"✓ Created {misfile_path}")
    
    # 3. Rename Manifest
    rename_proposals = generate_rename_proposals(all_campaigns)
    rename_report = generate_rename_report(rename_proposals)
    rename_path = BASE_DIR / "RENAME_MANIFEST_DRYRUN.md"
    with open(rename_path, 'w', encoding='utf-8') as f:
        f.write(rename_report)
    print(f"✓ Created {rename_path}")
    
    # 4. Context Notes Proposal
    context_proposal = generate_context_notes_proposal(misfiles, all_campaigns)
    context_path = BASE_DIR / "CONTEXT_NOTES_PROPOSAL.md"
    with open(context_path, 'w', encoding='utf-8') as f:
        f.write(context_proposal)
    print(f"✓ Created {context_path}")
    
    print("\nAudit complete!")

def generate_inventory_report(campaigns: List[Dict]) -> str:
    """Generate campaign inventory report."""
    lines = ["# Campaign Inventory Report", "", f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", "", f"**Total Campaigns:** {len(campaigns)}", ""]
    
    for campaign in sorted(campaigns, key=lambda x: x['path']):
        lines.append(f"## {campaign['path']}")
        lines.append("")
        lines.append(f"- **Intent:** {campaign['inferred_intent']}")
        lines.append(f"- **Date:** {campaign['campaign_date'] or 'Unknown'}")
        lines.append(f"- **Product:** {campaign.get('product', 'Unknown')}")
        lines.append(f"- **Meta JSON:** {'✓' if campaign['meta_exists'] else '✗'}")
        lines.append(f"- **README:** {'✓' if campaign['readme_exists'] else '✗'}")
        lines.append(f"- **Post-mortem:** {'✓' if campaign['post_mortem_exists'] else '✗'}")
        lines.append(f"- **Content Types:** {', '.join(campaign['content_types']) if campaign['content_types'] else 'None'}")
        lines.append(f"- **Platforms:** {', '.join(campaign['platforms']) if campaign['platforms'] else 'None'}")
        lines.append(f"- **Metrics Files:** {len(campaign['metrics'])}")
        if campaign['metrics']:
            for metric in campaign['metrics']:
                lines.append(f"  - {metric['platform']}: {metric['path']}")
        lines.append(f"- **Social Posts:** {len(campaign['social_posts'])}")
        if campaign['social_posts']:
            for post in campaign['social_posts']:
                lines.append(f"  - {post['platform']}: {post['folder']}")
        if campaign['anomalies']:
            lines.append(f"- **Anomalies:**")
            for anomaly in campaign['anomalies']:
                lines.append(f"  - [{anomaly['severity'].upper()}] {anomaly['type']}: {anomaly['message']}")
        if not campaign['meta_exists'] and not campaign['readme_exists']:
            lines.append(f"- **⚠️ NEEDS IDENTITY:** No metadata or README found")
        lines.append("")
    
    return "\n".join(lines)

def generate_misfile_report(misfiles: List[Dict], duplicates: List[Dict], asset_duplicates: List[Dict], campaigns: List[Dict]) -> str:
    """Generate misfile report."""
    lines = ["# Misfile Report", "", f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ""]
    
    # A) Misfiled Metrics
    lines.append("## A) Metrics Likely in Wrong Campaign")
    lines.append("")
    if misfiles:
        high_conf = [m for m in misfiles if m['confidence'] == 'high']
        med_conf = [m for m in misfiles if m['confidence'] == 'medium']
        low_conf = [m for m in misfiles if m['confidence'] == 'low']
        
        lines.append(f"**High Confidence:** {len(high_conf)}")
        lines.append(f"**Medium Confidence:** {len(med_conf)}")
        lines.append(f"**Low Confidence:** {len(low_conf)}")
        lines.append("")
        
        for misfile in sorted(misfiles, key=lambda x: (x['confidence'] == 'high', x['metric_path'])):
            lines.append(f"### {misfile['metric_path']}")
            lines.append(f"- **Current Campaign:** {misfile['current_campaign']}")
            lines.append(f"- **Confidence:** {misfile['confidence'].upper()}")
            lines.append(f"- **Evidence:** {misfile['evidence']}")
            if misfile.get('correct_campaign'):
                lines.append(f"- **Suggested Campaign:** {misfile['correct_campaign']}")
            else:
                lines.append(f"- **Suggested Campaign:** NEW CAMPAIGN (create: {misfile.get('metric_slug', 'unknown')})")
            lines.append("")
    else:
        lines.append("No misfiled metrics detected.")
        lines.append("")
    
    # B) Misfiled Assets
    lines.append("## B) Assets Likely in Wrong Campaign")
    lines.append("")
    lines.append("(To be expanded with content analysis)")
    lines.append("")
    
    # C) Duplicate Assets
    lines.append("## C) Duplicated Assets Within Campaigns")
    lines.append("")
    if asset_duplicates:
        for dup in asset_duplicates:
            lines.append(f"### {dup['campaign']}")
            lines.append(f"- **Type:** {dup['type']}")
            lines.append(f"- **Confidence:** {dup['confidence'].upper()}")
            lines.append(f"- **Files:**")
            for file_info in dup['files']:
                lines.append(f"  - {file_info['path']}")
            lines.append("")
    else:
        lines.append("No duplicate assets detected.")
        lines.append("")
    
    # D) Duplicate Campaigns
    lines.append("## D) Duplicate or Overlapping Campaigns")
    lines.append("")
    if duplicates:
        for dup_group in duplicates:
            lines.append(f"### Intent: {dup_group['intent']}")
            lines.append(f"- **Confidence:** {dup_group['confidence'].upper()}")
            lines.append(f"- **Reason:** {dup_group['reason']}")
            lines.append(f"- **Campaigns:**")
            for campaign in dup_group['campaigns']:
                lines.append(f"  - {campaign['path']} ({campaign['campaign_date']})")
            lines.append("")
    else:
        lines.append("No duplicate campaigns detected.")
        lines.append("")
    
    return "\n".join(lines)

def generate_rename_report(proposals: List[Dict]) -> str:
    """Generate rename manifest."""
    lines = ["# Rename Manifest (Dry Run)", "", f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", "", "**Note:** This is a dry run. No files have been renamed.", ""]
    
    high_conf = [p for p in proposals if p['confidence'] == 'high']
    med_conf = [p for p in proposals if p['confidence'] == 'medium']
    low_conf = [p for p in proposals if p['confidence'] == 'low']
    
    lines.append(f"**Total Generic Filenames:** {len(proposals)}")
    lines.append(f"- High Confidence: {len(high_conf)}")
    lines.append(f"- Medium Confidence: {len(med_conf)}")
    lines.append(f"- Low Confidence: {len(low_conf)}")
    lines.append("")
    
    for proposal in sorted(proposals, key=lambda x: (x['confidence'] == 'high', x['current_path'])):
        lines.append(f"## {proposal['current_path']}")
        lines.append(f"- **Current Name:** `{proposal['current_name']}`")
        lines.append(f"- **Proposed Name:** `{proposal['proposed_name']}`")
        lines.append(f"- **Confidence:** {proposal['confidence'].upper()}")
        lines.append(f"- **Campaign:** {proposal['campaign']}")
        lines.append("")
    
    return "\n".join(lines)

def generate_context_notes_proposal(misfiles: List[Dict], campaigns: List[Dict]) -> str:
    """Generate context notes proposals for high-confidence misfiles."""
    lines = ["# Context Notes Proposal", "", f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", "", "**Note:** These are proposed additions to `_context.md` files. Do not create/edit files yet.", ""]
    
    high_conf_misfiles = [m for m in misfiles if m['confidence'] == 'high']
    
    if not high_conf_misfiles:
        lines.append("No high-confidence misfiles requiring context notes.")
        return "\n".join(lines)
    
    # Group by campaign
    by_campaign = defaultdict(list)
    for misfile in high_conf_misfiles:
        by_campaign[misfile['current_campaign']].append(misfile)
    
    for campaign_path, misfile_list in sorted(by_campaign.items()):
        lines.append(f"## {campaign_path}/_context.md")
        lines.append("")
        lines.append("```markdown")
        lines.append("# Campaign Context Notes")
        lines.append("")
        lines.append("## Misfiled Assets/Metrics")
        lines.append("")
        for misfile in misfile_list:
            lines.append(f"### {misfile['metric_path']}")
            lines.append(f"- **Issue:** Metrics file appears to belong to a different campaign")
            lines.append(f"- **Evidence:** {misfile['evidence']}")
            if misfile.get('correct_campaign'):
                lines.append(f"- **Intended Campaign:** {misfile['correct_campaign']}")
            else:
                lines.append(f"- **Intended Campaign:** {misfile.get('metric_slug', 'Unknown')} (may need new campaign)")
            lines.append(f"- **Confidence:** {misfile['confidence'].upper()}")
            lines.append("")
        lines.append("```")
        lines.append("")
    
    return "\n".join(lines)

if __name__ == "__main__":
    main()







