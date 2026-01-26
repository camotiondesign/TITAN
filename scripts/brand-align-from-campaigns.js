#!/usr/bin/env node
/**
 * Align LinkedIn posts with Titan vs Titanverse using campaigns as source of truth.
 * Uses git mv. Updates meta.json and _shared/post-index.json.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const POSTS = path.join(REPO, 'posts');
const CAMPAIGNS = path.join(REPO, 'campaigns');
const SHARED = path.join(REPO, '_shared');
const REPORTS = path.join(REPO, '_reports');

const LEGACY = {
  published: path.join(POSTS, 'published'),
  unpublished: path.join(POSTS, 'unpublished'),
  'needs-metrics': path.join(POSTS, 'needs-metrics'),
};
const BRAND_ROOTS = {
  titan: path.join(POSTS, 'titan'),
  titanverse: path.join(POSTS, 'titanverse'),
};
const BRAND_CONFIG = {
  titan: { brand: 'titan', linkedin_page: 'Titan PMR' },
  titanverse: { brand: 'titanverse', linkedin_page: 'Titanverse' },
};

function loadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { cwd: REPO, stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
    return true;
  } catch {
    return false;
  }
}

function ensureDirs() {
  for (const brand of ['titan', 'titanverse']) {
    for (const status of ['published', 'unpublished', 'needs-metrics']) {
      const d = path.join(BRAND_ROOTS[brand], status);
      fs.mkdirSync(d, { recursive: true });
      const keep = path.join(d, '.gitkeep');
      if (!fs.existsSync(keep)) fs.writeFileSync(keep, '', 'utf-8');
    }
  }
  fs.mkdirSync(REPORTS, { recursive: true });
}

function buildBrandMap() {
  const brandMap = new Map();
  const conflicts = [];
  const seen = new Map();

  for (const root of ['TITAN', 'TITANVERSE']) {
    const brand = root.toLowerCase();
    const base = path.join(CAMPAIGNS, root);
    if (!fs.existsSync(base)) continue;
    const dirs = fs.readdirSync(base).filter((n) => !n.startsWith('_'));
    for (const slug of dirs) {
      const metaPath = path.join(base, slug, 'campaign-meta.json');
      if (!fs.existsSync(metaPath)) continue;
      const meta = loadJson(metaPath);
      const posts = meta?.posts;
      if (!Array.isArray(posts)) continue;
      for (const postSlug of posts) {
        if (!postSlug || typeof postSlug !== 'string') continue;
        const prev = seen.get(postSlug);
        if (prev && prev !== brand) {
          conflicts.push(postSlug);
          brandMap.delete(postSlug);
          continue;
        }
        if (conflicts.includes(postSlug)) continue;
        seen.set(postSlug, brand);
        brandMap.set(postSlug, brand);
      }
    }
  }
  return { brandMap, conflicts };
}

/** Campaign folder name -> brand. Also "rest" after YYYY-MM-DD- as alias. */
function buildCampaignToBrand() {
  const map = new Map();
  const titanNames = new Set();
  const titanverseNames = new Set();

  const titanBase = path.join(CAMPAIGNS, 'TITAN');
  const titanverseBase = path.join(CAMPAIGNS, 'TITANVERSE');
  if (fs.existsSync(titanBase)) {
    for (const name of fs.readdirSync(titanBase)) {
      if (name.startsWith('_')) continue;
      const full = path.join(titanBase, name);
      if (fs.statSync(full).isDirectory()) titanNames.add(name);
    }
  }
  if (fs.existsSync(titanverseBase)) {
    for (const name of fs.readdirSync(titanverseBase)) {
      if (name.startsWith('_')) continue;
      const full = path.join(titanverseBase, name);
      if (fs.statSync(full).isDirectory()) titanverseNames.add(name);
    }
  }
  const inBoth = new Set([...titanNames].filter((n) => titanverseNames.has(n)));

  for (const [root, brand] of [['TITAN', 'titan'], ['TITANVERSE', 'titanverse']]) {
    const base = path.join(CAMPAIGNS, root);
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base)) {
      if (name.startsWith('_')) continue;
      const full = path.join(base, name);
      if (!fs.statSync(full).isDirectory()) continue;
      if (inBoth.has(name)) continue;
      map.set(name, brand);
      const m = name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
      if (m && m[1] !== name) {
        const rest = m[1];
        if (!map.has(rest)) map.set(rest, brand);
        else if (map.get(rest) !== brand) map.delete(rest);
      }
    }
  }
  return map;
}

/** Infer brand from slug when no campaign match. */
function brandFromSlug(slug) {
  const s = (slug || '').toLowerCase();
  if (/titanverse/.test(s)) return 'titanverse';
  return 'titan';
}

function legacyPostSlugs() {
  const out = [];
  for (const [status, dir] of Object.entries(LEGACY)) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name === '.gitkeep') continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) out.push({ slug: name, status });
    }
  }
  return out;
}

function existingBrandSlugs() {
  const out = new Set();
  for (const brand of ['titan', 'titanverse']) {
    for (const status of ['published', 'unpublished', 'needs-metrics']) {
      const d = path.join(BRAND_ROOTS[brand], status);
      if (!fs.existsSync(d)) continue;
      for (const name of fs.readdirSync(d)) {
        if (name === '.gitkeep') continue;
        const full = path.join(d, name);
        if (fs.statSync(full).isDirectory()) out.add(name);
      }
    }
  }
  return out;
}

function gitMv(src, dest) {
  const relSrc = path.relative(REPO, src);
  const relDest = path.relative(REPO, dest);
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

function updateMeta(metaPath, brand) {
  const cfg = BRAND_CONFIG[brand];
  const meta = loadJson(metaPath) || {};
  meta.platform = meta.platform || 'LinkedIn';
  meta.asset_type = meta.asset_type ?? '';
  meta.theme = meta.theme ?? '';
  meta.campaign = meta.campaign ?? '';
  meta.status = meta.status ?? 'published';
  meta.published_at = meta.published_at ?? '';
  meta.brand = cfg.brand;
  meta.linkedin_page = cfg.linkedin_page;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
}

function main() {
  const report = {
    titanFromCampaigns: 0,
    titanverseFromCampaigns: 0,
    moved: { titan: { published: 0, unpublished: 0, 'needs-metrics': 0 }, titanverse: { published: 0, unpublished: 0, 'needs-metrics': 0 } },
    conflicts: [],
    refsNotFound: [],
    stillLegacy: [],
  };

  ensureDirs();
  const { brandMap, conflicts } = buildBrandMap();
  const campaignToBrand = buildCampaignToBrand();
  report.conflicts = conflicts;

  for (const [, b] of brandMap) {
    if (b === 'titan') report.titanFromCampaigns++;
    else report.titanverseFromCampaigns++;
  }

  const legacy = legacyPostSlugs();
  const existing = existingBrandSlugs();

  const toMove = [];
  for (const { slug, status } of legacy) {
    if (existing.has(slug)) continue;
    let brand = brandMap.get(slug);
    if (!brand) {
      const meta = loadJson(path.join(LEGACY[status], slug, 'meta.json'));
      const camp = (meta?.campaign || '').toString().trim();
      brand = campaignToBrand.get(camp) || campaignToBrand.get(slug) || brandFromSlug(slug);
    }
    toMove.push({ slug, status, brand });
  }

  for (const r of toMove) {
    const src = path.join(LEGACY[r.status], r.slug);
    const dest = path.join(BRAND_ROOTS[r.brand], r.status, r.slug);
    if (!fs.existsSync(src)) {
      report.refsNotFound.push(r.slug);
      continue;
    }
    if (!gitMv(src, dest)) continue;
    report.moved[r.brand][r.status]++;
    updateMeta(path.join(dest, 'meta.json'), r.brand);
  }

  for (const slug of brandMap.keys()) {
    if (!legacy.some((l) => l.slug === slug) && !existing.has(slug)) report.refsNotFound.push(slug);
  }

  const stillLegacy = legacyPostSlugs();
  for (const { slug } of stillLegacy) {
    if (brandMap.has(slug) && !existing.has(slug)) continue;
    report.stillLegacy.push(slug);
  }

  for (const brand of ['titan', 'titanverse']) {
    for (const status of ['published', 'unpublished', 'needs-metrics']) {
      const d = path.join(BRAND_ROOTS[brand], status);
      if (!fs.existsSync(d)) continue;
      for (const name of fs.readdirSync(d)) {
        if (name === '.gitkeep') continue;
        const metaPath = path.join(d, name, 'meta.json');
        if (fs.existsSync(metaPath)) updateMeta(metaPath, brand);
      }
    }
  }

  const indexPath = path.join(SHARED, 'post-index.json');
  let index = [];
  try {
    if (fs.existsSync(indexPath)) index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    index = [];
  }
  const bySlug = new Map(index.map((e) => [e.slug, { ...e }]));

  for (const brand of ['titan', 'titanverse']) {
    const cfg = BRAND_CONFIG[brand];
    for (const status of ['published', 'unpublished', 'needs-metrics']) {
      const d = path.join(BRAND_ROOTS[brand], status);
      if (!fs.existsSync(d)) continue;
      for (const name of fs.readdirSync(d)) {
        if (name === '.gitkeep') continue;
        const metaPath = path.join(d, name, 'meta.json');
        const meta = loadJson(metaPath);
        let ent = bySlug.get(name);
        if (!ent) {
          ent = {
            slug: name,
            asset_type: (meta?.asset_type ?? '').toString(),
            theme: (meta?.theme ?? '').toString(),
            campaign: (meta?.campaign ?? '').toString(),
            status: meta?.status ?? status,
            published_at: (meta?.published_at ?? '').toString(),
          };
          bySlug.set(name, ent);
        }
        ent.brand = cfg.brand;
        ent.linkedin_page = cfg.linkedin_page;
        if (ent.status !== meta?.status && meta?.status) ent.status = meta.status;
        if (ent.published_at !== meta?.published_at && meta?.published_at) ent.published_at = meta.published_at;
      }
    }
  }

  const indexArr = Array.from(bySlug.values()).sort((a, b) => (a.slug < b.slug ? -1 : 1));
  fs.writeFileSync(indexPath, JSON.stringify(indexArr, null, 2), 'utf-8');

  const reportPath = path.join(REPORTS, '2026-01-24-brand-alignment-from-campaigns.md');
  const md = `# Brand Alignment from Campaigns — 2026-01-24

## Overview

- **Posts identified as Titan (from campaigns):** ${report.titanFromCampaigns}
- **Posts identified as Titanverse (from campaigns):** ${report.titanverseFromCampaigns}

## Moves

| Brand | Published | Needs-metrics | Unpublished |
|-------|-----------|---------------|-------------|
| Titan | ${report.moved.titan.published} | ${report.moved.titan['needs-metrics']} | ${report.moved.titan.unpublished} |
| Titanverse | ${report.moved.titanverse.published} | ${report.moved.titanverse['needs-metrics']} | ${report.moved.titanverse.unpublished} |

## Brand conflicts (slug in both TITAN and TITANVERSE)

${report.conflicts.length ? report.conflicts.map((s) => `- \`${s}\``).join('\n') : '(none)'}

## Referenced in campaigns but not found under /posts

${report.refsNotFound.length ? [...new Set(report.refsNotFound)].map((s) => `- \`${s}\``).join('\n') : '(none)'}

## Still under /posts/published, /posts/unpublished, or /posts/needs-metrics

These posts were not referenced in any campaign \`posts\` array (or could not be assigned a brand). They remain in the legacy locations.

${report.stillLegacy.length ? report.stillLegacy.map((s) => `- \`${s}\``).join('\n') : '(none)'}

## Recommended manual fixes

1. Assign brand (Titan vs Titanverse) for "still legacy" posts, e.g. by adding them to the appropriate campaign \`posts\` arrays and re-running this script, or by moving them manually into \`/posts/titan/**\` or \`/posts/titanverse/**\` and updating \`meta.json\` + \`post-index.json\`.
2. Resolve any brand conflicts by updating campaigns so each slug appears in only one brand.
3. Run \`git add\` and commit after reviewing changes.
`;
  fs.writeFileSync(reportPath, md, 'utf-8');

  console.log('Brand alignment done.');
  console.log(`Titan: ${report.titanFromCampaigns}, Titanverse: ${report.titanverseFromCampaigns}`);
  console.log(`Moved: Titan ${report.moved.titan.published + report.moved.titan['needs-metrics'] + report.moved.titan.unpublished}, Titanverse ${report.moved.titanverse.published + report.moved.titanverse['needs-metrics'] + report.moved.titanverse.unpublished}`);
  console.log(`Report: ${reportPath}`);
}

main();
