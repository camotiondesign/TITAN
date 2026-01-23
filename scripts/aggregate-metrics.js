#!/usr/bin/env node
/**
 * Aggregate LinkedIn metrics from all campaigns for Zapier integration
 * 
 * Scans campaigns/TITAN/**/social/linkedin/*/metrics.json and aggregates
 * all posts into a single JSON array for easy consumption by Zapier.
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'campaigns', 'TITAN');
const OUTPUT_PATH = path.join(__dirname, '..', 'analytics', 'aggregated-linkedin-metrics.json');

/**
 * Recursively find all metrics.json files under social/linkedin directories
 */
function findLinkedinMetricsFiles(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir);

  entries.forEach(entry => {
    const entryPath = path.join(dir, entry);
    
    try {
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        findLinkedinMetricsFiles(entryPath, results);
      } else if (entry === 'metrics.json') {
        // Only keep metrics.json files that live under social/linkedin
        const parts = entryPath.split(path.sep);
        const socialIndex = parts.indexOf('social');
        if (socialIndex !== -1 && parts[socialIndex + 1] === 'linkedin') {
          results.push(entryPath);
        }
      }
    } catch (err) {
      // Skip files/dirs we can't access
      console.warn(`Skipping ${entryPath}: ${err.message}`);
    }
  });

  return results;
}

/**
 * Load and enrich a single metrics file
 */
function loadPostMetrics(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let metrics;

  try {
    metrics = JSON.parse(raw);
  } catch (e) {
    console.error(`Skipping invalid JSON in ${filePath}: ${e.message}`);
    return null;
  }

  // Extract post slug from path
  // Path format: campaigns/TITAN/[campaign-slug]/social/linkedin/[post-slug]/metrics.json
  const parts = filePath.split(path.sep);
  const linkedinIndex = parts.indexOf('linkedin');
  const postSlug = linkedinIndex !== -1 && parts[linkedinIndex + 1] 
    ? parts[linkedinIndex + 1] 
    : null;

  // Enrich with metadata
  return {
    // Keep all original metrics
    ...metrics,
    // Add metadata for Zapier
    post_slug: postSlug,
    metrics_file_path: path.relative(path.join(__dirname, '..'), filePath),
    aggregated_at: new Date().toISOString(),
  };
}

/**
 * Main aggregation function
 */
function main() {
  if (!fs.existsSync(BASE_DIR)) {
    console.error(`Base directory not found: ${BASE_DIR}`);
    process.exit(1);
  }

  console.log(`Scanning for LinkedIn metrics in ${BASE_DIR}...`);
  const metricsFiles = findLinkedinMetricsFiles(BASE_DIR);
  console.log(`Found ${metricsFiles.length} metrics.json files`);

  const aggregated = [];
  let skipped = 0;

  metricsFiles.forEach(file => {
    const post = loadPostMetrics(file);
    if (post) {
      aggregated.push(post);
    } else {
      skipped++;
    }
  });

  // Sort by posted_at date (most recent first), then by campaign_slug
  aggregated.sort((a, b) => {
    const dateA = a.posted_at || '';
    const dateB = b.posted_at || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return (a.campaign_slug || '').localeCompare(b.campaign_slug || '');
  });

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write aggregated data
  const output = {
    metadata: {
      aggregated_at: new Date().toISOString(),
      total_posts: aggregated.length,
      total_files_scanned: metricsFiles.length,
      skipped_files: skipped,
    },
    posts: aggregated,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\n✓ Aggregated ${aggregated.length} LinkedIn posts`);
  console.log(`  - Output: ${OUTPUT_PATH}`);
  console.log(`  - Skipped: ${skipped} invalid files`);
  
  // Summary stats
  if (aggregated.length > 0) {
    const withImpressions = aggregated.filter(p => p.impressions > 0).length;
    const totalImpressions = aggregated.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalEngagements = aggregated.reduce((sum, p) => sum + (p.engagements || 0), 0);
    
    console.log(`\nSummary:`);
    console.log(`  - Posts with impressions: ${withImpressions}`);
    console.log(`  - Total impressions: ${totalImpressions.toLocaleString()}`);
    console.log(`  - Total engagements: ${totalEngagements.toLocaleString()}`);
  }
}

main();
