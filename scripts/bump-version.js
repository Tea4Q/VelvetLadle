/**
 * Version Bumper for VelvetLadle
 * 
 * This script helps with updating the version number in app.json
 * Usage: node scripts/bump-version.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');

// Get app.json path
const appJsonPath = path.join(__dirname, '..', 'app.json');

// Parse current app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const currentVersion = appJson.expo.version;

// Parse version components
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Determine which part to bump based on command line argument
const bumpType = process.argv[2] || 'patch';
let newVersion;

switch (bumpType.toLowerCase()) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update the version in app.json
appJson.expo.version = newVersion;

// Update android versionCode if it exists
if (appJson.expo.android && appJson.expo.android.versionCode) {
  appJson.expo.android.versionCode += 1;
}

// Update iOS buildNumber if it exists
if (appJson.expo.ios && appJson.expo.ios.buildNumber) {
  const buildNumber = parseInt(appJson.expo.ios.buildNumber, 10);
  appJson.expo.ios.buildNumber = String(buildNumber + 1);
}

// Write updated app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

// Production build: console.log removed

// Suggest next commands
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed
// Production build: console.log removed');
// Production build: console.log removed');
