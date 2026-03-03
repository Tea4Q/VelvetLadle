/**
 * globalAccountDeletionService.ts
 *
 * Portable account-deletion service — copy this file into any Expo/Supabase/RevenueCat app.
 *
 * Deletion Paths:
 *  A. Immediate  — no active subscription / free user.  Data wiped right now.
 *  B. Scheduled  — active paid subscription.  Intent stored; auto-executes when
 *                  billing period ends on next app open.
 *
 * Access Revocation Order (Path A + B auto-execute):
 *  1. supabase.auth.signOut()                    ← access cut first
 *  2. AsyncStorage.multiRemove(allKnownKeys)      ← local state gone
 *  3. GlobalProfileImageService.deleteProfileImage ← local PII file
 *  4. PurchaseService.logoutUser()               ← RC anonymised
 *  5. anonymize_user_data RPC (background)       ← server PII scrub
 *
 * Retained (tax / legal compliance):
 *  - deletion_log: hashed user_id + hashed email, timestamps, plan metadata
 *  - Transaction history managed by RevenueCat / App Store / Play Store
 *
 * NOT retained:
 *  - Email (plaintext), name, address, device identifiers
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { PurchaseService } from "./purchaseService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanType = "monthly" | "annual" | null;

export interface SubscriptionStatus {
  isPremium: boolean;
  planType: PlanType;
  /** ISO date string or null */
  renewalDate: string | null;
  /** False when RevenueCat keys are not configured (demo / web) */
  isAvailable: boolean;
}

export interface DeletionIntent {
  isPending: boolean;
  /** ISO date string — when the subscription billing period ends */
  scheduledDate: string | null;
  planType: PlanType;
}

export interface RefundInfo {
  /** Days within which the user may request a refund */
  windowDays: number;
  /** Whether the user is still inside that window */
  eligible: boolean;
  /** Purchase date used for the window calculation */
  purchasedAt: string | null;
}

export interface ExecuteResult {
  success: boolean;
  /** True when deletion is blocked (active subscription that hasn't lapsed) */
  blocked?: boolean;
  reason?: "active_subscription";
  expiresAt?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// AsyncStorage keys cleared on deletion — extend in your app as needed
// ---------------------------------------------------------------------------
const ALL_ASYNC_STORAGE_KEYS = [
  "user",
  "supabase.auth.token",
  "velvet_ladle_favorites",
  "recipe_sources",
  // profile image key pattern handled dynamically below
];

const PROFILE_IMAGE_KEY_PREFIX = "global_profile_image_uri_";

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class GlobalAccountDeletionService {
  // -------------------------------------------------------------------------
  // Password verification
  // -------------------------------------------------------------------------

  /**
   * Re-authenticate the user before any destructive action.
   * Returns { success: true } when credentials are valid.
   */
  static async verifyPassword(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      // Demo mode — skip actual verification, just ensure non-empty
      if (!email.trim() || !password.trim()) {
        return { success: false, error: "Please enter your password." };
      }
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return {
          success: false,
          error: "Incorrect password. Please try again.",
        };
      }
      return { success: true };
    } catch (e: any) {
      console.error("[GlobalAccountDeletionService] verifyPassword:", e);
      return { success: false, error: "Network error. Please try again." };
    }
  }

  // -------------------------------------------------------------------------
  // Subscription status
  // -------------------------------------------------------------------------

  static async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const isAvailable = PurchaseService.isAvailable();

    if (!isAvailable) {
      return {
        isPremium: false,
        planType: null,
        renewalDate: null,
        isAvailable: false,
      };
    }

    try {
      const isPremium = await PurchaseService.isPremium();

      if (!isPremium) {
        return {
          isPremium: false,
          planType: null,
          renewalDate: null,
          isAvailable: true,
        };
      }

      // Derive plan type & renewal date from current offering / customer info
      const Purchases =
        require("react-native-purchases").default as typeof import("react-native-purchases").default;
      const customerInfo = await Purchases.getCustomerInfo();

      const premiumEntitlement =
        customerInfo.entitlements.active["premium"];
      let renewalDate: string | null = null;
      let planType: PlanType = null;

      if (premiumEntitlement) {
        renewalDate =
          premiumEntitlement.expirationDate ??
          premiumEntitlement.latestPurchaseDate ??
          null;

        // Derive monthly vs annual from the product identifier (heuristic)
        const productId =
          premiumEntitlement.productIdentifier?.toLowerCase() ?? "";
        if (
          productId.includes("annual") ||
          productId.includes("yearly") ||
          productId.includes("year")
        ) {
          planType = "annual";
        } else if (
          productId.includes("monthly") ||
          productId.includes("month")
        ) {
          planType = "monthly";
        } else {
          // Default: treat unknown as monthly (conservative)
          planType = "monthly";
        }
      }

      return { isPremium: true, planType, renewalDate, isAvailable: true };
    } catch (e) {
      console.error("[GlobalAccountDeletionService] getSubscriptionStatus:", e);
      return {
        isPremium: false,
        planType: null,
        renewalDate: null,
        isAvailable: false,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Refund eligibility
  // -------------------------------------------------------------------------

  /**
   * Returns refund window and eligibility for the given plan type.
   * Windows: Annual → 15 days, Monthly → 7 days.
   */
  static getRefundInfo(
    planType: PlanType,
    purchasedAtIso: string | null,
  ): RefundInfo {
    const windowDays = planType === "annual" ? 15 : 7;
    if (!purchasedAtIso) {
      return { windowDays, eligible: false, purchasedAt: null };
    }
    const purchasedAt = new Date(purchasedAtIso);
    const deadline = new Date(purchasedAt);
    deadline.setDate(deadline.getDate() + windowDays);
    const eligible = new Date() <= deadline;
    return { windowDays, eligible, purchasedAt: purchasedAtIso };
  }

  // -------------------------------------------------------------------------
  // 30-day resubscribe block
  // -------------------------------------------------------------------------

  /**
   * Returns true if this email hash is still within the 30-day
   * resubscribe block period recorded in deletion_log.
   * Always returns false in demo mode (no Supabase).
   */
  static async checkResubscribeBlock(email: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { data, error } = await (supabase as any).rpc(
        "check_resubscribe_block",
        { email_input: email },
      );
      if (error) {
        console.error("[GlobalAccountDeletionService] resubscribeBlock:", error);
        return false;
      }
      return !!data;
    } catch (e) {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Deletion intent (pending_deletion table)
  // -------------------------------------------------------------------------

  static async getDeletionIntent(userId: string): Promise<DeletionIntent> {
    if (!isSupabaseConfigured || !supabase) {
      return { isPending: false, scheduledDate: null, planType: null };
    }
    try {
      const { data, error } = await (supabase as any)
        .from("pending_deletion")
        .select("subscription_end_date, plan_type")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) {
        return { isPending: false, scheduledDate: null, planType: null };
      }
      return {
        isPending: true,
        scheduledDate: data.subscription_end_date,
        planType: (data.plan_type as PlanType) ?? null,
      };
    } catch (e) {
      return { isPending: false, scheduledDate: null, planType: null };
    }
  }

  static async scheduleDeletion(
    userId: string,
    subscriptionEndDateIso: string,
    planType: PlanType,
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: "Scheduled deletion requires Supabase.",
      };
    }
    try {
      const { error } = await (supabase as any).from("pending_deletion").upsert(
        {
          user_id: userId,
          subscription_end_date: subscriptionEndDateIso,
          plan_type: planType,
        },
        { onConflict: "user_id" },
      );
      if (error) {
        return { success: false, error: error.message };
      }
      // Attempt to trigger email notification (best-effort)
      this._sendDeletionScheduledEmail(userId).catch(() => {});
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  static async cancelDeletion(
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: "Requires Supabase." };
    }
    try {
      const { error } = await (supabase as any)
        .from("pending_deletion")
        .delete()
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };
      this._sendDeletionCancelledEmail(userId).catch(() => {});
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  // -------------------------------------------------------------------------
  // Main entry point — called from the modal's Step 3
  // -------------------------------------------------------------------------

  /**
   * Either executes immediate deletion (free / lapsed subscription) or
   * schedules it (active subscription).  Returns to the caller so the UI
   * can react.
   */
  static async scheduleOrExecuteDeletion(
    userId: string,
    email: string,
  ): Promise<ExecuteResult> {
    const status = await this.getSubscriptionStatus();

    if (status.isPremium && status.renewalDate) {
      const expiryDate = new Date(status.renewalDate);
      const now = new Date();

      if (expiryDate > now) {
        // Active subscription — schedule instead of deleting now
        const result = await this.scheduleDeletion(
          userId,
          status.renewalDate,
          status.planType,
        );
        if (!result.success) return { success: false, error: result.error };

        return {
          success: true,
          blocked: true,
          reason: "active_subscription",
          expiresAt: status.renewalDate,
        };
      }
    }

    // Free user or subscription has lapsed — wipe now
    return this.executeImmediateDeletion(userId, email);
  }

  // -------------------------------------------------------------------------
  // Immediate deletion — access cut FIRST, cleanup second
  // -------------------------------------------------------------------------

  static async executeImmediateDeletion(
    userId: string,
    email: string,
  ): Promise<ExecuteResult> {
    try {
      // ── Step 1: Revoke session immediately ──────────────────────────────
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signOut();
        } catch (_) {}
      }

      // ── Step 2: Wipe all local storage ─────────────────────────────────
      const keysToRemove = [
        ...ALL_ASYNC_STORAGE_KEYS,
        `${PROFILE_IMAGE_KEY_PREFIX}${userId}`,
      ];
      try {
        await AsyncStorage.multiRemove(keysToRemove);
      } catch (_) {}

      // ── Step 3: Delete local profile image file ─────────────────────────
      try {
        const { GlobalProfileImageService } = await import(
          "./globalProfileImageService"
        );
        await GlobalProfileImageService.deleteProfileImage(userId);
      } catch (_) {}

      // ── Step 4: Anonymise RevenueCat customer ───────────────────────────
      try {
        await PurchaseService.logoutUser();
      } catch (_) {}

      // ── Step 5: Server-side PII wipe (background, non-blocking) ─────────
      if (isSupabaseConfigured && supabase) {
        (supabase as any)
          .rpc("anonymize_user_data", { target_user_id: userId })
          .then(({ error }: { error: any }) => {
            if (error) {
              console.error(
                "[GlobalAccountDeletionService] anonymize_user_data:",
                error,
              );
            }
          })
          .catch(console.error);
      }

      // ── Step 6: Remove any pending deletion intent ──────────────────────
      if (isSupabaseConfigured && supabase) {
        (supabase as any)
          .from("pending_deletion")
          .delete()
          .eq("user_id", userId)
          .then(() => {})
          .catch(() => {});
      }

      return { success: true };
    } catch (e: any) {
      console.error("[GlobalAccountDeletionService] executeImmediateDeletion:", e);
      return { success: false, error: e.message ?? "Unexpected error." };
    }
  }

  // -------------------------------------------------------------------------
  // Check pending deletion on app open (call from AuthContext)
  // -------------------------------------------------------------------------

  /**
   * On every app startup with a valid session, check whether a scheduled
   * deletion has passed its subscription end date.  If so, execute it.
   * Returns true if deletion was triggered.
   */
  static async checkAndExecutePendingDeletion(
    userId: string,
    email: string,
  ): Promise<boolean> {
    const intent = await this.getDeletionIntent(userId);
    if (!intent.isPending || !intent.scheduledDate) return false;

    const scheduledDate = new Date(intent.scheduledDate);
    if (scheduledDate > new Date()) return false;

    // Subscription has lapsed — execute now
    await this.executeImmediateDeletion(userId, email);
    return true;
  }

  // -------------------------------------------------------------------------
  // Email helpers (best-effort — require Supabase Edge Function)
  // -------------------------------------------------------------------------

  private static async _sendDeletionScheduledEmail(
    userId: string,
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await (supabase as any).functions.invoke("send-deletion-scheduled-email", {
        body: { userId },
      });
    } catch (_) {}
  }

  private static async _sendDeletionCancelledEmail(
    userId: string,
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await (supabase as any).functions.invoke(
        "send-deletion-cancelled-email",
        { body: { userId } },
      );
    } catch (_) {}
  }

  // -------------------------------------------------------------------------
  // Platform-specific subscription management URL
  // -------------------------------------------------------------------------

  static getManageSubscriptionUrl(): string {
    if (Platform.OS === "ios") {
      return "itms-apps://apps.apple.com/account/subscriptions";
    }
    return "https://play.google.com/store/account/subscriptions";
  }
}
