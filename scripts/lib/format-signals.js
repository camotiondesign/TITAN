/**
 * Format-aware success signals for TITAN social metrics.
 *
 * WHY THERE IS NO ENGAGEMENT RATE HERE
 * ------------------------------------
 * A single engagement rate divides every post by the same denominator and
 * therefore asks every post the same question. But formats don't earn the same
 * currency:
 *
 *   carousels earn clicks       videos earn watch time
 *   testimonials earn reactions  advocacy earns reposts
 *
 * Normalising all of that through one fraction doesn't compare posts — it
 * ranks formats. The old engagement_rate field reliably put document posts on
 * top because documents generate clicks structurally, which says nothing about
 * whether anyone cared.
 *
 * THE MODEL
 * ---------
 * 1. Tag each post with a FORMAT.
 * 2. Each format has its own PRIMARY SIGNAL — one or more components that mean
 *    "this worked" for that kind of post specifically.
 * 3. Rank each component as a PERCENTILE against posts of the same format on
 *    the same platform, in a rolling window. Percentiles are unitless, so raw
 *    counts and rates can be combined without a shared denominator — this is
 *    what lets "views + shares" and "clicks + saves" both work as signals.
 * 4. Reduce to a composite percentile, then a TIER: worked / middle /
 *    underperformed.
 *
 * "Worked" means top quartile OF ITS OWN KIND. A text post is never measured
 * against a carousel.
 *
 * See docs/format-signals-definition.md before changing anything here.
 */

const SPEC_VERSION = 2;

const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

function num(v) {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/,/g, '').replace('%', ''));
  return Number.isFinite(n) ? n : 0;
}

// ── Format taxonomy ─────────────────────────────────────────────────────

const FORMATS = [
  'single-image',
  'multi-image',
  'carousel-document',
  'video',
  'short-form-video',
  'text',
];

/**
 * Platform-native type strings → canonical format.
 * The platform's own type is authoritative when we have it; asset_type from
 * meta.json is the fallback for posts no CSV drop covers.
 */
const TYPE_MAP = {
  // LinkedIn (Metricool `Type`)
  IMAGE: 'single-image',
  MULTIIMAGE: 'multi-image',
  DOCUMENT: 'carousel-document',
  VIDEO: 'video',
  TEXT: 'text',
  // Instagram (Metricool `type`)
  FEED_IMAGE: 'single-image',
  FEED_CAROUSEL_ALBUM: 'multi-image',
  // Facebook (Metricool `Type`)
  photo: 'single-image',
  album: 'multi-image',
  video: 'video',
  link: 'text',
  // TikTok — photo posts are swipeable slideshows, not single images
  PHOTO: 'multi-image',
};

/** repo asset_type → canonical format */
const ASSET_TYPE_MAP = {
  'single-image': 'single-image',
  'multi-image': 'multi-image',
  'image-gallery': 'multi-image',
  carousel: 'carousel-document',
  document: 'carousel-document',
  video: 'video',
  short_video: 'short-form-video',
  'short-video': 'short-form-video',
  text: 'text',
};

/**
 * Resolve a post's format.
 *
 * Short-form is a PLATFORM SURFACE, not a file property: the same 40-second
 * cut is a Reel on Instagram and a feed video on LinkedIn, and the two are
 * consumed completely differently. So any video on TikTok / Reels / Shorts is
 * short-form-video regardless of what the type string says.
 *
 * @param {object} p
 *   @param {string} p.platform      'linkedin' | 'instagram' | 'facebook' | 'tiktok'
 *   @param {string} p.platformType  vendor type string, if any
 *   @param {string} p.assetType     repo asset_type, if any
 *   @param {boolean} p.isReel       true for reels/shorts surfaces
 * @returns {{format: string, source: string}}
 */
function resolveFormat({ platform, platformType, assetType, isReel } = {}) {
  const plat = String(platform || '').toLowerCase();

  let fmt = null;
  let source = null;

  if (platformType && TYPE_MAP[platformType]) {
    fmt = TYPE_MAP[platformType];
    source = 'platform_type';
  } else if (assetType && ASSET_TYPE_MAP[assetType]) {
    fmt = ASSET_TYPE_MAP[assetType];
    source = 'asset_type';
  }

  // The surface wins. A reel is consumed as short-form whatever the repo's
  // asset_type happens to say — and asset_type is frequently wrong here,
  // labelling reels 'single-image' from an older tagging pass.
  // The one real exception is a TikTok photo slideshow, which is genuinely
  // a swipeable gallery rather than a video.
  const shortSurface = plat === 'tiktok' || isReel;
  if (shortSurface) {
    if (platformType === 'PHOTO') return { format: 'multi-image', source: 'platform_type' };
    return { format: 'short-form-video', source: source || 'platform_surface' };
  }

  if (!fmt) return { format: null, source: null };
  return { format: fmt, source };
}

// ── Content role (orthogonal to format) ─────────────────────────────────

/**
 * Some posts are doing a job the format alone doesn't capture. An advocacy
 * post succeeds when someone puts their own name behind it — that's a repost,
 * not a reaction. A sector thesis succeeds when people keep it and pass it on.
 *
 * Roles ADD components to the format's signal rather than replacing them.
 */
const ROLES = ['standard', 'advocacy', 'sector-thesis'];

/** Map the repo's existing post-type classifier onto a role. */
const POST_TYPE_ROLE = {
  customer_transformation: 'advocacy',
  video_testimonial: 'advocacy',
  customer_quote_card: 'advocacy',
  industry_stance: 'sector-thesis',
  thought_leadership: 'sector-thesis',
  reactive_news: 'sector-thesis',
};

function resolveRole(postType, override) {
  if (override && ROLES.includes(override)) return { role: override, source: 'manual_override' };
  const r = POST_TYPE_ROLE[postType];
  if (r) return { role: r, source: `post_type:${postType}` };
  return { role: 'standard', source: 'default' };
}

// ── Signal definitions ──────────────────────────────────────────────────

const rate = (n, d) => (d > 0 ? (n / d) * 100 : null);

/**
 * Each component:
 *   key      stable id
 *   label    human phrasing, embedded in output
 *   weight   relative importance within the format's signal
 *   kind     'rate' (per-impression %) or 'count' (raw volume)
 *   value    (components) => number | null   — null means not measurable here
 *
 * Weights are renormalised over whichever components are actually measurable
 * for a given post, so a platform that can't report saves doesn't silently
 * push a carousel's score down.
 */
const SIGNALS = {
  // Nothing to click, nothing to watch. Did the image make someone react?
  'single-image': [
    { key: 'reaction_rate', label: 'reactions per impression', weight: 1, kind: 'rate',
      value: (c) => rate(c.reactions, c.impressions) },
  ],

  // A gallery is browsed and passed on; reactions alone undersell it.
  'multi-image': [
    { key: 'reaction_rate', label: 'reactions per impression', weight: 0.6, kind: 'rate',
      value: (c) => rate(c.reactions, c.impressions) },
    { key: 'repost_rate', label: 'reposts per impression', weight: 0.4, kind: 'rate',
      value: (c) => rate(c.reposts, c.impressions) },
  ],

  // A carousel succeeds when someone opens it and keeps it. Clicks ARE the
  // signal here — the same clicks that made them meaningless as a global rate.
  // Swipe-depth is not exposed by any current export; saves stand in where the
  // platform reports them (Instagram only).
  'carousel-document': [
    { key: 'click_rate', label: 'clicks per impression', weight: 0.7, kind: 'rate',
      value: (c) => (c.clicks_available ? rate(c.clicks, c.impressions) : null) },
    { key: 'save_rate', label: 'saves per impression', weight: 0.3, kind: 'rate',
      value: (c) => (c.saves_available ? rate(c.saves, c.impressions) : null) },
  ],

  // Retention first, then whether it provoked discussion.
  video: [
    { key: 'retention', label: 'completion rate (or mean watch seconds where duration is unknown)',
      weight: 0.6, kind: 'rate',
      value: (c) => {
        if (c.duration_seconds > 0 && c.avg_watch_time_seconds > 0) {
          return Math.min(100, (c.avg_watch_time_seconds / c.duration_seconds) * 100);
        }
        return c.avg_watch_time_seconds > 0 ? c.avg_watch_time_seconds : null;
      } },
    { key: 'comment_rate', label: 'comments per impression', weight: 0.4, kind: 'rate',
      value: (c) => rate(c.comments, c.impressions) },
  ],

  // Short-form lives or dies on distribution, and shares are what buy it.
  // Views are deliberately a RAW COUNT: on TikTok/Reels the algorithm decides
  // reach, so "how far did it travel" is the outcome, not the denominator.
  'short-form-video': [
    { key: 'views', label: 'total views (algorithmic reach)', weight: 0.5, kind: 'count',
      value: (c) => (c.impressions > 0 ? c.impressions : null) },
    { key: 'share_rate', label: 'shares per view', weight: 0.5, kind: 'rate',
      value: (c) => rate(c.reposts, c.impressions) },
  ],

  // No asset to carry it — the words have to earn the reply.
  text: [
    { key: 'reaction_rate', label: 'reactions per impression', weight: 0.5, kind: 'rate',
      value: (c) => rate(c.reactions, c.impressions) },
    { key: 'comment_rate', label: 'comments per impression', weight: 0.5, kind: 'rate',
      value: (c) => rate(c.comments, c.impressions) },
  ],
};

/** Role overlays: extra components appended before weight renormalisation. */
const ROLE_SIGNALS = {
  advocacy: [
    { key: 'repost_rate', label: 'reposts per impression (advocacy: someone put their name to it)',
      weight: 0.5, kind: 'rate', value: (c) => rate(c.reposts, c.impressions) },
  ],
  'sector-thesis': [
    { key: 'repost_rate', label: 'reposts per impression (thesis: passed on)',
      weight: 0.35, kind: 'rate', value: (c) => rate(c.reposts, c.impressions) },
    { key: 'save_rate', label: 'saves per impression (thesis: kept for later)',
      weight: 0.35, kind: 'rate', value: (c) => (c.saves_available ? rate(c.saves, c.impressions) : null) },
  ],
  standard: [],
};

/**
 * Build the measurable signal set for one post.
 *
 * Returns components with raw values plus renormalised weights. Percentiles
 * and tiers are NOT computed here — they need the whole cohort, so they come
 * from compute-format-percentiles.js in a second pass.
 */
function buildSignals(format, role, components) {
  const base = SIGNALS[format];
  if (!base) return null;

  // Role components merge into the format's own; a duplicate key takes the
  // heavier of the two weights rather than appearing twice.
  const merged = new Map();
  for (const s of base) merged.set(s.key, { ...s });
  for (const s of ROLE_SIGNALS[role] || []) {
    const prev = merged.get(s.key);
    if (prev) merged.set(s.key, { ...s, weight: Math.max(prev.weight, s.weight) });
    else merged.set(s.key, { ...s });
  }

  const measured = [];
  const dropped = [];
  for (const s of merged.values()) {
    const v = s.value(components);
    if (v === null || !Number.isFinite(v)) dropped.push(s.key);
    else measured.push({ key: s.key, label: s.label, kind: s.kind, weight: s.weight, value: round2(v) });
  }

  const totalWeight = measured.reduce((a, s) => a + s.weight, 0);
  for (const s of measured) {
    s.normalised_weight = totalWeight > 0 ? Math.round((s.weight / totalWeight) * 1000) / 1000 : 0;
  }

  return { measured, dropped };
}

// ── Percentile / tier ───────────────────────────────────────────────────

const MIN_COHORT = 8;          // below this a percentile is noise, not a rank
const WINDOWS_DAYS = [90, 180, 365, null]; // null = all time; first adequate wins
const TIER_TOP = 75;
const TIER_BOTTOM = 25;

/**
 * A post needs enough delivery for its rate to mean anything. On 27
 * impressions, a single reaction is a 3.7% reaction rate — good enough to beat
 * most of its cohort on arithmetic alone, while telling you nothing. Below
 * this floor the percentile is still recorded, but the tier is withheld.
 */
const MIN_IMPRESSIONS = 100;

/**
 * Mid-rank percentile of `value` within `values` (ties share the midpoint).
 * 100 = best in cohort. Returns null for an empty cohort.
 */
function percentileOf(value, values) {
  const n = values.length;
  if (!n) return null;
  let below = 0, equal = 0;
  for (const v of values) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  return round2(((below + 0.5 * equal) / n) * 100);
}

/** Composite percentile → tier label. */
function tierFor(percentile) {
  if (percentile === null || percentile === undefined) return 'insufficient-data';
  if (percentile >= TIER_TOP) return 'worked';
  if (percentile <= TIER_BOTTOM) return 'underperformed';
  return 'middle';
}

module.exports = {
  SPEC_VERSION,
  FORMATS,
  ROLES,
  SIGNALS,
  ROLE_SIGNALS,
  TYPE_MAP,
  ASSET_TYPE_MAP,
  POST_TYPE_ROLE,
  MIN_COHORT,
  MIN_IMPRESSIONS,
  WINDOWS_DAYS,
  TIER_TOP,
  TIER_BOTTOM,
  resolveFormat,
  resolveRole,
  buildSignals,
  percentileOf,
  tierFor,
  num,
  round2,
};
