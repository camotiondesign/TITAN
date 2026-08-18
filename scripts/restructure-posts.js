#!/usr/bin/env node
/**
 * Restructure TITAN repo: extract LinkedIn posts from campaigns to /posts/{post-slug}/,
 * set up _shared, and remove nested posts from campaigns.
 *
 * Target structure per post:
 *   /posts/{post-slug}/
 *     caption.md, alt-text.md, comments.md, metrics.json, meta.json, assets/
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(REPO_ROOT, 'posts');
const CAMPAIGNS_DIR = path.join(REPO_ROOT, 'campaigns');
const SHARED_DIR = path.join(REPO_ROOT, '_shared');

function findLinkedInPostDirs(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const full = path.join(dir, name);
    try {
      const stat = fs.statSync(full);
      if (!stat.isDirectory()) continue;
      if (full.includes(path.sep + '_templates' + path.sep)) continue;
      const parts = full.split(path.sep);
      const liIdx = parts.indexOf('linkedin');
      if (liIdx === -1 || parts[liIdx + 1] !== name) {
        findLinkedInPostDirs(full, results);
        continue;
      }
      if (name.startsWith('_example')) continue;
      const postDir = full;
      const hasMeta = fs.existsSync(path.join(postDir, 'meta.json'));
      const hasCaption = fs.existsSync(path.join(postDir, 'caption.md'));
      if (hasMeta || hasCaption) results.push({ dir: postDir, slug: name });
    } catch (e) {
      console.warn(`Skip ${full}: ${e.message}`);
    }
  }
  return results;
}

function extractCampaignSlug(postDir) {
  const parts = postDir.split(path.sep);
  const campaignsIdx = parts.indexOf('campaigns');
  if (campaignsIdx === -1) return '';
  const base = parts[campaignsIdx + 1];
  if (base === '_metrics' || base === '_templates') return '';
  const campaignSlug = parts[campaignsIdx + 2];
  return campaignSlug || '';
}

function loadJson(p) {
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function migratePost(postDir, slug) {
  const campaignSlug = extractCampaignSlug(postDir);
  const outDir = path.join(POSTS_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });

  const captionPath = path.join(postDir, 'caption.md');
  const commentsPath = path.join(postDir, 'comments.md');
  const metricsPath = path.join(postDir, 'metrics.json');
  const metaPath = path.join(postDir, 'meta.json');

  const meta = loadJson(metaPath) || {};
  const metrics = loadJson(metricsPath) || {};

  if (fs.existsSync(captionPath)) {
    fs.copyFileSync(captionPath, path.join(outDir, 'caption.md'));
  } else {
    fs.writeFileSync(path.join(outDir, 'caption.md'), '', 'utf-8');
  }

  const altText = meta.image_alt_text || meta.alt_text || '';
  fs.writeFileSync(path.join(outDir, 'alt-text.md'), altText, 'utf-8');

  if (fs.existsSync(commentsPath)) {
    fs.copyFileSync(commentsPath, path.join(outDir, 'comments.md'));
  } else {
    fs.writeFileSync(path.join(outDir, 'comments.md'), '', 'utf-8');
  }

  if (Object.keys(metrics).length) {
    fs.writeFileSync(
      path.join(outDir, 'metrics.json'),
      JSON.stringify(metrics, null, 2),
      'utf-8'
    );
  } else {
    fs.writeFileSync(path.join(outDir, 'metrics.json'), '{}\n', 'utf-8');
  }

  const metaOut = {
    platform: meta.platform || 'linkedin',
    date_posted: meta.date_posted || metrics.posted_at || '',
    asset_type: meta.asset_type || metrics.asset_type || '',
    campaign_slug: meta.campaign || campaignSlug || metrics.campaign_slug || '',
    post_url: meta.post_url || metrics.post_url || '',
  };
  if (meta.tone) metaOut.tone = meta.tone;
  fs.writeFileSync(
    path.join(outDir, 'meta.json'),
    JSON.stringify(metaOut, null, 2),
    'utf-8'
  );

  const assetsDir = path.join(outDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(path.join(assetsDir, '.gitkeep'))) {
    fs.writeFileSync(path.join(assetsDir, '.gitkeep'), '', 'utf-8');
  }

  return { slug, campaign_slug: metaOut.campaign_slug, date_posted: metaOut.date_posted, asset_type: metaOut.asset_type };
}

function removeNestedPosts() {
  const posts = findLinkedInPostDirs(CAMPAIGNS_DIR);
  for (const { dir, slug } of posts) {
    if (slug.startsWith('_example')) continue;
    try {
      fs.rmSync(dir, { recursive: true });
      console.log(`  Removed ${path.relative(REPO_ROOT, dir)}`);
    } catch (e) {
      console.warn(`  Failed to remove ${dir}: ${e.message}`);
    }
  }
}

function main() {
  const mode = process.argv[2] || 'migrate';
  console.log(`Mode: ${mode}`);

  if (mode === 'migrate' || mode === 'all') {
    console.log('Scanning campaigns for LinkedIn posts...');
    const postDirs = findLinkedInPostDirs(CAMPAIGNS_DIR);
    console.log(`Found ${postDirs.length} LinkedIn post folders.`);

    fs.mkdirSync(POSTS_DIR, { recursive: true });
    const index = [];
    for (const { dir, slug } of postDirs) {
      const info = migratePost(dir, slug);
      index.push({ ...info, path: `posts/${slug}` });
    }
    index.sort((a, b) => (b.date_posted || '').localeCompare(a.date_posted || ''));

    fs.mkdirSync(SHARED_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(SHARED_DIR, 'post-index.json'),
      JSON.stringify({ total_posts: index.length, posts: index, updated_at: new Date().toISOString() }, null, 2),
      'utf-8'
    );
    console.log(`Wrote _shared/post-index.json (${index.length} posts).`);
  }

  if (mode === 'shared' || mode === 'all') {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
    const themesPath = path.join(SHARED_DIR, 'themes.json');
    if (!fs.existsSync(themesPath)) {
      const themes = {
        pillars: [
          { id: 'proof-social-proof', name: 'Proof & Social Proof', purpose: 'Build trust, validate purchase decisions' },
          { id: 'product-explanation', name: 'Product Explanation', purpose: 'Educate on capabilities, support consideration' },
          { id: 'leadership-strategic', name: 'Leadership & Strategic Worldview', purpose: 'Position as industry leader' },
          { id: 'problem-solution', name: 'Problem-Solution Positioning', purpose: 'Create urgency, position solution' },
          { id: 'education-tactical', name: 'Education & Tactical Guidance', purpose: 'Provide value, build authority' },
          { id: 'community-culture', name: 'Community & Culture', purpose: 'Build connection, humanize brand' },
          { id: 'regulatory-updates', name: 'Regulatory & Industry Updates', purpose: 'Industry expert, timely value' },
          { id: 'engagement-conversation', name: 'Engagement & Conversation Starters', purpose: 'Drive interaction, gather insights' },
        ],
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(themesPath, JSON.stringify(themes, null, 2), 'utf-8');
      console.log('Created _shared/themes.json');
    }
    const tplSrc = path.join(CAMPAIGNS_DIR, '_templates');
    const tplDst = path.join(SHARED_DIR, 'templates');
    if (fs.existsSync(tplSrc)) {
      fs.cpSync(tplSrc, tplDst, { recursive: true });
      console.log('Copied _shared/templates/ from campaigns/_templates');
    }
  }

  if (mode === 'remove-posts' || mode === 'all') {
    console.log('Removing nested LinkedIn posts from campaigns...');
    removeNestedPosts();
  }

  console.log('Done.');
}

main();
