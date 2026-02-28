import Button from "@/components/buttons";
import { useAuth } from "@/contexts/AuthContext";
import { useColors, useRadius, useSpacing } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const { resetPasswordRequest } = useAuth();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const result = await resetPasswordRequest(email.trim());

      if (result.success) {
        Alert.alert(
          "Reset Link Sent",
          "If an account exists with this email, you will receive a password reset link shortly. Please check your inbox.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ],
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to send reset link. Please try again.",
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[styles.iconContainer, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="key-outline" size={48} color={colors.secondary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>
            Forgot Password?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>
        </View>

        {/* Email Input */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  borderRadius: radius.md,
                },
              ]}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isSending}
              onSubmitEditing={handleResetPassword}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={isSending ? "Sending..." : "Send Reset Link"}
            theme="primary"
            onPress={handleResetPassword}
            disabled={isSending}
          />
          <Button
            label="Back to Sign In"
            theme="secondary"
            onPress={handleGoBack}
            disabled={isSending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    flexGrow: 1,
    paddingVertical: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
  },
  actions: {
    gap: 12,
  },
});
