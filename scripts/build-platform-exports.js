#!/usr/bin/env node
/**
 * Build JSON exports for the non-LinkedIn platforms.
 *
 * LinkedIn already had exports/titan-linkedin.json; Instagram, Facebook and
 * TikTok had nothing — the metrics existed only as per-post metrics.json
 * scattered across directories, which is why no one noticed the same
 * engagement-rate inconsistency there.
 *
 * Emits the same canonical engagement fields as the LinkedIn export, so a
 * single social_er_pct is comparable across every platform.
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
const { computeEngagement, num } = require('./lib/engagement');

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

/** Surface metrics + the canonical engagement fields, organic only. */
function buildMetrics(m) {
  if (!m) return null;
  const api = m.platform_api || {};
  const ns = m.notionsocial || {};
  const eng = m.engagement;

  const impressions =
    num(api.impressions) || num(api.views) || num(api.video_views) || num(api.plays) || num(ns.views);
  if (!impressions && !eng) return null;

  const out = {
    source: eng && eng.source_file && !eng.source_file.startsWith('backfill:')
      ? 'metricool_csv'
      : (api.source || 'notionsocial'),
    synced_at: (eng && eng.computed_at) || api.synced_at || ns.synced_at || null,
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

  const block =
    eng && eng.social_er_pct !== undefined
      ? eng
      : computeEngagement(m.platform, out, { rawErPct: api.engagement_rate, rawErSource: 'platform_api.engagement_rate' });

  out.social_er_pct = block ? block.social_er_pct : null;
  out.platform_er_pct = block ? block.platform_er_pct : null;
  out.raw_er_pct = block ? block.raw_er_pct : null;
  out.social_interactions = block ? block.social_interactions : null;
  out.engagement_spec_version = block ? block.spec_version : null;
  if (block && block.flags && block.flags.length) out.engagement_flags = block.flags;

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
  const withEr = posts.filter((x) => x.metrics && x.metrics.social_er_pct !== null).length;
  console.log(`  ${p.label.padEnd(10)} ${String(posts.length).padStart(3)} posts (${withEr} with social_er_pct) → exports/${p.out}`);
}

console.log('\nDone.');
