// import ManualRecipeModal from '@/components/ManualRecipeModal';
import RecipeForm from "@/components/RecipeForm";
import UrlActionModal from "@/components/UrlActionModal";
import { FREE_ACCOUNT_RECIPE_LIMIT } from "@/constants/limits";
import { useAuth } from "@/contexts/AuthContext";
import { useColors, useRadius } from "@/contexts/ThemeContext";
import { Recipe } from "@/lib/supabase";
import { RecipeDatabase } from "@/services/recipeDatabase";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
	faCarrot,
	faEgg,
	faLightbulb,
	faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import FontAwesomeIcon from "@/components/FontAwesomeIcon";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

export default function AddScreen() {
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [showRecipeForm, setRecipeForm] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [testRecipeSource, setTestRecipeSource] = useState<string>("");

  const colors = useColors();
  const radius = useRadius();
  const { user } = useAuth();

  // Check if guest and redirect to account creation
  useFocusEffect(
    useCallback(() => {
      async function checkAccess() {
        const isGuest = user?.id === "guest_user";
        if (isGuest) {
          // Redirect guests to account creation
          Alert.alert(
            "Account Required",
            "Please create an account or sign in to add recipes.",
            [
              {
                text: "Create Account",
                onPress: () => router.replace("/account"),
              },
              {
                text: "Go Back",
                style: "cancel",
                onPress: () => router.replace("/"),
              },
            ],
          );
          return;
        }

        // Check recipe limit for free accounts (authenticated users)
        const allRecipes = await RecipeDatabase.getAllRecipes();
        if (allRecipes.length >= FREE_ACCOUNT_RECIPE_LIMIT) {
          // Redirect to upgrade screen - they've hit the free account limit
          Alert.alert(
            "Recipe Limit Reached",
            `Free accounts can save up to ${FREE_ACCOUNT_RECIPE_LIMIT} recipes. Upgrade to a paid subscription for unlimited recipes!`,
            [
              {
                text: "Upgrade",
                onPress: () => router.replace("/upgrade"),
              },
              {
                text: "Go Back",
                style: "cancel",
                onPress: () => router.replace("/"),
              },
            ],
          );
        }
      }
      checkAccess();
    }, [user]),
  );

  const handleTestRecipeSourceChange = (text: string) => {
    // Production build: console.log removed
    setTestRecipeSource(text);
  };

  const handleWebPageOption = () => {
    // Production build: console.log removed
    // Open the URL modal with an empty URL - the modal should handle URL input
    setProcessedUrl("");
    setShowUrlModal(true);
  };

  const handleOCROption = () => {
    Alert.alert(
      "OCR Feature",
      "OCR scanning will be implemented soon. This will allow you to scan images and extract text from recipes.",
      [{ text: "OK" }],
    );
  };

  const handleManualOption = () => {
    setEditingRecipe(null);
    setRecipeForm(true);
  };

  const closeModal = () => {
    // Production build: console.log removed
    setShowUrlModal(false);
  };

  const closeManualForm = () => {
    setRecipeForm(false);
    setEditingRecipe(null);
  };

  const handleRecipeFormSave = (recipe: Recipe) => {
    // Save logic here (call your DB/service)
    setRecipeForm(false);
    setEditingRecipe(null);
    // Navigate to recipes tab
    router.push("/(tabs)/recipes");
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    // Store the recipe to view and navigate to recipes tab
    // The recipes screen will detect this and open the viewer
    router.push({
      pathname: "/(tabs)/recipes",
      params: { recipeId: recipe.id?.toString() },
    });
  };

  const QuickActionCard = ({
    icon,
    title,
    subtitle,
    onPress,
    theme = "primary",
  }: {
    icon: IconDefinition;
    title: string;
    subtitle: string;
    onPress: () => void;
    theme?: "primary" | "secondary";
  }) => (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.textInverse, radius: 150 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        styles.quickActionCard,
        {
          backgroundColor: theme === "primary" ? colors.primary : colors.accent,
          borderRadius: radius.md,
          opacity: pressed ? 0.8 : 1,
          transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        },
      ]}
    >
      <FontAwesomeIcon
        icon={icon}
        size="3x"
        color={colors.textInverse}
        style={styles.quickActionIcon}
      />
      <Text style={[styles.quickActionTitle, { color: colors.textInverse }]}>
        {title}
      </Text>
      <Text style={[styles.quickActionSubtitle, { color: colors.textInverse }]}>
        {subtitle}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.mainContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
              What&apos;s cooking today?
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.textLight }]}>
              Choose how you&apos;d like to add a new recipe
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              icon={faEgg}
              title="Add Recipe"
              subtitle="From website URL"
              onPress={handleWebPageOption}
              theme="primary"
            />
            <QuickActionCard
              icon={faCarrot}
              title="Scan Recipe"
              subtitle="OCR from image"
              onPress={handleOCROption}
              theme="secondary"
            />
            <QuickActionCard
              icon={faPenToSquare}
              title="Manual Entry"
              subtitle="Type recipe details"
              onPress={handleManualOption}
              theme="primary"
            />
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            💡 Tips
          </Text>
          <View
            style={[
              styles.tipCard,
              { backgroundColor: colors.surface, borderRadius: radius.md },
            ]}
          >
            <FontAwesomeIcon icon={faLightbulb} size="lg" color={colors.accent} />
            <Text style={[styles.tipText, { color: colors.textLight }]}>
              Try popular recipe sites like AllRecipes, Food Network, or your
              favorite food blog!
            </Text>
          </View>
        </View>
      </ScrollView>

      <UrlActionModal
        visible={showUrlModal}
        url={processedUrl}
        onClose={closeModal}
        onRecipeSelect={handleRecipeSelect}
      />

      {showRecipeForm && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            backgroundColor: "#faf4eb",
          }}
        >
          <RecipeForm
            initialRecipe={editingRecipe}
            onSave={handleRecipeFormSave}
            onCancel={closeManualForm}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  titleContainer: {
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  screenSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: "center",
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    gap: 20,
  },
  quickActionCard: {
    padding: 32,
    alignItems: "center",
    gap: 16,
    minHeight: 180,
    justifyContent: "center",
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.9,
  },
  tipsSection: {
    marginBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
