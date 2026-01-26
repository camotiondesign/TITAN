#!/usr/bin/env node
// Aggregate LinkedIn metrics from all published posts for Zapier integration.
// Scans posts/titan/published/**/metrics.json and posts/titanverse/published/**/metrics.json
// and aggregates all posts into a single JSON array for Zapier.

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', 'posts');
const OUTPUT_PATH = path.join(__dirname, '..', 'analytics', 'aggregated-linkedin-metrics.json');

/**
 * Recursively find all metrics.json files in published post directories
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
        // Check if this directory contains a metrics.json file
        const metricsPath = path.join(entryPath, 'metrics.json');
        if (fs.existsSync(metricsPath)) {
          results.push(metricsPath);
        } else {
          // Continue searching in subdirectories
          findLinkedinMetricsFiles(entryPath, results);
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
    // Path format: posts/[brand]/published/[post-slug]/metrics.json
    // or: posts/[brand]/needs-metrics/[post-slug]/metrics.json
    // or: posts/[brand]/unpublished/[post-slug]/metrics.json
    const parts = filePath.split(path.sep);
    const postSlug = path.basename(path.dirname(filePath));

    // Calculate relative path safely
    let relativePath;
    try {
      const repoRoot = path.join(__dirname, '..');
      relativePath = path.relative(repoRoot, filePath);
    } catch (e) {
      relativePath = filePath;
    }

    // Try to load caption from same directory
    let caption = null;
    try {
      const captionPath = path.join(path.dirname(filePath), 'caption.md');
      if (fs.existsSync(captionPath)) {
        const captionContent = fs.readFileSync(captionPath, 'utf-8');
        if (captionContent && captionContent.trim().length > 0) {
          caption = captionContent.trim();
        }
      }
    } catch (error) {
      // Caption is optional, so just log a warning
      console.warn(`Could not load caption for ${filePath}: ${error.message}`);
    }

    // Extract only organic metrics - ignore sponsored data completely
    const organicMetrics = metrics.organic || {};
    
    // Use organic metrics exclusively - no fallback to top-level metrics
    // This ensures we only include true organic performance
    const organicImpressions = organicMetrics.impressions || 0;
    
    // Build clean post object with only organic metrics
    const cleanPost = {
      platform: metrics.platform || 'linkedin',
      post_url: metrics.post_url || '',
      posted_at: metrics.posted_at || '',
      campaign_slug: metrics.campaign_slug || '',
      asset_type: metrics.asset_type || '',
      boosted: metrics.boosted || false,
      // Only include organic metrics (no fallbacks to top-level)
      impressions: organicImpressions,
      reach: organicMetrics.reach || 0,
      views: organicMetrics.video_views || 0,
      watch_time_hours: metrics.watch_time_hours || 0, // Keep this as it's total watch time
      avg_view_duration_seconds: organicMetrics.average_watch_time_seconds || 0,
      clicks: organicMetrics.clicks || 0,
      ctr: organicMetrics.click_through_rate || 0,
      reactions: organicMetrics.reactions || 0,
      comments: organicMetrics.comments || 0,
      reposts: organicMetrics.reposts || 0,
      follows: organicMetrics.followers_gained || 0,
      leads: 0, // Leads are typically not broken down by organic/sponsored
      engagements: organicMetrics.engagements || 0,
      engagement_rate: organicMetrics.engagement_rate || 0,
      // Metadata
      notes: metrics.notes || '',
      post_slug: postSlug,
      metrics_file_path: relativePath,
      caption: caption,
      aggregated_at: new Date().toISOString(),
    };

    return cleanPost;
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
    console.log(`Posts directory: ${POSTS_DIR}`);

    if (!fs.existsSync(POSTS_DIR)) {
      console.error(`❌ Posts directory not found: ${POSTS_DIR}`);
      console.error(`   Current working directory: ${process.cwd()}`);
      return 1;
    }

    // Scan both titan and titanverse published posts
    const titanPublishedDir = path.join(POSTS_DIR, 'titan', 'published');
    const titanversePublishedDir = path.join(POSTS_DIR, 'titanverse', 'published');
    
    console.log(`Scanning for LinkedIn metrics in published posts...`);
    const titanFiles = fs.existsSync(titanPublishedDir) ? findLinkedinMetricsFiles(titanPublishedDir) : [];
    const titanverseFiles = fs.existsSync(titanversePublishedDir) ? findLinkedinMetricsFiles(titanversePublishedDir) : [];
    const metricsFiles = [...titanFiles, ...titanverseFiles];
    console.log(`Found ${metricsFiles.length} metrics.json files (${titanFiles.length} Titan, ${titanverseFiles.length} Titanverse)`);

    let warning = null;
    if (metricsFiles.length === 0) {
      console.warn('⚠️  No LinkedIn metrics.json files found under posts/*/published/**');
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
          // Only include posts with actual metrics (impressions > 0)
          const organicImpressions = post.impressions || 0;
          if (organicImpressions > 0) {
            aggregated.push(post);
          } else {
            skipped++;
            // Only log every 10th skipped post to avoid spam
            if (skipped % 10 === 0 || skipped <= 5) {
              console.log(`  Skipping post with no organic impressions: ${post.post_slug || file}`);
            }
          }
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
      // All posts in aggregated already have impressions > 0 (filtered above)
      const totalImpressions = aggregated.reduce(
        (sum, p) => sum + (p.impressions || 0),
        0
      );
      const totalEngagements = aggregated.reduce(
        (sum, p) => sum + (p.engagements || 0),
        0
      );
      const postsWithCaptions = aggregated.filter(p => p.caption).length;

      console.log('\nSummary:');
      console.log(`  - Posts with organic metrics: ${aggregated.length}`);
      console.log(`  - Posts with captions: ${postsWithCaptions}`);
      console.log(`  - Total organic impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`  - Total organic engagements: ${totalEngagements.toLocaleString()}`);
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