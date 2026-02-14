#!/usr/bin/env node
// Build a single JSON index of all published posts for the titan-dashboard.
// Scans posts/linkedin/{titan,titanverse}/published/ and reads meta.json,
// metrics.json, and caption.md per post. Outputs analytics/published-posts-index.json.
//
// This index lets the dashboard's Content Engine work on Vercel (serverless)
// without needing local filesystem access to the TITAN repo.

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const OUTPUT_PATH = path.join(__dirname, '..', 'analytics', 'published-posts-index.json');

// ─── Helpers ───────────────────────────────────────────────────────────

function readJsonSafe(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch {
    return '';
  }
}

// ─── Scanner ───────────────────────────────────────────────────────────

function scanBrand(brand) {
  const publishedDir = path.join(POSTS_DIR, 'linkedin', brand, 'published');

  if (!fs.existsSync(publishedDir)) {
    console.warn(`⚠️  Directory not found: ${publishedDir}`);
    return [];
  }

  const entries = fs.readdirSync(publishedDir, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const folderPath = path.join(publishedDir, entry.name);
    const meta = readJsonSafe(path.join(folderPath, 'meta.json'), {});
    const metrics = readJsonSafe(path.join(folderPath, 'metrics.json'), {});
    const caption = readFileSafe(path.join(folderPath, 'caption.md'));

    // Use organic metrics when available (same logic as aggregate-metrics.js)
    const organic = metrics.organic || {};

    posts.push({
      slug: entry.name,
      brand,
      content_pillar: meta.content_pillar || null,
      asset_type: meta.asset_type || 'unknown',
      published_at: meta.published_at || metrics.posted_at || '',
      campaign: meta.campaign || metrics.campaign_slug || '',
      featured_customer: meta.featured_customer || null,
      // Metrics — prefer organic sub-object, fallback to top-level
      impressions: organic.impressions || metrics.impressions || 0,
      reach: organic.reach || metrics.reach || 0,
      engagement_rate: organic.engagement_rate || metrics.engagement_rate || 0,
      reactions: organic.reactions || metrics.reactions || 0,
      comments: organic.comments || metrics.comments || 0,
      reposts: organic.reposts || metrics.reposts || 0,
      clicks: organic.clicks || metrics.clicks || 0,
      follows: organic.followers_gained || metrics.follows || 0,
      video_views: organic.video_views || metrics.views || 0,
      // Caption (full text — dashboard uses this for AI classification)
      caption,
    });
  }

  return posts;
}

// ─── Main ──────────────────────────────────────────────────────────────

function main() {
  try {
    console.log('=== Building Published Posts Index ===');
    console.log(`Posts directory: ${POSTS_DIR}`);

    if (!fs.existsSync(POSTS_DIR)) {
      console.error(`❌ Posts directory not found: ${POSTS_DIR}`);
      return 1;
    }

    const titanPosts = scanBrand('titan');
    const titanversePosts = scanBrand('titanverse');
    const allPosts = [...titanPosts, ...titanversePosts];

    console.log(`Found ${allPosts.length} published posts (${titanPosts.length} Titan, ${titanversePosts.length} Titanverse)`);

    // Sort by date descending
    allPosts.sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));

    const output = {
      metadata: {
        generated_at: new Date().toISOString(),
        total_posts: allPosts.length,
        titan_count: titanPosts.length,
        titanverse_count: titanversePosts.length,
      },
      posts: allPosts,
    };

    // Ensure analytics directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const json = JSON.stringify(output, null, 2);
    fs.writeFileSync(OUTPUT_PATH, json, 'utf-8');

    const stats = fs.statSync(OUTPUT_PATH);
    console.log(`✓ Wrote ${OUTPUT_PATH} (${(stats.size / 1024).toFixed(1)} KB)`);
    console.log(`\n✅ Published posts index built successfully!`);
    return 0;
  } catch (error) {
    console.error(`\n❌ Unexpected error: ${error.message}`);
    console.error(error.stack);
    return 1;
  }
}

try {
  const exitCode = main();
  process.exit(exitCode || 0);
} catch (error) {
  console.error('=== UNHANDLED ERROR ===');
  console.error(error.message);
  process.exit(1);
}
