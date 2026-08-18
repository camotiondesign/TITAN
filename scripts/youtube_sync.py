#!/usr/bin/env python3
"""
YouTube Data Sync for TITAN Content Ops
Pulls video metadata, stats, and transcripts from the TITAN PMR YouTube channel.
Saves structured JSON to data/youtube/ in the repo.

Usage:
    python youtube_sync.py pull          # Pull all video data + transcripts
    python youtube_sync.py pull --skip-transcripts  # Stats only, no transcripts
    python youtube_sync.py pull --recent 10  # Only pull last N videos

Requires:
    YOUTUBE_API_KEY environment variable
    pip install google-api-python-client youtube-transcript-api
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone
from pathlib import Path

try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("ERROR: google-api-python-client not installed. Run: pip install google-api-python-client")
    sys.exit(1)

TRANSCRIPTS_AVAILABLE = False
TRANSCRIPT_API_VERSION = None

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    TRANSCRIPTS_AVAILABLE = True

    # Detect API version by checking available methods
    if hasattr(YouTubeTranscriptApi, 'fetch'):
        TRANSCRIPT_API_VERSION = "new"  # v0.6.3+
    elif hasattr(YouTubeTranscriptApi, 'get_transcript'):
        TRANSCRIPT_API_VERSION = "old"  # v0.5.x / v0.6.0-0.6.2
    else:
        TRANSCRIPT_API_VERSION = "old"

    print(f"youtube-transcript-api detected (style: {TRANSCRIPT_API_VERSION})")
except ImportError:
    print("WARNING: youtube-transcript-api not installed. Transcripts will be skipped.")
    print("Run: pip install youtube-transcript-api")

# --- Config ---
API_KEY = os.environ.get("YOUTUBE_API_KEY")
CHANNEL_HANDLE = "@TITANPMR"
DATA_DIR = Path("data/youtube")
TRANSCRIPT_DIR = DATA_DIR / "transcripts"

LANGUAGE_CODES = ["en", "en-GB", "en-US"]


def get_youtube_client():
    """Build authenticated YouTube API client."""
    if not API_KEY:
        print("ERROR: YOUTUBE_API_KEY environment variable not set.")
        sys.exit(1)
    return build("youtube", "v3", developerKey=API_KEY)


def resolve_channel_id(youtube):
    """Resolve @handle to channel ID."""
    print(f"Resolving channel handle: {CHANNEL_HANDLE}")
    try:
        response = youtube.channels().list(
            part="id,snippet,statistics",
            forHandle=CHANNEL_HANDLE.lstrip("@")
        ).execute()
    except HttpError as e:
        # Fallback: try forUsername
        print(f"forHandle failed ({e}), trying forUsername...")
        response = youtube.channels().list(
            part="id,snippet,statistics",
            forUsername=CHANNEL_HANDLE.lstrip("@")
        ).execute()

    if not response.get("items"):
        # Last resort: search for the channel
        print("Direct lookup failed, trying search...")
        search_response = youtube.search().list(
            part="snippet",
            q=CHANNEL_HANDLE,
            type="channel",
            maxResults=1
        ).execute()
        if search_response.get("items"):
            channel_id = search_response["items"][0]["snippet"]["channelId"]
            # Now get full channel info
            response = youtube.channels().list(
                part="id,snippet,statistics",
                id=channel_id
            ).execute()

    if not response.get("items"):
        print(f"ERROR: Could not find channel for {CHANNEL_HANDLE}")
        sys.exit(1)

    channel = response["items"][0]
    print(f"Found channel: {channel['snippet']['title']} ({channel['id']})")
    return channel


def get_all_video_ids(youtube, channel_id, max_videos=None):
    """Get all video IDs from a channel's uploads playlist."""
    # Get uploads playlist ID (replace 'UC' with 'UU' in channel ID)
    uploads_playlist_id = "UU" + channel_id[2:]

    video_ids = []
    next_page_token = None

    while True:
        request = youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()

        for item in response.get("items", []):
            video_ids.append({
                "video_id": item["snippet"]["resourceId"]["videoId"],
                "title": item["snippet"]["title"],
                "published_at": item["snippet"]["publishedAt"],
            })

        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break
        if max_videos and len(video_ids) >= max_videos:
            video_ids = video_ids[:max_videos]
            break

    print(f"Found {len(video_ids)} videos")
    return video_ids


def get_video_details(youtube, video_ids):
    """Get detailed stats for a batch of videos (max 50 per request)."""
    all_details = {}

    # Process in batches of 50
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        ids_string = ",".join([v["video_id"] for v in batch])

        response = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=ids_string
        ).execute()

        for item in response.get("items", []):
            vid_id = item["id"]
            stats = item.get("statistics", {})
            snippet = item.get("snippet", {})
            content = item.get("contentDetails", {})

            all_details[vid_id] = {
                "video_id": vid_id,
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "published_at": snippet.get("publishedAt", ""),
                "tags": snippet.get("tags", []),
                "category_id": snippet.get("categoryId", ""),
                "duration": content.get("duration", ""),
                "definition": content.get("definition", ""),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "url": f"https://www.youtube.com/watch?v={vid_id}",
            }

    return all_details


def parse_transcript_entries(entries):
    """Parse transcript entries regardless of format (dict or object)."""
    segments = []
    full_text_parts = []

    for entry in entries:
        # Handle both dict format and object format
        if isinstance(entry, dict):
            start = entry.get("start", 0)
            duration = entry.get("duration", 0)
            text = entry.get("text", "")
        else:
            start = getattr(entry, "start", 0)
            duration = getattr(entry, "duration", 0)
            text = getattr(entry, "text", str(entry))

        segments.append({
            "start": round(float(start), 1),
            "duration": round(float(duration), 1),
            "text": text,
        })
        full_text_parts.append(text)

    return {
        "full_text": " ".join(full_text_parts),
        "segments": segments,
    }


def get_transcript_new_api(video_id):
    """Fetch transcript using youtube-transcript-api v0.6.3+ API."""
    try:
        # New API: YouTubeTranscriptApi.fetch(video_id, languages=[...])
        entries = YouTubeTranscriptApi.fetch(video_id, languages=LANGUAGE_CODES)
        result = parse_transcript_entries(entries)
        result["language"] = "en"
        result["is_auto_generated"] = True  # Can't easily distinguish in new API
        return result
    except Exception as e:
        print(f"    new API fetch failed: {type(e).__name__}: {e}")
        return None


def get_transcript_old_api(video_id):
    """Fetch transcript using youtube-transcript-api v0.5.x / v0.6.0-0.6.2 API."""
    # Method 1: Simple get_transcript
    try:
        entries = YouTubeTranscriptApi.get_transcript(video_id, languages=LANGUAGE_CODES)
        result = parse_transcript_entries(entries)
        result["language"] = "en"
        result["is_auto_generated"] = True
        return result
    except Exception as e:
        print(f"    get_transcript failed: {type(e).__name__}: {e}")

    # Method 2: list_transcripts with manual/generated preference
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = None
        is_generated = False

        # Try manually created first
        try:
            transcript = transcript_list.find_manually_created_transcript(LANGUAGE_CODES)
            is_generated = False
        except Exception:
            pass

        # Fall back to auto-generated
        if not transcript:
            try:
                transcript = transcript_list.find_generated_transcript(LANGUAGE_CODES)
                is_generated = True
            except Exception:
                pass

        if transcript:
            entries = transcript.fetch()
            result = parse_transcript_entries(entries)
            result["language"] = "en"
            result["is_auto_generated"] = is_generated
            return result

    except Exception as e:
        print(f"    list_transcripts failed: {type(e).__name__}: {e}")

    return None


def get_transcript(video_id):
    """Pull transcript for a single video. Returns None if unavailable."""
    if not TRANSCRIPTS_AVAILABLE:
        return None

    # Try the detected API version first, then fall back to the other
    if TRANSCRIPT_API_VERSION == "new":
        result = get_transcript_new_api(video_id)
        if not result:
            result = get_transcript_old_api(video_id)
    else:
        result = get_transcript_old_api(video_id)
        if not result:
            result = get_transcript_new_api(video_id)

    return result


def pull(skip_transcripts=False, max_recent=None):
    """Main pull command -- fetches all video data and transcripts."""
    youtube = get_youtube_client()

    # Resolve channel
    channel_data = resolve_channel_id(youtube)
    channel_id = channel_data["id"]
    channel_stats = channel_data.get("statistics", {})

    # Get video list
    video_list = get_all_video_ids(youtube, channel_id, max_videos=max_recent)

    if not video_list:
        print("No videos found.")
        return

    # Get detailed stats
    print("Fetching video details...")
    details = get_video_details(youtube, video_list)

    # Merge and sort by publish date (newest first)
    videos = []
    for v in video_list:
        vid_id = v["video_id"]
        if vid_id in details:
            videos.append(details[vid_id])

    videos.sort(key=lambda x: x["published_at"], reverse=True)

    # Create output directories
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)

    # Pull transcripts
    transcript_count = 0
    if not skip_transcripts:
        print("Fetching transcripts...")
        for i, video in enumerate(videos):
            vid_id = video["video_id"]
            title_preview = video['title'][:60]
            print(f"  [{i+1}/{len(videos)}] {title_preview}...")

            transcript = get_transcript(vid_id)
            if transcript:
                transcript_count += 1
                video["has_transcript"] = True
                video["transcript_word_count"] = len(transcript["full_text"].split())

                # Save individual transcript file
                transcript_file = TRANSCRIPT_DIR / f"{vid_id}.json"
                transcript_data = {
                    "video_id": vid_id,
                    "title": video["title"],
                    "url": video["url"],
                    "published_at": video["published_at"],
                    **transcript,
                }
                with open(transcript_file, "w", encoding="utf-8") as f:
                    json.dump(transcript_data, f, indent=2, ensure_ascii=False)

                print(f"    ✓ Transcript saved ({video['transcript_word_count']} words)")
            else:
                video["has_transcript"] = False
                video["transcript_word_count"] = 0

    # Build channel summary
    summary = {
        "channel_id": channel_id,
        "channel_handle": CHANNEL_HANDLE,
        "channel_name": channel_data["snippet"]["title"],
        "subscribers": int(channel_stats.get("subscriberCount", 0)),
        "total_views": int(channel_stats.get("viewCount", 0)),
        "total_videos": int(channel_stats.get("videoCount", 0)),
        "last_synced": datetime.now(timezone.utc).isoformat(),
        "videos_pulled": len(videos),
        "transcripts_pulled": transcript_count,
        "videos": videos,
    }

    # Save channel summary
    summary_file = DATA_DIR / "channel_summary.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"\nDone!")
    print(f"   Videos: {len(videos)}")
    print(f"   Transcripts: {transcript_count}")
    print(f"   Saved to: {summary_file}")
    print(f"   Transcripts in: {TRANSCRIPT_DIR}/")


def main():
    parser = argparse.ArgumentParser(description="YouTube Data Sync for TITAN Content Ops")
    parser.add_argument("command", choices=["pull"], help="Command to run")
    parser.add_argument("--skip-transcripts", action="store_true", help="Skip transcript fetching")
    parser.add_argument("--recent", type=int, default=None, help="Only pull last N videos")

    args = parser.parse_args()

    if args.command == "pull":
        pull(skip_transcripts=args.skip_transcripts, max_recent=args.recent)


if __name__ == "__main__":
    main()
