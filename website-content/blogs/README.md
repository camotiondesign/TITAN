# Published blogs

Canonical copies of published Titan blog posts for reference, tagging, and content reuse.

## Structure

Each blog has its own folder:

```
website-content/blogs/
  README.md                    (this file)
  YYYY-MM-DD-slug/
    meta.json                  (link, title, date, read time, tags)
    content.md                 (full body in Markdown)
```

### Folder name

`YYYY-MM-DD-slug` — publication date plus a short URL-safe slug (e.g. `2026-01-22-bulk-nomination-patient-choice`).

### meta.json

| Field | Description |
|-------|-------------|
| `url` | Canonical blog URL (titanpmr.com/blog/...) |
| `title` | Full title |
| `published_at` | Publication date (YYYY-MM-DD) |
| `read_time_min` | Read time in minutes |
| `slug` | URL slug from the live blog (for linking) |
| `tags` | Array of topic tags — add or edit for search and reuse |

### content.md

Full post body in Markdown: headings, paragraphs, lists, and any inline links. No front matter; metadata lives in `meta.json`.

## Adding a blog

1. Create a folder: `website-content/blogs/YYYY-MM-DD-your-slug/`.
2. Add `meta.json` with `url`, `title`, `published_at`, `read_time_min`, `slug`, and `tags` (can be `[]`).
3. Add `content.md` with the full post content in Markdown.
