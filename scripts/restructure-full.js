#!/usr/bin/env node
/**
 * Complete restructure: published / needs-metrics / unpublished.
 * Uses git mv (fallback: mv + git add). Does not delete content.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const POSTS = path.join(REPO_ROOT, 'posts');
const PUBLISHED = path.join(POSTS, 'published');
const NEEDS_METRICS = path.join(POSTS, 'needs-metrics');
const UNPUBLISHED = path.join(POSTS, 'unpublished');
const CAMPAIGNS = path.join(REPO_ROOT, 'campaigns');
const SHARED = path.join(REPO_ROOT, '_shared');
const REPORTS = path.join(REPO_ROOT, '_reports');

const PLACEHOLDER_DATE = /^YYYY-MM-DD$/i;

function loadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function hasNonZeroMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return false;
  const o = metrics.organic || metrics;
  const n = (v) => typeof v === 'number' && !Number.isNaN(v) && v > 0;
  return n(o.impressions) || n(o.engagements) || n(metrics.impressions) || n(metrics.engagements) ||
    n(o.reactions) || n(metrics.reactions) || n(o.clicks) || n(metrics.clicks);
}

function metricsAllZeroOrNull(metrics) {
  if (!metrics || typeof metrics !== 'object') return true;
  const check = (v) => v == null || v === '' || (typeof v === 'number' && (Number.isNaN(v) || v === 0));
  const o = metrics.organic || {};
  const fields = ['impressions', 'engagements', 'reactions', 'clicks', 'reach', 'comments', 'reposts', 'follows', 'views', 'video_views'];
  for (const f of fields) {
    if (!check(metrics[f]) || !check(o[f])) return false;
  }
  return true;
}

function getValidDate(meta, metrics, folderName) {
  const v = meta?.published_at || meta?.date_posted || meta?.posted_at || metrics?.posted_at || metrics?.date_posted;
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

function classify(meta, metrics, folderName) {
  const hasDate = !!getValidDate(meta, metrics, folderName);
  const hasMetricsFile = !!metrics && typeof metrics === 'object';
  const nonZero = hasNonZeroMetrics(metrics);
  const allZero = hasMetricsFile && metricsAllZeroOrNull(metrics);

  if (nonZero) return 'published';
  if (hasMetricsFile && allZero && hasDate) return 'needs-metrics';
  return 'unpublished';
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
  const base = (m ? m[1] : folderName).replace(/^concept-/, '');
  return base
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

function buildSlug(status, date, folderName) {
  const short = shortSlugFromFolder(folderName);
  if ((status === 'published' || status === 'needs-metrics') && date) return `${date}-${short}`;
  if (/^_?example/.test(short)) return `concept-${short.replace(/^_/, '')}`;
  if (status === 'unpublished') return `concept-${short}`;
  return `${date || 'unknown'}-${short}`;
}

function collectUnits() {
  const units = [];

  function add(dir, folderName, kind) {
    const has = (f) => fs.existsSync(path.join(dir, f));
    if (has('caption.md') || has('metrics.json') || has('meta.json') || has('comments.md') || has('alt-text.md')) {
      units.push({ source: dir, folderName, kind });
    }
  }

  for (const bucket of ['published', 'needs-metrics', 'unpublished']) {
    const dir = path.join(POSTS, bucket);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name === '.gitkeep') continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) add(full, name, 'posts');
    }
  }

  const tplLi = path.join(CAMPAIGNS, '_templates', 'campaign-template', 'social', 'linkedin');
  if (fs.existsSync(tplLi)) {
    for (const name of fs.readdirSync(tplLi)) {
      const full = path.join(tplLi, name);
      if (fs.statSync(full).isDirectory()) add(full, name, 'templates');
    }
  }

  // Skip _shared linkedin to avoid duplicating template units already in unpublished
  // const sharedLi = path.join(SHARED, 'templates', 'campaign-template', 'social', 'linkedin');
  // if (fs.existsSync(sharedLi)) { ... }

  function walkPlayground(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d);
    const liIdx = entries.indexOf('linkedin');
    if (liIdx !== -1) {
      const liDir = path.join(d, 'linkedin');
      if (fs.statSync(liDir).isDirectory()) {
        for (const name of fs.readdirSync(liDir)) {
          const full = path.join(liDir, name);
          if (fs.statSync(full).isDirectory()) add(full, name, 'playground');
        }
      }
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e);
      if (fs.statSync(full).isDirectory() && !e.startsWith('.')) walkPlayground(full);
    }
  }
  walkPlayground(path.join(REPO_ROOT, 'playground'));

  function walkCampaigns(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d)) {
      const full = path.join(d, e);
      if (!fs.statSync(full).isDirectory() || e.startsWith('_')) continue;
      const li = path.join(full, 'social', 'linkedin');
      if (fs.existsSync(li) && fs.statSync(li).isDirectory()) {
        for (const name of fs.readdirSync(li)) {
          const sub = path.join(li, name);
          if (fs.statSync(sub).isDirectory()) add(sub, name, 'campaigns');
        }
      }
      walkCampaigns(full);
    }
  }
  walkCampaigns(path.join(CAMPAIGNS, 'TITAN'));
  walkCampaigns(path.join(CAMPAIGNS, 'TITANVERSE'));

  return units;
}

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { cwd: REPO_ROOT, stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
    return true;
  } catch {
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
  const stats = { total: 0, published: 0, needsMetrics: 0, unpublished: 0, missingMeta: [], campaignsUpdated: [], problems: [], index: [] };

  fs.mkdirSync(PUBLISHED, { recursive: true });
  fs.mkdirSync(NEEDS_METRICS, { recursive: true });
  fs.mkdirSync(UNPUBLISHED, { recursive: true });
  fs.mkdirSync(SHARED, { recursive: true });
  fs.mkdirSync(REPORTS, { recursive: true });

  for (const d of [PUBLISHED, NEEDS_METRICS, UNPUBLISHED]) {
    const k = path.join(d, '.gitkeep');
    if (!fs.existsSync(k)) fs.writeFileSync(k, '', 'utf-8');
  }

  const units = collectUnits();
  stats.total = units.length;
  console.log(`Found ${units.length} LinkedIn post units.`);

  const slugUsed = new Set();
  const campaignToPosts = new Map();

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

  for (const u of units) {
    const meta = loadJson(path.join(u.source, 'meta.json'));
    const metrics = loadJson(path.join(u.source, 'metrics.json'));
    const status = classify(meta, metrics, u.folderName);
    const date = getValidDate(meta, metrics, u.folderName);

    let slug = buildSlug(status, date, u.folderName);
    const destDir = status === 'published' ? PUBLISHED : status === 'needs-metrics' ? NEEDS_METRICS : UNPUBLISHED;
    slug = reserveSlug(slug, destDir);
    const dest = path.join(destDir, slug);

    if (!meta && !metrics) stats.missingMeta.push(u.source);

    const relSrc = path.relative(REPO_ROOT, u.source);
    const relDest = path.relative(REPO_ROOT, dest);
    const assetType = normalizeAssetType(meta?.asset_type || metrics?.asset_type);
    const campaign = (meta?.campaign_slug || meta?.campaign || '').trim();
    const theme = (meta?.theme || '').trim();
    const publishedAt = (status !== 'unpublished' && date) ? date : '';

    if (relSrc === relDest) {
      const standardMeta = { platform: 'LinkedIn', asset_type: assetType || '', theme: theme || '', campaign: campaign || '', status, published_at: publishedAt };
      fs.writeFileSync(path.join(u.source, 'meta.json'), JSON.stringify(standardMeta, null, 2) + '\n', 'utf-8');
      stats.index.push({ slug, asset_type: standardMeta.asset_type, theme: standardMeta.theme, campaign: standardMeta.campaign, status, published_at: standardMeta.published_at });
      if (campaign) { const list = campaignToPosts.get(campaign) || []; list.push(slug); campaignToPosts.set(campaign, list); }
      if (status === 'published') stats.published++;
      else if (status === 'needs-metrics') stats.needsMetrics++;
      else stats.unpublished++;
      continue;
    }

    if (!moveDir(u.source, dest)) {
      stats.problems.push(`move failed: ${u.source} -> ${dest}`);
      continue;
    }

    if (status === 'published') stats.published++;
    else if (status === 'needs-metrics') stats.needsMetrics++;
    else stats.unpublished++;

    const standardMeta = {
      platform: 'LinkedIn',
      asset_type: assetType || '',
      theme: theme || '',
      campaign: campaign || '',
      status,
      published_at: (status !== 'unpublished' && date) ? date : '',
    };
    fs.writeFileSync(path.join(dest, 'meta.json'), JSON.stringify(standardMeta, null, 2) + '\n', 'utf-8');

    stats.index.push({ slug, asset_type: standardMeta.asset_type, theme: standardMeta.theme, campaign: standardMeta.campaign, status, published_at: standardMeta.published_at });
    if (campaign) {
      const list = campaignToPosts.get(campaign) || [];
      list.push(slug);
      campaignToPosts.set(campaign, list);
    }
  }

  for (const [campaignSlug, postSlugs] of campaignToPosts) {
    for (const base of [path.join(CAMPAIGNS, 'TITAN'), path.join(CAMPAIGNS, 'TITANVERSE')]) {
      const metaPath = path.join(base, campaignSlug, 'campaign-meta.json');
      if (!fs.existsSync(metaPath)) continue;
      const cm = loadJson(metaPath) || {};
      cm.posts = postSlugs;
      fs.writeFileSync(metaPath, JSON.stringify(cm, null, 2) + '\n', 'utf-8');
      stats.campaignsUpdated.push(path.relative(REPO_ROOT, path.dirname(metaPath)));
    }
  }

  function rmEmptyLinkedIn(dir) {
    const li = path.join(dir, 'social', 'linkedin');
    if (!fs.existsSync(li)) return;
    try {
      if (fs.readdirSync(li).length === 0) {
        fs.rmdirSync(li);
        const social = path.join(dir, 'social');
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

  // _shared linkedin left as reference; no cleanup

  fs.writeFileSync(path.join(SHARED, 'post-index.json'), JSON.stringify(stats.index, null, 2), 'utf-8');

  const report = `# Restructure Summary — 2026-01-24

## Overview

- **Total LinkedIn posts detected:** ${stats.total}
- **Moved to \`/posts/published/\`:** ${stats.published}
- **Moved to \`/posts/needs-metrics/\`:** ${stats.needsMetrics}
- **Moved to \`/posts/unpublished/\`:** ${stats.unpublished}
- **Posts missing metadata:** ${stats.missingMeta.length}
- **Campaigns updated (campaign-meta.json "posts"):** ${stats.campaignsUpdated.length}

## Missing metadata

${stats.missingMeta.length ? stats.missingMeta.map((p) => `- \`${p}\``).join('\n') : '(none)'}

## Campaigns updated

${stats.campaignsUpdated.length ? stats.campaignsUpdated.map((p) => `- \`${p}\``).join('\n') : '(none)'}

## Problems encountered

${stats.problems.length ? stats.problems.map((p) => `- ${p}`).join('\n') : '(none)'}

## Recommended manual fixes

1. Confirm \`meta.json\` \`theme\` and \`campaign\` where empty.
2. Review \`concept-*\` and \`needs-metrics\` slugs.
3. Verify \`campaign-meta.json\` \`posts\` arrays.
4. Update analytics/aggregate scripts to use \`posts/published/**\` and \`posts/needs-metrics/**\` as needed.
5. Run \`git add\` and commit changes.
`;
  fs.writeFileSync(path.join(REPORTS, '2026-01-24-restructure-summary.md'), report, 'utf-8');

  console.log('Done.');
  console.log(`Published: ${stats.published}, Needs-metrics: ${stats.needsMetrics}, Unpublished: ${stats.unpublished}`);
  console.log(`Index: _shared/post-index.json`);
  console.log(`Report: _reports/2026-01-24-restructure-summary.md`);
}

main();
