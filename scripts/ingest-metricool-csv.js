#!/usr/bin/env node
/**
 * Ingest a Metricool CSV export into per-post metrics.json files.
 *
 * Replaces the dated one-off ingest scripts. Profiles are detected from the
 * CSV header, so a new drop from Metricool needs no code change — point this
 * at the folder and run it.
 *
 * What it writes, per matched post:
 *   metrics.json .engagement  — the canonical block from scripts/lib/engagement.js
 *                               (social_er_pct / platform_er_pct / raw_er_pct)
 *   metrics.json .impressions — ONLY when the CSV is >20% higher than what we
 *                               hold, i.e. the post kept accruing after our
 *                               last sync. Every substitution is logged.
 *
 * Everything else in metrics.json is left exactly as found. This script is
 * additive by design: it never deletes a field and never touches caption.md,
 * meta.json, alt-text.md, transcript.md or comments.md.
 *
 * Usage:
 *   node scripts/ingest-metricool-csv.js --dir ~/Downloads/Metrics [--dry-run]
 *   node scripts/ingest-metricool-csv.js --csv path/to/one.csv [--dry-run]
 *
 * See docs/engagement-rate-definition.md for the onboarding checklist.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { computeEngagement, num } = require('./lib/engagement');

const REPO = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SYNCED_AT = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// ── CSV profiles ────────────────────────────────────────────────────────
// `detect` is a header column unique to that export shape. `map` turns a row
// into canonical components. `platformEr` reads the vendor's headline rate.
// `unavailable` names components the export simply does not contain, so the
// engagement block can flag them instead of pretending they were zero.

const PROFILES = [
  {
    name: 'linkedin-posts',
    platform: 'linkedin',
    detect: (h) => h.includes('Vid. Views') && h.includes('Impressions'),
    postDirs: ['posts/linkedin/titan/published', 'posts/linkedin/titanverse/published'],
    dateKey: 'Date',
    titleKey: 'Title',
    urlKey: 'URL',
    map: (r) => ({
      impressions: num(r.Impressions),
      reach: 0,
      reactions: num(r.Reactions),
      comments: num(r.Comments),
      reposts: num(r.Shares),
      saves: 0,
      clicks: num(r.Clicks),
    }),
    platformEr: (r) => num(r.Engagement),
    unavailable: [],
  },
  {
    name: 'instagram-posts',
    platform: 'instagram',
    detect: (h) => h.includes('Saved') && h.includes('Interactions'),
    postDirs: ['posts/instagram/published'],
    dateKey: 'Timestamp',
    titleKey: 'Content',
    urlKey: 'URL',
    map: (r) => ({
      impressions: num(r.Views),
      reach: num(r['Reach (Organic)']),
      reactions: num(r.Likes),
      comments: num(r.Comments),
      reposts: num(r.Shares),
      saves: num(r.Saved),
      clicks: 0,
    }),
    platformEr: (r) => num(r.Engagement),
    unavailable: [],
  },
  {
    name: 'instagram-reels',
    platform: 'instagram',
    detect: (h) => h.includes('Saved (Organic)'),
    postDirs: ['posts/instagram/published'],
    dateKey: 'date',
    titleKey: 'title',
    urlKey: 'URL',
    map: (r) => ({
      impressions: num(r.Views),
      reach: num(r['Reach (Organic)']),
      reactions: num(r['Likes (Organic)']),
      comments: num(r['Comments (Organic)']),
      // Reels expose both in-app shares and Reposts; a repost is a share.
      reposts: num(r['Shares (Organic)']) + num(r.Reposts),
      saves: num(r['Saved (Organic)']),
      clicks: 0,
    }),
    platformEr: (r) => num(r['Engagement (Organic)']),
    unavailable: [],
  },
  {
    name: 'facebook-posts',
    platform: 'facebook',
    detect: (h) => h.includes('Shared') && h.includes('LinkClicks'),
    postDirs: ['posts/facebook/published'],
    dateKey: 'Date',
    titleKey: 'Content',
    urlKey: 'PostLink',
    map: (r) => ({
      impressions: num(r['Impressions (Organic)']) || num(r.Impressions),
      reach: num(r['Reach (Organic)']) || num(r.Reach),
      reactions: num(r.Reactions),
      comments: num(r.Comments),
      reposts: num(r.Shared),
      saves: 0,
      clicks: num(r.Clicks),
    }),
    platformEr: (r) => num(r.Engagement),
    unavailable: [],
  },
  {
    name: 'facebook-reels',
    platform: 'facebook',
    detect: (h) => h.includes('Reel Link'),
    postDirs: ['posts/facebook/published'],
    dateKey: 'Date',
    titleKey: 'Content',
    urlKey: 'Reel Link',
    map: (r) => ({
      impressions: num(r['Video Views']),
      reach: num(r.Reach),
      reactions: num(r.Likes),
      comments: num(r.Comments),
      reposts: 0, // export carries no shares column at all
      saves: 0,
      clicks: 0,
    }),
    platformEr: (r) => num(r.Engagement),
    // Reels shares are genuinely absent, not zero. social_er_pct is therefore
    // a floor for FB reels, and the flag says so on every row.
    unavailable: ['reposts'],
  },
  {
    name: 'tiktok-posts',
    platform: 'tiktok',
    detect: (h) => h.includes('Duration') && h.includes('Views'),
    postDirs: ['posts/tiktok/published'],
    dateKey: 'Date',
    titleKey: 'Title',
    urlKey: 'URL',
    map: (r) => ({
      impressions: num(r.Views),
      reach: 0,
      reactions: num(r.Likes),
      comments: num(r.Comments),
      reposts: num(r.Shares),
      saves: 0,
      clicks: 0,
    }),
    platformEr: () => null, // no engagement column; spec formula reproduces it
    unavailable: [],
  },
];

// ── Matching (date + fuzzy title, URL as the strongest signal) ───────────

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const tokens = (s) => normText(s).split(' ').filter((w) => w.length > 2);

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Collapse a post URL to its stable identity (the numeric id where present). */
function urlKeyOf(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  const m = s.match(/(\d{15,})/);
  if (m) return m[1];
  return s.split('?')[0].replace(/\/$/, '').toLowerCase();
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

      list.push({
        dir: p,
        slug: name,
        date: m[1],
        captionTokens: tokens(captionBody).slice(0, 60),
        slugTokens: tokens(m[2].replace(/-/g, ' ')),
        urlKey: urlKeyOf((metrics || {}).post_url),
        metricsPath: metPath,
        metrics,
      });
    }
  }
  return list;
}

function findMatch(candidates, csvDate, csvTitle, csvUrl) {
  // URL first — it is an identity, not a guess.
  const uk = urlKeyOf(csvUrl);
  if (uk) {
    const byUrl = candidates.find((c) => c.urlKey && c.urlKey === uk);
    if (byUrl) return { candidate: byUrl, score: 1, reason: 'url' };
  }

  const csvTokens = tokens(csvTitle).slice(0, 60);
  const score = (c) => Math.max(jaccard(csvTokens, c.captionTokens), jaccard(csvTokens, c.slugTokens));

  const sameDay = candidates.filter((c) => c.date === csvDate).map((c) => ({ c, s: score(c) }));
  sameDay.sort((a, b) => b.s - a.s);
  if (sameDay.length && sameDay[0].s >= 0.15) {
    return { candidate: sameDay[0].c, score: sameDay[0].s, reason: 'date+title' };
  }

  const nearby = candidates
    .filter((c) => c.date !== csvDate && Math.abs(new Date(c.date) - new Date(csvDate)) <= 86400000)
    .map((c) => ({ c, s: score(c) }));
  nearby.sort((a, b) => b.s - a.s);
  if (nearby.length && nearby[0].s >= 0.35) {
    return { candidate: nearby[0].c, score: nearby[0].s, reason: 'nearby+title' };
  }
  return null;
}

// ── Existing-value readers ──────────────────────────────────────────────

/** The deprecated engagement_rate, wherever this file happens to keep it. */
function readLegacyEr(m) {
  if (!m) return { value: null, source: null };
  const api = m.platform_api || {};
  if (api.organic && api.organic.engagement_rate !== undefined) {
    return { value: num(api.organic.engagement_rate), source: 'platform_api.organic.engagement_rate' };
  }
  if (api.engagement_rate !== undefined) {
    return { value: num(api.engagement_rate), source: 'platform_api.engagement_rate' };
  }
  if (m.organic && m.organic.engagement_rate !== undefined) {
    return { value: num(m.organic.engagement_rate), source: 'organic.engagement_rate' };
  }
  if (m.engagement_rate !== undefined) {
    return { value: num(m.engagement_rate), source: 'engagement_rate' };
  }
  return { value: null, source: null };
}

/** Delivery count we currently hold, for the >20% staleness check. */
function readHeldImpressions(m) {
  if (!m) return 0;
  const api = m.platform_api || {};
  return (
    num(m.impressions) ||
    num((m.organic || {}).impressions) ||
    num(api.impressions) ||
    num((api.organic || {}).impressions) ||
    0
  );
}

/** Write a value everywhere this file already stores impressions. */
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

// ── Ingest ──────────────────────────────────────────────────────────────

function ingestCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
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
    profile: profile.name,
    file: path.basename(csvPath),
    total: rows.length,
    matched: 0,
    unmatched: 0,
    written: 0,
    impressionFixes: [],
    erChanges: [],
    unmatchedRows: [],
  };

  // Dedupe: one CSV row per post dir, highest-scoring wins.
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

    // Trust the fresher CSV when a post kept accruing after our last sync.
    // Only upward — a lower vendor number is nearly always a reporting window
    // artefact, and silently deleting real impressions is unrecoverable.
    const held = readHeldImpressions(m);
    const fresh = components.impressions;
    if (held > 0 && fresh > held * 1.2) {
      res.impressionFixes.push({ slug: c.slug, from: held, to: fresh, ratio: +(fresh / held).toFixed(2) });
      applyImpressions(m, fresh);
    } else if (held > 0 && fresh < held) {
      components.impressions = held; // keep our higher figure as the denominator
    }

    const legacy = readLegacyEr(c.metrics);
    const eng = computeEngagement(profile.platform, components, {
      platformErPct: profile.platformEr(row),
      rawErPct: legacy.value,
      rawErSource: legacy.source,
      unavailable: profile.unavailable,
    });
    eng.computed_at = SYNCED_AT;
    eng.source_file = path.basename(csvPath);

    if (legacy.value !== null && eng.social_er_pct !== null) {
      res.erChanges.push({ slug: c.slug, from: legacy.value, to: eng.social_er_pct });
    }

    m.engagement = eng;
    if (m.engagement_rate !== undefined) {
      m.engagement_rate_deprecated_note =
        'DEPRECATED — mixed definitions. Use engagement.social_er_pct. Removed next refresh.';
    }

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
    if (r.impressionFixes.length) {
      console.log(`  impressions corrected upward on ${r.impressionFixes.length} post(s):`);
      for (const f2 of r.impressionFixes) {
        console.log(`    ${f2.slug}: ${f2.from} → ${f2.to} (${f2.ratio}x)`);
      }
    }
  }

  console.log('\n─── SUMMARY ───');
  let totMatched = 0, totWritten = 0, totFix = 0;
  for (const r of all) {
    totMatched += r.matched; totWritten += r.written; totFix += r.impressionFixes.length;
    const deltas = r.erChanges.map((e) => e.to - e.from);
    const mean = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    console.log(`${r.profile.padEnd(18)} matched=${String(r.matched).padStart(4)} written=${String(r.written).padStart(4)} imp_fixes=${String(r.impressionFixes.length).padStart(3)} mean_social_er_delta=${mean.toFixed(2)}pp`);
  }
  console.log(`\nTotal: ${totMatched} matched, ${totWritten} written, ${totFix} impression corrections.`);

  const reportPath = path.join(REPO, 'analytics', 'metricool-ingest-report.json');
  if (!DRY) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({ synced_at: SYNCED_AT, results: all }, null, 2));
    console.log(`Report: ${reportPath}`);
  }
}

main();
