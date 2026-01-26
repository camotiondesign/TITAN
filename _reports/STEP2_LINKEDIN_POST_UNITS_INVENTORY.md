# STEP 2 — LinkedIn Post Units Inventory

**Generated:** 2026-01-24  
**Scope:** Entire repo. A **post unit** = folder containing ≥1 of: `caption.md`, `metrics.json`, `tcps.json`, `comments.md`, `alt-text.md`, or `assets/` for a single post.  
**Filter:** LinkedIn only (excludes TikTok, YouTube, campaign-level meta).

---

## Summary

| Location | Post units | Pattern |
|----------|------------|---------|
| **`/posts/{slug}/`** | 177 | Flat list under `posts/` |
| **`campaigns/_templates/.../social/linkedin/`** | 4 | Template examples |
| **`_shared/templates/.../social/linkedin/`** | 4 | Copy of template examples |
| **`playground/TITANVERSE/.../social/linkedin/`** | 4 | Playground campaigns |
| **`campaigns/.../social/linkedin/`** (TITAN / TITANVERSE) | 0 | Removed in restructure |
| **Total unique LinkedIn post units** | **189** | (177 + 4 + 4 + 4; templates duplicated) |

---

## 1. `/posts/{slug}/` — 177 units

All posts under repo root `posts/`. Each folder has `caption.md`, `comments.md`, `meta.json`, `metrics.json`, `tcps.json`, `alt-text.md` (optional), and `assets/`.

<details>
<summary>List of 177 post slugs (click to expand)</summary>

- `2024-12-16-titan-wrapped-carousel`
- `2024-12-17-opd-legislation-support-single-image`
- `2024-12-18-testimonial-mustafa`
- `2024-12-22-testimonial-raw-fullconvo`
- `2024-12-23-christmas-pharmacy-heroes`
- `2025-01-06-pharmacy-resolutions-2025`
- `2025-01-07-trustpilot-200-plus`
- `2025-01-08-testimonial-kieren`
- `2025-01-14-shoulder-the-nhs-load`
- `2025-01-15-3-automation-tools`
- `2025-01-15-poll-top-pharmacy-priority`
- `2025-01-16-testimonial-jagdeep`
- `2025-01-17-titan-batch-animated`
- `2025-01-20-5-ways-ai-improving-pharmacy`
- `2025-01-21-pharmacists-only-20-percent-checks`
- `2025-01-22-nms-growth-easons-pharmacy`
- `2025-01-23-near-misses-carousel`
- `2025-01-24-titan-mobile-video`
- `2025-01-27-scale-50-patients-video`
- `2025-02-04-poll-expanding-services-barriers`
- `2025-02-04-trustpilot-reviews-carousel`
- `2025-02-05-titan-nhs-independent-prescribing`
- `2025-02-06-ai-transforming-workflows`
- `2025-02-07-kanav-services-testimonial`
- `2025-02-10-ash-wait-times-testimonial`
- `2025-02-11-eps-wales-rollout`
- `2025-02-12-pharmacy-moving-fast-looping-animation`
- `2025-02-14-your-pharmacy-isnt-struggling`
- `2025-02-17-pmr-innovator-or-imitator`
- `2025-02-18-kanav-efficiency-from-day-one`
- `2025-02-19-legacy-pmrs-print-everything`
- `2025-02-20-faz-nav-demonstration`
- `2025-02-24-pharmacy-evolution-carousel`
- `2025-02-25-cameron-paperless-testimonial`
- `2025-02-26-titan-new-way-of-working`
- `2025-02-28-ramadan-mubarak-carousel`
- `2025-03-03-titan-way-workflow`
- `2025-03-04-kanav-testimonial-workflow`
- `2025-03-05-titan-way-looped-video`
- `2025-03-06-titan-merch-store-carousel`
- `2025-03-07-independent-pharmacy-advocacy-carousel`
- `2025-03-10-titan-merch-store-video`
- `2025-03-11-how-do-you-feel-about-pmr`
- `2025-03-12-titan-merch-first-look-video`
- `2025-03-13-anup-testimonial-titan-way`
- `2025-03-17-growth-exciting-or-overwhelming-carousel`
- `2025-03-19-elias-paperless-testimonial`
- `2025-03-20-every-purchase-real-impact-carousel`
- `2025-03-25-titan-way-looped-video`
- `2025-03-27-the-titan-way-main-video`
- `2025-03-29-ishpal-testimonial`
- `2025-03-30-eid-mubarak-carousel`
- `2025-07-02-priory-longform-video`
- `2025-07-03-pharmacy-show-bigger-than-ever`
- `2025-07-04-nhs-plan-carousel`
- `2025-07-08-puri-longform-video`
- `2025-07-09-scaling-without-chaos-meme`
- `2025-07-10-nhs-five-technologies`
- `2025-07-11-titan-1000th-milestone`
- `2025-07-15-titan-1000th-montage-video`
- `2025-07-16-ai-backup-not-burnout`
- `2025-07-17-carousel`
- `2025-07-18-serial-checker-single`
- `2025-07-22-brighton-hill-longform-video`
- `2025-07-23-spongebob-automation-meme`
- `2025-07-24-too-many-baskets-again`
- `2025-07-25-puri-20-hours-saved`
- `2025-07-29-ai-in-pharmacy-tour`
- `2025-07-30-titanverse-early-adopters-day`
- `2025-07-31-sagar-4x-growth-carousel`
- `2025-08-01-titan-checks-every-script`
- `2025-08-05-drayton-prime-longform-video`
- `2025-08-06-titan-future-focused`
- `2025-08-07-titan-nhs-strategy-in-action`
- `2025-08-08-titan-support-best-month`
- `2025-08-12-ai-airlock-open`
- `2025-08-13-puri-health-hub-carousel`
- `2025-08-14-titan-trustpilot-reviews`
- `2025-08-15-titan-bbq-25`
- `2025-08-19-drayton-prime-nms-growth`
- `2025-08-20-pharmacy-chatgpt-prompts`
- `2025-08-21-medichem-visit`
- `2025-08-22-clinical-ready-digital-tools`
- `2025-08-25-priory-short-video`
- `2025-08-26-howletts-longform-video`
- `2025-08-27-mounjaro-pricing-changes`
- `2025-08-28-howletts-batch-flow-tutorial`
- `2025-09-02-pharmacy-show-announcement`
- `2025-09-03-devon-pharmacy-conference`
- `2025-09-04-drayton-prime-short-video`
- `2025-09-05-gandalf-closing-time-meme`
- `2025-09-09-high-volume-zero-panic`
- `2025-09-10-titan-audit-trail`
- `2025-09-11-puri-paper-free-video`
- `2025-09-12-admin-stealing-time`
- `2025-09-16-cpgm-connect-conference`
- `2025-09-17-brighton-hill-workflow-video`
- `2025-09-18-pharmacy-substitution-rights`
- `2025-09-19-pharmacy-furious-meme`
- `2025-09-23-hub-and-spoke-regulations`
- `2025-09-24-leicestershire-rutland-agm`
- `2025-09-25-howletts-short-video`
- `2025-09-26-medichem-longform-video`
- `2025-09-30-drayton-prime-short-video`
- `2025-10-03-step-out-freezes`
- `2025-10-07-pharmacy-show-5-days-to-go`
- `2025-10-07-titanverse-5-days-to-go`
- `2025-10-08-titanverse-first-webinar`
- `2025-10-09-pharmacy-show-3-days-to-go`
- `2025-10-09-titanverse-3-days-loop`
- `2025-10-10-chemist-druggist-recognition`
- `2025-10-10-titanverse-2-days-to-go`
- `2025-10-12-pharmacy-show-day-one`
- `2025-10-12-sajid-talking-head`
- `2025-10-13-zad-interviews`
- `2025-10-14-pharmacy-show-album`
- `2025-10-15-hooman-user-conversation`
- `2025-10-16-tariq-keynote-talk`
- `2025-10-16-titan-video-wall-montage`
- `2025-10-17-pharmacy-show-recap-montage`
- `2025-10-20-diwali-greeting`
- `2025-10-21-pharmacy-technician-day`
- `2025-10-21-tariq-talk-carousel`
- `2025-10-21-wahid-what-is-titanverse`
- `2025-10-22-titanverse-ai-templates`
- `2025-10-22-zack-sachin-interview`
- `2025-10-23-prab-interview`
- `2025-10-23-titanverse-one-app-one-flow`
- `2025-10-27-zainab-pillsorted-interview`
- `2025-10-28-pharmacy-moves-fast`
- `2025-10-28-titanverse-how-much-is-in-titanverse`
- `2025-10-29-peer-to-peer-hub-spoke-meme`
- `2025-10-29-titanverse-time-for-services`
- `2025-10-30-puri-health-hub-video`
- `2025-10-30-titanverse-smart-consultations`
- `2025-11-03-nhs-10-year-plan-article`
- `2025-11-04-ask-your-pharmacist-week`
- `2025-11-04-titanverse-chaos-to-clarity`
- `2025-11-05-ask-your-pharmacist-week-video`
- `2025-11-05-titanverse-ai-agents-ask-anything`
- `2025-11-11-bmp-case-study-carousel`
- `2025-11-11-pov-start-a-consultation`
- `2025-11-12-barcode-safety-beep`
- `2025-11-12-the-everything-app-video`
- `2025-11-13-bmp-case-study-single-image`
- `2025-11-18-bmp-case-study-video`
- `2025-11-18-one-app-to-rule-them-all-meme`
- `2025-11-19-from-noise-to-calm-single-image`
- `2025-11-19-why-independent-prescribing-fails`
- `2025-11-20-pharmacist-battery-meme`
- `2025-11-20-yusuf-ai-testimonial`
- `2025-11-25-yusuf-product-review`
- `2025-11-26-gtin-barcode-safety`
- `2025-11-27-ai-agents-quick-actions`
- `2025-11-27-gareth-hughes-carousel`
- `2025-11-29-clinical-pathways-demdx`
- `2025-11-29-sagar-fourfold-growth-video`
- `2025-12-02-automated-dispensing-single-image`
- `2025-12-02-pharmacy-is-shifting-fast`
- `2025-12-03-ai-in-pharmacy-interview`
- `2025-12-04-independent-prescribing-carousel`
- `2025-12-05-dispensing-to-health-hub-image`
- `2025-12-05-knight-street-batch-flow-video`
- `2025-12-06-titan-pmr-titanverse-pathway`
- `2025-12-06-tumi-batch-flow-single-image`
- `2025-12-07-pov-service-led-health-hub`
- `2025-12-08-poll-services-challenge`
- `2025-12-08-titan-wrapped-carousel`
- `2025-12-09-knight-street-day-one-batch-flow-video`
- `2025-12-10-blog-promotion-banner`
- `2025-12-12-brighton-hill-scaling-single`
- `2025-12-16-safys-chemist-longform-video`
- `2025-12-17-2025-pharmacy-memes-carousel`
- `2025-12-31-97-percent-fewer-near-misses-carousel`
- `2025-12-31-pharmacy-resolutions-2026`
- `2026-01-12-zero-lost-prescriptions-single-image`
- `2026-04-01-bnf-integration`

</details>

**Markers present:** `caption.md`, `comments.md`, `meta.json`, `metrics.json`, `tcps.json`, `assets/`; `alt-text.md` in 31 of 177.

---

## 2. `campaigns/_templates/campaign-template/social/linkedin/` — 4 units

Template examples (not real posts). Each has `caption.md`, `comments.md`, `meta.json`, `metrics.json`. No `tcps.json` or `alt-text.md`.

| Slug | Path |
|------|------|
| `_example-carousel` | `campaigns/_templates/campaign-template/social/linkedin/_example-carousel/` |
| `_example-longform` | `campaigns/_templates/campaign-template/social/linkedin/_example-longform/` |
| `_example-poll` | `campaigns/_templates/campaign-template/social/linkedin/_example-poll/` |
| `_example-single-image` | `campaigns/_templates/campaign-template/social/linkedin/_example-single-image/` |

---

## 3. `_shared/templates/campaign-template/social/linkedin/` — 4 units

Same structure as §2 (template copy). Same four slugs and markers.

| Slug | Path |
|------|------|
| `_example-carousel` | `_shared/templates/campaign-template/social/linkedin/_example-carousel/` |
| `_example-longform` | `_shared/templates/campaign-template/social/linkedin/_example-longform/` |
| `_example-poll` | `_shared/templates/campaign-template/social/linkedin/_example-poll/` |
| `_example-single-image` | `_shared/templates/campaign-template/social/linkedin/_example-single-image/` |

---

## 4. `playground/TITANVERSE/.../social/linkedin/` — 4 units

Playground campaign LinkedIn posts. Each has `caption.md`, `comments.md`, `meta.json`, `metrics.json`. No `tcps.json` or `alt-text.md`.

| Slug | Full path |
|------|-----------|
| `2025-12-16-multi-branch-control` | `playground/TITANVERSE/2025-12-16-multi-branch-control/social/linkedin/2025-12-16-multi-branch-control/` |
| `2025-12-17-impersonal-to-personal` | `playground/TITANVERSE/2025-12-17-impersonal-to-personal/social/linkedin/2025-12-17-impersonal-to-personal/` |
| `2025-12-19-trusted-resources` | `playground/TITANVERSE/2025-12-19-trusted-resources/social/linkedin/2025-12-19-trusted-resources/` |
| `2025-12-20-level-up-moment` | `playground/TITANVERSE/2025-12-20-level-up-moment/social/linkedin/2025-12-20-level-up-moment/` |

---

## 5. `campaigns/.../social/linkedin/` (TITAN / TITANVERSE) — 0 units

**None.** Former LinkedIn post folders under `campaigns/TITAN/` and `campaigns/TITANVERSE/` were removed in the earlier restructure. No `**/social/linkedin/**/metrics.json` (or other post markers) exist under `campaigns/` except `_templates` (§2).

---

## Excluded (not LinkedIn post units)

- **TikTok:** `campaigns/_templates/.../social/tiktok/_example-clip-1/`, `_shared/templates/.../social/tiktok/_example-clip-1/` — have `caption.md`, `comments.md`, `meta.json`, `metrics.json`.
- **YouTube:** `campaigns/_templates/.../social/youtube/_example-longform/`, `_example-short/`, and `_shared` copies — same markers.
- **`campaigns/TITAN/2025-07-16-ai-backup-not-burnout/notes/`** — contains `comments.md` only; campaign notes, not a post unit.
- **`campaigns/TITAN/2025-07-11-titan-1000th-pharmacy/meta.json`** — campaign-level `meta.json`; folder is not a post unit.

---

## Path patterns (for tooling)

- **`/posts/*/`** — flat LinkedIn post units.
- **`campaigns/_templates/campaign-template/social/linkedin/*/`** — template examples.
- **`_shared/templates/campaign-template/social/linkedin/*/`** — same, in `_shared`.
- **`playground/**/social/linkedin/*/`** — playground LinkedIn posts (currently only TITANVERSE).
- **`campaigns/**/social/linkedin/**`** — only under `_templates` now; no TITAN/TITANVERSE campaign posts.

No existing content was deleted for this inventory.
