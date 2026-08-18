/**
 * Canonical engagement-rate definitions for TITAN social metrics.
 *
 * THE ONE RULE
 * ------------
 *   social_er_pct = (reactions + comments + reposts) / impressions x 100
 *
 * "Human interactions" means a person chose to react, comment, or share.
 * Clicks are NOT interactions — they are consumption. They scale with link
 * previews, carousels and documents, and on LinkedIn they routinely make up
 * 80-95% of the vendor's headline "engagement" number. A document post with
 * 430 clicks and 36 reactions reads as 25.9% engagement to Metricool and
 * 2.3% to us. Ours is the one that says something about the content.
 *
 * Three named fields. Each says what it is:
 *
 *   social_er_pct    — ours. Same formula, same denominator, every platform.
 *                      This is the number you chart, rank and report.
 *   platform_er_pct  — the vendor's own headline rate, verbatim. Different
 *                      numerator AND different denominator per platform (see
 *                      PLATFORM_ER_DEFINITION). Only ever used to reconcile
 *                      against a vendor dashboard. Never compare across
 *                      platforms with it.
 *   raw_er_pct       — whatever the deprecated `engagement_rate` field held
 *                      before this migration. Audit trail only.
 *
 * DENOMINATOR CHOICE
 * ------------------
 * social_er_pct always divides by the delivery count — impressions on
 * LinkedIn/Facebook, views on Instagram/TikTok. That is the only denominator
 * available on every platform we publish to: Metricool exposes no reach for
 * LinkedIn or TikTok. Reach would be the purer denominator but it cannot be
 * had consistently, and a metric that only exists on half the platforms is
 * not a cross-platform metric.
 *
 * The vendors mostly divide by reach instead, which is why platform_er_pct
 * runs higher than social_er_pct even before clicks are counted.
 *
 * See docs/engagement-rate-definition.md before changing anything here.
 * SPEC_VERSION bumps whenever a formula changes, so stale rows are detectable.
 */

const SPEC_VERSION = 1;

const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

/** Tolerant numeric coercion: handles "1,234", "6.92%", null, undefined, "". */
function num(v) {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/,/g, '').replace('%', ''));
  return Number.isFinite(n) ? n : 0;
}

/** Component keys every platform is normalised into before computing. */
const COMPONENT_KEYS = [
  'impressions', // delivery count — impressions (LI/FB) or views (IG/TT)
  'reach',       // unique people, where the source provides it
  'reactions',   // likes / reactions of any flavour
  'comments',
  'reposts',     // shares / reposts
  'saves',       // IG saves; not part of social_er_pct — see note below
  'clicks',
];

/**
 * Per-platform spec.
 *
 * social      — numerator keys for social_er_pct. IDENTICAL across platforms
 *               by design: reactions + comments + reposts. Do not add
 *               platform-specific extras here or the metric stops being
 *               comparable, which is the entire point of it.
 * denomName   — what the delivery count is called on this platform, for display.
 * platformEr  — how the vendor computes its own headline rate. Used as a
 *               fallback when the source didn't hand us its number, and
 *               recorded as a string so nobody has to guess later.
 *
 * To add a platform: add an entry here plus a mapper in the ingest script.
 * Nothing else in the codebase may hardcode an engagement formula.
 */
const SPECS = {
  linkedin: {
    social: ['reactions', 'comments', 'reposts'],
    denomName: 'impressions',
    platformEr: {
      numerator: ['reactions', 'comments', 'reposts', 'clicks'],
      denominator: 'impressions',
      definition: '(reactions + comments + shares + clicks) / impressions — Metricool/LinkedIn',
    },
  },
  instagram: {
    // Saves are captured in components.saves and deliberately EXCLUDED from
    // social_er_pct. They are a real signal, but no other platform has an
    // equivalent, so counting them would make Instagram structurally
    // un-comparable. Report saves separately when they matter.
    social: ['reactions', 'comments', 'reposts'],
    denomName: 'views',
    platformEr: {
      numerator: ['reactions', 'comments', 'reposts', 'saves'],
      denominator: 'reach',
      definition: 'interactions (likes + comments + shares + saves) / reach — Metricool/Instagram',
    },
  },
  facebook: {
    social: ['reactions', 'comments', 'reposts'],
    denomName: 'impressions',
    platformEr: {
      numerator: ['reactions', 'comments', 'reposts', 'clicks'],
      denominator: 'reach',
      definition: '(reactions + comments + shares + clicks) / reach — Metricool/Facebook',
    },
  },
  tiktok: {
    social: ['reactions', 'comments', 'reposts'],
    denomName: 'views',
    platformEr: {
      numerator: ['reactions', 'comments', 'reposts'],
      denominator: 'impressions',
      definition: '(likes + comments + shares) / views — Metricool/TikTok',
    },
  },
};

/** Normalise a platform string ("LinkedIn", "LI-PAGE@titanpmr") to a spec key. */
function platformKey(platform) {
  const p = String(platform || '').toLowerCase();
  if (p.includes('linkedin') || p.startsWith('li')) return 'linkedin';
  if (p.includes('instagram') || p.startsWith('ig')) return 'instagram';
  if (p.includes('facebook') || p.startsWith('fb')) return 'facebook';
  if (p.includes('tiktok') || p.startsWith('tt')) return 'tiktok';
  return null;
}

/**
 * Compute the canonical engagement block.
 *
 * @param {string} platform    Anything platformKey() understands.
 * @param {object} components  Raw counts keyed by COMPONENT_KEYS. Missing keys
 *   become 0 — list them in opts.unavailable to distinguish "really zero" from
 *   "the source never told us", which otherwise silently deflates the rate.
 * @param {object} opts
 *   @param {number|null} opts.platformErPct  Vendor's headline ER, verbatim.
 *                                            Computed from spec if omitted.
 *   @param {number|null} opts.rawErPct       Previous `engagement_rate` value.
 *   @param {string}      opts.rawErSource    Where rawErPct came from.
 *   @param {string[]}    opts.unavailable    Component keys the source omitted.
 * @returns {object|null} null if the platform is unrecognised.
 */
function computeEngagement(platform, components = {}, opts = {}) {
  const key = platformKey(platform);
  if (!key) return null;
  const spec = SPECS[key];

  const c = {};
  for (const k of COMPONENT_KEYS) c[k] = Math.round(num(components[k]));

  const unavailable = opts.unavailable || [];
  const flags = [];
  for (const k of spec.social) {
    if (unavailable.includes(k)) flags.push(`${k}_unavailable_in_source`);
  }

  const denom = c.impressions;
  const socialSum = spec.social.reduce((a, k) => a + c[k], 0);

  // Vendor number: take theirs if given, else reproduce their formula.
  let platformEr = null;
  if (opts.platformErPct !== undefined && opts.platformErPct !== null) {
    platformEr = round2(num(opts.platformErPct));
  } else {
    const pDenom = c[spec.platformEr.denominator];
    if (pDenom > 0) {
      const pNum = spec.platformEr.numerator.reduce((a, k) => a + c[k], 0);
      platformEr = round2((pNum / pDenom) * 100);
    } else {
      flags.push('platform_er_denominator_unavailable');
    }
  }

  const base = {
    spec_version: SPEC_VERSION,
    platform: key,
    denominator: spec.denomName,
    denominator_value: denom,
    social_interactions: socialSum,
    social_er_pct: null,
    social_er_formula: `(reactions + comments + reposts) / ${spec.denomName} x 100`,
    platform_er_pct: platformEr,
    platform_er_definition: spec.platformEr.definition,
    raw_er_pct:
      opts.rawErPct === undefined || opts.rawErPct === null ? null : round2(num(opts.rawErPct)),
    raw_er_source: opts.rawErSource || null,
    components: c,
    flags,
  };

  // No delivery count means no rate. Null, never 0 — a zero would be read as
  // "this post got no engagement" when the truth is "we don't know yet".
  if (!denom || denom <= 0) {
    base.flags = [...flags, 'no_denominator'];
    return base;
  }

  base.social_er_pct = round2((socialSum / denom) * 100);
  return base;
}

module.exports = {
  SPEC_VERSION,
  SPECS,
  COMPONENT_KEYS,
  computeEngagement,
  platformKey,
  num,
  round2,
};
