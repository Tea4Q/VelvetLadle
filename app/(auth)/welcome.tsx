import Button from "@/components/buttons";
import ImageViewer from "@/components/imageViewer";
import { useColors } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const placeHolderImage = require("../../assets/images/veveltLifeSplashImage.png");

export default function WelcomeScreen() {
  const colors = useColors();
  const { signInAsGuest } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Main Content */}

        <ScrollView contentContainerStyle={styles.authContainer}>
          {/* Logo/Brand Section */}
          <View style={styles.brandSection}>
            <ImageViewer imgSource={placeHolderImage} />
            <Text style={[styles.brandTitle, { color: colors.primary }]}>
              Welcome to Velvet Ladle
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.textLight }]}>
              Your personal recipe collection & cuisine discovery platform
            </Text>
          </View>

          {/* Auth Buttons */}
          <View style={styles.authButtonsContainer}>
            <Button
              label="Sign In"
              theme="primary"
              onPress={() => {
                router.push({
                  pathname: "/account",
                  params: { mode: "signin" },
                });
              }}
            />
            <Button
              label="Create Account"
              theme="secondary"
              onPress={() => {
                // TODO: Create dedicated sign in screen or use account screen
                router.push("/account");
              }}
            />
            <Pressable
              style={styles.guestButton}
              onPress={() => signInAsGuest()}
            >
              <Text
                style={[styles.guestButtonText, { color: colors.textLight }]}
              >
                Continue as Guest
              </Text>
            </Pressable>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresPreview}>
            <Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>
              ✨ What you can do:
            </Text>
            <View style={styles.featuresList}>
              <Text style={[styles.featureItem, { color: colors.textLight }]}>
                🌐 Save recipes from any website
              </Text>
              <Text style={[styles.featureItem, { color: colors.textLight }]}>
                ⭐ Create your personal favorites collection
              </Text>
              <Text style={[styles.featureItem, { color: colors.textLight }]}>
                🔍 Search by ingredients or cuisine
              </Text>
              <Text style={[styles.featureItem, { color: colors.textLight }]}>
                📱 Scan recipes with OCR (coming soon)
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 48,
    marginTop: 24,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  authButtonsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  guestButtonText: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
  featuresPreview: {
    alignItems: "center",
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
