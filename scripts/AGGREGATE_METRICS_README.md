# LinkedIn Metrics Aggregation for Zapier

This script aggregates all LinkedIn post metrics from TITAN campaigns into a single JSON file for easy consumption by Zapier or other integrations.

## What It Does

1. **Scans** all `metrics.json` files in `posts/titan/published/**/metrics.json` and `posts/titanverse/published/**/metrics.json`
2. **Filters** to only include posts with organic metrics (impressions > 0)
3. **Extracts** only organic performance data (excludes all sponsored metrics)
4. **Loads** post captions from `caption.md` files
5. **Aggregates** them into a single JSON file at `analytics/aggregated-linkedin-metrics.json`
6. **Enriches** each post with metadata (post_slug, file path, caption, aggregation timestamp)
7. **Sorts** posts by date (most recent first)

## Output Format

The aggregated file has this structure:

```json
{
  "metadata": {
    "aggregated_at": "2025-01-23T10:00:00.000Z",
    "total_posts": 120,
    "total_files_scanned": 150,
    "skipped_files": 30
  },
  "posts": [
    {
      "platform": "linkedin",
      "post_url": "...",
      "posted_at": "2025-12-08",
      "campaign_slug": "2025-12-08-titan-wrapped-2025",
      "asset_type": "carousel",
      "boosted": false,
      // ⚠️ IMPORTANT: All metrics below are ORGANIC ONLY (no sponsored data)
      "impressions": 2111,        // Organic impressions only
      "reach": 1352,              // Organic reach only
      "clicks": 2039,             // Organic clicks only
      "reactions": 30,            // Organic reactions only
      "comments": 7,              // Organic comments only
      "reposts": 2,               // Organic reposts only
      "follows": 2,               // Organic follows only
      "engagements": 2078,        // Organic engagements only
      "engagement_rate": 98.4,    // Organic engagement rate only
      "views": 0,                 // Organic video views (if applicable)
      "watch_time_hours": 0,      // Total watch time
      "avg_view_duration_seconds": 0,
      "ctr": 96.6,                // Organic CTR only
      // ... all other metrics fields ...
      // 📝 NEW: Post caption included
      "caption": "Titan PMR Wrapped 2025. A busy year for pharmacy...",
      "post_slug": "2025-12-08-titan-wrapped-carousel",
      "metrics_file_path": "posts/titan/published/2025-12-08-titan-wrapped-carousel/metrics.json",
      "aggregated_at": "2025-01-23T10:00:00.000Z"
    }
    // ... more posts ...
  ]
}
```

### Key Features

1. **Organic Metrics Only**: All performance metrics (impressions, reach, engagements, etc.) are from organic performance only. Sponsored/boosted metrics are excluded.

2. **Captions Included**: Each post includes the full LinkedIn caption text in the `caption` field (or `null` if missing).

3. **Filtered Data**: Only posts with actual organic metrics (impressions > 0) are included. Posts with no metrics or zero impressions are excluded.

4. **Clean Structure**: No nested `organic` or `sponsored` objects - all metrics are at the top level and guaranteed to be organic.

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

## Complete Zapier Setup Guide

### 📍 Data Location
**File URL:** `https://raw.githubusercontent.com/camotiondesign/TITAN/main/analytics/aggregated-linkedin-metrics.json`

**What You Get:**
- ✅ **Organic metrics only** - All performance data excludes sponsored/boosted metrics
- ✅ **Post captions included** - Full LinkedIn caption text in `caption` field
- ✅ **Pre-filtered** - Only posts with organic impressions > 0 are included
- ✅ **Updated daily** - Automatically refreshed at 5 AM UTC via GitHub Actions

### 📊 Data Structure

Each post in the `posts` array contains:

**Core Fields:**
- `platform`: "linkedin"
- `post_url`: LinkedIn post URL
- `posted_at`: "YYYY-MM-DD" format
- `campaign_slug`: Campaign identifier
- `asset_type`: "carousel", "single-image", "video", etc.
- `boosted`: true/false (whether post was boosted)

**Organic Performance Metrics (ALL ORGANIC ONLY):**
- `impressions`: Organic impressions only
- `reach`: Organic reach only
- `clicks`: Organic clicks only
- `reactions`: Organic reactions only
- `comments`: Organic comments only
- `reposts`: Organic reposts only
- `follows`: Organic follows only
- `engagements`: Organic engagements only
- `engagement_rate`: Organic engagement rate (%)
- `ctr`: Organic click-through rate (%)
- `views`: Organic video views (if applicable)
- `watch_time_hours`: Total watch time
- `avg_view_duration_seconds`: Average view duration

**Content:**
- `caption`: Full LinkedIn post caption text (or `null` if missing)

**Metadata:**
- `post_slug`: Unique post identifier
- `metrics_file_path`: Path to original metrics file
- `aggregated_at`: ISO timestamp when data was aggregated

### 🔌 Zapier Integration Options

**Option 1: GitHub Webhook (Recommended - Real-time)**
1. Trigger: "GitHub - New Commit" or "New File"
2. Repository: `camotiondesign/TITAN`
3. Path filter: `analytics/aggregated-linkedin-metrics.json`
4. Parse JSON in next step

**Option 2: Scheduled Polling**
1. Trigger: "Schedule by Zapier" (daily/hourly)
2. Action: "GitHub - Get File Contents"
3. File path: `analytics/aggregated-linkedin-metrics.json`
4. Branch: `main`

**Option 3: Direct URL Fetch**
1. Trigger: "Schedule by Zapier" or "Webhooks by Zapier"
2. Fetch: `https://raw.githubusercontent.com/camotiondesign/TITAN/main/analytics/aggregated-linkedin-metrics.json`
3. Parse JSON response

### 💻 Zapier Code Examples

**Step 1: Parse JSON Data**
```javascript
// Code by Zapier - Run JavaScript
const data = JSON.parse(inputData.content || inputData.body);
return {
  posts: data.posts,
  total_posts: data.metadata.total_posts,
  skipped_posts: data.metadata.skipped_files,
  aggregated_at: data.metadata.aggregated_at
};
```

**Step 2: Filter High-Performing Posts**
```javascript
// Code by Zapier - Run JavaScript
const posts = inputData.posts;
const highPerformers = posts.filter(post => {
  return post.impressions > 1000 && 
         post.engagement_rate > 5 && 
         post.caption !== null;
});

return {
  high_performers: highPerformers,
  count: highPerformers.length
};
```

**Step 3: Extract Captions for Analysis**
```javascript
// Code by Zapier - Run JavaScript
const posts = inputData.posts;
const postsWithCaptions = posts
  .filter(post => post.caption)
  .map(post => ({
    post_slug: post.post_slug,
    caption: post.caption,
    impressions: post.impressions,
    engagement_rate: post.engagement_rate,
    posted_at: post.posted_at,
    campaign_slug: post.campaign_slug
  }));

return { posts_with_captions: postsWithCaptions };
```

**Step 4: Process Individual Posts (Loop)**
```javascript
// Code by Zapier - Run JavaScript (in a Loop)
// This runs once per post in the array
const post = inputData.post;

return {
  post_id: post.post_slug,
  date: post.posted_at,
  caption: post.caption || "No caption",
  organic_impressions: post.impressions,
  organic_engagements: post.engagements,
  engagement_rate: post.engagement_rate,
  clicks: post.clicks,
  reactions: post.reactions,
  comments: post.comments,
  reposts: post.reposts,
  campaign: post.campaign_slug,
  post_url: post.post_url
};
```

### 📋 Complete Zapier Workflow Example

**Zap Structure:**
1. **Trigger:** GitHub - New Commit (or Schedule)
   - Repository: `camotiondesign/TITAN`
   - Path: `analytics/aggregated-linkedin-metrics.json`

2. **Action:** Code by Zapier - Parse JSON
   ```javascript
   const data = JSON.parse(inputData.content);
   return { posts: data.posts };
   ```

3. **Action:** Code by Zapier - Filter & Transform
   ```javascript
   const posts = inputData.posts;
   return posts.map(post => ({
     date: post.posted_at,
     caption: post.caption,
     impressions: post.impressions,
     engagements: post.engagements,
     engagement_rate: post.engagement_rate,
     campaign: post.campaign_slug,
     url: post.post_url
   }));
   ```

4. **Action:** Google Sheets - Create Spreadsheet Row
   - Map each field to a column
   - Or use Airtable/Database instead

### ⚠️ Important Notes for Zapier

1. **All metrics are organic-only** - No need to filter out sponsored data, it's already excluded
2. **Captions may be null** - Always check `post.caption !== null` before using caption text
3. **Posts are pre-filtered** - All posts have `impressions > 0`, no need to filter again
4. **Data updates daily** - File refreshes automatically, so schedule your Zap accordingly
5. **No nested objects** - All metrics are at the top level (no `organic` or `sponsored` objects)

### 🎯 Common Use Cases

- **Content Analysis:** Extract captions to analyze what content performs best
- **Performance Tracking:** Track organic impressions, engagements, and engagement rates over time
- **Campaign Reporting:** Group by `campaign_slug` to see campaign-level performance
- **Content Repurposing:** Identify high-performing posts (`engagement_rate > 5`) for repurposing
- **A/B Testing:** Compare performance across different `asset_type` values

## Notes

- The file is updated daily via GitHub Actions
- **Organic metrics only**: All performance data excludes sponsored/boosted metrics
- **Captions included**: Full LinkedIn post captions are available in the `caption` field
- **Filtered posts**: Only posts with organic impressions > 0 are included
- Posts are sorted by `posted_at` date (most recent first)
- Invalid JSON files and posts with no metrics are skipped (logged to console)
- The `skipped_files` count in metadata includes both invalid files and posts with zero impressions
