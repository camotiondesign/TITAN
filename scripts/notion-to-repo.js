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
 *   TITAN_ANTHROPIC_KEY — Anthropic API key for auto-classification (optional, falls back to ANTHROPIC_API_KEY)
 *
 * Usage:
 *   node scripts/notion-to-repo.js              # Sync all published posts (with auto-classify)
 *   node scripts/notion-to-repo.js --dry-run    # Preview what would be created
 *   node scripts/notion-to-repo.js --since 7    # Only posts published in last 7 days
 *   node scripts/notion-to-repo.js --skip-classify            # Skip AI content pillar classification
 *   node scripts/notion-to-repo.js --refresh-metrics          # Update notionsocial metrics on posts up to 14 days old
 *   node scripts/notion-to-repo.js --refresh-metrics --refresh-days 21  # Custom window (21 days)
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
const ANTHROPIC_API_KEY = process.env.TITAN_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_CLASSIFY = process.argv.includes('--skip-classify');
const REFRESH_METRICS = process.argv.includes('--refresh-metrics');
const SINCE_DAYS = (() => {
  const idx = process.argv.indexOf('--since');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : null;
})();
const REFRESH_DAYS = (() => {
  const idx = process.argv.indexOf('--refresh-days');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 14; // default 2 weeks
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

function generateSlug(name, date, contentType) {
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

  // Append content type suffix to match existing folder naming convention
  // e.g. 2026-01-15-bulk-nomination-patient-choice-carousel
  const assetType = CONTENT_TYPE_MAP[contentType] || '';
  const TYPE_SUFFIX = {
    'single-image': 'single-image',
    'carousel': 'carousel',
    'video': 'video',
    'short_video': 'short',
    'infographic': 'infographic',
    'poll': 'poll',
    'article': 'article',
    'document': 'document',
    'link': 'link',
  };
  const suffix = TYPE_SUFFIX[assetType] || '';
  if (suffix && !slug.endsWith(suffix)) {
    slug = `${slug}-${suffix}`;
  }

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

function generateCaption(post, slug, platformInfo) {
  const caption = post.caption
    .replace(/<br\s*\/?>/gi, '\n')  // Notion <br> to newlines
    .replace(/<[^>]+>/g, '');        // Strip any remaining HTML

  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';
  const platformLabel = platformInfo.platform.charAt(0).toUpperCase() + platformInfo.platform.slice(1);

  return `# ${platformLabel} Caption – ${post.name}

Post date: ${dateStr}
Platform: ${platformLabel}
Creative ID: ${slug}

---

${caption}
`;
}

function generateMeta(post, platformInfo) {
  const assetType = CONTENT_TYPE_MAP[post.contentType] || post.contentType || '';
  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';
  const platformLabel = platformInfo.platform.charAt(0).toUpperCase() + platformInfo.platform.slice(1);

  return JSON.stringify({
    platform: platformLabel,
    asset_type: assetType,
    theme: '',
    campaign: post.campaign || '',
    status: 'published',
    published_at: dateStr,
    brand: platformInfo.brand || '',
    page: platformInfo.page || '',
    notion_id: post.notionId,
    notion_url: post.notionUrl,
  }, null, 2) + '\n';
}

function extractPostUrl(post, platformInfo) {
  if (!post.postUrl) return '';
  const urls = post.postUrl.match(/https?:\/\/[^\s)]+/g) || [];
  for (const url of urls) {
    if (platformInfo.platform === 'linkedin' && url.includes('linkedin.com')) return url;
    if (platformInfo.platform === 'facebook' && url.includes('facebook.com')) return url;
    if (platformInfo.platform === 'instagram' && url.includes('instagram.com')) return url;
    if (platformInfo.platform === 'tiktok' && url.includes('tiktok.com')) return url;
    if (platformInfo.platform === 'youtube' && url.includes('youtube.com')) return url;
  }
  return '';
}

function generateMetrics(post, slug, platformInfo) {
  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';
  const assetType = CONTENT_TYPE_MAP[post.contentType] || post.contentType || '';
  const postUrl = extractPostUrl(post, platformInfo);

  // Two-tier metrics:
  // 1. notionsocial — basic surface metrics from Notionsocial (available for all platforms)
  // 2. platform_api  — full metrics from platform API (LinkedIn, YouTube, etc.)
  //    Empty until API integrations are connected. When populated, these override notionsocial values.

  const notionsocialMetrics = {
    source: 'notionsocial',
    synced_at: new Date().toISOString().split('T')[0],
    views: post.views || 0,
    likes: post.likes || 0,
    comments: post.comments || 0,
    shares: post.shares || 0,
  };

  // Platform API metrics — structure varies by platform.
  // LinkedIn has the richest data (organic/sponsored splits, CTR, engagement rate).
  // Other platforms will get their own structure when APIs are connected.
  const platformApiMetrics = platformInfo.platform === 'linkedin' ? {
    source: 'linkedin_api',
    synced_at: '',
    impressions: 0,
    reach: 0,
    clicks: 0,
    ctr: 0,
    reactions: 0,
    comments: 0,
    reposts: 0,
    follows: 0,
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
  } : platformInfo.platform === 'youtube' ? {
    source: 'youtube_api',
    synced_at: '',
    views: 0,
    watch_time_hours: 0,
    avg_view_duration_seconds: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    impressions: 0,
    ctr: 0,
    subscribers_gained: 0,
  } : platformInfo.platform === 'tiktok' ? {
    source: 'tiktok_api',
    synced_at: '',
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    avg_watch_time_seconds: 0,
    total_play_time_seconds: 0,
    reach: 0,
  } : platformInfo.platform === 'instagram' ? {
    source: 'instagram_api',
    synced_at: '',
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    engagement_rate: 0,
    plays: 0,
  } : {
    source: `${platformInfo.platform}_api`,
    synced_at: '',
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    engagement_rate: 0,
  };

  return JSON.stringify({
    platform: platformInfo.platform,
    post_url: postUrl,
    posted_at: dateStr,
    campaign_slug: slug,
    asset_type: assetType,
    boosted: false,
    notionsocial: notionsocialMetrics,
    platform_api: platformApiMetrics,
    notes: 'Auto-created from Notion sync. Notionsocial metrics are surface-level. Platform API metrics populate when API integration is connected.',
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

function generateComments(post, slug, platformInfo) {
  const dateStr = post.publishDate ? post.publishDate.split('T')[0] : '';
  const platformLabel = platformInfo.platform.charAt(0).toUpperCase() + platformInfo.platform.slice(1);
  return `# ${platformLabel} Comments – ${post.name}

Post date: ${dateStr}
Platform: ${platformLabel}
Creative ID: ${slug}

---

## Top-Level Comments

No comments captured yet.
`;
}

// ─── Auto-Classification ─────────────────────────────────────────────────

const PILLAR_DEFINITIONS = `CONTENT PILLAR DEFINITIONS:

1. "Customer Story" — Testimonials, case studies, customer transformations, before/after stories with real pharmacist names and numbers. Any post featuring a specific customer's experience with Titan/Titanverse.

2. "Product Education" — How Titan PMR or Titanverse features work. Feature spotlights, product walkthroughs, "did you know" product tips. Titan AI, Titan Batch, AVT demos, workflow automation, etc.

3. "Industry Education" — NHS funding, IP prescribing, market trends, pharmacy business insights, regulatory changes. Educational content that works even if someone never buys Titan. Industry analysis.

4. "Thought Leadership" — CEO/leadership opinion pieces, bold industry takes, vision posts, strategic commentary. Content where a leader takes a stance on the future of pharmacy.

5. "Advocacy" — Patient safety, pharmacy rights, fighting for the profession, calling out industry problems (e.g. GTIN barcodes, underfunding). Posts that take a position on an issue.

6. "Meme" — Relatable pharmacy humour, memes, "pharmacy vibes" content. Light, shareable, universal pharmacy pain points. Battery levels, Monday morning energy, etc.

7. "Event" — Conference coverage, TitanUp events, trade shows, awards, live event content, event announcements.

8. "Milestone" — Celebrations: 1000th pharmacy, anniversaries, growth milestones, team achievements. Any "we hit X" or "thank you" celebration.`;

const VALID_PILLARS = [
  'Customer Story', 'Product Education', 'Industry Education',
  'Thought Leadership', 'Advocacy', 'Meme', 'Event', 'Milestone',
];

/**
 * Call Anthropic API directly via https to classify a single post.
 * Returns the pillar name or null if classification fails.
 */
function classifyPost(caption, slug, brand, assetType) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('    ⚠ No ANTHROPIC_API_KEY — skipping auto-classify');
    return Promise.resolve(null);
  }

  const truncatedCaption = caption.length > 600 ? caption.substring(0, 600) + '...' : caption;

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `${PILLAR_DEFINITIONS}

---

Classify this post into ONE content pillar.

slug: ${slug} | brand: ${brand} | type: ${assetType}
Caption: ${truncatedCaption}

Return JSON:
{"pillar": "<exact pillar name>", "confidence": "high"|"medium"|"low", "reasoning": "<1 sentence>"}

Rules:
- Use EXACTLY one of: "Customer Story", "Product Education", "Industry Education", "Thought Leadership", "Advocacy", "Meme", "Event", "Milestone"
- If caption is empty/short, use slug name to infer
- Return ONLY valid JSON.`,
    }],
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const text = response.content?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`    ⚠ Auto-classify: no JSON in response`);
            resolve(null);
            return;
          }
          const parsed = JSON.parse(jsonMatch[0]);
          if (VALID_PILLARS.includes(parsed.pillar)) {
            resolve(parsed);
          } else {
            console.warn(`    ⚠ Auto-classify: invalid pillar "${parsed.pillar}"`);
            resolve(null);
          }
        } catch (err) {
          console.warn(`    ⚠ Auto-classify parse error: ${err.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`    ⚠ Auto-classify request error: ${err.message}`);
      resolve(null);
    });

    // 30 second timeout
    req.setTimeout(30000, () => {
      req.destroy();
      console.warn('    ⚠ Auto-classify timeout (30s)');
      resolve(null);
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Classify a post and write content_pillar to its meta.json.
 * Never throws — classification failures are logged and skipped.
 */
async function autoClassifyAndWrite(postDir, caption, slug, brand, assetType) {
  try {
    const result = await classifyPost(caption, slug, brand, assetType);
    if (!result) return;

    const metaPath = path.join(postDir, 'meta.json');
    if (!fs.existsSync(metaPath)) return;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    meta.content_pillar = result.pillar;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');

    console.log(`    🏷  Auto-classified → ${result.pillar} (${result.confidence})`);
  } catch (err) {
    console.warn(`    ⚠ Auto-classify write error: ${err.message}`);
  }
}

// ─── Metrics Refresh ─────────────────────────────────────────────────────

/**
 * Refresh notionsocial metrics for existing repo posts.
 * Queries Notion for posts within the refresh window, finds matching
 * repo directories, and updates only the notionsocial block in metrics.json.
 * Leaves platform_api and old flat metrics untouched.
 */
async function refreshMetrics(pages) {
  console.log(`\n--- Refreshing Notionsocial Metrics (last ${REFRESH_DAYS} days) ---\n`);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REFRESH_DAYS);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  let refreshed = 0;
  let notFound = 0;
  let noChange = 0;
  let errors = 0;

  for (const page of pages) {
    const post = extractPostData(page);
    if (!post.name || !post.publishDate || post.platforms.length === 0) continue;

    // Only refresh posts within the window
    const postDate = post.publishDate.split('T')[0];
    if (postDate < cutoffStr) continue;

    const slug = generateSlug(post.name, post.publishDate, post.contentType);
    const repoPaths = getRepoPaths(post);

    for (const pathInfo of repoPaths) {
      const postDir = path.join(pathInfo.dir, slug);
      const metricsPath = path.join(postDir, 'metrics.json');

      // Only refresh existing directories
      if (!fs.existsSync(metricsPath)) {
        notFound++;
        continue;
      }

      try {
        const existing = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));

        const freshNotionsocial = {
          source: 'notionsocial',
          synced_at: new Date().toISOString().split('T')[0],
          views: post.views || 0,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
        };

        // Check if anything actually changed
        const oldNs = existing.notionsocial || {};
        if (oldNs.views === freshNotionsocial.views &&
            oldNs.likes === freshNotionsocial.likes &&
            oldNs.comments === freshNotionsocial.comments &&
            oldNs.shares === freshNotionsocial.shares) {
          noChange++;
          continue;
        }

        if (DRY_RUN) {
          const rel = path.relative(REPO_ROOT, postDir);
          console.log(`  [DRY RUN] Would refresh: ${rel}`);
          console.log(`    views: ${oldNs.views || 0} → ${freshNotionsocial.views}, likes: ${oldNs.likes || 0} → ${freshNotionsocial.likes}, comments: ${oldNs.comments || 0} → ${freshNotionsocial.comments}, shares: ${oldNs.shares || 0} → ${freshNotionsocial.shares}`);
          refreshed++;
          continue;
        }

        // Update only the notionsocial block, preserve everything else
        existing.notionsocial = freshNotionsocial;
        fs.writeFileSync(metricsPath, JSON.stringify(existing, null, 2) + '\n');

        console.log(`  ✓ Refreshed: ${path.relative(REPO_ROOT, postDir)} (views: ${freshNotionsocial.views}, likes: ${freshNotionsocial.likes})`);
        refreshed++;
      } catch (err) {
        console.error(`  ✗ Error refreshing ${path.relative(REPO_ROOT, postDir)}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\n--- Refresh Summary ---`);
  console.log(`  Updated: ${refreshed}`);
  console.log(`  No change: ${noChange}`);
  console.log(`  Not in repo: ${notFound}`);
  if (errors) console.log(`  Errors: ${errors}`);
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
  console.log(`Auto-classify: ${SKIP_CLASSIFY ? 'DISABLED' : ANTHROPIC_API_KEY ? 'ENABLED' : 'DISABLED (no API key)'}`);
  if (REFRESH_METRICS) console.log(`Metrics refresh: Posts from last ${REFRESH_DAYS} days`);
  console.log('');

  // 1. Query Notion
  console.log('Querying Notion for published posts...');
  const pages = await getAllPublishedPosts();
  console.log(`  Found ${pages.length} published posts\n`);

  // 2. Create new post directories
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

    const slug = generateSlug(post.name, post.publishDate, post.contentType);
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
        fs.writeFileSync(path.join(postDir, 'caption.md'), generateCaption(post, slug, pathInfo));
        fs.writeFileSync(path.join(postDir, 'meta.json'), generateMeta(post, pathInfo));
        fs.writeFileSync(path.join(postDir, 'metrics.json'), generateMetrics(post, slug, pathInfo));
        fs.writeFileSync(path.join(postDir, 'alt-text.md'), generateAltText(post));
        fs.writeFileSync(path.join(postDir, 'comments.md'), generateComments(post, slug, pathInfo));
        fs.writeFileSync(path.join(postDir, 'assets', '.gitkeep'), '');

        console.log(`  ✓ Created: ${path.relative(REPO_ROOT, postDir)}`);

        // Auto-classify the post (unless skipped or dry run)
        if (!SKIP_CLASSIFY && ANTHROPIC_API_KEY) {
          const assetType = CONTENT_TYPE_MAP[post.contentType] || post.contentType || '';
          await autoClassifyAndWrite(postDir, post.caption, slug, pathInfo.brand || '', assetType);
        }

        created++;
      } catch (err) {
        console.error(`  ✗ Error creating ${path.relative(REPO_ROOT, postDir)}: ${err.message}`);
        errors++;
      }
    }
  }

  // 3. Summary
  console.log('\n=== Create Summary ===');
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist or incomplete): ${skipped}`);
  if (errors) console.log(`  Errors: ${errors}`);

  // 4. Refresh metrics if requested
  if (REFRESH_METRICS) {
    await refreshMetrics(pages);
  }

  console.log('');
  if ((created > 0 || REFRESH_METRICS) && !DRY_RUN) {
    console.log('Next steps:');
    console.log('  1. Run: node scripts/build-indexes.js   (regenerate indexes)');
    console.log('  2. Commit and push the new post directories');
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
