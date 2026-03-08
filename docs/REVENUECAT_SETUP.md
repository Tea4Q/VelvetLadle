# RevenueCat Subscription Setup — iOS & Android

This guide covers the complete one-time setup required to enable native in-app subscriptions for VelvetLadle on both the Apple App Store and Google Play Store using RevenueCat.

---

## Overview

| Component                         | Role                                                              |
| --------------------------------- | ----------------------------------------------------------------- |
| **App Store Connect**             | Define iOS subscription products & pricing                        |
| **Google Play Console**           | Define Android subscription products & pricing                    |
| **RevenueCat Dashboard**          | Aggregate both stores, define Entitlements & Offerings            |
| **`services/purchaseService.ts`** | Singleton wrapper that calls `react-native-purchases`             |
| **`contexts/AuthContext.tsx`**    | Wires RevenueCat customer ↔ Supabase user on every auth event     |
| **`app/upgrade.tsx`**             | Paywall screen — fetches live pricing, handles purchase & restore |

The entitlement identifier used throughout the codebase is **`premium`** (see `PREMIUM_ENTITLEMENT_ID` in `purchaseService.ts`). It **must** match exactly in the RevenueCat dashboard.

---

## Step 1 — RevenueCat Dashboard

1. Create an account at [app.revenuecat.com](https://app.revenuecat.com).
2. **New Project** → name it `VelvetLadle`.
3. Add two apps inside the project:
   - **Apple App Store** — bundle ID: `com.qtea.VelvetLadle`
   - **Google Play Store** — package name: `com.qtea.VelvetLadle`
4. Copy the **Public SDK Keys** for each platform (format: `appl_…` for iOS, `goog_…` for Android).
5. Add both keys to your `.env.local`:
   ```env
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxxx
   ```
6. After adding keys, regenerate native code:
   ```bash
   npx expo prebuild --clean
   ```

---

## Step 2 — iOS: App Store Connect Subscription

### 2a. Create the Subscription Group

1. Open [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → VelvetLadle.
2. Navigate to **Monetization → Subscriptions**.
3. **Create** a new Subscription Group — name: `VelvetLadle Premium`.
4. Inside the group, click **+** to add a subscription product.

### 2b. Configure the Subscription Product

| Field                  | Recommended Value                           |
| ---------------------- | ------------------------------------------- |
| **Reference Name**     | VelvetLadle Premium Monthly                 |
| **Product ID**         | `com.qtea.velvetladle.premium.monthly`      |
| **Duration**           | 1 Month                                     |
| **Price**              | Set in Pricing section (e.g. $4.99 / month) |
| **Subscription Level** | 1 (only level in group)                     |

Add a second product for annual billing if desired:

| Field              | Value                                 |
| ------------------ | ------------------------------------- |
| **Reference Name** | VelvetLadle Premium Annual            |
| **Product ID**     | `com.qtea.velvetladle.premium.annual` |
| **Duration**       | 1 Year                                |
| **Price**          | e.g. $49.99 / year (~33% savings)     |

### 2c. Localisation & Review Screenshot

1. Add a localization entry (EN-US minimum):
   - **Display Name**: VelvetLadle Premium
   - **Description**: Unlimited recipe storage and premium features.
2. Upload a **review screenshot** showing the in-app purchase screen (required for App Review).

### 2d. App Store Server Notifications (Recommended)

1. In App Store Connect: **App Information → App Store Server Notifications**.
2. Set the Production URL to the endpoint RevenueCat provides:
   `https://api.revenuecat.com/v1/webhooks/apple`
3. Enable **Version 2** notifications.
4. Paste your **App-Specific Shared Secret** into the RevenueCat iOS app settings.

---

## Step 3 — Android: Google Play Console Subscription

### 3a. Create a Subscription

1. Open [Google Play Console](https://play.google.com/console) → VelvetLadle app.
2. Navigate to **Monetize → Subscriptions** → **Create subscription**.

### 3b. Configure the Subscription

| Field               | Recommended Value             |
| ------------------- | ----------------------------- |
| **Subscription ID** | `velvetladle_premium_monthly` |
| **Name**            | VelvetLadle Premium           |
| **Base plan ID**    | `monthly`                     |
| **Billing period**  | 1 month                       |
| **Price**           | e.g. $4.99 / month            |
| **Grace period**    | 7 days (recommended)          |

Add a second base plan for annual billing if desired:

| Field              | Value              |
| ------------------ | ------------------ |
| **Base plan ID**   | `annual`           |
| **Billing period** | 1 year             |
| **Price**          | e.g. $39.99 / year |

### 3c. Real-Time Developer Notifications (Recommended)

1. In Google Play Console: **Monetize → Monetization Setup → Real-time developer notifications**.
2. Enable and set the topic to RevenueCat's Pub/Sub endpoint (from RevenueCat → Android app settings → **Google Play integration**).
3. Follow RevenueCat's [Google Play RTD Notifications guide](https://www.revenuecat.com/docs/google-play-rtdn) to link your Google Cloud project.

---

## Step 4 — RevenueCat: Link Products, Entitlements & Offerings

### 4a. Import Products

In the RevenueCat dashboard for each app:

1. Go to **Products** → **Import Products** (or add manually).
2. For iOS: add `com.qtea.velvetladle.premium.monthly` and `.annual`.
3. For Android: add `velvetladle_premium_monthly:monthly` and `velvetladle_premium_monthly:annual`.

### 4b. Create the Entitlement

1. **Entitlements** → **+ New Entitlement**.
2. Identifier: **`premium`** ← must be exactly this string.
3. Attach all products (both iOS and Android, monthly and annual) to this entitlement.

### 4c. Create an Offering

1. **Offerings** → **+ New Offering**.
2. Identifier: `default` (or any name — the app fetches `offerings.current`).
3. Add **Packages**:
   - `$rc_monthly` — attach iOS monthly + Android monthly products.
   - `$rc_annual` — attach iOS annual + Android annual products.
4. Set this offering as the **Current Offering**.

---

## Step 5 — Sandbox Testing

### iOS Sandbox

1. In App Store Connect, create a **Sandbox Tester** account (different from your Apple ID).
2. On a physical iOS device, sign out of the App Store (Settings → App Store → sign out).
3. Run a development build; when prompted by the purchase sheet, sign in with the sandbox account.
4. Sandbox purchases complete instantly and subscriptions renew every ~5 minutes.

### Android Sandbox (License Testers)

1. In Google Play Console → **Setup → License Testing**, add Gmail addresses as license testers.
2. Those testers can make sandbox purchases free of charge via a real signed APK or AAB.
3. Internal Test Track builds also support sandbox purchases automatically.

### Verify in RevenueCat

After a sandbox purchase:

- Open RevenueCat dashboard → **Customers** → find the customer by user ID or device ID.
- Confirm the `premium` entitlement is shown as **Active**.

---

## App Integration Summary

The following files handle RevenueCat at the code level; no changes should be needed after initial key configuration.

| File                                                          | What it does                                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [services/purchaseService.ts](../services/purchaseService.ts) | Singleton — configure, login/logout, isPremium, getOffering, purchasePackage, restorePurchases      |
| [contexts/AuthContext.tsx](../contexts/AuthContext.tsx)       | Calls `PurchaseService.configure()` on mount; `loginUser` / `logoutUser` on every auth state change |
| [app/upgrade.tsx](../app/upgrade.tsx)                         | Paywall screen — renders live pricing from `getOffering()`, handles purchase & restore flows        |
| [app/(tabs)/add.tsx](<../app/(tabs)/add.tsx>)                 | Recipe limit gate — queries `PurchaseService.isPremium()` before checking `subscription_tier`       |

### Key constants

```typescript
// services/purchaseService.ts
export const PREMIUM_ENTITLEMENT_ID = "premium";

// .env.local
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…
```

### Graceful Degradation

When API keys are absent (web, CI, local dev without keys):

- `PurchaseService.configure()` is a no-op — no crash.
- `isPremium()` returns `false`.
- `getOffering()` returns `null` → upgrade screen shows "Coming Soon" box.
- "Restore Purchases" button is hidden.

---

## Checklist — Before Going Live

### iOS

- [ ] Subscription products created in App Store Connect with correct product IDs
- [ ] Products imported into RevenueCat iOS app
- [ ] `premium` entitlement created and all products attached
- [ ] `default` Offering created with `$rc_monthly` / `$rc_annual` packages
- [ ] App Store Server Notifications configured (V2)
- [ ] Sandbox test purchase completes and entitlement activates in RevenueCat
- [ ] Restore Purchases tested in sandbox (re-install, tap Restore)
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY` added to `.env.local` and EAS secret
- [ ] `npx expo prebuild --clean` run after adding key

### Android

- [ ] Subscription created in Google Play Console with correct subscription ID and base plan ID
- [ ] Products imported into RevenueCat Android app
- [ ] `premium` entitlement has Android products attached
- [ ] `default` Offering packages include Android products
- [ ] Real-Time Developer Notifications configured
- [ ] License Tester account added in Google Play Console
- [ ] Sandbox test purchase completes and entitlement activates in RevenueCat
- [ ] Restore Purchases tested in sandbox
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` added to `.env.local` and EAS secret
- [ ] Production build (`npm run build:production`) tested before Play Store submission

### Both Platforms

- [ ] Auto-renewal disclosure text visible on upgrade screen (already implemented in `upgrade.tsx`)
- [ ] "Restore Purchases" button present and functional (required by App Store & Play Store)
- [ ] Privacy Policy URL updated to mention subscription data handling
- [ ] RevenueCat Webhooks/Notifications tested end-to-end

---

## Useful Links

- [RevenueCat Docs](https://www.revenuecat.com/docs)
- [RevenueCat iOS Quickstart](https://www.revenuecat.com/docs/getting-started/installation/ios)
- [RevenueCat Android Quickstart](https://www.revenuecat.com/docs/getting-started/installation/android)
- [RevenueCat React Native SDK](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [App Store Connect — Subscriptions](https://appstoreconnect.apple.com)
- [Google Play Console — Subscriptions](https://play.google.com/console)
- [Apple Sandbox Testing](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox)
- [Google Play License Testing](https://developer.android.com/google/play/billing/test)
