# UTM Naming Convention — Titan & Titanverse

**Updated:** February 11, 2026

---

## How It Works

Every link in a LinkedIn or TikTok post should be a Bitly short link with UTM parameters baked in.

This lets GA4 attribute website traffic back to the exact post, platform, and campaign — fixing the broken referral chain that plain bit.ly links cause.

---

## The Five Fields

| Field | What It Means | How to Fill It |
|-------|---------------|----------------|
| **Source** | Where the traffic comes from | `linkedin` or `tiktok` |
| **Medium** | Type of channel | Always `social` |
| **Campaign** | Content bucket / initiative | See campaign values below |
| **Term** | Keyword targeting (paid only) | Leave blank |
| **Content** | Exact post identifier | The Notion post name (e.g. `TV_ServicesSpinUp_Matrix`) |

---

## Campaign Values

Use these consistently. Lowercase, underscores, no spaces.

### Titan PMR Campaigns
| Campaign Value | When to Use |
|----------------|-------------|
| `titan_product` | Product education posts (features, workflows, demos) |
| `titan_casestudy` | Customer story / testimonial posts |
| `titan_advocacy` | Industry opinion / "Why X Fails" format |
| `titan_education` | Industry education (compliance, funding, trends) |
| `titan_community` | Memes, relatable content, engagement posts |

### Titanverse Campaigns
| Campaign Value | When to Use |
|----------------|-------------|
| `titanverse_services` | Clinical services platform features |
| `titanverse_casestudy` | Customer transformation stories |
| `titanverse_advocacy` | Stance-taking / opinion content |
| `titanverse_education` | Industry education via Titanverse lens |
| `titanverse_community` | Community / engagement content |

### Cross-Brand Campaigns
| Campaign Value | When to Use |
|----------------|-------------|
| `titanup2026` | Any TitanUp 2026 event content |
| `titan_leadership` | Leadership thought leadership posts |
| `titan_blog` | Blog promotion posts (either brand) |

---

## Destination URLs

| Brand | Base URL |
|-------|----------|
| Titan PMR | `https://titanpmr.com/` |
| Titanverse | `https://titanverse.co.uk/` |
| TitanUp | `https://titanup.co.uk/` (or landing page when live) |
| Blog | Full blog post URL |

---

## Example: Full URL Build

**Post:** `TV_ServicesSpinUp_Matrix`
**Platform:** LinkedIn
**Content type:** Product education (Titanverse services)

Bitly fields:
```
Source:   linkedin
Medium:   social
Campaign: titanverse_services
Term:     (blank)
Content:  TV_ServicesSpinUp_Matrix
```

Generated URL:
```
https://titanverse.co.uk/?utm_source=linkedin&utm_medium=social&utm_campaign=titanverse_services&utm_content=TV_ServicesSpinUp_Matrix
```

→ Shorten in Bitly → Use short link in caption.

---

## Workflow

1. Write the post in Notion
2. Before publishing, open Bitly → Create new link
3. Paste the destination URL
4. Open Advanced Settings → UTM Parameters
5. Fill in Source, Medium, Campaign, Content (using this guide)
6. Copy the short link
7. Paste short link into the post caption
8. Paste the full UTM URL into the **UTM Link** property in Notion (for tracking)

---

## In Notion

The **UTM Link** property on each post stores the full unshortened UTM URL. This means we can:
- Audit UTM consistency across posts
- Cross-reference GA4 campaign data back to specific Notion entries
- Eventually automate UTM generation via API

---

## Rules

- **Always lowercase** — GA4 is case-sensitive, inconsistent casing splits data
- **Always use underscores** — no spaces, no hyphens
- **Content field = Notion post name** — this is the unique identifier
- **One link per post** — if a post has multiple CTAs, use the primary one
- **Don't UTM internal links** — only external-facing links (website, blog, landing pages)

---

*v1.0 | February 11, 2026*
