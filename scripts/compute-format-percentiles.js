#!/usr/bin/env node
/**
 * Rank every post against its own kind, then flag the tier.
 *
 * This is the pass that turns raw signal values into a verdict. It has to run
 * after ingest/backfill because a percentile needs the whole cohort — no post
 * can be scored in isolation.
 *
 * COHORT
 *   same platform + same format, published within a rolling window ending at
 *   the post's own publish date. A post is judged against what we were doing
 *   around the same time, which controls for audience growth and algorithm
 *   drift — comparing a June 2026 video against a 2024 video would measure the
 *   audience, not the video.
 *
 *   The window widens (90 → 180 → 365 → all time) until the cohort reaches
 *   MIN_COHORT. Below that a percentile is noise dressed up as a rank, so the
 *   post is marked `insufficient-data` rather than given a fake verdict.
 *
 * SCORING
 *   Each signal component is percentile-ranked within the cohort independently,
 *   then combined by normalised weight. Percentiles are unitless, which is what
 *   lets raw view counts and per-impression rates sit in the same score without
 *   a shared denominator.
 *
 * TIER
 *   >= 75  worked
 *   <= 25  underperformed
 *   else   middle
 *
 * Usage: node scripts/compute-format-percentiles.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const {
  MIN_COHORT, MIN_IMPRESSIONS, WINDOWS_DAYS, TIER_TOP, TIER_BOTTOM,
  percentileOf, tierFor, round2, SPEC_VERSION,
} = require('./lib/format-signals');

const REPO = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const COMPUTED_AT = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

const DIRS = [
  'posts/linkedin/titan/published',
  'posts/linkedin/titanverse/published',
  'posts/instagram/published',
  'posts/facebook/published',
  'posts/tiktok/published',
];

// ── Load every tagged post ──────────────────────────────────────────────

const posts = [];
for (const rel of DIRS) {
  const dir = path.join(REPO, rel);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.') || name.startsWith('_')) continue;
    const metPath = path.join(dir, name, 'metrics.json');
    if (!fs.existsSync(metPath)) continue;
    let m;
    try { m = JSON.parse(fs.readFileSync(metPath, 'utf-8')); } catch { continue; }
    const s = m.signals;
    if (!s || !s.format || !s.measured || !s.measured.length) continue;

    const dateStr = (m.posted_at || name.slice(0, 10) || '').slice(0, 10);
    const t = Date.parse(dateStr);
    if (!Number.isFinite(t)) continue;

    posts.push({
      slug: name, metPath, metrics: m, signals: s,
      platform: s.platform, format: s.format, time: t, date: dateStr,
    });
  }
}
console.log(`Loaded ${posts.length} tagged posts.\n`);

// ── Cohort index: platform|format → posts sorted by time ────────────────

const cohorts = new Map();
for (const p of posts) {
  const key = `${p.platform}|${p.format}`;
  if (!cohorts.has(key)) cohorts.set(key, []);
  cohorts.get(key).push(p);
}
for (const list of cohorts.values()) list.sort((a, b) => a.time - b.time);

const DAY = 86400000;

/**
 * Peers for `post`: same platform+format, published in the window ending at
 * this post's date. Widens until MIN_COHORT is met; returns null if even the
 * all-time cohort is too small to rank against.
 */
function cohortFor(post) {
  const list = cohorts.get(`${post.platform}|${post.format}`) || [];
  for (const days of WINDOWS_DAYS) {
    const members = days === null
      ? list
      : list.filter((q) => q.time <= post.time && q.time >= post.time - days * DAY);
    if (members.length >= MIN_COHORT) {
      return { members, window_days: days, size: members.length };
    }
  }
  return { members: list, window_days: null, size: list.length, insufficient: true };
}

// ── Score ───────────────────────────────────────────────────────────────

const stats = {
  scored: 0, insufficient: 0,
  tiers: { worked: 0, middle: 0, underperformed: 0, 'insufficient-data': 0 },
  byFormat: {},
  windows: {},
};

for (const p of posts) {
  const cohort = cohortFor(p);
  const measured = p.signals.measured;

  let composite = null;
  const percentiles = {};

  if (!cohort.insufficient && cohort.size >= MIN_COHORT) {
    let weighted = 0, totalWeight = 0;
    for (const sig of measured) {
      // Peer values for this exact component. A peer that couldn't measure it
      // is excluded rather than counted as zero.
      const peerValues = [];
      for (const q of cohort.members) {
        const qs = (q.signals.measured || []).find((x) => x.key === sig.key);
        if (qs && Number.isFinite(qs.value)) peerValues.push(qs.value);
      }
      if (peerValues.length < MIN_COHORT) continue;

      const pct = percentileOf(sig.value, peerValues);
      if (pct === null) continue;
      percentiles[sig.key] = pct;
      const w = sig.normalised_weight || sig.weight || 0;
      weighted += pct * w;
      totalWeight += w;
    }
    if (totalWeight > 0) composite = round2(weighted / totalWeight);
  }

  // A percentile on tiny delivery is arithmetic, not evidence — record the
  // rank but withhold the verdict.
  const impressions = (p.signals.components || {}).impressions || 0;
  const lowVolume = impressions < MIN_IMPRESSIONS;
  const tier = composite === null || lowVolume ? 'insufficient-data' : tierFor(composite);

  p.metrics.signals = {
    ...p.signals,
    percentiles: Object.keys(percentiles).length ? percentiles : null,
    composite_percentile: composite,
    tier,
    cohort: {
      key: `${p.platform}|${p.format}`,
      window_days: cohort.window_days,
      size: cohort.size,
      min_required: MIN_COHORT,
    },
    low_volume: lowVolume,
    min_impressions: MIN_IMPRESSIONS,
    tier_thresholds: { worked: `>=${TIER_TOP}`, underperformed: `<=${TIER_BOTTOM}` },
    ranked_at: COMPUTED_AT,
    spec_version: SPEC_VERSION,
  };

  stats.tiers[tier]++;
  if (tier === 'insufficient-data') stats.insufficient++; else stats.scored++;
  if (lowVolume) stats.lowVolume = (stats.lowVolume || 0) + 1;
  const fk = `${p.platform}|${p.format}`;
  stats.byFormat[fk] = stats.byFormat[fk] || { n: 0, worked: 0, middle: 0, underperformed: 0, 'insufficient-data': 0 };
  stats.byFormat[fk].n++;
  stats.byFormat[fk][tier]++;
  const wk = cohort.window_days === null ? 'all-time' : `${cohort.window_days}d`;
  stats.windows[wk] = (stats.windows[wk] || 0) + 1;

  if (!DRY) fs.writeFileSync(p.metPath, JSON.stringify(p.metrics, null, 2) + '\n', 'utf-8');
}

// ── Report ──────────────────────────────────────────────────────────────

console.log('Tier distribution by cohort (platform|format):');
console.log('  cohort'.padEnd(34) + 'n'.padStart(5) + 'worked'.padStart(9) + 'middle'.padStart(9) + 'under'.padStart(8) + 'insuff'.padStart(8));
for (const [k, v] of Object.entries(stats.byFormat).sort()) {
  console.log('  ' + k.padEnd(32) + String(v.n).padStart(5) + String(v.worked).padStart(9)
    + String(v.middle).padStart(9) + String(v.underperformed).padStart(8) + String(v['insufficient-data']).padStart(8));
}
console.log(`\nWindow used: ${JSON.stringify(stats.windows)}`);
console.log(`Totals: scored=${stats.scored} insufficient=${stats.insufficient}`);
console.log(`Tiers: ${JSON.stringify(stats.tiers)}`);

if (!DRY) {
  const outPath = path.join(REPO, 'analytics', 'format-signal-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({
    computed_at: COMPUTED_AT, spec_version: SPEC_VERSION,
    min_cohort: MIN_COHORT, windows_days: WINDOWS_DAYS,
    tier_thresholds: { worked: TIER_TOP, underperformed: TIER_BOTTOM },
    min_impressions: MIN_IMPRESSIONS,
    stats,
  }, null, 2));
  console.log(`\nReport: ${outPath}`);
}
