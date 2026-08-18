#!/usr/bin/env python3
"""
Titan Content Calendar — live dashboard generator.

Reads data/notion/notion_export.json (refreshed daily 6am UTC by
.github/workflows/notion-sync.yml) and writes a single self-contained HTML file
to dashboard/index.html.

"Live" = regenerated every time the Notion sync runs. No server, no API key in
the browser, no build step. Open the HTML and you are looking at this morning's
Notion.

Usage:
    python scripts/build-calendar-dashboard.py
    python scripts/build-calendar-dashboard.py --days 28
    python scripts/build-calendar-dashboard.py --out dashboard/index.html

Cadence rule enforced (5.9): Titan PMR = Mon/Wed/Fri, Titanverse = Tue/Thu.
Weekends are off-grid and are not counted as violations.
"""

import argparse
import html
import json
import os
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = os.path.join(ROOT, "data", "notion", "notion_export.json")

PMR = "LI-PAGE@titanpmr"
TV = "LI-PAGE@titanverse"

# 5.9 cadence: weekday index (Mon=0) -> expected LinkedIn brand
CADENCE = {0: "PMR", 1: "TV", 2: "PMR", 3: "TV", 4: "PMR"}

LIVE_STATUSES = ["Idea", "In Production", "Sign-off", "Ready", "Posted"]
STATUS_COLOUR = {
    "Idea": "#8b8f9a",
    "In Production": "#d99a2b",
    "Sign-off": "#e0533d",
    "Ready": "#2f7fe0",
    "Posted": "#2fa36b",
    "Archive": "#4a4d57",
}

# Source tokens for the 21-day crossover check. A "source" is the person or
# place a post draws from; two posts off the same source inside 21 days is a
# blocked repeat per the house rule.
SOURCE_TOKENS = [
    "MartonRoad", "Marton Road", "Attleborough", "ButtLane", "Butt Lane",
    "Hooman", "Wahid", "Tariq", "Sajid", "Amrik", "Jaya", "Stuart", "Raj",
    "Moin", "Prab", "Shabbos", "Nas", "Ghulam", "Holden", "Rahul", "Dervis",
    "Geoff", "Jeet", "Hamal", "Steffan", "Glen", "Hertfordshire", "BD Rowa",
    "Meditech", "PharmAppy", "Avonnex",
]


def load_posts():
    with open(EXPORT) as f:
        data = json.load(f)
    return data.get("posts", []), data.get("exported_at", "")


def post_date(p):
    t = p.get("time") or {}
    s = t.get("start")
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return datetime.strptime(s[:10], "%Y-%m-%d").date()
        except ValueError:
            return None


def brand_of(p):
    plats = p.get("platforms") or []
    if PMR in plats and TV in plats:
        return "BOTH"
    if PMR in plats:
        return "PMR"
    if TV in plats:
        return "TV"
    return None  # non-LinkedIn only; does not touch the 5.9 grid


def sources_of(p):
    """Sources this post draws on.

    House rule says search Idea + Caption, not just Name. But a passing mention
    of a name inside a long design brief is not the same as a post being sourced
    from that person, so we return two tiers and require at least one post in a
    pair to be *named* for it to count as a crossover.
    """
    name_blob = str(p.get("name") or "")
    body_blob = " ".join(str(p.get(k) or "") for k in ("idea", "post_caption"))
    named, mentioned = set(), set()
    for tok in SOURCE_TOKENS:
        key = tok.replace(" ", "")
        pat = re.escape(tok)
        if re.search(pat, name_blob, re.IGNORECASE):
            named.add(key)
        elif re.search(pat, body_blob, re.IGNORECASE):
            mentioned.add(key)
    return named, mentioned


def check_cadence(by_day, start, end):
    """Return list of (date, kind, detail) cadence problems on weekdays."""
    issues = []
    d = start
    while d <= end:
        wd = d.weekday()
        if wd in CADENCE:
            expected = CADENCE[wd]
            posts = [p for p in by_day.get(d, []) if brand_of(p) in ("PMR", "TV", "BOTH")
                     and p.get("post_status") not in ("Archive",)]
            brands = {brand_of(p) for p in posts}
            if not posts:
                issues.append((d, "empty", f"{expected} slot has no LinkedIn post"))
            else:
                wrong = brands - {expected, "BOTH"}
                if wrong:
                    issues.append((d, "wrong-brand",
                                   f"expected {expected}, found {'/'.join(sorted(wrong))}"))
        d += timedelta(days=1)
    return issues


def check_crossover(posts, window=21):
    """Same source used twice inside `window` days = block."""
    dated = sorted(
        [(post_date(p), p) for p in posts
         if post_date(p) and p.get("post_status") not in ("Archive",)],
        key=lambda x: x[0],
    )
    hits, seen = [], set()
    for i, (d1, p1) in enumerate(dated):
        n1, m1 = sources_of(p1)
        if not (n1 or m1):
            continue
        for d2, p2 in dated[i + 1:]:
            if (d2 - d1).days > window:
                break
            n2, m2 = sources_of(p2)
            # a real crossover needs the source in at least one post's NAME
            shared = (n1 & (n2 | m2)) | (n2 & (n1 | m1))
            if not shared:
                continue
            key = (p1.get("notion_id"), p2.get("notion_id"))
            if key in seen:
                continue
            seen.add(key)
            # hard = both posts named for the source (a genuine repeat)
            # soft = one named, the other only mentions it (eyeball it)
            hard = bool(n1 & n2)
            hits.append((d1, p1, d2, p2, sorted(shared), hard))
    return hits


def esc(s):
    return html.escape(str(s or ""))


def pill(status):
    c = STATUS_COLOUR.get(status, "#666")
    return f'<span class="pill" style="--c:{c}">{esc(status)}</span>'


def build_html(posts, exported_at, days):
    today = date.today()
    end = today + timedelta(days=days - 1)

    by_day = defaultdict(list)
    for p in posts:
        d = post_date(p)
        if d:
            by_day[d].append(p)

    window = [p for p in posts
              if post_date(p) and today <= post_date(p) <= end
              and p.get("post_status") != "Archive"]

    status_counts = Counter(p.get("post_status") or "—" for p in window)
    cadence_issues = check_cadence(by_day, today, end)
    crossover = [h for h in check_crossover(posts) if today <= h[0] <= end]

    li_window = [p for p in window if brand_of(p)]
    pmr_n = sum(1 for p in li_window if brand_of(p) in ("PMR", "BOTH"))
    tv_n = sum(1 for p in li_window if brand_of(p) in ("TV", "BOTH"))

    # ---- KPI cards
    kpis = [
        ("Posts scheduled", len(window), f"next {days} days"),
        ("At Sign-off", status_counts.get("Sign-off", 0), "awaiting your push"),
        ("Still at Idea", status_counts.get("Idea", 0), "needs writing or review"),
        ("Cadence flags", len(cadence_issues), "5.9 grid, weekdays only"),
        ("Crossover flags", len(crossover), "same source inside 21 days"),
        ("PMR / Verse", f"{pmr_n} / {tv_n}", "LinkedIn split in window"),
    ]
    kpi_html = "".join(
        f'<div class="kpi"><div class="kpi-n">{esc(v)}</div>'
        f'<div class="kpi-l">{esc(l)}</div><div class="kpi-s">{esc(s)}</div></div>'
        for l, v, s in kpis
    )

    # ---- Calendar strip
    cal_rows = []
    d = today
    while d <= end:
        wd = d.weekday()
        expected = CADENCE.get(wd)
        dayposts = [p for p in by_day.get(d, []) if p.get("post_status") != "Archive"]
        issue = next((i for i in cadence_issues if i[0] == d), None)
        cls = "day"
        if wd >= 5:
            cls += " weekend"
        if issue:
            cls += " flagged" if issue[1] == "wrong-brand" else " empty"

        items = ""
        for p in sorted(dayposts, key=lambda x: x.get("name") or ""):
            b = brand_of(p)
            tag = {"PMR": "PMR", "TV": "VERSE", "BOTH": "BOTH"}.get(b, "—")
            tagc = {"PMR": "#2f7fe0", "TV": "#8b5cf6", "BOTH": "#e0533d"}.get(b, "#555")
            items += (
                f'<div class="item">'
                f'<span class="brand" style="--c:{tagc}">{tag}</span>'
                f'<span class="nm">{esc(p.get("name"))}</span>'
                f'{pill(p.get("post_status"))}</div>'
            )
        if not items:
            items = '<div class="item muted">nothing scheduled</div>'

        cal_rows.append(
            f'<div class="{cls}">'
            f'<div class="dh"><span class="dd">{d.strftime("%a %-d %b")}</span>'
            f'<span class="exp">{expected or "off-grid"}</span></div>'
            f'{items}'
            + (f'<div class="flag">{esc(issue[2])}</div>' if issue else "")
            + "</div>"
        )
        d += timedelta(days=1)

    # ---- Pipeline
    pipe = "".join(
        f'<div class="prow"><span class="plabel">{esc(s)}</span>'
        f'<span class="pbar" style="--c:{STATUS_COLOUR.get(s,"#666")};'
        f'--w:{(status_counts.get(s,0)/max(1,max(status_counts.values() or [1]))*100):.0f}%"></span>'
        f'<span class="pn">{status_counts.get(s,0)}</span></div>'
        for s in LIVE_STATUSES
    )

    # ---- Flags
    if cadence_issues:
        cad = "".join(
            f'<li><b>{i[0].strftime("%a %-d %b")}</b> — {esc(i[2])}</li>'
            for i in cadence_issues
        )
    else:
        cad = '<li class="ok">No cadence problems in this window.</li>'

    hard_cx = [h for h in crossover if h[5]]
    soft_cx = [h for h in crossover if not h[5]]

    def cx_li(h, cls=""):
        return (f'<li class="{cls}"><b>{esc(", ".join(h[4]))}</b> — '
                f'{esc(h[1].get("name"))} ({h[0]:%-d %b}) and '
                f'{esc(h[3].get("name"))} ({h[2]:%-d %b}), '
                f'{(h[2]-h[0]).days} days apart</li>')

    if hard_cx:
        cx = "".join(cx_li(h) for h in hard_cx)
    else:
        cx = '<li class="ok">No hard same-source repeats inside 21 days.</li>'
    if soft_cx:
        cx += (f'</ul><details><summary>{len(soft_cx)} soft flags '
               f'(source named in one post, only mentioned in the other)'
               f'</summary><ul class="soft">'
               + "".join(cx_li(h) for h in soft_cx[:25]) + "</ul></details><ul>")

    stamp = (exported_at or "")[:16].replace("T", " ")
    gen = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Staleness banner. If the daily Notion sync has stopped running, every
    # number on this page is wrong and you need to know that first.
    banner = ""
    try:
        exp_d = datetime.fromisoformat(exported_at.replace("Z", "+00:00")).date()
        age = (today - exp_d).days
        if age > 2:
            banner = (
                f'<div class="stale"><b>Stale data: this export is {age} days old.</b> '
                f'The daily Notion sync (<code>.github/workflows/notion-sync.yml</code>, '
                f'6am UTC) last wrote on {exp_d:%-d %b}. Anything changed in Notion since '
                f'then is not on this page. Re-run the workflow, then rebuild.</div>'
            )
    except (ValueError, AttributeError):
        banner = ('<div class="stale"><b>Unknown export date.</b> '
                  'Could not read <code>exported_at</code> from the Notion export.</div>')

    return f"""<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Titan Content Calendar</title>
<style>
*{{box-sizing:border-box}}
body{{margin:0;background:#0d1117;color:#e6edf3;
font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}}
.wrap{{max-width:1240px;margin:0 auto;padding:32px 24px 64px}}
h1{{font-size:22px;margin:0 0 4px;letter-spacing:-.01em}}
.sub{{color:#7d8590;font-size:13px;margin-bottom:28px}}
.sub b{{color:#adbac7;font-weight:600}}
h2{{font-size:13px;text-transform:uppercase;letter-spacing:.08em;
color:#7d8590;margin:36px 0 14px;font-weight:600}}
.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}}
.kpi{{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:16px 18px}}
.kpi-n{{font-size:28px;font-weight:600;letter-spacing:-.02em;line-height:1.1}}
.kpi-l{{font-size:13px;color:#adbac7;margin-top:6px}}
.kpi-s{{font-size:11px;color:#6e7681;margin-top:2px}}
.cal{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}}
.day{{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:12px 14px;min-height:104px}}
.day.weekend{{background:#12161d;border-style:dashed}}
.day.flagged{{border-color:#e0533d}}
.day.empty{{border-color:#3d3418}}
.dh{{display:flex;justify-content:space-between;align-items:baseline;
margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid #21262d}}
.dd{{font-weight:600;font-size:13px}}
.exp{{font-size:10px;color:#6e7681;text-transform:uppercase;letter-spacing:.06em}}
.item{{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0;font-size:12px}}
.item.muted{{color:#484f58;font-style:italic}}
.brand{{background:var(--c);color:#fff;font-size:9px;font-weight:700;
padding:1px 5px;border-radius:3px;letter-spacing:.04em}}
.nm{{flex:1;min-width:110px;color:#c9d1d9;word-break:break-word;font-size:11.5px}}
.pill{{background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);
border:1px solid color-mix(in srgb,var(--c) 45%,transparent);
font-size:9.5px;padding:1px 6px;border-radius:20px;white-space:nowrap;font-weight:600}}
.flag{{margin-top:8px;font-size:10.5px;color:#f0883e;
background:#2d1e0f;padding:4px 7px;border-radius:5px}}
.prow{{display:flex;align-items:center;gap:12px;margin:7px 0}}
.plabel{{width:110px;font-size:12px;color:#adbac7}}
.pbar{{height:9px;width:var(--w);min-width:3px;background:var(--c);border-radius:5px;
flex-shrink:0;transition:width .3s}}
.pn{{font-size:12px;color:#7d8590;font-variant-numeric:tabular-nums}}
ul{{margin:0;padding-left:18px}}
li{{margin:5px 0;color:#c9d1d9;font-size:12.5px}}
li.ok{{color:#3fb950;list-style:none;margin-left:-18px}}
ul.soft li{{color:#8b8f9a;font-size:11.5px}}
details{{margin-top:8px}}
summary{{cursor:pointer;color:#7d8590;font-size:12px;padding:4px 0}}
summary:hover{{color:#adbac7}}
.stale{{background:#2d1e0f;border:1px solid #f0883e;color:#f0c48e;
padding:12px 16px;border-radius:8px;margin-bottom:24px;font-size:12.5px;line-height:1.6}}
.stale b{{color:#f0883e}}
code{{background:#21262d;padding:1px 5px;border-radius:4px;font-size:11px}}
.cols{{display:grid;grid-template-columns:1fr 1fr;gap:32px}}
@media(max-width:820px){{.cols{{grid-template-columns:1fr}}}}
footer{{margin-top:48px;padding-top:16px;border-top:1px solid #21262d;
color:#484f58;font-size:11px}}
</style></head><body><div class="wrap">

<h1>Titan Content Calendar</h1>
<div class="sub">Notion data as of <b>{esc(stamp)}</b> &middot;
dashboard rebuilt <b>{esc(gen)}</b> &middot; window: next {days} days from
{today:%-d %b %Y}</div>

{banner}

<div class="kpis">{kpi_html}</div>

<h2>The next {days} days</h2>
<div class="cal">{''.join(cal_rows)}</div>

<div class="cols">
<div><h2>Pipeline</h2>{pipe}</div>
<div><h2>5.9 cadence flags</h2><ul>{cad}</ul>
<h2>21-day source crossover</h2><ul>{cx}</ul></div>
</div>

<footer>Generated by <code>scripts/build-calendar-dashboard.py</code> from
<code>data/notion/notion_export.json</code>. Rebuilds automatically after every
Notion sync (daily, 6am UTC). Cadence rule: PMR Mon/Wed/Fri, Titanverse Tue/Thu;
weekends off-grid. Archived posts excluded throughout.</footer>

</div></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=21)
    ap.add_argument("--out", default=os.path.join(ROOT, "dashboard", "index.html"))
    args = ap.parse_args()

    posts, exported_at = load_posts()
    out = build_html(posts, exported_at, args.days)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        f.write(out)
    print(f"Wrote {args.out} ({len(out):,} bytes) from {len(posts)} posts "
          f"(export {exported_at[:10]})")


if __name__ == "__main__":
    main()
