/**
 * app/(tabs)/profile.tsx
 *
 * Profile tab screen — subscription status, profile image, account management.
 */

import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GlobalDeleteAccountModal } from "../../components/globalDeleteAccountModal";
import { GlobalProfileImagePicker } from "../../components/globalProfileImagePicker";
import { GlobalSubscriptionStatusCard } from "../../components/globalSubscriptionStatusCard";
import { useAuth } from "../../contexts/AuthContext";
import {
    useColors,
    useRadius,
    useSpacing,
    useTypography,
} from "../../contexts/ThemeContext";
import {
    GlobalAccountDeletionService,
    type DeletionIntent,
    type SubscriptionStatus,
} from "../../services/globalAccountDeletionService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUEST_USER_ID = "guest_user";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const typography = useTypography();

  // ── State ────────────────────────────────────────────────────────────────
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [deletionIntent, setDeletionIntent] = useState<DeletionIntent | null>(
    null,
  );
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const hasMounted = useRef(false);

  const isGuest = !user || user.id === GUEST_USER_ID;

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user || isGuest) return;
    setLoadingStatus(true);
    try {
      const [status, intent] = await Promise.all([
        GlobalAccountDeletionService.getSubscriptionStatus(),
        GlobalAccountDeletionService.getDeletionIntent(user.id),
      ]);
      setSubscriptionStatus(status);
      setDeletionIntent(intent);
    } finally {
      setLoadingStatus(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      loadData();
    }
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/welcome" as any);
        },
      },
    ]);
  }, [signOut, router]);

  const handleUpgrade = useCallback(() => {
    router.push("/upgrade" as any);
  }, [router]);

  const handleManageSubscription = useCallback(() => {
    const url = GlobalAccountDeletionService.getManageSubscriptionUrl();
    Linking.openURL(url).catch(() =>
      Alert.alert(
        "Could not open",
        "Please manage your subscription in the App Store or Google Play.",
      ),
    );
  }, []);

  const handleCancelDeletion = useCallback(async () => {
    if (!user) return;
    Alert.alert(
      "Cancel Deletion",
      "Are you sure you want to cancel your account deletion request? Your account will remain active.",
      [
        { text: "No, keep deletion", style: "cancel" },
        {
          text: "Yes, cancel deletion",
          onPress: async () => {
            const result = await GlobalAccountDeletionService.cancelDeletion(
              user.id,
            );
            if (result.success) {
              setDeletionIntent({
                isPending: false,
                scheduledDate: null,
                planType: null,
              });
              Alert.alert(
                "Deletion Cancelled",
                "Your account deletion request has been cancelled. A confirmation email has been sent.",
              );
            } else {
              Alert.alert(
                "Error",
                result.error ?? "Could not cancel deletion.",
              );
            }
          },
        },
      ],
    );
  }, [user]);

  const handleDeletionComplete = useCallback(async () => {
    setShowDeleteModal(false);
    await signOut();
    router.replace("/(auth)/welcome" as any);
  }, [signOut, router]);

  // ── Shared style helpers ─────────────────────────────────────────────────

  const card = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
  };

  // ── Guest view ───────────────────────────────────────────────────────────

  if (isGuest) {
    return (
      <View
        style={[
          styles.centreContainer,
          { backgroundColor: colors.background, padding: spacing.xl },
        ]}
      >
        <FontAwesome6 name="circle-user" size={80} color={colors.textLight} />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            marginTop: spacing.md,
            textAlign: "center",
          }}
        >
          You're browsing as a guest
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.base,
            textAlign: "center",
            marginTop: spacing.sm,
            marginBottom: spacing.xl,
          }}
        >
          Create a free account to save recipes, sync across devices, and manage
          your subscription.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            height: 50,
            paddingHorizontal: spacing.xl,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => router.push("/account?mode=signup" as any)}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.base,
            }}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header / Avatar ─────────────────────────────────────────── */}
        <View
          style={[card, { alignItems: "center", paddingVertical: spacing.xl }]}
        >
          <GlobalProfileImagePicker
            userId={user!.id}
            displayName={user!.name}
            size={100}
            editable
          />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              marginTop: spacing.md,
            }}
          >
            {user!.name}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
              marginTop: 2,
            }}
          >
            {user!.email}
          </Text>
        </View>

        {/* ── Subscription status card ─────────────────────────────────── */}
        <GlobalSubscriptionStatusCard
          planTier={subscriptionStatus?.isPremium ? "premium" : "free"}
          planType={subscriptionStatus?.planType ?? null}
          renewalDate={subscriptionStatus?.renewalDate ?? null}
          isLoading={loadingStatus}
          isDeletionPending={deletionIntent?.isPending ?? false}
          deletionScheduledDate={deletionIntent?.scheduledDate ?? null}
          onCancelDeletion={
            deletionIntent?.isPending ? handleCancelDeletion : undefined
          }
          refundWindowDays={
            subscriptionStatus?.isPremium && subscriptionStatus.planType
              ? GlobalAccountDeletionService.getRefundInfo(
                  subscriptionStatus.planType,
                  subscriptionStatus.renewalDate,
                ).windowDays
              : null
          }
          refundEligible={
            subscriptionStatus?.isPremium && subscriptionStatus.planType
              ? GlobalAccountDeletionService.getRefundInfo(
                  subscriptionStatus.planType,
                  subscriptionStatus.renewalDate,
                ).eligible
              : false
          }
        />

        {/* ── Account actions ──────────────────────────────────────────── */}
        <View style={card}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.md,
            }}
          >
            Account
          </Text>

          {/* Upgrade to Premium */}
          {!subscriptionStatus?.isPremium && (
            <TouchableOpacity
              style={[
                styles.actionRow,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={handleUpgrade}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="crown" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.actionLabel,
                  {
                    color: colors.primary,
                    marginLeft: spacing.md,
                    fontWeight: typography.fontWeight.semibold,
                  },
                ]}
              >
                Upgrade to Premium
              </Text>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color={colors.primary}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          )}

          {/* Manage Subscription */}
          {subscriptionStatus?.isPremium && (
            <TouchableOpacity
              style={[
                styles.actionRow,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={handleManageSubscription}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="credit-card"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  styles.actionLabel,
                  { color: colors.textPrimary, marginLeft: spacing.md },
                ]}
              >
                Manage Subscription
              </Text>
              <FontAwesome6
                name="chevron-right"
                size={16}
                color={colors.textLight}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          )}

          {/* Sign Out */}
          <TouchableOpacity
            style={[
              styles.actionRow,
              { borderBottomColor: colors.borderLight },
            ]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name="right-from-bracket"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.actionLabel,
                { color: colors.textSecondary, marginLeft: spacing.md },
              ]}
            >
              Sign Out
            </Text>
            <FontAwesome6
              name="chevron-right"
              size={16}
              color={colors.textLight}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* ── Danger zone ──────────────────────────────────────────────── */}
        <View
          style={[
            card,
            {
              borderColor: colors.error + "40",
              backgroundColor: colors.error + "05",
            },
          ]}
        >
          <Text
            style={{
              color: colors.error,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.md,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Danger Zone
          </Text>

          {deletionIntent?.isPending ? (
            // Show cancel option if deletion is pending
            <TouchableOpacity
              style={[
                styles.dangerButton,
                {
                  borderColor: colors.warning,
                  backgroundColor: colors.warning + "15",
                  borderRadius: radius.md,
                },
              ]}
              onPress={handleCancelDeletion}
              activeOpacity={0.8}
            >
              <FontAwesome6
                name="circle-xmark"
                size={20}
                color={colors.warning}
              />
              <Text
                style={[
                  styles.dangerButtonText,
                  { color: colors.warning, marginLeft: spacing.sm },
                ]}
              >
                Cancel Deletion Request
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.dangerButton,
                {
                  borderColor: colors.error,
                  backgroundColor: colors.error + "10",
                  borderRadius: radius.md,
                },
              ]}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.8}
            >
              <FontAwesome6 name="trash" size={20} color={colors.error} />
              <Text
                style={[
                  styles.dangerButtonText,
                  { color: colors.error, marginLeft: spacing.sm },
                ]}
              >
                Delete Account
              </Text>
            </TouchableOpacity>
          )}

          <Text
            style={{
              color: colors.textLight,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.sm,
            }}
          >
            {deletionIntent?.isPending
              ? `Scheduled for ${
                  deletionIntent.scheduledDate
                    ? new Date(
                        deletionIntent.scheduledDate,
                      ).toLocaleDateString()
                    : "—"
                }. You keep full access until then.`
              : "Permanently delete your account and all associated data. This action cannot be undone."}
          </Text>
        </View>

        {/* ── Legal ────────────────────────────────────────────────────── */}
        <Text
          style={{
            color: colors.textLight,
            fontSize: typography.fontSize.xs,
            textAlign: "center",
            marginTop: spacing.sm,
            lineHeight: 18,
          }}
        >
          Resubscribing is unavailable for 30 days after account deletion.
          {"\n"}Transaction history is retained for tax and legal compliance.
        </Text>
      </ScrollView>

      {/* ── Delete modal ───────────────────────────────────────────────── */}
      <GlobalDeleteAccountModal
        visible={showDeleteModal}
        email={user!.email}
        userId={user!.id}
        onClose={() => setShowDeleteModal(false)}
        onDeletionComplete={handleDeletionComplete}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  centreContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    fontSize: 15,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
