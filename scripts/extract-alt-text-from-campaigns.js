#!/usr/bin/env node
/**
 * Extract alt text from campaign folders and populate empty alt-text.md files in posts.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const POSTS = path.join(REPO, 'posts', 'titan', 'published');
const CAMPAIGNS = path.join(REPO, 'campaigns', 'TITAN');

function loadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function readFile(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function extractAltTextFromContent(content) {
  if (!content) return null;
  const altMatch = content.match(/##\s*Alt\s*Text\s*\n\s*\n(.+?)(?=\n##|\n---|$)/is);
  if (altMatch) return altMatch[1].trim();
  const altMatch2 = content.match(/###\s*Alt\s*Text\s*\n\s*\n(.+?)(?=\n###|\n##|\n---|$)/is);
  if (altMatch2) return altMatch2[1].trim();
  return null;
}

function extractTranscriptContent(content) {
  if (!content) return null;
  const transcriptMatch = content.match(/##\s*Transcript\s*\n\s*\n(.+?)(?=\n##|\n---|$)/is);
  if (transcriptMatch) return transcriptMatch[1].trim();
  return null;
}

function findAltTextInCampaign(campaignSlug, assetType, postSlug) {
  if (!campaignSlug) return null;
  const campaignDir = path.join(CAMPAIGNS, campaignSlug);
  if (!fs.existsSync(campaignDir)) return null;

  const contentDir = path.join(campaignDir, 'content');
  if (!fs.existsSync(contentDir)) return null;

  if (assetType === 'carousel') {
    const altFile = path.join(contentDir, 'carousel', 'carousel-01-slides-alt-text.md');
    if (fs.existsSync(altFile)) {
      const content = readFile(altFile);
      if (content && content.trim()) return content.trim();
    }
    const slidesFile = path.join(contentDir, 'carousel', 'carousel-01-slides.md');
    if (fs.existsSync(slidesFile)) {
      const content = readFile(slidesFile);
      const alt = extractAltTextFromContent(content);
      if (alt) return alt;
    }
    const slidesFile2 = path.join(contentDir, 'carousel', 'slides.md');
    if (fs.existsSync(slidesFile2)) {
      const content = readFile(slidesFile2);
      const alt = extractAltTextFromContent(content);
      if (alt) return alt;
    }
  } else if (assetType === 'single-image') {
    const singleImageDir = path.join(contentDir, 'single-image');
    if (fs.existsSync(singleImageDir)) {
      const imageFiles = fs.readdirSync(singleImageDir).filter(f => f.endsWith('.md'));
      for (const file of imageFiles) {
        const imageFile = path.join(singleImageDir, file);
        const content = readFile(imageFile);
        const alt = extractAltTextFromContent(content);
        if (alt) return alt;
      }
    }
  } else if (assetType === 'video' || assetType === 'video-short' || assetType === 'video-longform') {
    const videoDir = path.join(contentDir, 'video');
    if (fs.existsSync(videoDir)) {
      if (postSlug) {
        const transcriptFile = path.join(videoDir, 'shorts', `${postSlug}-transcript.md`);
        if (fs.existsSync(transcriptFile)) {
          const content = readFile(transcriptFile);
          const transcript = extractTranscriptContent(content);
          if (transcript) return transcript;
        }
      }
      const longform = path.join(videoDir, 'longform', 'transcript.md');
      if (fs.existsSync(longform)) {
        const content = readFile(longform);
        const transcript = extractTranscriptContent(content);
        if (transcript) return transcript;
        const alt = extractAltTextFromContent(content);
        if (alt) return alt;
      }
      const shortsDir = path.join(videoDir, 'shorts');
      if (fs.existsSync(shortsDir)) {
        if (postSlug) {
          const transcriptFile = path.join(shortsDir, `${postSlug}-transcript.md`);
          if (fs.existsSync(transcriptFile)) {
            const content = readFile(transcriptFile);
            const transcript = extractTranscriptContent(content);
            if (transcript) return transcript;
          }
          const transcriptFiles = fs.readdirSync(shortsDir).filter(f => f.endsWith('-transcript.md'));
          for (const file of transcriptFiles) {
            const baseName = file.replace('-transcript.md', '');
            if (postSlug === baseName || postSlug.replace('-video', '') === baseName || postSlug.replace('-video-short', '') === baseName) {
              const transcriptFile = path.join(shortsDir, file);
              const content = readFile(transcriptFile);
              const transcript = extractTranscriptContent(content);
              if (transcript) return transcript;
            }
          }
        }
        const shorts = fs.readdirSync(shortsDir).filter(d => {
          const full = path.join(shortsDir, d);
          return fs.statSync(full).isDirectory();
        });
        for (const short of shorts) {
          const transcript = path.join(shortsDir, short, 'transcript.md');
          if (fs.existsSync(transcript)) {
            const content = readFile(transcript);
            const transcriptText = extractTranscriptContent(content);
            if (transcriptText) return transcriptText;
            const alt = extractAltTextFromContent(content);
            if (alt) return alt;
          }
        }
      }
    }
  }

  return null;
}

function main() {
  const stats = { checked: 0, found: 0, written: 0, missing: [] };

  if (!fs.existsSync(POSTS)) {
    console.error(`Posts directory not found: ${POSTS}`);
    return;
  }

  const postDirs = fs.readdirSync(POSTS).filter(name => {
    const full = path.join(POSTS, name);
    return fs.statSync(full).isDirectory() && !name.startsWith('.');
  });

  for (const slug of postDirs) {
    const postDir = path.join(POSTS, slug);
    const altTextFile = path.join(postDir, 'alt-text.md');
    const metaFile = path.join(postDir, 'meta.json');

    if (!fs.existsSync(altTextFile)) continue;
    const altTextContent = readFile(altTextFile);
    if (altTextContent && altTextContent.trim()) continue;

    stats.checked++;
    const meta = loadJson(metaFile);
    const campaign = (meta?.campaign || '').trim();
    const assetType = (meta?.asset_type || '').trim();

    if (!campaign) {
      stats.missing.push({ slug, reason: 'no campaign in meta.json' });
      continue;
    }

    const altText = findAltTextInCampaign(campaign, assetType, slug);
    if (altText) {
      fs.writeFileSync(altTextFile, altText + '\n', 'utf-8');
      stats.found++;
      stats.written++;
      console.log(`✓ ${slug} (from ${campaign})`);
    } else {
      stats.missing.push({ slug, campaign, assetType, reason: 'not found in campaign folder' });
    }
  }

  console.log(`\nSummary:`);
  console.log(`- Checked: ${stats.checked} empty alt-text.md files`);
  console.log(`- Found and written: ${stats.written}`);
  console.log(`- Missing: ${stats.missing.length}`);
  if (stats.missing.length > 0) {
    console.log(`\nMissing alt text for:`);
    for (const m of stats.missing.slice(0, 20)) {
      console.log(`  - ${m.slug} (${m.reason})`);
    }
    if (stats.missing.length > 20) {
      console.log(`  ... and ${stats.missing.length - 20} more`);
    }
  }
}

main();
