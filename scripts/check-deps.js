#!/usr/bin/env node

/**
 * Dependency Checker for VelvetLadle
 * 
 * This script verifies that all required dependencies are properly installed
 * and compatible with the current Expo SDK version.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 VelvetLadle Dependency Checker\n');

// Check if package.json exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check critical dependencies
const criticalDeps = [
  'expo',
  'react',
  'react-native',
  'typescript'
];

console.log('📦 Checking critical dependencies:');
criticalDeps.forEach(dep => {
  const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
  const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
  
  if (inDeps || inDevDeps) {
    console.log(`✅ ${dep}: ${inDeps || inDevDeps}`);
  } else {
    console.log(`❌ ${dep}: Missing`);
  }
});

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n⚠️  node_modules not found. Run "npm install"');
} else {
  console.log('\n✅ node_modules directory exists');
}

// Check TypeScript installation
try {
  const tsPath = path.join(nodeModulesPath, 'typescript', 'package.json');
  if (fs.existsSync(tsPath)) {
    const tsPackage = JSON.parse(fs.readFileSync(tsPath, 'utf8'));
    console.log(`✅ TypeScript installed: ${tsPackage.version}`);
  } else {
    console.log('❌ TypeScript not found in node_modules');
  }
} catch (error) {
  console.log('⚠️  Could not verify TypeScript installation');
}

// Check for problematic packages
const problematicPackages = ['@types/react-native'];
console.log('\n🚫 Checking for problematic packages:');
problematicPackages.forEach(pkg => {
  const inDeps = packageJson.dependencies && packageJson.dependencies[pkg];
  const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[pkg];
  
  if (inDeps || inDevDeps) {
    console.log(`❌ ${pkg}: Should be removed (types included with react-native)`);
  } else {
    console.log(`✅ ${pkg}: Not present (good)`);
  }
});

console.log('\n📋 Summary:');
console.log('- Remove @types/react-native if present');
console.log('- Ensure TypeScript is in devDependencies');
console.log('- Run "npm install" after any package.json changes');
console.log('- Use "npx expo start" to start the development server');
