#!/usr/bin/env node

/**
 * Image Storage Setup Script for VelvetLadle
 * 
 * This script prepares the app for build by:
 * 1. Initializing image storage directories
 * 2. Optionally pre-downloading commonly used images
 * 3. Verifying image storage functionality
 */

const fs = require('fs');
const path = require('path');

// Production build: console.log removed

// Check if expo-file-system is installed
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = ['expo-file-system', 'expo-image'];
const missingDeps = [];

requiredDeps.forEach(dep => {
  if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  // Production build: console.log removed
  missingDeps.forEach(dep => // Production build: console.log removed);
  // Production build: console.log removed
  // Production build: console.log removed}`);
  process.exit(1);
}

// Production build: console.log removed

// Check if SmartImage component exists
const smartImagePath = path.join(__dirname, '..', 'components', 'SmartImage.tsx');
if (!fs.existsSync(smartImagePath)) {
  console.warn('⚠️  SmartImage component not found at:', smartImagePath);
} else {
  // Production build: console.log removed
}

// Check if ImageStorageService exists
const imageServicePath = path.join(__dirname, '..', 'services', 'ImageStorageService.ts');
if (!fs.existsSync(imageServicePath)) {
  console.warn('⚠️  ImageStorageService not found at:', imageServicePath);
} else {
  // Production build: console.log removed
}

// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed

// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed

// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed

// Production build: console.log removed
