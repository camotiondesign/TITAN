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

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    TRANSCRIPTS_AVAILABLE = True
except ImportError:
    print("WARNING: youtube-transcript-api not installed. Transcripts will be skipped.")
    print("Run: pip install youtube-transcript-api")
    TRANSCRIPTS_AVAILABLE = False

# --- Config ---
API_KEY = os.environ.get("YOUTUBE_API_KEY")
CHANNEL_HANDLE = "@TITANPMR"
DATA_DIR = Path("data/youtube")
TRANSCRIPT_DIR = DATA_DIR / "transcripts"


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


def get_transcript(video_id):
    """Pull transcript for a single video. Returns None if unavailable."""
    if not TRANSCRIPTS_AVAILABLE:
        return None

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Prefer manually created, fall back to auto-generated
        transcript = None
        try:
            transcript = transcript_list.find_manually_created_transcript(["en"])
        except Exception:
            try:
                transcript = transcript_list.find_generated_transcript(["en"])
            except Exception:
                pass

        if transcript:
            entries = transcript.fetch()
            # Build full text and keep timestamped entries
            segments = []
            full_text_parts = []
            for entry in entries:
                segments.append({
                    "start": round(entry.start, 1),
                    "duration": round(entry.duration, 1),
                    "text": entry.text,
                })
                full_text_parts.append(entry.text)

            return {
                "full_text": " ".join(full_text_parts),
                "segments": segments,
                "language": "en",
                "is_auto_generated": transcript.is_generated,
            }

    except Exception as e:
        print(f"  No transcript for {video_id}: {e}")

    return None


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
            print(f"  [{i+1}/{len(videos)}] {video['title'][:60]}...")

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
