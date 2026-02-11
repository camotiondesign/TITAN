#!/usr/bin/env python3
"""
Titan Content Ops — Notion Bidirectional Sync (Phase 1)

Commands:
    python notion_sync.py discover     # Show Notion DB schema (property names + types)
    python notion_sync.py pull         # Pull all rows -> data/notion_export.json
    python notion_sync.py push FILE    # Push schedule JSON -> create/update Notion pages
    python notion_sync.py shuffle ...  # (Phase 3 placeholder)

Environment variables required:
    NOTION_API_KEY       — Internal integration token (ntn_...)
    NOTION_DATABASE_ID   — 32-char hex database ID

Setup:
    pip install -r requirements.txt
    # Or: pip install notion-client python-dotenv
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from notion_client import Client, APIResponseError
except ImportError:
    print("ERROR: notion-client not installed. Run: pip install notion-client")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional — env vars can come from shell or GitHub Actions

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

NOTION_API_KEY = os.environ.get("NOTION_API_KEY")
NOTION_DATABASE_ID = os.environ.get("NOTION_DATABASE_ID")

# Paths relative to repo root
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
EXPORT_FILE = DATA_DIR / "notion_export.json"
SCHEMA_FILE = DATA_DIR / "notion_schema.json"

# ---------------------------------------------------------------------------
# PROPERTY EXTRACTION — handles every Notion property type
# ---------------------------------------------------------------------------

def extract_property_value(prop):
    """
    Extract a usable Python value from a Notion property object.
    Handles all standard Notion property types gracefully.
    """
    prop_type = prop.get("type")

    if prop_type == "title":
        parts = prop.get("title", [])
        return "".join(t.get("plain_text", "") for t in parts) if parts else ""

    elif prop_type == "rich_text":
        parts = prop.get("rich_text", [])
        return "".join(t.get("plain_text", "") for t in parts) if parts else ""

    elif prop_type == "number":
        return prop.get("number")

    elif prop_type == "select":
        sel = prop.get("select")
        return sel["name"] if sel else None

    elif prop_type == "multi_select":
        return [s["name"] for s in prop.get("multi_select", [])]

    elif prop_type == "status":
        st = prop.get("status")
        return st["name"] if st else None

    elif prop_type == "date":
        d = prop.get("date")
        if not d:
            return None
        return {
            "start": d.get("start"),
            "end": d.get("end"),
            "time_zone": d.get("time_zone"),
        }

    elif prop_type == "checkbox":
        return prop.get("checkbox", False)

    elif prop_type == "url":
        return prop.get("url")

    elif prop_type == "email":
        return prop.get("email")

    elif prop_type == "phone_number":
        return prop.get("phone_number")

    elif prop_type == "files":
        files = prop.get("files", [])
        result = []
        for f in files:
            if f.get("type") == "file":
                result.append(f["file"]["url"])
            elif f.get("type") == "external":
                result.append(f["external"]["url"])
            elif f.get("type") == "url":
                result.append(f.get("url", ""))
        return result

    elif prop_type == "people":
        return [p.get("name", p.get("id", "")) for p in prop.get("people", [])]

    elif prop_type == "relation":
        return [r["id"] for r in prop.get("relation", [])]

    elif prop_type == "rollup":
        rollup = prop.get("rollup", {})
        rollup_type = rollup.get("type")
        if rollup_type == "number":
            return rollup.get("number")
        elif rollup_type == "array":
            return [extract_property_value(item) for item in rollup.get("array", [])]
        return None

    elif prop_type == "formula":
        formula = prop.get("formula", {})
        f_type = formula.get("type")
        return formula.get(f_type) if f_type else None

    elif prop_type == "created_time":
        return prop.get("created_time")

    elif prop_type == "last_edited_time":
        return prop.get("last_edited_time")

    elif prop_type == "created_by":
        cb = prop.get("created_by", {})
        return cb.get("name", cb.get("id", ""))

    elif prop_type == "last_edited_by":
        eb = prop.get("last_edited_by", {})
        return eb.get("name", eb.get("id", ""))

    elif prop_type == "unique_id":
        uid = prop.get("unique_id", {})
        prefix = uid.get("prefix", "")
        number = uid.get("number", "")
        return "{}-{}".format(prefix, number) if prefix else str(number)

    elif prop_type == "verification":
        return prop.get("verification", {}).get("state")

    else:
        return "[UNKNOWN TYPE: {}]".format(prop_type)


# ---------------------------------------------------------------------------
# PROPERTY BUILDING — construct Notion property payloads for push
# ---------------------------------------------------------------------------

def build_property_payload(prop_name, value, prop_type):
    """
    Build a Notion API property payload from a value and known type.
    Used by the push command to create/update pages.
    """
    if value is None or value == "":
        if prop_type == "title":
            return {"title": []}
        elif prop_type == "rich_text":
            return {"rich_text": []}
        elif prop_type == "number":
            return {"number": None}
        elif prop_type == "select":
            return {"select": None}
        elif prop_type == "date":
            return {"date": None}
        elif prop_type == "url":
            return {"url": None}
        elif prop_type == "checkbox":
            return {"checkbox": False}
        elif prop_type == "status":
            return {"status": None}
        else:
            return {}

    if prop_type == "title":
        return {"title": [{"text": {"content": str(value)}}]}

    elif prop_type == "rich_text":
        # Notion rich_text blocks have a 2000 char limit per block
        text = str(value)
        blocks = []
        for i in range(0, len(text), 2000):
            blocks.append({"text": {"content": text[i:i+2000]}})
        return {"rich_text": blocks}

    elif prop_type == "number":
        return {"number": value if isinstance(value, (int, float)) else None}

    elif prop_type == "select":
        return {"select": {"name": str(value)}}

    elif prop_type == "multi_select":
        if isinstance(value, list):
            return {"multi_select": [{"name": str(v)} for v in value]}
        return {"multi_select": [{"name": str(value)}]}

    elif prop_type == "status":
        return {"status": {"name": str(value)}}

    elif prop_type == "date":
        if isinstance(value, dict):
            return {"date": {"start": value.get("start"), "end": value.get("end")}}
        return {"date": {"start": str(value)}}

    elif prop_type == "url":
        return {"url": str(value)}

    elif prop_type == "checkbox":
        return {"checkbox": bool(value)}

    elif prop_type == "email":
        return {"email": str(value)}

    elif prop_type == "phone_number":
        return {"phone_number": str(value)}

    else:
        print("  Warning: Cannot set property '{}' -- type '{}' not writable via API".format(prop_name, prop_type))
        return {}


# ---------------------------------------------------------------------------
# SCHEMA DISCOVERY
# ---------------------------------------------------------------------------

def get_schema(notion, database_id):
    """
    Retrieve the database schema. Returns dict of {property_name: property_type}.

    Notion Social synced databases don't return 'properties' from the
    databases.retrieve endpoint, so we fall back to reading property types
    from the first row returned by databases.query.
    """
    db = notion.databases.retrieve(database_id=database_id)

    # Normal databases have properties on the retrieve response
    if "properties" in db and db["properties"]:
        schema = {}
        for prop_name, prop_config in db["properties"].items():
            schema[prop_name] = prop_config["type"]
        return schema

    # Fallback for synced/external data source databases (e.g. Notion Social)
    print("   (Synced database detected -- discovering schema from first row)")
    response = notion.databases.query(database_id=database_id, page_size=1)
    if not response.get("results"):
        print("ERROR: Database returned no rows. Cannot discover schema.")
        sys.exit(1)

    page = response["results"][0]
    schema = {}
    for prop_name, prop_data in page.get("properties", {}).items():
        schema[prop_name] = prop_data["type"]
    return schema


def save_schema(schema):
    """Save schema to JSON for reference."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "discovered_at": datetime.now(timezone.utc).isoformat(),
        "database_id": NOTION_DATABASE_ID,
        "properties": schema,
    }
    SCHEMA_FILE.write_text(json.dumps(payload, indent=2))
    print("Schema saved to {}".format(SCHEMA_FILE))


def load_cached_schema():
    """Load previously saved schema, if it exists."""
    if SCHEMA_FILE.exists():
        data = json.loads(SCHEMA_FILE.read_text())
        return data.get("properties")
    return None


# ---------------------------------------------------------------------------
# PULL COMMAND
# ---------------------------------------------------------------------------

def pull(notion, database_id):
    """
    Pull all rows from the Notion database, paginating through results.
    Saves structured JSON to data/notion_export.json.
    """
    print("Pulling from Notion database {}...".format(database_id[:8]))

    # Auto-discover schema on every pull (ensures freshness)
    schema = get_schema(notion, database_id)
    save_schema(schema)
    print("   Schema: {} properties discovered".format(len(schema)))

    # Paginate through all rows
    all_pages = []
    has_more = True
    cursor = None
    page_count = 0

    while has_more:
        kwargs = {"database_id": database_id, "page_size": 100}
        if cursor:
            kwargs["start_cursor"] = cursor

        response = notion.databases.query(**kwargs)
        all_pages.extend(response["results"])
        has_more = response.get("has_more", False)
        cursor = response.get("next_cursor")
        page_count += 1
        print("   Page {}: {} rows (total: {})".format(page_count, len(response["results"]), len(all_pages)))

    # Convert to structured JSON
    posts = []
    for page in all_pages:
        post = {
            "notion_id": page["id"],
            "created_time": page.get("created_time"),
            "last_edited_time": page.get("last_edited_time"),
            "url": page.get("url"),
        }

        # Extract every property dynamically
        for prop_name, prop_data in page.get("properties", {}).items():
            json_key = prop_name.lower().replace(" ", "_")
            post[json_key] = extract_property_value(prop_data)

        posts.append(post)

    # Sort by date (most recent first), handling None dates
    def sort_key(p):
        date_val = p.get("time") or p.get("date")
        if isinstance(date_val, dict):
            return date_val.get("start") or ""
        return str(date_val) if date_val else ""

    posts.sort(key=sort_key, reverse=True)

    # Save
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    export = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "database_id": database_id,
        "total_rows": len(posts),
        "schema": schema,
        "posts": posts,
    }
    EXPORT_FILE.write_text(json.dumps(export, indent=2, ensure_ascii=False))
    print("\nExported {} posts to {}".format(len(posts), EXPORT_FILE))

    # Quick summary stats
    statuses = {}
    for p in posts:
        status = p.get("post_status") or p.get("status") or "Unknown"
        statuses[status] = statuses.get(status, 0) + 1
    print("\nStatus breakdown:")
    for status, count in sorted(statuses.items(), key=lambda x: -x[1]):
        print("   {}: {}".format(status, count))

    return posts


# ---------------------------------------------------------------------------
# PUSH COMMAND
# ---------------------------------------------------------------------------

# Verified mapping: schedule JSON keys -> Notion property names
# Schema: Name(title), Content Type(select), Time(date), Campaign(select),
# Phase(select), Post Status(status), Platforms(multi_select),
# Post Caption(rich_text), Idea(rich_text), Post URL(rich_text),
# Likes/Comments/Shares/Views(number), Media(files), Assigned(people),
# Publish Status(select), Notionsocial(rich_text), Media 1(rich_text),
# Sourced Assets(rich_text), Asset For Reviewal(rich_text)

PUSH_KEY_MAP = {
    "name": "Name",
    "platform": "Platforms",
    "content_type": "Content Type",
    "date": "Time",
    "campaign": "Campaign",
    "phase": "Phase",
    "status": "Post Status",
    "caption": "Post Caption",
    "idea": "Idea",
    "post_url": "Post URL",
    "publish_status": "Publish Status",
}


def find_page_by_name(notion, database_id, name):
    """Find an existing page by its Name (title) property."""
    try:
        results = notion.databases.query(
            database_id=database_id,
            filter={"property": "Name", "title": {"equals": name}},
        )
        if results["results"]:
            return results["results"][0]
    except APIResponseError as e:
        print("  Error searching for '{}': {}".format(name, e))
    return None


def push(notion, database_id, schedule_file):
    """
    Push a schedule JSON file to Notion.
    Creates new pages or updates existing ones (matched by Name).
    """
    schedule_path = Path(schedule_file)
    if not schedule_path.exists():
        print("File not found: {}".format(schedule_file))
        sys.exit(1)

    schedule = json.loads(schedule_path.read_text())
    posts = schedule.get("posts", [])
    if not posts:
        print("No posts found in schedule file.")
        sys.exit(1)

    # Load schema to know property types
    schema = load_cached_schema()
    if not schema:
        print("No cached schema -- discovering...")
        schema = get_schema(notion, database_id)
        save_schema(schema)

    print("Pushing {} posts to Notion...\n".format(len(posts)))

    created = 0
    updated = 0
    errors = 0

    for i, post in enumerate(posts, 1):
        name = post.get("name", "Untitled-{}".format(i))
        print("  [{}/{}] {}".format(i, len(posts), name))

        # Build properties payload
        properties = {}
        for json_key, notion_prop in PUSH_KEY_MAP.items():
            if json_key not in post:
                continue
            if notion_prop not in schema:
                print("    Warning: Property '{}' not found in schema -- skipping".format(notion_prop))
                continue

            value = post[json_key]
            prop_type = schema[notion_prop]
            payload = build_property_payload(notion_prop, value, prop_type)
            if payload:
                properties[notion_prop] = payload

        if not properties:
            print("    Warning: No valid properties to set -- skipping")
            errors += 1
            continue

        try:
            existing = find_page_by_name(notion, database_id, name)

            if existing:
                notion.pages.update(
                    page_id=existing["id"],
                    properties=properties,
                )
                print("    Updated (page {}...)".format(existing["id"][:8]))
                updated += 1
            else:
                notion.pages.create(
                    parent={"database_id": database_id},
                    properties=properties,
                )
                print("    Created")
                created += 1

        except APIResponseError as e:
            print("    API Error: {}".format(e))
            errors += 1

    print("\nPush complete: {} created, {} updated, {} errors".format(created, updated, errors))


# ---------------------------------------------------------------------------
# SHUFFLE COMMAND (Phase 3 placeholder)
# ---------------------------------------------------------------------------

def shuffle(args):
    """Phase 3 placeholder -- will insert urgent posts and auto-shift schedule."""
    print("Shuffle is a Phase 3 feature.")
    print("   It will:")
    print("   1. Pull current schedule from Notion")
    print("   2. Insert an urgent post on a specified date")
    print("   3. Run cadence validator")
    print("   4. Shift displaced posts to maintain valid cadence")
    print("   5. Show proposed changes for approval")
    print("   6. Push approved changes to Notion")
    print()
    print("   Usage (future):")
    print('   python notion_sync.py shuffle --urgent "TITAN_BreakingNews" --date "2026-03-15"')
    sys.exit(0)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def validate_env():
    """Check required environment variables are set."""
    missing = []
    if not NOTION_API_KEY:
        missing.append("NOTION_API_KEY")
    if not NOTION_DATABASE_ID:
        missing.append("NOTION_DATABASE_ID")

    if missing:
        print("Missing environment variables: {}".format(", ".join(missing)))
        print()
        print("Set them via:")
        print("  export NOTION_API_KEY=ntn_...")
        print("  export NOTION_DATABASE_ID=abc123...")
        print()
        print("Or create a .env file in the repo root.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Titan Content Ops -- Notion Sync",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python notion_sync.py discover           # Show database schema
  python notion_sync.py pull               # Export all posts to JSON
  python notion_sync.py push schedule.json # Push planned posts to Notion
  python notion_sync.py shuffle            # (Phase 3 -- not yet implemented)
        """,
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # discover
    subparsers.add_parser("discover", help="Discover and display Notion database schema")

    # pull
    subparsers.add_parser("pull", help="Pull all rows from Notion to data/notion_export.json")

    # push
    push_parser = subparsers.add_parser("push", help="Push schedule JSON to Notion")
    push_parser.add_argument("file", help="Path to schedule JSON file")

    # shuffle (placeholder)
    shuffle_parser = subparsers.add_parser("shuffle", help="(Phase 3) Insert urgent post and rebalance")
    shuffle_parser.add_argument("--urgent", help="Post name to insert urgently")
    shuffle_parser.add_argument("--date", help="Target date (YYYY-MM-DD)")
    shuffle_parser.add_argument("--platform", help="Platform identifier")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "shuffle":
        shuffle(args)
        return

    # All other commands need Notion connection
    validate_env()
    notion = Client(auth=NOTION_API_KEY)

    if args.command == "discover":
        schema = get_schema(notion, NOTION_DATABASE_ID)
        save_schema(schema)
        print("\nDatabase schema ({} properties):\n".format(len(schema)))
        sorted_props = sorted(schema.items(), key=lambda x: (x[1] != "title", x[0].lower()))
        for prop_name, prop_type in sorted_props:
            print("   {}: {}".format(prop_name, prop_type))

    elif args.command == "pull":
        pull(notion, NOTION_DATABASE_ID)

    elif args.command == "push":
        push(notion, NOTION_DATABASE_ID, args.file)


if __name__ == "__main__":
    main()
