/**
 * globalSubscriptionStatusCard.tsx
 *
 * Portable presentational card — no external service calls.
 * Drop into any Expo app that uses the VelvetLadle theme system,
 * or swap useColors/useSpacing/useTypography for your own equivalents.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useColors,
  useRadius,
  useSpacing,
  useTypography,
} from "../contexts/ThemeContext";
import type { PlanType } from "../services/globalAccountDeletionService";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GlobalSubscriptionStatusCardProps {
  planTier: "free" | "premium";
  planType: PlanType;
  /** ISO date string */
  renewalDate: string | null;
  isLoading: boolean;
  /** When true, shows a pending-deletion countdown banner */
  isDeletionPending?: boolean;
  /** ISO date string — when deletion is scheduled to auto-execute */
  deletionScheduledDate?: string | null;
  onCancelDeletion?: () => void;
  /** Days remaining in refund window (null = not applicable) */
  refundWindowDays?: number | null;
  refundEligible?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(isoString: string): number {
  const diff = new Date(isoString).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalSubscriptionStatusCard({
  planTier,
  planType,
  renewalDate,
  isLoading,
  isDeletionPending = false,
  deletionScheduledDate = null,
  onCancelDeletion,
  refundWindowDays = null,
  refundEligible = false,
}: GlobalSubscriptionStatusCardProps) {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const typography = useTypography();

  const isPremium = planTier === "premium";

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: isPremium ? colors.accentDark : colors.borderLight,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  };

  if (isLoading) {
    return (
      <View style={[cardStyle, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: colors.textSecondary, marginLeft: spacing.sm },
          ]}
        >
          Loading subscription…
        </Text>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isPremium
                ? colors.accentDark
                : colors.borderLight,
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons
            name={isPremium ? "trophy" : "person-outline"}
            size={20}
            color={isPremium ? "#fff" : colors.textSecondary}
          />
        </View>

        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[
              styles.tierLabel,
              {
                color: isPremium ? colors.accentDark : colors.textPrimary,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
              },
            ]}
          >
            {isPremium ? "Premium" : "Free Account"}
          </Text>

          {isPremium && planType && (
            <Text
              style={[
                styles.planType,
                {
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                },
              ]}
            >
              {planType === "annual" ? "Annual Plan" : "Monthly Plan"}
            </Text>
          )}
        </View>
      </View>

      {/* Renewal date */}
      {isPremium && renewalDate && (
        <View style={[styles.detailRow, { marginTop: spacing.md }]}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text
            style={[
              styles.detailText,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                marginLeft: spacing.xs,
              },
            ]}
          >
            {isDeletionPending ? "Subscription ends" : "Renews"}{" "}
            {formatDate(renewalDate)}
          </Text>
        </View>
      )}

      {/* Refund window notice */}
      {isPremium && refundWindowDays !== null && (
        <View
          style={[
            styles.refundBadge,
            {
              backgroundColor: refundEligible
                ? colors.success + "20"
                : colors.borderLight,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Ionicons
            name={refundEligible ? "checkmark-circle-outline" : "time-outline"}
            size={14}
            color={refundEligible ? colors.success : colors.textLight}
          />
          <Text
            style={[
              styles.refundText,
              {
                color: refundEligible ? colors.success : colors.textLight,
                fontSize: typography.fontSize.xs,
                marginLeft: spacing.xs,
              },
            ]}
          >
            {refundEligible
              ? `Eligible for refund — within ${refundWindowDays}-day window`
              : `Refund window (${refundWindowDays} days) has passed`}
          </Text>
        </View>
      )}

      {/* Pending deletion banner */}
      {isDeletionPending && deletionScheduledDate && (
        <View
          style={[
            styles.deletionBanner,
            {
              backgroundColor: colors.error + "15",
              borderColor: colors.error,
              borderRadius: radius.md,
              padding: spacing.md,
              marginTop: spacing.md,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.deletionBannerHeader}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={colors.error}
            />
            <Text
              style={[
                styles.deletionBannerTitle,
                {
                  color: colors.error,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  marginLeft: spacing.xs,
                },
              ]}
            >
              Deletion Scheduled
            </Text>
          </View>
          <Text
            style={[
              styles.deletionBannerBody,
              {
                color: colors.error,
                fontSize: typography.fontSize.xs,
                marginTop: spacing.xs,
              },
            ]}
          >
            Your account will be permanently deleted in{" "}
            {daysUntil(deletionScheduledDate)} day
            {daysUntil(deletionScheduledDate) !== 1 ? "s" : ""} (
            {formatDate(deletionScheduledDate)}).
          </Text>

          {onCancelDeletion && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.error,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  marginTop: spacing.sm,
                  alignSelf: "flex-start",
                },
              ]}
              onPress={onCancelDeletion}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: "#fff", fontSize: typography.fontSize.sm },
                ]}
              >
                Cancel Deletion Request
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  loadingText: {},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tierLabel: {},
  planType: {},
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {},
  refundBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  refundText: {},
  deletionBanner: {},
  deletionBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  deletionBannerTitle: {},
  deletionBannerBody: {},
  cancelButton: {},
  cancelButtonText: {
    fontWeight: "600",
  },
});
