#!/usr/bin/env python3
"""
LinkedIn Content Comprehensive Audit Analysis Script
Executes all 10 phases of the audit plan with data-driven insights.
"""

import json
import re
import os
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Any
import statistics

# Base directory
BASE_DIR = Path(__file__).parent.parent

def load_tcps_scores() -> Dict[str, Dict]:
    """Load TCPS scores and create lookup by post path."""
    tcps_file = BASE_DIR / "tcps_scores.json"
    if not tcps_file.exists():
        return {}
    
    with open(tcps_file, 'r', encoding='utf-8') as f:
        scores = json.load(f)
    
    # Create lookup by normalized path
    lookup = {}
    for entry in scores:
        post_id = entry.get('post_id', '')
        # Normalize path: remove campaigns/ prefix if present
        normalized = post_id.replace('campaigns/', '')
        lookup[normalized] = entry
        # Also store by full path
        lookup[post_id] = entry
    
    return lookup

def load_metrics(post_path: Path) -> Dict:
    """Load metrics.json for a post if it exists."""
    metrics_file = post_path / "metrics.json"
    if metrics_file.exists():
        with open(metrics_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def is_titanverse_content(caption_text: str, file_path: Path) -> bool:
    """Check if content is primarily TITANVERSE-focused."""
    caption_lower = caption_text.lower()
    path_str = str(file_path).lower()
    
    # Check path for TITANVERSE
    if 'titanverse' in path_str and 'titan/' not in path_str:
        return True
    
    # Check caption for TITANVERSE focus
    titanverse_indicators = [
        'titanverse',
        'titan verse',
        'health hub',
        'dispensing to health hub'
    ]
    
    titan_indicators = [
        'titan pmr',
        'titanpmr',
        'pmr system',
        'pharmacy management'
    ]
    
    titanverse_count = sum(1 for indicator in titanverse_indicators if indicator in caption_lower)
    titan_count = sum(1 for indicator in titan_indicators if indicator in caption_lower)
    
    # If TITANVERSE mentioned more prominently than TITAN PMR, exclude
    if titanverse_count > 0 and titan_count == 0:
        return True
    
    # If TITANVERSE is the main subject
    if 'titanverse' in caption_lower and caption_lower.count('titanverse') > caption_lower.count('titan pmr'):
        return True
    
    return False

def collect_all_linkedin_posts() -> List[Dict]:
    """Collect all TITAN PMR LinkedIn caption files with metadata."""
    posts = []
    campaigns_dir = BASE_DIR / "campaigns" / "TITAN"
    
    if not campaigns_dir.exists():
        return posts
    
    # Find all caption.md files
    for caption_file in campaigns_dir.rglob("social/linkedin/**/caption.md"):
        try:
            with open(caption_file, 'r', encoding='utf-8') as f:
                caption_text = f.read()
            
            # Skip TITANVERSE content
            if is_titanverse_content(caption_text, caption_file):
                continue
            
            # Get metrics
            metrics = load_metrics(caption_file.parent)
            
            # Get TCPS score
            tcps_scores = load_tcps_scores()
            rel_path = str(caption_file.relative_to(BASE_DIR))
            tcps_data = tcps_scores.get(rel_path, {})
            
            # Extract post metadata
            post_dir = caption_file.parent
            post_name = post_dir.name
            
            posts.append({
                'path': str(caption_file),
                'rel_path': rel_path,
                'post_name': post_name,
                'caption': caption_text,
                'metrics': metrics,
                'tcps': tcps_data.get('tcps', 0),
                'engagement_score': tcps_data.get('engagement_score', 0),
                'comments': metrics.get('comments', 0) or tcps_data.get('breakdown', {}).get('comments', 0),
                'reposts': metrics.get('reposts', 0) or tcps_data.get('breakdown', {}).get('reposts', 0),
                'reactions': metrics.get('reactions', 0) or tcps_data.get('breakdown', {}).get('reactions', 0),
                'impressions': metrics.get('impressions', 0),
                'engagement_rate': metrics.get('engagement_rate', 0),
            })
        except Exception as e:
            print(f"Error reading {caption_file}: {e}")
            continue
    
    return posts

def extract_hook(caption: str) -> str:
    """Extract first line (hook) from caption."""
    lines = [line.strip() for line in caption.split('\n') if line.strip()]
    return lines[0] if lines else ""

def extract_sentence_openers(caption: str) -> List[str]:
    """Extract first 2-4 words of each sentence."""
    sentences = re.split(r'[.!?]+', caption)
    openers = []
    for sent in sentences:
        words = sent.strip().split()
        if len(words) >= 2:
            opener = ' '.join(words[:min(4, len(words))])
            openers.append(opener)
    return openers

def identify_narrative_frame(caption: str) -> str:
    """Identify narrative frame type."""
    caption_lower = caption.lower()
    
    # Problem-solution indicators
    if any(word in caption_lower for word in ['problem', 'issue', 'challenge', 'struggle', 'fails', 'broken']):
        if any(word in caption_lower for word in ['solution', 'fix', 'solve', 'improve', 'better']):
            return 'problem-solution'
    
    # Before-after indicators
    if any(word in caption_lower for word in ['before', 'after', 'used to', 'now', 'was', 'became']):
        return 'before-after'
    
    # Testimonial indicators
    if any(word in caption_lower for word in ['says', 'told', 'shared', 'testimonial', 'review', 'experience']):
        return 'testimonial'
    
    # List indicators
    if re.search(r'^\d+[\.\)]', caption, re.MULTILINE) or '•' in caption or '-' in caption[:200]:
        return 'list'
    
    # Announcement indicators
    if any(word in caption_lower for word in ['announcing', 'launch', 'introducing', 'proud', 'excited']):
        return 'announcement'
    
    # Question hook
    if caption.strip().startswith(('?', 'What', 'Why', 'How', 'When', 'Where', 'Who', 'Can', 'Do', 'Are', 'Is')):
        return 'question'
    
    return 'other'

def extract_metaphors(caption: str) -> List[str]:
    """Extract common metaphors and buzzwords."""
    metaphors = [
        'game-changer', 'game changer', 'transform', 'transformation', 'revolutionary',
        'revolution', 'future', 'next-gen', 'next generation', 'breakthrough',
        'broken', 'fix', 'journey', 'path', 'roadmap', 'vision', 'mission',
        'disrupt', 'disruption', 'innovate', 'innovation', 'cutting-edge',
        'cutting edge', 'state-of-the-art', 'state of the art', 'pioneer',
        'leading', 'industry-leading', 'world-class', 'world class'
    ]
    
    found = []
    caption_lower = caption.lower()
    for metaphor in metaphors:
        if metaphor in caption_lower:
            found.append(metaphor)
    
    return found

def identify_emotional_arc(caption: str) -> str:
    """Identify emotional arc type."""
    caption_lower = caption.lower()
    
    negative_words = ['problem', 'issue', 'challenge', 'struggle', 'fail', 'broken', 'wrong', 'risk', 'danger', 'crisis']
    positive_words = ['success', 'win', 'achieve', 'improve', 'better', 'great', 'excellent', 'proud', 'excited', 'happy']
    
    has_negative = any(word in caption_lower for word in negative_words)
    has_positive = any(word in caption_lower for word in positive_words)
    
    if has_negative and has_positive:
        return 'negative-to-positive'
    elif has_positive:
        return 'positive'
    elif has_negative:
        return 'negative'
    else:
        return 'neutral'

def calculate_performance_score(post: Dict) -> float:
    """Calculate composite performance score."""
    tcps = post.get('tcps', 0)
    engagement_score = post.get('engagement_score', 0)
    comments = post.get('comments', 0)
    reposts = post.get('reposts', 0)
    reactions = post.get('reactions', 0)
    engagement_rate = post.get('engagement_rate', 0)
    
    # Normalize and weight
    score = 0
    if tcps > 0:
        score += tcps * 0.4
    if engagement_score > 0:
        score += engagement_score * 0.3
    if comments > 0:
        score += comments * 0.1
    if reposts > 0:
        score += reposts * 0.1
    if reactions > 0:
        score += reactions * 0.05
    if engagement_rate > 0:
        score += engagement_rate * 0.05
    
    return score

def analyze_patterns(posts: List[Dict]) -> Dict:
    """Phase 1: Pattern Analysis."""
    hooks = []
    frames = []
    metaphors_all = []
    emotional_arcs = []
    sentence_openers = []
    
    for post in posts:
        caption = post['caption']
        hooks.append(extract_hook(caption))
        frames.append(identify_narrative_frame(caption))
        metaphors_all.extend(extract_metaphors(caption))
        emotional_arcs.append(identify_emotional_arc(caption))
        sentence_openers.extend(extract_sentence_openers(caption))
    
    return {
        'hooks': Counter(hooks),
        'frames': Counter(frames),
        'metaphors': Counter(metaphors_all),
        'emotional_arcs': Counter(emotional_arcs),
        'sentence_openers': Counter(sentence_openers),
        'total_posts': len(posts)
    }

def main():
    """Main execution function."""
    print("Collecting LinkedIn posts...")
    posts = collect_all_linkedin_posts()
    print(f"Found {len(posts)} TITAN PMR LinkedIn posts")
    
    # Calculate performance scores
    for post in posts:
        post['performance_score'] = calculate_performance_score(post)
    
    # Sort by performance
    posts_sorted = sorted(posts, key=lambda x: x['performance_score'], reverse=True)
    
    print("\nRunning Phase 1: Pattern Analysis...")
    patterns = analyze_patterns(posts)
    
    # Save intermediate results
    results_dir = BASE_DIR / "audit_results"
    results_dir.mkdir(exist_ok=True)
    
    # Save pattern analysis
    with open(results_dir / "phase1_patterns.json", 'w', encoding='utf-8') as f:
        json.dump({
            'hooks': dict(patterns['hooks'].most_common(50)),
            'frames': dict(patterns['frames']),
            'metaphors': dict(patterns['metaphors'].most_common(30)),
            'emotional_arcs': dict(patterns['emotional_arcs']),
            'sentence_openers': dict(patterns['sentence_openers'].most_common(50)),
        }, f, indent=2)
    
    # Save top posts for analysis
    with open(results_dir / "top_posts.json", 'w', encoding='utf-8') as f:
        json.dump(posts_sorted[:20], f, indent=2, default=str)
    
    print(f"\nAnalysis complete. Results saved to {results_dir}/")
    print(f"Top 5 posts by performance:")
    for i, post in enumerate(posts_sorted[:5], 1):
        print(f"{i}. {post['post_name']} - Score: {post['performance_score']:.1f}")

if __name__ == "__main__":
    main()










