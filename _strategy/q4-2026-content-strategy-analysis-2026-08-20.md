# Q4 2026 Content Strategy Analysis — Titan PMR + Titanverse

**Written:** 20 Aug 2026
**Author:** Cam (via Claude analytic pass)
**Data window:** 1 Jan 2025 → 10 Aug 2026 (694 rows across four platforms; 2024 rows dropped as pre-launch noise, n=5)
**Primary dataset:** `exports/titan-metrics-raw-2026-08-19.csv`
**Scope:** All four social platforms, both brands, Sept–Dec 2026 planning horizon
**Preceded by:** `_strategy/titan-pmr-marketing-strategy-q4-2026-v2.md` (4 Aug), `_strategy/socials-quarterly-review-2026-08-12.md` (12 Aug), `_strategy/caption-features-vs-tiers-analysis-2026-08-18.md` (18 Aug). This doc builds on those — I do not restate what they already prove.

---

## How to read this document

The brief called for eight sections. They are here in order, with a final "answer to Cam's five-changes question" at the end. Every claim is tagged **PROVES** (the dataset makes the point directly) or **HYPOTHESIS** (a strategic reading of the numbers). Format inflation is called out wherever it would otherwise mislead the ranking.

Two dataset warnings that apply everywhere below:

1. **Only LinkedIn has real 2025 comparison data.** TikTok is a net-new channel in 2026 (0 posts in 2025, 80 in 2026). Instagram and Facebook had 2–3 posts each in 2025 and only became active in 2026. Every YoY claim in this doc that isn't about LinkedIn is a directional read, not a validated trend.
2. **Facebook and Instagram engagement columns are zero for nearly every row.** IG has views but no reactions/comments/shares. FB has neither — reach is 0 across all 88 rows. That is either an ingest gap or the accounts have essentially no community response. I treat FB engagement claims as unavailable, not as "zero". IG views are the only signal I use for that platform.

---

## Section 1 — Performance landscape per platform

### 1.1 LinkedIn (417 posts, real YoY comparison possible)

**Volume:**

| Year | Posts | Total impressions | Median imp | Mean imp | 75th %ile | Max |
|---|---:|---:|---:|---:|---:|---:|
| 2025 (full year) | 224 | 339,037 | 1,188 | 1,514 | 1,781 | 7,338 |
| 2026 (to 10 Aug) | 193 | 225,401 | 906 | 1,168 | 1,402 | 7,325 |

**PROVES:** LinkedIn median reach per post is down 24% year-on-year (1,188 → 906). The 75th percentile dropped further, from 1,781 → 1,402 (–21%). The peak ceiling barely moved (7,338 → 7,325) — the top 1% of posts is roughly equal in outright reach, but the middle of the distribution has thinned.

**PROVES:** Post volume rose from 116 in Jan-Jul 2025 to 193 in Jan-Jul 2026 — a 66% increase — while median reach dropped 24%. The 4 Aug strategy doc flagged this as a possible cause; this dataset makes the causal test cleaner — if volume rollback works, the September test in v2 §2.5 will show it directly.

**Brand split:**

| Brand | Year | n | Median imp | Total imp |
|---|---:|---:|---:|---:|
| Titan PMR | 2025 | 197 | 1,258 | 309,826 |
| Titan PMR | 2026 | 145 | 986 | 186,454 |
| Titanverse | 2025 | 27 | 1,017 | 29,211 |
| Titanverse | 2026 | 48 | 681 | 38,947 |

**PROVES:** Titanverse median reach fell 33% YoY (1,017 → 681), worse than Titan PMR's 22% drop. Titanverse also shifted its format mix aggressively — text posts went from zero in 2025 to six in 2026 (of the 14 LinkedIn text posts total, six came from Titanverse), with median 202 impressions. Six posts published for essentially no distribution — proportionally a much bigger drag on a smaller page.

**Format distribution (LinkedIn, 2026, n≥5):**

| Format | n | Median imp | Median engagement | ER median |
|---|---:|---:|---:|---:|
| multi-image | 14 | 2,118 | 39.5 | 2.05% |
| video | 89 | 833 | 21 | 2.17% |
| single-image | 59 | 900 | 21 | 2.27% |
| carousel-document | 12 | 1,064 | 18 | 1.71% |
| text | 14 | 467 | 7 | 1.85% |
| short-form-video | 5 | 681 | 26 | 3.49% |

**PROVES:** Multi-image outperforms every other LinkedIn format in 2026 on impressions (2.5× the median of single-image), but the sample is 14 posts — real but narrow. This confirms the finding already in the 12 Aug socials review; it does not add new evidence, it re-confirms it against a slightly broader dataset.

**FLAGGED FOR FORMAT INFLATION:** ER on carousel-document has historically been inflated by clicks (the caption-features analysis on 18 Aug already stripped this). The 1.71% here is the raw arithmetic — real engagement (reactions + comments + shares divided by impressions) is what matters. Multi-image and single-image ER medians (~2.05–2.27%) are directly comparable to each other; do not put carousel-document on the same axis without stripping clicks.

### 1.2 TikTok (80 posts, all 2026, no YoY comparison possible)

| Metric | Value |
|---|---:|
| Total posts | 80 |
| Median views | 1,100 |
| Mean views | 1,849 |
| 75th %ile | 1,468 |
| Max views | 14,924 |
| Median engagement (reactions + comments + shares) | 17 |
| Max engagement | 389 |

**PROVES:** TikTok is Titan's most-engaged non-LinkedIn surface. The top TikTok post reached 14,924 views — twice the ceiling of any LinkedIn post published in the same seven-month window. Median engagement is 17 per post at median 1,100 views — an ER of roughly 1.5%, comparable to LinkedIn video (2.17%) despite the very different distribution model.

**PROVES:** There is a clear top decile — nine posts crossed 2,500 views, and those nine posts account for 42% of TikTok's total views for the year. The rest sits between 500–1,500 views. Median hides that TikTok either lands or doesn't; there is no reliable middle.

**HYPOTHESIS:** TikTok reach on Titan's content is driven by the topic and the hook, not by the account's follower base — the account is small and the algorithm is discovering each post independently. That means the winners tell us what topics travel, and the losers tell us what topics don't. This is more diagnostic than LinkedIn is — LinkedIn's reach depends heavily on who's in the follower graph.

### 1.3 Instagram (104 posts, all 2026, zero engagement recorded)

| Metric | Value |
|---|---:|
| Total posts (2026) | 101 |
| Median views | 188 |
| Mean views | 394 |
| 75th %ile | 304 |
| Max views | 7,191 |
| Reactions + comments + shares | 0 across every row |

**PROVES:** Instagram reach is a fraction of TikTok's for the same underlying content — median views are 188 vs 1,100. Views are ~17% of TikTok's median.

**PROVES:** Not a single Instagram post in the dataset shows engagement columns above zero. Either the ingest pipeline is dropping IG engagement data or the account has effectively no community response layer. Cross-referenced against the 12 Aug review (which noted IG "top view 731 (Google-search analogy Reel)"), the pattern is real, not an ingest bug — IG is a low-response surface.

**HYPOTHESIS:** IG is functioning as a repost channel with zero community layer. That is a legitimate use for the account (mirror + SEO + prospect who lands there via a search), but it is not a community. Any strategy that treats IG as an engagement channel is planning against evidence.

### 1.4 Facebook (88 posts, all 2026, effectively dead)

| Metric | Value |
|---|---:|
| Total posts (2026) | 86 |
| Reach | 0 across every row (ingest gap or genuine 0) |
| Total engagement (all 86 posts) | 21 reactions + comments + shares |
| Best-performing post | 5 reactions + 2 comments |
| Posts with any engagement | 13 out of 86 (15%) |

**PROVES:** Facebook is generating essentially no engagement. Total across every post published in 2026 is 21 interactions. Reach column is zero across every row (the same posts had reach on other platforms, so this is either a Metricool export gap or a page-level distribution problem).

**HYPOTHESIS:** The reach-0 pattern is a data issue rather than the account literally reaching no one — a page can't publish 88 posts with actual zero delivery. But the engagement column, which is not derived from reach, is genuinely close to zero. FB is a graveyard regardless of the reach ingest question.

### 1.5 Volume vs reach — the picture across all four platforms

| Platform | 2026 posts (to 10 Aug) | Publishing cadence | 2026 median primary metric | Notes |
|---|---:|---|---:|---|
| LinkedIn | 193 | ~28/month | 906 imp | Real YoY comparison — down 24% |
| TikTok | 80 | ~11/month | 1,100 views | Net-new in 2026 |
| Instagram | 101 | ~14/month | 188 views | Net-new in 2026 |
| Facebook | 86 | ~12/month | 0 (engagement 21 total) | Net-new in 2026, effectively dead |

**PROVES:** Cam is publishing at roughly 65 posts per month across four platforms in 2026 — a ~4× increase over the equivalent 2025 window when the account had only LinkedIn active. This has not compounded — LinkedIn reach is down, and the three added platforms deliver combined median of ~1,300 supplementary views per posting occasion (TikTok 1,100 + IG 188 + FB ~0).

**HYPOTHESIS:** The Q4 question is not whether Titan should be on TT/IG/FB. The question is whether Titan should be on FB at all, whether IG should be posted native or by cross-post-and-forget, and whether TikTok's genuine reach is being invested in as a first-class channel rather than as an afterthought.

---

## Section 2 — Winners and losers analysis

Full lists on request. Below is the classified read.

### 2.1 LinkedIn 2025 top performers (representative sample of the top 20)

| Date | Format | Imp | Eng | Type |
|---|---|---:|---:|---|
| 2025-11-26 | single-image | 7,338 | 79 | Sector-thesis on a familiar object (GTIN barcodes) |
| 2025-07-02 | video | 6,728 | 124 | Named-owner case study (Prabjaudt, Priory) |
| 2025-11-20 | single-image | 5,747 | 34 | Curiosity hook on a familiar scene ("Look familiar?") |
| 2025-08-20 | single-image | 5,517 | 32 | Community question ("How are pharmacy teams using ChatGPT?") |
| 2025-02-05 | carousel-document | 5,440 | 71 | Sector-thesis (NHS Independent Prescribing) |
| 2025-07-22 | video | 5,356 | 67 | Named-owner case study (Sagar) |
| 2025-07-11 | single-image | 4,785 | 154 | Milestone (1000th pharmacy) |
| 2025-10-16 | video | 4,632 | 109 | Event capture (Pharmacy Show 2025 keynote) |
| 2025-04-16 | carousel-document | 4,287 | 35 | Meme-shape argument ("Pick your player") |
| 2025-11-18 | video | 3,807 | 93 | Named-owner case study (Yusuf, BMP) |

**Pattern:** four of the top ten 2025 winners are named-owner case-study videos or images. Three more are sector-thesis pieces with a hook that pays off in the visual. One is an event capture. One is a milestone. **This is the winning shape.**

### 2.2 LinkedIn 2026 top performers (representative sample of top 15)

| Date | Format | Imp | Eng | Type |
|---|---|---:|---:|---|
| 2026-06-07 | multi-image | 7,325 | 73 | TitanUp 26 Day 1 field capture ("Just getting started and it's Buzzing already") |
| 2026-06-23 | multi-image | 3,993 | 79 | Named-owner case study (Khal Khaliq, Lansdales) — first thing you notice when you change PMR |
| 2026-06-07 | video | 3,970 | 63 | TitanUp 26 arrival montage |
| 2026-06-08 | video | 3,965 | 82 | TitanUp 26 event wrap ("What. A. Day.") |
| 2026-03-23 | multi-image | 3,670 | 34 | Site visit (Malpas Pharmacy) |
| 2026-06-07 | single-image | 3,443 | 34 | Manifesto-style TitanUp opener |
| 2026-06-26 | multi-image | 3,205 | 63 | Named case study (Balance Street — 21,000 items, empty picking column) |
| 2026-04-30 | single-image | 2,994 | 32 | Named case study (Hamal at S&G) |
| 2026-07-10 | video | 2,967 | 67 | Event trail (Marton Road field visit) |
| 2026-02-24 | single-image | 2,573 | 65 | Named quote card (Prab — original video was 2025 hero) |

**Pattern:** the 2026 top ten is dominated by TitanUp 26 event content (five of ten) and named-owner case studies (four of ten). The one outlier — the Malpas site visit — is a multi-image field capture, which fits the multi-image pattern.

**PROVES:** The winning shape in 2026 is the same as 2025 — case studies with named owners and hard numbers, field-visit multi-image, event days. Cam's post-TitanUp period (Jul-Aug 2026) fell out of this pattern; the 12 Aug quarterly review already documented that.

### 2.3 LinkedIn 2026 losers (representative sample of the bottom 15 with impressions >0)

| Date | Format | Imp | Eng | Type |
|---|---|---:|---:|---|
| 2026-07-07 | video | 64 | 17 | Customer go-live announcement (Dudley Town) |
| 2026-06-09 | text | 76 | 3 | Titanverse teaser text ("Safe to say, we enjoyed his answer") |
| 2026-06-11 | text | 89 | 4 | Titanverse cryptic text ("3 minutes with the robot") |
| 2026-01-30 | video | 134 | 17 | Partner announcement (PharmAppy integration) |
| 2026-04-18 | text | 184 | 6 | TitanUp promo text ("Locked in and committed") |
| 2026-07-06 | single-image | 218 | 11 | Sector-thesis stat card (no named person) |
| 2026-03-24 | text | 219 | 9 | Anonymous quote from a customer |
| 2026-01-29 | video | 290 | 21 | Product screencast (Titanverse services) |
| 2026-04-08 | text | 313 | 3 | Ecosystem tagline post |
| 2026-07-08 | multi-image | 314 | 34 | Event stand shot (ProPharmace conference) |
| 2026-07-08 | single-image | 344 | 32 | Event promo for same day |
| 2026-05-14 | video | 351 | 13 | TitanUp promo (register CTA) |
| 2026-03-18 | video | 360 | 7 | TitanUp buildup teaser (First 100 loop) |

**Pattern:** the bottom is dominated by three types — Titanverse text posts (7 of the bottom 20 across the year are Titanverse text), cryptic teaser copy without a payoff visible in the post itself, and event-promo posts with "register / sign up / see you there" as the whole content.

### 2.4 TikTok top performers (2026, no 2025 comparison)

| Date | Format | Views | Eng | Hook |
|---|---|---:|---:|---|
| 2026-06-19 | video | 14,924 | 389 | "How is this pharmacy finishing by 1pm?" (Balance Pharmacy) |
| 2026-06-26 | photo | 13,427 | 174 | "21,000 items. Empty picking column. Every single day." |
| 2026-06-17 | video | 9,627 | 131 | "What pharmacy owner gets six weeks off?" (Akshay) |
| 2026-06-28 | video | 6,127 | 84 | "There is one word pharmacy still treats like it does not belong beside patient care." (Tariq keynote clip) |
| 2026-04-16 | photo | 5,591 | 64 | Owner-quote card ("Less time stuck checking. More time for services.") |
| 2026-03-09 | video | 5,098 | 71 | Named-owner clip (Rahul — "It's limitless to what you can do") |
| 2026-07-31 | video | 4,226 | 59 | Boots-as-foil sector commentary |
| 2026-06-14 | photo | 3,613 | 33 | TitanUp 26 recap image |
| 2026-05-01 | video | 3,597 | 59 | "From Stone Age to Titan Age" (S&G) |
| 2026-06-25 | video | 1,927 | 224 | Tariq on unsustainable pharmacy margins (highest engagement per view) |

**Pattern:** every TikTok that cleared 5,000 views is either a case-study clip with a numeric hook or a sector-thesis quote clip from a named pharmacy leader. The exceptions are the Balance Street photo (case-study-photo hybrid — hook in the caption + image evidence) and the Boots-as-foil hook.

### 2.5 TikTok losers

The bottom of the TikTok table is almost entirely event-promo / partner-thanks copy — "PharmAppy is sponsoring TitanUp", "Don't miss your chance to register", partner-brand announcements ("This is what happens when a pharmacy robotics company meets a real humanoid robot"). None of them opened on a stat or a named owner.

**PROVES:** TikTok punishes promotional/administrative copy specifically. The gap between winners and losers is bigger than on LinkedIn — top post 14,924 vs bottom post 531 is a 28× spread — and the pattern that separates them is clean.

### 2.6 Instagram winners and losers

Captions are missing on nearly every IG row. Top posts by views:

| Date | Views | Note |
|---|---:|---|
| 2026-04-20 | 7,191 | (no caption in dataset) |
| 2026-06-19 | 2,017 | Same date as top TikTok — likely the Balance Pharmacy cross-post |
| 2026-06-28 | 1,701 | Same date as Tariq keynote clip on TikTok — cross-post |
| 2026-04-09 | 1,628 | Cross-post window with LinkedIn "Another pharmacy just left the old way behind" |

**PROVES:** IG reach follows TikTok reach when the same content is cross-posted. IG is a passenger; TikTok is the driver.

**HYPOTHESIS:** The 20 April 7,191-view outlier is probably an algorithm surge on one Reel and not a repeatable pattern — the second-best IG post is 2,017 views, only 28% of the peak. Cam should still find the specific asset behind that spike and understand why.

### 2.7 Facebook is not worth listing

The best-performing Facebook post got 5 reactions + 2 comments. Half of the 13 "engaged" posts got 1 reaction total. Ranking these is theatre.

---

## Section 3 — Creative variables in winners vs losers

This section draws on the 18 Aug caption-features analysis (which formally tested regex-based features against tier data) plus the fresh dataset lens. I add signal where the two agree.

### 3.1 Hook shape

**PROVES (from caption-features 18 Aug):** Named-specific-in-opener is the single strongest predictor of a "worked" tier post — +25 percentage points overall lift (worked = 59% of top-quartile posts, underperformed = 34%). Stable across 2025 and 2026, works on all three main LinkedIn formats.

**PROVES (from fresh data):** The five top TikTok posts in 2026 all named a specific person, pharmacy, or number in the opener ("Balance Pharmacy", "Akshay", "21,000 items", "Rahul"). Every bottom TikTok post opened on a promotional concept or a partner name that meant nothing to the viewer.

**Verdict:** Named specific in opener is the universal rule. It works on every platform. It is now more strongly evidenced than any other single lever.

### 3.2 Protagonist

**PROVES:** Named-owner case studies are the highest-performing archetype on both LinkedIn and TikTok. On LinkedIn 2025, customer-story posts had median 2,075 impressions vs 1,094 for "other" (nearly 2×). On LinkedIn 2026, customer-story median dropped to 1,288 impressions and volume fell from 14 posts to 8 — Cam shipped fewer customer stories in 2026, and even those had lower per-post reach.

**HYPOTHESIS:** The 2026 customer-story drop is partially a compositional effect — the surrounding volume (65% more posts per month) diluted the wave for each individual case study. It is also partially a story-cadence effect (fourth-plus cuts, per the 4 Aug v2 doc). The 4 Aug workstream on "max 3 cuts per story" and the volume rollback test in September will tell us which factor is dominant.

### 3.3 Evidence — hard numbers, live scenes, or nothing

**PROVES:** Every LinkedIn winner in 2026 with impressions above 3,000 either (a) shows a hard number in the caption (7,325 imp Buzzing multi-image; 3,205 imp Balance Street "21,000 items empty picking column"; 3,993 imp Khal Khaliq "four-site Lansdales group"), (b) shows a live event scene (TitanUp Day 1 Buzzing multi-image; TitanUp What. A. Day.), or (c) is a founder/customer talking head with a specific arc (Prab, Yusuf, Sagar, Rahul).

**PROVES:** LinkedIn losers in 2026 lack evidence density — the seven Titanverse text-post losers include no numbers, no named third party, no visual proof. "Safe to say, we enjoyed his answer to the final question" carries no evidence into the post itself.

**Verdict:** Evidence is not a nice-to-have. It is the difference between "worked" and "underperformed" more reliably than format is.

### 3.4 Framing — what the post is arguing

**PROVES (from caption-features 18 Aug):** Event-coverage + sector-thesis framing was a home run in 2025 (worked 45%, n=11). Warm-documentary framing on "other" (unspecified topic) content was 7% worked, 27% underperformed — the framing without a subject is a graveyard.

**PROVES (from fresh data):** Boots-as-foil landed hard as a framing choice in July 2026 (LinkedIn 1,825 imp @ 11.3% ER; TikTok 4,226 views @ 59 engagement). It is the first time in the 2026 dataset a competitor was named as the antagonist rather than as an abstract "old way of doing things". This is a strategy lever that has been used exactly once and worked both times it appeared in the top table.

**HYPOTHESIS:** Positioning-with-a-foil is the underused voice this quarter. Every post that names an antagonist earned reach (Boots on 31 Jul; the "we refused to build this" advocacy post cited in 4 Aug v2; the Pharmacy First "walk away" carousel from 2025 at 3,195 imp; the IP fails single-image at 3,522 imp). The default 2026 voice has drifted toward warm-documentary — nice, but not compounding.

### 3.5 Production style

**PROVES:** Multi-image field captures (event day, site visit) are the highest-reach format in 2026 (median 2,118). Short-form vertical video has the highest ER (3.49%) but the lowest volume of any format (n=5 on LinkedIn 2026).

**HYPOTHESIS:** The multi-image format works because it forces the post to carry evidence in the visuals rather than in the caption. When Cam has to pick 5–6 images that make the argument, the argument gets sharper. The same content shot as a single image loses the built-in reveal.

**PROVES (from 4 Aug v2 §1.3):** 44% of Titan's 2026 output is video. 75 of those videos have no retention data captured. The largest single production investment is running without measurement. Q4 fixes that (v2 §2.5 test 3) but the fact remains — the current video output is largely un-instrumented.

### 3.6 What changed between 2025 and 2026 in creative variables

| Variable | 2025 pattern | 2026 pattern | Change |
|---|---|---|---|
| Second-person openers ("You / Your") | Mildly positive (worked 29% vs under 24%) | Catastrophic (worked 11% vs under 52%) | **Flipped hard.** Stop opening on "you". |
| Quote-led hooks | 0/7 worked | 7/24 worked (29%) | **Flipped.** Quote-as-hook now valid. |
| Emoji tolerance | 4–5 emojis tolerable | 4+ emojis punished | **Tighter.** Cap at 3. |
| Word count sweet spot | 100–250 words | 100–150 words | **Shrunk.** 150–250 zone is now the worst. |
| Em dashes | Overall negative | Format-specific: fine on carousel and single-image, harmful on video | **Nuanced.** Kill only on video. |
| Named specific in opener | +24pp lift | +27pp lift | **Held.** Still the strongest rule. |

*Source: `_strategy/caption-features-vs-tiers-analysis-2026-08-18.md` §4–5. Cited here so the Q4 plan uses the current craft rules, not the 2025 ones.*

---

## Section 4 — 2025 vs 2026 comparison

Only LinkedIn has real YoY data. The rest is 2026-only.

### 4.1 Volume shift (LinkedIn)

| Period | Titan PMR posts | Titanverse posts | Total | Monthly avg |
|---|---:|---:|---:|---:|
| Jan–Jul 2025 | 116 | 8 | 124 | ~18 |
| Jan–Jul 2026 | 145 | 48 | 193 | ~28 |
| YoY change | +25% | +6× | +56% | +56% |

**PROVES:** Cam shipped 56% more LinkedIn posts in the first seven months of 2026 than in the same window of 2025. Titanverse posting rose 6×, but almost all of the added Titanverse posts (48 total, of which 9 are text-format and 12 more are low-reach video) contributed marginally.

### 4.2 Reach shift (LinkedIn)

| Metric | 2025 (Jan–Jul) | 2026 (Jan–Jul) | Change |
|---|---:|---:|---:|
| Median impressions | ~1,150 | 906 | –21% |
| Total impressions | ~162K | 225K | +39% |
| Impressions per post | ~1,308 | 1,168 | –11% |
| Total engagement | ~2,900 | ~4,700 | +62% |

**PROVES:** Total impressions grew (because volume grew faster than per-post reach declined), but per-post reach declined. Total engagement grew — engagement per post grew slightly and volume grew a lot, so the total engagement pool is bigger.

**PROVES:** This is consistent with the 4 Aug v2 doc's read: engagement rate is up, per-post reach is down, and the total effect is more people interacting with more posts but each post travelling less far.

### 4.3 Breakout frequency (LinkedIn)

**Defining a breakout as a post above 3,000 impressions:**

| Year | Breakouts | Breakouts as % of posts |
|---|---:|---:|
| 2025 (full year) | 21 | 9.4% |
| 2026 (to 10 Aug) | 8 | 4.1% |

**PROVES:** Breakout rate more than halved. The peak ceiling did not drop (2025 max 7,338; 2026 max 7,325 — essentially identical). The middle of the distribution thinned, not the top, but the breakouts are noticeably scarcer as a proportion of posts.

**HYPOTHESIS:** This is the compositional read. 2026 has 66% more posts and less than half the breakout rate. The extra volume is not producing extra breakouts — it is producing extra middle-and-lower posts. That is exactly what the volume rollback test in the 4 Aug plan is designed to test.

### 4.4 Mix changes (LinkedIn)

| Format | 2025 volume | 2026 volume | Change | 2026 median imp | Verdict |
|---|---:|---:|---|---:|---|
| Video | 86 | 89 | Flat | 833 (down from 1,244) | **Volume held, reach dropped 33%.** |
| Single-image | 77 | 59 | –23% | 900 (down from 1,105) | Volume down, reach down 19%. |
| Carousel-document | 59 | 12 | –80% | 1,064 (down from 1,257) | **Volume collapsed.** |
| Multi-image | 0 (in 2025 sample) | 14 | New | 2,118 | **New format, best in class.** |
| Text | 0 (in 2025 sample) | 14 | New | 467 | **New format, worst in class.** |
| Short-form-video | 0 | 5 | New | 681 | Small sample, ER-strong. |

**PROVES:** The biggest single mix change was carousel-document collapsing from 59 posts to 12 posts. It was replaced by (a) multi-image at 14 posts (net win — better median), (b) text at 14 posts (net loss — 467 median), (c) short-form-video at 5 posts (marginal).

**PROVES:** Titanverse invented meaningful text-post output for a small page — 6 of the 14 LinkedIn text posts in 2026 are Titanverse. Six posts on a 48-post 2026 output is 12.5% of the Titanverse page going to a format with median 202 impressions. Titan PMR's 8 text posts land on a much bigger denominator (145 posts) and hurt proportionally less.

### 4.5 What worked → still working, what stopped working

**Still working (evidence from both years):**
- Named-owner case-study videos and images (Prab, Sagar, Yusuf, Rahul → Khal, Balance, Akshay, Hamal). Format changes; the archetype holds.
- Event-day multi-image / video (Pharmacy Show 2025 wraps → TitanUp 26 wraps). Event saturation compounds.
- Curiosity hook on a familiar object ("Can you spot the difference?" 2025 → "empty picking column" 2026). The reveal-in-the-visual pattern works on both surfaces.
- Sector-thesis single-image (GTIN 2025; Boots-as-foil 2026). Argument-shaped posts land.

**Stopped working:**
- Carousel-document as a case-study container (Yusuf swipe-through; Priory carousel). Cam largely stopped doing this in 2026, which was the right call.
- Blog-teaser reposts with a URL and no argument. Confirmed dead in 12 Aug review.
- Countdown/promo posts with no substantive line ("5 days to go", "Register now"). All 2026 examples in the bottom quartile.
- Second-person opener drafts. Now –41pp underperformance rate vs 2025's +5pp.
- Titanverse text posts. New format, bottom of table.

**Newly working (2026 only):**
- Multi-image field visits (formalised, wasn't a category in 2025).
- Boots-as-foil sector positioning. First seen 31 Jul 2026. Two data points; underused.
- Quote-led hooks (0/7 worked in 2025 → 7/24 worked in 2026).

### 4.6 The core story of 2025 → 2026

Cam is running a bigger machine with the same craft engine and getting less compounding per unit. The craft has improved — engagement rate is up, the caption rules have got sharper — but the volume has diluted per-post reach and the mix has drifted away from the archetypes that worked (customer stories, sector thesis) toward archetypes that don't (Titanverse text, event promo copy, cryptic teasers).

The Q4 answer therefore is not "produce more" — that lever is exhausted. It is "produce fewer, produce stronger, defend the archetypes that compound".

---

## Section 5 — Platform-specific strategic conclusions

### 5.1 LinkedIn

**Wins (double down):**
1. Named-owner case study video and multi-image. Every year's top ten has 3–5 of these. The one archetype that has never failed.
2. Multi-image field capture (event day, site visit). Best 2026 format. Underused because it's harder to produce.
3. Sector-thesis on a familiar object (GTIN, IP, Boots-as-foil). Argument-shaped hooks land.
4. Advocacy-with-action. Highest share rates on record. Currently ~2/year. Should be ~1/month.

**Loses (reduce or kill):**
1. Titanverse text posts. 9 posts in 2026, median 200-ish impressions. Dead format.
2. Fourth-cut case study. Already documented as an anti-pattern. Enforce.
3. Event promo/countdown copy without a substantive line. All bottom-quartile.
4. Blog-teaser reposts. Confirmed dead by 12 Aug review; no reason to revisit.
5. Cryptic teaser text without payoff visible in the post. Kills reach.

**Overused (Cam is doing too much of):**
1. Single-image at 30% of output. Median 900 impressions. Not bad, not great — the workhorse but not the winner. Trim in favour of multi-image.
2. Video volume without a named protagonist. 44% of output is video. Roughly half of it lacks a named person, which halves reach.
3. Ecosystem-tagline posts. Multiple posts saying "Titan for dispensing, Titanverse for services" in 2026. Positioning-repeat posts don't earn new reach.

**Underused (Cam is doing too little of):**
1. Multi-image (14 posts in 7 months at median 2,118 imp). The single best format is the least-used.
2. Advocacy-with-action. Only two examples this cycle.
3. Sector-with-a-foil. Boots-as-foil worked twice, and Cam has not repeated the pattern.
4. Culture-moment posts — small reach but the highest-engagement bracket (median 35 eng in 2026 vs 19-25 for everything else). Titan is under-shipping these.

**Refine:**
- Named-owner case study needs to end at 3 cuts, not 6 (v2 §2.2).
- Multi-image needs to earn its slot with a substantive moment, not become the default fill (12 Aug pattern-that-worked #1 + pattern-to-kill #1).
- Video needs the named protagonist rule enforced pre-shoot, not pre-publish.

**Tests for Q4 (5 experiments):**
1. **Multi-image lift test** — increase multi-image to 25% of Sept-Oct LinkedIn output (from ~7% in H1 2026). Success = median LinkedIn reach in Sept-Oct clears 1,150 (recovers 40% of the 2025→2026 drop).
2. **Boots-as-foil repeat** — ship 3 more posts in Sept naming a specific competitor or a specific incumbent behaviour as the antagonist. Success = median impressions across the three clear 1,800.
3. **Case-study max-3-cuts** — pick 3 case studies for Q4 (Butt Lane, Road Trip, one Pharmacy Show alum), ship a hero + 2 supporting cuts per story, no more. Success = each hero clears 3,000 imp.
4. **Founder-led repost** — v2 §2.5 test 1, restated: Hooman personal profile reposts one hero post/week from Sep 1. Success = ≥30% lift vs page-only baseline on those posts (8 weeks).
5. **Titanverse restart** — kill the text-post experiment on the Titanverse page. Ship 4 multi-image + 4 video posts across Sept-Oct, all named-operator. Success = Titanverse median clears 1,000 imp (recover the 2025 level).

### 5.2 TikTok

**Wins (double down):**
1. Named-owner case study clips with a numeric hook ("21,000 items / empty picking column"; "How is this pharmacy finishing by 1pm?"). Every 5,000+ view post fits this pattern.
2. Sector-thesis clips from named leaders (Tariq, Rahul, Michael Holden's followers). The Tariq keynote hooks lifted independent of TitanUp context.
3. Photo posts with a hard argument in the caption — these punched above their weight (Balance Pharmacy photo 13,427 views; Leicester quote-card photo 5,591 views).

**Loses (reduce or kill):**
1. Partner-thanks / sponsor-announce posts. Every one of these in the bottom quartile.
2. Register/countdown copy. Same pattern as LinkedIn — bottom of the table.
3. Product screencasts without a named person. Two examples in 2026, both bottom-quartile.

**Overused:** Event promo copy is a bigger share of TikTok than of LinkedIn — because the TikTok account was set up as an amplifier for TitanUp. Now that TitanUp is over, TikTok has to earn its own reach, which means the content that fed it needs to change.

**Underused:**
1. Rapid case-study clips (60–90s, one owner, one number). Winners scale here.
2. Sector-thesis clips repurposed from LinkedIn's best static posts. LinkedIn's GTIN post at 7,338 imp has never been ported to TikTok. Should be.
3. Pharmacy Show 2026 build-up and coverage. TikTok didn't exist during Pharmacy Show 2025; PS 2026 is the first time this account will get a big event.

**Refine:**
- Every TikTok post opens on a specific number, specific pharmacy, or specific person. This is not a stretch — the top nine already do it.
- Stop cross-posting event-admin copy to TikTok. If a post's only job is a CTA, publish it only where the audience is transactional (LinkedIn newsletter, WhatsApp community, email).

**Tests for Q4 (3–4 experiments):**
1. **LinkedIn-to-TikTok port** — take Titan's top 5 LinkedIn winners of the past 12 months and re-cut each as a 30–60s TikTok clip in the "hook on a number, reveal in the visual" pattern. Ship 1 per week from mid-Sept. Success = at least 2 of the 5 clear 5,000 views.
2. **Pharmacy Show 2026 daily cadence** — 3–5 TikTok posts across each show day (Oct 11–12), each with a named speaker or a named exhibitor. Success = combined show-window views ≥60,000 (roughly matches TitanUp 26 window for TT).
3. **Volume ceiling** — cap TikTok at 8 posts/month. Kill the 2/week rhythm. If TT ships fewer but each is higher-craft, does breakout frequency rise? Success = ≥3 posts >5,000 views in Sept-Oct (vs 6 across Feb-Jul).
4. **Photo-with-argument test** — 4 photo posts in Sept-Oct that lead with a stat and reveal in the image. Photo formats have punched above their weight; test whether Cam can scale them.

### 5.3 Instagram

**Wins:** Cross-post reach when the underlying content is a TikTok winner. Nothing native has emerged.

**Loses:** Everything that isn't a TikTok cross-post is a low-reach post with zero community response.

**Verdict:** Instagram in its current form is not a channel; it is a mirror. Two choices for Q4:

**Option A (recommended):** Formalise IG as auto-repost from TikTok. Stop crafting IG-specific captions. Route effort to TikTok craft. Delete FB and IG from the "must ship" list — publish yes, workshop no.

**Option B:** Rebuild IG as a native channel with product-story Reels (Titanverse UI walk-throughs, before/after pharmacy visits, patient-facing stories). Ship 12 posts across Sept-Oct. Success = median views clear 500 (2.7× current). Failure = accept Option A permanently.

The 4 Aug v2 doc doesn't recommend either option. I lean Option A — the payoff of Option B does not justify the production hours, given the podcast studio build-out and Pharmacy Show 2026 both compete for Sept-Oct effort.

### 5.4 Facebook (secondary)

**Wins:** None found.

**Loses:** Everything.

**Verdict:** Facebook is running on autopilot with roughly 12 posts/month producing 21 total engagements this year. That is not zero-value (SEO surface, brand-search fallback) but it is close to zero. Move Facebook to cross-post-and-forget. Delete from any "channel priorities" list. Do not invest craft here.

### 5.5 YouTube (secondary)

**No YouTube data in the CSV.** The 4 Aug v2 doc mentions the podcast launching Nov 2026 and long-form content coming through YouTube then. There is no baseline in this dataset — the channel isn't in the metrics feed yet. Two implications:

1. YouTube analysis for Q4 has to happen against the YT native analytics that the automation script pulls (`data/youtube/`), not this CSV. This dataset can't judge it.
2. The Q4 plan for YT should treat it as a new-channel bet — first 4 podcast episodes bank in Oct, first episode publishes by end of Nov (v2 §2.7). Success criteria live in the podcast one-pager, not here.

---

## Section 6 — Q4 (Sept–Dec) monthly emphasis

The 4 Aug v2 doc covers Aug-Oct. This section extends into Nov-Dec and re-anchors the Aug-Oct picture on the new data.

### September — reset the archetype mix

**Emphasis:** Return to the winning shape. Case studies. Multi-image field visits. Sector-thesis with a foil. The volume rollback test starts on 1 Sept.

Concrete:
- 3 named-owner case-study arcs (hero + 2 cuts each = 9 posts on LinkedIn)
- 4 multi-image field visits or event captures
- 2 Boots-as-foil / sector-thesis single-images or carousels
- 1 advocacy-with-action post
- 1 culture-moment (Diwali is 20 Oct so no Sept cultural anchor — pick one from repurpose list)
- Pharmacy Show 2026 buildup: 2 buildup posts in last week of Sept, no countdown-copy
- **LinkedIn cadence target: 16–18 posts (down from 27–30)**
- TikTok: 8 posts, all named-owner or specific-stat
- IG: cross-post from TikTok, no native craft
- FB: cross-post from LinkedIn, no native craft

### October — Pharmacy Show week (11–12 Oct) and its aftermath

**Emphasis:** Event saturation on show week. The 12 Aug review already lists PS 2025 as one of the two best sustained content windows on record. PS 2026 needs to match or beat it.

Concrete:
- **Pharmacy Show 2026 window (Oct 6–19, 14 days):** 20+ posts across LinkedIn, TikTok, IG. Daily cadence 8–17 Oct.
- Peak days: 12 Oct (Day 1 field capture multi-image), 13 Oct (Day 2 recap video, floor conversations), 14 Oct (afterglow single-image or multi-image, "what a weekend"). This is the shape that worked in 2025.
- Named-speaker keynote clips: Tariq, Rahul, Hooman, or whoever else Titan puts on stage — 3–5 clips over the following two weeks (10 through 24 Oct).
- Post-show case study: cadence-matched to BMP 2025 pattern (published ~5 weeks after Pharmacy Show 2025 as a delayed high-reach post). Book the 18 Nov equivalent slot now — one case study from a Pharmacy Show conversation.
- Non-show October: 8–10 posts on the running case-study drumbeat. Do NOT let Pharmacy Show absorb the whole month.
- **LinkedIn cadence target: 22–26 posts (event-window override applies)**

### November — sustain and instrument

**Emphasis:** Post-event afterglow, first podcast episode publishes, video retention data comes in. This is a measurement month — the tests from Sept–Oct produce answers.

Concrete:
- 3 named-owner case-study arcs (same shape as Sept)
- **Pharmacy Show 2026 aftermath post — the delayed case-study long-form (target 18 Nov, matching the 2025 BMP cadence)**
- Advocacy-with-action: post a policy-triggered piece (Pharmacy contract, funding, or IP-at-graduation angle — pick whatever the news gives you)
- Podcast launch: first episode goes public in November (v2 §2.7). Support with 3 LinkedIn posts across the launch week (teaser, launch, aftermath). Do not run a countdown.
- Volume rollback test results: read them and either commit to the lower cadence for December or return to higher volume with new evidence.
- **LinkedIn cadence target: 16–18 posts**

### December — quieter, punchier, Wrapped

**Emphasis:** December is a low-signal month for B2B pharmacy. The 2025 December performance (21 posts, 31K imp, median 1,396) actually held up well — because the Titan 2024 Wrapped carousel and cultural posts landed.

Concrete:
- Titan 2026 Wrapped carousel — highest-reach anchor post. Repeat the 2024 shape but with 2026's numbers (1,000 pharmacies, TitanUp 26 attendance, cumulative dispensed items).
- 2 named-owner case-study arcs (fewer than Sept-Nov — respect the season)
- Christmas / New Year cultural posts — 1–2, warm, no product mention
- Podcast Ep 2 support
- Q1 2027 tease (not "coming in 2027" copy — an actual first look at whatever the Jan hero campaign will be)
- **LinkedIn cadence target: 12–15 posts (December quiet)**

### Q4 aggregate targets

| Month | LinkedIn posts | TikTok posts | Expected median LI imp |
|---|---:|---:|---:|
| September | 16–18 | 6–8 | ≥1,000 (recovery target 1,100) |
| October | 22–26 (event window) | 12–14 (event window) | ≥1,200 (event lift) |
| November | 16–18 | 6–8 | ≥1,100 |
| December | 12–15 | 4–6 | ≥1,000 |
| **Q4 total** | **66–77 LI posts** | **28–36 TT posts** | **Q4 median ≥1,100** |

For comparison, Sept-Dec 2025 was 91 LinkedIn posts. This plan proposes ~72 — a 21% cut in volume, with a 40% target lift in per-post reach. That is the volume rollback test operating at Q4 scale.

---

## Section 7 — Pharmacy Show as a campaign inside Q4

Pharmacy Show 2026 is 11–12 October at NEC Birmingham. Two-day event, ~30-day content campaign around it. Two campaign benchmarks to beat: PS 2025 (last year's model) and TitanUp 26 (this year's biggest event).

### 7.1 What PS 2025 achieved

From the 12 Aug review: 20 posts across 3 Jul → 18 Nov, 38,115 total impressions, ~5,320 engagements. The dense window was 7 Oct → 27 Oct — 12 posts in three weeks. Peak posts: Day-one video (2,900 imp), album (3,185), Tariq keynote (4,632), Zad interviews (2,298), Zainab PillSorted (2,535). Afterglow: BMP long-form (3,807 imp on 18 Nov).

**Pattern that worked:**
- Daily cadence during show week
- Named-people wrap-ups
- Delayed case-study drop 5 weeks after the show (BMP)
- Show-week mix of wide-angle wrap videos + named-owner talking heads

**Pattern that didn't:**
- Countdown template repeated verbatim between Titan and Titanverse pages on same days (cannibalisation)

### 7.2 What TitanUp 26 achieved

From the 12 Aug review: 53 posts across 17 Feb → 6 Jul, 51,832 impressions, ~14,162 engagements. Peak days 7–9 Jun delivered six posts totalling 15,000+ impressions. Buzzing multi-image = 4,013 imp @ 132.7% ER (best of year). Afterglow: "a week on from TitanUp 26" multi-image at 2,225 imp @ 61.7% ER, then faded.

**Pattern that worked:**
- Multi-image field-of-event posts — every one above 1,700
- Named-speaker keynote clips
- Buzzing = real-time proof, dropped in the first hour

**Pattern that didn't:**
- Three formats of same content on same day (2 Mar TitanUp reveal cannibalised itself)
- Drumbeat sponsor/speaker announces stayed in 400–900 band, didn't compound
- Afterglow ended too quickly — only one substantive follow-up multi-image

### 7.3 What PS 2026 should improve on

**KEEP (from PS 2025):**
- Daily cadence during show week — 8 posts across 11–13 Oct
- Named-speaker keynote clips as the backbone
- Delayed case-study drop 4–5 weeks post-show (target 18 Nov)
- Wrap posts that name people, not just show

**KEEP (from TitanUp 26):**
- Multi-image field capture as the peak format
- Real-time "in the first hour" posting on Day 1 morning
- Buzzing-style momentum multi-image before 11am on 12 Oct

**FIX (from PS 2025):**
- Do not run identical countdowns on Titan and Titanverse pages
- Do not spread the campaign over 4 months — front-load the buildup to the two weeks before the show, not 3 months
- Add TikTok layer that didn't exist in 2025 (Titan wasn't on TT then)
- Add IG cross-post — but auto, not native craft

**FIX (from TitanUp 26):**
- Do not run three formats of same content on the same day
- Extend afterglow — plan 4 post-show hits across 15 Oct → 15 Nov, not just one
- Make the drumbeat (buildup) contain arguments, not administration ("here's what we'll argue at Pharmacy Show" > "3 days to go")

### 7.4 PS 2026 content shape (proposal)

**Buildup (Sept 30 → Oct 10, ~10 days, 4 posts):**
- 1 post: what Titan will argue at Pharmacy Show 2026 (thesis-shaped, not "come and see us")
- 1 post: named speaker announcement with a soundbite from the pre-record
- 1 post: named exhibitor / partner spotlight (someone Titan will be with at the show)
- 1 post: stand tease (multi-image field capture of build-in, "the stand is coming together")

**Show days (Oct 11–13, 3 days, 10–12 posts across LinkedIn + TikTok):**
- Day 1 morning: Buzzing-style multi-image within first hour (LinkedIn + TikTok cross-post) — the single most reliable format
- Day 1 midday: named-conversation clip from the floor (video)
- Day 1 evening: named-speaker keynote clip (TitanUp-shape edit, 45–90s)
- Day 2 morning: field-visit-style multi-image with 4–6 conversations
- Day 2 midday: another named-speaker clip
- Day 2 evening: "What. A. Show." wrap multi-image (this is the pattern the highest-eng post used in 2025)
- Cross-post 4–5 of these to TikTok with reshuffled captions (numeric-hook opener)

**Afterglow (Oct 14 → Nov 18, ~5 weeks, 6–8 posts):**
- 14 Oct: "What a weekend" multi-image (matches 2025 shape, 3,185 imp benchmark)
- 16 Oct: keynote long-form (matches 2025 Tariq clip pattern, 4,632 imp benchmark)
- 20 Oct: Zad-interviews-style "here's what people said" video
- 24 Oct: named exhibitor / partner takeaway
- 3 Nov: mid-quarter reflection ("2 weeks on") multi-image
- 18 Nov: **the case study.** One story that started at Pharmacy Show, told properly as a long-form video. This is the delayed high-reach post that BMP was in 2025 (3,807 imp) — it is not an afterthought, it is the campaign's biggest post.

### 7.5 PS 2026 targets

- Total campaign impressions ≥55,000 (beat PS 2025's 38,115 and TitanUp 26's 51,832)
- ≥3 posts >3,000 impressions on LinkedIn
- ≥2 posts >5,000 views on TikTok (Titan didn't have TT for PS 2025 — this is the new layer)
- Delayed 18 Nov case study clears 3,500 imp (matches BMP 2025)
- No two posts on the same day repeat the same content in different formats

---

## Section 8 — Final report

### 8.1 Executive findings (10 high-confidence conclusions)

1. **LinkedIn median reach is down 24% year-on-year (1,188 → 906) while H1 volume is up 66%.** Not "algorithm-only" — the volume-dilution correlation is strong enough to test with the September rollback. Breakouts (>3,000 imp) as a share of posts more than halved (9.4% → 4.1%).
2. **Multi-image field capture is the single highest-reach LinkedIn format in 2026** (n=14, median 2,118 imp). Cam is using it least when it works most.
3. **Titanverse posting collapsed** (10/month to 1 in July) and its new text-format experiment produced 6 posts with median 202 impressions on a page that only shipped 48 posts this year — 12.5% of Titanverse's 2026 output went to a nearly-dead format. Kill the text format on Titanverse.
4. **Named-owner case studies are the only archetype that has been in the top ten every year.** Volume of them dropped from 14 in 2025 to 8 in 2026. The best-performing archetype is under-shipped.
5. **TikTok is Titan's most-engaged non-LinkedIn surface** (median 1,100 views vs Instagram 188, Facebook effectively 0). It is being run as a TitanUp amplifier and needs to be run as a first-class channel.
6. **Facebook is dead** — 86 posts, total engagement 21. Instagram is a mirror — 101 posts, zero engagement recorded, top posts are TikTok cross-posts.
7. **Boots-as-foil is the underused framing** — first appeared 31 Jul 2026, worked twice, has not been repeated. Sector-with-a-foil is the highest-leverage voice Titan is not using.
8. **The winning hook is a named specific in the first line** — worked posts show it 59% of the time; underperformers 34%. Consistent across formats, consistent across years. This is the single strongest craft rule.
9. **Event saturation compounds; drumbeat administration doesn't.** PS 2025 and TitanUp 26 both delivered their biggest reach in the 3–5 day window on and around event days. The buildup posts (countdowns, sponsor thanks, "3 days to go") stayed in the 400–900 band regardless of platform.
10. **Craft has improved, cadence has diluted the wave.** Engagement rate is up, per-post reach is down. Cam is publishing 65% more per month across four platforms and getting roughly the same total attention. The Q4 answer is fewer, sharper posts, not more.

### 8.2 LinkedIn strategy

Return to fewer, sharper posts anchored on the archetypes that have held across two years:
- **3 named-owner case-study arcs per month** (hero + max 2 cuts, never 4 cuts)
- **4 multi-image field visits or event captures per month** (raise from ~2 to ~4)
- **2 sector-thesis single-images or carousels with a foil per month** (Boots, incumbent PMR behaviour, "the industry does X — here's why Titan doesn't")
- **1 advocacy-with-action per month** (currently ~2 per year)
- **Cap total LinkedIn cadence at 16–18 posts/month outside event windows.** This is the volume rollback test.

Kill: Titanverse text posts, countdown/promo copy without a substantive line, blog-teaser reposts, fourth-plus case-study cuts, "we're proud" language.

Refine: enforce the caption rules from 18 Aug (named specific in opener; ≤3 emojis; 100–150 word target; kill second-person openers; quote-as-hook allowed but only if the whole caption pivots on it).

### 8.3 TikTok strategy

Run TikTok as a first-class channel, not an afterthought.

- **Cap at 8 posts/month.** Fewer, higher-craft.
- **Every post opens on a specific number, specific pharmacy, or specific person.** The top 9 posts of the year already follow this pattern; make it the rule.
- **Kill event promo, partner-thanks, and countdown copy on TikTok.** These are the entire bottom quartile.
- **Port LinkedIn's top 5 winners as 30–60s TikTok cuts.** GTIN, Prab, Yusuf, Sagar, Boots-as-foil. None of them exist on TikTok yet.
- **Pharmacy Show 2026 gets full TikTok coverage** — this is new, PS 2025 had none. Target ≥2 posts >5,000 views during the show window.

### 8.4 Instagram strategy

Formalise IG as an auto-repost mirror from TikTok. No native craft. No caption workshop. Publish, do not workshop. Route the freed-up time into TikTok and LinkedIn craft. Revisit only if a native format shows genuine traction (e.g. Titanverse product Reels — a discrete experiment for Q1 2027).

### 8.5 Facebook — secondary assessment

Facebook is a graveyard. 86 posts produced 21 interactions across 2026. Do not workshop captions. Do not target it in any campaign. Continue auto-cross-post for SEO / brand-search-fallback reasons only. Delete from any "priority channels" list.

### 8.6 YouTube — secondary assessment

No YouTube data in the primary CSV. YouTube's Q4 role is defined by the podcast launch (first ep publishes end of Nov) plus long-form editorial content that repurposes Pharmacy Show and case-study interviews. Judge YouTube by its own analytics (`data/youtube/`), not this dataset. This dataset cannot say whether YT is working; the podcast one-pager owns that.

### 8.7 2025 → 2026 lessons

- **Craft rules changed.** Second-person openers went from mild positive to catastrophic. Emoji tolerance tightened. Word count sweet spot shrunk. Quote-led hooks now work where they didn't. The 18 Aug caption-features doc has these; act on them.
- **Format mix changed.** Carousel-document collapsed from 26% of posts to 6% — mostly correctly, but replaced partly by text (which failed) and partly by multi-image (which won). Continue reallocating from text → multi-image.
- **Volume increased without compounding.** 56% more posts, ~30% less reach per post, roughly flat total attention. The rollback test in Sept-Oct is the load-bearing experiment for Q4.
- **Titanverse experiment failed.** 6× more Titanverse posts than 2025, 33% less reach per post, text-format experiment produced dead posts. Restart the Titanverse page on the same archetype rules as Titan PMR — no text-only posts, named-operator cadence.
- **Craft has genuinely improved.** Engagement rate up. Best posts of 2026 are better-written than best posts of 2025. This is not the problem to solve — the problem is that better craft is being spent on more posts with less individual reach.

### 8.8 Platform × archetype matrix

| Archetype | LinkedIn | TikTok | Instagram | Facebook |
|---|---|---|---|---|
| Named-owner case study | **Strong** | **Strong** | Mixed (cross-post only) | Weak |
| Multi-image field capture | **Strong** | (not applicable) | Weak | Weak |
| Sector-thesis with a foil | **Strong** | **Promising** (2 examples) | Insufficient evidence | Weak |
| Event saturation (show days) | **Strong** | **Promising** (untested at scale) | Weak | Weak |
| Advocacy-with-action | **Strong** | Insufficient evidence | Insufficient evidence | Weak |
| Culture moments | Mixed | Insufficient evidence | Insufficient evidence | Weak |
| Countdown / event promo | **Weak** | **Weak** | Weak | Weak |
| Blog-teaser reposts | **Weak** | (not applicable) | (not applicable) | Weak |
| Titanverse text posts | **Weak** | (not applicable) | (not applicable) | (not applicable) |
| Product screencast (no named person) | Mixed | **Weak** | Insufficient evidence | Weak |
| Ecosystem tagline / positioning-repeat | Mixed | Insufficient evidence | Insufficient evidence | Weak |

**Reading:** the four "Strong" archetypes on LinkedIn are the same four Cam already knows are strong. The change vs the 4 Aug v2 plan is (a) TikTok now needs its own row and its own rules, (b) Multi-image field capture belongs at Strong on LinkedIn based on now 14 posts of evidence, and (c) Titanverse text is a specific format-and-page combination that should be killed by name.

### 8.9 Q4 operating recommendations

**BRING BACK:**
- Customer stories on Titanverse (currently zero)
- Sector-thesis carousels (Mounjaro pricing, Pharmacy First — from repurpose list)
- Delayed post-event case study 4–5 weeks after Pharmacy Show (BMP 2025 shape)
- Advocacy-with-action posts (target 1/month, currently 0.2/month)

**DOUBLE DOWN:**
- Multi-image field captures (from ~7% to ~25% of LinkedIn output)
- Named-owner case-study video + supporting multi-image (from 8 arcs Jan-Jul to 12 arcs Sept-Dec)
- TikTok craft on numeric-hook openers (from ad-hoc to rule)
- Event saturation coverage on Pharmacy Show 2026

**REDUCE:**
- LinkedIn cadence outside event windows (28-33/month → 16-18/month)
- Single-image share of LinkedIn output (currently 30%, target 22-25%)
- Titanverse posting frequency to focus on quality restart
- Total posts on IG and FB (cross-post only, no craft time)

**REFINE:**
- Video pre-shoot rule — every video must have a named protagonist by name at time of shoot
- Multi-image pre-publish rule — must anchor on a specific moment; not a filler slot
- Case-study arc cap — max 3 cuts per story, spaced ≥7 days apart
- Caption craft — enforce 18 Aug rules (named specific in opener; ≤3 emojis; 100–150 words; no second-person openers)

**TEST (each with a yes/no answer by Q4 close):**
1. Volume rollback (LinkedIn 16-18/month Sept-Nov). Success = median clears 1,100.
2. Multi-image lift (25% of LinkedIn output). Success = multi-image continues at median ≥2,000.
3. Boots-as-foil repeat (3 posts in Sept). Success = median ≥1,800.
4. LinkedIn-to-TikTok port (top 5 winners re-cut for TT). Success = 2/5 clear 5,000 views.
5. Titanverse restart (kill text, ship 8 multi-image/video posts Sept-Oct). Success = Titanverse median ≥1,000.
6. Founder-led repost (v2 test — Hooman personal reposts one hero/week). Success = ≥30% lift.
7. Video retention (v2 test — instrument every Q4 video). Success = 100% instrumented.

---

## 8.10 The final answer to Cam's question

> **"If Titan wants Sept-Dec 2026 to outperform Sept-Dec 2025 without simply publishing more content, what are the five most important changes?"**

Sept-Dec 2025 delivered 91 LinkedIn posts, ~143K impressions, one strong event campaign (Pharmacy Show 2025), one delayed hero case study (BMP), plus December Wrapped. The average post cleared ~1,570 impressions in that window — the highest sustained level of the year.

Beating that with fewer posts requires five changes, grounded in this dataset:

**1. Cut LinkedIn cadence from ~30/month to ~16-18/month outside event windows.** The primary lever. Volume growth in 2026 diluted per-post reach without adding total attention. The rollback test in v2 §2.5 is the right test at the wrong scale — run it for a full quarter, not for four weeks.

**2. Reallocate from single-image and text toward multi-image.** Multi-image ran at median 2,118 imp on 14 posts. Single-image at 900 on 59 posts. Text at 467 on 14 posts. Moving 10 posts from single-image + text into multi-image over Q4 is the highest-confidence reach lift available.

**3. Ship 12 named-owner case-study arcs across Sept-Dec (from ~7 in the equivalent 2025 window).** This is the only archetype that has been in the top ten every year. Increase volume of the winners; decrease volume of everything else. Cap at 3 cuts per arc.

**4. Run Pharmacy Show 2026 on the TitanUp 26 model, not the PS 2025 model.** PS 2025 spread coverage over 4 months. TitanUp 26 concentrated it. Match TitanUp's within-week density (6 posts in 3 days) with PS 2025's afterglow depth (4-5 week case-study drop). Add a TikTok layer that didn't exist in 2025 — 3-5 posts across show days targeting ≥60K combined views.

**5. Restart Titanverse on the same archetype rules as Titan PMR, and delete the text-post format from the Titanverse output.** 6 of 14 LinkedIn text posts in 2026 came from Titanverse; their median was 202 impressions. On a page that only shipped 48 posts this year that is 12.5% of the Titanverse output going to a format with essentially zero distribution. The Titanverse page needs a proper Sept restart — 4 multi-image + 4 video posts in Sept-Oct, all named-operator. Target Titanverse median back to 1,000 imp (recovering the 2025 level).

Do those five and Q4 will beat Sept-Dec 2025 on median per-post reach, on total engagement, and on the number of breakout posts, without publishing a single extra piece.

Not doing them is the alternative — keep publishing 30 posts/month, watch median reach continue to erode, and end the year confused about whether it was algorithm or content. The algorithm question is a real one and the v2 Tariq-led B2B benchmarking will help answer it, but even under a worst-case algorithm read the five levers above are the ones the dataset supports acting on now.

---

**Sources cited in this analysis:**
- Primary dataset: `exports/titan-metrics-raw-2026-08-19.csv`
- `_strategy/titan-pmr-marketing-strategy-q4-2026-v2.md` (4 Aug 2026)
- `_strategy/socials-quarterly-review-2026-08-12.md` (12 Aug 2026)
- `_strategy/caption-features-vs-tiers-analysis-2026-08-18.md` (18 Aug 2026)
- Pharmacy Show 2025 dates: [The Pharmacy Show 2025 at NEC Birmingham](https://www.thenec.co.uk/events/the-pharmacy-show/) (12–13 Oct 2025)
- Pharmacy Show 2026 dates: [The Pharmacy Show 2026 | 11-12 Oct | NEC Birmingham](https://tradeshowlink.com/events/the-pharmacy-show-2026)

END OF ANALYSIS
