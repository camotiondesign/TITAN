#!/usr/bin/env python3
"""
Analyze LinkedIn posts and categorize them into thematic pillars.
"""

import os
import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

def read_caption_file(file_path: Path) -> Dict:
    """Read a LinkedIn caption file and extract content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract metadata and body
        lines = content.split('\n')
        metadata = {}
        body_lines = []
        in_body = False
        
        for line in lines:
            if line.startswith('Post date:'):
                metadata['date'] = line.split(':', 1)[1].strip()
            elif line.startswith('Platform:'):
                metadata['platform'] = line.split(':', 1)[1].strip()
            elif line.startswith('Creative ID:'):
                metadata['creative_id'] = line.split(':', 1)[1].strip()
            elif line.strip() == '---':
                in_body = True
            elif in_body and line.strip():
                body_lines.append(line)
        
        body = '\n'.join(body_lines).strip()
        
        return {
            'path': str(file_path),
            'metadata': metadata,
            'body': body,
            'full_content': content
        }
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def find_all_linkedin_captions(root_dir: Path) -> List[Dict]:
    """Find all LinkedIn caption files."""
    captions = []
    for caption_file in root_dir.rglob('**/social/linkedin/**/caption.md'):
        caption_data = read_caption_file(caption_file)
        if caption_data:
            captions.append(caption_data)
    return captions

def categorize_post(post: Dict) -> Tuple[str, List[str]]:
    """Categorize a post into a pillar and sub-pillars."""
    body = post['body'].lower()
    path = post['path'].lower()
    
    # Initialize categories
    pillar = None
    sub_pillars = []
    
    # 1. PROOF & SOCIAL PROOF (Case studies, testimonials, reviews, metrics)
    if any(term in body or term in path for term in [
        'testimonial', 'case study', 'case-study', 'review', 'trustpilot',
        'saying', 'experience', 'results', 'achieved', 'transformed',
        'kieren', 'kanav', 'akbar', 'maleeha', 'andy', 'jagdeep', 'mustafa',
        'drayton', 'priory', 'puri', 'howletts', 'brighton', 'medichem',
        '1000th', 'milestone', 'numbers', 'metrics', 'sla', 'resolution rate'
    ]):
        pillar = 'PROOF & SOCIAL PROOF'
        if 'case study' in body or 'case-study' in path:
            sub_pillars.append('Case Studies')
        if 'testimonial' in body or 'testimonial' in path:
            sub_pillars.append('Customer Testimonials')
        if 'review' in body or 'trustpilot' in body:
            sub_pillars.append('Reviews & Ratings')
        if '1000th' in body or 'milestone' in body or 'sla' in body:
            sub_pillars.append('Company Milestones & Metrics')
        if not sub_pillars:
            sub_pillars.append('Social Proof')
    
    # 2. EDUCATION & TACTICAL GUIDANCE (How-to, tips, lists, practical advice)
    elif any(term in body or term in path for term in [
        'ways', 'how to', 'how are', 'tools', 'automation', 'tips',
        'guide', 'steps', 'checklist', 'here\'s what', 'here\'s how',
        '3 automation', '5 ways', 'chatgpt prompts', 'prompts'
    ]):
        pillar = 'EDUCATION & TACTICAL GUIDANCE'
        if 'ways' in body or 'tools' in body:
            sub_pillars.append('List-Based Education')
        if 'how to' in body or 'guide' in body:
            sub_pillars.append('How-To Guides')
        if 'automation' in body or 'tools' in body:
            sub_pillars.append('Tool Recommendations')
        if 'prompts' in body or 'chatgpt' in body:
            sub_pillars.append('Practical Prompts/Templates')
        if not sub_pillars:
            sub_pillars.append('Tactical Advice')
    
    # 3. LEADERSHIP & STRATEGIC WORLDVIEW (Industry vision, positioning, thought leadership)
    elif any(term in body or term in path for term in [
        'future', 'vision', 'strategy', 'nhs 10-year', 'nhs plan',
        'innovator', 'imitator', 'leadership', 'independent pharmacy',
        'pharmacy can\'t survive', 'rebuild pharmacy', 'future of pharmacy',
        'tariq', 'keynote', 'talk', 'stage', 'pharmacy show'
    ]):
        pillar = 'LEADERSHIP & STRATEGIC WORLDVIEW'
        if 'innovator' in body or 'imitator' in body:
            sub_pillars.append('Competitive Positioning')
        if 'nhs' in body and ('plan' in body or 'strategy' in body or '10-year' in body):
            sub_pillars.append('NHS Strategy Alignment')
        if 'future' in body or 'vision' in body:
            sub_pillars.append('Industry Vision')
        if 'tariq' in body or 'keynote' in body or 'pharmacy show' in body:
            sub_pillars.append('Leadership Speaking/Events')
        if not sub_pillars:
            sub_pillars.append('Strategic Thought Leadership')
    
    # 4. PROBLEM-SOLUTION POSITIONING (Pain points, problems, solutions)
    elif any(term in body or term in path for term in [
        'problem', 'struggling', 'broken', 'frustration', 'challenge',
        'legacy', 'outdated', 'slow', 'bottleneck', 'chaos', 'stress',
        'burnout', 'firefighting', 'furious', 'battery', 'meme',
        'isn\'t struggling', 'your pmr is', 'system\'s the problem'
    ]):
        pillar = 'PROBLEM-SOLUTION POSITIONING'
        if 'legacy' in body or 'outdated' in body:
            sub_pillars.append('Legacy System Critique')
        if 'struggling' in body or 'broken' in body:
            sub_pillars.append('Problem Identification')
        if 'meme' in path or 'furious' in body or 'battery' in body:
            sub_pillars.append('Relatable Pain Points (Humor)')
        if 'chaos' in body or 'stress' in body or 'burnout' in body:
            sub_pillars.append('Workflow Pain Points')
        if not sub_pillars:
            sub_pillars.append('Problem Framing')
    
    # 5. PRODUCT EXPLANATION & FEATURES (Product capabilities, features, benefits)
    elif any(term in body or term in path for term in [
        'titan ai', 'titan pmr', 'titanverse', 'features', 'capabilities',
        'built-in', 'automates', 'handles', 'checks', 'workflow',
        'clinical checks', 'ai checks', 'barcode', 'audit trail',
        'airlock', 'sandbox', 'mhra'
    ]):
        pillar = 'PRODUCT EXPLANATION & FEATURES'
        if 'ai' in body and ('checks' in body or 'clinical' in body):
            sub_pillars.append('AI Capabilities')
        if 'workflow' in body or 'automates' in body:
            sub_pillars.append('Workflow Features')
        if 'titanverse' in body:
            sub_pillars.append('Titanverse Platform')
        if 'airlock' in body or 'sandbox' in body or 'mhra' in body:
            sub_pillars.append('Regulatory/Compliance Features')
        if not sub_pillars:
            sub_pillars.append('Product Benefits')
    
    # 6. COMMUNITY & CULTURE (Team, events, celebrations, recognition)
    elif any(term in body or term in path for term in [
        'bbq', 'team', 'support', 'thank you', 'celebration', 'day',
        'pharmacy technician day', 'ask your pharmacist', 'christmas',
        'heroes', 'early adopters', 'conference', 'event', 'together',
        'crew', 'team titan'
    ]):
        pillar = 'COMMUNITY & CULTURE'
        if 'bbq' in body or 'team' in body or 'crew' in body:
            sub_pillars.append('Team Culture & Events')
        if 'thank you' in body or 'heroes' in body:
            sub_pillars.append('Recognition & Appreciation')
        if 'day' in body and ('pharmacy' in body or 'technician' in body):
            sub_pillars.append('Industry Celebrations')
        if 'early adopters' in body:
            sub_pillars.append('Community Building')
        if 'support' in body and ('team' in body or 'sla' in body):
            sub_pillars.append('Support Excellence')
        if not sub_pillars:
            sub_pillars.append('Community Engagement')
    
    # 7. REGULATORY & INDUSTRY UPDATES (News, regulations, changes)
    elif any(term in body or term in path for term in [
        'regulation', 'hub and spoke', 'oct 2025', 'law', 'notify',
        'icb', 'nhs', 'pharmacy first', 'eps', 'wales', 'rollout',
        'mounjaro', 'pricing', 'changes'
    ]):
        pillar = 'REGULATORY & INDUSTRY UPDATES'
        if 'hub and spoke' in body or 'regulation' in body:
            sub_pillars.append('Regulatory Changes')
        if 'nhs' in body and ('pharmacy first' in body or 'eps' in body):
            sub_pillars.append('NHS Service Updates')
        if 'rollout' in body or 'wales' in body:
            sub_pillars.append('Geographic Rollouts')
        if 'pricing' in body or 'mounjaro' in body:
            sub_pillars.append('Industry News')
        if not sub_pillars:
            sub_pillars.append('Industry Updates')
    
    # 8. ENGAGEMENT & CONVERSATION STARTERS (Polls, questions, discussions)
    elif any(term in body or term in path for term in [
        'poll', 'what\'s your', 'what do you think', 'drop it below',
        'share below', 'let\'s discuss', 'let\'s talk', 'curious',
        'question', 'how has', 'where does', 'what role'
    ]):
        pillar = 'ENGAGEMENT & CONVERSATION STARTERS'
        if 'poll' in body or 'poll' in path:
            sub_pillars.append('Polls')
        if 'drop it below' in body or 'share below' in body:
            sub_pillars.append('Open Questions')
        if 'let\'s discuss' in body or 'let\'s talk' in body:
            sub_pillars.append('Discussion Starters')
        if not sub_pillars:
            sub_pillars.append('Community Engagement Questions')
    
    # Default fallback
    if not pillar:
        # Check for narrative/storytelling elements
        if any(term in body for term in ['story', 'journey', 'transformation', 'met', 'spoke to']):
            pillar = 'STORYTELLING & NARRATIVE'
            sub_pillars.append('Narrative Content')
        else:
            pillar = 'OTHER'
            sub_pillars.append('Uncategorized')
    
    return pillar, sub_pillars

def analyze_posts(captions: List[Dict]) -> Dict:
    """Analyze all posts and create pillar structure."""
    pillar_data = defaultdict(lambda: {
        'count': 0,
        'percentage': 0,
        'sub_pillars': defaultdict(int),
        'examples': []
    })
    
    total_posts = len(captions)
    
    for post in captions:
        pillar, sub_pillars = categorize_post(post)
        pillar_data[pillar]['count'] += 1
        
        # Add sub-pillars
        for sub in sub_pillars:
            pillar_data[pillar]['sub_pillars'][sub] += 1
        
        # Add example (keep first 3-5 examples per pillar)
        if len(pillar_data[pillar]['examples']) < 5:
            creative_id = post['metadata'].get('creative_id', 'unknown')
            date = post['metadata'].get('date', 'unknown')
            preview = post['body'][:150].replace('\n', ' ') + '...'
            pillar_data[pillar]['examples'].append({
                'creative_id': creative_id,
                'date': date,
                'preview': preview
            })
    
    # Calculate percentages
    for pillar in pillar_data:
        pillar_data[pillar]['percentage'] = round(
            (pillar_data[pillar]['count'] / total_posts) * 100, 1
        )
    
    return dict(pillar_data), total_posts

def main():
    root_dir = Path('/Users/cameronmoorcroft/Documents/Repos/Clients/TITAN')
    print("Finding all LinkedIn captions...")
    captions = find_all_linkedin_captions(root_dir)
    print(f"Found {len(captions)} LinkedIn posts")
    
    print("Analyzing posts...")
    pillar_data, total_posts = analyze_posts(captions)
    
    # Save results
    output_file = root_dir / 'audit_results' / 'linkedin_pillar_analysis.json'
    output_file.parent.mkdir(exist_ok=True)
    
    with open(output_file, 'w') as f:
        json.dump({
            'total_posts': total_posts,
            'pillars': pillar_data
        }, f, indent=2)
    
    print(f"Analysis complete. Results saved to {output_file}")
    
    # Print summary
    print("\n=== PILLAR SUMMARY ===")
    for pillar, data in sorted(pillar_data.items(), key=lambda x: x[1]['count'], reverse=True):
        print(f"\n{pillar}: {data['count']} posts ({data['percentage']}%)")
        print(f"  Top sub-pillars: {dict(list(data['sub_pillars'].items())[:3])}")

if __name__ == '__main__':
    main()










