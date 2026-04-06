#!/usr/bin/env node
/**
 * Sync YouTube Transcripts → LinkedIn Post Directories
 *
 * Matches YouTube videos to LinkedIn video posts by publish date (±1 day)
 * and title similarity, then writes transcript.md to matching post dirs.
 *
 * Prerequisites:
 *   1. Run: python scripts/youtube_sync.py pull
 *      (populates data/youtube/transcripts/ and data/youtube/channel_summary.json)
 *
 * Usage:
 *   node scripts/sync-transcripts.js           # Match and write transcripts
 *   node scripts/sync-transcripts.js --dry-run # Preview matches without writing
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(REPO_ROOT, 'posts');
const YT_SUMMARY = path.join(REPO_ROOT, 'data', 'youtube', 'channel_summary.json');
const YT_TRANSCRIPTS_DIR = path.join(REPO_ROOT, 'data', 'youtube', 'transcripts');

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordSet(str) {
  return new Set(
    str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function titleSimilarity(a, b) {
  const sa = wordSet(a);
  const sb = wordSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let overlap = 0;
  for (const w of sa) if (sb.has(w)) overlap++;
  return overlap / Math.max(sa.size, sb.size);
}

function dateDiffDays(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.abs((a - b) / (1000 * 60 * 60 * 24));
}

// ─── Load YouTube data ────────────────────────────────────────────────────────

if (!fs.existsSync(YT_SUMMARY)) {
  console.error('✗ data/youtube/channel_summary.json not found.');
  console.error('  Run: python scripts/youtube_sync.py pull');
  process.exit(1);
}

if (!fs.existsSync(YT_TRANSCRIPTS_DIR)) {
  console.error('✗ data/youtube/transcripts/ not found.');
  console.error('  Run: python scripts/youtube_sync.py pull');
  process.exit(1);
}

const ytSummary = JSON.parse(fs.readFileSync(YT_SUMMARY, 'utf8'));
const ytVideos = ytSummary.videos || [];

// Load transcript text for each video
const transcripts = {};
for (const file of fs.readdirSync(YT_TRANSCRIPTS_DIR)) {
  if (!file.endsWith('.json')) continue;
  const videoId = path.basename(file, '.json');
  try {
    const data = JSON.parse(fs.readFileSync(path.join(YT_TRANSCRIPTS_DIR, file), 'utf8'));
    if (data.full_text) transcripts[videoId] = data.full_text;
  } catch { /* skip malformed */ }
}

console.log(`Loaded ${ytVideos.length} YouTube videos, ${Object.keys(transcripts).length} with transcripts\n`);

// ─── Load LinkedIn video posts ────────────────────────────────────────────────

function getVideoPostsFromDir(publishedDir, brand) {
  if (!fs.existsSync(publishedDir)) return [];
  const posts = [];
  for (const slug of fs.readdirSync(publishedDir).sort()) {
    if (slug.startsWith('.') || slug.startsWith('_')) continue;
    const postDir = path.join(publishedDir, slug);
    if (!fs.statSync(postDir).isDirectory()) continue;

    const metaPath = path.join(postDir, 'meta.json');
    const transcriptPath = path.join(postDir, 'transcript.md');
    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (!['video', 'short_video'].includes(meta.asset_type)) continue;
    if (fs.existsSync(transcriptPath)) continue; // already has transcript

    posts.push({ slug, dir: postDir, date: meta.published_at, brand, title: slug });
  }
  return posts;
}

const titanDir = path.join(POSTS_DIR, 'linkedin', 'titan', 'published');
const tvDir = path.join(POSTS_DIR, 'linkedin', 'titanverse', 'published');
const linkedInVideos = [
  ...getVideoPostsFromDir(titanDir, 'titan'),
  ...getVideoPostsFromDir(tvDir, 'titanverse'),
];

console.log(`Found ${linkedInVideos.length} LinkedIn video posts missing transcripts\n`);

// ─── Match and write ──────────────────────────────────────────────────────────

let matched = 0;
let unmatched = 0;

for (const liPost of linkedInVideos) {
  if (!liPost.date) {
    console.log(`  SKIP (no date): ${liPost.slug}`);
    unmatched++;
    continue;
  }

  // Find YouTube candidates within ±1 day
  const candidates = ytVideos.filter(v => {
    const ytDate = v.published_at ? v.published_at.split('T')[0] : null;
    return ytDate && dateDiffDays(liPost.date, ytDate) <= 1;
  });

  if (candidates.length === 0) {
    console.log(`  NO MATCH:  ${liPost.slug} (${liPost.date})`);
    unmatched++;
    continue;
  }

  // Score each candidate by title similarity
  const scored = candidates
    .map(v => ({
      video: v,
      score: titleSimilarity(liPost.slug, v.title || ''),
      hasTranscript: !!transcripts[v.video_id],
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  // Require either a confident title match OR single same-day candidate with transcript
  const confident = best.score >= 0.3 || (candidates.length === 1 && best.hasTranscript);

  if (!confident) {
    console.log(`  LOW CONF: ${liPost.slug} (${liPost.date}) → best: "${best.video.title?.substring(0, 50)}" (${(best.score * 100).toFixed(0)}%)`);
    unmatched++;
    continue;
  }

  if (!best.hasTranscript) {
    console.log(`  NO TRANSCRIPT: ${liPost.slug} → matched "${best.video.title?.substring(0, 50)}" but no transcript available`);
    unmatched++;
    continue;
  }

  const transcriptText = transcripts[best.video.video_id];
  const ytDate = best.video.published_at ? best.video.published_at.split('T')[0] : '?';
  console.log(`  MATCH (${(best.score * 100).toFixed(0)}%): ${liPost.slug} → "${best.video.title?.substring(0, 50)}" (${ytDate})`);

  if (!DRY_RUN) {
    const transcriptPath = path.join(liPost.dir, 'transcript.md');
    fs.writeFileSync(transcriptPath, transcriptText);
  }

  matched++;
}

console.log(`\n─────────────────────────────────────`);
console.log(`Matched:   ${matched}`);
console.log(`Unmatched: ${unmatched}`);
if (DRY_RUN) console.log('\n(dry-run — no files written)');
else if (matched > 0) console.log('\nRun: node scripts/build-indexes.js to update posts.json');
