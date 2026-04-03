# iOS Release Guide for VelvetLadle

This guide covers TestFlight and App Store release for iOS.

## Current App Target

- App type: Free app with in-app subscriptions
- Bundle ID: com.tea4q.velvetladle.free
- Subscription provider: RevenueCat (react-native-purchases)
- Premium entitlement ID: premium

## Pre-Release Checklist

1. Confirm App Store Connect app record exists for bundle ID:
   - com.tea4q.velvetladle.free
2. Confirm app-level pricing is set to Free.
3. Confirm RevenueCat iOS SDK key is configured:
   - EXPO_PUBLIC_REVENUECAT_IOS_KEY
4. Confirm App Store Connect subscriptions are active and mapped:
   - Products attached to premium entitlement in RevenueCat
   - Products included in default offering
5. Run local app smoke tests:
   - Sign in/sign up/guest flow
   - Add recipe (URL and manual)
   - Favorites and search/filter
   - Upgrade screen opens and loads pricing
   - Restore purchases action is visible

## Environment Variables

Add to .env.local:

EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

Add iOS RevenueCat key to EAS secrets:

eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxx

## Build Commands

Preview/TestFlight candidate build:

npm run build:preview

Production iOS build:

npm run build:production

If you need explicit iOS command:

npx eas build --platform ios --profile production

## Submit to App Store Connect

Submit latest iOS build:

npx eas submit -p ios --latest

Or submit with production profile in one flow:

eas build --platform ios --profile production --auto-submit

## App Store Connect Steps

1. Upload build to TestFlight.
2. Add tester groups and run internal/external testing.
3. Complete required metadata:
   - App description
   - Keywords
   - Promotional text
   - Support URL
   - Privacy policy URL
   - Screenshots for required device sizes
4. Complete App Privacy questionnaire.
5. Complete In-App Purchases metadata:
   - Display name and description
   - Screenshot for review (upgrade/paywall screen)
6. Add App Review notes and optional test account.
7. Submit for review.

## iOS Subscription Setup Notes

In App Store Connect:
1. Monetization > Subscriptions
2. Create or verify subscription group for VelvetLadle Premium
3. Add monthly and yearly products
4. Ensure products are Ready to Submit/Approved state as needed

In RevenueCat:
1. Import iOS products
2. Map products to entitlement premium
3. Add packages to default offering
4. Verify offerings return data in app

## TestFlight Validation

Before App Review, verify on real iOS device:

- Free user limit behavior (10 recipes)
- Upgrade screen pricing appears
- Purchase flow completes in sandbox
- Entitlement becomes active after purchase
- Restore purchases works after reinstall/sign out
- Premium users can save beyond free limit

## Common iOS Rejection Risks

- App set as Paid instead of Free at app level
- Missing subscription metadata or review screenshot
- Missing restore purchases path
- Missing auto-renew disclosure text
- Broken account deletion or data handling policy mismatch

## Release Notes Template

Version X.Y.Z

- Improved recipe import reliability and parsing quality
- Updated nutrition and recipe timing presentation
- Enhanced premium subscription flow and restore handling
- General bug fixes and performance improvements

## Rollback/Hotfix Strategy

1. Keep last approved build notes and version tags.
2. If critical issue occurs, submit patch release immediately.
3. For server/config issues (RevenueCat mapping), fix dashboard first when possible.
4. Re-run purchase and restore regression checks after every payment config change.
