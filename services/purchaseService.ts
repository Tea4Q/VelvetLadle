/**
 * PurchaseService – RevenueCat wrapper for premium subscriptions.
 *
 * Setup required (one-time):
 *  1. Create a RevenueCat account at https://app.revenuecat.com
 *  2. Create a project for VelvetLadle, add iOS & Android apps.
 *  3. Create a "premium" Entitlement and attach products from
 *     App Store Connect / Google Play Console.
 *  4. Add your API keys to .env.local:
 *       EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx
 *       EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx
 *
 * The service degrades gracefully when keys are missing (dev / web).
 */

import { Platform } from "react-native";
import Purchases, {
    LOG_LEVEL,
    PurchasesOffering,
    PurchasesPackage,
} from "react-native-purchases";

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

/** The entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT_ID = "premium";

class PurchaseServiceClass {
  private _configured = false;

  /** Call once at app start (or after sign-in to link the user). */
  configure(appUserId?: string | null): void {
    const apiKey =
      Platform.OS === "ios"
        ? RC_IOS_KEY
        : Platform.OS === "android"
          ? RC_ANDROID_KEY
          : "";

    if (!apiKey) {
      // No keys – works in demo/web mode, purchases simply won't be available.
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      Purchases.configure({
        apiKey,
        appUserID: appUserId ?? null,
      });
      this._configured = true;
    } catch (e) {
      console.error("[PurchaseService] configure error:", e);
    }
  }

  /** Link a signed-in user to their RevenueCat customer record. */
  async loginUser(userId: string): Promise<void> {
    if (!this._configured) return;
    try {
      await Purchases.logIn(userId);
    } catch (e) {
      console.error("[PurchaseService] logIn error:", e);
    }
  }

  /** Anonymous-ify the RevenueCat customer on sign-out. */
  async logoutUser(): Promise<void> {
    if (!this._configured) return;
    try {
      await Purchases.logOut();
    } catch (e) {
      console.error("[PurchaseService] logOut error:", e);
    }
  }

  /** Returns true if the current customer has an active premium entitlement. */
  async isPremium(): Promise<boolean> {
    if (!this._configured) return false;
    try {
      const info = await Purchases.getCustomerInfo();
      return info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
    } catch (e) {
      console.error("[PurchaseService] isPremium error:", e);
      return false;
    }
  }

  /**
   * Fetches the current offering from RevenueCat.
   * Returns null when RevenueCat is not configured or no offering is set up yet.
   */
  async getOffering(): Promise<PurchasesOffering | null> {
    if (!this._configured) return null;
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (e) {
      console.error("[PurchaseService] getOfferings error:", e);
      return null;
    }
  }

  /**
   * Purchase a package from the current offering.
   * Returns `{ success: true }` when the premium entitlement becomes active.
   */
  async purchasePackage(
    pkg: PurchasesPackage,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this._configured) {
      return { success: false, error: "Purchases not configured" };
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active =
        customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
      return { success: active };
    } catch (e: any) {
      if (e?.userCancelled) {
        return { success: false, error: "cancelled" };
      }
      return { success: false, error: e?.message ?? "Purchase failed" };
    }
  }

  /**
   * Restore previous purchases (required by App Store / Play Store).
   * Returns whether premium is now active.
   */
  async restorePurchases(): Promise<{
    success: boolean;
    isPremium: boolean;
    error?: string;
  }> {
    if (!this._configured) {
      return {
        success: false,
        isPremium: false,
        error: "Purchases not configured",
      };
    }
    try {
      const info = await Purchases.restorePurchases();
      const active =
        info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
      return { success: true, isPremium: active };
    } catch (e: any) {
      return {
        success: false,
        isPremium: false,
        error: e?.message ?? "Restore failed",
      };
    }
  }

  /** Whether RevenueCat has been configured with a valid API key. */
  isAvailable(): boolean {
    return this._configured;
  }
}

export const PurchaseService = new PurchaseServiceClass();
