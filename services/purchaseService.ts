/**
 * PurchaseService – RevenueCat wrapper for premium subscriptions.
 *
 * Setup required (one-time):
 *  1. Create a RevenueCat account at https://app.revenuecat.com
 *  2. Create a project for VelvetLadle, add iOS & Android apps.
 *  3. Create a "VelvetLadle Premium" Entitlement and attach products from
 *     App Store Connect / Google Play Console.
 *  4. Add your API keys to .env.local:
 *       EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxx
 *       EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxx
 *
 * The service degrades gracefully when keys are missing (dev / web).
 */

import { Platform } from "react-native";
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

// Dynamic require: Expo Go and web don't have the RevenueCat native binary.
// This guard prevents a module-resolution crash at startup.
let Purchases: typeof import("react-native-purchases").default | null = null;
let LOG_LEVEL: typeof import("react-native-purchases").LOG_LEVEL | null = null;
if (Platform.OS !== "web") {
  try {
    const rc = require("react-native-purchases");
    Purchases = rc.default;
    LOG_LEVEL = rc.LOG_LEVEL;
  } catch (e) {
    console.warn("[PurchaseService] react-native-purchases not available:", e);
  }
}

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

/** The entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT_ID = "premium";
export const LEGACY_PREMIUM_ENTITLEMENT_ID = "VelvetLadle Premium";

const PREMIUM_ENTITLEMENT_IDS = [
  PREMIUM_ENTITLEMENT_ID,
  LEGACY_PREMIUM_ENTITLEMENT_ID,
] as const;

type PlanType = "monthly" | "yearly" | null;

export interface SubscriptionInfo {
  tier: "free" | "premium";
  isPremium: boolean;
  planType: PlanType;
  renewalDate: string | null;
  raw: CustomerInfo | null;
}

class PurchaseServiceClass {
  private _configured = false;
  private _offeringsMisconfigured = false;

  private isConfigErrorMessage(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("there are no play store products registered") ||
      normalized.includes("why-are-offerings-empty") ||
      normalized.includes("configurationerror") ||
      normalized.includes("there is an issue with your configuration")
    );
  }

  private hasPremiumEntitlement(info: CustomerInfo): boolean {
    return PREMIUM_ENTITLEMENT_IDS.some(
      (id) => info.entitlements.active[id] !== undefined,
    );
  }

  private parsePlanTypeFromProductId(productId?: string): PlanType {
    const normalized = (productId ?? "").toLowerCase();
    if (
      normalized.includes("monthly") ||
      normalized.includes(".month") ||
      normalized.includes("_month")
    ) {
      return "monthly";
    }
    if (
      normalized.includes("yearly") ||
      normalized.includes("annual") ||
      normalized.includes(".year") ||
      normalized.includes("_year")
    ) {
      return "yearly";
    }
    return null;
  }

  private emptySubscriptionInfo(raw: CustomerInfo | null): SubscriptionInfo {
    return {
      tier: "free",
      isPremium: false,
      planType: null,
      renewalDate: null,
      raw,
    };
  }

  private parseSubscriptionInfo(info: CustomerInfo): SubscriptionInfo {
    const activeEntitlement = PREMIUM_ENTITLEMENT_IDS.map(
      (id) => info.entitlements.active[id],
    ).find(Boolean);

    if (!activeEntitlement) {
      return this.emptySubscriptionInfo(info);
    }

    return {
      tier: "premium",
      isPremium: true,
      planType: this.parsePlanTypeFromProductId(
        activeEntitlement.productIdentifier,
      ),
      renewalDate: activeEntitlement.expirationDate ?? null,
      raw: info,
    };
  }

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
      if (!Purchases) return; // native module not available (Expo Go / web)
      if (__DEV__ && LOG_LEVEL) {
        // WARN level: suppress verbose SDK debug/info noise on emulators
        Purchases.setLogLevel(LOG_LEVEL.WARN);
      }
      Purchases.configure({
        apiKey,
        appUserID: appUserId ?? null,
      });
      this._configured = true;
      this._offeringsMisconfigured = false;
    } catch (e) {
      const message = String((e as any)?.message ?? e ?? "").toLowerCase();
      const isExpoGoStoreError =
        message.includes(
          "native store is not available when running inside expo go",
        ) || message.includes("invalid api key");

      if (isExpoGoStoreError) {
        console.warn(
          "[PurchaseService] RevenueCat unavailable in Expo Go for store keys. Use a development build.",
        );
        return;
      }
      console.error("[PurchaseService] configure error:", e);
    }
  }

  /** Link a signed-in user to their RevenueCat customer record. */
  async loginUser(userId: string): Promise<void> {
    if (!this._configured || !Purchases) return;
    try {
      await Purchases.logIn(userId);
    } catch (e) {
      console.error("[PurchaseService] logIn error:", e);
    }
  }

  /** Anonymous-ify the RevenueCat customer on sign-out. */
  async logoutUser(): Promise<void> {
    if (!this._configured || !Purchases) return;
    try {
      await Purchases.logOut();
    } catch (e: any) {
      const message = String(e?.message ?? e ?? "").toLowerCase();
      if (message.includes("anonymous")) return; // already anonymous, nothing to do
      console.error("[PurchaseService] logOut error:", e);
    }
  }

  /** Returns true if the current customer has an active premium entitlement. */
  async isPremium(): Promise<boolean> {
    const info = await this.getSubscriptionInfo();
    return info.isPremium;
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    if (!this._configured || !Purchases)
      return this.emptySubscriptionInfo(null);
    try {
      const info = await Purchases.getCustomerInfo();
      return this.parseSubscriptionInfo(info);
    } catch (e) {
      console.error("[PurchaseService] getSubscriptionInfo error:", e);
      return this.emptySubscriptionInfo(null);
    }
  }

  /**
   * Fetches the current offering from RevenueCat.
   * Returns null when RevenueCat is not configured or no offering is set up yet.
   */
  async getOffering(): Promise<PurchasesOffering | null> {
    if (!this._configured || this._offeringsMisconfigured || !Purchases) {
      return null;
    }
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (e: any) {
      const message = String(e?.message ?? e ?? "");
      if (this.isConfigErrorMessage(message)) {
        this._offeringsMisconfigured = true;
        // Known setup gap (no products in RC dashboard yet) — not an app error
        return null;
      }
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
    if (!this._configured || !Purchases) {
      return { success: false, error: "Purchases not configured" };
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = this.hasPremiumEntitlement(customerInfo);
      return { success: active };
    } catch (e: any) {
      if (e?.userCancelled) {
        return { success: false, error: "cancelled" };
      }
      // The App Store may return a receipt error when the user is already
      // subscribed (e.g. sandbox "receipt not valid" or StoreKit 2 duplicate).
      // In that case the entitlement is already active — treat it as success.
      try {
        const existing = await Purchases.getCustomerInfo();
        if (this.hasPremiumEntitlement(existing)) {
          return { success: true };
        }
      } catch {
        // ignore secondary check failure
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
    if (!this._configured || !Purchases) {
      return {
        success: false,
        isPremium: false,
        error: "Purchases not configured",
      };
    }
    try {
      const info = await Purchases.restorePurchases();
      const active = this.hasPremiumEntitlement(info);
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
