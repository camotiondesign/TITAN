#!/usr/bin/env node
// Remove all TCPS-related fields and files from the repository

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

// TCPS fields to remove from metrics.json
const TCPS_FIELDS = [
  'tcps_version',
  'tcps_raw',
  'tcps_inputs',
  'tcps_efficiency_raw',
  'tcps_distribution_raw',
  'tcps_total_raw',
  'tcps_impression_tier',
  'tcps_warnings'
];

/**
 * Recursively find all files matching a pattern
 */
function findFiles(dir, pattern, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    try {
      const stat = fs.statSync(entryPath);
      if (stat.isDirectory()) {
        findFiles(entryPath, pattern, results);
      } else if (entry.match(pattern)) {
        results.push(entryPath);
      }
    } catch (err) {
      console.warn(`Skipping ${entryPath}: ${err.message}`);
    }
  }
  return results;
}

/**
 * Remove TCPS fields from a JSON file
 */
function removeTCPSFromJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    let modified = false;
    for (const field of TCPS_FIELDS) {
      if (data.hasOwnProperty(field)) {
        delete data[field];
        modified = true;
      }
    }
    
    if (modified) {
      const newContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, newContent, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('=== Removing TCPS from Repository ===\n');
  
  let metricsFilesUpdated = 0;
  let tcpsFilesDeleted = 0;
  let errors = 0;
  
  // 1. Remove TCPS fields from all metrics.json files
  console.log('1. Removing TCPS fields from metrics.json files...');
  const metricsFiles = findFiles(path.join(REPO_ROOT, 'posts'), /metrics\.json$/);
  console.log(`   Found ${metricsFiles.length} metrics.json files`);
  
  for (const file of metricsFiles) {
    try {
      if (removeTCPSFromJSON(file)) {
        metricsFilesUpdated++;
        if (metricsFilesUpdated % 50 === 0) {
          console.log(`   Updated ${metricsFilesUpdated} files...`);
        }
      }
    } catch (error) {
      console.error(`   Error processing ${file}: ${error.message}`);
      errors++;
    }
  }
  console.log(`   ✓ Updated ${metricsFilesUpdated} metrics.json files\n`);
  
  // 2. Delete all tcps.json files
  console.log('2. Deleting tcps.json files...');
  const tcpsFiles = findFiles(REPO_ROOT, /tcps\.json$/);
  console.log(`   Found ${tcpsFiles.length} tcps.json files`);
  
  for (const file of tcpsFiles) {
    try {
      fs.unlinkSync(file);
      tcpsFilesDeleted++;
      if (tcpsFilesDeleted % 50 === 0) {
        console.log(`   Deleted ${tcpsFilesDeleted} files...`);
      }
    } catch (error) {
      console.error(`   Error deleting ${file}: ${error.message}`);
      errors++;
    }
  }
  console.log(`   ✓ Deleted ${tcpsFilesDeleted} tcps.json files\n`);
  
  // 3. Remove TCPS from aggregated metrics
  console.log('3. Cleaning aggregated metrics file...');
  const aggregatedPath = path.join(REPO_ROOT, 'analytics', 'aggregated-linkedin-metrics.json');
  if (fs.existsSync(aggregatedPath)) {
    try {
      const content = fs.readFileSync(aggregatedPath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.posts && Array.isArray(data.posts)) {
        let postsUpdated = 0;
        for (const post of data.posts) {
          let modified = false;
          for (const field of TCPS_FIELDS) {
            if (post.hasOwnProperty(field)) {
              delete post[field];
              modified = true;
            }
          }
          if (modified) postsUpdated++;
        }
        
        const newContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(aggregatedPath, newContent, 'utf-8');
        console.log(`   ✓ Removed TCPS from ${postsUpdated} posts in aggregated file\n`);
      }
    } catch (error) {
      console.error(`   Error processing aggregated file: ${error.message}`);
      errors++;
    }
  }
  
  console.log('=== Summary ===');
  console.log(`✓ Updated ${metricsFilesUpdated} metrics.json files`);
  console.log(`✓ Deleted ${tcpsFilesDeleted} tcps.json files`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} errors encountered`);
  }
  console.log('\n✅ TCPS removal complete!');
  console.log('\nNext steps:');
  console.log('  - Review and update scripts that reference TCPS');
  console.log('  - Delete TCPS documentation files (_shared/tcps_spec.md, etc.)');
  console.log('  - Update aggregate-metrics.js to remove TCPS fields');
  
  return errors === 0 ? 0 : 1;
}

try {
  const exitCode = main();
  process.exit(exitCode);
} catch (error) {
  console.error('=== UNHANDLED ERROR ===');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
