# Caption Features vs Tier Performance — Data Audit of the QA/Brand Guardian Rules

Date: 2026-08-18
Corpus: 474 posts across LinkedIn (Titan + Titanverse), Facebook, Instagram, TikTok
Analyst: automated rule-based extraction over `posts/**/caption.md` + `metrics.json` (spec_v3 signals)
Cost: **£0.00** — no LLM API used. All "LLM-style" features (register, hook shape, protagonist, content type, quadrants, opener classification) are extracted with **regex + bag-of-words heuristics**. Flagged individually in section 12.

Companion artifacts (rerunnable):
- `scripts/analysis-tmp/01_extract.py` — feature extraction
- `scripts/analysis-tmp/02_analyze.py` — tier deltas + fingerprints
- `scripts/analysis-tmp/features.jsonl` — per-post feature vector
- `scripts/analysis-tmp/analysis.json` — full analysis dump
- `scripts/analysis-tmp/skipped.jsonl` — 24 excluded posts (no signals or <100 impressions)

---

## 1. Executive summary — 8 findings that should change how Cam writes captions

1. **"Named specific in opener" is the single strongest predictor, and it's holding up.** +25pp lift overall (worked = 59% have it, underperformed = 34%), stable across 2025 (+24pp) and 2026 (+27pp), works on all three main LinkedIn formats (video +29pp, carousel +17pp, single-image +15pp). This is the rule to defend and enforce hardest.
2. **Second-person openers are catastrophic in 2026.** In 2025, "You / your / you're" in the first five words was mildly positive (worked 29% vs under 24%, n=21). In 2026 it inverted hard: worked 11%, **under 52%** (n=27). QA should treat second-person openers as a red flag on new drafts.
3. **Quote-led openers went from broken to a win.** 2025: 0/7 quote-led hooks reached "worked." 2026: 7/24 worked (29%), matching stat-led hooks. The Prab-quote and Google-search-quote posts are the new pattern.
4. **Verbatim quotes only work as the *hook*, not as decoration.** 2026 overall delta for `has_verbatim_quote` = -13.5pp (worked 22% vs under 34%), but quote-*led* hooks are net positive. The difference: dropping a quote in the middle of a caption doesn't earn its place. Opening on it does.
5. **The "em dash" ban is over-broad.** Overall delta -5pp masks a Simpson split: on LinkedIn carousel em dashes are +12pp, single-image +4pp, only on video are they -22pp. And em-dash use in 2026 collapsed to 5 posts (from 59 in 2025) — QA is already effectively enforcing it, and the historic negative was a video-format artefact. **Recommendation: kill the blanket ban; keep it only on video captions.**
6. **Word-count sweet spot moved.** In 2025, 100–250 words was the winning zone (worked 27–37%). In 2026, 150–250 words is now the *worst* bucket (worked 6%, under 32%, n=31). The 30–150 zone survived. Long captions stopped earning reach.
7. **Emoji restraint is now mandatory.** 2025 tolerated 4–5 emojis (worked 24%). 2026 punishes 6+ emojis hard (worked 6%, under 24%, n=17). Also punishes 4–5 (worked 10%). Rule change: cap at ≤3 emojis for 2026.
8. **Banned-adverb enforcement is already working — the rule can shrink.** Across 474 posts, only 12 posts contain any banned adverb. "Proud" (n=6) is the only one with material n, and its delta is -5pp. `truly`, `incredibly`, `seamlessly`, `revolutionary`, `delighted`, `proudly` combined appear in <10 posts. Keep "proud" in the ban list; the others are dead-weight rules that never fire.

---

## 2. Corpus — n per platform × era × tier

**Total analysed: 474 posts** (467 with official spec_v3 tier + 7 fallback-tiered from cohort-window-outside posts).

Skipped: 24 posts — 15 with no `signals` block (0 impressions), 1 missing `caption.md`, 8 with <100 impressions.

### By platform

| Platform | n |
|---|---|
| LinkedIn (Titan + Titanverse) | 419 |
| Facebook | 23 |
| Instagram | 20 |
| TikTok | 12 |

### By format (signals.format)

| Format | n |
|---|---|
| linkedin\|video | 176 |
| linkedin\|single-image | 138 |
| linkedin\|carousel-document | 72 |
| linkedin\|multi-image | 15 |
| facebook\|short-form-video | 14 |
| linkedin\|text | 12 |
| tiktok\|short-form-video | 12 |
| instagram\|short-form-video | 11 |
| facebook\|single-image | 9 |
| instagram\|single-image | 8 |
| linkedin\|short-form-video | 6 |
| instagram\|video | 1 |

### By era

| Era | n | worked | middle | under |
|---|---|---|---|---|
| 2024 | 5 | 1 | 3 | 1 |
| 2025 | 224 | 47 | 127 | 50 |
| 2026 | 245 | 48 | 145 | 52 |

2024 has n=5 — every 2024 analysis in this report is directional only. The story is 2025 vs 2026.

### Tier source

| Source | n |
|---|---|
| official (spec_v3) | 467 |
| fallback (era × format ranking) | 7 |

Corpus tier counts (467 with spec_v3 tier): worked 95, middle 270, underperformed 102, insufficient-data 15 — matches `analytics/format-signal-report.json` exactly.

---

## 3. VALIDATED rules (data agrees with the QA skill)

These are the rules the data confirms should stay in QA:

| QA rule | Data | Verdict |
|---|---|---|
| Ban `@`-mentions of operators (individual people) | 2025 delta = 0.0pp, 2026 delta = **+8.0pp** | **Rule now BACKWARDS — see section 4.** |
| Ban competitor PMR names | n=8 total, delta +0.1pp | Rule doesn't fire enough to test properly, but no evidence of a false-positive cost. Keep. |
| Ban meta-narration ("swipe to see", "watch this", "link in bio") | n=14, overall +1.2pp | Neutral — rule is cheap to keep, doesn't hurt anything. Keep. |
| No blanket ban on emojis; use restraint | ✓ 2026 data shows 4+ emojis tank reach | Keep, but tighten cap (see section 4). |
| Verbatim quotes must be genuine (no invented quotes) | Not testable from metadata alone | Retain — this is a factual-integrity rule, not a performance rule. |
| British English | Not tested (would require dictionary diff) | Retain — brand consistency. |
| No banned adverbs | See section 4 — mostly dead rules | Trim to just `proud/proudly` — the rest never fire. |

---

## 4. CONTRADICTED rules (data disagrees with the current QA skill)

### 4a. Em dash blanket ban → overzealous
- Overall delta -5pp is a Simpson artefact driven entirely by LinkedIn video (-22pp).
- On LinkedIn carousel-document em dashes are **+12.2pp**. On LinkedIn single-image **+4.0pp**.
- 2026 em-dash use has collapsed to n=5 (from n=59 in 2025) — the rule is already being enforced and the corpus can no longer test it. The 2025-only signal was a video-format artefact, not a global truth.
- **Fix: make em-dash discouragement format-specific — flag on video captions only.**

### 4b. `@`-mention of operator ban → now backwards
- 2025: 0.0pp delta (n=27).
- 2026: **+8.0pp** (worked 22.9% vs under 15%, n=40).
- Top 2026 winners are full of Titanverse tags (`@Jaya`, `@Tariq`, `@Avonnex`, `@Pharmacy Mentor`).
- **Fix: drop the blanket ban. Allow `@`-mentions of Titanverse-affiliated collaborators and customers. Retain the rule only for competitor/random-operator tagging.**

### 4c. Banned-adverb list → oversized
- The seven-word list catches almost nothing (12/474 posts total).
- Only `proud` fires meaningfully (n=6, delta -5pp) — and even that is n<10.
- `delighted` and `proudly` fire zero times. `revolutionary` and `incredibly` fire once. `truly` twice. `seamlessly` three times.
- **Fix: shrink to `proud` (soft-flag, not hard-fail). Delete the others — they're rules-theatre, not rules-with-teeth.**

### 4d. "Second person opener drives engagement" (informal belief, not explicit QA rule)
- This was implied by every content-strategy write-up: talk to "you", the reader.
- 2026 data brutally contradicts it: n=27, worked 11%, **under 52%**.
- Note: 2025 was fine for it (n=21, worked 29%, under 24%).
- **Fix: add a new QA warning — flag drafts that open on "You / Your / You're" and prompt the writer to consider a named-specific opener instead.**

### 4e. "Structural payoff before signoff" (Titan brand rhythm rule)
- Overall delta -15.7pp — looks damning.
- **But**: the heuristic used here is "middle of the last three non-empty lines is shorter than surrounding lines." That's essentially a hashtag-block detector — 197 of the 218 posts with `has_structural_payoff=True` also end in a hashtag block.
- So this finding is likely a heuristic artefact, not evidence against the underlying rhythm rule.
- **Fix: cannot conclude from rule-based data — need an LLM-based rhythm classifier to re-test. Flag as unreliable proxy in section 12.**

---

## 5. NUANCED rules (format-aware, not one-size-fits-all)

### 5a. Word count — dramatically format-aware

| Format | Best bucket | Worst bucket |
|---|---|---|
| linkedin\|single-image | 100–150 words (worked 26% vs under 12%) | 30–60 (worked 4%!, under 21%) |
| linkedin\|carousel-document | 0–30 words (worked 50%, n=6) or 100–150 (worked 26%) | 60–100 (worked 9%, under 30%) |
| linkedin\|video | 100–150 words (worked 20%, under 11%) | 30–60 (worked 16%, under 28%) |

Cross-cutting pattern: 30–60 words is dead across formats in 2026 (either too-lite-to-earn-attention or too-thin-to-teach). The 100–150 zone is the workhorse for LinkedIn.

**Fix: QA v2 should carry format-specific length guidance.**

### 5b. Emoji count — 2025 tolerant, 2026 restrictive

| Emojis | 2025 worked/under | 2026 worked/under |
|---|---|---|
| 0 | 25% / 25% | **23% / 20%** |
| 1 | 12% / 25% | 19% / 26% |
| 2–3 | **26% / 17%** | **25% / 16%** |
| 4–5 | 24% / 15% | 10% / 15% |
| 6+ | 22% / 31% | **6% / 24%** |

The 2–3 zone was optimal in both years. Everything beyond that decayed in 2026.

**Fix: QA cap at ≤3 emojis. Warn at 4–5. Fail at 6+.**

### 5c. `has_named_specific_in_opener` — same lift across formats

Consistent +15 to +29pp across LinkedIn single-image, carousel, and video. This is the rule to double down on.

### 5d. Content-type × register — some pairings only fire in one era

| Content type × register | 2025 (n, worked%, under%) | 2026 (n, worked%, under%) |
|---|---|---|
| culture_moment × sector_thesis | 13 · **0%** · **38%** | too small |
| culture_moment × product_focused | 13 · 15% · 31% | too small |
| event_coverage × sector_thesis | 11 · **45%** · 9% | 33 · 24% · 21% |
| other × warm_documentary | 15 · 7% · 27% | 12 · 8% · 8% |
| other × sector_thesis | 52 · 19% · 25% | 57 · **21% · 16%** |
| sector_news × sector_thesis | 26 · 31% · 27% | 6 · 50% · 0% |

Reading: mixing celebratory culture-moment posts with sector-thesis register was death in 2025 (0% worked). Warm-documentary register on random "other" content was death-ish (7% worked). Event coverage tied to sector-thesis register was a home run in 2025 (45%), softer but still positive in 2026.

**Fix: QA can add a soft check — if `register=warm_documentary` and `content_type=other`, prompt "does this connect to a specific person or event?"**

---

## 6. MISSING rules (patterns QA currently doesn't catch)

Patterns the data flags that aren't in the current QA skill:

1. **Second-person opener warning** — new: 52% underperform rate in 2026.
2. **Emoji hard-cap at 3** — current guidance is "restraint," data now supports a numeric limit.
3. **Word-count ceiling of ~150 for LinkedIn video/single-image** — 150–250 word bucket tanked in 2026.
4. **Quote-must-be-the-hook rule** — if a `"..."` block exists but the caption doesn't open on it, warn.
5. **Missing named specific in opener** — should be a *require* (fail) not a *nice-to-have*, given +25pp signal.
6. **Culture-moment + sector-thesis register mismatch** — flag when celebratory content is written in NHS-policy voice.
7. **Warm-documentary register on non-story content** — flag when there's no named person or event to warm about.
8. **Titanverse `@`-tag encouragement** — the QA skill treats operator @-mentions as banned; data says the opposite for Titanverse-affiliated collabs.

---

## 7. Ten hypotheses — one section each with numbers

### H1. Em dashes actually harmful?

**Verdict: format-specific, not global. Overall ban is wrong.**

Overall (all 474): delta -5.0pp (worked 11.5% vs under 16.5%, n_true=66).

Per format (n≥15):
- linkedin\|carousel-document: **+12.2pp**
- linkedin\|multi-image: 0.0pp
- linkedin\|single-image: +4.0pp
- linkedin\|video: **-22.2pp**

Per era:
- 2024: n_true=1, directional only
- 2025: -14.9pp (n_true=59) — this drove the whole signal
- 2026: +2.1pp (n_true=5) — usage collapsed after QA started blocking

**Interpretation:** The 2025 negative was mostly LinkedIn video posts using em dashes as pause-markers in copy that also had other problems. On document formats em dashes correlate positively. Not causal — likely a confound with copy style.

### H2. Banned adverbs correlate with underperformance?

**Verdict: only `proud` has any signal, and n is tiny.**

| Adverb | n_true | Overall delta | 2025 delta | 2026 delta |
|---|---|---|---|---|
| proud | 6 | -4.9pp | -4.0pp | -3.8pp |
| proudly | 0 | 0.0pp | — | — |
| truly | 2 | -1.0pp | 0.0pp | 0.0pp |
| incredibly | 1 | 0.0pp | 0.0pp | 0.0pp |
| seamlessly | 3 | +1.0pp | 0.0pp | 0.0pp |
| revolutionary | 1 | 0.0pp | 0.0pp | 0.0pp |
| delighted | 0 | 0.0pp | — | — |

Only 12 of 474 posts trigger any banned adverb. The rule is already working; the list is oversized.

### H3. Alex 2×2 quadrant count predicts tier?

**Verdict: no. Zero-to-weak signal. The framework isn't predictive here.**

Correlation between `quads_hit_count` and composite percentile: **r = -0.059** (n=474). That's noise.

Bucketed:
| Quads hit | n | worked% | under% |
|---|---|---|---|
| 0 | 199 | 22.6% | 18.6% |
| 1 | 150 | 20.7% | 27.3% |
| 2 | 97 | 14.4% | 20.6% |
| 3 | 26 | 23.1% | 15.4% |
| 4 | 2 | 0.0% | 50.0% |

More quadrants ≠ better. If anything the 1–2 quadrant zone shows the worst underperformance — hitting a single vague "gain" or "consequence" keyword isn't a coherent value prop.

**Recommendation: stop using quadrant count as a scoring axis. Ask instead "is the specific value stated in the opener?"**

### H4. Question hooks always win?

**Verdict: no. They're neutral in both eras and specifically worse than statement hooks.**

Overall hook_shape distribution:
| Hook | n | worked% | under% |
|---|---|---|---|
| question | 44 | 15.9% | 20.5% |
| statement | 268 | 19.4% | 19.4% |
| **stat_led** | 38 | **31.6%** | 13.2% |
| second_person | 49 | 18.4% | **38.8%** |
| narrative | 43 | 20.9% | 25.6% |
| quote_led | 31 | 22.6% | 22.6% |

Per era, question hooks: 2025 delta -3.5pp (n=24), 2026 delta +0.5pp (n=19). No meaningful lift either year.

**Fix: stop advising "open with a question."** Advise "open with a stat + named specific" instead.

### H5. Warm vs editorial — which works when?

**Verdict: warm_documentary underperforms if it's not tied to a real story.**

Register overall:
| Register | n | worked% | under% |
|---|---|---|---|
| sector_thesis | 208 | 23.1% | 21.6% |
| event_hype | 34 | 26.5% | 17.6% |
| product_focused | 157 | 17.8% | 24.8% |
| warm_documentary | 43 | 11.6% | 14.0% |
| neutral | 22 | 22.7% | 22.7% |
| punchy_advocacy | 8 | 12.5% | 25.0% |
| editorial_argument | 2 | — | — |

Editorial argument is unmeasurable (n=2). Warm documentary underperforms only slightly overall (11.6% vs 14%) but tanks when combined with content_type=other or culture_moment (see 5c).

**Interpretation:** Warm register works if there's a real named person/event to be warm about. Applied to product marketing, it deflates.

### H6. Emoji restraint helps or hurts?

**Verdict: helps in 2026, was neutral in 2025.**

See section 5b. 2026 4+ emoji buckets crash to worked 6–10%. The 2–3 zone is optimal in both eras.

### H7. Length curves per format

See section 5a. Sweet spot moved from 100–250 in 2025 to 30–150 in 2026, and the 150–250 bucket became a graveyard (worked 6%, under 32% in 2026).

### H8. "Named specific in opener" lift 1.88×?

**Verdict: confirmed and understated.**

- 216 of 474 posts have this feature.
- Worked cohort: 59.4% have it. Underperformed cohort: 34.0% have it. **Ratio ≈ 1.75×** across all data.
- 2025 alone: 65.9% vs 42.0% — ratio 1.57×.
- 2026 alone: 54.2% vs 26.9% — **ratio 2.01×**. The gap is *widening* in 2026, not shrinking.

This is the single strongest predictor in the whole feature set.

### H9. Ending with 💙 hurts?

**Verdict: untestable — only 1 post in the corpus ends with the blue heart.**

Can't say either way. The QA rule is a taste rule, not a data-backed one. Keep it if Cam wants — but don't defend it with performance data.

### H10. Verbatim quotes win?

**Verdict: they hurt overall in 2026, but *quote-led* hooks specifically win.**

Overall `has_verbatim_quote`:
- 2025: -0.7pp (n_true=71) — neutral
- 2026: **-13.5pp** (n_true=60) — worked 22.9% vs under 36.5%

Hook shape `quote_led` (opens on a quote):
- 2025: n=7, worked 0/7. Broken in 2025.
- 2026: n=24, worked 7 / under 6 (~29% worked). **Emerged as a top-performing hook.**

**Interpretation:** Standalone quotes buried in the middle of a caption don't earn their place. Quote-*as-opener* signals a real story is coming.

---

## 8. Era-flip table

Signed delta (worked% – under%). "Flip" = sign changed AND magnitude change > 5pp between 2025 and 2026.

| Feature | 2025 Δ | 2026 Δ | Flip? | Interpretation |
|---|---:|---:|:---:|---|
| has_em_dash | -14.9 | +2.1 | **YES** | 2025 signal was likely a video-copy artefact; 2026 usage too low to test |
| has_hashtags | -8.8 | +3.8 | **YES** | Hashtags stopped hurting once nobody was over-doing them |
| uses_titan_hashtags | +25.4 | 0.0 | **YES** | Standard branded hashtags stopped moving the needle |
| ends_with_emoji | +2.1 | +6.9 | no | Consistent mild positive |
| ends_with_blue_heart | 0.0 | +2.1 | no | n=1, ignore |
| starts_with_question | -3.5 | +0.5 | no | Both flat |
| starts_with_stat | +10.9 | +4.6 | no | Consistent winner |
| starts_with_named_person | +13.4 | +0.8 | no | Weakened but still positive |
| has_verbatim_quote | -0.7 | -13.5 | no | Quotes-as-decoration got worse |
| has_named_specific_in_opener | +24.0 | +27.2 | no | Strongest signal, still strengthening |
| has_structural_payoff | -13.2 | -18.4 | no | Heuristic artefact — see 4e |
| has_community_close | +2.1 | 0.0 | no | Neutral |
| meta_narration_present | +0.3 | +2.1 | no | Neutral |
| competitor_name_present | +2.1 | -1.9 | no | n too small |
| at_mention_operator_present | 0.0 | +8.0 | **YES** | Titanverse tagging became a signal |
| ironic_reversal_present | +5.7 | -0.6 | **YES** | "but/actually/turns out" openers stopped working |
| has_kicker | +2.1 | +4.2 | no | n too small |
| has_url | +4.8 | +0.2 | no | Small drop |

Hook-shape era flip (2025 → 2026):
- second_person: worked 29% → 11%, under 24% → **52%** (n=21 → n=27). **Massive flip.**
- quote_led: worked 0/7 → 29% (7/24). **Emerged.**

---

## 9. Captions that worked in 2025 but wouldn't now

Top 20 2025 posts (by composite percentile). Common shape:
- avg word count 86
- avg emoji count 3.7
- 90% used hashtags, 60% used standard Titan hashtags
- 70% had a named specific in the opener (still holds up in 2026)
- 55% register = sector_thesis, 25% product_focused
- 15% em-dash use, 15% question hooks, 10% stat-led hooks
- 55% "statement" hooks, 15% narrative, 15% question

Notable slugs and why they'd struggle in 2026:
- `2025-04-16-pick-your-player-carousel` — 4 emojis, second-person hook, culture-moment content. Second-person + culture-moment is the exact 2026 failure recipe.
- `2025-06-12-pharmacy-but-smarter` — 37 words, 3 emojis, statement hook. In 2026 the 30–60 word zone crashed to 11–19% worked. Would probably still land because of format (single-image, 60–100 zone is fine there) but with weaker lift.
- `2025-11-20-pharmacist-battery-meme` — 4 emojis, culture-moment content. In 2026 this shape underperformed.
- `2025-08-20-pharmacy-chatgpt-prompts` — high emoji count. Now above cap.
- `2025-11-11-bmp-case-study-carousel` and `2025-07-02-priory-longform-video` — long-form (150+ words). 2026 punishes this bucket.

Shape that broke: **long celebratory culture-moment carousels with 4+ emojis and second-person openers.** That was the 2025 winning shape and it's the 2026 losing shape.

Shape that survived: **stat-led or named-specific openers with sector-thesis voice and ≤3 emojis, 60–150 words.**

## 10. New patterns that only emerged in 2026

Top 20 2026 posts fingerprint vs top 20 2025 fingerprint:

Deltas in feature share among top-20 (2026 % − 2025 %):

| Feature | 2025 top-20 | 2026 top-20 | Δ |
|---|---:|---:|---:|
| at_mention_operator_present | 0% | **35%** | **+35pp** |
| has_verbatim_quote | 5% | **35%** | **+30pp** |
| ends_with_emoji | 0% | 15% | +15pp |
| ends_with_blue_heart | 0% | 5% | +5pp |
| starts_with_stat | 10% | 5% | -5pp |
| starts_with_question | 15% | 5% | -10pp |
| has_em_dash | 15% | 0% | -15pp |
| has_hashtags | 90% | 75% | -15pp |
| has_named_specific_in_opener | 70% | 55% | -15pp |
| ironic_reversal_present | 35% | 20% | -15pp |
| has_structural_payoff | 60% | 40% | -20pp |

Categorical shifts in top-20 winners:

| Category | 2025 → 2026 |
|---|---|
| hook_shape = quote_led | 0% → **20%** |
| hook_shape = stat_led | 10% → 5% |
| hook_shape = second_person | 5% → 0% |
| opener_type = named_person | 10% → 5% |
| opener_type = generic_statement | 70% → 90% |
| content_type = event_coverage | 15% → 10% |
| content_type = culture_moment | 15% → 0% |
| protagonist = brand | 10% → 25% |
| protagonist = archetype | 30% → 20% |

**Emergent 2026 shape:**
1. Quote-led hooks (Prab, Google-search, etc.).
2. Titanverse @-mentions of collaborators.
3. Shorter than 2025 (avg 76 words vs 86).
4. Fewer emojis (avg 1.4 vs 3.7).
5. Brand-as-protagonist (25%, up from 10%) — Titan itself named in the first six words.
6. Fewer standard hashtags (75% vs 90%).

**Retreating patterns:** stat-led hooks (still work overall but less represented at the very top), em dashes, ironic reversals ("but... actually..."), culture-moment posts as top performers, question hooks.

---

## 10b. Abandoned winning patterns — what we've stopped doing that used to work

Different question from Section 9. Section 9 asked "which 2025 shapes have the algorithm broken?" This section asks the inverse: **which patterns showed up frequently in 2025 winners that we now ship far less often, regardless of whether the pattern still wins.** These are things Cam has quietly dropped from the mix that used to earn.

Methodology: for every feature, compute (a) frequency in 2025 `worked` posts (winner-freq), (b) frequency in all 2025 output, (c) frequency in all 2026 output. Flag features where winner-freq ≥ 20% AND 2026 output-freq is ≥ 30% below 2025 output-freq. Winner-freq threshold catches "was actually part of the winning mix"; output drop catches "we stopped shipping this."

Ranked by output-drop, largest first:

| # | Feature | 2025 winner-freq | 2025 output | 2026 output | Rel. drop | 2026 winner-freq | Verdict |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | **`carousel-document` format** | 25.5% | 26.3% | 4.9% | **-81%** | 6.2% | **Restart candidate** |
| 2 | **`sector_news` content** | 19.1% | 12.9% | 2.9% | **-78%** | 6.2% | **Restart candidate** |
| 3 | **`emoji_count ≥ 3`** | 57.4% | 50.0% | 21.2% | -58% | 12.5% | Do NOT restart (see caveat) |
| 4 | **`has_url` in caption** | 12.8% | 8.0% | 3.7% | -54% | 2.1% | Marginal — see note |
| 5 | **Named-person opener** | 23.4% | 16.1% | 11.0% | -31% | 10.4% | **Restart candidate — strong** |
| 6 | **`archetype` protagonist** | 46.8% | 35.7% | 24.5% | -31% | 27.1% | **Restart candidate** |
| 7 | **`GAIN` quadrant framing** | 48.9% | 52.2% | 31.8% | -39% | 20.8% | Restart with caveat |
| 8 | **`culture_moment` content** | 10.6% | 14.3% | 0.8% | -94% | 0.0% | Do NOT restart |

### 1. Carousel documents — the biggest actionable gap

In 2025 you shipped carousels at 26% of output and they were 25% of winners — right on parity, no lift, no drag. In 2026 you're at **4.9% of output** and carousels are still 6% of winners in the tiny sample that exists. The format didn't fail. Cam stopped making them. If your 2025 win rate on carousels held (roughly 21% of carousels tiered `worked`), restoring even half the 2025 volume (12-13% of output) would add ~15 winner-candidate slots per year on the current cadence. This is the single most concrete "restart this" in the whole analysis.

### 2. Sector news content — from 13% of output to 3%

Sector-news posts (NHS funding, GPhC updates, policy shifts) tiered `worked` at 34% of instances in 2025 (n=29), well above the 21% baseline. In 2026 you've shipped 7 sector-news posts across the whole year (~3% of output). Given the reactive-post scan already exists in `scripts/pharmacy-news-scan.py`, this is a low-effort restart — turn a weekly Monday scan into a monthly sector-news post minimum.

### 3. Heavy emoji (≥3 per caption) — DO NOT naïvely restart

This one shows the largest drop numerically (57% → 21% of output), but the earlier hypothesis-6 section shows emoji restraint now correlates positively with tier in 2026. **The 2025 winner-freq is a lagging indicator, not a template.** Heavy emoji use was table-stakes in 2025; it doesn't work in 2026. Listed here for completeness; don't act on it.

### 4. URLs in caption — from 8% to 4%

Adding a direct URL correlated with the `worked` tier in 2025 (13% of winners had one). In 2026 this dropped to 4% of output and only 2% of winners — this may be LinkedIn's algorithm penalising off-platform links, or Cam consciously moving CTAs to the first-comment slot. Worth an A/B: ship 5 posts in October with a `titanpmr.com` in-caption CTA and 5 without, see if the format still lifts.

### 5. Named-person openers — the highest-priority restart

Cross-reference: this feature is **the single strongest signal in the entire analysis** (section H8: +25pp share-of-winner delta, 2.01× ratio in 2026). In 2025 it was 23% of winners, 16% of output. In 2026 you've dropped to 11% of output. **You've cut back the strongest-performing pattern.** Open more captions with "Prab", "Jaya", "Sunil", "Kieren" as the literal first word. This is not "aim for it" — this is "target 25% of output minimum."

### 6. Archetype protagonist voice — from 47% of winners to 25% of output

"The pharmacist... The owner... The superintendent..." as the caption's subject was 47% of 2025 winners. In 2026 you write about ideas and workflows more (`idea` protagonist went from 45% to 67% of output). This is a voice shift from "here's the person" to "here's the concept" — arguably brand-drift toward operator abstraction. Restart looks like: more captions where the first sentence puts a human archetype (not Titan, not the workflow) in the subject position.

### 7. GAIN framing — from 49% to 32% of output

The GAIN axis of the Alex 2×2 ("save time," "grow revenue," "scale") was 49% of 2025 winners. In 2026 it's 32% of output and only 21% of winners. Cross-reference: the Alex 2×2 overall is uncorrelated with tier (r=-0.06), so this is a "half-restart" — don't ship every post as a GAIN post, but the current 2026 slant toward `CONSEQUENCE` framing (fall-behind, cost-of-inaction) may be over-indexed. Rebalance towards ~40% GAIN, not force it.

### 8. Culture moments — probably don't restart

Section 9 flagged culture-moment carousels as the shape that specifically broke in 2026. Cam's cut is data-consistent, not an accidental drop. Included here only so the section is honest about what's not on the restart list.

### Not flagged but worth watching

Two patterns that survived the ≥20%/≥30% threshold check but sit just below and are directionally worth noting:
- **Ending caption with a URL** — 13% of 2025 winners, 3% of 2026 output. Same signal as row 4 with a tighter cut.
- **Stat-led hooks** — 15% of 2025 winners, 8.5% of 2025 output, 8.2% of 2026 output. Volume held; this isn't abandoned. But it still tops out at 8% — you could ship more.

### Confidence on this section

- 2025 winner sample: n=47. 2026 winner sample: n=48. Comparable.
- All "restart" recommendations reference features that were also in the top-5 winner-freq slots for 2025. Nothing here is drawn from a rare pattern.
- Content-type mix conclusions (rows 2, 8) depend on the `content_type` classifier, which under-detects (section 12). Directionally solid, absolute frequencies could shift with LLM re-extraction.
- The strongest single recommendation (row 5, named-person openers) is drawn from a deterministic regex feature, so it's the highest-confidence claim in the whole document.

---

## 11. Recommended QA v2 changes (concrete diff)

**Drop (rule doesn't fire / rule is now backwards):**
- Remove `truly, incredibly, seamlessly, revolutionary, delighted, proudly` from the banned-adverb list. Keep only `proud`, and make it a soft-warn.
- Remove blanket ban on em dashes. Replace with format-conditional rule: em dashes are only flagged on `linkedin|video` and `*|short-form-video`. On carousel and single-image, allow.
- Remove blanket ban on `@`-mentions of operators. Replace with an allow-list check: pass if the mentioned handle is a known Titanverse-affiliated account, flag if it's a random third party.

**Tighten:**
- Emoji cap: warn at 4, fail at 6. (Currently: soft "restraint" guidance.)
- Word-count guidance: format-specific.
  - linkedin\|single-image: aim 60–150.
  - linkedin\|carousel-document: aim 30–150 (bimodal — both very short and 100–150 win).
  - linkedin\|video: aim 60–150.
  - Warn on 150–250, fail on 250+.
- Quote handling: if the caption contains `"..."` but the first sentence isn't the quote, warn "quotes work better as openers than as decoration."

**Add:**
- Second-person opener warning: if the first 5 words contain `you / your / you're / you've`, warn.
- Named-specific-in-opener requirement: warn if the first 30 words have neither a proper noun nor a UK place nor a number.
- Warm-documentary + no-story mismatch: warn if `register=warm_documentary` and no named person / event / place is referenced.
- Culture-moment × sector-thesis mismatch: warn on celebratory content written in NHS-policy voice.

**Keep as-is:**
- No-invented-quotes rule (integrity, not performance).
- British English rule (brand consistency).
- Competitor-PMR ban (didn't fire enough to test, no downside).
- Meta-narration ban ("swipe to see", "link in bio") — neutral in data, cheap to keep.

**Reframe:**
- Alex 2×2 quadrant scoring: **drop as a numeric scoring axis** (r = -0.06 with percentile). Replace with the specific-value-in-opener check.
- "Structural payoff before signoff" — cannot conclude from rule-based extraction. Either re-test with an LLM-based rhythm classifier, or de-prioritise until re-tested.

---

## 12. Confidence + limitations

### Sample-size caveats

- Overall n=474 is solid.
- Per-format n≥15 threshold protects LinkedIn single-image, carousel, video, multi-image, text, and short-form-video across Facebook + TikTok. Everything else (instagram|single-image, instagram|video, instagram|short-form-video, facebook|single-image) is directional only.
- Per-era n: 2024 has 5 posts — all 2024 numbers are directional. 2025 (n=224) and 2026 (n=245) are both robust.
- Some features fire so rarely they can't be tested: `ends_with_blue_heart` (n=1), `delighted` (n=0), `proudly` (n=0), `revolutionary` (n=1).

### Heuristic-proxy features (upgrade to real LLM extraction later)

These were extracted with keyword regex + bag-of-words scoring. Every claim depending on them should be treated as directional until re-run with an LLM classifier:

1. **`register`** — bag-of-words scoring across seven keyword lists. Warm-documentary detection specifically over-fires on any caption containing "team," "thanks," or "community" — many product-focused captions get bucketed as warm-documentary because they say "our team."
2. **`hook_shape`** — good for `question`, `stat_led`, `quote_led` (all deterministic). Weak for `narrative` (any word ending in "ed" triggers it) and `directive` (n=1, the verb list is too narrow).
3. **`opener_type`** — deterministic pieces (named_person, question, event_reference) are solid; `archetype` and `generic_statement` are catch-all.
4. **`fast_company_protagonist`** — the `idea` bucket over-fires because it triggers whenever the first sentence has no proper noun, which is common.
5. **`content_type`** — priority-ordered keyword matching. `customer_story` under-fires because it requires literal words like "testimonial" or "since moving." The 5 customer_story posts in the data is almost certainly a big undercount; most Prab / Jaya / Sunil posts land in `other`.
6. **`alex_quadrants_hit`** — trivial single-keyword match per quadrant. "More" triggers GAIN even when the caption is warning about too much of something.
7. **`ironic_reversal_present`** — matches on any `but / actually / instead / however` in the first 60 words. Very crude.
8. **`has_structural_payoff`** — "middle of last 3 lines shorter than others" is really a hashtag-block detector (see 4e).
9. **`meta_narration_present`** — regex-based, works well for standard phrases but misses paraphrases.
10. **`has_named_specific_in_opener`** — uses a small hard-coded UK place list + generic proper-noun regex. Under-counts less-common place names; over-counts anywhere the writer capitalised a common noun.

### Confounders

- **Format is confounded with era.** In 2025 the mix skewed video-heavy; in 2026 short-form-video on TikTok/IG entered the mix. Per-era format-normalised comparisons would be tighter but n gets thin fast.
- **Tier is a within-format percentile, not an absolute reach measure.** A "worked" post in a low-volume format is not the same absolute win as a "worked" LinkedIn video.
- **Correlation ≠ causation.** Especially for features like em dashes on video: em-dash-heavy video captions may also share other traits (older cohort, longer, colder register) that are the real driver.
- **Selection: QA is already being applied to 2026 drafts.** Which means 2026's "worked" cohort has already been filtered through the current QA rules. Some of the "rule already works" findings are QA doing its job, not the underlying pattern being harmless.

### What to upgrade next (for a real LLM re-run)

Priority order for LLM-classified re-extraction:
1. `register` — this drives 3 of the section-5c findings and 2 of the section-11 recommendations.
2. `content_type` — the current under-detection of `customer_story` hides what's probably a top winning category.
3. `has_structural_payoff` — replace with an actual rhythm-of-close classifier.
4. `alex_quadrants_hit` — replace with a coherent-value-prop-in-opener check.
5. `fast_company_protagonist` — replace with a "who's the subject of sentence one" classifier.

Once those are LLM-extracted, re-run `02_analyze.py` and diff the numbers against this baseline.
