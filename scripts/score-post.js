#!/usr/bin/env node
/**
 * score-post.js -- Pre-publish scoring for LinkedIn posts
 *
 * Scores a post concept against proven performance patterns from Titan's
 * LinkedIn data. Run this before publishing to catch weak posts early.
 *
 * Usage:
 *   node scripts/score-post.js <post-directory>
 *   node scripts/score-post.js <post-data.json>
 *
 * Examples:
 *   node scripts/score-post.js posts/linkedin/titan/published/2026-04-09-jeet-dad-quote-single-image/
 *   node scripts/score-post.js posts/linkedin/titan/_drafts/concept-example-single-image/
 *   node scripts/score-post.js /tmp/post-concept.json
 *
 * JSON file format (when not using a post directory):
 *   {
 *     "caption": "Full caption text with line breaks...",
 *     "content_type": "single-image",
 *     "title": "Post Title"
 *   }
 *
 * Scoring dimensions (0-10 each, 50 max):
 *   HOOK        -- Does the first line stop the scroll?
 *   HUMAN       -- Is there a real person anchoring this?
 *   SPECIFICITY -- Are there concrete details?
 *   STAKES      -- Is something at risk or being transformed?
 *   FORMAT FIT  -- Does the format match the content?
 *
 * Verdicts:
 *   40-50  SHIP IT  -- Follows every proven pattern
 *   30-39  GOOD     -- Minor tweaks could strengthen it
 *   20-29  REVIEW   -- Missing key ingredients, will likely underperform
 *    0-19  REWORK   -- Contradicts the data, rethink approach
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.join(__dirname, '..');
const PUBLISHED_DIR = path.join(REPO_ROOT, 'posts', 'linkedin', 'titan', 'published');

/**
 * Known first names that appear frequently in Titan customer stories.
 * Used to boost detection of named-person references in captions.
 */
const KNOWN_SPEAKERS = [
  'jeet', 'rahul', 'prab', 'prabjaudt', 'sagar', 'anna', 'emma', 'stefan',
  'tanzil', 'asif', 'krishna', 'sajid', 'tariq', 'mustafa', 'kieren',
  'jagdeep', 'paula', 'geoff', 'abell', 'david', 'james', 'sarah',
];

/**
 * Words and phrases that signal emotional content in a hook line.
 */
const EMOTIONAL_WORDS = [
  'afraid', 'alone', 'angry', 'anxiety', 'anxious', 'ashamed', 'broke',
  'broken', 'burnout', 'burnt out', 'chaos', 'collapsed', 'cried', 'crisis',
  'crushed', 'danger', 'dangerous', 'dark', 'dead', 'desperate', 'destroyed',
  'devastat', 'dread', 'drowned', 'dying', 'exhausted', 'failed', 'fear',
  'fired', 'forgot', 'frightened', 'gave up', 'guilty', 'heartbeat stopped',
  'helpless', 'homeless', 'hopeless', 'horror', 'hurt', 'impossible',
  'insane', 'life back', 'life changer', 'lonely', 'lost', 'meltdown',
  'midnight', 'miserable', 'mistake', 'near miss', 'nervous', 'nightmare',
  'no sleep', 'nobody', 'nothing', 'overwhelm', 'pain', 'panic', 'quit',
  'rage', 'regret', 'relief', 'remember those days', 'risk', 'sad', 'scared',
  'shock', 'sleepless', 'sobbing', 'stopped', 'stress', 'struggle',
  'suffer', 'survived', 'tears', 'terrif', 'threat', 'toxic', 'tragic',
  'trauma', 'trouble', 'unbearable', 'unsafe', 'warn', 'worried', 'worst',
];

/**
 * Words that indicate a provocative or surprising lead -- good for hooks.
 */
const PROVOCATIVE_WORDS = [
  'actually', 'ban', 'banned', 'bet you', 'controversial', 'couldn\'t believe',
  'didn\'t expect', 'forget everything', 'hard truth', 'here\'s the thing',
  'hot take', 'myth', 'nobody talks about', 'not what you think',
  'controversial', 'prove', 'reality check', 'secret', 'shocking',
  'stop', 'surprise', 'the truth', 'think again', 'uncomfortable',
  'unpopular', 'wake up', 'what if', 'wrong',
];

/**
 * Pharmacy-sector terms that signal specific domain knowledge.
 */
const SPECIFICITY_TERMS = [
  'cd check', 'clinical service', 'clawback', 'compliance', 'controlled drug',
  'dispensary', 'dispensing', 'dspt', 'ehr', 'electronic repeat', 'erd',
  'fmd', 'gphc', 'hub and spoke', 'item volume', 'items a month',
  'items per day', 'medicine', 'migration', 'near miss', 'nhsbsa', 'nms',
  'nominated', 'nomination', 'opd', 'owings', 'patient safety',
  'pharmappy', 'pharmacy contract', 'pharmacy first', 'pillar',
  'pmr', 'prescription', 'repeat', 'saf', 'safeguard', 'script',
  'spine', 'surgery', 'trustpilot', 'workflow',
];

/**
 * Words/phrases that suggest stakes, tension, or transformation.
 */
const STAKES_TERMS = [
  'at risk', 'audit', 'before and after', 'before titan', 'before we',
  'broke the system', 'can\'t afford', 'change', 'clawback', 'close down',
  'compliance', 'couldn\'t continue', 'crisis', 'cut', 'deadline',
  'error', 'fail', 'fine', 'forced', 'gave up', 'going under',
  'had to change', 'incident', 'inspection', 'investigation', 'lawsuit',
  'legislation', 'lose', 'lost', 'million', 'near miss', 'no choice',
  'penalty', 'policy', 'regulation', 'risk', 'safety', 'shut down',
  'since titan', 'since we', 'struggling', 'survive', 'then one day',
  'threat', 'transformation', 'turned around', 'unsafe', 'used to',
  'walked away', 'warning', 'what changed', 'without titan',
];

// ---------------------------------------------------------------------------
// Input loading
// ---------------------------------------------------------------------------

/**
 * Load post data from a directory (reads caption.md and meta.json).
 * @param {string} dirPath - Absolute or relative path to the post directory
 * @returns {{ caption: string, contentType: string, title: string, slug: string, speaker: string, speakerRole: string }}
 */
function loadFromDirectory(dirPath) {
  const absDir = path.resolve(dirPath);

  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    console.error(`Error: "${absDir}" is not a directory.`);
    process.exit(1);
  }

  // Read caption
  let caption = '';
  const captionPath = path.join(absDir, 'caption.md');
  if (fs.existsSync(captionPath)) {
    const raw = fs.readFileSync(captionPath, 'utf-8');
    // Strip the markdown header block (everything before the --- separator)
    const parts = raw.split(/^---$/m);
    caption = parts.length > 1 ? parts.slice(1).join('---').trim() : raw.trim();
  } else {
    console.warn('Warning: No caption.md found in post directory.');
  }

  // Read meta
  let meta = {};
  const metaPath = path.join(absDir, 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (e) {
      console.warn(`Warning: Could not parse meta.json: ${e.message}`);
    }
  } else {
    console.warn('Warning: No meta.json found in post directory.');
  }

  // Normalise content type from either schema version
  // Newer schema: asset_type + content_type (e.g. "single-image" + "customer-quote")
  // Older schema: content_type only (e.g. "video", "carousel", "single-image")
  const contentType = meta.asset_type || meta.content_type || inferTypeFromSlug(absDir);
  const slug = meta.slug || meta.campaign_slug || path.basename(absDir);

  return {
    caption,
    contentType,
    title: meta.title || meta.notion_name || '',
    slug,
    speaker: meta.speaker || '',
    speakerRole: meta.speaker_role || '',
  };
}

/**
 * Load post data from a JSON file.
 * @param {string} filePath - Path to a JSON file with caption, content_type, title
 * @returns {{ caption: string, contentType: string, title: string, slug: string, speaker: string, speakerRole: string }}
 */
function loadFromJson(filePath) {
  const absFile = path.resolve(filePath);

  if (!fs.existsSync(absFile)) {
    console.error(`Error: "${absFile}" does not exist.`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(absFile, 'utf-8'));
  } catch (e) {
    console.error(`Error: Could not parse JSON file: ${e.message}`);
    process.exit(1);
  }

  return {
    caption: data.caption || data.post_caption || '',
    contentType: data.asset_type || data.content_type || 'unknown',
    title: data.title || data.name || '',
    slug: data.slug || data.campaign_slug || path.basename(absFile, '.json'),
    speaker: data.speaker || '',
    speakerRole: data.speaker_role || '',
  };
}

/**
 * Infer content type from the directory name slug when meta.json is missing it.
 * @param {string} dirPath - Directory path whose basename contains the slug
 * @returns {string}
 */
function inferTypeFromSlug(dirPath) {
  const name = path.basename(dirPath).toLowerCase();
  if (name.includes('carousel')) return 'carousel';
  if (name.includes('video')) return 'video';
  if (name.includes('multi-image')) return 'multi-image';
  if (name.includes('single-image')) return 'single-image';
  if (name.includes('meme')) return 'single-image';
  if (name.includes('poll')) return 'poll';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Caption parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract the caption body text (no hashtags, no URLs).
 * @param {string} caption - Raw caption text
 * @returns {string}
 */
function getBodyText(caption) {
  return caption
    .replace(/#\w+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/bit\.ly\/\S+/g, '')
    .trim();
}

/**
 * Split caption into logical paragraphs (separated by blank lines).
 * @param {string} caption - Raw caption text
 * @returns {string[]}
 */
function getParagraphs(caption) {
  return caption
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Get the first meaningful line of the caption (skip header/metadata lines).
 * @param {string} caption - Raw caption text
 * @returns {string}
 */
function getFirstLine(caption) {
  const lines = caption.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  // Skip markdown header lines and metadata
  for (const line of lines) {
    if (line.startsWith('#') && line.includes('Caption')) continue;
    if (line.startsWith('Post date:')) continue;
    if (line.startsWith('Platform:')) continue;
    if (line.startsWith('Creative ID:')) continue;
    if (line === '---') continue;
    return line;
  }
  return lines[0] || '';
}

/**
 * Count words in a string.
 * @param {string} text
 * @returns {number}
 */
function wordCount(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if text contains any term from a list (case-insensitive).
 * @param {string} text
 * @param {string[]} terms
 * @returns {string[]} Matched terms
 */
function findMatches(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter(term => lower.includes(term.toLowerCase()));
}

/**
 * Find proper names in text (capitalised words that are not at sentence start).
 * Returns candidate names -- 2+ consecutive capitalised words, or known speakers.
 * @param {string} text
 * @returns {string[]}
 */
function findNames(text) {
  const names = [];

  // Check for known speakers (case-insensitive)
  const lower = text.toLowerCase();
  for (const speaker of KNOWN_SPEAKERS) {
    if (lower.includes(speaker)) {
      names.push(speaker);
    }
  }

  // Find capitalised multi-word sequences that look like names
  // e.g. "Anna Matthews", "Rahul Puri", "Jeet Vadodaria"
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match;
  while ((match = namePattern.exec(text)) !== null) {
    const candidate = match[1];
    // Filter out common non-name phrases
    const skipPhrases = [
      'Titan PMR', 'Titan Repeat', 'Titan Mobile', 'Pharmacy First',
      'Community Pharmacy', 'Pharmacy Life', 'Head Office', 'No Chaos',
      'Every Time', 'Every Patient', 'Single Image', 'Work Life',
      'Day One', 'Day Two',
    ];
    const isSkip = skipPhrases.some(s => candidate.toLowerCase() === s.toLowerCase());
    if (!isSkip) {
      names.push(candidate);
    }
  }

  return [...new Set(names)];
}

/**
 * Check if a line looks like it opens with a quote (starts with quotation marks).
 * Does not require closing quote on the same line -- multi-line quotes are common.
 * @param {string} line
 * @returns {boolean}
 */
function isQuote(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('"') || trimmed.startsWith('\u201C');
}

/**
 * Find numbers and percentages in text.
 * @param {string} text
 * @returns {string[]}
 */
function findNumbers(text) {
  const matches = [];
  // Percentages
  const pctPattern = /\d+(?:\.\d+)?%/g;
  let m;
  while ((m = pctPattern.exec(text)) !== null) matches.push(m[0]);
  // Currency
  const currPattern = /[£$]\d[\d,.]+/g;
  while ((m = currPattern.exec(text)) !== null) matches.push(m[0]);
  // Large numbers (1,000+)
  const bigNumPattern = /\b\d{1,3}(?:,\d{3})+\b/g;
  while ((m = bigNumPattern.exec(text)) !== null) matches.push(m[0]);
  // X-factor multipliers
  const multPattern = /\b\d+x\b/gi;
  while ((m = multPattern.exec(text)) !== null) matches.push(m[0]);
  // Standalone meaningful numbers (items, hours, days, etc.)
  const numCtxPattern = /\b(\d+)\s*(items?|hours?|days?|minutes?|months?|years?|patients?|pharmacies|consultations?|calls?|scripts?|near miss(?:es)?|errors?)\b/gi;
  while ((m = numCtxPattern.exec(text)) !== null) matches.push(m[0]);
  return [...new Set(matches)];
}

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/**
 * Score the hook / opening line (0-10).
 * @param {string} caption - Full caption text
 * @returns {{ score: number, reasons: string[], suggestions: string[] }}
 */
function scoreHook(caption) {
  const firstLine = getFirstLine(caption);
  const lower = firstLine.toLowerCase();
  let score = 0;
  const reasons = [];
  const suggestions = [];

  if (!firstLine) {
    return { score: 0, reasons: ['No caption text found'], suggestions: ['Add a caption'] };
  }

  // Quote opening (+4)
  if (isQuote(firstLine)) {
    score += 4;
    reasons.push('Opens with a direct quote');
  }

  // Emotional words in first line (+3)
  const emotionalHits = findMatches(firstLine, EMOTIONAL_WORDS);
  if (emotionalHits.length > 0) {
    score += Math.min(3, emotionalHits.length * 1.5);
    reasons.push(`Emotional language: ${emotionalHits.slice(0, 3).join(', ')}`);
  }

  // Question in first line (+2)
  if (firstLine.includes('?')) {
    score += 2;
    reasons.push('Opens with a question');
  }

  // Provocative/surprising language (+2)
  const provocativeHits = findMatches(firstLine, PROVOCATIVE_WORDS);
  if (provocativeHits.length > 0) {
    score += 2;
    reasons.push(`Provocative lead: ${provocativeHits.slice(0, 2).join(', ')}`);
  }

  // Number or statistic in first line (+2)
  const numberHits = findNumbers(firstLine);
  if (numberHits.length > 0) {
    score += 2;
    reasons.push(`Opens with data: ${numberHits.slice(0, 2).join(', ')}`);
  }

  // Named person in first line (+2)
  const nameHits = findNames(firstLine);
  if (nameHits.length > 0) {
    score += 2;
    reasons.push(`Named person in hook: ${nameHits[0]}`);
  }

  // Penalty: starts with brand name (-3)
  if (lower.startsWith('titan')) {
    score -= 3;
    reasons.push('PENALTY: Opens with brand name');
    suggestions.push('Lead with a person, question, or outcome instead of the brand name');
  }

  // Penalty: generic product lead (-2)
  const productLeads = ['we are', 'we\'re', 'our new', 'introducing', 'announcing', 'we just'];
  if (productLeads.some(p => lower.startsWith(p))) {
    score -= 2;
    reasons.push('PENALTY: Generic product/company lead');
    suggestions.push('Open with the customer outcome or an emotional hook, not a product announcement');
  }

  // Clamp to 0-10
  score = Math.max(0, Math.min(10, Math.round(score)));

  // Add suggestions for low scores
  if (score < 5) {
    if (!isQuote(firstLine)) {
      suggestions.push('Try opening with a direct customer quote in the first line');
    }
    if (emotionalHits.length === 0) {
      suggestions.push('Add an emotional element -- fear, relief, frustration, pride');
    }
    if (nameHits.length === 0) {
      suggestions.push('Name a real person in the opening line');
    }
  }

  return { score, reasons, suggestions };
}

/**
 * Score the human element (0-10).
 * @param {string} caption - Full caption text
 * @param {{ speaker: string, speakerRole: string }} meta - Speaker info from meta.json
 * @returns {{ score: number, reasons: string[], suggestions: string[] }}
 */
function scoreHuman(caption, meta) {
  let score = 0;
  const reasons = [];
  const suggestions = [];
  const body = getBodyText(caption);
  const lower = body.toLowerCase();

  // Named speaker in meta.json (+3)
  if (meta.speaker && meta.speaker.length > 1) {
    score += 3;
    reasons.push(`Named speaker in metadata: ${meta.speaker}`);
    // With role (+2 more)
    if (meta.speakerRole && meta.speakerRole.length > 1) {
      score += 2;
      reasons.push(`Speaker role/pharmacy: ${meta.speakerRole}`);
    }
  }

  // Named person in caption text (+3)
  const names = findNames(body);
  if (names.length > 0) {
    score += 3;
    reasons.push(`Named person(s) in caption: ${names.slice(0, 3).join(', ')}`);
  }

  // Pharmacy or business name mentioned (+1)
  const pharmacyPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Pharmacy|Chemist|Health|Dispensary|Hub)\b/g;
  const pharmacyMatches = body.match(pharmacyPattern) || [];
  if (pharmacyMatches.length > 0) {
    score += 1;
    reasons.push(`Named pharmacy/business: ${pharmacyMatches[0]}`);
  }

  // Direct quotes from a person (+1)
  const quotePattern = /[""\u201C].{10,}[""\u201D]/;
  if (quotePattern.test(body)) {
    score += 1;
    reasons.push('Contains direct person quote');
  }

  // Penalty: "pharmacists" / "pharmacies" without a name (-2)
  if (names.length === 0 && !meta.speaker) {
    const genericRefs = (lower.match(/pharmacist|pharmacy team|pharmacy owner|customers/g) || []).length;
    if (genericRefs > 0) {
      score -= 1;
      reasons.push('Generic "pharmacists" reference without naming anyone');
    }
  }

  // Penalty: no human at all
  if (names.length === 0 && !meta.speaker && !quotePattern.test(body)) {
    reasons.push('No identifiable human in the post');
    suggestions.push('Anchor this post with a named customer (e.g. "Jeet at Medichem")');
    suggestions.push('Add a direct quote from a real person');
  }

  // Clamp
  score = Math.max(0, Math.min(10, Math.round(score)));

  if (score < 5) {
    if (!meta.speaker) {
      suggestions.push('Add speaker name and pharmacy to meta.json (speaker, speaker_role)');
    }
    if (names.length === 0) {
      suggestions.push('Name a specific person -- "a pharmacist" never outperforms "Jeet from Medichem"');
    }
  }

  return { score, reasons, suggestions };
}

/**
 * Score specificity (0-10).
 * @param {string} caption - Full caption text
 * @returns {{ score: number, reasons: string[], suggestions: string[] }}
 */
function scoreSpecificity(caption) {
  let score = 0;
  const reasons = [];
  const suggestions = [];
  const body = getBodyText(caption);

  // Numbers and stats (+3 for any, +1 per additional up to +3 more)
  const numbers = findNumbers(body);
  if (numbers.length > 0) {
    score += 3;
    reasons.push(`Concrete numbers: ${numbers.slice(0, 4).join(', ')}`);
    score += Math.min(3, numbers.length - 1);
  }

  // Domain-specific terms (+2 for 2+, +1 for 1)
  const domainHits = findMatches(body, SPECIFICITY_TERMS);
  if (domainHits.length >= 2) {
    score += 2;
    reasons.push(`Domain terms: ${domainHits.slice(0, 4).join(', ')}`);
  } else if (domainHits.length === 1) {
    score += 1;
    reasons.push(`Domain term: ${domainHits[0]}`);
  }

  // Named integration or product (+1)
  const integrations = ['pharmappy', 'titan repeat', 'titan mobile', 'titan batch',
    'spine', 'nhsbsa', 'erd', 'dspt', 'fmd scanner', 'marketplace'];
  const intHits = findMatches(body, integrations);
  if (intHits.length > 0) {
    score += 1;
    reasons.push(`Named product/integration: ${intHits.join(', ')}`);
  }

  // Before/after comparison (+1)
  const beforeAfterPattern = /before\s+(?:titan|we|they|the switch|migration)|after\s+(?:titan|going live|the switch|migration)|used to.*now|was.*now|then.*now/i;
  if (beforeAfterPattern.test(body)) {
    score += 1;
    reasons.push('Contains before/after comparison');
  }

  // Penalty: vague buzzwords without specifics (-1 each, max -3)
  const buzzwords = ['efficient', 'streamlined', 'innovative', 'cutting-edge', 'seamless',
    'game-changer', 'best-in-class', 'solution', 'leverage', 'synergy'];
  const buzzHits = findMatches(body, buzzwords);
  if (buzzHits.length > 0 && numbers.length === 0) {
    const penalty = Math.min(3, buzzHits.length);
    score -= penalty;
    reasons.push(`PENALTY: Buzzwords without data: ${buzzHits.join(', ')}`);
    suggestions.push('Replace vague claims with real numbers or specific outcomes');
  }

  // Clamp
  score = Math.max(0, Math.min(10, Math.round(score)));

  if (score < 5) {
    if (numbers.length === 0) {
      suggestions.push('Add a real number -- items per month, % improvement, time saved');
    }
    if (domainHits.length === 0) {
      suggestions.push('Include pharmacy-specific terms (NMS, repeat prescriptions, CD checks, etc.)');
    }
  }

  return { score, reasons, suggestions };
}

/**
 * Score stakes / tension (0-10).
 * @param {string} caption - Full caption text
 * @returns {{ score: number, reasons: string[], suggestions: string[] }}
 */
function scoreStakes(caption) {
  let score = 0;
  const reasons = [];
  const suggestions = [];
  const body = getBodyText(caption);

  // Stakes terms (+2 for 3+, +1 for 1-2)
  const stakesHits = findMatches(body, STAKES_TERMS);
  if (stakesHits.length >= 3) {
    score += 3;
    reasons.push(`High-tension language: ${stakesHits.slice(0, 4).join(', ')}`);
  } else if (stakesHits.length >= 1) {
    score += Math.min(2, stakesHits.length);
    reasons.push(`Some tension: ${stakesHits.join(', ')}`);
  }

  // Before/after transformation arc (+3)
  const transformationPattern = /(?:before|used to|was spending|were wasting|struggled|couldn't)[\s\S]{10,200}(?:now|since|after|today|instead)/i;
  if (transformationPattern.test(body)) {
    score += 3;
    reasons.push('Transformation arc: before/after narrative');
  }

  // Industry-level stakes (policy, regulation, contracts) (+2)
  const industryStakes = ['contract', 'legislation', 'regulation', 'policy', 'nhsbsa',
    'clawback', 'inspection', 'gphc', 'cqc', 'ban', 'fine', 'penalty'];
  const industryHits = findMatches(body, industryStakes);
  if (industryHits.length > 0) {
    score += 2;
    reasons.push(`Industry stakes: ${industryHits.slice(0, 3).join(', ')}`);
  }

  // Emotional language suggesting personal stakes (+1)
  const emotionalHits = findMatches(body, EMOTIONAL_WORDS);
  if (emotionalHits.length >= 2) {
    score += 2;
    reasons.push(`Personal emotional stakes: ${emotionalHits.slice(0, 3).join(', ')}`);
  } else if (emotionalHits.length === 1) {
    score += 1;
    reasons.push(`Emotional element: ${emotionalHits[0]}`);
  }

  // Clamp
  score = Math.max(0, Math.min(10, Math.round(score)));

  if (score < 5) {
    if (stakesHits.length === 0) {
      suggestions.push('What was at risk before? Add the "without this" scenario');
    }
    if (!transformationPattern.test(body)) {
      suggestions.push('Frame as a before/after story -- "Before Titan... Now..."');
    }
    suggestions.push('Top posts always have something at stake: time, safety, money, wellbeing');
  }

  return { score, reasons, suggestions };
}

/**
 * Score format fit (0-10).
 * @param {string} caption - Full caption text
 * @param {string} contentType - The content type (video, carousel, single-image, etc.)
 * @returns {{ score: number, reasons: string[], suggestions: string[] }}
 */
function scoreFormatFit(caption, contentType) {
  let score = 5; // Start at neutral
  const reasons = [];
  const suggestions = [];
  const body = getBodyText(caption);
  const words = wordCount(body);
  const type = (contentType || 'unknown').toLowerCase();
  const hasQuotes = /[""\u201C].{10,}[""\u201D]/.test(body);
  const hasList = /^[\s]*[-*\u2022\u2713\u2714\u2705]\s/m.test(body) || /^\d+\.\s/m.test(body);
  const hasSteps = /step\s*\d|slide\s*\d|page\s*\d/i.test(body);
  const paragraphs = getParagraphs(body);

  // Video checks
  if (type === 'video') {
    if (hasQuotes) {
      score += 2;
      reasons.push('Video with direct quotes -- good testimonial fit');
    }
    if (words < 80) {
      score += 1;
      reasons.push('Short caption for video -- lets the video do the work');
    }
    if (words > 200) {
      score -= 2;
      reasons.push('PENALTY: Very long caption for a video post');
      suggestions.push('Videos should have shorter captions -- the story is in the footage');
    }
  }

  // Carousel checks
  if (type === 'carousel') {
    if (hasList || hasSteps || paragraphs.length >= 3) {
      score += 2;
      reasons.push('Carousel with structured/list content -- good walkthrough fit');
    }
    if (words < 30) {
      score -= 1;
      reasons.push('Caption too short for a carousel -- needs context');
      suggestions.push('Carousels benefit from a caption that frames the walkthrough');
    }
  }

  // Single image checks
  if (type === 'single-image' || type === 'customer-quote' || type === 'trustpilot-review') {
    if (hasQuotes) {
      score += 2;
      reasons.push('Quote card with direct quote -- strong format match');
    }
    if (words > 250) {
      score -= 1;
      reasons.push('Long caption for a single image -- consider carousel');
      suggestions.push('This much text might work better as a carousel');
    }
    if (hasList && paragraphs.length > 4) {
      score -= 1;
      reasons.push('List-heavy content in a single image -- consider carousel');
      suggestions.push('Step-by-step or list content typically performs better as a carousel');
    }
  }

  // Multi-image checks
  if (type === 'multi-image') {
    score += 1;
    reasons.push('Multi-image post -- good for behind-the-scenes or visit recaps');
  }

  // Meme / light content
  if (type === 'meme' || (body.toLowerCase().includes('meme') && type === 'single-image')) {
    if (words < 60) {
      score += 1;
      reasons.push('Short caption for meme -- appropriate');
    }
  }

  // Unknown format penalty
  if (type === 'unknown') {
    score -= 2;
    reasons.push('PENALTY: Content type not specified');
    suggestions.push('Set content_type in meta.json (video, carousel, single-image, multi-image)');
  }

  // Format variety check (look at recent posts in the same directory)
  const formatWarning = checkFormatVariety(contentType);
  if (formatWarning) {
    score -= 2;
    reasons.push(`PENALTY: ${formatWarning}`);
    suggestions.push('Mix up your formats -- back-to-back same-type posts underperform');
  }

  // Clamp
  score = Math.max(0, Math.min(10, Math.round(score)));

  if (reasons.length === 0) {
    reasons.push('Format seems reasonable for this content');
  }

  return { score, reasons, suggestions };
}

/**
 * Check if the last 3 published posts are the same format.
 * @param {string} contentType - Current post content type
 * @returns {string|null} Warning message or null
 */
function checkFormatVariety(contentType) {
  if (!fs.existsSync(PUBLISHED_DIR)) return null;

  const type = normaliseFormat(contentType);
  if (!type) return null;

  try {
    const dirs = fs.readdirSync(PUBLISHED_DIR)
      .filter(d => !d.startsWith('.') && !d.startsWith('_'))
      .sort()
      .slice(-3); // Last 3 posts by date (dirs are date-prefixed)

    let sameCount = 0;
    for (const dir of dirs) {
      const dirType = normaliseFormat(inferTypeFromSlug(path.join(PUBLISHED_DIR, dir)));
      if (dirType === type) sameCount++;
    }

    if (sameCount >= 3) {
      return `Last 3 posts were all ${type} -- format fatigue risk`;
    }
    if (sameCount >= 2) {
      return `2 of the last 3 posts were ${type} -- consider varying format`;
    }
  } catch (e) {
    // Silently fail -- format variety is a bonus check
  }

  return null;
}

/**
 * Normalise format strings to a base type for comparison.
 * @param {string} type
 * @returns {string}
 */
function normaliseFormat(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t.includes('video')) return 'video';
  if (t.includes('carousel')) return 'carousel';
  if (t.includes('single') || t === 'customer-quote' || t === 'trustpilot-review' || t === 'meme') return 'single-image';
  if (t.includes('multi')) return 'multi-image';
  if (t.includes('poll')) return 'poll';
  return t;
}

// ---------------------------------------------------------------------------
// Anti-pattern checks
// ---------------------------------------------------------------------------

/**
 * Check the caption for common anti-patterns that correlate with underperformance.
 * @param {string} caption - Full caption text
 * @returns {{ warnings: string[], info: string[] }}
 */
function checkAntiPatterns(caption) {
  const warnings = [];
  const info = [];
  const body = getBodyText(caption);
  const firstLine = getFirstLine(caption);
  const words = wordCount(body);
  const paragraphs = getParagraphs(body);

  // 1. Starts with brand name
  if (/^titan/i.test(firstLine)) {
    warnings.push('Caption starts with "Titan" -- top posts lead with people or outcomes, not the brand');
  }

  // 2. No line breaks in first 3 lines
  const firstChunk = body.split('\n').slice(0, 3).join(' ');
  if (firstChunk.length > 200 && !body.substring(0, 200).includes('\n\n')) {
    warnings.push('No paragraph break in the first 200 characters -- add white space to improve readability');
  }

  // 3. Missing hashtags
  const hashtags = (caption.match(/#\w+/g) || []);
  if (hashtags.length === 0) {
    warnings.push('No hashtags found -- add 2-5 relevant hashtags for reach');
  } else if (hashtags.length > 8) {
    warnings.push(`${hashtags.length} hashtags is excessive -- 3-5 is optimal for LinkedIn`);
  } else {
    info.push(`Hashtags (${hashtags.length}): ${hashtags.join(' ')}`);
  }

  // 4. Over 250 words
  if (words > 250) {
    warnings.push(`Caption is ${words} words -- over 250 words tends to lose LinkedIn readers`);
  }

  // 5. Under 30 words
  if (words < 30 && words > 0) {
    warnings.push(`Caption is only ${words} words -- too short to tell a story (aim for 50-150)`);
  }

  // 6. Buried hook (emotional/quote content appears late)
  if (paragraphs.length >= 4) {
    const firstTwoParagraphs = paragraphs.slice(0, 2).join(' ').toLowerCase();
    const laterParagraphs = paragraphs.slice(2).join(' ');
    const laterEmotional = findMatches(laterParagraphs, EMOTIONAL_WORDS);
    const earlyEmotional = findMatches(firstTwoParagraphs, EMOTIONAL_WORDS);

    if (laterEmotional.length > 0 && earlyEmotional.length === 0) {
      warnings.push('Emotional content buried after paragraph 2 -- move the hook to the top');
    }

    // Check for late quotes
    const earlyQuote = /[""\u201C]/.test(paragraphs.slice(0, 2).join(' '));
    const lateQuote = /[""\u201C]/.test(paragraphs.slice(3).join(' '));
    if (lateQuote && !earlyQuote && paragraphs.length > 4) {
      warnings.push('Direct quote appears late in the caption -- lead with it for stronger engagement');
    }
  }

  // 7. No call-to-action or engagement prompt
  const ctaPatterns = /\?|comment|share|tag|what do you think|agree|let me know|drop a|tell us|link in|learn more|bit\.ly|check out/i;
  if (!ctaPatterns.test(body)) {
    info.push('No question or call-to-action detected -- consider ending with a prompt');
  }

  // 8. Word count info
  info.push(`Word count: ${words}`);
  info.push(`Paragraphs: ${paragraphs.length}`);

  return { warnings, info };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

/**
 * Generate and print the formatted scoring report.
 * @param {{ caption: string, contentType: string, title: string, slug: string, speaker: string, speakerRole: string }} post
 */
function printReport(post) {
  const divider = '='.repeat(64);
  const thinDivider = '-'.repeat(64);

  console.log('');
  console.log(divider);
  console.log('  TITAN PRE-PUBLISH SCORE REPORT');
  console.log(divider);
  console.log('');
  console.log(`  Post:    ${post.title || post.slug}`);
  console.log(`  Format:  ${post.contentType || 'unknown'}`);
  if (post.speaker) {
    console.log(`  Speaker: ${post.speaker}${post.speakerRole ? ' (' + post.speakerRole + ')' : ''}`);
  }
  console.log('');
  console.log(thinDivider);

  // Score each dimension
  const hook = scoreHook(post.caption);
  const human = scoreHuman(post.caption, { speaker: post.speaker, speakerRole: post.speakerRole });
  const specificity = scoreSpecificity(post.caption);
  const stakes = scoreStakes(post.caption);
  const formatFit = scoreFormatFit(post.caption, post.contentType);

  const dimensions = [
    { name: 'HOOK', label: 'First-line scroll-stopper', ...hook },
    { name: 'HUMAN', label: 'Real person anchoring', ...human },
    { name: 'SPECIFICITY', label: 'Concrete details', ...specificity },
    { name: 'STAKES', label: 'Tension / transformation', ...stakes },
    { name: 'FORMAT FIT', label: 'Format matches content', ...formatFit },
  ];

  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);

  // Print each dimension
  for (const dim of dimensions) {
    console.log('');
    const bar = scoreBar(dim.score);
    console.log(`  ${dim.name.padEnd(14)} ${bar}  ${dim.score}/10`);
    console.log(`  ${dim.label}`);
    for (const reason of dim.reasons) {
      const prefix = reason.startsWith('PENALTY') ? '  ! ' : '  + ';
      console.log(`${prefix}${reason}`);
    }
  }

  // Total and verdict
  console.log('');
  console.log(thinDivider);
  const verdict = getVerdict(totalScore);
  console.log('');
  console.log(`  TOTAL SCORE:  ${totalScore}/50`);
  console.log(`  VERDICT:      ${verdict.label}`);
  console.log(`                ${verdict.description}`);

  // Improvement suggestions
  const allSuggestions = dimensions.flatMap(d => d.suggestions);
  if (allSuggestions.length > 0) {
    console.log('');
    console.log(thinDivider);
    console.log('');
    console.log('  SUGGESTIONS');
    console.log('');
    const seen = new Set();
    for (const suggestion of allSuggestions) {
      if (seen.has(suggestion)) continue;
      seen.add(suggestion);
      console.log(`  > ${suggestion}`);
    }
  }

  // Anti-pattern checks
  const { warnings, info } = checkAntiPatterns(post.caption);
  if (warnings.length > 0) {
    console.log('');
    console.log(thinDivider);
    console.log('');
    console.log('  ANTI-PATTERN WARNINGS');
    console.log('');
    for (const w of warnings) {
      console.log(`  ! ${w}`);
    }
  }

  if (info.length > 0) {
    console.log('');
    console.log(thinDivider);
    console.log('');
    console.log('  POST INFO');
    console.log('');
    for (const i of info) {
      console.log(`    ${i}`);
    }
  }

  console.log('');
  console.log(divider);
  console.log('');
}

/**
 * Generate a visual score bar.
 * @param {number} score - Score 0-10
 * @returns {string}
 */
function scoreBar(score) {
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '[' + '#'.repeat(filled) + '.'.repeat(empty) + ']';
}

/**
 * Get the verdict label and description for a total score.
 * @param {number} totalScore - Total score out of 50
 * @returns {{ label: string, description: string }}
 */
function getVerdict(totalScore) {
  if (totalScore >= 40) {
    return {
      label: 'SHIP IT',
      description: 'This follows every proven pattern. Publish with confidence.',
    };
  }
  if (totalScore >= 30) {
    return {
      label: 'GOOD',
      description: 'Solid post. Minor tweaks above could push it higher.',
    };
  }
  if (totalScore >= 20) {
    return {
      label: 'REVIEW',
      description: 'Missing key ingredients. Will likely underperform without changes.',
    };
  }
  return {
    label: 'REWORK',
    description: 'Contradicts proven patterns. Rethink the approach before publishing.',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Entry point. Parses CLI arguments and runs the scoring pipeline.
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('');
    console.log('Usage: node scripts/score-post.js <post-directory-or-json-file>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/score-post.js posts/linkedin/titan/published/2026-04-09-jeet-dad-quote-single-image/');
    console.log('  node scripts/score-post.js posts/linkedin/titan/_drafts/concept-example-single-image/');
    console.log('  node scripts/score-post.js /tmp/post-concept.json');
    console.log('');
    console.log('JSON file format:');
    console.log('  { "caption": "...", "content_type": "single-image", "title": "My Post" }');
    console.log('');
    console.log('Scores: HOOK, HUMAN, SPECIFICITY, STAKES, FORMAT FIT (0-10 each, 50 max)');
    console.log('Verdicts: SHIP IT (40+), GOOD (30-39), REVIEW (20-29), REWORK (0-19)');
    console.log('');
    process.exit(0);
  }

  const input = args[0];
  const resolved = path.resolve(input);

  let post;
  try {
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      post = loadFromDirectory(resolved);
    } else if (resolved.endsWith('.json')) {
      post = loadFromJson(resolved);
    } else {
      console.error('Error: Input must be a directory or a .json file.');
      process.exit(1);
    }
  } catch (e) {
    console.error(`Error: Cannot access "${resolved}": ${e.message}`);
    process.exit(1);
  }

  if (!post.caption || post.caption.trim().length === 0) {
    console.error('Error: No caption text found. Cannot score an empty post.');
    process.exit(1);
  }

  printReport(post);
}

main();
