#!/usr/bin/env node
/**
 * Merge Transcript Extract Batches
 *
 * Takes raw JSON arrays from each extraction agent, merges them,
 * deduplicates, assigns sequential IDs, and writes the final export.
 *
 * Run: node scripts/merge-transcript-extracts.js
 *
 * Expects batch files at: exports/_batch-{1-5}.json
 * Outputs: exports/transcript-extracts.json
 */

const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

// Read all batch files
const batches = [];
for (let i = 1; i <= 5; i++) {
  const p = path.join(EXPORTS_DIR, `_batch-${i}.json`);
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`Batch ${i}: ${data.length} extracts`);
    batches.push(...data);
  } else {
    console.warn(`Warning: ${p} not found, skipping`);
  }
}

console.log(`\nTotal raw extracts: ${batches.length}`);

// Deduplicate: same speaker name + first 60 chars of quote
const seen = new Set();
const deduped = [];
for (const extract of batches) {
  const key = `${(extract.speaker?.name || 'unknown').toLowerCase()}_${(extract.quote || '').substring(0, 60).toLowerCase()}`;
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(extract);
  } else {
    console.log(`  Dedup: ${extract.speaker?.name} - "${extract.quote?.substring(0, 50)}..."`);
  }
}

console.log(`After deduplication: ${deduped.length}`);

// Assign sequential IDs per speaker
const speakerCounts = {};
for (const extract of deduped) {
  const name = (extract.speaker?.name || 'unknown').toLowerCase().replace(/[^a-z]/g, '');
  speakerCounts[name] = (speakerCounts[name] || 0) + 1;
  extract.id = `${name}-${String(speakerCounts[name]).padStart(3, '0')}`;
}

// Sort: by speaker name, then by source file, then by timestamp
deduped.sort((a, b) => {
  const nameA = (a.speaker?.name || '').toLowerCase();
  const nameB = (b.speaker?.name || '').toLowerCase();
  if (nameA !== nameB) return nameA.localeCompare(nameB);
  const fileA = a.source?.file || '';
  const fileB = b.source?.file || '';
  if (fileA !== fileB) return fileA.localeCompare(fileB);
  const tsA = a.source?.timestamp || '';
  const tsB = b.source?.timestamp || '';
  return tsA.localeCompare(tsB);
});

// Category stats
const catCounts = {};
for (const e of deduped) {
  catCounts[e.category] = (catCounts[e.category] || 0) + 1;
}

// Build final output
const output = {
  meta: {
    generated_at: new Date().toISOString(),
    version: 1,
    total_extracts: deduped.length,
    categories: catCounts,
    speakers: [...new Set(deduped.map(e => e.speaker?.name).filter(Boolean))].sort(),
  },
  extracts: deduped,
};

const outPath = path.join(EXPORTS_DIR, 'transcript-extracts.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`\nWrote ${outPath} (${sizeKB} KB)`);
console.log(`\nCategory breakdown:`);
for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}
console.log(`\nSpeakers: ${output.meta.speakers.join(', ')}`);
