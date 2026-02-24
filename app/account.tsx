import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import Button from "../components/buttons";
import { useAuth } from "../contexts/AuthContext";
import { useColors, useRadius, useSpacing } from "../contexts/ThemeContext";

export default function AccountScreen() {
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const router = useRouter();
  const { mode: urlMode } = useLocalSearchParams();
  const { user, signInAsGuest, signOut, signUp, signIn } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Handle URL mode parameter
  useEffect(() => {
    if (urlMode === "signin" || urlMode === "signup") {
      setMode(urlMode as "signin" | "signup");
    }
  }, [urlMode]);

  // Critical auth guard - handle authenticated users properly
  useEffect(() => {
    if (user) {
      // If user exists and we're in auth flow, show user info instead of redirect loop
      // Production build: console.log removed
      setShowUserInfo(true);
    } else {
      setShowUserInfo(false);
    }
  }, [user]);

  const handleSignIn = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      // Production build: console.log removed
      const result = await signIn(email, password);

      if (result.success) {
        // Production build: console.log removed
        // Clear form
        setEmail("");
        setPassword("");
        setName("");
        // Navigate directly to tabs instead of going through auth gate
        router.replace("/(tabs)");
      } else {
        console.error("Sign in failed:", result.error);
        Alert.alert("Sign In Failed", result.error || "Please try again.");
      }
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, router]);

  const handleCreateAccount = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Production build: console.log removed
      const result = await signUp(email, password, name);

      if (result.success) {
        // Clear form
        setEmail("");
        setPassword("");
        setName("");
        Alert.alert(
          "Account Created! 🎉",
          "Your account has been created successfully. Welcome to VelvetLadle!",
          [{ text: "Continue", onPress: () => router.replace("/(tabs)") }],
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to create account. Please try again.",
        );
      }
    } catch (error) {
      console.error("Account creation error:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, email, password, signUp, router]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Reset component state
      setShowUserInfo(false);
      setMode("signin");
      setEmail("");
      setPassword("");
      setName("");

      // Stay on account screen but show sign-in form
      // Production build: console.log removed
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  }, [signOut]);

  const handleGoBack = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  // If user is logged in, show account info
  if (showUserInfo && user) {
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
              style={[styles.profileIcon, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person" size={48} color={colors.secondary} />
            </View>
            <Text style={[styles.title, { color: colors.primary }]}>
              Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Welcome, {user.name || "Chef"}!
            </Text>
          </View>

          {/* Account Info */}
          <View
            style={[
              styles.infoContainer,
              { backgroundColor: colors.surface, borderRadius: radius.md },
            ]}
          >
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>
                Email:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {user.email || "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>
                Account Type:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                Free
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textLight }]}>
                Member Since:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Sign Out"
              theme="secondary"
              onPress={handleSignOut}
            />
            <Button label="Back to Dashboard" onPress={handleGoBack} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Show auth form if no user or after sign out
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
            style={[styles.profileIcon, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="person" size={48} color={colors.secondary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>
            {mode === "signin" ? "Sign In" : "Create Your Account"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === "signin"
              ? "Welcome back to Velvet Ladle"
              : "Unlock cloud sync and more features"}
          </Text>
        </View>

        {/* Auth Form */}
        <View style={styles.form}>
          {mode === "signup" && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Name
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
                placeholder="Enter your name"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          )}

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
              placeholder="Enter your email"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Password
            </Text>
            <View
              style={[
                styles.passwordInputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textLight}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <Text
            style={[styles.modeToggleText, { color: colors.textSecondary }]}
          >
            {mode === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}
          </Text>
          <Button
            label={mode === "signin" ? "Create Account" : "Sign In"}
            theme="link"
            size="sm"
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={
              isLoading
                ? mode === "signin"
                  ? "Signing In..."
                  : "Creating Account..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Free Account"
            }
            theme="primary"
            onPress={mode === "signin" ? handleSignIn : handleCreateAccount}
            disabled={isLoading}
          />

          <Button
            label="Continue as Guest"
            theme="link"
            onPress={() => {
              signInAsGuest();
              router.replace("/");
            }}
          />
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
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  profileIcon: {
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
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordInputContainer: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 8,
    minWidth: 32,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
  },
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 4,
  },
  modeToggleText: {
    fontSize: 14,
  },
  actions: {
    gap: 12,
  },
});
