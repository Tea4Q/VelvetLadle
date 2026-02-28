import Button from "@/components/buttons";
import { useAuth } from "@/contexts/AuthContext";
import { useColors, useRadius, useSpacing } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

export default function ResetPasswordScreen() {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const { updatePassword } = useAuth();
  const params = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please enter and confirm your new password");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure both passwords are identical",
      );
      return;
    }

    setIsResetting(true);
    try {
      const result = await updatePassword(password);

      if (result.success) {
        Alert.alert(
          "Password Reset Successful",
          "Your password has been updated. You can now sign in with your new password.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/sign-in" as any),
            },
          ],
        );
      } else {
        Alert.alert(
          "Reset Failed",
          result.error ||
            "Failed to reset password. The link may have expired. Please request a new reset link.",
          [
            {
              text: "Request New Link",
              onPress: () => router.replace("/forgot-password" as any),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
      }
    } catch (error) {
      console.error("Password update error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsResetting(false);
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
            <Ionicons
              name="lock-closed-outline"
              size={48}
              color={colors.secondary}
            />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your new password below
          </Text>
        </View>

        {/* Password Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              New Password
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: radius.md,
                  },
                ]}
                placeholder="Enter new password (min. 6 characters)"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                editable={!isResetting}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isResetting}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={colors.textLight}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Confirm Password
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: radius.md,
                  },
                ]}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                editable={!isResetting}
                onSubmitEditing={handleResetPassword}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isResetting}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={colors.textLight}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={isResetting ? "Resetting..." : "Reset Password"}
            theme="primary"
            onPress={handleResetPassword}
            disabled={isResetting}
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
  passwordContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  actions: {
    gap: 12,
  },
});
