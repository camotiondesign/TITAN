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

      posts.push(post);
    } catch (err) {
      console.warn(`  Skipping ${entry}: ${err.message}`);
    }
  }

  return posts;
}

/**
 * Format a single post as a compact markdown entry
 */
function formatPostEntry(post) {
  const m = post.metrics || {};
  const meta = post.meta || {};

  const date = meta.published_at || m.posted_at || '?';
  const type = meta.asset_type || m.asset_type || '?';
  const impressions = m.impressions || 0;
  const engRate = parseNum(m.engagement_rate);
  const reactions = m.reactions || 0;
  const comments = m.comments || 0;
  const reposts = m.reposts || 0;
  const clicks = m.clicks || 0;
  const ctr = parseNum(m.ctr);
  const boosted = m.boosted ? ' [BOOSTED]' : '';
  const views = m.views || 0;

  // Truncate caption to first 200 chars for index
  let captionPreview = (post.caption || '').replace(/\n/g, ' ').trim();
  if (captionPreview.length > 200) {
    captionPreview = captionPreview.substring(0, 200) + '...';
  }

  let entry = `### ${post.slug}\n`;
  entry += `**Date:** ${date} | **Type:** ${type}${boosted}\n`;
  entry += `**Impressions:** ${impressions.toLocaleString()} | **Engagement:** ${engRate}% | **CTR:** ${ctr}%\n`;
  entry += `**Reactions:** ${reactions} | **Comments:** ${comments} | **Reposts:** ${reposts} | **Clicks:** ${clicks.toLocaleString()}`;
  if (views > 0) entry += ` | **Views:** ${views.toLocaleString()}`;
  entry += '\n';
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
  const totalImpressions = posts.reduce((sum, p) => sum + ((p.metrics || {}).impressions || 0), 0);
  const totalReactions = posts.reduce((sum, p) => sum + ((p.metrics || {}).reactions || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + ((p.metrics || {}).comments || 0), 0);
  const postsWithMetrics = posts.filter(p => ((p.metrics || {}).impressions || 0) > 0);
  const avgEngRate = postsWithMetrics.length > 0
    ? (postsWithMetrics.reduce((sum, p) => sum + parseNum((p.metrics || {}).engagement_rate), 0) / postsWithMetrics.length).toFixed(1)
    : '0';

  // Count by type
  const typeCounts = {};
  for (const p of posts) {
    const type = (p.meta || {}).asset_type || (p.metrics || {}).asset_type || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Top 10 by engagement rate (with minimum 100 impressions to filter noise)
  const topByEngagement = [...posts]
    .filter(p => ((p.metrics || {}).impressions || 0) >= 100)
    .sort((a, b) => parseNum((b.metrics || {}).engagement_rate) - parseNum((a.metrics || {}).engagement_rate))
    .slice(0, 10);

  // Top 10 by impressions
  const topByImpressions = [...posts]
    .sort((a, b) => ((b.metrics || {}).impressions || 0) - ((a.metrics || {}).impressions || 0))
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
 * Generate master index across all brands
 */
function generateMasterIndex(titanPosts, titanversePosts) {
  const now = new Date().toISOString().split('T')[0];

  let md = `# TITAN Content Master Index\n\n`;
  md += `**Generated:** ${now}\n\n`;
  md += `This file gives Claude a single-read overview of all published content.\n`;
  md += `For full post details, read the brand-specific indexes.\n\n`;

  md += `## Overview\n\n`;
  md += `| Brand | Posts | Impressions | Avg Engagement |\n`;
  md += `|-------|-------|-------------|----------------|\n`;

  for (const [name, posts] of [['Titan PMR', titanPosts], ['Titanverse', titanversePosts]]) {
    const total = posts.length;
    const impressions = posts.reduce((s, p) => s + ((p.metrics || {}).impressions || 0), 0);
    const withMetrics = posts.filter(p => ((p.metrics || {}).impressions || 0) > 0);
    const avgEng = withMetrics.length > 0
      ? (withMetrics.reduce((s, p) => s + parseNum((p.metrics || {}).engagement_rate), 0) / withMetrics.length).toFixed(1)
      : '0';
    md += `| ${name} | ${total} | ${impressions.toLocaleString()} | ${avgEng}% |\n`;
  }
  md += '\n';

  // Combined top performers
  const allPosts = [
    ...titanPosts.map(p => ({ ...p, brand: 'titan' })),
    ...titanversePosts.map(p => ({ ...p, brand: 'titanverse' }))
  ];

  const topPerformers = [...allPosts]
    .filter(p => ((p.metrics || {}).impressions || 0) >= 100)
    .sort((a, b) => parseNum((b.metrics || {}).engagement_rate) - parseNum((a.metrics || {}).engagement_rate))
    .slice(0, 15);

  md += `## Top 15 Posts Across Both Brands (by engagement rate, min 100 impressions)\n\n`;
  for (const p of topPerformers) {
    const brand = p.brand === 'titan' ? '[TITAN]' : '[TV]';
    md += `${brand} `;
    md += formatPostEntry(p) + '\n';
  }

  // Recent posts (last 30 days from newest post)
  const allDates = allPosts
    .map(p => (p.meta || {}).published_at || (p.metrics || {}).posted_at || '')
    .filter(d => d)
    .sort();
  const newestDate = allDates[allDates.length - 1];
  if (newestDate) {
    const cutoff = new Date(newestDate);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const recentPosts = allPosts
      .filter(p => {
        const d = (p.meta || {}).published_at || (p.metrics || {}).posted_at || '';
        return d >= cutoffStr;
      })
      .sort((a, b) => {
        const dA = (a.meta || {}).published_at || (a.metrics || {}).posted_at || '';
        const dB = (b.meta || {}).published_at || (b.metrics || {}).posted_at || '';
        return dB.localeCompare(dA);
      });

    md += `## Recent Posts (last 30 days from ${newestDate})\n\n`;
    for (const p of recentPosts) {
      const brand = p.brand === 'titan' ? '[TITAN]' : '[TV]';
      md += `${brand} `;
      md += formatPostEntry(p) + '\n';
    }
  }

  // Content type distribution across brands
  md += `## Content Type Distribution\n\n`;
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

  md += `\n## File Locations\n\n`;
  md += `- Full Titan index: \`posts/linkedin/titan/published/_index.md\`\n`;
  md += `- Full Titanverse index: \`posts/linkedin/titanverse/published/_index.md\`\n`;
  md += `- Aggregated metrics JSON: \`analytics/aggregated-linkedin-metrics.json\`\n`;
  md += `- Notion export: \`data/notion/notion_export.json\`\n`;

  return md;
}

// ─── Main ───────────────────────────────────────────────────────────────

console.log('Building content indexes...\n');

// Read Titan posts
const titanDir = path.join(POSTS_DIR, 'linkedin', 'titan', 'published');
console.log(`Reading Titan posts from: ${titanDir}`);
const titanPosts = readPublishedPosts(titanDir);
console.log(`  Found ${titanPosts.length} posts`);

// Read Titanverse posts
const tvDir = path.join(POSTS_DIR, 'linkedin', 'titanverse', 'published');
console.log(`Reading Titanverse posts from: ${tvDir}`);
const titanversePosts = readPublishedPosts(tvDir);
console.log(`  Found ${titanversePosts.length} posts`);

// Generate brand indexes
const titanIndex = generateBrandIndex('Titan PMR', 'Titan PMR', titanPosts);
const titanIndexPath = path.join(titanDir, '_index.md');
fs.writeFileSync(titanIndexPath, titanIndex);
console.log(`\n✓ Wrote ${titanIndexPath}`);

const tvIndex = generateBrandIndex('Titanverse', 'Titanverse', titanversePosts);
const tvIndexPath = path.join(tvDir, '_index.md');
fs.writeFileSync(tvIndexPath, tvIndex);
console.log(`✓ Wrote ${tvIndexPath}`);

// Generate master index
const masterIndex = generateMasterIndex(titanPosts, titanversePosts);
const masterIndexPath = path.join(POSTS_DIR, '_master-index.md');
fs.writeFileSync(masterIndexPath, masterIndex);
console.log(`✓ Wrote ${masterIndexPath}`);

console.log('\nDone. Claude can now read any index file for instant context.');
