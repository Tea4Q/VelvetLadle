/**
 * Console Log Cleanup Script
 * This script removes console.log statements from the codebase for production builds
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directories to exclude
const excludeDirs = ['node_modules', '.git', '.expo', 'build', 'android', 'ios'];

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Get all matching files
const getFiles = () => {
  return new Promise((resolve, reject) => {
    const pattern = `**/*{${extensions.join(',')}}`;
    
    glob(pattern, {
      ignore: excludeDirs.map(dir => `${dir}/**`),
      nodir: true
    }, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
};

// Process each file to remove console.logs
const processFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace console.log statements with production-friendly alternatives
    // This pattern matches most console.log statements
    const originalSize = content.length;
    
    // Replace console.log statements
    const newContent = content.replace(/console\.log\s*\([\s\S]*?\);?/g, '// Production build: console.log removed');
    
    // Only write back if something changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      const bytesReduced = originalSize - newContent.length;
      // Production build: console.log removed`);
      return { file: filePath, bytesReduced };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return null;
  }
};

// Main function
const main = async () => {
  // Production build: console.log removed
  const files = await getFiles();
  // Production build: console.log removed
  
  const results = [];
  for (const file of files) {
    const result = processFile(file);
    if (result) {
      results.push(result);
    }
  }
  
  // Summary
  const totalBytesReduced = results.reduce((acc, curr) => acc + curr.bytesReduced, 0);
  // Production build: console.log removed
  // Production build: console.log removed
  // Production build: console.log removed
  // Production build: console.log removed.toFixed(2)} KB)`);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
