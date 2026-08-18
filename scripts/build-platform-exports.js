#!/usr/bin/env node
/**
 * Build JSON exports for the non-LinkedIn platforms.
 *
 * LinkedIn already had exports/titan-linkedin.json; Instagram, Facebook and
 * TikTok had nothing — the metrics existed only as per-post metrics.json
 * scattered across directories.
 *
 * Emits the same format-aware signal fields as the LinkedIn export: format,
 * the primary signal for that format, its percentile within its own cohort,
 * and the resulting tier.
 *
 * Outputs:
 *   exports/titan-instagram.json
 *   exports/titan-facebook.json
 *   exports/titan-tiktok.json
 *
 * Run: node scripts/build-platform-exports.js
 */

const fs = require('fs');
const path = require('path');
const { num } = require('./lib/format-signals');

const REPO = path.join(__dirname, '..');
const EXPORTS = path.join(REPO, 'exports');

const PLATFORMS = [
  { key: 'instagram', dir: 'posts/instagram/published', out: 'titan-instagram.json', label: 'Instagram' },
  { key: 'facebook', dir: 'posts/facebook/published', out: 'titan-facebook.json', label: 'Facebook' },
  { key: 'tiktok', dir: 'posts/tiktok/published', out: 'titan-tiktok.json', label: 'TikTok' },
];

function readBody(dir, file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw) return null;
  const parts = raw.split('---');
  if (parts.length > 2) return parts.slice(-1)[0].trim() || null;
  if (parts.length === 2) return parts[1].trim() || null;
  return raw;
}

/**
 * Surface metrics + the format-aware success signal, organic only.
 *
 * No engagement rate — see docs/format-signals-definition.md for why a single
 * rate is the wrong shape for cross-format comparison.
 */
function buildMetrics(m) {
  if (!m) return null;
  const api = m.platform_api || {};
  const ns = m.notionsocial || {};
  const sig = m.signals;

  const impressions =
    num(api.impressions) || num(api.views) || num(api.video_views) || num(api.plays) || num(ns.views);
  if (!impressions && !sig) return null;

  const out = {
    source: sig && sig.source_file && !sig.source_file.startsWith('backfill:')
      ? 'metricool_csv'
      : (api.source || 'notionsocial'),
    synced_at: (sig && sig.computed_at) || api.synced_at || ns.synced_at || null,
    impressions,
    reach: num(api.reach),
    reactions: num(api.likes) || num(ns.likes),
    comments: num(api.comments) || num(ns.comments),
    reposts: num(api.shares) || num(ns.shares),
    saves: num(api.saves),
    video_views: num(api.video_views) || num(api.plays) || num(ns.views),
    avg_watch_time_seconds:
      num(api.avg_watch_time_seconds) || (num(api.avg_watch_time_ms) / 1000 || 0),
  };

  if (!sig) {
    out.format = null;
    out.tier = 'insufficient-data';
    return out;
  }

  // Surface counts come from the same components the signal was built on, so
  // an export's own numbers always reproduce its own signal values.
  const c = sig.components || {};
  if (c.impressions !== undefined) {
    out.impressions = c.impressions;
    out.reach = c.reach;
    out.reactions = c.reactions;
    out.comments = c.comments;
    out.reposts = c.reposts;
    out.saves = c.saves;
    if (c.video_views) out.video_views = c.video_views;
    if (c.avg_watch_time_seconds) out.avg_watch_time_seconds = c.avg_watch_time_seconds;
  }

  out.format = sig.format;
  out.format_source = sig.format_source;
  out.content_role = sig.role;
  out.primary_signal = (sig.measured || []).map((x) => ({
    key: x.key,
    label: x.label,
    value: x.value,
    weight: x.normalised_weight,
    percentile: sig.percentiles ? (sig.percentiles[x.key] ?? null) : null,
  }));
  out.composite_percentile = sig.composite_percentile;
  out.tier = sig.tier || 'insufficient-data';
  out.cohort = sig.cohort;
  if (sig.unmeasurable && sig.unmeasurable.length) out.unmeasurable_signals = sig.unmeasurable;

  return out;
}

console.log('Building platform JSON exports (organic metrics only)...\n');
fs.mkdirSync(EXPORTS, { recursive: true });

for (const p of PLATFORMS) {
  const dir = path.join(REPO, p.dir);
  const posts = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.startsWith('.') || name.startsWith('_')) continue;
      const postDir = path.join(dir, name);
      if (!fs.statSync(postDir).isDirectory()) continue;

      const metaPath = path.join(postDir, 'meta.json');
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
      const metPath = path.join(postDir, 'metrics.json');
      const raw = fs.existsSync(metPath) ? JSON.parse(fs.readFileSync(metPath, 'utf8')) : null;

      posts.push({
        slug: name,
        platform: p.label,
        published_at: meta.published_at || (raw || {}).posted_at || null,
        asset_type: meta.asset_type || (raw || {}).asset_type || null,
        campaign: meta.campaign_slug || (raw || {}).campaign_slug || null,
        post_url: (raw || {}).post_url || null,
        caption: readBody(postDir, 'caption.md'),
        alt_text: readBody(postDir, 'alt-text.md'),
        transcript: readBody(postDir, 'transcript.md'),
        metrics: buildMetrics(raw),
      });
    }
  }

  const outPath = path.join(EXPORTS, p.out);
  fs.writeFileSync(outPath, JSON.stringify(posts, null, 2));
  const withEr = posts.filter((x) => x.metrics && x.metrics.tier && x.metrics.tier !== "insufficient-data").length;
  console.log(`  ${p.label.padEnd(10)} ${String(posts.length).padStart(3)} posts (${withEr} ranked) → exports/${p.out}`);
}

console.log('\nDone.');
