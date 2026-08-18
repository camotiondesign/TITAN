#!/usr/bin/env node
/**
 * Build Content Intelligence Layer
 *
 * Reads LinkedIn exports, classifies posts by the 12 content formula types,
 * scores them with QES, runs cohort analysis, checks formula compliance,
 * and generates actionable recommendations.
 *
 * Outputs: exports/content-intelligence.json
 *
 * Run: node scripts/build-content-intelligence.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const EXPORTS_DIR = path.join(REPO_ROOT, 'exports');
const TODAY = new Date().toISOString().split('T')[0];

// ─── Known Customers ────────────────────────────────────────────────────────

const KNOWN_CUSTOMERS = [
  { name: 'jeet', full: 'Jeet Vadodaria', brand: 'titan' },
  { name: 'rahul', full: 'Rahul Puri', brand: 'titan' },
  { name: 'prab', full: 'Prab', brand: 'titan' },
  { name: 'sagar', full: 'Sagar', brand: 'titan' },
  { name: 'geoff', full: 'Geoff Thomas', brand: 'titan' },
  { name: 'asif', full: 'Asif (Safys)', brand: 'titan' },
  { name: 'pritee', full: 'Pritee', brand: 'titan' },
  { name: 'akbar', full: 'Akbar', brand: 'titan' },
  { name: 'mustafa', full: 'Mustafa', brand: 'titan' },
  { name: 'kieren', full: 'Kieren', brand: 'titan' },
  { name: 'kieran', full: 'Kieran', brand: 'titan' },
  { name: 'jagdeep', full: 'Jagdeep', brand: 'titan' },
  { name: 'kanav', full: 'Kanav', brand: 'titan' },
  { name: 'ash', full: 'Ash', brand: 'titan' },
  { name: 'cameron', full: 'Cameron', brand: 'titan' },
  { name: 'anup', full: 'Anup', brand: 'titan' },
  { name: 'elias', full: 'Elias', brand: 'titan' },
  { name: 'ishpal', full: 'Ishpal', brand: 'titan' },
  { name: 'maria', full: 'Maria', brand: 'titan' },
  { name: 'charlotte', full: 'Charlotte', brand: 'titan' },
  { name: 'ian', full: 'Ian', brand: 'titan' },
  { name: 'alta', full: 'Alta', brand: 'titan' },
  { name: 'andy', full: 'Andy', brand: 'titan' },
  { name: 'hooman', full: 'Hooman', brand: 'titan' },
  { name: 'tariq', full: 'Tariq', brand: 'titan' },
  { name: 'sajid', full: 'Sajid', brand: 'titan' },
  { name: 'zack', full: 'Zack', brand: 'titan' },
  { name: 'sachin', full: 'Sachin', brand: 'titan' },
  { name: 'paula', full: 'Paula', brand: 'titan' },
  { name: 'anna', full: 'Anna Matthews', brand: 'titan' },
  { name: 'emma', full: 'Emma', brand: 'titan' },
  { name: 'stefan', full: 'Stefan', brand: 'titan' },
  { name: 'tanzil', full: 'Tanzil', brand: 'titan' },
  { name: 'krishna', full: 'Krishna', brand: 'titan' },
  { name: 'abel', full: 'Abel', brand: 'titan' },
  { name: 'sunil', full: 'Sunil', brand: 'titan' },
  { name: 'nas', full: 'Nas', brand: 'titan' },
  { name: 'riddhesh', full: 'Riddhesh', brand: 'titan' },
  { name: 'nathan', full: 'Nathan', brand: 'titan' },
  { name: 'yusuf', full: 'Yusuf', brand: 'titanverse' },
  { name: 'wahid', full: 'Wahid', brand: 'titanverse' },
  { name: 'dervis', full: 'Dervis', brand: 'titanverse' },
  { name: 'malia', full: 'Malia', brand: 'titan' },
  { name: 'maliha', full: 'Maliha', brand: 'titan' },
];

// ─── Post Type Classification ───────────────────────────────────────────────

const TIER_MAP = {
  customer_transformation: 1,
  industry_stance: 1,
  meme_relatable: 1,
  customer_quote_card: 2,
  reactive_news: 2,
  safety_awareness: 2,
  feature_post: 2,
  cultural_calendar: 2,
  video_testimonial: 3,
  engagement_question: 3,
  thought_leadership: 3,
  event_content: 3,
};

function slugSegments(slug) {
  return slug.split('-');
}

function findCustomerInSlug(slug) {
  const segs = slugSegments(slug);
  for (const c of KNOWN_CUSTOMERS) {
    if (segs.includes(c.name)) return c;
  }
  return null;
}

function findCustomersInCaption(caption) {
  if (!caption) return [];
  const lower = caption.toLowerCase();
  const found = [];
  for (const c of KNOWN_CUSTOMERS) {
    const regex = new RegExp(`\\b${c.name}\\b`, 'i');
    if (regex.test(lower)) found.push(c);
  }
  return found;
}

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

function hasBeforeAfterArc(caption) {
  if (!caption) return false;
  return /before.*(?:now|since|after|today)|used to.*now|from.*to.*(?:items|hours|minutes|percent|%)|went from/i.test(caption);
}

function hasNumbers(caption) {
  if (!caption) return false;
  return /\b\d{2,}[,%]?\b/.test(caption);
}

function classifyPostType(post) {
  const slug = post.slug || '';
  const caption = post.caption || '';
  const type = post.asset_type || '';
  const segs = slugSegments(slug);
  const customer = findCustomerInSlug(slug);
  const wc = wordCount(caption);
  const firstLine = caption.split('\n')[0] || '';

  // Known pharmacy names (maps to customer content even without person name)
  const PHARMACY_NAMES = ['easons', 'brighton-hill', 'drayton-prime', 'medichem', 'wellesbourne', 'skegby', 'howletts', 'safys', 'malpas', 'puri', 'hollowood', 'rexall', 'knight-street', 'clifton', 'alpharm', 'avicenna', 'greenway', 'ninth-street', 'bmp', 'vexil'];
  const hasPharmacyName = PHARMACY_NAMES.some(p => slug.includes(p));

  // 1. Customer Transformation Story
  const transformKeywords = ['transformation', 'growth', 'scaling', 'workflow', 'paperless', 'day-one', 'efficiency', 'switch', 'migration', 'journey', 'story', 'longform', 'case-study'];
  if (customer && type === 'carousel') return 'customer_transformation';
  if (customer && transformKeywords.some(k => segs.includes(k))) return 'customer_transformation';
  if (customer && hasBeforeAfterArc(caption) && hasNumbers(caption)) return 'customer_transformation';
  if (slug.includes('longform') || slug.includes('case-study')) return 'customer_transformation';
  if (hasPharmacyName && (slug.includes('switch') || slug.includes('visit') || type === 'carousel') && hasNumbers(caption)) return 'customer_transformation';

  // 2. Video Testimonial
  if (type === 'video' && (segs.includes('testimonial') || segs.includes('interview') || segs.includes('review') || customer || hasPharmacyName)) {
    return 'video_testimonial';
  }

  // 3. Industry Stance / Controversy
  const stanceSlugKeywords = ['advocacy', 'struggling', 'innovator', 'myths', 'reality', 'walk-away', 'prescribing-fails', 'substitution', 'shoulder', 'independent-pharmacy'];
  if (stanceSlugKeywords.some(k => slug.includes(k))) return 'industry_stance';
  if (/\b(?:stop|wrong|myth|hard truth|the truth|unpopular|controversial|your pharmacy isn.t|isn.t struggling|pharmacist workforce)\b/i.test(firstLine)) return 'industry_stance';
  if (slug.includes('nhs-plan') || slug.includes('nhs-five') || slug.includes('nhs-10-year') || slug.includes('nhs-article') || slug.includes('workforce-wellbeing') || slug.includes('pharmacist-workforce') || slug.includes('pharmacy-ranked') || slug.includes('independent-prescribing') || slug.includes('pharmacy-evolution')) return 'industry_stance';

  // 4. Meme / Relatable
  const memeKeywords = ['meme', 'spongebob', 'drake', 'gandalf', 'fine', 'furious', 'battery', 'museum', 'abducted', 'pick-your-player', 'pick-one', 'wrapped', 'pharmacy-type', 'starter-pack'];
  if (memeKeywords.some(k => slug.includes(k))) return 'meme_relatable';
  if (slug.includes('go-live-chaos') || slug.includes('can-you-spot') || slug.includes('too-many-baskets') || slug.includes('step-out-freezes') || slug.includes('admin-stealing') || slug.includes('high-volume-zero-panic')) return 'meme_relatable';
  if (wc < 60 && /😂|😎|👀|🤣|look familiar|some pharmacists|this is fine/i.test(caption)) return 'meme_relatable';
  if (wc < 40 && type === 'single-image' && !hasPharmacyName && !customer) return 'meme_relatable';

  // 5. Customer Quote Card
  if (type === 'single-image' && customer && wc < 120) return 'customer_quote_card';
  if (type === 'single-image' && (hasPharmacyName || slug.includes('nms-growth') || slug.includes('hours-saved') || slug.includes('scaling'))) return 'customer_quote_card';

  // 6. Reactive / News
  const reactiveKeywords = ['mounjaro', 'clawback', 'opd', 'eps-wales', 'pharmacy-first-funding', 'nhs-article', 'substitution-rights', 'contract-changes', 'legislation'];
  if (reactiveKeywords.some(k => slug.includes(k))) return 'reactive_news';
  if (/\b(?:breaking|just announced|new legislation|starting from|effective from|deadline)\b/i.test(caption)) return 'reactive_news';

  // 7. Safety / Awareness
  const safetyKeywords = ['safety', 'barcode', 'gtin', 'near-miss', 'near-misses', 'dspt', 'renomination', 'patient-choice', 'audit-trail', 'serial-checker', 'cd-check'];
  if (safetyKeywords.some(k => slug.includes(k))) return 'safety_awareness';
  if (/\b(?:near miss|patient safety|controlled drug|cd check|barcode|gtin|compliance|dspt|safeguard)\b/i.test(caption) && !reactiveKeywords.some(k => slug.includes(k))) return 'safety_awareness';

  // 8. Feature Post (story-wrapped)
  const featureKeywords = ['batch-flow', 'titan-mobile', 'titan-mail', 'titan-batch', 'titan-ai', 'repeat-flow', 'marketplace', 'pharm-appy', 'pharmappy', 'patient-tags', 'filter', 'nomination', 'claiming', 'stock-control', 'shelf-location', 'packaging', 'dashboard', 'titan-way', 'automation', '3-automation', '5-ways-ai', 'scale-50', 'pharmacists-only', 'automated-dispensing', 'digital-triage', 'zero-lost-prescriptions', 'ai-backup', 'ai-airlock', 'ai-in-pharmacy', 'fewer-missed-repeats', 'repeat-workarounds', 'where-time-goes', 'modern-pharmacy-workflow', 'baskets-down', 'clinical-ready', 'data-focus', 'pharmacy-but-smarter', 'scale-smarter', 'multi-branch-control', 'impersonal-to-personal', 'trusted-resources', 'search-insights', 'everything-in-one', 'seamless-integrations', 'system-owned', 'ai-assistant', 'one-place-services'];
  if (featureKeywords.some(k => slug.includes(k))) return 'feature_post';
  // Titanverse feature posts
  if (slug.includes('titanverse') && (slug.includes('ai-templates') || slug.includes('smart-consultations') || slug.includes('time-for-services') || slug.includes('clinical-pathways') || slug.includes('ai-agents') || slug.includes('consultation') || slug.includes('central-nms') || slug.includes('dispensing-cant-fund') || slug.includes('dispensing-to-health') || slug.includes('pathway') || slug.includes('level-up') || slug.includes('from-noise'))) return 'feature_post';
  if (slug.includes('noise-to-calm') || slug.includes('quick-actions') || slug.includes('demdx') || slug.includes('personal-carousel') || slug.includes('level-up') || slug.includes('central-nms') || slug.includes('dispensing-cant-fund')) return 'feature_post';

  // 9. Cultural / Calendar
  const culturalKeywords = ['christmas', 'eid', 'ramadan', 'diwali', 'valentines', 'new-year', 'happy-new', 'pharmacy-heroes', 'ask-your-pharmacist', 'pharmacy-technician', 'resolutions', 'mubarak'];
  if (culturalKeywords.some(k => slug.includes(k))) return 'cultural_calendar';

  // 10. Engagement Question
  if (slug.includes('poll') || slug.includes('how-do-you-feel') || slug.includes('what-would-you') || slug.includes('chatgpt-prompts')) return 'engagement_question';
  if (type === 'single-image' && wc < 80 && caption.trim().endsWith('?')) return 'engagement_question';

  // 11. Thought Leadership / POV
  const tlKeywords = ['pov', 'talking-head', 'hod', 'leadership', 'thought', 'documentary', 'operating-without', 'only14', 'family-life'];
  if (tlKeywords.some(k => slug.includes(k))) return 'thought_leadership';

  // 12. Event Content
  const eventKeywords = ['pharmacy-show', 'conference', 'agm', 'titanup', 'bbq', 'venue-recce', 'event', 'devon-pharmacy', 'cpgm', 'merch', 'head-office-day', 'milestone', '1000th', 'support-best-month', 'early-adopters-day', 'webinar', 'days-to-go', 'hard-launch', 'blog-promotion'];
  if (eventKeywords.some(k => slug.includes(k))) return 'event_content';
  // Titanverse launch countdown / events
  if (slug.includes('titanverse') && (slug.includes('days-to-go') || slug.includes('webinar') || slug.includes('launch'))) return 'event_content';

  // Fallback heuristics
  if (customer || hasPharmacyName) return type === 'video' ? 'video_testimonial' : 'customer_quote_card';
  if (slug.includes('trustpilot') || slug.includes('reviews')) return 'feature_post';
  if (slug.includes('growth') || slug.includes('habits') || slug.includes('strategy') || slug.includes('shifting') || slug.includes('nhs-strategy')) return 'thought_leadership';
  if (type === 'video' && wc < 100) return 'thought_leadership';
  if (slug.includes('nervous') || slug.includes('chaos')) return 'meme_relatable';
  if (slug.includes('some-things-matter') || slug.includes('pharmacy-is-shifting') || slug.includes('dispensing-to-health')) return 'thought_leadership';

  return 'unknown';
}

// ─── Scoring ────────────────────────────────────────────────────────────────

const MIN_IMPRESSIONS = 100;

function computeQES(metrics) {
  if (!metrics || metrics.impressions < MIN_IMPRESSIONS) return null;
  const { reactions = 0, comments = 0, reposts = 0, impressions } = metrics;
  return Math.round(((reactions + comments * 3 + reposts * 2) / impressions) * 1000 * 10) / 10;
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
}

// ─── Enrichment ─────────────────────────────────────────────────────────────

function enrichPost(post) {
  const classified_type = classifyPostType(post);
  const slugCustomer = findCustomerInSlug(post.slug);
  const captionCustomers = findCustomersInCaption(post.caption);
  const allCustomers = [];
  const seen = new Set();
  for (const c of [slugCustomer, ...captionCustomers].filter(Boolean)) {
    if (!seen.has(c.name)) { seen.add(c.name); allCustomers.push(c.name); }
  }
  const qes = computeQES(post.metrics);

  return {
    slug: post.slug,
    brand: post.brand,
    published_at: post.published_at,
    asset_type: post.asset_type,
    classified_type,
    classified_tier: TIER_MAP[classified_type] || null,
    customers: allCustomers,
    qes,
    impressions: post.metrics?.impressions || 0,
    reactions: post.metrics?.reactions || 0,
    comments_count: post.metrics?.comments || 0,
    reposts: post.metrics?.reposts || 0,
    ctr: post.metrics?.ctr || 0,
    followers_gained: post.metrics?.followers_gained || 0,
    video_views: post.metrics?.video_views || 0,
    caption_word_count: wordCount(post.caption),
  };
}

// ─── Analysis: Performance by Type ──────────────────────────────────────────

function analyseByType(posts) {
  const groups = {};
  for (const p of posts) {
    const t = p.classified_type;
    if (!groups[t]) groups[t] = [];
    groups[t].push(p);
  }

  const result = {};
  for (const [type, group] of Object.entries(groups)) {
    const scored = group.filter(p => p.qes !== null);
    const qesValues = scored.map(p => p.qes);
    const impValues = group.map(p => p.impressions);

    result[type] = {
      count: group.length,
      tier: TIER_MAP[type] || null,
      avg_qes: avg(qesValues),
      median_qes: median(qesValues),
      avg_impressions: avg(impValues),
      median_impressions: median(impValues),
      avg_reactions: avg(group.map(p => p.reactions)),
      avg_comments: avg(group.map(p => p.comments_count)),
      avg_reposts: avg(group.map(p => p.reposts)),
      total_impressions: impValues.reduce((s, v) => s + v, 0),
      top_3: scored.sort((a, b) => b.qes - a.qes).slice(0, 3).map(p => ({ slug: p.slug, qes: p.qes, impressions: p.impressions })),
      bottom_3: scored.sort((a, b) => a.qes - b.qes).slice(0, 3).map(p => ({ slug: p.slug, qes: p.qes, impressions: p.impressions })),
    };
  }
  return result;
}

// ─── Analysis: Performance by Format ────────────────────────────────────────

function analyseByFormat(posts) {
  const targets = { carousel: 40, 'single-image': 30, video: 30 };
  const groups = {};
  for (const p of posts) {
    const f = p.asset_type || 'unknown';
    if (!groups[f]) groups[f] = [];
    groups[f].push(p);
  }

  const total = posts.length;
  const result = {};
  for (const [fmt, group] of Object.entries(groups)) {
    const scored = group.filter(p => p.qes !== null);
    const share = Math.round((group.length / total) * 1000) / 10;
    const target = targets[fmt] || null;

    result[fmt] = {
      count: group.length,
      share_pct: share,
      target_pct: target,
      delta_pct: target !== null ? Math.round((share - target) * 10) / 10 : null,
      avg_qes: avg(scored.map(p => p.qes)),
      median_qes: median(scored.map(p => p.qes)),
      avg_impressions: avg(group.map(p => p.impressions)),
    };
  }
  return result;
}

// ─── Analysis: Performance by Customer ──────────────────────────────────────

function analyseByCustomer(posts) {
  const customers = {};
  for (const p of posts) {
    for (const name of p.customers) {
      if (!customers[name]) customers[name] = [];
      customers[name].push(p);
    }
  }

  const result = {};
  for (const [name, group] of Object.entries(customers)) {
    const scored = group.filter(p => p.qes !== null);
    const dates = group.map(p => p.published_at).filter(Boolean).sort();
    const lastDate = dates[dates.length - 1] || null;
    const daysSince = lastDate ? Math.floor((new Date(TODAY) - new Date(lastDate)) / 86400000) : null;
    const known = KNOWN_CUSTOMERS.find(c => c.name === name);

    result[name] = {
      full_name: known?.full || name,
      brand: known?.brand || 'unknown',
      post_count: group.length,
      avg_qes: avg(scored.map(p => p.qes)),
      total_impressions: group.reduce((s, p) => s + p.impressions, 0),
      posts: group.map(p => ({ slug: p.slug, date: p.published_at, type: p.classified_type, qes: p.qes })),
      last_featured_date: lastDate,
      days_since_last_feature: daysSince,
      rotation_compliant: daysSince === null ? null : daysSince >= 21,
    };
  }
  return result;
}

// ─── Analysis: Performance by Month ─────────────────────────────────────────

function analyseByMonth(posts) {
  const months = {};
  for (const p of posts) {
    if (!p.published_at) continue;
    const month = p.published_at.substring(0, 7);
    if (!months[month]) months[month] = [];
    months[month].push(p);
  }

  const result = {};
  for (const [month, group] of Object.entries(months)) {
    const scored = group.filter(p => p.qes !== null);
    const typeDist = {};
    const fmtDist = {};
    let tier1 = 0, tier2 = 0, tier3 = 0;

    for (const p of group) {
      typeDist[p.classified_type] = (typeDist[p.classified_type] || 0) + 1;
      fmtDist[p.asset_type || 'unknown'] = (fmtDist[p.asset_type || 'unknown'] || 0) + 1;
      if (p.classified_tier === 1) tier1++;
      else if (p.classified_tier === 2) tier2++;
      else if (p.classified_tier === 3) tier3++;
    }

    result[month] = {
      post_count: group.length,
      avg_qes: avg(scored.map(p => p.qes)),
      median_qes: median(scored.map(p => p.qes)),
      avg_impressions: avg(group.map(p => p.impressions)),
      total_impressions: group.reduce((s, p) => s + p.impressions, 0),
      type_distribution: typeDist,
      format_distribution: fmtDist,
      tier_1_count: tier1,
      tier_2_count: tier2,
      tier_3_count: tier3,
      tier_1_pct: group.length ? Math.round((tier1 / group.length) * 1000) / 10 : 0,
    };
  }
  return result;
}

// ─── Analysis: Trend Analysis ───────────────────────────────────────────────

function analyseTrends(byMonth) {
  const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  if (sorted.length < 2) return { note: 'Not enough months for trend analysis' };

  const qesByMonth = sorted.map(([month, data]) => ({ month, avg_qes: data.avg_qes }));
  const impByMonth = sorted.map(([month, data]) => ({ month, avg_impressions: data.avg_impressions }));

  // Last 3 months vs prior 3 months
  const recent3 = sorted.slice(-3);
  const prior3 = sorted.slice(-6, -3);

  const recentQES = avg(recent3.map(([, d]) => d.avg_qes));
  const priorQES = prior3.length ? avg(prior3.map(([, d]) => d.avg_qes)) : null;
  const recentImp = avg(recent3.map(([, d]) => d.avg_impressions));
  const priorImp = prior3.length ? avg(prior3.map(([, d]) => d.avg_impressions)) : null;

  function trendDirection(recent, prior) {
    if (!prior) return 'insufficient_data';
    const delta = ((recent - prior) / prior) * 100;
    if (delta > 10) return 'improving';
    if (delta < -10) return 'declining';
    return 'flat';
  }

  const bestMonth = qesByMonth.reduce((best, m) => m.avg_qes > (best?.avg_qes || 0) ? m : best, null);
  const worstMonth = qesByMonth.filter(m => m.avg_qes > 0).reduce((worst, m) => m.avg_qes < (worst?.avg_qes || Infinity) ? m : worst, null);

  // Golden era benchmark (Mar-Jul 2025)
  const goldenMonths = sorted.filter(([m]) => m >= '2025-03' && m <= '2025-07');
  const goldenQES = goldenMonths.length ? avg(goldenMonths.map(([, d]) => d.avg_qes)) : null;
  const goldenImp = goldenMonths.length ? avg(goldenMonths.map(([, d]) => d.avg_impressions)) : null;

  return {
    qes_trend_3m: {
      recent_avg: recentQES,
      prior_avg: priorQES,
      delta_pct: priorQES ? Math.round(((recentQES - priorQES) / priorQES) * 1000) / 10 : null,
      direction: trendDirection(recentQES, priorQES),
    },
    impressions_trend_3m: {
      recent_avg: recentImp,
      prior_avg: priorImp,
      delta_pct: priorImp ? Math.round(((recentImp - priorImp) / priorImp) * 1000) / 10 : null,
      direction: trendDirection(recentImp, priorImp),
    },
    qes_by_month: qesByMonth,
    impressions_by_month: impByMonth,
    best_month: bestMonth,
    worst_month: worstMonth,
    golden_era_benchmark: goldenQES ? { period: '2025-03 to 2025-07', avg_qes: goldenQES, avg_impressions: goldenImp } : null,
  };
}

// ─── Analysis: Formula Compliance ───────────────────────────────────────────

function analyseCompliance(enrichedPosts, byMonth) {
  const sorted = [...enrichedPosts].sort((a, b) => (a.published_at || '').localeCompare(b.published_at || ''));

  // Back-to-back type violations
  let backToBack = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].classified_type === sorted[i - 1].classified_type && sorted[i].classified_type !== 'unknown') {
      backToBack++;
    }
  }

  // Customer rotation violations (same customer < 21 days apart)
  const customerDates = {};
  let rotationViolations = 0;
  for (const p of sorted) {
    for (const c of p.customers) {
      if (customerDates[c]) {
        const daysBetween = Math.floor((new Date(p.published_at) - new Date(customerDates[c])) / 86400000);
        if (daysBetween < 21 && daysBetween > 0) rotationViolations++;
      }
      customerDates[c] = p.published_at;
    }
  }

  // Tier 1 deficit: months with fewer than 6 Tier 1 posts (allowing for smaller months)
  let tier1Deficits = 0;
  const monthMinMisses = {};
  for (const [month, data] of Object.entries(byMonth)) {
    if (data.post_count < 4) continue; // skip very sparse months
    if (data.tier_1_count < Math.max(2, Math.floor(data.post_count * 0.3))) tier1Deficits++;
    // Check minimums: at least 1 customer transformation, 1 meme, 1 stance per month
    const mins = { customer_transformation: 1, meme_relatable: 1, industry_stance: 1 };
    for (const [type, min] of Object.entries(mins)) {
      if ((data.type_distribution[type] || 0) < min) {
        if (!monthMinMisses[type]) monthMinMisses[type] = 0;
        monthMinMisses[type]++;
      }
    }
  }

  const totalMonths = Object.keys(byMonth).length;
  // Weighted scoring: back-to-back are minor (1pt), rotation moderate (3pt), tier1 deficits serious (5pt)
  const weightedViolations = backToBack * 1 + rotationViolations * 3 + tier1Deficits * 5;
  const maxWeighted = totalMonths * 15; // reasonable ceiling
  const score = Math.max(0, Math.min(100, Math.round(100 - (weightedViolations / Math.max(maxWeighted, 1)) * 100)));

  return {
    overall_score: score,
    months_analyzed: totalMonths,
    back_to_back_type_violations: backToBack,
    customer_rotation_violations: rotationViolations,
    tier_1_deficit_months: tier1Deficits,
    monthly_minimum_misses: monthMinMisses,
  };
}

// ─── Analysis: Customer Rotation Status ─────────────────────────────────────

function customerRotationStatus(byCustomer) {
  const overdue = [];
  const available = [];
  const recentlyFeatured = [];
  const neverFeatured = [];

  const featuredNames = new Set(Object.keys(byCustomer));
  for (const c of KNOWN_CUSTOMERS) {
    if (!featuredNames.has(c.name)) {
      neverFeatured.push(c.full);
    }
  }

  for (const [name, data] of Object.entries(byCustomer)) {
    const entry = { name: data.full_name, days_since: data.days_since_last_feature, last_date: data.last_featured_date };
    if (data.days_since_last_feature === null) continue;
    if (data.days_since_last_feature > 90) overdue.push(entry);
    else if (data.days_since_last_feature >= 21) available.push(entry);
    else recentlyFeatured.push(entry);
  }

  overdue.sort((a, b) => b.days_since - a.days_since);
  available.sort((a, b) => b.days_since - a.days_since);
  recentlyFeatured.sort((a, b) => a.days_since - b.days_since);

  return { overdue, available, recently_featured: recentlyFeatured, never_featured: neverFeatured };
}

// ─── Analysis: Top and Bottom Performers ────────────────────────────────────

function topAndBottom(posts) {
  const scored = posts.filter(p => p.qes !== null);
  const pick = (arr, n) => arr.slice(0, n).map(p => ({ slug: p.slug, qes: p.qes, type: p.classified_type, format: p.asset_type, impressions: p.impressions, date: p.published_at }));

  return {
    top_10_by_qes: pick([...scored].sort((a, b) => b.qes - a.qes), 10),
    bottom_10_by_qes: pick([...scored].sort((a, b) => a.qes - b.qes), 10),
    top_10_by_impressions: pick([...posts].sort((a, b) => b.impressions - a.impressions), 10),
    top_10_by_comments: pick([...posts].sort((a, b) => b.comments_count - a.comments_count), 10),
    top_10_by_reposts: pick([...posts].sort((a, b) => b.reposts - a.reposts), 10),
  };
}

// ─── Recommendations Engine ─────────────────────────────────────────────────

function generateRecommendations(byType, byFormat, byCustomer, trends, compliance, enrichedPosts) {
  const recs = [];
  const scored = enrichedPosts.filter(p => p.qes !== null);
  const overallMedianQES = median(scored.map(p => p.qes));

  // Recent 3 months of posts
  const sortedDates = enrichedPosts.map(p => p.published_at).filter(Boolean).sort();
  const cutoff3m = new Date(sortedDates[sortedDates.length - 1] || TODAY);
  cutoff3m.setMonth(cutoff3m.getMonth() - 3);
  const cutoff3mStr = cutoff3m.toISOString().split('T')[0];
  const recent = enrichedPosts.filter(p => p.published_at >= cutoff3mStr);
  const recentTotal = recent.length || 1;

  // 1. High-QES types that are underused
  for (const [type, data] of Object.entries(byType)) {
    if (type === 'unknown' || !data.avg_qes) continue;
    const recentCount = recent.filter(p => p.classified_type === type).length;
    const recentPct = (recentCount / recentTotal) * 100;
    if (data.avg_qes > overallMedianQES * 1.3 && recentPct < 15) {
      recs.push({
        priority: 'high',
        category: 'content_type',
        action: `Do more: ${type.replace(/_/g, ' ')} (avg QES ${data.avg_qes} vs median ${overallMedianQES}, but only ${Math.round(recentPct)}% of recent content)`,
        evidence: `${type} averages ${Math.round(((data.avg_qes - overallMedianQES) / overallMedianQES) * 100)}% above the overall median QES`,
      });
    }
  }

  // 2. Low-QES types that are overused
  for (const [type, data] of Object.entries(byType)) {
    if (type === 'unknown' || !data.avg_qes) continue;
    const recentCount = recent.filter(p => p.classified_type === type).length;
    const recentPct = (recentCount / recentTotal) * 100;
    if (data.avg_qes < overallMedianQES * 0.7 && recentPct > 15) {
      recs.push({
        priority: 'high',
        category: 'content_type',
        action: `Do less: ${type.replace(/_/g, ' ')} (avg QES ${data.avg_qes}, ${Math.round(recentPct)}% of content but underperforming)`,
        evidence: `${type} averages ${Math.round(((overallMedianQES - data.avg_qes) / overallMedianQES) * 100)}% below the overall median QES`,
      });
    }
  }

  // 3. Format imbalance
  for (const [fmt, data] of Object.entries(byFormat)) {
    if (data.target_pct && Math.abs(data.delta_pct) > 10) {
      const dir = data.delta_pct > 0 ? 'Decrease' : 'Increase';
      recs.push({
        priority: 'medium',
        category: 'format_balance',
        action: `${dir} ${fmt} posts (currently ${data.share_pct}%, target ${data.target_pct}%)`,
        evidence: `${Math.abs(data.delta_pct)} percentage points off target`,
      });
    }
  }

  // 4. Customer staleness
  for (const [name, data] of Object.entries(byCustomer)) {
    if (data.days_since_last_feature > 90) {
      recs.push({
        priority: data.days_since_last_feature > 180 ? 'high' : 'medium',
        category: 'customer_rotation',
        action: `Feature ${data.full_name} soon (${data.days_since_last_feature} days since last post on ${data.last_featured_date})`,
        evidence: `${data.post_count} total posts, avg QES ${data.avg_qes}`,
      });
    }
  }

  // 5. Trend decline
  if (trends.qes_trend_3m?.direction === 'declining' && Math.abs(trends.qes_trend_3m.delta_pct) > 10) {
    recs.push({
      priority: 'high',
      category: 'trend',
      action: `Reverse engagement decline: QES dropped ${Math.abs(trends.qes_trend_3m.delta_pct)}% over last 3 months`,
      evidence: `Recent avg QES ${trends.qes_trend_3m.recent_avg} vs prior ${trends.qes_trend_3m.prior_avg}`,
    });
  }

  // 6. Compliance issues
  if (compliance.overall_score < 70) {
    recs.push({
      priority: 'high',
      category: 'formula_compliance',
      action: `Improve formula compliance (score: ${compliance.overall_score}/100)`,
      evidence: `${compliance.back_to_back_type_violations} back-to-back violations, ${compliance.customer_rotation_violations} rotation violations, ${compliance.tier_1_deficit_months} months with Tier 1 deficit`,
    });
  }

  // 7. Content gaps — types missing from last 2 months
  const cutoff2m = new Date(sortedDates[sortedDates.length - 1] || TODAY);
  cutoff2m.setMonth(cutoff2m.getMonth() - 2);
  const cutoff2mStr = cutoff2m.toISOString().split('T')[0];
  const recent2m = enrichedPosts.filter(p => p.published_at >= cutoff2mStr);
  const recent2mTypes = new Set(recent2m.map(p => p.classified_type));
  for (const type of Object.keys(TIER_MAP)) {
    if (!recent2mTypes.has(type)) {
      recs.push({
        priority: 'medium',
        category: 'content_gap',
        action: `No ${type.replace(/_/g, ' ')} posts in the last 2 months. Add at least 1 next month.`,
        evidence: `Gap since ${cutoff2mStr}`,
      });
    }
  }

  // Sort: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log('Building content intelligence layer...\n');

// Load data
const titanPosts = JSON.parse(fs.readFileSync(path.join(EXPORTS_DIR, 'titan-linkedin.json'), 'utf8'));
const tvPosts = JSON.parse(fs.readFileSync(path.join(EXPORTS_DIR, 'titanverse-linkedin.json'), 'utf8'));
const allPosts = [...titanPosts, ...tvPosts];
console.log(`Loaded ${titanPosts.length} Titan + ${tvPosts.length} Titanverse = ${allPosts.length} posts`);

// Enrich all posts
const enriched = allPosts.map(enrichPost);
const withMetrics = enriched.filter(p => p.impressions >= MIN_IMPRESSIONS);
const unknowns = enriched.filter(p => p.classified_type === 'unknown');
console.log(`Classified: ${enriched.length - unknowns.length} posts, ${unknowns.length} unknown`);
if (unknowns.length > 0) {
  console.log(`  Unknown slugs: ${unknowns.map(p => p.slug).join(', ')}`);
}

// Run analyses
console.log('\nRunning analyses...');
const byType = analyseByType(enriched);
const byFormat = analyseByFormat(enriched);
const byCustomer = analyseByCustomer(enriched);
const byMonth = analyseByMonth(enriched);
const trends = analyseTrends(byMonth);
const compliance = analyseCompliance(enriched, byMonth);
const rotation = customerRotationStatus(byCustomer);
const performers = topAndBottom(enriched);
const recommendations = generateRecommendations(byType, byFormat, byCustomer, trends, compliance, enriched);

// Build summary
const allQES = withMetrics.map(p => p.qes).filter(Boolean);
const bestType = Object.entries(byType).filter(([k]) => k !== 'unknown').sort((a, b) => (b[1].avg_qes || 0) - (a[1].avg_qes || 0))[0];
const worstType = Object.entries(byType).filter(([k]) => k !== 'unknown' && k[1]?.count > 2).sort((a, b) => (a[1].avg_qes || 0) - (b[1].avg_qes || 0))[0];

const output = {
  metadata: {
    generated_at: new Date().toISOString(),
    script: 'scripts/build-content-intelligence.js',
    data_sources: ['exports/titan-linkedin.json', 'exports/titanverse-linkedin.json'],
    total_posts_analyzed: enriched.length,
    posts_with_metrics: withMetrics.length,
    posts_scored: allQES.length,
    date_range: {
      start: enriched.map(p => p.published_at).filter(Boolean).sort()[0],
      end: enriched.map(p => p.published_at).filter(Boolean).sort().pop(),
    },
    brands: ['Titan PMR', 'Titanverse'],
    classification_stats: {
      classified: enriched.length - unknowns.length,
      unknown: unknowns.length,
      unknown_slugs: unknowns.map(p => p.slug),
    },
  },
  summary: {
    overall_avg_qes: avg(allQES),
    overall_median_qes: median(allQES),
    overall_avg_impressions: avg(withMetrics.map(p => p.impressions)),
    total_impressions: enriched.reduce((s, p) => s + p.impressions, 0),
    total_engagements: enriched.reduce((s, p) => s + p.reactions + p.comments_count + p.reposts, 0),
    best_performing_type: bestType ? bestType[0] : null,
    worst_performing_type: worstType ? worstType[0] : null,
    current_trend: trends.qes_trend_3m?.direction || 'unknown',
    compliance_score: compliance.overall_score,
  },
  performance_by_type: byType,
  performance_by_format: byFormat,
  performance_by_customer: byCustomer,
  performance_by_month: byMonth,
  trend_analysis: trends,
  formula_compliance: compliance,
  customer_rotation_status: rotation,
  top_and_bottom_performers: performers,
  recommendations,
  enriched_posts: enriched,
};

// Write output
const outPath = path.join(EXPORTS_DIR, 'content-intelligence.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);

console.log(`\n✓ Wrote ${outPath} (${sizeKB} KB)`);
console.log(`\n── Summary ──`);
console.log(`Posts analyzed: ${enriched.length} (${allQES.length} scored)`);
console.log(`Overall QES: avg ${output.summary.overall_avg_qes}, median ${output.summary.overall_median_qes}`);
console.log(`Trend: ${output.summary.current_trend}`);
console.log(`Compliance: ${compliance.overall_score}/100`);
console.log(`Best type: ${output.summary.best_performing_type}`);
console.log(`Recommendations: ${recommendations.length}`);
console.log(`\n── Recommendations ──`);
for (const r of recommendations.slice(0, 10)) {
  console.log(`  [${r.priority.toUpperCase()}] ${r.action}`);
}
