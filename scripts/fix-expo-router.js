#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths to the problematic expo-router files
const filesToFix = [
  {
    file: path.join(__dirname, '..', 'node_modules', 'expo-router', '_ctx.web.tsx'),
    fixes: [
      {
        search: 'process.env.EXPO_ROUTER_APP_ROOT!',
        replace: '"./app"'
      },
      {
        search: 'process.env.EXPO_ROUTER_IMPORT_MODE_WEB',
        replace: '"../../app"'
      }
    ]
  },
  {
    file: path.join(__dirname, '..', 'node_modules', 'expo-router', '_html-ctx.tsx'),
    fixes: [
      {
        search: 'process.env.EXPO_ROUTER_APP_ROOT!',
        replace: '"../../app"'
      }
    ]
  },
  {
    file: path.join(__dirname, '..', 'node_modules', 'expo-router', 'src', 'onboard', 'Tutorial.tsx'),
    fixes: [
      {
        search: 'const dir = process.env.EXPO_ROUTER_ABS_APP_ROOT!;',
        replace: 'const dir = process.env.EXPO_ROUTER_ABS_APP_ROOT || "./app";'
      }
    ]
  }
];

// Check for additional files that might need patching
const additionalFiles = [
  'log-box.web.ts',
  'error.ts', 
  '_error.bundle.js'
].map(file => path.join(__dirname, '..', 'node_modules', 'expo-router', file))
 .filter(file => fs.existsSync(file));

console.log('Fixing expo-router environment variable issues...');

filesToFix.forEach(({ file, fixes }) => {
  // Check if file exists
  if (!fs.existsSync(file)) {
    console.warn(`File not found, skipping: ${file}`);
    return;
  }

  // Read current content
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Apply all fixes for this file
  fixes.forEach(({ search, replace }) => {
    if (content.includes(search)) {
      content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
      modified = true;
      console.log(`Fixed: ${search} → ${replace} in ${path.basename(file)}`);
    }
  });

  // Write the fixed content back if modified
  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${path.basename(file)}`);
  } else {
    console.log(`No changes needed: ${path.basename(file)}`);
  }
});

// Fix additional files for projectRoot issues
additionalFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Fix common projectRoot undefined issues
    if (content.includes('process.env.EXPO_ROUTER_APP_ROOT')) {
      content = content.replace(/process\.env\.EXPO_ROUTER_APP_ROOT!?/g, '"./app"');
      modified = true;
    }
    
    if (content.includes('process.env.EXPO_ROUTER_PROJECT_ROOT')) {
      content = content.replace(/process\.env\.EXPO_ROUTER_PROJECT_ROOT!?/g, '"./"');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`Fixed additional file: ${path.basename(file)}`);
    }
  } catch (err) {
    console.warn(`Could not fix ${path.basename(file)}: ${err.message}`);
  }
});

console.log('Expo-router fix complete!');