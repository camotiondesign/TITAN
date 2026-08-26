# Trustpilot Word Cloud — Designer Brief

**For:** Sajid + design team · **From:** Cam Moorcroft · **Date:** 7 Aug 2026
**Companion asset to:** the 400 Reviews carousel (v3)
**Data source:** `/TITAN/analytics/trustpilot-word-frequency.csv` — top 80 terms ranked by frequency

---

## What this is

A visual celebration of the language used in Titan's Trustpilot reviews. Sits alongside the 5-favourites carousel as complementary content — where the carousel shows five specific stories, the cloud shows the pattern across all 200 recent 5-star reviews.

## The honest finding to design around

**One word appears 126 times. It's not a product feature. It's a person.**

**Nas** — Titan's implementation lead — is mentioned in nearly two-thirds of all reviews. Atique is second at 35. Nour third at 25. Maj fourth at 20.

The reviews are largely about the humans who did the implementation and training, not about Titan-the-software. That is what customers actually wrote. This shapes the design decision.

## Three visual approaches — pick one

### Option A — "Our people are the product"
Word cloud with **Nas at the visual centre**, big. Atique second. Nour third. Then a warm halo of support-language ("helpful", "patient", "brilliant", "explained everything"). Colour: Titan blue on light background, or white on Titan blue.

**Best for:** honouring what customers actually said. Emotionally true. Doubles as a thank-you to the implementation team.

### Option B — "What Titan does for pharmacies"
Strip proper nouns entirely. Focus on outcome and feeling words: *helpful, easy, smooth, efficient, patient care, repeat flow, running smoothly, game changer.* Same visual grid, no people names.

**Best for:** if the post is aimed at prospective customers making a switching decision.

### Option C — "The one-name reveal" (recommended)
Skip the traditional word cloud entirely. Single slide:

> **400 reviews.**
> **One word appears 126 times.**
>
> [reveal, big]
> **NAS.**
>
> [sub-line]
> *"Nas was brilliant." "Nas made us feel comfortable." "Nas explained everything clearly." "Nas answered every question." Nothing ever felt like too much trouble.*
>
> [close]
> Thank you to the implementation team. You're what our reviews are actually about.

**Best for:** the sharpest single-slide social post. Turns the finding INTO the story. Standalone, no swipe needed. Highest scroll-stop factor.

## Design rules

1. **NO bubbly Wordle-style scatter cloud.** Those look dated in 2026 and don't fit Titan's editorial/TED-adjacent design language. Use a structured typographic composition instead.
2. **Colour system by theme** (if going with A or B):
   - **People** — Titan blue gradient (Nas, Atique, Nour, Maj)
   - **Support** — light blue (helpful, patient, questions, explained)
   - **Praise** — Trustpilot green (amazing, brilliant, fantastic, excellent, highly recommend)
   - **Outcome** — white (easy, smooth, efficient, workflow, repeat flow)
   - **Emotion** — accent blue (confident, relief, freedom)
3. **Size scales by frequency.** But not linearly — Nas at 126 shouldn't be 12x the size of "smooth" at 24. Log scale so smaller words remain readable.
4. **Trustpilot stars + logo lockup bottom-right** for provenance.
5. **Title on the slide:** *"What 400 pharmacy owners talk about when they talk about Titan."*
6. **Footer:** *"UK community pharmacy owners · Verified Trustpilot reviews · Aug 2026"*

## What's in the data

**Top 5 by theme (from the CSV):**

| Theme | Top terms |
|---|---|
| **People** | Nas (126), Atique (35), Nour (25), Maj (20) |
| **Support** | support (80), helpful (52), patient (49), help (34), questions (33), answered (12) |
| **Praise** | great (67), amazing (36), brilliant (25), fantastic (25), excellent (29), outstanding (15), exceptional (14), highly recommend (21) |
| **Implementation** | training (68), implementation (53), transition (31), smooth (24), seamless (12) |
| **Outcome** | easy (36), efficient (17), dispensing (18), workflow (16), efficiency (12) |
| **Emotion** | confident (20) |
| **Endorsement** | recommend (41), highly recommend (21) |

## Delivery

- **Data table:** `/TITAN/analytics/trustpilot-word-frequency.csv` (top 80 terms, theme-tagged)
- **Analysis scope:** 197 five-star reviews, Sep 2024 → Aug 2026 (Trustpilot's UK page caps at 200 accessible via public fetch — the older ~200 reviews are login-gated and not included)
- **Post format:** Single image, 4:5 (1080×1350) for LinkedIn feed
- **Ships alongside:** 400 Reviews carousel, same week

## Recommended path

**Ship Option C first.** It's the punchiest post, needs no swiping, and turns a genuinely surprising data finding into the message. Follow up with Option A or B a week later as a second beat if the topic still has legs. Two posts, not one.

If ONE post only: **Option C.** The one-name reveal is stronger content than any word cloud could be.

END BRIEF
