#!/usr/bin/env python3
"""
Titan Content Ops -- Notion Bidirectional Sync (Phase 1)

Commands:
    python notion_sync.py discover     # Show Notion DB schema
    python notion_sync.py pull         # Pull all rows -> data/notion_export.json
    python notion_sync.py push FILE    # Push schedule JSON -> create/update Notion pages
    python notion_sync.py shuffle ...  # (Phase 3 placeholder)

Environment variables required:
    NOTION_API_KEY       -- Internal integration token (ntn_...)
    NOTION_DATABASE_ID   -- 32-char hex database ID
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

NOTION_API_KEY = os.environ.get("NOTION_API_KEY")
NOTION_DATABASE_ID = os.environ.get("NOTION_DATABASE_ID")

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
EXPORT_FILE = DATA_DIR / "notion_export.json"
SCHEMA_FILE = DATA_DIR / "notion_schema.json"

NOTION_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

# Timeout for all Notion API calls (seconds)
TIMEOUT = httpx.Timeout(60.0, connect=10.0)


def notion_headers():
    return {
        "Authorization": "Bearer " + NOTION_API_KEY,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def notion_get(path):
    """GET request to Notion API."""
    r = httpx.get(NOTION_BASE + path, headers=notion_headers(), timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def notion_post(path, body=None):
    """POST request to Notion API."""
    r = httpx.post(NOTION_BASE + path, headers=notion_headers(), json=body or {}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def notion_patch(path, body=None):
    """PATCH request to Notion API."""
    r = httpx.patch(NOTION_BASE + path, headers=notion_headers(), json=body or {}, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


# ---------------------------------------------------------------------------
# PROPERTY EXTRACTION
# ---------------------------------------------------------------------------

def extract_property_value(prop):
    """Extract a usable Python value from a Notion property object."""
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
        return {"start": d.get("start"), "end": d.get("end"), "time_zone": d.get("time_zone")}

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
        return result

    elif prop_type == "people":
        return [p.get("name", p.get("id", "")) for p in prop.get("people", [])]

    elif prop_type == "relation":
        return [r["id"] for r in prop.get("relation", [])]

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

    elif prop_type == "formula":
        formula = prop.get("formula", {})
        f_type = formula.get("type")
        return formula.get(f_type) if f_type else None

    elif prop_type == "rollup":
        rollup = prop.get("rollup", {})
        rollup_type = rollup.get("type")
        if rollup_type == "number":
            return rollup.get("number")
        elif rollup_type == "array":
            return [extract_property_value(item) for item in rollup.get("array", [])]
        return None

    elif prop_type == "unique_id":
        uid = prop.get("unique_id", {})
        prefix = uid.get("prefix", "")
        number = uid.get("number", "")
        return "{}-{}".format(prefix, number) if prefix else str(number)

    else:
        return "[UNKNOWN: {}]".format(prop_type)


# ---------------------------------------------------------------------------
# PROPERTY BUILDING (for push)
# ---------------------------------------------------------------------------

def build_property_payload(prop_name, value, prop_type):
    """Build a Notion API property payload from a value and known type."""
    if value is None or value == "":
        if prop_type == "title":
            return {"title": []}
        elif prop_type == "rich_text":
            return {"rich_text": []}
        elif prop_type == "number":
            return {"number": None}
        elif prop_type in ("select", "status"):
            return {prop_type: None}
        elif prop_type == "date":
            return {"date": None}
        elif prop_type == "url":
            return {"url": None}
        elif prop_type == "checkbox":
            return {"checkbox": False}
        return {}

    if prop_type == "title":
        return {"title": [{"text": {"content": str(value)}}]}

    elif prop_type == "rich_text":
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

    else:
        print("  Warning: Cannot set '{}' (type '{}')".format(prop_name, prop_type))
        return {}


# ---------------------------------------------------------------------------
# SCHEMA DISCOVERY
# ---------------------------------------------------------------------------

def query_database(database_id, page_size=100, start_cursor=None, filter_obj=None):
    """Query a Notion database using raw HTTP (works with synced databases)."""
    body = {"page_size": page_size}
    if start_cursor:
        body["start_cursor"] = start_cursor
    if filter_obj:
        body["filter"] = filter_obj
    return notion_post("/databases/{}/query".format(database_id), body)


def get_schema(database_id):
    """
    Discover database schema. Tries retrieve endpoint first,
    falls back to reading property types from the first row
    (required for Notion Social synced databases).
    """
    db = notion_get("/databases/{}".format(database_id))

    if "properties" in db and db["properties"]:
        schema = {}
        for prop_name, prop_config in db["properties"].items():
            schema[prop_name] = prop_config["type"]
        return schema

    # Fallback for synced databases
    print("   (Synced database -- reading schema from first row)")
    response = query_database(database_id, page_size=1)
    if not response.get("results"):
        print("ERROR: Database has no rows. Cannot discover schema.")
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

def pull(database_id):
    """Pull all rows from Notion, save to data/notion_export.json."""
    print("Pulling from Notion database {}...".format(database_id[:8]))

    schema = get_schema(database_id)
    save_schema(schema)
    print("   Schema: {} properties discovered".format(len(schema)))

    # Paginate
    all_pages = []
    has_more = True
    cursor = None
    page_count = 0

    while has_more:
        response = query_database(database_id, page_size=100, start_cursor=cursor)
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
        for prop_name, prop_data in page.get("properties", {}).items():
            json_key = prop_name.lower().replace(" ", "_")
            post[json_key] = extract_property_value(prop_data)
        posts.append(post)

    # Sort by date
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

    # Status summary
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


def find_page_by_name(database_id, name):
    """Find an existing page by its Name (title) property."""
    try:
        results = query_database(
            database_id,
            page_size=1,
            filter_obj={"property": "Name", "title": {"equals": name}},
        )
        if results.get("results"):
            return results["results"][0]
    except Exception as e:
        print("  Error searching for '{}': {}".format(name, e))
    return None


def push(database_id, schedule_file):
    """Push a schedule JSON file to Notion (create or update by Name)."""
    schedule_path = Path(schedule_file)
    if not schedule_path.exists():
        print("File not found: {}".format(schedule_file))
        sys.exit(1)

    schedule = json.loads(schedule_path.read_text())
    posts = schedule.get("posts", [])
    if not posts:
        print("No posts found in schedule file.")
        sys.exit(1)

    schema = load_cached_schema()
    if not schema:
        print("No cached schema -- discovering...")
        schema = get_schema(database_id)
        save_schema(schema)

    print("Pushing {} posts to Notion...\n".format(len(posts)))

    created = 0
    updated = 0
    errors = 0

    for i, post in enumerate(posts, 1):
        name = post.get("name", "Untitled-{}".format(i))
        print("  [{}/{}] {}".format(i, len(posts), name))

        properties = {}
        for json_key, notion_prop in PUSH_KEY_MAP.items():
            if json_key not in post:
                continue
            if notion_prop not in schema:
                print("    Warning: '{}' not in schema -- skipping".format(notion_prop))
                continue
            value = post[json_key]
            prop_type = schema[notion_prop]
            payload = build_property_payload(notion_prop, value, prop_type)
            if payload:
                properties[notion_prop] = payload

        if not properties:
            print("    Warning: No valid properties -- skipping")
            errors += 1
            continue

        try:
            existing = find_page_by_name(database_id, name)

            if existing:
                notion_patch("/pages/{}".format(existing["id"]), {"properties": properties})
                print("    Updated (page {}...)".format(existing["id"][:8]))
                updated += 1
            else:
                notion_post("/pages", {
                    "parent": {"database_id": database_id},
                    "properties": properties,
                })
                print("    Created")
                created += 1

        except Exception as e:
            print("    Error: {}".format(e))
            errors += 1

    print("\nPush complete: {} created, {} updated, {} errors".format(created, updated, errors))


# ---------------------------------------------------------------------------
# SHUFFLE (Phase 3 placeholder)
# ---------------------------------------------------------------------------

def shuffle(args):
    print("Shuffle is a Phase 3 feature.")
    print("   1. Pull current schedule")
    print("   2. Insert urgent post")
    print("   3. Run cadence validator")
    print("   4. Shift displaced posts")
    print("   5. Show proposed changes")
    print("   6. Push approved changes")
    sys.exit(0)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def validate_env():
    missing = []
    if not NOTION_API_KEY:
        missing.append("NOTION_API_KEY")
    if not NOTION_DATABASE_ID:
        missing.append("NOTION_DATABASE_ID")
    if missing:
        print("Missing env vars: {}".format(", ".join(missing)))
        print("\nSet via: export NOTION_API_KEY=ntn_...")
        print("Or create a .env file in the repo root.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Titan Content Ops -- Notion Sync",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 notion_sync.py discover           # Show database schema
  python3 notion_sync.py pull               # Export all posts to JSON
  python3 notion_sync.py push schedule.json # Push planned posts to Notion
        """,
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    subparsers.add_parser("discover", help="Show Notion database schema")
    subparsers.add_parser("pull", help="Pull all rows to data/notion_export.json")
    push_p = subparsers.add_parser("push", help="Push schedule JSON to Notion")
    push_p.add_argument("file", help="Path to schedule JSON file")
    shuffle_p = subparsers.add_parser("shuffle", help="(Phase 3) Insert urgent post")
    shuffle_p.add_argument("--urgent", help="Post name")
    shuffle_p.add_argument("--date", help="Target date YYYY-MM-DD")
    shuffle_p.add_argument("--platform", help="Platform ID")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "shuffle":
        shuffle(args)
        return

    validate_env()

    if args.command == "discover":
        schema = get_schema(NOTION_DATABASE_ID)
        save_schema(schema)
        print("\nDatabase schema ({} properties):\n".format(len(schema)))
        sorted_props = sorted(schema.items(), key=lambda x: (x[1] != "title", x[0].lower()))
        for prop_name, prop_type in sorted_props:
            print("   {}: {}".format(prop_name, prop_type))

    elif args.command == "pull":
        pull(NOTION_DATABASE_ID)

    elif args.command == "push":
        push(NOTION_DATABASE_ID, args.file)


if __name__ == "__main__":
    main()
