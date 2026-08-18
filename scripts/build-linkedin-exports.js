#!/usr/bin/env node
/**
 * Build LinkedIn JSON Exports
 *
 * Merges all post files (caption, meta, metrics, alt-text, transcript, comments)
 * into a single JSON array per brand. Uses ORGANIC metrics only — all sponsored
 * data is stripped.
 *
 * Outputs:
 *   exports/titan-linkedin.json
 *   exports/titanverse-linkedin.json
 *
 * Run: node scripts/build-linkedin-exports.js
 */

const fs = require('fs');
const path = require('path');
const { computeEngagement, num } = require('./lib/engagement');

const REPO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(REPO_ROOT, 'posts', 'linkedin');
const EXPORTS_DIR = path.join(REPO_ROOT, 'exports');

function parseNum(val) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') return parseFloat(val.replace('%', '')) || 0;
  return 0;
}

/**
 * Attach the canonical engagement fields to an extracted metrics object.
 *
 * `metrics.json .engagement` is written by ingest-metricool-csv.js and
 * backfill-engagement.js and is the source of truth. If a post somehow lacks
 * it, we recompute from the components rather than emit a hole — the formula
 * needs nothing beyond reactions/comments/reposts/impressions.
 *
 * See docs/engagement-rate-definition.md.
 */
function withEngagement(out, rawMetrics) {
  const eng = (rawMetrics || {}).engagement;

  const block =
    eng && eng.social_er_pct !== undefined
      ? eng
      : computeEngagement('linkedin', {
          impressions: out.impressions,
          reactions: out.reactions,
          comments: out.comments,
          reposts: out.reposts,
          clicks: out.clicks,
        }, { rawErPct: out.engagement_rate, rawErSource: 'legacy_export_field' });

  // Surface counts must come from the components the rate was computed from,
  // or the export's own numbers won't reproduce its own ER.
  if (block && block.components) {
    const c = block.components;
    out.impressions = c.impressions;
    out.reactions = c.reactions;
    out.comments = c.comments;
    out.reposts = c.reposts;
    out.clicks = c.clicks;
    if (c.reach) out.reach = c.reach;
  }

  out.social_er_pct = block ? block.social_er_pct : null;
  out.platform_er_pct = block ? block.platform_er_pct : null;
  out.raw_er_pct = block ? block.raw_er_pct : null;
  out.social_interactions = block ? block.social_interactions : null;
  out.engagement_spec_version = block ? block.spec_version : null;
  if (block && block.flags && block.flags.length) out.engagement_flags = block.flags;

  // Deprecated. Held for one release so nothing downstream hard-fails.
  // It carries MIXED definitions across rows — never compare it. Use
  // social_er_pct. Scheduled for removal at the next refresh cycle.
  out.engagement_rate_DEPRECATED = out.engagement_rate;
  delete out.engagement_rate;

  // Label the source honestly. Rows refreshed from a Metricool CSV were
  // previously stamped `linkedin_api`, which is what let two different ER
  // definitions hide behind one source name.
  if (eng && eng.source_file) {
    out.source = eng.source_file.startsWith('backfill:')
      ? `${out.source}(backfilled)`
      : 'metricool_csv';
    out.metrics_synced_at = eng.computed_at || out.synced_at;
  }

  return out;
}

/**
 * Extract ORGANIC-only metrics from any of the three metrics formats.
 *
 * Priority:
 *   1. platform_api.organic (new dual-source format)
 *   2. organic (old flat format with organic sub-object)
 *   3. Flat top-level fields (minimal format, assumed organic)
 *   4. notionsocial (surface-level fallback)
 */
function extractOrganicMetrics(m) {
  if (!m) return null;

  // New format: platform_api with organic sub-object
  const api = m.platform_api || {};
  if (api.organic) {
    const o = api.organic;
    return withEngagement({
      source: 'linkedin_api',
      synced_at: api.synced_at || null,
      impressions: o.impressions || 0,
      reach: o.reach || 0,
      engagements: o.engagements || 0,
      engagement_rate: parseNum(o.engagement_rate),
      clicks: o.clicks || 0,
      ctr: parseNum(o.click_through_rate),
      reactions: o.reactions || 0,
      comments: o.comments || 0,
      reposts: o.reposts || 0,
      followers_gained: o.followers_gained || 0,
      page_viewers: o.page_viewers || 0,
      video_views: o.video_views || 0,
      watch_time_total: o.watch_time_total || null,
      avg_watch_time_seconds: o.average_watch_time_seconds || 0,
    }, m);
  }

  // Old flat format with organic sub-object
  if (m.organic) {
    const o = m.organic;
    return withEngagement({
      source: 'linkedin_api',
      synced_at: null,
      impressions: o.impressions || 0,
      reach: o.reach || 0,
      engagements: o.engagements || 0,
      engagement_rate: parseNum(o.engagement_rate),
      clicks: o.clicks || 0,
      ctr: parseNum(o.click_through_rate),
      reactions: o.reactions || 0,
      comments: o.comments || 0,
      reposts: o.reposts || 0,
      followers_gained: o.followers_gained || 0,
      page_viewers: o.page_viewers || 0,
      video_views: o.video_views || 0,
      watch_time_total: o.watch_time_total || null,
      avg_watch_time_seconds: o.average_watch_time_seconds || 0,
    }, m);
  }

  // Minimal flat format (no organic/sponsored breakdown — treat as organic)
  if ((m.impressions || 0) > 0 && !m.notionsocial) {
    return withEngagement({
      source: 'linkedin_api',
      synced_at: null,
      impressions: m.impressions || 0,
      reach: m.reach || 0,
      engagements: m.engagements || 0,
      engagement_rate: parseNum(m.engagement_rate),
      clicks: m.clicks || 0,
      ctr: parseNum(m.ctr || m.click_through_rate),
      reactions: m.reactions || 0,
      comments: m.comments || 0,
      reposts: m.reposts || 0,
      followers_gained: m.follows || 0,
      page_viewers: 0,
      video_views: m.views || 0,
      watch_time_total: null,
      avg_watch_time_seconds: m.avg_view_duration_seconds || 0,
    }, m);
  }

  // Notionsocial fallback (surface metrics only)
  const ns = m.notionsocial || {};
  if (ns.views || ns.likes || ns.comments || ns.shares) {
    return withEngagement({
      source: 'notionsocial',
      synced_at: ns.synced_at || null,
      impressions: 0,
      reach: 0,
      engagements: 0,
      engagement_rate: 0,
      clicks: 0,
      ctr: 0,
      reactions: ns.likes || 0,
      comments: ns.comments || 0,
      reposts: ns.shares || 0,
      followers_gained: 0,
      page_viewers: 0,
      video_views: ns.views || 0,
      watch_time_total: null,
      avg_watch_time_seconds: 0,
    }, m);
  }

  return null;
}

/**
 * Read caption.md — strip the front-matter header, return just the caption text.
 */
function readCaption(postDir) {
  const p = path.join(postDir, 'caption.md');
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8');
  const parts = raw.split('---');
  if (parts.length > 1) return parts.slice(1).join('---').trim();
  return raw.trim();
}

/**
 * Read a markdown file, strip the header block above first ---, return body text.
 */
function readMarkdownBody(postDir, filename) {
  const p = path.join(postDir, filename);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw) return null;
  const parts = raw.split('---');
  if (parts.length > 2) {
    // Has a header block — take everything after the last ---
    return parts.slice(-1)[0].trim() || null;
  }
  if (parts.length === 2) {
    return parts[1].trim() || null;
  }
  return raw;
}

/**
 * Read comments.md — extract just comment text lines, skip header and notes.
 */
function readComments(postDir) {
  const p = path.join(postDir, 'comments.md');
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw) return [];

  const comments = [];
  const lines = raw.split('\n');
  let inComments = false;
  let currentAuthor = null;
  let currentText = [];

  for (const line of lines) {
    // Stop at notes section
    if (line.startsWith('## Notes')) break;

    // Start reading after the --- separator
    if (line.trim() === '---') {
      // Flush current comment
      if (currentAuthor && currentText.length) {
        comments.push({ author: currentAuthor, text: currentText.join('\n').trim() });
        currentAuthor = null;
        currentText = [];
      }
      inComments = true;
      continue;
    }

    if (!inComments) continue;

    // Author line: **Name**
    const authorMatch = line.match(/^\*\*(.+?)\*\*/);
    if (authorMatch) {
      // Flush previous
      if (currentAuthor && currentText.length) {
        comments.push({ author: currentAuthor, text: currentText.join('\n').trim() });
        currentText = [];
      }
      currentAuthor = authorMatch[1];
      continue;
    }

    // Skip empty lines and heading lines
    if (line.startsWith('##') || !line.trim()) continue;

    if (currentAuthor) {
      currentText.push(line.trim());
    }
  }

  // Flush last comment
  if (currentAuthor && currentText.length) {
    comments.push({ author: currentAuthor, text: currentText.join('\n').trim() });
  }

  return comments;
}

/**
 * Read all posts from a brand's published directory and merge into JSON objects.
 */
function buildBrandExport(brand) {
  const publishedDir = path.join(POSTS_DIR, brand, 'published');
  if (!fs.existsSync(publishedDir)) return [];

  const posts = [];
  const entries = fs.readdirSync(publishedDir).sort();

  for (const entry of entries) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue;
    const postDir = path.join(publishedDir, entry);

    try {
      const stat = fs.statSync(postDir);
      if (!stat.isDirectory()) continue;

      // meta.json
      const metaPath = path.join(postDir, 'meta.json');
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        : {};

      // metrics.json → organic only
      const metricsPath = path.join(postDir, 'metrics.json');
      const rawMetrics = fs.existsSync(metricsPath)
        ? JSON.parse(fs.readFileSync(metricsPath, 'utf8'))
        : null;

      const post = {
        slug: entry,
        brand: brand === 'titan' ? 'Titan PMR' : 'Titanverse',
        published_at: meta.published_at || (rawMetrics || {}).posted_at || null,
        asset_type: meta.asset_type || (rawMetrics || {}).asset_type || null,
        campaign: meta.campaign_slug || (rawMetrics || {}).campaign_slug || null,
        post_url: (rawMetrics || {}).post_url || null,
        notion_url: meta.notion_url || null,
        caption: readCaption(postDir),
        alt_text: readMarkdownBody(postDir, 'alt-text.md'),
        transcript: readMarkdownBody(postDir, 'transcript.md'),
        comments: readComments(postDir),
        metrics: extractOrganicMetrics(rawMetrics),
      };

      posts.push(post);
    } catch (err) {
      console.warn(`  Skipping ${entry}: ${err.message}`);
    }
  }

  return posts;
}

// ─── Main ───────────────────────────────────────────────────────────────

console.log('Building LinkedIn JSON exports (organic metrics only)...\n');

// Ensure exports dir exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// Build Titan
console.log('Reading Titan PMR posts...');
const titanPosts = buildBrandExport('titan');
console.log(`  Found ${titanPosts.length} posts`);

const titanPath = path.join(EXPORTS_DIR, 'titan-linkedin.json');
fs.writeFileSync(titanPath, JSON.stringify(titanPosts, null, 2));
console.log(`  Wrote ${titanPath} (${(fs.statSync(titanPath).size / 1024).toFixed(0)} KB)`);

// Build Titanverse
console.log('Reading Titanverse posts...');
const tvPosts = buildBrandExport('titanverse');
console.log(`  Found ${tvPosts.length} posts`);

const tvPath = path.join(EXPORTS_DIR, 'titanverse-linkedin.json');
fs.writeFileSync(tvPath, JSON.stringify(tvPosts, null, 2));
console.log(`  Wrote ${tvPath} (${(fs.statSync(tvPath).size / 1024).toFixed(0)} KB)`);

// Summary
const totalPosts = titanPosts.length + tvPosts.length;
const withMetrics = [...titanPosts, ...tvPosts].filter(p => p.metrics && p.metrics.impressions > 0).length;
console.log(`\nDone. ${totalPosts} posts exported (${withMetrics} with organic metrics).`);
console.log('Upload these files to ChatGPT or Claude chat for instant analysis.');
