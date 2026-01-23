#!/usr/bin/env node
// Aggregate LinkedIn metrics from all campaigns for Zapier integration.
// Scans campaigns/TITAN/*/social/linkedin/*/metrics.json and aggregates
// all posts into a single JSON array for Zapier.

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

  for (const entry of entries) {
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
      console.warn(`Skipping ${entryPath}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Load and enrich a single metrics file
 */
function loadPostMetrics(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File does not exist: ${filePath}`);
      return null;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');

    if (!raw || raw.trim().length === 0) {
      console.warn(`Empty file: ${filePath}`);
      return null;
    }

    let metrics;
    try {
      metrics = JSON.parse(raw);
    } catch (e) {
      console.error(`Skipping invalid JSON in ${filePath}: ${e.message}`);
      return null;
    }

    if (!metrics || typeof metrics !== 'object') {
      console.warn(`Invalid metrics object in ${filePath}`);
      return null;
    }

    // Extract post slug from path
    // Path format: campaigns/TITAN/[campaign-slug]/social/linkedin/[post-slug]/metrics.json
    const parts = filePath.split(path.sep);
    const linkedinIndex = parts.indexOf('linkedin');
    const postSlug =
      linkedinIndex !== -1 && parts[linkedinIndex + 1]
        ? parts[linkedinIndex + 1]
        : null;

    // Calculate relative path safely
    let relativePath;
    try {
      const repoRoot = path.join(__dirname, '..');
      relativePath = path.relative(repoRoot, filePath);
    } catch (e) {
      relativePath = filePath;
    }

    return {
      ...metrics,
      post_slug: postSlug,
      metrics_file_path: relativePath,
      aggregated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error loading metrics from ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Main aggregation function
 */
function main() {
  try {
    console.log(`Working directory: ${process.cwd()}`);
    console.log(`Script location: ${__dirname}`);
    console.log(`Base directory: ${BASE_DIR}`);

    const campaignsDir = path.join(__dirname, '..', 'campaigns');
    if (!fs.existsSync(campaignsDir)) {
      console.error(`❌ Campaigns directory not found: ${campaignsDir}`);
      console.error(`   Current working directory: ${process.cwd()}`);
      return 1;
    }

    console.log(`Base directory exists: ${fs.existsSync(BASE_DIR)}`);

    if (!fs.existsSync(BASE_DIR)) {
      console.warn(`⚠️  Base directory not found: ${BASE_DIR}`);
      console.warn(`   This is expected if no TITAN campaigns exist yet. Creating empty output.`);
    }

    console.log(`Scanning for LinkedIn metrics in ${BASE_DIR}...`);
    const metricsFiles = findLinkedinMetricsFiles(BASE_DIR);
    console.log(`Found ${metricsFiles.length} metrics.json files`);

    let warning = null;
    if (metricsFiles.length === 0) {
      console.warn('⚠️  No LinkedIn metrics.json files found under campaigns/TITAN/**/social/linkedin/**');
      warning = 'No metrics files found';
    }

    const aggregated = [];
    let skipped = 0;
    let processed = 0;

    for (const file of metricsFiles) {
      try {
        processed++;
        if (processed % 10 === 0) {
          console.log(`Processing file ${processed}/${metricsFiles.length}...`);
        }
        const post = loadPostMetrics(file);
        if (post) {
          aggregated.push(post);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
        skipped++;
      }
    }

    console.log(`Processed ${processed} files, ${aggregated.length} successful, ${skipped} skipped`);

    if (aggregated.length === 0 && metricsFiles.length > 0) {
      console.warn('⚠️  Aggregation produced 0 valid LinkedIn posts.');
      if (!warning) {
        warning = 'All metrics files were invalid or empty';
      }
    }

    try {
      aggregated.sort((a, b) => {
        try {
          const dateA = a.posted_at || '';
          const dateB = b.posted_at || '';
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
          }
          return (a.campaign_slug || '').localeCompare(b.campaign_slug || '');
        } catch {
          return 0;
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not sort posts: ${error.message}`);
    }

    const outputDir = path.dirname(OUTPUT_PATH);
    console.log(`Output directory: ${outputDir}`);
    try {
      if (!fs.existsSync(outputDir)) {
        console.log(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (error) {
      console.error(`❌ Failed to create output directory: ${outputDir}`);
      console.error(`   Error: ${error.message}`);
      return 1;
    }

    const output = {
      metadata: {
        aggregated_at: new Date().toISOString(),
        total_posts: aggregated.length,
        total_files_scanned: metricsFiles.length,
        skipped_files: skipped,
        ...(warning ? { warning } : {}),
      },
      posts: aggregated,
    };

    console.log(`Writing output to: ${OUTPUT_PATH}`);
    try {
      const jsonOutput = JSON.stringify(output, null, 2);
      fs.writeFileSync(OUTPUT_PATH, jsonOutput, 'utf-8');
      console.log(`✓ Successfully wrote ${aggregated.length} posts to ${OUTPUT_PATH}`);

      if (fs.existsSync(OUTPUT_PATH)) {
        const stats = fs.statSync(OUTPUT_PATH);
        console.log(`✓ File verified: ${stats.size} bytes`);
      } else {
        console.error('❌ Output file was not created after write operation');
        return 1;
      }
    } catch (error) {
      console.error(`❌ Failed to write output file: ${error.message}`);
      return 1;
    }

    console.log(`\n✓ Aggregated ${aggregated.length} LinkedIn posts`);
    console.log(`  - Output: ${OUTPUT_PATH}`);
    console.log(`  - Skipped: ${skipped} invalid files`);
    if (warning) {
      console.log(`  - Warning: ${warning}`);
    }

    if (aggregated.length > 0) {
      const withImpressions = aggregated.filter(p => p.impressions > 0).length;
      const totalImpressions = aggregated.reduce(
        (sum, p) => sum + (p.impressions || 0),
        0
      );
      const totalEngagements = aggregated.reduce(
        (sum, p) => sum + (p.engagements || 0),
        0
      );

      console.log('\nSummary:');
      console.log(`  - Posts with impressions: ${withImpressions}`);
      console.log(`  - Total impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`  - Total engagements: ${totalEngagements.toLocaleString()}`);
    }

    console.log('\n✅ Aggregation completed successfully!');
    return 0;
  } catch (error) {
    console.error('\n❌ Unexpected error in main():', error.message);
    console.error('Stack trace:', error.stack);
    return 1;
  }
}

try {
  const exitCode = main();
  if (exitCode === 0 || exitCode === undefined) {
    console.log('Script completed successfully');
    process.exit(0);
  } else {
    console.error(`Script exited with code: ${exitCode}`);
    process.exit(exitCode);
  }
} catch (error) {
  console.error('=== UNHANDLED ERROR (this is a bug) ===');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('Error name:', error.name);
  if (error.code) {
    console.error('Error code:', error.code);
  }
  process.exit(1);
}