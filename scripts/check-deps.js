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

// Production build: console.log removed

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

// Production build: console.log removed
criticalDeps.forEach(dep => {
  const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
  const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
  
  if (inDeps || inDevDeps) {
    // Production build: console.log removed
  } else {
    // Production build: console.log removed
  }
});

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  // Production build: console.log removed
} else {
  // Production build: console.log removed
}

// Check TypeScript installation
try {
  const tsPath = path.join(nodeModulesPath, 'typescript', 'package.json');
  if (fs.existsSync(tsPath)) {
    const tsPackage = JSON.parse(fs.readFileSync(tsPath, 'utf8'));
    // Production build: console.log removed
  } else {
    // Production build: console.log removed
  }
} catch (error) {
  // Production build: console.log removed
}

// Check for problematic packages
const problematicPackages = ['@types/react-native'];
// Production build: console.log removed
problematicPackages.forEach(pkg => {
  const inDeps = packageJson.dependencies && packageJson.dependencies[pkg];
  const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[pkg];
  
  if (inDeps || inDevDeps) {
    // Production build: console.log removed`);
  } else {
    // Production build: console.log removed`);
  }
});

// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
