#!/usr/bin/env python3
"""
Analyze emoji usage in best performing LinkedIn post captions.

This script reads caption files for top performing posts and calculates
the average number of emojis used per caption.
"""

import re
import os
from pathlib import Path
from typing import List, Tuple
import unicodedata

# Top performing posts based on emoji-usage-analysis.md
TOP_POSTS = [
    {
        "name": "POV Start Consultation",
        "path": "campaigns/TITANVERSE/2025-11-11-pov-start-a-consultation/social/linkedin/2025-11-11-pov-start-a-consultation/caption.md",
        "engagement": 76.8
    },
    {
        "name": "Titan 2024 Wrapped",
        "path": "campaigns/TITAN/2024-12-16-titan-wrapped/social/linkedin/2024-12-16-titan-wrapped-carousel/caption.md",
        "engagement": 65.1
    },
    {
        "name": "AI Templates",
        "path": "campaigns/TITANVERSE/2025-10-22-titanverse-ai-templates/social/linkedin/2025-10-22-titanverse-ai-templates/caption.md",
        "engagement": 58.0
    },
    {
        "name": "Pharmacy Evolution",
        "path": "campaigns/TITAN/2025-02-24-pharmacy-evolution-carousel/social/linkedin/2025-02-24-pharmacy-evolution-carousel/caption.md",
        "engagement": 55.7
    },
    {
        "name": "Your Pharmacy Isn't Struggling",
        "path": "campaigns/TITAN/2025-02-14-your-pharmacy-isnt-struggling/social/linkedin/2025-02-14-your-pharmacy-isnt-struggling/caption.md",
        "engagement": 53.4
    },
    {
        "name": "Priory Carousel",
        "path": "campaigns/TITAN/2025-07-01-priory-pharmacy-case-study/social/linkedin/2025-07-17-carousel/caption.md",
        "engagement": 111.0
    }
]


def is_emoji(char: str) -> bool:
    """Check if a character is an emoji."""
    # Check if character is in emoji ranges
    emoji_ranges = [
        (0x1F300, 0x1F9FF),  # Miscellaneous Symbols and Pictographs
        (0x1F600, 0x1F64F),  # Emoticons
        (0x1F680, 0x1F6FF),  # Transport and Map Symbols
        (0x2600, 0x26FF),    # Miscellaneous Symbols
        (0x2700, 0x27BF),    # Dingbats
        (0xFE00, 0xFE0F),    # Variation Selectors
        (0x1F900, 0x1F9FF),  # Supplemental Symbols and Pictographs
        (0x1F1E0, 0x1F1FF),  # Regional Indicator Symbols (flags)
    ]
    
    code = ord(char)
    for start, end in emoji_ranges:
        if start <= code <= end:
            return True
    
    # Check using Unicode category
    if unicodedata.category(char) in ('So',):  # Symbol, other
        # Additional check for emoji presentation
        try:
            if 'EMOJI' in unicodedata.name(char, ''):
                return True
        except ValueError:
            pass
    
    return False


def count_emojis(text: str) -> int:
    """Count the number of emoji characters in text."""
    emoji_count = 0
    for char in text:
        if is_emoji(char):
            emoji_count += 1
    return emoji_count


def extract_caption_text(file_path: Path) -> str:
    """Extract the actual caption text from a markdown file, excluding headers."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove markdown headers and metadata
        lines = content.split('\n')
        caption_lines = []
        in_caption = False
        
        for line in lines:
            # Skip markdown headers
            if line.startswith('#'):
                continue
            # Skip metadata sections
            if line.startswith('---'):
                in_caption = True
                continue
            if line.startswith('Post date:') or line.startswith('Platform:') or line.startswith('Creative ID:'):
                continue
            # Start collecting after the separator
            if in_caption or not line.startswith('#'):
                if line.strip():  # Only add non-empty lines
                    caption_lines.append(line)
        
        return '\n'.join(caption_lines)
    except FileNotFoundError:
        return ""
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""


def analyze_post(post_info: dict, base_path: Path) -> Tuple[str, int, float]:
    """Analyze a single post's emoji usage."""
    file_path = base_path / post_info["path"]
    
    if not file_path.exists():
        return post_info["name"], 0, post_info["engagement"]
    
    caption_text = extract_caption_text(file_path)
    emoji_count = count_emojis(caption_text)
    
    return post_info["name"], emoji_count, post_info["engagement"]


def main():
    """Main analysis function."""
    # Get the workspace root (parent of scripts directory)
    script_dir = Path(__file__).parent
    workspace_root = script_dir.parent
    
    results = []
    
    print("Analyzing emoji usage in top performing posts...\n")
    print("=" * 70)
    
    for post in TOP_POSTS:
        name, emoji_count, engagement = analyze_post(post, workspace_root)
        results.append((name, emoji_count, engagement))
        
        print(f"{name:40} | Emojis: {emoji_count:2} | Engagement: {engagement:5.1f}%")
    
    print("=" * 70)
    
    # Calculate statistics
    emoji_counts = [r[1] for r in results]
    avg_emojis = sum(emoji_counts) / len(emoji_counts) if emoji_counts else 0
    min_emojis = min(emoji_counts) if emoji_counts else 0
    max_emojis = max(emoji_counts) if emoji_counts else 0
    
    print(f"\n📊 Summary Statistics:")
    print(f"   Average emojis per caption: {avg_emojis:.1f}")
    print(f"   Minimum emojis: {min_emojis}")
    print(f"   Maximum emojis: {max_emojis}")
    print(f"   Total posts analyzed: {len(results)}")
    
    # Group by emoji count ranges
    print(f"\n📈 Distribution:")
    ranges = {
        "0 emojis": sum(1 for c in emoji_counts if c == 0),
        "1 emoji": sum(1 for c in emoji_counts if c == 1),
        "2 emojis": sum(1 for c in emoji_counts if c == 2),
        "3-5 emojis": sum(1 for c in emoji_counts if 3 <= c <= 5),
        "6+ emojis": sum(1 for c in emoji_counts if c >= 6),
    }
    
    for range_name, count in ranges.items():
        if count > 0:
            print(f"   {range_name:15} : {count} post(s)")
    
    # Show breakdown by engagement
    print(f"\n🎯 Emoji Usage by Engagement Tier:")
    high_engagement = [r for r in results if r[2] >= 55]
    medium_engagement = [r for r in results if 30 <= r[2] < 55]
    
    if high_engagement:
        high_avg = sum(r[1] for r in high_engagement) / len(high_engagement)
        print(f"   High engagement (55%+): {high_avg:.1f} emojis on average")
        print(f"      Posts: {', '.join([r[0] for r in high_engagement])}")
    
    if medium_engagement:
        med_avg = sum(r[1] for r in medium_engagement) / len(medium_engagement)
        print(f"   Medium engagement (30-55%): {med_avg:.1f} emojis on average")


if __name__ == "__main__":
    main()










