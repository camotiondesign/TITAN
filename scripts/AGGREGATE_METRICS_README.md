# LinkedIn Metrics Aggregation for Zapier

This script aggregates all LinkedIn post metrics from TITAN campaigns into a single JSON file for easy consumption by Zapier or other integrations.

## What It Does

1. **Scans** all `metrics.json` files in `campaigns/TITAN/**/social/linkedin/*/metrics.json`
2. **Aggregates** them into a single JSON file at `analytics/aggregated-linkedin-metrics.json`
3. **Enriches** each post with metadata (post_slug, file path, aggregation timestamp)
4. **Sorts** posts by date (most recent first)

## Output Format

The aggregated file has this structure:

```json
{
  "metadata": {
    "aggregated_at": "2025-01-23T10:00:00.000Z",
    "total_posts": 150,
    "total_files_scanned": 150,
    "skipped_files": 0
  },
  "posts": [
    {
      "platform": "linkedin",
      "post_url": "...",
      "posted_at": "2025-12-08",
      "campaign_slug": "2025-12-08-titan-wrapped-2025",
      "asset_type": "carousel",
      "impressions": 2111,
      "reach": 1352,
      "clicks": 2039,
      "reactions": 30,
      "comments": 7,
      "reposts": 2,
      "follows": 2,
      "engagements": 2078,
      "engagement_rate": 98.4,
      "tcps_total_raw": 2247.1189,
      "tcps_impression_tier": "B",
      // ... all other metrics fields ...
      "post_slug": "2025-12-08-titan-wrapped-carousel",
      "metrics_file_path": "campaigns/TITAN/2025-12-08-titan-wrapped-2025/social/linkedin/2025-12-08-titan-wrapped-carousel/metrics.json",
      "aggregated_at": "2025-01-23T10:00:00.000Z"
    }
    // ... more posts ...
  ]
}
```

## Running Locally

```bash
node scripts/aggregate-metrics.js
```

The output will be written to `analytics/aggregated-linkedin-metrics.json`.

## GitHub Actions

The workflow runs:
- **Daily** at 5 AM UTC
- **Manually** via workflow_dispatch

It automatically commits the updated file to the repository.

## Zapier Integration Options

### Option 1: GitHub Webhook (Recommended)

1. **Set up GitHub Webhook** in Zapier:
   - Trigger: "New Commit" or "New File"
   - Repository: Your TITAN repo
   - Path filter: `analytics/aggregated-linkedin-metrics.json`

2. **Parse the file**:
   - Use "Code by Zapier" or "Formatter" to parse the JSON
   - Extract `posts` array
   - Process each post or filter as needed

### Option 2: GitHub API Polling

1. **Set up GitHub trigger** in Zapier:
   - Trigger: "Schedule" (poll every hour/day)
   - Action: "GitHub - Get File Contents"
   - File path: `analytics/aggregated-linkedin-metrics.json`
   - Branch: `main`

2. **Process the data**:
   - Parse JSON response
   - Use "Code by Zapier" to extract and transform data
   - Send to your destination (Google Sheets, Airtable, etc.)

### Option 3: Raw File URL

Use the GitHub raw file URL directly:
```
https://raw.githubusercontent.com/[your-org]/[repo]/main/analytics/aggregated-linkedin-metrics.json
```

Then use Zapier's "Webhooks by Zapier" to fetch and parse.

## Example Zapier Workflow

**Trigger:** GitHub Webhook (file updated)
**Action 1:** Code by Zapier (parse JSON)
```javascript
const data = JSON.parse(inputData.content);
return {
  posts: data.posts,
  total_posts: data.metadata.total_posts,
  aggregated_at: data.metadata.aggregated_at
};
```

**Action 2:** Filter (optional - only process new posts)
- Filter by `aggregated_at` timestamp
- Or compare with previous run

**Action 3:** Create/Update records in destination
- Google Sheets
- Airtable
- Database
- etc.

## Notes

- The file is updated daily via GitHub Actions
- Each post includes all original metrics plus enrichment fields
- Posts are sorted by `posted_at` date (most recent first)
- Invalid JSON files are skipped (logged to console)
