# Thought Leadership & Blog Strategy

Cam writes these. Claude drafts, structures, and edits — but the thinking is Cam's.

The goal: position Titan as the company that understands where pharmacy is going, not just what it sells. Every piece should be something a pharmacy owner forwards to a colleague and says "read this."

---

## Why This Matters Now

The consultant was wrong about most things, but right about one: the AI narrative stops at product. Titan has the strongest AI clinical checking in UK pharmacy, real data from 1,000+ pharmacies, and a front-row seat to how the sector is changing. That knowledge lives in Cam's head and in customer conversations. It needs to be written down.

Blogs do three things LinkedIn can't:
1. **Depth** — a 1,500-word piece can make an argument LinkedIn carousels can only gesture at
2. **Searchability** — blog content gets indexed, cited by AI search tools, and found by pharmacy owners Googling problems at 11pm
3. **Authority** — a named founder writing from experience is the hardest thing for competitors to replicate

---

## The Four Pillars

Every blog post falls into one of four categories. These map to where pharmacy owners' heads are at.

### 1. Industry Lens
What's happening in pharmacy and what it actually means for owners.

Not news reporting. Interpretation. "Here's what changed, here's what it means for your P&L, here's what to do about it."

**Example topics:**
- Hub & spoke is live — what the first 6 months have actually looked like
- The real economics of Pharmacy First: who's making it work and who's walking away
- GTIN barcodes: the safety crisis nobody's talking about
- What the £158M clawback tells us about CPCF's future
- Workforce crisis isn't coming — it's here. What single-pharmacist branches actually need
- Why funding reform keeps failing and what pharmacy owners should plan for instead

**Source material:** Reactive LinkedIn posts that performed well (Mounjaro 104%, Contract Changes 97%, PF Walk Away 90%, Clawback). These proved the audience cares. The blog goes deeper.

### 2. Operational Thinking
How modern pharmacies actually run. Not product demos — operating principles.

This is where Titan's 1,000+ pharmacy experience becomes thought leadership. Cam has seen what works and what doesn't across hundreds of implementations. Write from that vantage point.

**Example topics:**
- The 14% rule: why most pharmacist checks are wasted clinical capacity
- What "going paperless" actually means (and what it doesn't)
- Double cover was never about safety — it was about bad systems
- How to think about automation when your team is scared of change
- The real cost of staying on a legacy PMR (not the switching cost — the staying cost)
- Why the first month after switching systems is the hardest (and what to do about it)

**Source material:** HOD video clips, customer transformation stories, implementation patterns from 1,000+ pharmacies.

### 3. AI in Pharmacy
Where AI is going in community pharmacy. Not "our AI does X" — what AI means for the profession.

This is the biggest gap. Titan has real, live AI doing clinical checks at scale. Nobody else in UK pharmacy PMR is writing from that position. Own it.

**Example topics:**
- AI clinical checking: what we've learned from [X million] prescriptions
- The pharmacist's role doesn't shrink with AI — it changes
- Why AI safety in pharmacy is different from AI safety everywhere else
- What "AI cleared 90% of scripts" actually means for patient safety
- The difference between AI as a tool and AI as infrastructure
- Regulation is coming for pharmacy AI — here's what sensible regulation looks like

**Source material:** Titan AI performance data, GPhC regulatory direction, real error-catch examples (anonymised), customer feedback on AI trust.

### 4. Services & Clinical Practice
How pharmacy is shifting from dispensing to clinical delivery. Titanverse territory, but written as industry perspective, not product pitch.

**Example topics:**
- The pharmacies scaling services aren't the ones you'd expect
- NMS went from box-ticking to revenue driver — here's what changed
- Why governance is the unsexy thing that makes services scalable
- Independent prescribing is live — what the first cohort is learning
- The fragmentation tax: what happens when every service needs a different system
- Travel clinics, weight management, hypertension — which services actually make money?

**Source material:** Titanverse customer stories (Glen/Knights, Rahul, Dervis), services data, prescribing pilot learnings.

---

## Cadence

**Target: 2 blog posts per month.**

Not aggressive. Sustainable. Quality over volume.

| Week | What |
|------|------|
| Week 1-2 | Cam writes or dictates the first draft of Post 1. Claude structures and edits. |
| Week 2 | Post 1 published. LinkedIn carousel or quote card created from the core argument. |
| Week 3-4 | Cam writes or dictates the first draft of Post 2. Claude structures and edits. |
| Week 4 | Post 2 published. LinkedIn content created from it. |

**Monthly pillar rotation:** Each month, pick 2 of the 4 pillars. Over a quarter, all 4 get covered. Don't write 2 from the same pillar in the same month.

---

## How Blog Posts Feed LinkedIn

Every blog post should generate 2-3 LinkedIn posts. This is how thought leadership compounds — one piece of deep thinking creates multiple touchpoints.

| Blog element | Becomes | LinkedIn type (from content formula) |
|-------------|---------|--------------------------------------|
| Core argument / hot take | Carousel (3-5 slides) | Industry Stance / Controversy (Tier 1) |
| A striking stat or finding | Single image quote card | Thought Leadership / POV (Tier 3) |
| Customer example from the blog | Quote card | Customer Quote Card (Tier 2) |
| The full piece, summarised | LinkedIn article or link post | — |

The blog goes deeper than the carousel. The carousel drives traffic to the blog. They reinforce each other.

---

## Structure & Voice

### Length
1,200-2,000 words. Long enough to make the argument. Short enough to read in one sitting.

### Structure
Every blog post follows this skeleton:

1. **Open with what's happening** (2-3 sentences). No preamble. State the situation.
2. **Say what it actually means** (1-2 paragraphs). This is the interpretation — the thing nobody else is saying.
3. **Show the evidence** (2-3 sections). Customer examples, data, operational patterns. Named pharmacies where possible (with permission).
4. **Land on a position** (1 paragraph). What should pharmacy owners do about this? Be specific.

### Voice rules
Same voice guide applies, with these additions for long-form:

- **Write as Cam, not as Titan.** First person where it earns it. "I've seen this pattern across 200+ implementations" hits differently than "Titan has observed."
- **No hedging.** If you believe something, state it. "I think hub & spoke will consolidate faster than anyone expects" — not "it remains to be seen."
- **Name names.** Real pharmacies, real pharmacists (with permission), real numbers. The specificity that makes LinkedIn posts land is even more important in long-form.
- **Don't pitch.** The blog post should be useful to a pharmacy owner who never buys Titan. That's what makes it thought leadership and not marketing.
- **Link to evidence.** If a stat comes from PSNC, NHSBSA, or GPhC data, link to the source. If it comes from Titan's internal data, say so explicitly.

### Anti-patterns
- No "In today's rapidly evolving pharmacy landscape"
- No listicles ("7 Ways to Optimise Your Dispensary")
- No content that could have been written by anyone — every post should contain something only someone running 1,000+ pharmacies would know
- Run through `strategy/anti-ai-writing.md` before publishing — even Cam's drafts benefit from the checklist

---

## Workflow: Blog to Repo

1. **Cam writes/dictates** the core argument and key points
2. **Claude structures** the draft using the skeleton above
3. **Cam reviews and adds** specifics, opinions, examples Claude can't know
4. **Claude edits** for voice guide compliance and anti-AI checklist
5. **Published post** goes to `posts/blog/published/[slug]/`
   - `article.md` — the full blog text
   - `meta.json` — title, date, pillar, word count, author
   - `linkedin-derivatives.md` — list of LinkedIn posts generated from this blog
6. **Claude creates** the LinkedIn derivative posts and adds them to the content calendar

### Blog post meta.json format

```json
{
  "title": "The 14% Rule: Why Most Pharmacist Checks Are Wasted Clinical Capacity",
  "slug": "the-14-percent-rule",
  "date": "2026-04-15",
  "author": "Cam",
  "pillar": "operational-thinking",
  "word_count": 1650,
  "status": "published",
  "linkedin_derivatives": [
    "TITAN_14PercentRule_Carousel",
    "TITAN_14PercentRule_QuoteCard"
  ]
}
```

---

## AEO / Search Considerations

Blog posts should be findable by pharmacy owners searching and by AI tools citing.

**For each post:**
- Title should match a question a pharmacy owner would actually search ("What does hub and spoke mean for independent pharmacies" not "Hub & Spoke: A New Dawn")
- Include a 2-3 sentence summary at the top that reads like a direct answer to the search query
- Use specific, searchable terms: "pharmacy AI clinical checking," "PMR system switching," "Pharmacy First targets," "hub and spoke pharmacy"
- Structure with clear H2 headings that match sub-questions

**Over time, aim to own answers for:**
- "AI in community pharmacy UK"
- "pharmacy PMR comparison" / "best pharmacy PMR system"
- "hub and spoke pharmacy workflow"
- "Pharmacy First targets requirements"
- "pharmacy automation UK"
- "switching PMR system"

---

## Quarterly Review

At the end of each quarter:
1. Which 2 pillars got the most coverage? Rebalance next quarter.
2. Which blog posts drove the most LinkedIn engagement via derivatives?
3. Are blog posts showing up in search / AI citations? Check Google Search Console.
4. Did any blog topic generate demo enquiries or inbound conversations? Track if possible.
5. Update the topic list — remove published topics, add new ones from customer conversations and industry news.
