#!/usr/bin/env node
/**
 * Ingest a Metricool CSV export into per-post metrics.json files.
 *
 * Profiles are detected from the CSV header, so a new drop from Metricool
 * needs no code change — point this at the folder and run it.
 *
 * What it writes, per matched post, under metrics.json `.signals`:
 *   format      — canonical format tag (see lib/format-signals.js)
 *   role        — advocacy / sector-thesis / standard
 *   components  — raw counts, plus availability flags per platform
 *   measured    — the format's primary signal components with raw values
 *
 * Percentiles and tier flags are NOT set here. They need the whole cohort, so
 * they come from compute-format-percentiles.js, which must run afterwards.
 *
 * It also corrects impressions when a fresh CSV is >20% higher than what we
 * hold — posts keep accruing after a sync. Never downward: a smaller vendor
 * number is nearly always a reporting-window artefact, and silently deleting
 * real impressions is unrecoverable. Every substitution is logged.
 *
 * Additive by design: never deletes a field, never touches caption.md,
 * meta.json, alt-text.md, transcript.md or comments.md.
 *
 * Usage:
 *   node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics [--dry-run]
 *   node scripts/ingest-metricool-csv.js --csv path/to/one.csv [--dry-run]
 *
 * See docs/format-signals-definition.md.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { resolveFormat, resolveRole, buildSignals, num, SPEC_VERSION } = require('./lib/format-signals');

const REPO = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SYNCED_AT = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// Manual role overrides: { "<post-slug>": "advocacy" | "sector-thesis" | "standard" }
const ROLE_OVERRIDE_PATH = path.join(REPO, 'analytics', 'post-roles.json');
let ROLE_OVERRIDES = {};
if (fs.existsSync(ROLE_OVERRIDE_PATH)) {
  try { ROLE_OVERRIDES = JSON.parse(fs.readFileSync(ROLE_OVERRIDE_PATH, 'utf-8')); } catch {}
}

// ── CSV profiles ────────────────────────────────────────────────────────
// `detect` keys on a header column unique to that export shape.
// `map` returns canonical components. `*_available` flags distinguish a real
// zero from "this export has no such column", which otherwise silently
// deflates a format's signal.

const PROFILES = [
  {
    name: 'linkedin-posts',
    platform: 'linkedin',
    isReel: false,
    detect: (h) => h.includes('Vid. Views') && h.includes('Impressions'),
    postDirs: ['posts/linkedin/titan/published', 'posts/linkedin/titanverse/published'],
    dateKey: 'Date', titleKey: 'Title', urlKey: 'URL', typeKey: 'Type',
    map: (r) => ({
      impressions: num(r.Impressions),
      reach: 0,
      reactions: num(r.Reactions),
      comments: num(r.Comments),
      reposts: num(r.Shares),
      saves: 0,
      clicks: num(r.Clicks),
      video_views: num(r['Vid. Views']),
      avg_watch_time_seconds: num(r['Vid. Views']) > 0 ? num(r['Time Watched']) / num(r['Vid. Views']) : 0,
      duration_seconds: 0,          // LinkedIn export carries no duration
      clicks_available: true,
      saves_available: false,        // LinkedIn does not report saves
    }),
  },
  {
    name: 'instagram-posts',
    platform: 'instagram',
    isReel: false,
    detect: (h) => h.includes('Saved') && h.includes('Interactions'),
    postDirs: ['posts/instagram/published'],
    dateKey: 'Timestamp', titleKey: 'Content', urlKey: 'URL', typeKey: 'type',
    map: (r) => ({
      impressions: num(r.Views),
      reach: num(r['Reach (Organic)']),
      reactions: num(r.Likes),
      comments: num(r.Comments),
      reposts: num(r.Shares),
      saves: num(r.Saved),
      clicks: 0,
      video_views: 0,
      avg_watch_time_seconds: 0,
      duration_seconds: 0,
      clicks_available: false,
      saves_available: true,
    }),
  },
  {
    name: 'instagram-reels',
    platform: 'instagram',
    isReel: true,
    detect: (h) => h.includes('Saved (Organic)'),
    postDirs: ['posts/instagram/published'],
    dateKey: 'date', titleKey: 'title', urlKey: 'URL', typeKey: null,
    map: (r) => ({
      impressions: num(r.Views),
      reach: num(r['Reach (Organic)']),
      reactions: num(r['Likes (Organic)']),
      comments: num(r['Comments (Organic)']),
      reposts: num(r['Shares (Organic)']) + num(r.Reposts),
      saves: num(r['Saved (Organic)']),
      clicks: 0,
      video_views: num(r.Views),
      // Metricool reports reel watch time in milliseconds.
      avg_watch_time_seconds: num(r['Avg Watch Time (Organic)']) / 1000,
      duration_seconds: 0,
      clicks_available: false,
      saves_available: true,
    }),
  },
  {
    name: 'facebook-posts',
    platform: 'facebook',
    isReel: false,
    detect: (h) => h.includes('Shared') && h.includes('LinkClicks'),
    postDirs: ['posts/facebook/published'],
    dateKey: 'Date', titleKey: 'Content', urlKey: 'PostLink', typeKey: 'Type',
    map: (r) => ({
      impressions: num(r['Impressions (Organic)']) || num(r.Impressions),
      reach: num(r['Reach (Organic)']) || num(r.Reach),
      reactions: num(r.Reactions),
      comments: num(r.Comments),
      reposts: num(r.Shared),
      saves: 0,
      clicks: num(r.Clicks),
      video_views: num(r['VideoViews (Organic)']) || num(r.VideoViews),
      avg_watch_time_seconds: 0,
      duration_seconds: 0,
      clicks_available: true,
      saves_available: false,
    }),
  },
  {
    name: 'facebook-reels',
    platform: 'facebook',
    isReel: true,
    detect: (h) => h.includes('Reel Link'),
    postDirs: ['posts/facebook/published'],
    dateKey: 'Date', titleKey: 'Content', urlKey: 'Reel Link', typeKey: null,
    map: (r) => ({
      impressions: num(r['Video Views']),
      reach: num(r.Reach),
      reactions: num(r.Likes),
      comments: num(r.Comments),
      reposts: 0,
      saves: 0,
      clicks: 0,
      video_views: num(r['Video Views']),
      avg_watch_time_seconds: num(r['Avg. time watched (Seconds)']),
      duration_seconds: 0,
      clicks_available: false,
      saves_available: false,
      // The reels export has no shares column at all. Short-form scores on
      // share rate, so this must be visible rather than read as zero.
      reposts_available: false,
    }),
  },
  {
    name: 'tiktok-posts',
    platform: 'tiktok',
    isReel: true,
    detect: (h) => h.includes('Duration') && h.includes('Views'),
    postDirs: ['posts/tiktok/published'],
    dateKey: 'Date', titleKey: 'Title', urlKey: 'URL', typeKey: 'Type',
    map: (r) => ({
      impressions: num(r.Views),
      reach: 0,
      reactions: num(r.Likes),
      comments: num(r.Comments),
      reposts: num(r.Shares),
      saves: 0,
      clicks: 0,
      video_views: num(r.Views),
      avg_watch_time_seconds: 0,
      duration_seconds: num(r.Duration),
      clicks_available: false,
      saves_available: false,
    }),
  },
];

// ── Matching ────────────────────────────────────────────────────────────

function normText(s) {
  return String(s || '').toLowerCase().replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();
}
const tokens = (s) => normText(s).split(' ').filter((w) => w.length > 2);

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function urlKeyOf(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  const m = s.match(/(\d{15,})/);
  return m ? m[1] : s.split('?')[0].replace(/\/$/, '').toLowerCase();
}

function loadDirIndex(relDirs) {
  const list = [];
  for (const rel of relDirs) {
    const dir = path.join(REPO, rel);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.startsWith('.') || name.startsWith('_')) continue;
      const p = path.join(dir, name);
      if (!fs.statSync(p).isDirectory()) continue;
      const m = name.match(/^(\d{4}-\d{2}-\d{2})-(.*)$/);
      if (!m) continue;

      let captionBody = '';
      const capPath = path.join(p, 'caption.md');
      if (fs.existsSync(capPath)) {
        const raw = fs.readFileSync(capPath, 'utf-8');
        const parts = raw.split(/^---\s*$/m);
        captionBody = parts.length > 1 ? parts.slice(1).join('---') : raw;
      }

      let metrics = null;
      const metPath = path.join(p, 'metrics.json');
      if (fs.existsSync(metPath)) {
        try { metrics = JSON.parse(fs.readFileSync(metPath, 'utf-8')); } catch {}
      }
      let meta = {};
      const metaPath = path.join(p, 'meta.json');
      if (fs.existsSync(metaPath)) {
        try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch {}
      }

      list.push({
        dir: p, slug: name, date: m[1],
        captionTokens: tokens(captionBody).slice(0, 60),
        slugTokens: tokens(m[2].replace(/-/g, ' ')),
        urlKey: urlKeyOf((metrics || {}).post_url),
        metricsPath: metPath, metrics, meta,
      });
    }
  }
  return list;
}

function findMatch(candidates, csvDate, csvTitle, csvUrl) {
  const uk = urlKeyOf(csvUrl);
  if (uk) {
    const byUrl = candidates.find((c) => c.urlKey && c.urlKey === uk);
    if (byUrl) return { candidate: byUrl, score: 1, reason: 'url' };
  }
  const csvTokens = tokens(csvTitle).slice(0, 60);
  const score = (c) => Math.max(jaccard(csvTokens, c.captionTokens), jaccard(csvTokens, c.slugTokens));

  const sameDay = candidates.filter((c) => c.date === csvDate).map((c) => ({ c, s: score(c) }));
  sameDay.sort((a, b) => b.s - a.s);
  if (sameDay.length && sameDay[0].s >= 0.15) return { candidate: sameDay[0].c, score: sameDay[0].s, reason: 'date+title' };

  const nearby = candidates
    .filter((c) => c.date !== csvDate && Math.abs(new Date(c.date) - new Date(csvDate)) <= 86400000)
    .map((c) => ({ c, s: score(c) }));
  nearby.sort((a, b) => b.s - a.s);
  if (nearby.length && nearby[0].s >= 0.35) return { candidate: nearby[0].c, score: nearby[0].s, reason: 'nearby+title' };
  return null;
}

function readHeldImpressions(m) {
  if (!m) return 0;
  const api = m.platform_api || {};
  return num(m.impressions) || num((m.organic || {}).impressions) || num(api.impressions)
    || num((api.organic || {}).impressions) || 0;
}

function applyImpressions(m, value) {
  if (m.impressions !== undefined) m.impressions = value;
  if (m.organic && m.organic.impressions !== undefined) m.organic.impressions = value;
  if (m.platform_api) {
    if (m.platform_api.impressions !== undefined) m.platform_api.impressions = value;
    if (m.platform_api.organic && m.platform_api.organic.impressions !== undefined) {
      m.platform_api.organic.impressions = value;
    }
  }
}

/** Strip the retired engagement-rate fields wherever they appear. */
function retireEngagementRate(m) {
  let removed = 0;
  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const k of ['engagement_rate', 'engagement_rate_deprecated_note', 'engagement']) {
      if (obj[k] !== undefined) { delete obj[k]; removed++; }
    }
  };
  scrub(m);
  scrub(m.organic);
  scrub(m.sponsored);
  scrub(m.platform_api);
  if (m.platform_api) scrub(m.platform_api.organic);
  return removed;
}

// ── Ingest ──────────────────────────────────────────────────────────────

function ingestCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(raw, {
    columns: true, skip_empty_lines: true, relax_quotes: true,
    relax_column_count: true, bom: true,
  });
  if (!rows.length) return null;

  const headers = Object.keys(rows[0]);
  const profile = PROFILES.find((p) => p.detect(headers));
  if (!profile) {
    console.warn(`  ! No profile matches ${path.basename(csvPath)} — skipped.`);
    console.warn(`    headers: ${headers.slice(0, 12).join(', ')}`);
    return null;
  }

  const candidates = loadDirIndex(profile.postDirs);
  const res = {
    profile: profile.name, file: path.basename(csvPath), total: rows.length,
    matched: 0, unmatched: 0, written: 0,
    impressionFixes: [], formats: {}, erRemoved: 0, unmatchedRows: [],
  };

  const assigned = new Map();
  for (const row of rows) {
    const date = String(row[profile.dateKey] || '').split(' ')[0];
    if (!date) { res.unmatched++; continue; }
    const match = findMatch(candidates, date, row[profile.titleKey] || '', row[profile.urlKey] || '');
    if (!match) {
      res.unmatched++;
      res.unmatchedRows.push({
        date,
        title: String(row[profile.titleKey] || '').replace(/\s+/g, ' ').slice(0, 70),
        url: row[profile.urlKey] || '',
      });
      continue;
    }
    const prev = assigned.get(match.candidate.dir);
    if (!prev || match.score > prev.match.score) assigned.set(match.candidate.dir, { row, match });
  }

  for (const { row, match } of assigned.values()) {
    res.matched++;
    const c = match.candidate;
    const m = c.metrics ? JSON.parse(JSON.stringify(c.metrics)) : {};
    const components = profile.map(row);

    const held = readHeldImpressions(m);
    const fresh = components.impressions;
    if (held > 0 && fresh > held * 1.2) {
      res.impressionFixes.push({ slug: c.slug, from: held, to: fresh, ratio: +(fresh / held).toFixed(2) });
      applyImpressions(m, fresh);
    } else if (held > 0) {
      // Below the correction threshold: keep the stored figure so every rate
      // is computed against the impressions we actually publish.
      components.impressions = held;
    }

    const { format, source: formatSource } = resolveFormat({
      platform: profile.platform,
      platformType: profile.typeKey ? row[profile.typeKey] : null,
      assetType: c.meta.asset_type || m.asset_type,
      isReel: profile.isReel,
    });

    const { role, source: roleSource } = resolveRole(m.post_type || c.meta.post_type, ROLE_OVERRIDES[c.slug]);
    const built = format ? buildSignals(format, role, components) : null;

    res.erRemoved += retireEngagementRate(m);

    m.signals = {
      spec_version: SPEC_VERSION,
      computed_at: SYNCED_AT,
      source_file: path.basename(csvPath),
      platform: profile.platform,
      format,
      format_source: formatSource,
      role,
      role_source: roleSource,
      components,
      measured: built ? built.measured : [],
      unmeasurable: built ? built.dropped : [],
      // percentile / tier are filled in by compute-format-percentiles.js
      percentiles: null,
      composite_percentile: null,
      tier: null,
      cohort: null,
    };

    res.formats[format || 'unknown'] = (res.formats[format || 'unknown'] || 0) + 1;

    if (!DRY) {
      fs.writeFileSync(c.metricsPath, JSON.stringify(m, null, 2) + '\n', 'utf-8');
      res.written++;
    }
  }

  return res;
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const dir = getArg('--dir');
  const single = getArg('--csv');
  let files = [];
  if (single) files = [single];
  else if (dir) {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv')).sort()
      .map((f) => path.join(dir, f));
  } else {
    console.error('Usage: node scripts/ingest-metricool-csv.js --dir <folder> | --csv <file> [--dry-run]');
    process.exit(1);
  }

  console.log(`Metricool ingest (${DRY ? 'DRY RUN' : 'LIVE'}) — ${files.length} CSV file(s)\n`);

  const all = [];
  for (const f of files) {
    console.log(`→ ${path.basename(f)}`);
    const r = ingestCsv(f);
    if (!r) continue;
    all.push(r);
    console.log(`  profile=${r.profile} rows=${r.total} matched=${r.matched} unmatched=${r.unmatched} written=${r.written}`);
    console.log(`  formats: ${JSON.stringify(r.formats)}`);
    if (r.impressionFixes.length) {
      console.log(`  impressions corrected upward on ${r.impressionFixes.length} post(s):`);
      for (const f2 of r.impressionFixes) console.log(`    ${f2.slug}: ${f2.from} → ${f2.to} (${f2.ratio}x)`);
    }
  }

  console.log('\n─── SUMMARY ───');
  let totMatched = 0, totWritten = 0, totFix = 0, totEr = 0;
  for (const r of all) {
    totMatched += r.matched; totWritten += r.written;
    totFix += r.impressionFixes.length; totEr += r.erRemoved;
    console.log(`${r.profile.padEnd(18)} matched=${String(r.matched).padStart(4)} written=${String(r.written).padStart(4)} imp_fixes=${String(r.impressionFixes.length).padStart(3)}`);
  }
  console.log(`\nTotal: ${totMatched} matched, ${totWritten} written, ${totFix} impression corrections, ${totEr} retired engagement_rate fields removed.`);
  console.log('\nNEXT: node scripts/compute-format-percentiles.js  (tiers are not set until it runs)');

  if (!DRY) {
    const reportPath = path.join(REPO, 'analytics', 'metricool-ingest-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({ synced_at: SYNCED_AT, results: all }, null, 2));
    console.log(`Report: ${reportPath}`);
  }
}

main();
