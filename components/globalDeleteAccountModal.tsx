/**
 * globalDeleteAccountModal.tsx
 *
 * 3-step account-deletion modal + post-deletion confirmation panel.
 * Portable — copy into any Expo app using the VelvetLadle theme system.
 *
 * Steps:
 *  1. Confirm Password
 *  2. Warning (subscription info, refund window, "I understand" toggle)
 *  3. Final confirmation (danger button)
 *  4. Post-deletion panel (non-dismissable — forces user to read before closing)
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useColors,
  useRadius,
  useSpacing,
  useTypography,
} from "../contexts/ThemeContext";
import {
  GlobalAccountDeletionService,
  type PlanType,
  type SubscriptionStatus,
} from "../services/globalAccountDeletionService";
import { GlobalSubscriptionStatusCard } from "./globalSubscriptionStatusCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GlobalDeleteAccountModalProps {
  visible: boolean;
  /** User's email — needed for password re-auth */
  email: string;
  userId: string;
  onClose: () => void;
  /** Called after immediate deletion OR after scheduling — parent handles navigation */
  onDeletionComplete: () => void;
}

type Step = 1 | 2 | 3 | "deleted" | "scheduled";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalDeleteAccountModal({
  visible,
  email,
  userId,
  onClose,
  onDeletionComplete,
}: GlobalDeleteAccountModalProps) {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const typography = useTypography();

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);

  // Reset whenever modal opens
  useEffect(() => {
    if (visible) {
      setStep(1);
      setPassword("");
      setPasswordError(null);
      setUnderstood(false);
      setSubmitting(false);
      setScheduledDate(null);
      loadSubscriptionStatus();
    }
  }, [visible]);

  const loadSubscriptionStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await GlobalAccountDeletionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } finally {
      setLoadingStatus(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const isPremium = subscriptionStatus?.isPremium ?? false;
  const planType: PlanType = subscriptionStatus?.planType ?? null;
  const renewalDate = subscriptionStatus?.renewalDate ?? null;

  const refundInfo =
    isPremium && planType
      ? GlobalAccountDeletionService.getRefundInfo(planType, renewalDate)
      : null;

  const isActiveSubscription =
    isPremium && renewalDate && new Date(renewalDate) > new Date();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleVerifyPassword = useCallback(async () => {
    if (!password.trim()) {
      setPasswordError("Please enter your password.");
      return;
    }
    setVerifyingPassword(true);
    setPasswordError(null);
    const result = await GlobalAccountDeletionService.verifyPassword(
      email,
      password,
    );
    setVerifyingPassword(false);
    if (!result.success) {
      setPasswordError(result.error ?? "Incorrect password.");
    } else {
      setStep(2);
    }
  }, [email, password]);

  const handleFinalDelete = useCallback(async () => {
    setSubmitting(true);
    const result = await GlobalAccountDeletionService.scheduleOrExecuteDeletion(
      userId,
      email,
    );
    setSubmitting(false);

    if (!result.success && !result.blocked) {
      // Unexpected error — stay on step 3 and show message
      setPasswordError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    if (result.blocked && result.expiresAt) {
      // Active subscription — deletion has been scheduled
      setScheduledDate(result.expiresAt);
      setStep("scheduled");
    } else {
      // Immediate deletion executed
      setStep("deleted");
    }
  }, [userId, email]);

  // ── Shared style helpers ─────────────────────────────────────────────────

  const s = {
    container: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end" as const,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: "90%" as const,
      paddingBottom: Platform.OS === "ios" ? 34 : spacing.lg,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.borderLight,
      borderRadius: 2,
      alignSelf: "center" as const,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    body: {
      padding: spacing.lg,
    },
    label: {
      color: colors.textPrimary,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: typography.fontSize.base,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
      marginTop: spacing.xs,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      height: 50,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: spacing.lg,
    },
    dangerBtn: {
      backgroundColor: colors.error,
      borderRadius: radius.md,
      height: 50,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: spacing.lg,
    },
    outlineBtn: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      height: 50,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: spacing.sm,
    },
    btnText: {
      color: "#fff",
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
    },
    outlineBtnText: {
      color: colors.textSecondary,
      fontSize: typography.fontSize.base,
    },
    stepIndicator: {
      color: colors.textLight,
      fontSize: typography.fontSize.sm,
      marginBottom: spacing.xs,
    },
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.body}>
        <Text style={s.stepIndicator}>Step 1 of 3</Text>
        <Text style={s.label}>Confirm your password to continue</Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            marginBottom: spacing.md,
          }}
        >
          For your security, we need to verify it's you before proceeding.
        </Text>

        <TextInput
          style={[s.input, passwordError ? s.inputError : null]}
          placeholder="Enter your password"
          placeholderTextColor={colors.textLight}
          secureTextEntry
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (passwordError) setPasswordError(null);
          }}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleVerifyPassword}
        />

        {passwordError && (
          <Text style={s.errorText}>{passwordError}</Text>
        )}

        <TouchableOpacity
          style={[s.primaryBtn, verifyingPassword && { opacity: 0.6 }]}
          onPress={handleVerifyPassword}
          disabled={verifyingPassword}
          activeOpacity={0.8}
        >
          {verifyingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>Continue →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.outlineBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={s.outlineBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.body}>
        <Text style={s.stepIndicator}>Step 2 of 3</Text>
        <Text style={[s.label, { marginBottom: spacing.md }]}>
          Before you delete your account
        </Text>

        {/* Subscription status card */}
        <GlobalSubscriptionStatusCard
          planTier={isPremium ? "premium" : "free"}
          planType={planType}
          renewalDate={renewalDate}
          isLoading={loadingStatus}
          refundWindowDays={refundInfo?.windowDays ?? null}
          refundEligible={refundInfo?.eligible ?? false}
        />

        {/* Scheduled deletion notice */}
        {isActiveSubscription && (
          <View
            style={{
              backgroundColor: colors.warning + "18",
              borderColor: colors.warning,
              borderWidth: 1,
              borderRadius: radius.md,
              padding: spacing.md,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.warning}
              />
              <Text
                style={{
                  color: colors.warning,
                  fontWeight: typography.fontWeight.bold,
                  fontSize: typography.fontSize.sm,
                  marginLeft: spacing.xs,
                }}
              >
                Deletion will be scheduled, not immediate
              </Text>
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                marginTop: spacing.xs,
              }}
            >
              Your subscription is active until{" "}
              <Text style={{ fontWeight: typography.fontWeight.semibold }}>
                {formatDate(renewalDate)}
              </Text>
              . You will keep full access until then. Your account and data will
              be permanently deleted on that date.
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                marginTop: spacing.xs,
              }}
            >
              To cancel deletion before then, visit your Profile screen.
            </Text>
          </View>
        )}

        {/* What gets deleted / kept */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            marginTop: spacing.lg,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.error + "10",
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.error,
                fontWeight: typography.fontWeight.bold,
                fontSize: typography.fontSize.sm,
                marginBottom: spacing.sm,
              }}
            >
              🗑 Deleted
            </Text>
            {[
              "Your email & name",
              "All saved recipes",
              "Favourites",
              "Profile photo",
              "Account access",
            ].map((item) => (
              <Text
                key={item}
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: 2,
                }}
              >
                • {item}
              </Text>
            ))}
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.success + "10",
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.success,
                fontWeight: typography.fontWeight.bold,
                fontSize: typography.fontSize.sm,
                marginBottom: spacing.sm,
              }}
            >
              ✓ Retained
            </Text>
            {[
              "Transaction history",
              "Fraud logs",
              "Legal records",
              "Anonymised analytics",
            ].map((item) => (
              <Text
                key={item}
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: 2,
                }}
              >
                • {item}
              </Text>
            ))}
          </View>
        </View>

        {/* Important: subscription billing */}
        <View
          style={{
            backgroundColor: colors.info + "15",
            borderRadius: radius.md,
            padding: spacing.md,
            marginTop: spacing.md,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Ionicons
            name="card-outline"
            size={16}
            color={colors.info}
            style={{ marginTop: 2 }}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.xs,
              marginLeft: spacing.sm,
              flex: 1,
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>
              Deleting your account does not cancel your subscription.
            </Text>{" "}
            Cancel your subscription separately via the App Store or Google Play
            before proceeding to avoid further charges.
          </Text>
        </View>

        {/* Refund notice */}
        {refundInfo?.eligible && (
          <View
            style={{
              backgroundColor: colors.success + "10",
              borderRadius: radius.md,
              padding: spacing.md,
              marginTop: spacing.sm,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={colors.success}
              style={{ marginTop: 2 }}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSize.xs,
                marginLeft: spacing.sm,
                flex: 1,
              }}
            >
              You may be eligible for a refund within{" "}
              {refundInfo.windowDays} days of your purchase. Contact App Store /
              Google Play support.
            </Text>
          </View>
        )}

        {/* "I understand" toggle */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: colors.background,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: understood ? colors.error : colors.borderLight,
          }}
        >
          <Switch
            value={understood}
            onValueChange={setUnderstood}
            trackColor={{ false: colors.borderLight, true: colors.error }}
            thumbColor="#fff"
          />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.fontSize.sm,
              marginLeft: spacing.md,
              flex: 1,
            }}
          >
            I understand that account deletion is permanent and cannot be
            undone.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            s.dangerBtn,
            !understood && { opacity: 0.4 },
          ]}
          onPress={() => setStep(3)}
          disabled={!understood}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>Proceed to Final Step →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.outlineBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={s.outlineBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.body}>
        <Text style={s.stepIndicator}>Step 3 of 3 — Final Confirmation</Text>

        {/* Big red warning card */}
        <View
          style={{
            backgroundColor: colors.error + "12",
            borderWidth: 2,
            borderColor: colors.error,
            borderRadius: radius.lg,
            padding: spacing.lg,
            alignItems: "center",
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons name="warning" size={40} color={colors.error} />
          <Text
            style={{
              color: colors.error,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              marginTop: spacing.sm,
              textAlign: "center",
            }}
          >
            THIS CANNOT BE UNDONE
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
              textAlign: "center",
              marginTop: spacing.sm,
            }}
          >
            {isActiveSubscription
              ? `Your account will be permanently deleted on ${formatDate(renewalDate)}. You will be signed out immediately once deletion executes.`
              : "You will be immediately signed out and all your data will be permanently removed."}
          </Text>
        </View>

        {passwordError && (
          <Text style={[s.errorText, { marginBottom: spacing.sm }]}>
            {passwordError}
          </Text>
        )}

        <TouchableOpacity
          style={[s.dangerBtn, submitting && { opacity: 0.6 }]}
          onPress={handleFinalDelete}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>
              {isActiveSubscription
                ? `Schedule Deletion for ${formatDate(renewalDate)}`
                : "Delete My Account Now"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.outlineBtn}
          onPress={() => setStep(2)}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Text style={s.outlineBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDeletedPanel = () => (
    <View style={[s.body, { alignItems: "center" }]}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.error + "20",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Ionicons name="close-circle" size={48} color={colors.error} />
      </View>

      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.bold,
          textAlign: "center",
          marginBottom: spacing.md,
        }}
      >
        Account Deleted
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSize.base,
          textAlign: "center",
          marginBottom: spacing.md,
          lineHeight: 22,
        }}
      >
        You have been immediately signed out. Your personal data has been
        removed from our systems.
      </Text>

      <View
        style={{
          backgroundColor: colors.warning + "18",
          borderRadius: radius.md,
          padding: spacing.md,
          width: "100%",
          marginBottom: spacing.sm,
        }}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            textAlign: "center",
          }}
        >
          <Text style={{ fontWeight: typography.fontWeight.semibold }}>
            Subscription billing:
          </Text>{" "}
          Any active subscription will continue until the end of its current
          billing period. Please cancel it via the App Store or Google Play if
          you have not already done so.
        </Text>
      </View>

      {refundInfo?.eligible && (
        <View
          style={{
            backgroundColor: colors.success + "15",
            borderRadius: radius.md,
            padding: spacing.md,
            width: "100%",
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.success,
              fontSize: typography.fontSize.sm,
              textAlign: "center",
            }}
          >
            You may be eligible for a refund. Contact App Store / Google Play
            support within {refundInfo.windowDays} days of your purchase.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          s.primaryBtn,
          { width: "100%", marginTop: spacing.md },
        ]}
        onPress={onDeletionComplete}
        activeOpacity={0.8}
      >
        <Text style={s.btnText}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScheduledPanel = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[s.body, { alignItems: "center" }]}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.warning + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons name="calendar-outline" size={44} color={colors.warning} />
        </View>

        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.bold,
            textAlign: "center",
            marginBottom: spacing.md,
          }}
        >
          Deletion Scheduled
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.base,
            textAlign: "center",
            marginBottom: spacing.md,
            lineHeight: 22,
          }}
        >
          Your account and data will be permanently deleted on{" "}
          <Text style={{ fontWeight: typography.fontWeight.semibold, color: colors.error }}>
            {formatDate(scheduledDate)}
          </Text>
          . Until then, you have full access to your account.
        </Text>

        <View
          style={{
            backgroundColor: colors.info + "15",
            borderRadius: radius.md,
            padding: spacing.md,
            width: "100%",
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
              textAlign: "center",
            }}
          >
            A confirmation email with a cancellation link has been sent to{" "}
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>
              {email}
            </Text>
            . You can also cancel this request from your Profile screen.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.warning + "15",
            borderRadius: radius.md,
            padding: spacing.md,
            width: "100%",
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
              textAlign: "center",
            }}
          >
            <Text style={{ fontWeight: typography.fontWeight.semibold }}>
              Remember:
            </Text>{" "}
            Deleting your account does not cancel your subscription. Cancel it
            separately to avoid future charges.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.primaryBtn, { width: "100%", marginTop: spacing.sm }]}
          onPress={onDeletionComplete}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>Got It</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const isDismissable = step !== "deleted";
  const stepTitle: Record<Step, string> = {
    1: "Delete Account",
    2: "Delete Account",
    3: "Delete Account",
    deleted: "",
    scheduled: "",
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isDismissable ? onClose : undefined}
    >
      <KeyboardAvoidingView
        style={s.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Backdrop tap to dismiss (not on "deleted" step) */}
        {isDismissable && (
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
          />
        )}

        <View style={s.sheet}>
          {/* Handle bar */}
          <View style={s.handle} />

          {/* Header */}
          {step !== "deleted" && step !== "scheduled" && (
            <View style={s.header}>
              <Text style={s.title}>{stepTitle[step]}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === "deleted" && renderDeletedPanel()}
          {step === "scheduled" && renderScheduledPanel()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
