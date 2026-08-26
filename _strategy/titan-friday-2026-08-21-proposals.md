# Titan — Friday 21 Aug 2026 post proposals

Prepared 20 Aug 2026. Proposal only. Nothing pushed to Notion.

---

## Read this first — three things that change the brief

### 1. Tomorrow is not an empty slot

Notion already has **`TitanPMR_Interview_Hooman_ThreeHubBusinessModels_Video`** on Fri 21 Aug at **Sign-off**, Short-Form Clip, 5 channels. Caption is written:

> "There isn't one hub-and-spoke model. There are four. And most owners only ever get pitched one."

So the real decision is *replace or defer this*, not *fill a hole*. It is video, which is exactly what you said you have been heavy on. My recommendation is to **push it to Fri 4 Sep** and take a non-video slot tomorrow. It is evergreen; nothing about it decays in two weeks.

### 2. The Itfaq quote in the road-trip brief is not what he said

This is the important one. `_road-trip-campaign-plan-2026-08-03.md` and `_road-trip-mini-case-studies-brief.md` both carry the storage-cabinet quote marked **"verbatim, must not paraphrase"**. I checked it against the source and it is wrong.

The repo transcript (`_transcripts/C1860.md`, faster-whisper **base.en**) was the source for the brief. base.en garbles this audio badly. I re-transcribed the window off the master video (`Footage/C1860.MP4`, 10:00–11:00) with **small.en** and **medium.en**. Both agree, and both disagree with the brief:

| | Text |
|---|---|
| **Brief (claimed verbatim)** | "You need to know that your PMR is going to **mitigate** your robot. It's going to do what it's going to do. The robot, what is it? A big storage cabinet. That's what it is. So it will do what your PMR **does**." |
| **medium.en (10:29–10:48)** | "But you need to know that your PMR is going to **communicate with** your robot. And it's going to do what it's going to do. I mean, robot, what it is, is a big storage cabinet. That's what it is. So it will do what your PMR **tells it to do**. So your PMR needs to tell the robot exactly what you need." |
| **small.en (10:29–10:48)** | "…your PMR is going to **communicate with** your robot, and it's going to do what it's going to do. I mean, robot, what it is is a big storage cabinet. That's what it is. So it will do what your PMR **tells you to do**." |

"Mitigate your robot" is a base.en mishearing of "communicate with your robot". It is also why that line always read slightly oddly — it is not a sentence anyone would say.

**"A big storage cabinet" is safe.** All three models agree on it. That phrase is real.

The second brief quote is also wrong. Brief has *"I said, I'm a busy pharmacy. We do 15,000 items. I need to know."* — medium.en has *"I'm a busy pharmacy. We do 15,000 items. I need to know that if there's an issue, you're going to sort it out."* The brief truncated it at a point that changes the meaning.

**Action:** the brief files need correcting before anything ships from them, including Wednesday's Parklands hero. Say the word and I will patch both. For a quote card, where the words are set in 60pt type, I would still have you ear-check 10:29–10:48 on C1860.MP4 yourself. It is nineteen seconds.

### 3. Verified and clean

`Footage/C1860.MP4` at 01:04, medium.en:

> "I've had this since 2018… So I've taken it over and we've gone from about 9,000 to 15,000 items."

Two-thirds growth, owner's own voice, no ambiguity across models. This is usable as-is.

---

## The news scan — what is actually live this week

| Story | Date | Status | On-thesis? |
|---|---|---|---|
| **NHS England: ICBs must have IP onboarding process in place by August 2026.** 95% of onboarded pharmacies delivering prescriber-led consultations by 31 Mar 2027. £51k per ICB. IP into Pharmacy First + Contraception from autumn 2026. | Published **31 Jul 2026** | Verified, primary source | **Directly.** This is Titan's December thesis with a deadline attached. |
| **Flu National Booking Service opened 17 Aug 2026.** Programme starts 1 Sep (children, pregnant women, some adults), 1 Oct (other cohorts). | **17 Aug 2026** | Verified | Partly. Capacity story, but no first-party Titan vaccination proof to hang it on. |
| **CPE funding settlement: 10.3% rise to £3.636bn.** £200m margin uplift, up to £239m over-delivery write-off, SAF to £1.52, pharmacies may close up to 4 hours/month for staff training. | 29 May 2026 | Verified | Yes, but three months old. Not "this week". |
| DHSC August price concessions, 118 granted as of 18 Aug | 18–19 Aug 2026 | Verified | No. Routine, no angle. |

**Sources:** [NHS England — Preparing for prescribing in national community pharmacy services](https://www.england.nhs.uk/long-read/preparing-for-prescribing-in-national-community-pharmacy-services/) · [CPE — CPE secures 10% funding rise](https://cpe.org.uk/our-news/cpe-secures-10-funding-rise-but-pushes-for-reform/) · [Pharmaceutical Journal — flu booking opens two weeks earlier](https://pharmaceutical-journal.com/article/news/pharmacy-flu-vaccination-booking-system-to-open-two-weeks-earlier) · [The Pharmacist — ICBs told to introduce pharmacy prescribing services in 2026/27](https://www.thepharmacist.co.uk/community/icbs-told-to-introduce-pharmacy-prescribing-services-in-2026-27/) *(403 on direct fetch — corroborated via the NHS England primary source above, not relied on alone)*

The IP story is the one. It is not just timely, it is **the exact argument Titan already published and can now claim.**

---

## What the winners actually look like — the shapes I am mirroring

From Fable's report and the post corpus:

| Post | Date | Tier | Why it matters here |
|---|---|---|---|
| **"TITAN + NHS Independent Prescribing"** carousel-document | 2025-02-05 | **worked, p100, 5,440 imp** | Fable Q1 **row 6**. Titan's single best-reaching non-event post. IP is proven territory. |
| **"📅 What's Changing in the Pharmacy Contract — And When"** carousel | 2025-04-23 | **worked, p88.2, 3,905 imp** | The policy-timeline explainer shape. Highest-reaching contract post. |
| **"🚨 Original Pack Dispensing (OPD) — TITAN PMR is ready"** single-image | 2024-12-17 | **worked, p88.9, 1,950 imp** | The legislation-lands-and-we-are-ready single-image. Fastest shape to ship. |
| **"Independent Prescribing should be the future. So why will it struggle in 2026?"** carousel | 2025-12-04 | **worked, p77.3** | **Titan's own published thesis.** "The bottleneck is not skill. It is time." |
| **"£158 million NHS clawback"** carousel | 2026-01-29 | **worked, p75, 1,507 imp** | Stat-headline policy open, minimal caption. |
| **Jaya quote single-image** ("The tools Titan has built…") | 2026-05-08 | middle p56, **10 comments / 1,157 imp** | Fable Q2 **row 7** — best comment-per-impression in the whole corpus. The quote-card template. |
| **Sunil 1000th pharmacy** single-image | 2025-07-11 | **28 comments**, 4,785 imp | Fable Q2 **row 1**. Corpus comment ceiling, single-image. |

Two craft notes from `_context/titan-caption-craft.md` that shape the drafts below:

- **Cold-punch policy open** wins both lenses on policy posts (1.18 reach / 1.20 interaction). Shipped precedent: *"Hub and spoke. Before the law changes."*
- **Quote-led openers** win on customer stories (1.29 / 1.26) but **suppress reach on product posts (0.66)**. So a quote card has to be framed as the operator's story, not as a product claim.
- Fable's Q1 says question hooks dominate the reach top-10; the caption-craft doc says avoid question openers by default. Both are right at different altitudes — questions win the *ceiling*, named specifics raise the *floor*. I have used questions only as closing CTAs below, not as openers.

---

# The candidates, ranked

## ⭐ 1. RECOMMENDED — "The clock started this month" · IP deadline · single-image stat card

**Format:** Single image (stat/statement card) · LI@titanpmr + LI@titanverse + FB + IG
**Angle:** News-reactive editorial argument. Claim-the-moment job.
**Source:** [NHS England, 31 Jul 2026](https://www.england.nhs.uk/long-read/preparing-for-prescribing-in-national-community-pharmacy-services/) — ICB onboarding process required **by August 2026**; **95%** of onboarded pharmacies delivering prescriber-led consultations by **31 Mar 2027**; £51,000 per ICB; IP into Pharmacy First from autumn 2026.
**Mirrors:** Fable Q1 row 6 (IP carousel, p100, 5,440 imp) for territory; 2024-12-17 OPD single-image (worked p88.9) for the shape; 2025-12-04 IP carousel for the thesis being continued.
**Structure:** Cold-punch policy open → stakes-first mechanism explainer. Idea-First throughout.

**Draft caption:**

> August. The clock started and most owners have not been told.
>
> NHS England has instructed every ICB to have a process in place this month to identify, approve and onboard pharmacies for prescribing. By 31 March 2027, at least 95% of onboarded pharmacies have to be delivering prescriber-led consultations.
>
> We published something in December we would have been happy to be wrong about.
>
> Every branch is training more IPs. Every policy document points to a more clinical role. And most pharmacists still start the day the way they did ten years ago. Clearing repeats. Chasing stock. Firefighting the bench.
>
> The bottleneck was never skill. It was time.
>
> A 95% target does not create an hour in the afternoon. It sets a date by which you have to have found one.
>
> Onboarding is a form. Capacity is a workflow question, and it is the part nobody has funded.
>
> 👇 If your ICB onboards you this autumn, where does the prescribing hour actually come from?

**Visual:** statement card. "95% by 31 March 2027" as the dominant number, "the process starts this month" beneath it. Titan blue. No product UI.

**Why tomorrow specifically:** the ICB deadline is *this month* — the post has roughly ten days of shelf life and then it is a retrospective. It is non-video, which is what you asked for. And it is the rare reactive post where Titan is not commenting on someone else's news but collecting on a call it already made publicly in December. That is the strongest position a brand can hold on a news cycle.

**Watch-out:** "The bottleneck was never skill. It was time." is close to the banned antithesis flip. It survives because it is a verbatim callback to Titan's own December carousel, which makes it a callback rather than a construction. If it reads as a tell to you, cut it to "The bottleneck was time." and let the December line do the work.

---

## 2. "9,000 to 15,000" · Itfaq at Parklands · single-image quote card

**Format:** Single image quote card · LI@titanpmr + LI@titanverse + FB + IG
**Angle:** Customer story, quote-led. Build-credibility job. Warm-up for Wednesday's Parklands hero.
**Source:** `/Volumes/LaCie/CLIENTS/TITAN/260723 - Road Trip/Footage/C1860.MP4` — 01:04 (growth stat) and 10:29–10:48 (the tip). Re-transcribed medium.en, 20 Aug. **Not** the repo base.en transcript.
**Mirrors:** Fable Q2 row 7 — Jaya quote single-image, 10 comments on 1,157 impressions, the best comment-per-impression post in the corpus. Same construction: operator's verbatim line, named, @-mentioned, first-person.

**Draft caption:**

> 9,000 items to 15,000. Same shop.
>
> Itfaq Ahmed took Parklands Pharmacy over in 2018, a site that had been independent for twenty years before him, and grew it by two thirds. Then he put an Avonnex robot into one of the narrowest footprints on the high street.
>
> He is one week live on Titan.
>
> What he would tell another owner about to buy automation:
>
> "You need to know that your PMR is going to communicate with your robot… So your PMR needs to tell the robot exactly what you need."
>
> He learned it the expensive way. He signed with a different PMR first, purely for the integration. In week one they would not guarantee it.
>
> "I'm a busy pharmacy. We do 15,000 items. I need to know that if there's an issue, you're going to sort it out."
>
> He walked, and signed with Titan the same week.
>
> The full visit lands Wednesday.

**Why I have NOT used "a big storage cabinet":** the road-trip plan designates that line as **POST 1, the hero**, and it is the VO closer on Wednesday's Parklands anchor video. Spending it on Friday burns the campaign's best line five days before the post it was written for. The 21-day source rule is relaxed for the planned cascade, so Itfaq appearing twice in a week is fine — but the *line* should only land once, on Wednesday. This draft uses the growth stat and the integration-guarantee story instead, and teases the hero.

**Blocker before this ships:** ear-check 10:29–10:48 on C1860.MP4. Two models agree, but they disagree on "tells it to do" vs "tells you to do", and I have trimmed at the ellipsis to avoid the disputed clause. A quote card is the one format where a transcription error is unrecoverable in public.

**Also:** the transcript names the previous PMR vendor several times. Scrubbed here per the no-competitor rule — "a different PMR" only.

---

## 3. "What changes this autumn" · IP timeline carousel

**Format:** Carousel-document · LI@titanpmr + FB + IG
**Angle:** Own-the-topic. Same news as candidate 1, built for clicks instead of comments.
**Source:** as candidate 1, plus [CPE settlement](https://cpe.org.uk/our-news/cpe-secures-10-funding-rise-but-pushes-for-reform/) for the autumn service changes.
**Mirrors:** 2025-04-23 "What's Changing in the Pharmacy Contract — And When" (worked, p88.2, 3,905 imp) almost exactly. That post is the highest-reaching contract explainer Titan has made.

**Why it is here at all:** Fable's report names carousel restart as the **#1 thing to start doing** — carousels are the click workhorse (Priory carousel: 4,054 clicks on 3,685 impressions, the corpus click ceiling) and output has collapsed from 26% of ship in 2025 to 4.9% in 2026. Next week has **zero carousels** currently scheduled.

**Why it is not my pick for tomorrow:** six to eight slides of design in under a day, and candidate 1 gets the same news out on time. **My actual recommendation: ship candidate 1 tomorrow, and slot this carousel into Thu 27 Aug** where it fixes next week's carousel gap and the IP story is still live. Details in the calendar file.

---

## 4. "Bookings opened Monday" · flu season capacity · single image

**Format:** Single image · LI@titanpmr + FB + IG
**Angle:** Seasonal news peg, capacity thesis.
**Source:** [Pharmaceutical Journal](https://pharmaceutical-journal.com/article/news/pharmacy-flu-vaccination-booking-system-to-open-two-weeks-earlier) — NBS opened **17 Aug 2026**, two weeks earlier than usual at CPE's request. Programme starts 1 Sep / 1 Oct by cohort.
**Mirrors:** the "plain announcement" structure (strongest register in the dataset, lift 1.29; plain beats dressed-up 1.55 vs 1.24).

**No draft caption offered.** I could not find a first-party Titan or Titanverse vaccination-throughput claim in the repo that I would put my name to, and the honest version of this post is "the season starts earlier this year" with no Titan argument attached. That is a calendar reminder, not a Titan post. **Listed for completeness and ranked last for that reason.** If there is vaccination-service proof I have not found, tell me where and this moves up sharply — the timing is genuinely good.

---

## 5. Ship the Hooman clip as planned

`TitanPMR_Interview_Hooman_ThreeHubBusinessModels_Video` is at Sign-off with a strong caption and five channels. Zero-effort option. Only reason not to: it is video, which is what you are trying to break from, and it makes Hooman three-in-fourteen-days alongside Fri 28 Aug's quote card and the stale `IfBootsAreDoingIt`.

---

# Recommendation

**Ship candidate 1 tomorrow.** It is non-video, it is news that expires in ten days, and it is Titan collecting on a public call rather than reacting to someone else's story. Move the Hooman clip to Fri 4 Sep.

**Then candidate 3 on Thu 27 Aug** — same story, carousel build, fixes next week's carousel gap and answers Fable's #1 restart note.

**Candidate 2 is the right post but the wrong day.** Itfaq belongs next week as the Parklands warm-up, not tomorrow, and it needs the ear-check first. It is slotted Tue 25 Aug in the calendar file.

Fastest path if you want tomorrow closed in an hour: candidate 1, one statement card, no new footage, no transcript risk.
