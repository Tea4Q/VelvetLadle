# VelvetLadle Pre-Build Checklist

Use this checklist to prepare your app for production builds.

## 1. Code Cleanup

- [x] Remove all `console.log` statements (or replace with a proper logging system)
- [ ] Remove all commented-out code
- [ ] Fix TODO/FIXME items:
  - [ ] Implement the manual entry form in UrlActionModal.tsx
  - [ ] Implement edit functionality in favorites.tsx

## 2. Testing

- [ ] Run the app on Android to verify all functionality
- [ ] Run the app on iOS simulator if available
- [ ] Test all main features:
  - [ ] Recipe viewing
  - [ ] Recipe filtering
  - [ ] Adding new recipes
  - [ ] Favoriting recipes
  - [ ] Recipe searching
  - [ ] Premium upgrade flow (purchase + restore)

## 3. Configuration Updates

- [ ] Verify app.json has correct:
  - [x] App name
  - [x] Version number
  - [x] Bundle ID/package name
  - [x] Icons
  - [x] Splash screens
- [x] Dependencies are properly installed and compatible
- [x] No problematic packages (like @types/react-native) in package.json

### RevenueCat (In-App Purchases)

- [ ] Create a project at https://app.revenuecat.com
- [ ] Add iOS app with bundle ID `com.tea4q.velvetladle`
- [ ] Add Android app with package `com.qtea.VelvetLadle`
- [ ] Create an **Entitlement** named exactly `premium`
- [ ] Create subscription products in App Store Connect and Google Play Console
- [ ] Attach products to the `premium` entitlement in RevenueCat
- [ ] Create an **Offering** with at least one package
- [ ] Add API keys to `.env.local`:
  ```env
  EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx
  ```
- [ ] Run `npx expo prebuild --clean` after adding env vars to regenerate native code

## 4. Performance Checks

- [ ] Test app startup time
- [ ] Check recipe list scrolling performance
- [ ] Verify image loading works efficiently

## 5. Build Commands

### For Preview Build:

```bash
eas build --profile preview --platform android
```

### For Production Build:

```bash
eas build --profile production --platform android
```

## 6. Post-Build Testing

- [ ] Install the preview build on a physical device
- [ ] Verify all functionality works in the built version
- [ ] Check for any environment-specific issues
- [ ] Test the premium upgrade flow end-to-end on device
- [ ] Test Restore Purchases on a second device/reinstall

## 7. Submission Preparation

- [ ] Prepare screenshots for store listing
- [ ] Write store description
- [ ] Create privacy policy if not already done
- [ ] Add in-app purchase product descriptions to store listings
