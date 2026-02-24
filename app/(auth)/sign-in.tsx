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
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

export default function SignInScreen() {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsSigningIn(true);
    try {
      const result = await signIn(email.trim(), password);

      if (result.success) {
        // Navigation is handled by AuthContext
        router.replace("/(tabs)");
      } else {
        // Handle specific error messages
        let errorMessage =
          result.error || "Invalid email or password. Please try again.";

        // Show user-friendly message for network errors
        if (
          errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("fetch") ||
          errorMessage.toLowerCase().includes("connection")
        ) {
          errorMessage =
            "Network connection failed. The app will continue in demo mode. You can use any email and password to sign in.";
        }

        Alert.alert("Sign In Failed", errorMessage);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      Alert.alert(
        "Network Error",
        "Unable to connect to server. The app will continue in demo mode. You can use any email and password to sign in.",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoToCreateAccount = () => {
    router.push("/account");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email Required",
        'Please enter your email address first, then tap "Forgot Password?"',
      );
      return;
    }

    setIsResettingPassword(true);
    try {
      const result = await resetPassword(email.trim());

      if (result.success) {
        Alert.alert(
          "Reset Email Sent",
          "If an account with this email exists, you will receive a password reset link shortly. Please check your email and follow the instructions to reset your password.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "Reset Failed",
          result.error ||
            "Unable to send password reset email. Please try again.",
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
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
            <Ionicons name="log-in" size={48} color={colors.secondary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>
            Welcome Back!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to access your recipes
          </Text>
        </View>

        {/* Sign In Form */}
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
              editable={!isSigningIn}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Password
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
              placeholder="Enter your password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              editable={!isSigningIn}
              onSubmitEditing={handleSignIn}
            />
          </View>

          {/* Forgot Password Link */}
          <View style={styles.forgotPasswordContainer}>
            <Pressable
              onPress={handleForgotPassword}
              disabled={isSigningIn || isResettingPassword}
              style={styles.forgotPasswordButton}
            >
              <Text
                style={[styles.forgotPasswordLink, { color: colors.primary }]}
              >
                {isResettingPassword
                  ? "Sending reset email..."
                  : "Forgot Password?"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={isSigningIn ? "Signing In..." : "Sign In"}
            theme="primary"
            onPress={handleSignIn}
            disabled={isSigningIn || isResettingPassword}
          />
          <Button
            label="Back"
            theme="secondary"
            onPress={handleGoBack}
            disabled={isSigningIn || isResettingPassword}
          />
        </View>

        {/* Create Account Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Don't have an account?{" "}
          </Text>
          <Pressable
            onPress={handleGoToCreateAccount}
            disabled={isSigningIn || isResettingPassword}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Create Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  form: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordButton: {
    padding: 8,
    minHeight: 44, // Ensure good touch target on mobile
  },
  forgotPasswordLink: {
    fontSize: 16, // Increased from 14 for better mobile visibility
    fontWeight: "600",
    textDecorationLine: "underline",
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
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
