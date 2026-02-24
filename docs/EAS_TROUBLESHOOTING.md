# EAS Build Troubleshooting Guide

This document provides solutions for common issues encountered when building the VelvetLadle app with EAS.

## Certificate Issues

### Problem: NPM Certificate Errors

```
CERT_HAS_EXPIRED
```

### Solutions:

1. **Temporarily disable strict SSL**:
   ```bash
   npm config set strict-ssl false
   ```

2. **Use an alternative registry**:
   ```bash
   npm config set registry http://registry.npmjs.org/
   ```

3. **Update certificates**:
   ```bash
   npm config set cafile /path/to/your/ca/file
   ```

## EAS CLI Issues

### Problem: Command not found

### Solution:
```bash
npm install -g eas-cli
```

### Problem: Authentication issues

### Solution:
```bash
eas login
```

## Build Failures

### Problem: Native module incompatibility

### Solution:
1. Check package versions match Expo SDK version
2. Review expo/config-plugins in app.json
3. Try clearing the cache:
   ```bash
   expo start --clear
   ```

### Problem: Missing Android credentials

### Solution:
1. Let EAS manage the keystore:
   ```bash
   eas credentials
   ```

2. If using an existing keystore, verify it's correctly configured in eas.json

## Environment Variables

### Problem: Missing or incorrect environment variables

### Solution:
1. Check environment variables in eas.json
2. Add secrets through EAS secret management:
   ```bash
   eas secret:create
   ```

## Performance Issues

### Problem: Build timeouts or stuck builds

### Solution:
1. Check for large files that should be excluded (.gitignore)
2. Review your eas.json for cache settings
3. Cancel the build and restart

## iOS Specific Issues

### Problem: Missing provisioning profile or certificates

### Solution:
1. Use EAS to manage certificates:
   ```bash
   eas credentials
   ```

## Android Specific Issues

### Problem: Build tools version mismatch

### Solution:
1. Specify the buildTools version in app.json:
   ```json
   "android": {
     "buildToolsVersion": "30.0.3"
   }
   ```

## Local Build Issues

### Problem: Local builds failing

### Solution:
1. Use the local build command with troubleshooting flags:
   ```bash
   eas build --local --platform android --verbose
   ```

## EAS Submit Issues

### Problem: App submission failures

### Solution:
1. Verify app.json has all required properties
2. Check that the build completed successfully
3. Verify credentials are correctly configured
