# Case studies

Canonical copies of published pharmacy case studies for reference, tagging, and reuse (website, social, email).

## Structure

Each case study has its own folder:

```
website-content/case-studies/
  README.md                    (this file)
  pharmacy-name-slug/
    meta.json                  (title, pharmacy, url, date, tags, stats, products_used)
    content.md                 (full case study in Markdown)
```

### Folder name

`pharmacy-name-slug` — URL-safe slug (e.g. `safys-chemist-melton-road`).

### meta.json

| Field | Description |
|-------|-------------|
| `title` | Full case study title (e.g. headline) |
| `pharmacy` | Pharmacy name and location (e.g. "Safy's Chemist, Melton Road") |
| `url` | Canonical case study URL (titanpmr.com/case-studies/...) if published |
| `published_at` | Publication date (YYYY-MM-DD), or null if draft |
| `tags` | Array of topic tags — safety, efficiency, time-savings, paperless, etc. |
| `stats` | Key outcome stats (e.g. `{"near_misses_reduced_pct": 97, "pharmacist_time_reclaimed_pct": 85}`) |
| `products_used` | Array of product names used in the study (e.g. `["Titan PMR"]`) |

### content.md

Full case study in Markdown: headline, intro, The Challenge, How they did it, The Results, The Takeaway, CTA. No front matter; metadata lives in `meta.json`.

## Adding a case study

1. Create a folder: `website-content/case-studies/your-pharmacy-slug/`.
2. Add `meta.json` with `title`, `pharmacy`, `url` (or null), `published_at`, `tags`, `stats`, and `products_used`.
3. Add `content.md` with the full case study content in Markdown.

## Use for tagging and reuse

- **Tagging:** Edit `meta.json` → `tags` and `stats` so case studies are easy to find and compare.
- **Search:** Grep or search by pharmacy name, tag, or stat.
- **Reuse:** Reference `content.md` or sections for LinkedIn posts, emails, or follow-up pieces.
