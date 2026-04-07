#!/usr/bin/env node
/**
 * Blog Scraper — titanpmr.com + titanverse.co.uk
 *
 * Fetches blog posts from both websites and creates post directories
 * in posts/blog/published/[slug]/ with caption.md and meta.json.
 *
 * Idempotent — skips posts that already exist.
 *
 * Usage:
 *   node scripts/sync-blog.js              # Sync both sites
 *   node scripts/sync-blog.js --dry-run    # Preview without writing
 *   node scripts/sync-blog.js --titan-only # Only titanpmr.com
 *   node scripts/sync-blog.js --tv-only    # Only titanverse.co.uk
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const REPO_ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(REPO_ROOT, 'posts', 'blog', 'published');

const DRY_RUN = process.argv.includes('--dry-run');
const TITAN_ONLY = process.argv.includes('--titan-only');
const TV_ONLY = process.argv.includes('--tv-only');

const SITES = [
  {
    name: 'titan',
    baseUrl: 'https://titanpmr.com',
    blogPaths: ['/blog', '/news', '/insights', '/resources'],
    brand: 'titan',
  },
  {
    name: 'titanverse',
    baseUrl: 'https://titanverse.co.uk',
    blogPaths: ['/blog', '/news', '/insights', '/resources'],
    brand: 'titanverse',
  },
];

// ─── HTTP fetch with browser-like headers ────────────────────────────────────

function fetch(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));

    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    };

    const req = lib.request(options, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : parsed.origin + res.headers.location;
        return resolve(fetch(next, redirectCount + 1));
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, url }));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ─── HTML parsing helpers ─────────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

function extractMeta(html, tag, attr) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${tag}["'][^>]+content=["']([^"']+)["']`, 'i')
          || new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${tag}["']`, 'i');
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${tag}["']`, 'i'));
  return m ? m[1] : null;
}

function extractLinks(html, baseUrl) {
  const links = [];
  const re = /href=["']([^"']+)["'][^>]*>([^<]+)</g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const text = m[2].trim();
    if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
    const full = href.startsWith('http') ? href : (href.startsWith('/') ? baseUrl + href : null);
    if (full) links.push({ href: full, text });
  }
  return links;
}

function extractBlogLinks(html, baseUrl, blogPath) {
  // Find links that look like blog posts — contain the blog path and aren't just the index
  const all = extractLinks(html, baseUrl);
  const base = baseUrl + blogPath;
  return all.filter(l =>
    l.href.startsWith(base) &&
    l.href !== base &&
    l.href !== base + '/' &&
    !l.href.includes('?') &&
    !l.href.includes('#') &&
    l.href.split('/').filter(Boolean).length > new URL(base).pathname.split('/').filter(Boolean).length
  );
}

function extractDate(html, url) {
  // Try common date patterns
  const patterns = [
    // JSON-LD
    /"datePublished"\s*:\s*"([^"]+)"/,
    /"dateModified"\s*:\s*"([^"]+)"/,
    // Meta
    /property=["']article:published_time["'][^>]+content=["']([^"']+)["']/,
    /content=["']([0-9]{4}-[0-9]{2}-[0-9]{2})[^"']*["'][^>]+property=["']article:published_time["']/,
    // HTML time tag
    /<time[^>]+datetime=["']([0-9]{4}-[0-9]{2}-[0-9]{2})[^"']*["']/,
    // Common text patterns
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      // Text date pattern
      if (m[1] && isNaN(m[1])) {
        const months = { january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12' };
        const mo = months[m[2].toLowerCase()];
        if (mo) return `${m[3]}-${mo}-${String(m[1]).padStart(2,'0')}`;
      }
      const d = m[1].split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    }
  }

  // Fall back to URL-embedded date
  const urlDate = url.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (urlDate) return `${urlDate[1]}-${urlDate[2]}-${urlDate[3]}`;

  return null;
}

function extractTitle(html) {
  const og = extractMeta(html, 'og:title', 'property');
  if (og) return og.replace(/\s*[|\-–]\s*.+$/, '').trim();

  const h1 = html.match(/<h1[^>]*>([^<]+)</);
  if (h1) return h1[1].trim();

  const title = html.match(/<title>([^<]+)</);
  if (title) return title[1].replace(/\s*[|\-–]\s*.+$/, '').trim();

  return null;
}

function extractBody(html) {
  // Try article/main/content blocks
  const blocks = [
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i),
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i),
    html.match(/class=["'][^"']*(?:post-content|entry-content|article-body|blog-content|content-body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article)>/i),
  ];

  for (const m of blocks) {
    if (m && m[1] && m[1].length > 200) {
      return stripHtml(m[1]);
    }
  }

  return stripHtml(html);
}

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/-+$/, '');
}

// ─── Process a single site ────────────────────────────────────────────────────

async function syncSite(site) {
  console.log(`\n── ${site.name} (${site.baseUrl}) ─────────────────────`);

  let blogUrl = null;
  let blogHtml = null;

  // Try each blog path until one works
  for (const blogPath of site.blogPaths) {
    const url = site.baseUrl + blogPath;
    try {
      const res = await fetch(url);
      if (res.status === 200 && res.body.length > 500) {
        blogUrl = url;
        blogHtml = res.body;
        console.log(`  Found blog at: ${url}`);
        break;
      }
    } catch { /* try next */ }
  }

  if (!blogHtml) {
    console.log(`  ✗ Could not find blog listing page. Tried: ${site.blogPaths.join(', ')}`);
    console.log(`    If the site uses a different URL, add it to blogPaths in this script.`);
    return { added: 0, skipped: 0, failed: 0 };
  }

  // Extract blog post links from listing page
  const blogPath = new URL(blogUrl).pathname;
  let postLinks = extractBlogLinks(blogHtml, site.baseUrl, blogPath);

  // Deduplicate
  const seen = new Set();
  postLinks = postLinks.filter(l => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });

  console.log(`  Found ${postLinks.length} post links`);

  let added = 0, skipped = 0, failed = 0;

  for (const link of postLinks) {
    // Check if already exists
    const tentativeSlug = toSlug(link.text || path.basename(link.href));
    const existing = fs.existsSync(BLOG_DIR) && fs.readdirSync(BLOG_DIR).some(d => d.includes(tentativeSlug.substring(0, 20)));

    try {
      const res = await fetch(link.href);
      if (res.status !== 200) {
        console.log(`  SKIP (${res.status}): ${link.href}`);
        failed++;
        continue;
      }

      const title = extractTitle(res.body) || link.text;
      const date = extractDate(res.body, link.href) || new Date().toISOString().split('T')[0];
      const body = extractBody(res.body);
      const slug = `${date}-${toSlug(title)}`;
      const outDir = path.join(BLOG_DIR, slug);

      if (fs.existsSync(outDir)) {
        console.log(`  EXISTS: ${slug}`);
        skipped++;
        continue;
      }

      console.log(`  + ${slug}`);

      if (!DRY_RUN) {
        fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(path.join(outDir, 'caption.md'), body);
        fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({
          platform: 'blog',
          title,
          published_at: date,
          source_url: link.href,
          brand: site.brand,
        }, null, 2) + '\n');
      }

      added++;
    } catch (err) {
      console.log(`  FAIL: ${link.href} — ${err.message}`);
      failed++;
    }

    // Polite delay
    await new Promise(r => setTimeout(r, 300));
  }

  return { added, skipped, failed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('Syncing blog posts...');
  if (DRY_RUN) console.log('(dry-run — no files written)\n');

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  const sites = SITES.filter(s => {
    if (TITAN_ONLY) return s.name === 'titan';
    if (TV_ONLY) return s.name === 'titanverse';
    return true;
  });

  let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

  for (const site of sites) {
    const { added, skipped, failed } = await syncSite(site);
    totalAdded += added;
    totalSkipped += skipped;
    totalFailed += failed;
  }

  console.log('\n─────────────────────────────────────');
  console.log(`Added:   ${totalAdded}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Failed:  ${totalFailed}`);

  if (!DRY_RUN && totalAdded > 0) {
    console.log('\nRun: node scripts/build-indexes.js to update posts.json');
  }
})();
