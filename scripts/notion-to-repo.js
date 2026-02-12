#!/usr/bin/env node
/**
 * Notion → Repo Sync
 *
 * Queries the Notion database for published posts and creates corresponding
 * post directories in the repo. Designed to run as a GitHub Action daily,
 * or manually after publishing.
 *
 * What it does:
 *   1. Queries Notion for posts with Publish Status = "✅ Published"
 *   2. For each post, checks if a repo directory already exists
 *   3. If not, creates: caption.md, meta.json, metrics.json, alt-text.md, comments.md, assets/
 *   4. Metrics file is created with "pending" status — to be filled when LinkedIn API is connected
 *
 * Environment variables:
 *   NOTION_TOKEN        — Notion integration token (ntn_...)
 *   NOTION_DATABASE_ID  — Database ID (157f423bea8b8149b546e7279b4ea0c0)
 *
 * Usage:
 *   node scripts/notion-to-repo.js              # Sync all published posts
 *   node scripts/notion-to-repo.js --dry-run    # Preview what would be created
 *   node scripts/notion-to-repo.js --since 7    # Only posts published in last 7 days
 *
 * Run: node scripts/notion-to-repo.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ─────────────────────────────────────────────────────────────

const REPO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(REPO_ROOT, 'posts');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '157f423bea8b8149b546e7279b4ea0c0';

const DRY_RUN = process.argv.includes('--dry-run');
const SINCE_DAYS = (() => {
  const idx = process.argv.indexOf('--since');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : null;
})();

// Platform tag → repo path mapping
const PLATFORM_MAP = {
  'LI-PAGE@titanpmr': { platform: 'linkedin', brand: 'titan', page: 'Titan PMR' },
  'LI-PAGE@titanverse': { platform: 'linkedin', brand: 'titanverse', page: 'Titanverse' },
  'TIKTOK@titanpmr': { platform: 'tiktok', brand: null, page: 'Titan PMR' },
  'YT@titanpmr': { platform: 'youtube', brand: null, page: 'Titan PMR' },
  'IN@titanpmr': { platform: 'instagram', brand: null, page: 'Titan PMR' },
  'FB@TITAN PMR': { platform: 'facebook', brand: null, page: 'Titan PMR' },
};

// Content type → asset_type mapping
const CONTENT_TYPE_MAP = {
  'Single-Image Post': 'single-image',
  'Single Image': 'single-image',
  'Carousel Post': 'carousel',
  'Infographics': 'infographic',
  'Testimonial Videos': 'video',
  'Explainer Videos': 'video',
  'Industry Insight Videos': 'video',
  'Short-Form Social Clips': 'short_video',
  'Video': 'video',
  'Loop Animation': 'video',
  'Meme': 'single-image',
  'Polls & Q&A': 'poll',
  'Stat/Infographic': 'single-image',
  '"This or That" & Quickfire Comparisons': 'single-image',
  'Thought Leadership Posts': 'single-image',
  'Competitive Positioning Posts': 'single-image',
  'Behind-the-Scenes Content': 'video',
  'User-Generated Content': 'video',
  'Regulatory Updates & Industry Commentary': 'carousel',
  'Case Studies & Customer Success Stories': 'carousel',
  'LinkedIn Articles': 'article',
  'Whitepapers & Reports': 'document',
  'Website Blog': 'article',
  'Website Link': 'link',
  'Influencer Video': 'video',
  'Trust Pilot Reviews': 'carousel',
  'Webinar': 'video',
};

// ─── Notion API ─────────────────────────────────────────────────────────

function notionRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.notion.com',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error(`Failed to parse Notion response: ${responseData.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function queryPublishedPosts(startCursor) {
  const filter = {
    property: 'Publish Status',
    select: { equals: '✅ Published' },
  };

  // Optionally filter by date
  let andFilters = [filter];
  if (SINCE_DAYS) {
    const since = new Date();
    since.setDate(since.getDate() - SINCE_DAYS);
    andFilters.push({
      property: 'Time',
      date: { on_or_after: since.toISOString().split('T')[0] },
    });
  }

  const body = {
    filter: andFilters.length > 1 ? { and: andFilters } : filter,
    sorts: [{ property: 'Time', direction: 'descending' }],
    page_size: 100,
  };

  if (startCursor) body.start_cursor = startCursor;

  return notionRequest(`/v1/databases/${NOTION_DATABASE_ID}/query`, body);
}

async function getAllPublishedPosts() {
  const allPosts = [];
  let cursor = undefined;
  let page = 1;

  do {
    console.log(`  Fetching page ${page}...`);
    const response = await queryPublishedPosts(cursor);

    if (response.object === 'error') {
      throw new Error(`Notion API error: ${response.message}`);
    }

    allPosts.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
    page++;
  } while (cursor);

  return allPosts;
}

// ─── Extract Notion Properties ──────────────────────────────────────────

function getPlainText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return (prop.title || []).map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return (prop.rich_text || []).map(t => t.plain_text).join('');
  return '';
}

function getSelect(prop) {
  if (!prop || prop.type !== 'select' || !prop.select) return '';
  return prop.select.name || '';
}

function getMultiSelect(prop) {
  if (!prop || prop.type !== 'multi_select') return [];
  return (prop.multi_select || []).map(o => o.name);
}

function getDate(prop) {
  if (!prop || prop.type !== 'date' || !prop.date) return '';
  return prop.date.start || '';
}

function getNumber(prop) {
  if (!prop || prop.type !== 'number') return 0;
  return prop.number || 0;
}

function extractPostData(page) {
  const props = page.properties;

  return {
    notionId: page.id,
    notionUrl: page.url,
    name: getPlainText(props['Name']),
    caption: getPlainText(props['Post Caption']),
    idea: getPlainText(props['Idea']),
    contentType: getSelect(props['Content Type']),
    publishStatus: getSelect(props['Publish Status']),
    postStatus: props['Post Status'] ? (props['Post Status'].status || {}).name || '' : '',
    platforms: getMultiSelect(props['Platforms']),
    campaign: getSelect(props['Campaign']),
    phase: getSelect(props['Phase']),
    publishDate: getDate(props['Time']),
    postUrl: getPlainText(props['Post URL']),
    views: getNumber(props['Views']),
    likes: getNumber(props['Likes']),
    comments: getNumber(props['Comments']),
    shares: getNumber(props['Shares']),
    designFile: props['Design File'] && props['Design File'].type === 'url' ? props['Design File'].url || '' : '',
  };
}

// ─── Slug Generation ────────────────────────────────────────────────────

function generateSlug(name, date) {
  // Extract just the date part (YYYY-MM-DD)
  const dateStr = date ? date.split('T')[0] : '';

  // Strip common prefixes
  let slug = name
    .replace(/^(TITAN_|TV_|TITANUP_|LEADERS_|DEC\d+_\w+_)/i, '');

  // Replace underscores with hyphens first
  slug = slug.replace(/_/g, '-');

  // Insert hyphens before uppercase letters BUT keep consecutive uppercase together
  // e.g. "HOD" stays as "hod", "BatchFlow" becomes "batch-flow"
  slug = slug.replace(/([a-z0-9])([A-Z])/g, '$1-$2');

  // Replace non-alphanumeric with hyphens, collapse, trim
  slug = slug
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return dateStr ? `${dateStr}-${slug}` : slug;
}

// ─── Determine Repo Path ────────────────────────────────────────────────

function getRepoPaths(post) {
  const paths = [];

  for (const platformTag of post.platforms) {
    const mapping = PLATFORM_MAP[platformTag];
    if (!mapping) {
      console.warn(`    ⚠ Unknown platform tag: ${platformTag}`);
      continue;
    }

    let repoPath;
    if (mapping.platform === 'linkedin') {
      repoPath = path.join(POSTS_DIR, 'linkedin', mapping.brand, 'published');
    } else if (mapping.platform === 'youtube') {
      // Determine shorts vs longform from content type
      const isShort = post.contentType === 'Short-Form Social Clips';
      repoPath = path.join(POSTS_DIR, 'youtube', isShort ? 'shorts' : 'longform', 'published');
    } else {
      repoPath = path.join(POSTS_DIR, mapping.platform, 'published');
    }

    paths.push({
      dir: repoPath,
      platform: mapping.platform,
      brand: mapping.brand,
      page: mapping.page,
    });
  }

  return paths;
}

// ─── File Generators ────────────────────────────────────────────────────

function generateCaption(post, slug) {
  const caption = post.caption
    .replace(/<br\s*\/?>/gi, '\n')  // Notion <br> to newlines
    .replace(/<[^>]+>/g, '');        // Strip any remaining HTML

  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';

  return `# LinkedIn Caption – ${post.name}

Post date: ${dateStr}
Platform: LinkedIn
Creative ID: ${slug}

---

${caption}
`;
}

function generateMeta(post, platformInfo) {
  const assetType = CONTENT_TYPE_MAP[post.contentType] || post.contentType || '';
  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';

  return JSON.stringify({
    platform: platformInfo.platform === 'linkedin' ? 'LinkedIn' : platformInfo.platform,
    asset_type: assetType,
    theme: '',
    campaign: post.campaign || '',
    status: 'published',
    published_at: dateStr,
    brand: platformInfo.brand || '',
    linkedin_page: platformInfo.page || '',
    notion_id: post.notionId,
    notion_url: post.notionUrl,
  }, null, 2) + '\n';
}

function notionMetricsNote(post) {
  const parts = ['Metrics pending — full data awaiting LinkedIn API.'];
  if (post.views || post.likes || post.comments || post.shares) {
    parts.push(`Notion surface metrics: ${post.views} views, ${post.likes} likes, ${post.comments} comments, ${post.shares} shares.`);
  }
  parts.push('Auto-created from Notion sync.');
  return parts.join(' ');
}

function generateMetrics(post, slug, platformInfo) {
  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';
  const assetType = CONTENT_TYPE_MAP[post.contentType] || post.contentType || '';

  // Extract post URL for this specific platform from the Post URL field
  let postUrl = '';
  if (post.postUrl) {
    const urls = post.postUrl.match(/https?:\/\/[^\s)]+/g) || [];
    for (const url of urls) {
      if (platformInfo.platform === 'linkedin' && url.includes('linkedin.com')) postUrl = url;
      else if (platformInfo.platform === 'facebook' && url.includes('facebook.com')) postUrl = url;
      else if (platformInfo.platform === 'instagram' && url.includes('instagram.com')) postUrl = url;
      else if (platformInfo.platform === 'tiktok' && url.includes('tiktok.com')) postUrl = url;
      else if (platformInfo.platform === 'youtube' && url.includes('youtube.com')) postUrl = url;
    }
  }

  return JSON.stringify({
    platform: platformInfo.platform,
    post_url: postUrl,
    posted_at: dateStr,
    campaign_slug: slug,
    asset_type: assetType,
    boosted: false,
    sponsored_dates: { start: '', end: '' },
    impressions: 0,
    reach: 0,
    views: post.views || 0,
    watch_time_hours: 0,
    avg_view_duration_seconds: 0,
    clicks: 0,
    ctr: 0,
    reactions: post.likes || 0,
    comments: post.comments || 0,
    reposts: post.shares || 0,
    follows: 0,
    leads: 0,
    engagements: 0,
    engagement_rate: 0,
    organic: {
      impressions: 0, reach: 0, engagements: 0, engagement_rate: 0,
      clicks: 0, click_through_rate: 0, reactions: 0, comments: 0,
      reposts: 0, page_viewers: 0, followers_gained: 0,
      video_views: 0, watch_time_total: '', average_watch_time_seconds: 0,
    },
    sponsored: {
      impressions: 0, engagements: 0, engagement_rate: 0,
      clicks: 0, click_through_rate: 0, reactions: 0, comments: 0,
      reposts: 0, video_views: 0, ecpm: 0, cost_per_engagement: 0, spend: 0,
    },
    notes: notionMetricsNote(post),
  }, null, 2) + '\n';
}

function generateAltText(post) {
  const idea = post.idea
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  if (!idea) {
    return `# ${post.name} – Alt Text

Alt text pending. Add description of the visual content here.
`;
  }

  return `# ${post.name} – Alt Text

## Design Brief (from Notion)

${idea}

## Alt Text

Alt text to be added after asset is finalised.
`;
}

function generateComments(post, slug) {
  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';
  return `# LinkedIn Comments – ${post.name}

Post date: ${dateStr}
Platform: LinkedIn
Creative ID: ${slug}

---

## Top-Level Comments

No comments captured yet.
`;
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  if (!NOTION_TOKEN) {
    console.error('Error: NOTION_TOKEN environment variable is required.');
    console.error('Set it with: export NOTION_TOKEN=ntn_...');
    process.exit(1);
  }

  console.log('=== Notion → Repo Sync ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  if (SINCE_DAYS) console.log(`Filter: Posts published in last ${SINCE_DAYS} days`);
  console.log('');

  // 1. Query Notion
  console.log('Querying Notion for published posts...');
  const pages = await getAllPublishedPosts();
  console.log(`  Found ${pages.length} published posts\n`);

  // 2. Process each post
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const page of pages) {
    const post = extractPostData(page);

    if (!post.name) {
      console.warn(`  ⚠ Skipping post with no name (${post.notionId})`);
      skipped++;
      continue;
    }

    if (!post.publishDate) {
      console.warn(`  ⚠ Skipping ${post.name}: no publish date`);
      skipped++;
      continue;
    }

    if (post.platforms.length === 0) {
      console.warn(`  ⚠ Skipping ${post.name}: no platforms assigned`);
      skipped++;
      continue;
    }

    const slug = generateSlug(post.name, post.publishDate);
    const repoPaths = getRepoPaths(post);

    for (const pathInfo of repoPaths) {
      const postDir = path.join(pathInfo.dir, slug);

      // Check if already exists
      if (fs.existsSync(postDir)) {
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create: ${path.relative(REPO_ROOT, postDir)}`);
        created++;
        continue;
      }

      try {
        // Create directory
        fs.mkdirSync(postDir, { recursive: true });
        fs.mkdirSync(path.join(postDir, 'assets'), { recursive: true });

        // Write files
        fs.writeFileSync(path.join(postDir, 'caption.md'), generateCaption(post, slug));
        fs.writeFileSync(path.join(postDir, 'meta.json'), generateMeta(post, pathInfo));
        fs.writeFileSync(path.join(postDir, 'metrics.json'), generateMetrics(post, slug, pathInfo));
        fs.writeFileSync(path.join(postDir, 'alt-text.md'), generateAltText(post));
        fs.writeFileSync(path.join(postDir, 'comments.md'), generateComments(post, slug));
        fs.writeFileSync(path.join(postDir, 'assets', '.gitkeep'), '');

        console.log(`  ✓ Created: ${path.relative(REPO_ROOT, postDir)}`);
        created++;
      } catch (err) {
        console.error(`  ✗ Error creating ${path.relative(REPO_ROOT, postDir)}: ${err.message}`);
        errors++;
      }
    }
  }

  // 3. Summary
  console.log('\n=== Summary ===');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist or incomplete): ${skipped}`);
  if (errors) console.log(`  Errors: ${errors}`);
  console.log('');

  if (created > 0 && !DRY_RUN) {
    console.log('Next steps:');
    console.log('  1. Run: node scripts/build-indexes.js   (regenerate indexes)');
    console.log('  2. Commit and push the new post directories');
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
