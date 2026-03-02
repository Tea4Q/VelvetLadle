import { FREE_ACCOUNT_RECIPE_LIMIT } from "@/constants/limits";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import Button from "../components/buttons";
import { useColors, useSpacing } from "../contexts/ThemeContext";
import { PurchaseService } from "../services/purchaseService";

export default function UpgradeScreen() {
  const colors = useColors();
  const spacing = useSpacing();
  const router = useRouter();

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    async function fetchOffering() {
      setLoadingOffering(true);
      const current = await PurchaseService.getOffering();
      setOffering(current);
      setLoadingOffering(false);
    }
    fetchOffering();
  }, []);

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      setPurchasing(true);
      const result = await PurchaseService.purchasePackage(pkg);
      setPurchasing(false);

      if (result.success) {
        Alert.alert(
          "Welcome to Premium! 🎉",
          "You now have unlimited recipe storage. Enjoy VelvetLadle to the fullest!",
          [{ text: "Let's Go!", onPress: () => router.replace("/(tabs)/add") }],
        );
      } else if (result.error !== "cancelled") {
        Alert.alert(
          "Purchase Failed",
          result.error ?? "Something went wrong. Please try again.",
          [{ text: "OK" }],
        );
      }
    },
    [router],
  );

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    const result = await PurchaseService.restorePurchases();
    setRestoring(false);

    if (!result.success) {
      Alert.alert("Restore Failed", result.error ?? "Please try again.", [
        { text: "OK" },
      ]);
      return;
    }

    if (result.isPremium) {
      Alert.alert(
        "Purchase Restored ✓",
        "Your premium subscription has been restored!",
        [{ text: "Continue", onPress: () => router.replace("/(tabs)/add") }],
      );
    } else {
      Alert.alert(
        "No Active Subscription",
        "We couldn't find a previous premium purchase on this account.",
        [{ text: "OK" }],
      );
    }
  }, [router]);

  const handleGoBack = () => {
    router.push("/(tabs)/recipes");
  };

  const rcAvailable = PurchaseService.isAvailable();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, { padding: spacing.lg }]}>
        {/* Icon */}
        <View
          style={[styles.iconContainer, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="rocket" size={64} color={colors.secondary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.primary }]}>
          Recipe Limit Reached
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Free accounts can save up to {FREE_ACCOUNT_RECIPE_LIMIT} recipes
        </Text>

        {/* Features List */}
        <View
          style={[
            styles.featuresContainer,
            { backgroundColor: colors.surface ?? "#f8f9fa" },
          ]}
        >
          <Text style={[styles.featuresTitle, { color: colors.primary }]}>
            Premium includes:
          </Text>

          {[
            { icon: "infinite" as const, text: "Unlimited recipe storage" },
            { icon: "cloud-upload" as const, text: "Cloud sync across devices" },
            {
              icon: "shield-checkmark" as const,
              text: "Secure backup of all your recipes",
            },
            {
              icon: "people" as const,
              text: "Share recipes with friends (coming soon)",
            },
            {
              icon: "star" as const,
              text: "Premium features & recipe collections",
            },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.feature}>
              <Ionicons name={icon} size={24} color={colors.primary} />
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {text}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing / Purchase */}
        <View style={styles.ctaContainer}>
          {!rcAvailable ? (
            // RevenueCat API keys not yet configured
            <View
              style={[
                styles.infoBox,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.surface ?? "#f8f9fa",
                },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={32}
                color={colors.primary}
                style={{ marginBottom: 8 }}
              />
              <Text style={[styles.infoBoxTitle, { color: colors.primary }]}>
                Coming Soon
              </Text>
              <Text
                style={[styles.infoBoxText, { color: colors.textSecondary }]}
              >
                In-app subscriptions are being set up. Check back for updates!
              </Text>
            </View>
          ) : loadingOffering ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: 16 }}
            />
          ) : offering && offering.availablePackages.length > 0 ? (
            offering.availablePackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.packageButton,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.surface ?? "#f8f9fa",
                  },
                ]}
                onPress={() => handlePurchase(pkg)}
                disabled={purchasing || restoring}
              >
                <Text
                  style={[styles.packageTitle, { color: colors.primary }]}
                >
                  {pkg.product.title}
                </Text>
                <Text
                  style={[styles.packagePrice, { color: colors.textSecondary }]}
                >
                  {pkg.product.priceString}
                  {pkg.packageType === "ANNUAL" && " / year"}
                  {pkg.packageType === "MONTHLY" && " / month"}
                </Text>
                {pkg.product.introPrice && (
                  <Text
                    style={[styles.packageTrial, { color: colors.primary }]}
                  >
                    {pkg.product.introPrice.periodNumberOfUnits}{" "}
                    {pkg.product.introPrice.periodUnit.toLowerCase()} free trial
                  </Text>
                )}
                {purchasing && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ marginTop: 6 }}
                  />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={[
                styles.infoBox,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.surface ?? "#f8f9fa",
                },
              ]}
            >
              <Text style={[styles.infoBoxTitle, { color: colors.primary }]}>
                No Plans Available
              </Text>
              <Text
                style={[styles.infoBoxText, { color: colors.textSecondary }]}
              >
                Subscription plans are being configured. Please check back
                soon.
              </Text>
            </View>
          )}

          {rcAvailable && !loadingOffering && (
            <Button
              label={restoring ? "Restoring…" : "Restore Purchases"}
              onPress={handleRestore}
            />
          )}

          <Button label="Go Back" onPress={handleGoBack} />
        </View>

        {/* Legal */}
        <Text style={[styles.infoText, { color: colors.textLight }]}>
          Your existing recipes are safe and will remain accessible.{"\n"}
          Subscriptions auto-renew unless cancelled at least 24 hours before
          the renewal date.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    alignItems: "center",
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
  },
  ctaContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  packageButton: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 16,
    marginBottom: 4,
  },
  packageTrial: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoBox: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  infoBoxTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
