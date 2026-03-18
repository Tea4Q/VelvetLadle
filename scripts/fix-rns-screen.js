/**
 * Fix for react-native-screens 4.23.0 Fabric boolean/string mismatch.
 *
 * react-native-screens converts `fullScreenSwipeEnabled` from undefined → the
 * string 'undefined' via parseBooleanToOptionalBooleanNativeProp. Physical
 * devices running an older Expo Go native binary still expect a real `boolean`
 * (or JS undefined), not a string, causing:
 *   "expected dynamic type 'boolean', but had type 'string'"
 *
 * This script patches the compiled JS so that when the prop is undefined/null
 * (the common Android case), we pass JS `undefined` rather than the string
 * 'undefined', letting the native component use its own C++ default.
 */

const fs = require('fs');
const path = require('path');

const OLD_CJS = `fullScreenSwipeEnabled: (0, _utils.parseBooleanToOptionalBooleanNativeProp)(fullScreenSwipeEnabled),`;
const NEW_CJS = `fullScreenSwipeEnabled: fullScreenSwipeEnabled == null ? undefined : (0, _utils.parseBooleanToOptionalBooleanNativeProp)(fullScreenSwipeEnabled),`;

const OLD_ESM = `fullScreenSwipeEnabled: parseBooleanToOptionalBooleanNativeProp(fullScreenSwipeEnabled),`;
const NEW_ESM = `fullScreenSwipeEnabled: fullScreenSwipeEnabled == null ? undefined : parseBooleanToOptionalBooleanNativeProp(fullScreenSwipeEnabled),`;

const CJS_PATH = path.join(__dirname, '../node_modules/react-native-screens/lib/commonjs/components/Screen.js');
const ESM_PATH = path.join(__dirname, '../node_modules/react-native-screens/lib/module/components/Screen.js');

let patched = 0;

for (const [filePath, oldStr, newStr] of [[CJS_PATH, OLD_CJS, NEW_CJS], [ESM_PATH, OLD_ESM, NEW_ESM]]) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[fix-rns-screen] File not found, skipping: ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(newStr)) {
    console.log(`[fix-rns-screen] Already patched: ${path.basename(filePath)}`);
    patched++;
    continue;
  }
  if (!content.includes(oldStr)) {
    console.warn(`[fix-rns-screen] Target string not found (version mismatch?): ${path.basename(filePath)}`);
    continue;
  }
  fs.writeFileSync(filePath, content.replace(oldStr, newStr), 'utf8');
  console.log(`[fix-rns-screen] Patched: ${path.basename(filePath)}`);
  patched++;
}

if (patched === 2) {
  console.log('[fix-rns-screen] All patches applied successfully.');
} else {
  console.warn(`[fix-rns-screen] Only ${patched}/2 patches applied.`);
}
