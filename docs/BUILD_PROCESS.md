# VelvetLadle Build Process Guide

This document provides detailed instructions for building and releasing the VelvetLadle app.

## Prerequisites

1. **Node.js and npm**: Ensure you have a compatible version installed
2. **Expo CLI**: We recommend using the local CLI with `npx expo` commands
3. **EAS CLI**: Install globally with `npm install -g eas-cli`
4. **EAS Account**: Login with `eas login`

## Pre-Build Preparation

1. **Clean up console logs**:
   ```
   npm run prebuild
   ```
   This will automatically remove all console.log statements from the codebase.

2. **Verify app configuration**:
   - Check `app.json` for correct:
     - App name: "Velvet Ladle"
     - Version number: 1.0.0
     - Package name: com.qtea.VelvetLadle
     - Icons and splash screens

3. **Test locally**:
   ```
   npx expo start
   ```
   Ensure all features work correctly before proceeding.

## Build Process

### Preview Build (Testing)

For internal testing, create a preview build:

```bash
npm run build:preview
```

This will:
- Build an APK file (easier to install for testing)
- Use production environment variables
- Be distributed internally (not via app stores)

### Production Build

For app store submission:

```bash
npm run build:production
```

This will:
- Build an app bundle for Google Play
- Use production environment variables
- Enable optimizations for production

## EAS Build Profiles

The app has three build profiles defined in `eas.json`:

1. **Development**: For development client testing
   ```bash
   npx eas build --profile development --platform android
   ```

2. **Preview**: For internal testing
   ```bash
   npm run build:preview
   ```

3. **Production**: For app store releases
   ```bash
   npm run build:production
   ```

## Troubleshooting

### Certificate Issues

If you encounter certificate errors with npm:

```bash
npm config set strict-ssl false
# or
npm config set registry http://registry.npmjs.org/
```

### Build Failures

1. Check EAS build logs for specific errors
2. Verify all dependencies are correctly installed
3. Ensure app.json is properly configured
4. Check for any native module issues

## Post-Build Steps

1. **Install and test the build**: Download the APK or app bundle from EAS
2. **Verify all functionality** on a physical device
3. **Prepare store listing** materials
   - Screenshots
   - App description
   - Privacy policy

## Release Process

1. **App Store Submission**:
   - Upload the app bundle to Google Play Console
   - Complete store listing information
   - Submit for review

2. **Version Updates**:
   - Increment version in app.json
   - Update changelog
   - Build new version with EAS
