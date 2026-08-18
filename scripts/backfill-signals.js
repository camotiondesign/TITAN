#!/usr/bin/env node
/**
 * Tag format + primary signal on posts the Metricool CSVs don't cover.
 *
 * ingest-metricool-csv.js only reaches posts present in a CSV drop. Everything
 * older still holds its raw component counts from earlier LinkedIn API and
 * notionsocial syncs — enough to tag a format and compute its signal, because
 * the model is built on components rather than on a vendor's rate field.
 *
 * Also retires the deprecated engagement_rate wherever it survives.
 *
 * Additive to metrics.json apart from that deliberate removal. Re-runnable;
 * skips rows already at the current SPEC_VERSION unless --force.
 *
 * Percentiles and tiers come afterwards from compute-format-percentiles.js.
 *
 * Usage: node scripts/backfill-signals.js [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');
const {
  resolveFormat, resolveRole, buildSignals, num, SPEC_VERSION,
} = require('./lib/format-signals');

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

// slug → classified_type, from the repo's existing post-type classifier.
// Used to derive the content role (advocacy / sector-thesis / standard).
const POST_TYPES = {};
const ciPath = path.join(REPO, 'exports', 'content-intelligence.json');
if (fs.existsSync(ciPath)) {
  try {
    for (const p of (JSON.parse(fs.readFileSync(ciPath, 'utf-8')).enriched_posts || [])) {
      if (p.slug && p.classified_type) POST_TYPES[p.slug] = p.classified_type;
    }
  } catch {}
}

const ROLE_OVERRIDE_PATH = path.join(REPO, 'analytics', 'post-roles.json');
let ROLE_OVERRIDES = {};
if (fs.existsSync(ROLE_OVERRIDE_PATH)) {
  try { ROLE_OVERRIDES = JSON.parse(fs.readFileSync(ROLE_OVERRIDE_PATH, 'utf-8')); } catch {}
}

/**
 * Pull components out of whichever shape this metrics.json uses.
 * Organic only — sponsored blocks are ignored so paid delivery never
 * contaminates an organic signal.
 */
function extractComponents(m, platform) {
  if (!m) return null;
  const api = m.platform_api || {};

  const shapes = [
    api.organic && { s: api.organic, src: 'platform_api.organic' },
    m.organic && { s: m.organic, src: 'organic' },
    (num(m.impressions) || num(m.views)) && { s: m, src: 'flat' },
    api.impressions !== undefined && { s: api, src: 'platform_api' },
  ].filter(Boolean);

  const isLinkedIn = platform === 'linkedin';
  const isIg = platform === 'instagram';

  for (const { s, src } of shapes) {
    const impressions = num(s.impressions) || num(s.views) || num(s.video_views) || num(s.plays);
    if (!impressions) continue;
    const videoViews = num(s.video_views) || num(s.plays) || 0;
    const avgWatch = num(s.average_watch_time_seconds) || num(s.avg_watch_time_seconds)
      || (num(s.avg_watch_time_ms) ? num(s.avg_watch_time_ms) / 1000 : 0);
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
        video_views: videoViews,
        avg_watch_time_seconds: avgWatch,
        duration_seconds: num(s.duration_seconds),
        clicks_available: isLinkedIn || platform === 'facebook',
        saves_available: isIg,
      },
    };
  }

  // Last resort: notionsocial surface counts.
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
        video_views: num(ns.views),
        avg_watch_time_seconds: 0,
        duration_seconds: 0,
        clicks_available: false,
        saves_available: false,
      },
    };
  }
  return null;
}

function retireEngagementRate(m) {
  let removed = 0;
  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const k of ['engagement_rate', 'engagement_rate_deprecated_note', 'engagement']) {
      if (obj[k] !== undefined) { delete obj[k]; removed++; }
    }
  };
  scrub(m); scrub(m.organic); scrub(m.sponsored); scrub(m.platform_api);
  if (m.platform_api) scrub(m.platform_api.organic);
  return removed;
}

const totals = { scanned: 0, already: 0, written: 0, noComponents: 0, noFormat: 0, erRemoved: 0 };
const formatCounts = {};

for (const t of TARGETS) {
  const dir = path.join(REPO, t.dir);
  if (!fs.existsSync(dir)) continue;
  let written = 0, already = 0, noComp = 0, noFmt = 0, scanned = 0;

  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.') || name.startsWith('_')) continue;
    const metPath = path.join(dir, name, 'metrics.json');
    if (!fs.existsSync(metPath)) continue;
    scanned++;

    let m;
    try { m = JSON.parse(fs.readFileSync(metPath, 'utf-8')); } catch { continue; }

    if (m.signals && m.signals.spec_version === SPEC_VERSION && !FORCE) { already++; continue; }

    let meta = {};
    const metaPath = path.join(dir, name, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch {}
    }

    const found = extractComponents(m, t.platform);
    const assetType = meta.asset_type || m.asset_type;
    // The post URL is the only reliable reel/feed-video discriminator off-CSV:
    // Instagram and Facebook both carry feed videos AND reels, and asset_type
    // does not distinguish them.
    const url = String(m.post_url || '');
    const isReel = t.platform === 'tiktok'
      || /\/reel(s)?\//i.test(url)
      || (t.platform === 'instagram' && assetType === 'video');
    let { format, source: formatSource } = resolveFormat({
      platform: t.platform, platformType: null, assetType, isReel,
    });

    // Some older posts carry no asset_type at all. Infer from evidence rather
    // than leaving them unrankable: a transcript or a non-zero video-view
    // count is proof of a video, not a guess.
    if (!format) {
      const postPath = path.join(dir, name);
      const hasTranscript = fs.existsSync(path.join(postPath, 'transcript.md'));
      const altPath = path.join(postPath, 'alt-text.md');
      const hasAlt = fs.existsSync(altPath);
      const altText = hasAlt ? fs.readFileSync(altPath, 'utf-8').toLowerCase() : '';
      // On notionsocial rows video_views is just a copy of views, so it proves
      // nothing. Only trust it from a real platform source.
      const videoViews = found && found.src !== 'notionsocial' ? found.components.video_views : 0;

      if (hasTranscript) {
        format = isReel ? 'short-form-video' : 'video';
        formatSource = 'inferred:transcript';
      } else if (videoViews > 0) {
        format = isReel ? 'short-form-video' : 'video';
        formatSource = 'inferred:video_views';
      } else if (/-video(-|$)/.test(name) || /\bvideo\b|\bclip\b|\bfootage\b/.test(altText)) {
        format = isReel ? 'short-form-video' : 'video';
        formatSource = 'inferred:slug_or_alt_text';
      } else if (hasAlt) {
        // An alt-text description means there is a visual to describe.
        format = 'single-image';
        formatSource = 'inferred:has_alt_text';
      } else {
        format = 'text';
        formatSource = 'inferred:no_visual_asset';
      }
    }

    totals.erRemoved += retireEngagementRate(m);

    if (!found) { noComp++; if (!DRY) fs.writeFileSync(metPath, JSON.stringify(m, null, 2) + '\n', 'utf-8'); continue; }
    if (!format) { noFmt++; }

    const { role, source: roleSource } = resolveRole(POST_TYPES[name], ROLE_OVERRIDES[name]);
    const built = format ? buildSignals(format, role, found.components) : null;

    m.signals = {
      spec_version: SPEC_VERSION,
      computed_at: COMPUTED_AT,
      source_file: `backfill:${found.src}`,
      platform: t.platform,
      format,
      format_source: formatSource,
      role,
      role_source: roleSource,
      components: found.components,
      measured: built ? built.measured : [],
      unmeasurable: built ? built.dropped : [],
      percentiles: null,
      composite_percentile: null,
      tier: null,
      cohort: null,
    };

    formatCounts[format || 'unknown'] = (formatCounts[format || 'unknown'] || 0) + 1;
    if (!DRY) fs.writeFileSync(metPath, JSON.stringify(m, null, 2) + '\n', 'utf-8');
    written++;
  }

  console.log(`${t.label.padEnd(24)} scanned=${String(scanned).padStart(4)} tagged=${String(written).padStart(4)} already_current=${String(already).padStart(4)} no_components=${String(noComp).padStart(3)} no_format=${String(noFmt).padStart(3)}`);
  totals.scanned += scanned; totals.written += written; totals.already += already;
  totals.noComponents += noComp; totals.noFormat += noFmt;
}

console.log(`\n${DRY ? '(dry run) ' : ''}Total scanned=${totals.scanned} tagged=${totals.written} already_current=${totals.already} no_components=${totals.noComponents} no_format=${totals.noFormat}`);
console.log(`Retired engagement_rate fields removed: ${totals.erRemoved}`);
console.log(`Formats tagged this run: ${JSON.stringify(formatCounts)}`);
console.log('\nNEXT: node scripts/compute-format-percentiles.js');
