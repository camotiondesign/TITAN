#!/usr/bin/env python3
"""
Titan Content Ops -- Weekly Pharmacy News Scanner

Scans UK pharmacy industry news sources for reactive post opportunities.
Designed to run every Monday morning (7am UTC via GitHub Actions or manually).

Usage:
    python scripts/pharmacy-news-scan.py            # Write to analytics/weekly-news-scan.md
    python scripts/pharmacy-news-scan.py --dry-run   # Print to stdout instead

Sources:
    - Pharmaceutical Journal (pharmaceutical-journal.com)
    - Chemist + Druggist (chemistanddruggist.co.uk)
    - PSNC / Community Pharmacy England (psnc.org.uk)
    - NHS England pharmacy updates
    - PharmaTimes (pharmatimes.com)

Dependencies:
    pip install requests feedparser beautifulsoup4
"""

import argparse
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    sys.exit("ERROR: 'requests' not installed. Run: pip install requests")

try:
    import feedparser
except ImportError:
    sys.exit("ERROR: 'feedparser' not installed. Run: pip install feedparser")

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("ERROR: 'beautifulsoup4' not installed. Run: pip install beautifulsoup4")


# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = REPO_ROOT / "analytics" / "weekly-news-scan.md"

# How many days back to scan
LOOKBACK_DAYS = 7

# Request timeout in seconds
REQUEST_TIMEOUT = 30

# User-Agent to avoid blocks from news sites
USER_AGENT = (
    "Mozilla/5.0 (compatible; TitanNewsScan/1.0; "
    "+https://github.com/titan-pmr)"
)

HEADERS = {"User-Agent": USER_AGENT}


# ---------------------------------------------------------------------------
# NEWS SOURCES
# ---------------------------------------------------------------------------

# Each source is a dict with:
#   name:     Display name
#   type:     "rss" or "scrape"
#   url:      RSS feed URL or page URL
#   parser:   Function name to extract articles (for scrape type)

NEWS_SOURCES = [
    {
        "name": "Pharmaceutical Journal",
        "type": "rss",
        "url": "https://pharmaceutical-journal.com/feed",
        "fallback_url": "https://pharmaceutical-journal.com/news",
    },
    {
        "name": "Chemist + Druggist",
        "type": "rss",
        "url": "https://www.chemistanddruggist.co.uk/feed",
        "fallback_url": "https://www.chemistanddruggist.co.uk/news",
    },
    {
        "name": "Community Pharmacy England (PSNC)",
        "type": "rss",
        "url": "https://psnc.org.uk/feed/",
        "fallback_url": "https://psnc.org.uk/our-news/",
    },
    {
        "name": "PharmaTimes",
        "type": "rss",
        "url": "https://www.pharmatimes.com/feed",
        "fallback_url": "https://www.pharmatimes.com/news",
    },
    {
        "name": "NHS England Pharmacy",
        "type": "scrape",
        "url": "https://www.england.nhs.uk/primary-care/pharmacy/",
        "fallback_url": None,
    },
]


# ---------------------------------------------------------------------------
# TOPIC SCORING -- keywords mapped to relevance tiers
# ---------------------------------------------------------------------------

# Scores: HIGH = 3, MEDIUM = 2, LOW = 1
# Each keyword group has a label used in the output explanation.

TOPIC_RULES = [
    # HIGH relevance (3 points each match)
    {
        "score": 3,
        "label": "Policy / contract dispute",
        "keywords": [
            "contract", "cpcf", "psnc", "negotiat", "dispensing fee",
            "funding cut", "government", "minister", "regulation change",
            "legislative", "pharmacy contract", "community pharmacy england",
            "dhsc", "department of health",
        ],
    },
    {
        "score": 3,
        "label": "Safety / near miss / patient safety",
        "keywords": [
            "patient safety", "near miss", "dispensing error", "wrong drug",
            "safeguarding", "medication error", "safety alert", "mhra",
            "clinical safety", "incident", "harm reduction",
        ],
    },
    {
        "score": 3,
        "label": "DSPT / compliance / regulation",
        "keywords": [
            "dspt", "data security", "nhs digital", "compliance",
            "cyber security", "gdpr", "ico", "audit", "inspection",
            "gphc", "fitness to practise", "responsible pharmacist",
        ],
    },
    {
        "score": 3,
        "label": "Funding / clawback / reimbursement",
        "keywords": [
            "clawback", "reimbursement", "margin", "category m",
            "drug tariff", "nhs reimbursement", "funding", "underfund",
            "single activity fee", "saf", "banded payment",
        ],
    },
    # MEDIUM relevance (2 points each match)
    {
        "score": 2,
        "label": "New services / Pharmacy First / clinical",
        "keywords": [
            "pharmacy first", "clinical service", "blood pressure",
            "contraception", "vaccination", "immunisation", "weight management",
            "hypertension", "nms", "mur", "dms", "cpcs", "service expansion",
            "independent prescrib",
        ],
    },
    {
        "score": 2,
        "label": "Workforce / staffing / locum",
        "keywords": [
            "workforce", "staffing", "locum", "recruitment", "retention",
            "pharmacist shortage", "burnout", "workload", "wellbeing",
            "foundation training", "pre-reg", "apprentice",
        ],
    },
    {
        "score": 2,
        "label": "Technology / digital / AI",
        "keywords": [
            "digital", "technology", "ai ", "artificial intelligence",
            "automation", "electronic prescription", "eps", "nhs app",
            "pmr", "robot", "hub and spoke", "remote",
        ],
    },
    # LOW relevance (1 point each match)
    {
        "score": 1,
        "label": "General pharmacy news",
        "keywords": [
            "pharmacy", "pharmacist", "dispens", "prescription",
            "community pharmacy", "health", "nhs",
        ],
    },
]

# Post format suggestions based on top topic
FORMAT_SUGGESTIONS = {
    "Policy / contract dispute": "Stance post (bold text overlay) or carousel breaking down the changes",
    "Safety / near miss / patient safety": "Quote card overlay or short-form video (pharmacist perspective)",
    "DSPT / compliance / regulation": "Meme or single-image with stat callout",
    "Funding / clawback / reimbursement": "Carousel with numbers or stance post",
    "New services / Pharmacy First / clinical": "Carousel (what changed + what it means for you)",
    "Workforce / staffing / locum": "Quote card or video (real pharmacist reaction)",
    "Technology / digital / AI": "Single image with bold stat or meme format",
    "General pharmacy news": "Single image or meme if there is an angle",
}


# ---------------------------------------------------------------------------
# FETCHING
# ---------------------------------------------------------------------------

def fetch_rss(source: dict, cutoff: datetime) -> list[dict]:
    """Fetch and parse an RSS feed, returning articles newer than cutoff."""
    articles = []
    url = source["url"]

    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        feed = feedparser.parse(resp.text)
    except requests.RequestException as e:
        print(f"  [WARN] RSS fetch failed for {source['name']}: {e}", file=sys.stderr)
        # Try fallback URL with scraping if available
        if source.get("fallback_url"):
            print(f"  [INFO] Trying fallback scrape for {source['name']}", file=sys.stderr)
            return fetch_page_scrape(
                {"name": source["name"], "url": source["fallback_url"]},
                cutoff,
            )
        return articles

    if not feed.entries:
        print(f"  [WARN] No entries in RSS feed for {source['name']}", file=sys.stderr)
        if source.get("fallback_url"):
            return fetch_page_scrape(
                {"name": source["name"], "url": source["fallback_url"]},
                cutoff,
            )
        return articles

    for entry in feed.entries:
        # Parse published date
        pub_date = _parse_feed_date(entry)
        if pub_date and pub_date < cutoff:
            continue

        title = entry.get("title", "").strip()
        link = entry.get("link", "").strip()
        summary = _clean_html(entry.get("summary", entry.get("description", "")))

        if not title:
            continue

        articles.append({
            "title": title,
            "url": link,
            "date": pub_date.strftime("%Y-%m-%d") if pub_date else "Unknown",
            "summary": summary[:300].strip(),
            "source": source["name"],
        })

    return articles


def fetch_page_scrape(source: dict, cutoff: datetime) -> list[dict]:
    """Scrape a news page for article links and titles as a fallback."""
    articles = []
    url = source["url"]

    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [WARN] Scrape failed for {source['name']}: {e}", file=sys.stderr)
        return articles

    soup = BeautifulSoup(resp.text, "html.parser")

    # Generic strategy: find article/heading links
    # Look for common patterns: <article>, <h2><a>, <h3><a>, .post-title, etc.
    candidates = []

    # Strategy 1: <article> tags with links
    for article_tag in soup.find_all("article"):
        link_tag = article_tag.find("a", href=True)
        heading = article_tag.find(["h1", "h2", "h3", "h4"])
        if link_tag and heading:
            candidates.append({
                "title": heading.get_text(strip=True),
                "url": urljoin(url, link_tag["href"]),
                "summary": _extract_summary_from_tag(article_tag),
            })

    # Strategy 2: heading links in news lists
    if not candidates:
        for heading in soup.find_all(["h2", "h3"]):
            link_tag = heading.find("a", href=True)
            if link_tag:
                title = link_tag.get_text(strip=True)
                if len(title) > 15:  # Filter out nav items
                    candidates.append({
                        "title": title,
                        "url": urljoin(url, link_tag["href"]),
                        "summary": "",
                    })

    # Deduplicate by URL
    seen_urls = set()
    for c in candidates[:20]:  # Cap at 20 articles
        if c["url"] in seen_urls:
            continue
        seen_urls.add(c["url"])
        articles.append({
            "title": c["title"],
            "url": c["url"],
            "date": "Recent",  # Scraped pages rarely have parseable dates
            "summary": c.get("summary", "")[:300].strip(),
            "source": source["name"],
        })

    return articles


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _parse_feed_date(entry) -> datetime | None:
    """Extract a timezone-aware datetime from a feedparser entry."""
    # feedparser provides parsed date as a time.struct_time
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        from calendar import timegm
        ts = timegm(entry.published_parsed)
        return datetime.fromtimestamp(ts, tz=timezone.utc)

    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        from calendar import timegm
        ts = timegm(entry.updated_parsed)
        return datetime.fromtimestamp(ts, tz=timezone.utc)

    # Try to parse from string as last resort
    for field in ("published", "updated", "dc_date"):
        raw = entry.get(field, "")
        if raw:
            try:
                # Handle common RSS date formats
                for fmt in (
                    "%a, %d %b %Y %H:%M:%S %z",
                    "%Y-%m-%dT%H:%M:%S%z",
                    "%Y-%m-%d",
                ):
                    try:
                        return datetime.strptime(raw.strip(), fmt).replace(
                            tzinfo=timezone.utc
                        )
                    except ValueError:
                        continue
            except Exception:
                pass

    return None


def _clean_html(html_str: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    if not html_str:
        return ""
    soup = BeautifulSoup(html_str, "html.parser")
    text = soup.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_summary_from_tag(tag) -> str:
    """Pull the first paragraph-like text from an article tag."""
    for p in tag.find_all("p"):
        text = p.get_text(strip=True)
        if len(text) > 40:
            return text[:300]
    return ""


# ---------------------------------------------------------------------------
# SCORING
# ---------------------------------------------------------------------------

def score_article(article: dict) -> dict:
    """Score an article for reactive post potential. Returns the article
    dict with added 'total_score', 'matched_topics', and 'top_topic' keys."""

    text = (
        article["title"].lower()
        + " "
        + article.get("summary", "").lower()
    )

    matched_topics = []
    total_score = 0

    for rule in TOPIC_RULES:
        hits = sum(1 for kw in rule["keywords"] if kw in text)
        if hits > 0:
            # Score is rule score * number of keyword hits (capped at 3x)
            contribution = rule["score"] * min(hits, 3)
            total_score += contribution
            matched_topics.append({
                "label": rule["label"],
                "score": contribution,
                "hits": hits,
            })

    # Sort matched topics by score descending
    matched_topics.sort(key=lambda t: t["score"], reverse=True)

    top_topic = matched_topics[0]["label"] if matched_topics else "General pharmacy news"

    article["total_score"] = total_score
    article["matched_topics"] = matched_topics
    article["top_topic"] = top_topic

    return article


def tier_label(score: int) -> str:
    """Return a human-readable tier label for a score."""
    if score >= 8:
        return "HIGH"
    elif score >= 4:
        return "MEDIUM"
    else:
        return "LOW"


# ---------------------------------------------------------------------------
# TITAN ANGLE GENERATION
# ---------------------------------------------------------------------------

def suggest_titan_angle(article: dict) -> str:
    """Generate a Titan PMR-specific angle for a news article."""
    topic = article["top_topic"]
    title_lower = article["title"].lower()

    angles = {
        "Policy / contract dispute": (
            "Position Titan PMR as the tool that helps pharmacies adapt to contract "
            "changes -- show how digital workflows make compliance with new requirements "
            "easier and protect revenue."
        ),
        "Safety / near miss / patient safety": (
            "Connect this to Titan's clinical checks and safety features. "
            "Frame it as: 'Manual processes cause errors. Digital-first pharmacies "
            "catch them before they reach the patient.'"
        ),
        "DSPT / compliance / regulation": (
            "Titan PMR simplifies DSPT compliance and audit trails. "
            "This is a direct pain point -- show how the platform handles it "
            "without extra admin overhead."
        ),
        "Funding / clawback / reimbursement": (
            "Tie to Titan's ability to track every item, flag discrepancies, "
            "and protect pharmacies from clawback. "
            "'You can't fight what you can't see -- Titan makes it visible.'"
        ),
        "New services / Pharmacy First / clinical": (
            "Show how Titan frees up pharmacist time to deliver clinical services. "
            "Pharmacies on Titan are spending more time on services, less on "
            "dispensary firefighting."
        ),
        "Workforce / staffing / locum": (
            "Frame around efficiency: Titan reduces the team hours needed for "
            "dispensing, making understaffed pharmacies viable. "
            "'When you can't hire more people, make the people you have more effective.'"
        ),
        "Technology / digital / AI": (
            "Titan is already doing this. Use the article to validate the "
            "digital-first approach and share a real example from a Titan pharmacy."
        ),
        "General pharmacy news": (
            "Look for a human angle -- what does this mean for the pharmacist "
            "behind the counter? Titan's voice is empathetic and practical."
        ),
    }

    return angles.get(topic, angles["General pharmacy news"])


def suggest_format(article: dict) -> str:
    """Suggest a post format based on the article's top topic."""
    return FORMAT_SUGGESTIONS.get(
        article["top_topic"],
        "Single image or carousel",
    )


# ---------------------------------------------------------------------------
# HOT TAKE GENERATOR
# ---------------------------------------------------------------------------

def generate_hot_take(top_article: dict) -> str:
    """Generate a draft reactive post caption for the highest-scored article."""
    title = top_article["title"]
    topic = top_article["top_topic"]
    summary = top_article.get("summary", "")

    # Build a template based on topic tier
    caption = f"""Breaking this down because pharmacy owners need to hear it.

"{title}"

Here's what nobody's saying about this:

The pharmacies that struggle with changes like this are the ones still running on paper, spreadsheets, and crossed fingers.

The ones that adapt? They've already got systems that flex.

When policy shifts, when funding changes, when new requirements land --
your workflow either absorbs it or breaks.

That's not a tech pitch. That's just how it works now.

If this headline made you nervous, ask yourself:
Could my pharmacy handle this tomorrow morning?

If not, that's your starting point.

#CommunityPharmacy #PharmacyFirst #TitanPMR #DigitalPharmacy"""

    return caption


# ---------------------------------------------------------------------------
# OUTPUT FORMATTING
# ---------------------------------------------------------------------------

def format_markdown(articles: list[dict], scan_date: str) -> str:
    """Build the weekly-news-scan.md content."""
    lines = []

    lines.append("# Weekly Pharmacy News Scan")
    lines.append("")
    lines.append(f"**Scan date:** {scan_date}")
    lines.append(f"**Period:** Last {LOOKBACK_DAYS} days")
    lines.append(f"**Total articles found:** {len(articles)}")
    lines.append("")

    # Sort by score descending
    ranked = sorted(articles, key=lambda a: a["total_score"], reverse=True)
    top_5 = ranked[:5]

    if not top_5:
        lines.append("No articles found this week. Check source availability.")
        return "\n".join(lines)

    # ----- Top 5 Reactive Post Opportunities -----
    lines.append("---")
    lines.append("")
    lines.append("## Top 5 Reactive Post Opportunities")
    lines.append("")

    for i, article in enumerate(top_5, 1):
        tier = tier_label(article["total_score"])
        topics_str = ", ".join(
            f"{t['label']} ({t['score']}pt)" for t in article["matched_topics"][:3]
        )
        if not topics_str:
            topics_str = "General pharmacy news"

        lines.append(f"### {i}. {article['title']}")
        lines.append("")
        lines.append(f"- **Source:** {article['source']}")
        lines.append(f"- **Date:** {article['date']}")
        lines.append(f"- **URL:** {article['url']}")
        lines.append(f"- **Score:** {article['total_score']} ({tier})")
        lines.append(f"- **Topics:** {topics_str}")
        lines.append("")
        if article.get("summary"):
            lines.append(f"> {article['summary']}")
            lines.append("")
        lines.append(f"**Why it's relevant:** {suggest_titan_angle(article)}")
        lines.append("")
        lines.append(f"**Suggested format:** {suggest_format(article)}")
        lines.append("")
        lines.append("---")
        lines.append("")

    # ----- This Week's Hot Take -----
    best = top_5[0]
    lines.append("## This Week's Hot Take")
    lines.append("")
    lines.append(
        f"Based on the highest-scoring article: **{best['title']}** "
        f"({best['source']})"
    )
    lines.append("")
    lines.append("### Draft reactive post caption")
    lines.append("")
    lines.append("```")
    lines.append(generate_hot_take(best))
    lines.append("```")
    lines.append("")
    lines.append(f"**Suggested format:** {suggest_format(best)}")
    lines.append("")

    # ----- Full Article List -----
    lines.append("---")
    lines.append("")
    lines.append("## All Articles This Week")
    lines.append("")
    lines.append("| Score | Tier | Source | Title |")
    lines.append("|-------|------|--------|-------|")
    for article in ranked:
        tier = tier_label(article["total_score"])
        # Truncate title for table readability
        short_title = article["title"][:80]
        if len(article["title"]) > 80:
            short_title += "..."
        lines.append(
            f"| {article['total_score']} | {tier} "
            f"| {article['source']} | [{short_title}]({article['url']}) |"
        )
    lines.append("")

    # ----- Footer -----
    lines.append("---")
    lines.append("")
    lines.append(
        "*Generated by `scripts/pharmacy-news-scan.py`. "
        "Scores are keyword-based estimates -- always verify before posting.*"
    )
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Scan UK pharmacy news for reactive post opportunities"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print output to stdout instead of writing to file",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=LOOKBACK_DAYS,
        help=f"Number of days to look back (default: {LOOKBACK_DAYS})",
    )
    args = parser.parse_args()

    scan_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    cutoff = datetime.now(timezone.utc) - timedelta(days=args.days)

    print(f"Pharmacy News Scan -- {scan_date}")
    print(f"Looking back {args.days} days (cutoff: {cutoff.strftime('%Y-%m-%d')})")
    print(f"Sources: {len(NEWS_SOURCES)}")
    print()

    all_articles = []

    for source in NEWS_SOURCES:
        print(f"  Fetching: {source['name']} ({source['type']})...")

        if source["type"] == "rss":
            articles = fetch_rss(source, cutoff)
        else:
            articles = fetch_page_scrape(source, cutoff)

        print(f"    Found {len(articles)} articles")
        all_articles.extend(articles)

    print()
    print(f"Total articles collected: {len(all_articles)}")

    # Deduplicate by URL
    seen_urls = set()
    unique_articles = []
    for a in all_articles:
        if a["url"] not in seen_urls:
            seen_urls.add(a["url"])
            unique_articles.append(a)
    print(f"After dedup: {len(unique_articles)}")

    # Score all articles
    scored = [score_article(a) for a in unique_articles]
    scored.sort(key=lambda a: a["total_score"], reverse=True)

    high = sum(1 for a in scored if a["total_score"] >= 8)
    medium = sum(1 for a in scored if 4 <= a["total_score"] < 8)
    low = sum(1 for a in scored if a["total_score"] < 4)
    print(f"Scored: {high} HIGH, {medium} MEDIUM, {low} LOW")
    print()

    # Generate markdown output
    md = format_markdown(scored, scan_date)

    if args.dry_run:
        print("=" * 60)
        print("DRY RUN -- Output below (not written to file)")
        print("=" * 60)
        print()
        print(md)
    else:
        # Ensure output directory exists
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_FILE.write_text(md, encoding="utf-8")
        print(f"Written to: {OUTPUT_FILE}")

    # Exit 0 even if some sources failed -- partial results are still useful
    return 0


if __name__ == "__main__":
    sys.exit(main())
