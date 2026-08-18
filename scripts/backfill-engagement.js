#!/usr/bin/env node
/**
 * Backfill the canonical engagement block onto posts the Metricool CSVs
 * don't cover.
 *
 * ingest-metricool-csv.js only reaches posts present in a CSV drop. Older
 * posts, and anything Metricool no longer reports, still hold their raw
 * component counts (reactions / comments / reposts / impressions) from earlier
 * LinkedIn API and notionsocial syncs. Those components are enough to compute
 * social_er_pct — the formula needs nothing the files don't already have.
 *
 * That is the whole point of defining ER over components rather than trusting
 * a vendor's rate field: every historical row is recoverable.
 *
 * Additive only — reads components, writes `engagement`, changes nothing else.
 * Re-runnable. Skips rows already computed at the current SPEC_VERSION unless
 * --force is given.
 *
 * Usage: node scripts/backfill-engagement.js [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');
const { computeEngagement, num, SPEC_VERSION } = require('./lib/engagement');

const REPO = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const COMPUTED_AT = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

const TARGETS = [
  { platform: 'linkedin', dir: 'posts/linkedin/titan/published', label: 'LinkedIn (Titan PMR)' },
  { platform: 'linkedin', dir: 'posts/linkedin/titanverse/published', label: 'LinkedIn (Titanverse)' },
  { platform: 'instagram', dir: 'posts/instagram/published', label: 'Instagram' },
  { platform: 'facebook', dir: 'posts/facebook/published', label: 'Facebook' },
  { platform: 'tiktok', dir: 'posts/tiktok/published', label: 'TikTok' },
];

/**
 * Pull canonical components out of whichever shape this metrics.json uses.
 *
 * Precedence: platform_api.organic → organic → flat top level → notionsocial.
 * Organic-only throughout; sponsored blocks are deliberately ignored so paid
 * delivery never contaminates an organic rate.
 */
function extractComponents(m) {
  if (!m) return null;
  const api = m.platform_api || {};

  const shapes = [
    api.organic && { s: api.organic, src: 'platform_api.organic' },
    m.organic && { s: m.organic, src: 'organic' },
    (num(m.impressions) || num(m.views)) && { s: m, src: 'flat' },
    api.impressions !== undefined && { s: api, src: 'platform_api' },
  ].filter(Boolean);

  for (const { s, src } of shapes) {
    const impressions =
      num(s.impressions) || num(s.views) || num(s.video_views) || num(s.plays);
    if (!impressions) continue;
    return {
      src,
      components: {
        impressions,
        reach: num(s.reach),
        reactions: num(s.reactions) || num(s.likes),
        comments: num(s.comments),
        reposts: num(s.reposts) || num(s.shares),
        saves: num(s.saves) || num(s.saved),
        clicks: num(s.clicks),
      },
    };
  }

  // Last resort: notionsocial surface counts. No impressions means no rate,
  // but recording the components makes the gap visible instead of invisible.
  const ns = m.notionsocial;
  if (ns && (num(ns.views) || num(ns.likes) || num(ns.comments) || num(ns.shares))) {
    return {
      src: 'notionsocial',
      components: {
        impressions: num(ns.views),
        reach: 0,
        reactions: num(ns.likes),
        comments: num(ns.comments),
        reposts: num(ns.shares),
        saves: 0,
        clicks: 0,
      },
    };
  }
  return null;
}

function readLegacyEr(m) {
  if (!m) return { value: null, source: null };
  const api = m.platform_api || {};
  if (api.organic && api.organic.engagement_rate !== undefined) {
    return { value: num(api.organic.engagement_rate), source: 'platform_api.organic.engagement_rate' };
  }
  if (api.engagement_rate !== undefined) return { value: num(api.engagement_rate), source: 'platform_api.engagement_rate' };
  if (m.organic && m.organic.engagement_rate !== undefined) return { value: num(m.organic.engagement_rate), source: 'organic.engagement_rate' };
  if (m.engagement_rate !== undefined) return { value: num(m.engagement_rate), source: 'engagement_rate' };
  return { value: null, source: null };
}

let totals = { scanned: 0, already: 0, written: 0, noComponents: 0, noDenominator: 0 };
const deltas = [];

for (const t of TARGETS) {
  const dir = path.join(REPO, t.dir);
  if (!fs.existsSync(dir)) continue;
  let written = 0, already = 0, noComp = 0, noDenom = 0, scanned = 0;

  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.') || name.startsWith('_')) continue;
    const metPath = path.join(dir, name, 'metrics.json');
    if (!fs.existsSync(metPath)) continue;
    scanned++;

    let m;
    try { m = JSON.parse(fs.readFileSync(metPath, 'utf-8')); } catch { continue; }

    if (m.engagement && m.engagement.spec_version === SPEC_VERSION && !FORCE) { already++; continue; }

    const found = extractComponents(m);
    if (!found) { noComp++; continue; }

    const legacy = readLegacyEr(m);
    const eng = computeEngagement(t.platform, found.components, {
      // No vendor rate available off-CSV — let the spec reproduce it.
      platformErPct: null,
      rawErPct: legacy.value,
      rawErSource: legacy.source,
    });
    eng.computed_at = COMPUTED_AT;
    eng.source_file = `backfill:${found.src}`;

    if (eng.social_er_pct === null) noDenom++;
    else if (legacy.value !== null) deltas.push(eng.social_er_pct - legacy.value);

    m.engagement = eng;
    if (m.engagement_rate !== undefined) {
      m.engagement_rate_deprecated_note =
        'DEPRECATED — mixed definitions. Use engagement.social_er_pct. Removed next refresh.';
    }

    if (!DRY) fs.writeFileSync(metPath, JSON.stringify(m, null, 2) + '\n', 'utf-8');
    written++;
  }

  console.log(
    `${t.label.padEnd(24)} scanned=${String(scanned).padStart(4)} backfilled=${String(written).padStart(4)} ` +
    `already_current=${String(already).padStart(4)} no_components=${String(noComp).padStart(3)} no_denominator=${String(noDenom).padStart(3)}`
  );
  totals.scanned += scanned; totals.written += written; totals.already += already;
  totals.noComponents += noComp; totals.noDenominator += noDenom;
}

const mean = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
console.log(`\n${DRY ? '(dry run) ' : ''}Total scanned=${totals.scanned} backfilled=${totals.written} ` +
  `already_current=${totals.already} no_components=${totals.noComponents} no_denominator=${totals.noDenominator}`);
console.log(`Mean social_er_pct delta vs deprecated engagement_rate: ${mean.toFixed(2)}pp (n=${deltas.length})`);
