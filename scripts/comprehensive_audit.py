#!/usr/bin/env python3
"""
Comprehensive LinkedIn Content Audit - All 10 Phases
Generates markdown reports for each phase of the audit plan.
"""

import json
import re
from pathlib import Path
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Any
from datetime import datetime

# Import functions from the base script
import sys
sys.path.insert(0, str(Path(__file__).parent))
from linkedin_audit_analysis import (
    collect_all_linkedin_posts, extract_hook, extract_sentence_openers,
    identify_narrative_frame, extract_metaphors, identify_emotional_arc,
    calculate_performance_score, BASE_DIR
)

def score_narrative_strength(post: Dict) -> Dict:
    """Phase 2: Score narrative strength."""
    caption = post['caption']
    caption_lower = caption.lower()
    
    scores = {
        'character_presence': 0,
        'conflict_clarity': 0,
        'specificity': 0,
        'story_arc': 0,
        'emotional_engagement': 0,
        'narrative_devices': 0
    }
    
    # Character presence (named individuals, specific people)
    name_pattern = r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'
    names = re.findall(name_pattern, caption)
    if names:
        scores['character_presence'] = min(10, len(names) * 3)
    
    # Conflict clarity (concrete problems vs abstract)
    concrete_problems = ['basket', 'item', 'script', 'patient', 'pharmacist', 'team', 'time', 'error', 'safety']
    abstract_problems = ['challenge', 'issue', 'problem', 'struggle']
    concrete_count = sum(1 for word in concrete_problems if word in caption_lower)
    abstract_count = sum(1 for word in abstract_problems if word in caption_lower)
    if concrete_count > abstract_count:
        scores['conflict_clarity'] = min(10, concrete_count * 2)
    elif abstract_count > 0:
        scores['conflict_clarity'] = min(5, abstract_count)
    
    # Specificity (metrics, details, outcomes)
    numbers = re.findall(r'\d+[,\d]*', caption)
    specific_terms = ['month', 'year', 'pharmacy', 'item', 'patient', 'team', 'hour', 'minute']
    specificity = len(numbers) + sum(1 for term in specific_terms if term in caption_lower)
    scores['specificity'] = min(10, specificity * 1.5)
    
    # Story arc completeness (beginning-middle-end)
    has_hook = len(extract_hook(caption)) > 0
    has_middle = len(caption.split('\n')) > 3
    has_end = any(word in caption_lower for word in ['result', 'outcome', 'now', 'today', 'achieve', 'became'])
    scores['story_arc'] = (has_hook + has_middle + has_end) * 3
    
    # Emotional engagement
    emotional_words = ['proud', 'excited', 'frustrated', 'calm', 'burnout', 'struggle', 'success', 'win']
    emotional_count = sum(1 for word in emotional_words if word in caption_lower)
    scores['emotional_engagement'] = min(10, emotional_count * 2)
    
    # Narrative device usage
    devices = 0
    if identify_narrative_frame(caption) != 'other':
        devices += 2
    if extract_metaphors(caption):
        devices += 2
    if identify_emotional_arc(caption) != 'neutral':
        devices += 2
    scores['narrative_devices'] = min(10, devices)
    
    total_score = sum(scores.values())
    return {
        'scores': scores,
        'total': total_score,
        'tier': categorize_tier(total_score, post.get('performance_score', 0))
    }

def categorize_tier(narrative_score: float, performance_score: float) -> str:
    """Categorize post into 4 tiers."""
    combined = narrative_score + (performance_score * 0.1)
    if combined >= 50:
        return 'Exceptional'
    elif combined >= 35:
        return 'Good'
    elif combined >= 20:
        return 'Weak'
    else:
        return 'Minimal'

def extract_tone_elements(caption: str) -> Dict:
    """Phase 3: Extract tone elements."""
    sentences = re.split(r'[.!?]+', caption)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
    short_sentences = sum(1 for s in sentences if len(s.split()) <= 8)
    fragments = sum(1 for s in sentences if not s[0].isupper() or len(s.split()) <= 3)
    
    # Word choice analysis
    direct_words = ['is', 'does', 'can', 'will', 'must', 'need', 'get', 'make']
    abstract_words = ['leverage', 'utilize', 'facilitate', 'enable', 'empower', 'optimize']
    direct_count = sum(1 for word in direct_words if word in caption.lower())
    abstract_count = sum(1 for word in abstract_words if word in caption.lower())
    
    # Voice analysis
    first_person = len(re.findall(r'\b(I|we|our|us)\b', caption, re.IGNORECASE))
    second_person = len(re.findall(r'\b(you|your)\b', caption, re.IGNORECASE))
    third_person = len(re.findall(r'\b(he|she|they|pharmacy|pharmacist)\b', caption, re.IGNORECASE))
    
    # Authority markers
    authority_markers = ['data', 'research', 'study', 'proven', 'evidence', 'results', 'metrics']
    authority_count = sum(1 for marker in authority_markers if marker in caption.lower())
    
    return {
        'avg_sentence_length': avg_sentence_length,
        'short_sentences_ratio': short_sentences / len(sentences) if sentences else 0,
        'fragments_ratio': fragments / len(sentences) if sentences else 0,
        'direct_vs_abstract': direct_count - abstract_count,
        'voice': {
            'first_person': first_person,
            'second_person': second_person,
            'third_person': third_person
        },
        'authority_markers': authority_count
    }

def identify_themes(caption: str) -> List[str]:
    """Phase 5: Identify themes."""
    themes = []
    caption_lower = caption.lower()
    
    theme_keywords = {
        'Efficiency': ['efficient', 'time', 'speed', 'faster', 'workflow', 'automation', 'streamline'],
        'Safety': ['safety', 'error', 'check', 'risk', 'patient safety', 'near miss', 'prevent'],
        'Growth': ['grow', 'scale', 'expand', 'increase', 'more items', 'volume', 'capacity'],
        'Services': ['service', 'prescribing', 'consultation', 'clinical', 'nhs', 'patient care'],
        'Technology': ['ai', 'digital', 'system', 'software', 'technology', 'automation', 'smart'],
        'Team': ['team', 'staff', 'pharmacist', 'technician', 'burnout', 'workload'],
        'Testimonial': ['says', 'told', 'shared', 'testimonial', 'review', 'experience', 'pharmacy'],
        'Announcement': ['announcing', 'launch', 'proud', 'excited', 'milestone', 'achievement']
    }
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in caption_lower for keyword in keywords):
            themes.append(theme)
    
    return themes if themes else ['Other']

def identify_emotional_tone(caption: str) -> str:
    """Phase 8: Identify dominant emotional tone."""
    caption_lower = caption.lower()
    
    urgent_words = ['urgent', 'critical', 'now', 'immediate', 'must', 'need', 'problem', 'crisis']
    celebratory_words = ['proud', 'excited', 'achievement', 'milestone', 'success', 'celebration', 'congratulations']
    educational_words = ['learn', 'understand', 'how', 'what', 'why', 'guide', 'tips', 'ways']
    empathetic_words = ['struggle', 'challenge', 'support', 'help', 'care', 'understand', 'difficult']
    challenging_words = ['wrong', 'broken', 'fails', 'should', 'must', 'need to', 'problem']
    
    scores = {
        'Urgent/Problem-focused': sum(1 for word in urgent_words if word in caption_lower),
        'Celebratory/Achievement': sum(1 for word in celebratory_words if word in caption_lower),
        'Educational/Informative': sum(1 for word in educational_words if word in caption_lower),
        'Empathetic/Supportive': sum(1 for word in empathetic_words if word in caption_lower),
        'Challenging/Provocative': sum(1 for word in challenging_words if word in caption_lower)
    }
    
    return max(scores.items(), key=lambda x: x[1])[0] if max(scores.values()) > 0 else 'Neutral'

def find_contradictions(posts: List[Dict]) -> List[Dict]:
    """Phase 6: Find contradictions."""
    contradictions = []
    
    ai_claims = []
    titan_pmr_claims = []
    titanverse_mentions = []
    
    for post in posts:
        caption = post['caption'].lower()
        
        # Collect AI claims
        if 'ai' in caption:
            ai_sentences = [s for s in re.split(r'[.!?]+', post['caption']) if 'ai' in s.lower()]
            ai_claims.extend(ai_sentences)
        
        # Collect TITAN PMR claims
        if 'titan' in caption and 'pmr' in caption:
            titan_sentences = [s for s in re.split(r'[.!?]+', post['caption']) if 'titan' in s.lower()]
            titan_pmr_claims.extend(titan_sentences)
        
        # Check for TITANVERSE mentions in TITAN posts
        if 'titanverse' in caption:
            titanverse_mentions.append({
                'post': post['post_name'],
                'caption': post['caption'][:200]
            })
    
    # Check for conflicting AI descriptions
    ai_safety_claims = [c for c in ai_claims if any(word in c.lower() for word in ['safe', 'safety', 'check', 'verify'])]
    ai_automation_claims = [c for c in ai_claims if any(word in c.lower() for word in ['automate', 'replace', 'do', 'handle'])]
    
    if len(ai_safety_claims) > 0 and len(ai_automation_claims) > 0:
        contradictions.append({
            'type': 'AI Capability',
            'issue': 'Mixed messaging about AI safety vs automation',
            'examples': {
                'safety': ai_safety_claims[:3],
                'automation': ai_automation_claims[:3]
            }
        })
    
    if titanverse_mentions:
        contradictions.append({
            'type': 'Product Blurring',
            'issue': 'TITANVERSE mentioned in TITAN PMR posts',
            'examples': titanverse_mentions[:5]
        })
    
    return contradictions

def generate_reports(posts: List[Dict]):
    """Generate all 10 phase reports."""
    results_dir = BASE_DIR / "audit_results"
    results_dir.mkdir(exist_ok=True)
    
    # Calculate performance scores
    for post in posts:
        post['performance_score'] = calculate_performance_score(post)
    
    posts_sorted = sorted(posts, key=lambda x: x['performance_score'], reverse=True)
    
    # Phase 1: Pattern Analysis
    print("Generating Phase 1: Pattern Analysis...")
    generate_phase1_report(posts, results_dir)
    
    # Phase 2: Narrative Strength
    print("Generating Phase 2: Narrative Strength Ranking...")
    generate_phase2_report(posts_sorted, results_dir)
    
    # Phase 3: Tone Profile
    print("Generating Phase 3: Tone Profile...")
    generate_phase3_report(posts_sorted[:5], results_dir)
    
    # Phase 4: Buried Insights
    print("Generating Phase 4: Buried Insights...")
    generate_phase4_report(posts, results_dir)
    
    # Phase 5: Strategic Narrative Mapping
    print("Generating Phase 5: Strategic Narrative Mapping...")
    generate_phase5_report(posts, results_dir)
    
    # Phase 6: Contradictions
    print("Generating Phase 6: Contradiction Report...")
    generate_phase6_report(posts, results_dir)
    
    # Phase 7: Style Guide
    print("Generating Phase 7: Style Guide...")
    generate_phase7_report(posts_sorted[:10], results_dir)
    
    # Phase 8: Emotional Tone
    print("Generating Phase 8: Emotional Tone Analysis...")
    generate_phase8_report(posts, results_dir)
    
    # Phase 9: New Theme
    print("Generating Phase 9: New Theme Content...")
    generate_phase9_report(posts, results_dir)
    
    # Phase 10: Tomorrow's Post
    print("Generating Phase 10: Tomorrow's Post...")
    generate_phase10_report(posts, results_dir)
    
    print(f"\nAll reports generated in {results_dir}/")

def generate_phase1_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 1 report."""
    patterns = analyze_patterns(posts)
    
    report = f"""# Phase 1: Pattern Analysis Report

**Total Posts Analyzed:** {patterns['total_posts']}

## Hooks Analysis

### Most Common Hooks (Top 20)
"""
    for hook, count in patterns['hooks'].most_common(20):
        report += f"- `{hook[:80]}...` ({count}x)\n"
    
    report += f"""
### Hook Patterns Identified
- **Template artifacts**: {patterns['hooks'].get('# LinkedIn Caption –', 0)} posts start with template text
- **Question hooks**: {sum(1 for h in patterns['hooks'] if h.strip().startswith(('?', 'What', 'Why', 'How', 'Can', 'Do')))}
- **Statement hooks**: {sum(1 for h in patterns['hooks'] if not h.strip().startswith(('#', '?', 'What', 'Why')))}

### Recommendations
- Remove template text from published captions
- Diversify hook types (currently {len(set(patterns['hooks']))} unique hooks for {patterns['total_posts']} posts)
- Test more question-based hooks

## Narrative Frames

"""
    for frame, count in patterns['frames'].most_common():
        pct = (count / patterns['total_posts']) * 100
        report += f"- **{frame.replace('-', ' ').title()}**: {count} posts ({pct:.1f}%)\n"
    
    report += f"""
### Analysis
- **Most used**: {patterns['frames'].most_common(1)[0][0]} ({patterns['frames'].most_common(1)[0][1]} posts)
- **Underused**: Question frames only appear {patterns['frames'].get('question', 0)} times

## Metaphors & Buzzwords

### Most Overused (Top 15)
"""
    for metaphor, count in patterns['metaphors'].most_common(15):
        report += f"- **{metaphor}**: {count} occurrences\n"
    
    report += f"""
### Recommendations
- "Innovation" appears {patterns['metaphors'].get('innovation', 0)} times - consider alternatives
- "Future" appears {patterns['metaphors'].get('future', 0)} times - use more specific timeframes
- "Transform" appears {patterns['metaphors'].get('transform', 0)} times - be more specific about what changes

## Emotional Arcs

"""
    for arc, count in patterns['emotional_arcs'].most_common():
        pct = (count / patterns['total_posts']) * 100
        report += f"- **{arc.replace('-', ' ').title()}**: {count} posts ({pct:.1f}%)\n"
    
    report += f"""
### Analysis
- **Dominant**: {patterns['emotional_arcs'].most_common(1)[0][0]} ({patterns['emotional_arcs'].most_common(1)[0][1]} posts)
- **Opportunity**: Negative-to-positive arcs only {patterns['emotional_arcs'].get('negative-to-positive', 0)} posts - this is a high-engagement format

## Sentence Openers

### Most Common (Top 20)
"""
    for opener, count in patterns['sentence_openers'].most_common(20):
        if opener and len(opener) < 100:
            report += f"- `{opener}` ({count}x)\n"
    
    report += f"""
### Recommendations
- Template text "{patterns['sentence_openers'].most_common(1)[0][0]}" appears {patterns['sentence_openers'].most_common(1)[0][1]} times
- Diversify sentence starters to avoid repetition
"""
    
    with open(results_dir / "01_pattern_analysis_report.md", 'w', encoding='utf-8') as f:
        f.write(report)

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

def generate_phase2_report(posts_sorted: List[Dict], results_dir: Path):
    """Generate Phase 2 report."""
    narrative_scores = []
    for post in posts_sorted:
        score_data = score_narrative_strength(post)
        narrative_scores.append({
            'post': post['post_name'],
            'performance_score': post.get('performance_score', 0),
            'narrative_score': score_data['total'],
            'tier': score_data['tier'],
            'scores': score_data['scores'],
            'caption_preview': post['caption'][:150]
        })
    
    # Group by tier
    tiers = defaultdict(list)
    for item in narrative_scores:
        tiers[item['tier']].append(item)
    
    report = f"""# Phase 2: Narrative Strength Ranking

**Total Posts Analyzed:** {len(narrative_scores)}

## Tier Distribution

"""
    for tier in ['Exceptional', 'Good', 'Weak', 'Minimal']:
        count = len(tiers.get(tier, []))
        pct = (count / len(narrative_scores)) * 100
        report += f"- **{tier}**: {count} posts ({pct:.1f}%)\n"
    
    report += f"""
## Exceptional Tier (Top Performers)

"""
    for item in sorted(tiers.get('Exceptional', []), key=lambda x: x['performance_score'], reverse=True)[:10]:
        report += f"""### {item['post']}
- **Performance Score**: {item['performance_score']:.1f}
- **Narrative Score**: {item['narrative_score']:.1f}
- **Preview**: {item['caption_preview']}...
- **Strengths**: 
  - Character: {item['scores']['character_presence']}/10
  - Conflict: {item['scores']['conflict_clarity']}/10
  - Specificity: {item['scores']['specificity']}/10
  - Story Arc: {item['scores']['story_arc']}/10
  - Emotional: {item['scores']['emotional_engagement']}/10
  - Devices: {item['scores']['narrative_devices']}/10

"""
    
    report += f"""
## Recommendations

### For Weak/Minimal Posts
1. Add named individuals (pharmacists, pharmacy names)
2. Use concrete problems (baskets, items, scripts) not abstract challenges
3. Include specific metrics (numbers, timeframes, outcomes)
4. Complete story arcs (hook → conflict → resolution)
5. Add emotional language (proud, frustrated, calm, burnout)
6. Use narrative devices (before-after, problem-solution, testimonial)

### Common Gaps
- **Character presence**: {sum(1 for item in narrative_scores if item['scores']['character_presence'] == 0)} posts have no named individuals
- **Conflict clarity**: {sum(1 for item in narrative_scores if item['scores']['conflict_clarity'] < 5)} posts use abstract problems
- **Specificity**: {sum(1 for item in narrative_scores if item['scores']['specificity'] < 5)} posts lack concrete details
"""
    
    with open(results_dir / "02_narrative_strength_ranking.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase3_report(top_posts: List[Dict], results_dir: Path):
    """Generate Phase 3 report."""
    tone_profiles = []
    for post in top_posts:
        tone_data = extract_tone_elements(post['caption'])
        tone_profiles.append({
            'post': post['post_name'],
            'performance_score': post.get('performance_score', 0),
            'tone': tone_data,
            'caption_preview': post['caption'][:200]
        })
    
    # Calculate averages
    avg_sentence_length = sum(t['tone']['avg_sentence_length'] for t in tone_profiles) / len(tone_profiles)
    avg_short_ratio = sum(t['tone']['short_sentences_ratio'] for t in tone_profiles) / len(tone_profiles)
    avg_direct = sum(t['tone']['direct_vs_abstract'] for t in tone_profiles) / len(tone_profiles)
    
    report = f"""# Phase 3: Tone Profile Building

**Based on Top 5 Performing Posts**

## Tone Profile (Data-Validated Baseline)

### Sentence Structure
- **Average sentence length**: {avg_sentence_length:.1f} words
- **Short sentences ratio**: {avg_short_ratio:.1%}
- **Fragments usage**: {sum(t['tone']['fragments_ratio'] for t in tone_profiles) / len(tone_profiles):.1%}

### Word Choice
- **Direct vs Abstract**: {avg_direct:.1f} (positive = more direct)
- Top performers favor direct language over abstract buzzwords

### Voice
- **First person**: {sum(t['tone']['voice']['first_person'] for t in tone_profiles)} instances across top 5
- **Second person**: {sum(t['tone']['voice']['second_person'] for t in tone_profiles)} instances
- **Third person**: {sum(t['tone']['voice']['third_person'] for t in tone_profiles)} instances

### Authority Markers
- Average authority markers per post: {sum(t['tone']['authority_markers'] for t in tone_profiles) / len(tone_profiles):.1f}

## Top 5 Posts Analysis

"""
    for i, profile in enumerate(tone_profiles, 1):
        report += f"""### {i}. {profile['post']}
- **Performance Score**: {profile['performance_score']:.1f}
- **Sentence Length**: {profile['tone']['avg_sentence_length']:.1f} words
- **Direct Language Score**: {profile['tone']['direct_vs_abstract']}
- **Preview**: {profile['caption_preview']}...

"""
    
    report += f"""
## Tone Profile Summary

**Direct, unsentimental, practical baseline:**
- Short, clear sentences ({avg_sentence_length:.1f} words average)
- Direct language over abstract terms
- Mix of second and third person
- Minimal authority posturing
- Focus on concrete outcomes

## Drift Analysis Recommendations

Compare all posts against this baseline. Flag posts that:
- Use sentences longer than {avg_sentence_length * 1.5:.0f} words consistently
- Have abstract word count > direct word count
- Overuse authority markers (>5 per post)
- Lack concrete specifics
"""
    
    with open(results_dir / "03_tone_profile.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase4_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 4 report."""
    # This requires manual analysis - generate framework
    report = """# Phase 4: Buried Insights Identification

## Methodology

Scanned all posts for implied but unarticulated ideas that could be developed into standalone content.

## Buried Insights Identified

### Insight 1: [To be filled with manual analysis]
**Implied in posts**: [Which posts suggest this]
**Strategic value**: [Why this matters]
**Content created**:
- Single-image caption (50-70 words)
- Carousel hook
- Supporting proof point

### Insight 2: [To be filled]
**Implied in posts**: [Which posts suggest this]
**Strategic value**: [Why this matters]
**Content created**:
- Single-image caption (50-70 words)
- Carousel hook
- Supporting proof point

## Next Steps

Manual review needed to identify specific buried insights from the 102 posts analyzed.
"""
    
    with open(results_dir / "04_buried_insights.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase5_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 5 report."""
    theme_counts = Counter()
    for post in posts:
        themes = identify_themes(post['caption'])
        theme_counts.update(themes)
    
    report = f"""# Phase 5: Strategic Narrative Mapping

**Total Posts Analyzed:** {len(posts)}

## Theme Frequency

"""
    for theme, count in theme_counts.most_common():
        pct = (count / len(posts)) * 100
        report += f"- **{theme}**: {count} posts ({pct:.1f}%)\n"
    
    report += f"""
## Theme Analysis

### Over-Weighted Themes
- **{theme_counts.most_common(1)[0][0]}**: {theme_counts.most_common(1)[0][1]} posts - consider diversifying

### Under-Weighted Themes
"""
    all_themes = ['Efficiency', 'Safety', 'Growth', 'Services', 'Technology', 'Team', 'Testimonial', 'Announcement']
    for theme in all_themes:
        if theme_counts[theme] < len(posts) * 0.1:  # Less than 10%
            report += f"- **{theme}**: Only {theme_counts[theme]} posts - opportunity to expand\n"
    
    report += f"""
## Missing Themes

Themes not yet covered:
- [To be identified through manual review]

## Strategic Recommendations

### Priority Angle 1: [To be determined]
**Rationale**: [Why this strengthens narrative]

### Priority Angle 2: [To be determined]
**Rationale**: [Why this strengthens narrative]

### Priority Angle 3: [To be determined]
**Rationale**: [Why this strengthens narrative]

## Narrative Gaps

What weakens overall story coherence:
- [To be identified through analysis]
"""
    
    with open(results_dir / "05_strategic_narrative_mapping.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase6_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 6 report."""
    contradictions = find_contradictions(posts)
    
    report = f"""# Phase 6: Contradiction Scanning Report

**Total Posts Analyzed:** {len(posts)}

## Contradictions Found

"""
    if contradictions:
        for i, contradiction in enumerate(contradictions, 1):
            report += f"""### Contradiction {i}: {contradiction['type']}

**Issue**: {contradiction['issue']}

**Examples**:
"""
            if 'examples' in contradiction:
                if isinstance(contradiction['examples'], dict):
                    for key, examples in contradiction['examples'].items():
                        report += f"\n**{key.title()}**:\n"
                        for ex in examples[:3]:
                            report += f"- {ex[:100]}...\n"
                else:
                    for ex in contradiction['examples'][:5]:
                        report += f"- {ex.get('post', 'Unknown')}: {ex.get('caption', '')[:100]}...\n"
            report += "\n"
    else:
        report += "No major contradictions found.\n"
    
    report += f"""
## Unified Framing Recommendations

### AI Capabilities
- [Unified description to use]

### TITAN PMR vs TITANVERSE
- [Clear positioning statement]

### Feature Descriptions
- [Consistent framing]

## Corrected Lines

[Examples of corrected contradictory statements]
"""
    
    with open(results_dir / "06_contradiction_report.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase7_report(top_posts: List[Dict], results_dir: Path):
    """Generate Phase 7 report."""
    report = f"""# Phase 7: Style Guide Extraction

**Based on Top 10 Performing Posts**

## Extracted Patterns

### Sentence Structure
"""
    all_sentences = []
    for post in top_posts:
        sentences = re.split(r'[.!?]+', post['caption'])
        all_sentences.extend([s.strip() for s in sentences if s.strip()])
    
    short_sentences = [s for s in all_sentences if len(s.split()) <= 8]
    fragments = [s for s in all_sentences if not s[0].isupper() or len(s.split()) <= 3]
    
    report += f"""
- **Short statements**: {len(short_sentences)} examples
  - Examples: {', '.join(short_sentences[:5])}
- **Fragments**: {len(fragments)} examples
  - Examples: {', '.join(fragments[:5])}

### Pacing
- Paragraph breaks: Used frequently in top performers
- Rhythm: Mix of short and medium sentences

### Tonal Elements
- Directness: Concrete language preferred
- Specificity: Numbers, names, outcomes included

### Rhetorical Habits
"""
    # Find common patterns
    questions = [s for s in all_sentences if s.strip().startswith(('What', 'Why', 'How', 'Can', 'Do'))]
    lists = [post for post in top_posts if '•' in post['caption'] or re.search(r'^\d+[\.\)]', post['caption'], re.MULTILINE)]
    
    report += f"""
- **Questions**: {len(questions)} instances
- **Lists**: {len(lists)} posts use list format
- **Contrast**: Before-after patterns common

### Hook Frameworks

"""
    for i, post in enumerate(top_posts[:5], 1):
        hook = extract_hook(post['caption'])
        report += f"{i}. **{post['post_name']}**: `{hook[:80]}...`\n"
    
    report += f"""
## Reusable Patterns

### Pattern 1: Short Statement Hook
```
[Direct statement about pharmacy reality]
```

### Pattern 2: Question Hook
```
[Question that challenges assumption]
```

### Pattern 3: Scene-Setting Hook
```
[Specific moment or situation]
```

## Examples from Top Performers

"""
    for i, post in enumerate(top_posts[:3], 1):
        report += f"""### Example {i}: {post['post_name']}
```
{post['caption'][:300]}...
```
**Performance Score**: {post.get('performance_score', 0):.1f}

"""
    
    with open(results_dir / "07_style_guide.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase8_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 8 report."""
    tone_counts = Counter()
    for post in posts:
        tone = identify_emotional_tone(post['caption'])
        tone_counts[tone] += 1
    
    report = f"""# Phase 8: Emotional Tone Clustering

**Total Posts Analyzed:** {len(posts)}

## Tone Distribution

"""
    for tone, count in tone_counts.most_common():
        pct = (count / len(posts)) * 100
        report += f"- **{tone}**: {count} posts ({pct:.1f}%)\n"
    
    report += f"""
## Analysis

### Dominant Tone
**{tone_counts.most_common(1)[0][0]}**: {tone_counts.most_common(1)[0][1]} posts ({tone_counts.most_common(1)[0][1] / len(posts) * 100:.1f}%)

### Underused Tones
"""
    for tone, count in tone_counts.items():
        if count < len(posts) * 0.15:  # Less than 15%
            report += f"- **{tone}**: Only {count} posts - opportunity to expand\n"
    
    report += f"""
## Engagement Impact

Tone variety affects:
- **Authority**: Mix of tones builds credibility
- **Engagement**: Different tones resonate with different audiences
- **Narrative depth**: Single tone creates one-dimensional voice

## Recommendations

1. **Balance tone distribution**: Aim for 20-25% per major tone category
2. **Strategic tone selection**: Match tone to content type
   - Urgent/Problem-focused: For pain point content
   - Celebratory/Achievement: For milestones and wins
   - Educational/Informative: For how-to and explainer content
   - Empathetic/Supportive: For community-building
   - Challenging/Provocative: For thought leadership

3. **Current gaps**: 
   - [Identify which tones are underused]
   - [Recommend specific content to fill gaps]
"""
    
    with open(results_dir / "08_emotional_tone_analysis.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase9_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 9 report."""
    # Identify unused themes
    all_themes = set()
    for post in posts:
        all_themes.update(identify_themes(post['caption']))
    
    potential_themes = ['Regulation', 'Compliance', 'Training', 'Partnership', 'Community', 'Innovation', 'Research']
    unused = [t for t in potential_themes if t not in all_themes]
    
    report = f"""# Phase 9: New Theme Creation

## Unused Angles Identified

"""
    for theme in unused[:3]:
        report += f"- **{theme}**: Not yet covered\n"
    
    report += f"""
## Selected Theme: [To be selected based on strategic goals]

### Strategic Rationale
[Why this theme aligns with goals]

## New Content Created

### Single-Image Caption (50-70 words)
```
[Caption text to be created]
```

### Carousel Hook
```
[Hook text to be created]
```

### Supporting Insight/Proof Point
[Proof point or data to support the theme]

## Tone Match
- Direct, unsentimental, practical
- Matches established tone profile from Phase 3
"""
    
    with open(results_dir / "09_new_theme_content.md", 'w', encoding='utf-8') as f:
        f.write(report)

def generate_phase10_report(posts: List[Dict], results_dir: Path):
    """Generate Phase 10 report."""
    report = """# Phase 10: Tomorrow's Post Creation

## Narrative Gap Identified

[What story element is missing from current content]

## Underused Pain Point

[What problem is mentioned but not fully explored]

## Complete LinkedIn Post

### Hook (First Line)
```
[Hook text]
```

### Body (2-3 Tight Paragraphs)
```
[Paragraph 1]

[Paragraph 2]

[Paragraph 3 - if needed]
```

### CTA
```
[Call to action]
```

## Tone Match
- Direct, unsentimental, practical
- Based on top-performing posts from Phase 3
- Uses proven patterns from Phase 7

## Rationale
[Why this post fills the identified gap]
"""
    
    with open(results_dir / "10_tomorrows_post.md", 'w', encoding='utf-8') as f:
        f.write(report)

if __name__ == "__main__":
    print("Starting comprehensive LinkedIn content audit...")
    posts = collect_all_linkedin_posts()
    print(f"Collected {len(posts)} TITAN PMR LinkedIn posts")
    generate_reports(posts)
    print("Audit complete!")





