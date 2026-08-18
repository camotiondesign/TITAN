#!/usr/bin/env node
/**
 * Steps 3–9: Classify, slug, move, standardise meta, clean campaigns, index, report.
 * Uses git mv. Does not delete content or alter caption/comments/metrics.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const POSTS = path.join(REPO_ROOT, 'posts');
const PUBLISHED = path.join(POSTS, 'published');
const UNPUBLISHED = path.join(POSTS, 'unpublished');
const CAMPAIGNS = path.join(REPO_ROOT, 'campaigns');
const SHARED = path.join(REPO_ROOT, '_shared');
const REPORTS = path.join(REPO_ROOT, '_reports');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDER_DATE = /^YYYY-MM-DD$/i;

function loadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function hasRealMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return false;
  const o = metrics.organic || metrics;
  const n = (v) => typeof v === 'number' && !Number.isNaN(v) && v > 0;
  return n(o.impressions) || n(o.engagements) || n(metrics.impressions) || n(metrics.engagements) ||
    n(o.reactions) || n(metrics.reactions) || n(o.clicks) || n(metrics.clicks);
}

function getValidDate(meta, metrics, folderName) {
  const v = meta?.date_posted || meta?.posted_at || metrics?.posted_at || metrics?.date_posted;
  if (typeof v === 'string' && v.trim()) {
    const s = v.trim();
    if (!PLACEHOLDER_DATE.test(s)) {
      const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }
  }
  if (folderName && typeof folderName === 'string') {
    const fm = folderName.match(/^(\d{4}-\d{2}-\d{2})-/);
    if (fm) return fm[1];
  }
  return null;
}

function isPublished(meta, metrics) {
  return hasRealMetrics(metrics) || !!getValidDate(meta, metrics);
}

function normalizeAssetType(raw) {
  const s = (raw || '').toString().toLowerCase().replace(/\s+/g, '-');
  if (/video|longform|short|shorts/.test(s)) return 'video';
  if (/single[-_]?image|multi[-_]?image/.test(s)) return 'single-image';
  if (/poll/.test(s)) return 'carousel';
  if (/carousel/.test(s)) return 'carousel';
  return s || '';
}

function shortSlugFromFolder(folderName) {
  const m = folderName.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return (m ? m[1] : folderName)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

function buildSlug(published, date, folderName) {
  const short = shortSlugFromFolder(folderName);
  if (published && date) return `${date}-${short}`;
  if (short.startsWith('_example')) return `concept-${short}`;
  return `concept-${short}`;
}

function collectUnits() {
  const units = [];

  // /posts/{slug}/
  if (fs.existsSync(POSTS)) {
    for (const name of fs.readdirSync(POSTS)) {
      if (name === 'published' || name === 'unpublished' || name === 'assets') continue;
      const dir = path.join(POSTS, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      const has = (f) => fs.existsSync(path.join(dir, f));
      if (has('caption.md') || has('metrics.json') || has('meta.json')) {
        units.push({ source: dir, folderName: name, kind: 'posts' });
      }
    }
  }

  // campaigns/_templates/.../social/linkedin/_example-*
  const tplLi = path.join(CAMPAIGNS, '_templates', 'campaign-template', 'social', 'linkedin');
  if (fs.existsSync(tplLi)) {
    for (const name of fs.readdirSync(tplLi)) {
      const dir = path.join(tplLi, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      units.push({ source: dir, folderName: name, kind: 'templates' });
    }
  }

  // playground/**/social/linkedin/{slug}
  function walkPlayground(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir);
    const liIdx = entries.indexOf('linkedin');
    if (liIdx !== -1) {
      const liDir = path.join(dir, 'linkedin');
      if (fs.statSync(liDir).isDirectory()) {
        for (const name of fs.readdirSync(liDir)) {
          const sub = path.join(liDir, name);
          if (fs.statSync(sub).isDirectory())
            units.push({ source: sub, folderName: name, kind: 'playground' });
        }
      }
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e);
      if (fs.statSync(full).isDirectory() && !e.startsWith('.')) walkPlayground(full);
    }
  }
  walkPlayground(path.join(REPO_ROOT, 'playground'));

  return units;
}

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
    return true;
  } catch (e) {
    if (!opts.silent) console.error(e.message);
    return false;
  }
}

function moveDir(src, dest) {
  const relSrc = path.relative(REPO_ROOT, src);
  const relDest = path.relative(REPO_ROOT, dest);
  if (run(`git mv "${relSrc}" "${relDest}"`, { silent: true })) return true;
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(src, dest);
    run(`git add "${relDest}"`, { silent: true });
    return true;
  } catch (e) {
    console.error(`move failed: ${src} -> ${dest}: ${e.message}`);
    return false;
  }
}

function main() {
  const stats = {
    total: 0,
    published: 0,
    unpublished: 0,
    missingMeta: [],
    campaignsUpdated: [],
    problems: [],
    index: [],
  };

  const units = collectUnits();
  stats.total = units.length;
  console.log(`Found ${units.length} LinkedIn post units.`);

  fs.mkdirSync(PUBLISHED, { recursive: true });
  fs.mkdirSync(UNPUBLISHED, { recursive: true });

  const slugUsed = new Set();
  function reserveSlug(slug, destDir) {
    const base = path.join(destDir, slug);
    if (slugUsed.has(base)) {
      let i = 1;
      while (slugUsed.has(path.join(destDir, `${slug}-${i}`))) i++;
      return `${slug}-${i}`;
    }
    slugUsed.add(base);
    return slug;
  }

  const campaignToPosts = new Map();

  for (const u of units) {
    const meta = loadJson(path.join(u.source, 'meta.json'));
    const metrics = loadJson(path.join(u.source, 'metrics.json'));
  const published = isPublished(meta, metrics);
  const date = getValidDate(meta, metrics, u.folderName);
  const folderName = u.folderName;

    let slug = buildSlug(published, date, folderName);
    const destDir = published ? PUBLISHED : UNPUBLISHED;
    slug = reserveSlug(slug, destDir);
    const dest = path.join(destDir, slug);

    const assetType = normalizeAssetType(meta?.asset_type || metrics?.asset_type);
    const campaign = (meta?.campaign_slug || meta?.campaign || '').trim();
    const theme = (meta?.theme || '').trim();

    if (!meta && !metrics) stats.missingMeta.push(u.source);

    // Skip if already in place (e.g. re-run)
    if (path.relative(REPO_ROOT, u.source).startsWith('posts/published/') ||
        path.relative(REPO_ROOT, u.source).startsWith('posts/unpublished/')) {
      stats.index.push({
        slug,
        asset_type: assetType || '',
        theme: theme || '',
        campaign: campaign || '',
        status: published ? 'published' : 'unpublished',
        published_at: published && date ? date : '',
      });
      if (published) stats.published++; else stats.unpublished++;
      continue;
    }

    if (!moveDir(u.source, dest)) {
      stats.problems.push(`git mv failed: ${u.source} -> ${dest}`);
      continue;
    }

    if (published) stats.published++; else stats.unpublished++;

    const standardMeta = {
      platform: 'LinkedIn',
      asset_type: assetType || '',
      theme: theme || '',
      campaign: campaign || '',
      status: published ? 'published' : 'unpublished',
      published_at: published && date ? date : '',
    };
    const metaPath = path.join(dest, 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(standardMeta, null, 2) + '\n', 'utf-8');

    stats.index.push({
      slug,
      asset_type: standardMeta.asset_type,
      theme: standardMeta.theme,
      campaign: standardMeta.campaign,
      status: standardMeta.status,
      published_at: standardMeta.published_at,
    });

    if (campaign) {
      const list = campaignToPosts.get(campaign) || [];
      list.push(slug);
      campaignToPosts.set(campaign, list);
    }
  }

  // Ensure .gitkeep in published/unpublished
  for (const d of [PUBLISHED, UNPUBLISHED]) {
    const k = path.join(d, '.gitkeep');
    if (!fs.existsSync(k)) fs.writeFileSync(k, '', 'utf-8');
  }

  // Update campaign-meta.json "posts" for campaigns we know
  const campaignDirs = [
    path.join(CAMPAIGNS, 'TITAN'),
    path.join(CAMPAIGNS, 'TITANVERSE'),
  ];
  for (const base of campaignDirs) {
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base)) {
      const slug = name;
      const list = campaignToPosts.get(slug);
      if (!list || !list.length) continue;
      const metaPath = path.join(base, name, 'campaign-meta.json');
      if (!fs.existsSync(metaPath)) continue;
      const cm = loadJson(metaPath) || {};
      cm.posts = list;
      fs.writeFileSync(metaPath, JSON.stringify(cm, null, 2) + '\n', 'utf-8');
      stats.campaignsUpdated.push(path.relative(REPO_ROOT, path.dirname(metaPath)));
    }
  }

  // Remove empty campaigns .../social/linkedin (content already moved via git mv)
  function rmEmptyLinkedIn(dir) {
    if (!fs.existsSync(dir)) return;
    const social = path.join(dir, 'social');
    const link = path.join(social, 'linkedin');
    if (!fs.existsSync(link)) return;
    try {
      if (fs.readdirSync(link).length === 0) {
        fs.rmdirSync(link);
        if (fs.readdirSync(social).length === 0) fs.rmdirSync(social);
      }
    } catch (e) {
      stats.problems.push(`cleanup ${dir}: ${e.message}`);
    }
  }
  rmEmptyLinkedIn(path.join(CAMPAIGNS, '_templates', 'campaign-template'));
  function walkCampaigns(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const full = path.join(d, e);
      if (fs.statSync(full).isDirectory() && !e.startsWith('_')) {
        rmEmptyLinkedIn(full);
        walkCampaigns(full);
      }
    }
  }
  walkCampaigns(path.join(CAMPAIGNS, 'TITAN'));
  walkCampaigns(path.join(CAMPAIGNS, 'TITANVERSE'));

  // Remove empty playground .../social/linkedin (content already moved)
  function rmEmptyPlaygroundLinkedIn(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir);
    const liIdx = entries.indexOf('linkedin');
    if (liIdx !== -1) {
      const liDir = path.join(dir, 'linkedin');
      try {
        if (fs.readdirSync(liDir).length === 0) fs.rmdirSync(liDir);
      } catch (_) {}
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e);
      if (fs.statSync(full).isDirectory()) rmEmptyPlaygroundLinkedIn(full);
    }
  }
  rmEmptyPlaygroundLinkedIn(path.join(REPO_ROOT, 'playground'));

  // Post index
  fs.mkdirSync(SHARED, { recursive: true });
  fs.writeFileSync(
    path.join(SHARED, 'post-index.json'),
    JSON.stringify(stats.index, null, 2),
    'utf-8'
  );

  // Summary report
  fs.mkdirSync(REPORTS, { recursive: true });
  const report = `# Restructure Summary — 2026-01-24

## Overview

- **Total posts detected:** ${stats.total}
- **Published (moved to \`/posts/published/\`):** ${stats.published}
- **Unpublished (moved to \`/posts/unpublished/\`):** ${stats.unpublished}
- **Posts missing metadata:** ${stats.missingMeta.length}
- **Campaigns updated (campaign-meta.json "posts"):** ${stats.campaignsUpdated.length}

## Missing metadata

${stats.missingMeta.length ? stats.missingMeta.map((p) => `- \`${p}\``).join('\n') : '(none)'}

## Campaigns updated

${stats.campaignsUpdated.length ? stats.campaignsUpdated.map((p) => `- \`${p}\``).join('\n') : '(none)'}

## Problems encountered

${stats.problems.length ? stats.problems.map((p) => `- ${p}`).join('\n') : '(none)'}

## Recommendations for manual review

1. Confirm \`meta.json\` \`theme\` and \`campaign\` where empty.
2. Check any \`concept-*\` slugs for clarity.
3. Verify \`campaign-meta.json\` \`posts\` arrays match expected related posts.
4. Re-run analytics/aggregate scripts if they reference \`/posts/\` paths.
`;
  fs.writeFileSync(path.join(REPORTS, '2026-01-24-restructure-summary.md'), report, 'utf-8');

  console.log('Done.');
  console.log(`Published: ${stats.published}, Unpublished: ${stats.unpublished}`);
  console.log(`Index: _shared/post-index.json`);
  console.log(`Report: _reports/2026-01-24-restructure-summary.md`);
}

main();
