#!/usr/bin/env node
/**
 * Build Index Files for Claude-Readability
 *
 * Generates markdown index files that aggregate all post data into single-read files.
 * Claude can read one index instead of browsing hundreds of post directories.
 *
 * Outputs:
 *   posts/linkedin/titan/published/_index.md    — All Titan published posts
 *   posts/linkedin/titanverse/published/_index.md — All Titanverse published posts
 *   posts/_master-index.md                       — Cross-brand summary with top performers
 *
 * Run: node scripts/build-indexes.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(REPO_ROOT, 'posts');

/**
 * Parse a number that might be a string like "6.9%" or undefined
 */
function parseNum(val) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') return parseFloat(val.replace('%', '')) || 0;
  return 0;
}

/**
 * Read all posts from a published directory
 */
function readPublishedPosts(publishedDir) {
  if (!fs.existsSync(publishedDir)) return [];

  const posts = [];
  const entries = fs.readdirSync(publishedDir).sort();

  for (const entry of entries) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue;
    const postDir = path.join(publishedDir, entry);

    try {
      const stat = fs.statSync(postDir);
      if (!stat.isDirectory()) continue;

      const post = { slug: entry };

      // Read meta.json
      const metaPath = path.join(postDir, 'meta.json');
      if (fs.existsSync(metaPath)) {
        post.meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      }

      // Read metrics.json
      const metricsPath = path.join(postDir, 'metrics.json');
      if (fs.existsSync(metricsPath)) {
        post.metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      }

      // Read caption.md (extract just the caption text, skip header)
      const captionPath = path.join(postDir, 'caption.md');
      if (fs.existsSync(captionPath)) {
        const raw = fs.readFileSync(captionPath, 'utf8');
        // Extract caption after the --- separator
        const parts = raw.split('---');
        if (parts.length > 1) {
          post.caption = parts.slice(1).join('---').trim();
        } else {
          post.caption = raw.trim();
        }
      }

      // Read alt-text.md
      const altTextPath = path.join(postDir, 'alt-text.md');
      if (fs.existsSync(altTextPath)) {
        post.altText = fs.readFileSync(altTextPath, 'utf8').trim();
      } else {
        post.altText = null;
      }

      // Read transcript.md (video posts only)
      const transcriptPath = path.join(postDir, 'transcript.md');
      if (fs.existsSync(transcriptPath)) {
        post.transcript = fs.readFileSync(transcriptPath, 'utf8').trim();
      } else {
        post.transcript = null;
      }

      // Read comments.md
      const commentsPath = path.join(postDir, 'comments.md');
      if (fs.existsSync(commentsPath)) {
        const commentsRaw = fs.readFileSync(commentsPath, 'utf8').trim();
        post.comments = commentsRaw || null;
      } else {
        post.comments = null;
      }

      posts.push(post);
    } catch (err) {
      console.warn(`  Skipping ${entry}: ${err.message}`);
    }
  }

  return posts;
}

/**
 * Extract normalised metrics from either format:
 *   - Old flat format: { impressions, engagement_rate, reactions, ... }
 *   - New two-tier: { notionsocial: { views, likes, ... }, platform_api: { impressions, ... } }
 *
 * Priority: platform_api > flat > notionsocial
 */
function extractMetrics(m) {
  if (!m) return { impressions: 0, engRate: 0, reactions: 0, comments: 0, reposts: 0, clicks: 0, ctr: 0, views: 0, boosted: false, source: 'none' };

  const api = m.platform_api || {};
  const ns = m.notionsocial || {};
  const hasApi = api.synced_at && api.synced_at !== '';
  const hasFlat = (m.impressions || 0) > 0 && !m.notionsocial;

  if (hasFlat) {
    // Old format — full LinkedIn API metrics in flat structure
    return {
      impressions: m.impressions || 0,
      engRate: parseNum(m.engagement_rate),
      reactions: m.reactions || 0,
      comments: m.comments || 0,
      reposts: m.reposts || 0,
      clicks: m.clicks || 0,
      ctr: parseNum(m.ctr),
      views: m.views || 0,
      boosted: m.boosted || false,
      source: 'linkedin_api',
    };
  }

  if (hasApi) {
    // New format with populated platform API data
    return {
      impressions: api.impressions || 0,
      engRate: parseNum(api.engagement_rate),
      reactions: api.reactions || api.likes || 0,
      comments: api.comments || 0,
      reposts: api.reposts || api.shares || 0,
      clicks: api.clicks || 0,
      ctr: parseNum(api.ctr),
      views: api.views || 0,
      boosted: m.boosted || false,
      source: api.source || 'platform_api',
    };
  }

  // Notionsocial surface metrics only
  return {
    impressions: 0,
    engRate: 0,
    reactions: ns.likes || 0,
    comments: ns.comments || 0,
    reposts: ns.shares || 0,
    clicks: 0,
    ctr: 0,
    views: ns.views || 0,
    boosted: m.boosted || false,
    source: 'notionsocial',
  };
}

/**
 * Format a single post as a compact markdown entry
 */
function formatPostEntry(post) {
  const m = post.metrics || {};
  const meta = post.meta || {};
  const mx = extractMetrics(m);

  const date = meta.published_at || m.posted_at || '?';
  const type = meta.asset_type || m.asset_type || '?';
  const boosted = mx.boosted ? ' [BOOSTED]' : '';
  const sourceTag = mx.source === 'notionsocial' ? ' _(Notionsocial)_' : '';

  // Truncate caption to first 200 chars for index
  let captionPreview = (post.caption || '').replace(/\n/g, ' ').trim();
  if (captionPreview.length > 200) {
    captionPreview = captionPreview.substring(0, 200) + '...';
  }

  let entry = `### ${post.slug}\n`;
  entry += `**Date:** ${date} | **Type:** ${type}${boosted}${sourceTag}\n`;

  if (mx.source === 'notionsocial') {
    // Surface metrics only — show what we have
    entry += `**Views:** ${mx.views.toLocaleString()} | **Likes:** ${mx.reactions} | **Comments:** ${mx.comments} | **Shares:** ${mx.reposts}\n`;
  } else {
    entry += `**Impressions:** ${mx.impressions.toLocaleString()} | **Engagement:** ${mx.engRate}% | **CTR:** ${mx.ctr}%\n`;
    entry += `**Reactions:** ${mx.reactions} | **Comments:** ${mx.comments} | **Reposts:** ${mx.reposts} | **Clicks:** ${mx.clicks.toLocaleString()}`;
    if (mx.views > 0) entry += ` | **Views:** ${mx.views.toLocaleString()}`;
    entry += '\n';
  }

  if (captionPreview) {
    entry += `> ${captionPreview}\n`;
  }

  return entry;
}

/**
 * Generate brand index markdown
 */
function generateBrandIndex(brandName, pageName, posts) {
  const totalPosts = posts.length;
  const totalImpressions = posts.reduce((sum, p) => sum + extractMetrics(p.metrics).impressions, 0);
  const totalReactions = posts.reduce((sum, p) => sum + extractMetrics(p.metrics).reactions, 0);
  const totalComments = posts.reduce((sum, p) => sum + extractMetrics(p.metrics).comments, 0);
  const postsWithMetrics = posts.filter(p => extractMetrics(p.metrics).impressions > 0);
  const avgEngRate = postsWithMetrics.length > 0
    ? (postsWithMetrics.reduce((sum, p) => sum + extractMetrics(p.metrics).engRate, 0) / postsWithMetrics.length).toFixed(1)
    : '0';

  // Count by type
  const typeCounts = {};
  for (const p of posts) {
    const type = (p.meta || {}).asset_type || (p.metrics || {}).asset_type || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Top 10 by engagement rate (with minimum 100 impressions to filter noise)
  const topByEngagement = [...posts]
    .filter(p => extractMetrics(p.metrics).impressions >= 100)
    .sort((a, b) => extractMetrics(b.metrics).engRate - extractMetrics(a.metrics).engRate)
    .slice(0, 10);

  // Top 10 by impressions
  const topByImpressions = [...posts]
    .sort((a, b) => extractMetrics(b.metrics).impressions - extractMetrics(a.metrics).impressions)
    .slice(0, 10);

  // Date range
  const dates = posts.map(p => (p.meta || {}).published_at || (p.metrics || {}).posted_at || '').filter(d => d).sort();

  let md = `# ${brandName} Published Posts Index\n\n`;
  md += `**LinkedIn Page:** ${pageName}\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Posts:** ${totalPosts}\n`;
  md += `**Date Range:** ${dates[0] || '?'} to ${dates[dates.length - 1] || '?'}\n\n`;

  md += `## Summary Stats\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Impressions | ${totalImpressions.toLocaleString()} |\n`;
  md += `| Total Reactions | ${totalReactions.toLocaleString()} |\n`;
  md += `| Total Comments | ${totalComments.toLocaleString()} |\n`;
  md += `| Avg Engagement Rate | ${avgEngRate}% |\n\n`;

  md += `## Content Mix\n\n`;
  md += `| Type | Count |\n|------|-------|\n`;
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    md += `| ${type} | ${count} |\n`;
  }
  md += '\n';

  md += `## Top 10 by Engagement Rate (min 100 impressions)\n\n`;
  for (const p of topByEngagement) {
    md += formatPostEntry(p) + '\n';
  }

  md += `## Top 10 by Impressions\n\n`;
  for (const p of topByImpressions) {
    md += formatPostEntry(p) + '\n';
  }

  md += `## All Posts (newest first)\n\n`;
  const sorted = [...posts].sort((a, b) => {
    const dateA = (a.meta || {}).published_at || (a.metrics || {}).posted_at || '';
    const dateB = (b.meta || {}).published_at || (b.metrics || {}).posted_at || '';
    return dateB.localeCompare(dateA);
  });

  for (const p of sorted) {
    md += formatPostEntry(p) + '\n';
  }

  return md;
}

/**
 * Generate master index across Titan and Titanverse LinkedIn brands
 */
function generateMasterIndex(titanPosts, titanversePosts) {
  const otherPlatforms = {};
  const now = new Date().toISOString().split('T')[0];

  let md = `# TITAN Content Master Index\n\n`;
  md += `**Generated:** ${now}\n\n`;
  md += `This file gives Claude a single-read overview of all published content.\n`;
  md += `For full post details, read the platform posts.json files.\n\n`;

  // ── LinkedIn overview ──────────────────────────────────────────────────
  md += `## LinkedIn\n\n`;
  md += `| Brand | Posts | Impressions | Avg Engagement |\n`;
  md += `|-------|-------|-------------|----------------|\n`;

  for (const [name, posts] of [['Titan PMR', titanPosts], ['Titanverse', titanversePosts]]) {
    const total = posts.length;
    const impressions = posts.reduce((s, p) => s + extractMetrics(p.metrics).impressions, 0);
    const withMetrics = posts.filter(p => extractMetrics(p.metrics).impressions > 0);
    const avgEng = withMetrics.length > 0
      ? (withMetrics.reduce((s, p) => s + extractMetrics(p.metrics).engRate, 0) / withMetrics.length).toFixed(1)
      : '0';
    md += `| ${name} | ${total} | ${impressions.toLocaleString()} | ${avgEng}% |\n`;
  }
  md += '\n';

  // ── Other platforms overview ───────────────────────────────────────────
  const platformLabels = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube_longform: 'YouTube (Long-form)',
    youtube_shorts: 'YouTube (Shorts)',
    blog: 'Blog',
  };

  const platformEntries = Object.entries(otherPlatforms).filter(([, posts]) => posts.length > 0);
  if (platformEntries.length > 0) {
    md += `## Other Platforms\n\n`;
    md += `| Platform | Posts | Total Views | Total Likes |\n`;
    md += `|----------|-------|-------------|-------------|\n`;
    for (const [platform, posts] of platformEntries) {
      const label = platformLabels[platform] || platform;
      const totalViews = posts.reduce((s, p) => s + (extractMetrics(p.metrics).views || 0), 0);
      const totalLikes = posts.reduce((s, p) => s + (extractMetrics(p.metrics).reactions || 0), 0);
      md += `| ${label} | ${posts.length} | ${totalViews.toLocaleString()} | ${totalLikes.toLocaleString()} |\n`;
    }
    md += '\n';
  }

  // ── LinkedIn top performers ────────────────────────────────────────────
  const allLinkedInPosts = [
    ...titanPosts.map(p => ({ ...p, _brand: 'titan' })),
    ...titanversePosts.map(p => ({ ...p, _brand: 'titanverse' })),
  ];

  const topPerformers = [...allLinkedInPosts]
    .filter(p => extractMetrics(p.metrics).impressions >= 100)
    .sort((a, b) => extractMetrics(b.metrics).engRate - extractMetrics(a.metrics).engRate)
    .slice(0, 15);

  md += `## Top 15 LinkedIn Posts (by engagement rate, min 100 impressions)\n\n`;
  for (const p of topPerformers) {
    const brand = p._brand === 'titan' ? '[TITAN]' : '[TV]';
    md += `${brand} `;
    md += formatPostEntry(p) + '\n';
  }

  // ── Recent posts (last 30 days, LinkedIn only) ─────────────────────────
  const allDates = allLinkedInPosts
    .map(p => (p.meta || {}).published_at || (p.metrics || {}).posted_at || '')
    .filter(d => d)
    .sort();
  const newestDate = allDates[allDates.length - 1];
  if (newestDate) {
    const cutoff = new Date(newestDate);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const recentPosts = allLinkedInPosts
      .filter(p => {
        const d = (p.meta || {}).published_at || (p.metrics || {}).posted_at || '';
        return d >= cutoffStr;
      })
      .sort((a, b) => {
        const dA = (a.meta || {}).published_at || (a.metrics || {}).posted_at || '';
        const dB = (b.meta || {}).published_at || (b.metrics || {}).posted_at || '';
        return dB.localeCompare(dA);
      });

    md += `## Recent LinkedIn Posts (last 30 days from ${newestDate})\n\n`;
    for (const p of recentPosts) {
      const brand = p._brand === 'titan' ? '[TITAN]' : '[TV]';
      md += `${brand} `;
      md += formatPostEntry(p) + '\n';
    }
  }

  // ── Content type distribution (LinkedIn) ──────────────────────────────
  md += `## LinkedIn Content Type Distribution\n\n`;
  md += `| Type | Titan | Titanverse | Total |\n`;
  md += `|------|-------|------------|-------|\n`;
  const allTypes = new Set();
  const titanTypes = {};
  const tvTypes = {};
  for (const p of titanPosts) {
    const t = (p.meta || {}).asset_type || 'unknown';
    titanTypes[t] = (titanTypes[t] || 0) + 1;
    allTypes.add(t);
  }
  for (const p of titanversePosts) {
    const t = (p.meta || {}).asset_type || 'unknown';
    tvTypes[t] = (tvTypes[t] || 0) + 1;
    allTypes.add(t);
  }
  for (const t of [...allTypes].sort()) {
    const tc = titanTypes[t] || 0;
    const tvc = tvTypes[t] || 0;
    md += `| ${t} | ${tc} | ${tvc} | ${tc + tvc} |\n`;
  }

  // ── File locations ─────────────────────────────────────────────────────
  md += `\n## File Locations\n\n`;
  md += `**LinkedIn (full data):**\n`;
  md += `- \`posts/linkedin/titan/published/posts.json\` — Full Titan post data\n`;
  md += `- \`posts/linkedin/titanverse/published/posts.json\` — Full Titanverse post data\n`;
  md += `- \`posts/linkedin/titan/published/_index.md\` — Titan overview + top performers\n`;
  md += `- \`posts/linkedin/titanverse/published/_index.md\` — Titanverse overview + top performers\n\n`;
  md += `**Other platforms (posts.json per platform):**\n`;
  for (const { platform, dir } of [
    { platform: 'TikTok',           dir: 'posts/tiktok/published/posts.json' },
    { platform: 'Instagram',        dir: 'posts/instagram/published/posts.json' },
    { platform: 'Facebook',         dir: 'posts/facebook/published/posts.json' },
    { platform: 'YouTube Long-form',dir: 'posts/youtube/longform/published/posts.json' },
    { platform: 'YouTube Shorts',   dir: 'posts/youtube/shorts/published/posts.json' },
    { platform: 'Blog',             dir: 'posts/blog/published/posts.json' },
  ]) {
    md += `- \`${dir}\` — ${platform}\n`;
  }
  md += `\n**Analytics:**\n`;
  md += `- \`analytics/aggregated-linkedin-metrics.json\` — LinkedIn post-level aggregated metrics\n`;
  md += `- \`data/notion/notion_export.json\` — Full Notion DB snapshot (live data: query Notion MCP)\n`;

  return md;
}

/**
 * Build a compact JSON file for Claude — full captions, alt text, transcripts, metrics.
 * One read = full picture of all posts for a brand or platform.
 *
 * @param {Array}  posts        - from readPublishedPosts()
 * @param {string} brand        - e.g. 'titan', 'titanverse', 'tiktok', 'instagram'
 * @param {string} publishedDir - output directory
 * @param {string} [platform]   - optional platform override for metadata (defaults to brand)
 */
function buildPostsJson(posts, brand, publishedDir, platform) {
  const sorted = [...posts].sort((a, b) => {
    const dateA = (a.meta || {}).published_at || (a.metrics || {}).posted_at || '';
    const dateB = (b.meta || {}).published_at || (b.metrics || {}).posted_at || '';
    return dateB.localeCompare(dateA);
  });

  const output = sorted.map(post => {
    const meta = post.meta || {};
    const rawMetrics = post.metrics || {};
    const mx = extractMetrics(rawMetrics);

    const entry = {
      slug: post.slug,
      date: meta.published_at || rawMetrics.posted_at || null,
      type: meta.asset_type || rawMetrics.asset_type || null,
      platform: platform || brand,
      brand: meta.brand || meta.page || brand,
      campaign: meta.campaign || null,
      notion_id: meta.notion_id || null,
      notion_url: meta.notion_url || null,
      post_url: rawMetrics.post_url || null,
      caption: post.caption || null,
      alt_text: post.altText || null,
      transcript: post.transcript || null,
      comments: post.comments || null,
      metrics: {
        source: mx.source,
        impressions: mx.impressions,
        reactions: mx.reactions,
        comments_count: mx.comments,
        reposts: mx.reposts,
        clicks: mx.clicks,
        ctr: mx.ctr,
        engagement_rate: mx.engRate,
        views: mx.views,
        boosted: mx.boosted,
      },
    };

    // Include platform-specific API fields when populated
    const api = rawMetrics.platform_api || {};
    if (api.synced_at) {
      const extras = {};
      if (api.saves != null && api.saves !== 0) extras.saves = api.saves;
      if (api.avg_watch_time_seconds != null && api.avg_watch_time_seconds !== 0) extras.avg_watch_time_seconds = api.avg_watch_time_seconds;
      if (api.total_play_time_seconds != null && api.total_play_time_seconds !== 0) extras.total_play_time_seconds = api.total_play_time_seconds;
      if (api.watch_time_hours != null && api.watch_time_hours !== 0) extras.watch_time_hours = api.watch_time_hours;
      if (api.avg_view_duration_seconds != null && api.avg_view_duration_seconds !== 0) extras.avg_view_duration_seconds = api.avg_view_duration_seconds;
      if (api.subscribers_gained != null && api.subscribers_gained !== 0) extras.subscribers_gained = api.subscribers_gained;
      if (api.reach != null && api.reach !== 0) extras.reach = api.reach;
      if (Object.keys(extras).length > 0) entry.metrics_platform_extras = extras;
    }

    return entry;
  });

  const result = {
    generated_at: new Date().toISOString(),
    platform: platform || brand,
    total_posts: output.length,
    posts: output,
  };

  const outPath = path.join(publishedDir, 'posts.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`✓ Wrote ${outPath} (${output.length} posts)`);
}

// ─── Main ───────────────────────────────────────────────────────────────

console.log('Building content indexes...\n');

// ── LinkedIn ────────────────────────────────────────────────────────────

const titanDir = path.join(POSTS_DIR, 'linkedin', 'titan', 'published');
console.log(`Reading Titan posts from: ${titanDir}`);
const titanPosts = readPublishedPosts(titanDir);
console.log(`  Found ${titanPosts.length} posts`);

const tvDir = path.join(POSTS_DIR, 'linkedin', 'titanverse', 'published');
console.log(`Reading Titanverse posts from: ${tvDir}`);
const titanversePosts = readPublishedPosts(tvDir);
console.log(`  Found ${titanversePosts.length} posts`);

// Brand-level _index.md files (LinkedIn only — rich enough to warrant per-brand indexes)
const titanIndex = generateBrandIndex('Titan PMR', 'Titan PMR', titanPosts);
const titanIndexPath = path.join(titanDir, '_index.md');
fs.writeFileSync(titanIndexPath, titanIndex);
console.log(`\n✓ Wrote ${titanIndexPath}`);

const tvIndex = generateBrandIndex('Titanverse', 'Titanverse', titanversePosts);
const tvIndexPath = path.join(tvDir, '_index.md');
fs.writeFileSync(tvIndexPath, tvIndex);
console.log(`✓ Wrote ${tvIndexPath}`);

// LinkedIn posts.json
buildPostsJson(titanPosts, 'titan', titanDir, 'linkedin');
buildPostsJson(titanversePosts, 'titanverse', tvDir, 'linkedin');

// ── Master index ────────────────────────────────────────────────────────

const masterIndex = generateMasterIndex(titanPosts, titanversePosts);
const masterIndexPath = path.join(POSTS_DIR, '_master-index.md');
fs.writeFileSync(masterIndexPath, masterIndex);
console.log(`\n✓ Wrote ${masterIndexPath}`);

console.log('\nDone. Claude can now read any index file for instant context.');
