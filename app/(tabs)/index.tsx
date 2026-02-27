import { useAuth } from "@/contexts/AuthContext";
import { useColors, useRadius } from "@/contexts/ThemeContext";
import { Recipe } from "@/lib/supabase";
import { DemoStorage } from "@/services/demoStorage";
import { FavoritesService } from "@/services/FavoritesService";
import { RecipeDatabase } from "@/services/recipeDatabase";
import { DemoFavorites } from "@/utils/demoFavorites";
import { formatTimeAgo } from "@/utils/timeFormatter";
import {
  faBook,
  faCarrot,
  faChevronRight,
  faClock,
  faMagnifyingGlass,
  faStar,
  faUser,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import FontAwesomeIcon from "@/components/FontAwesomeIcon";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Recent Recipes List Component
function RecentRecipesList({ colors, radius }: { colors: any; radius: any }) {
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    async function loadRecent() {
      try {
        // Get recent recipes from last 7 days, limit to 3 items
        const recipes = await RecipeDatabase.getRecentRecipes(7, 3);
        setRecentRecipes(recipes);
      } catch (error) {
        console.error("Error loading recent recipes:", error);
      }
    }
    loadRecent();
  }, []);

  if (recentRecipes.length === 0) return null;

  return (
    <View style={styles.recentList}>
      {recentRecipes.map((recipe, index) => (
        <Pressable
          key={recipe.id || index}
          style={({ pressed }) => [
            styles.recentRecipeCard,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => router.push("/(tabs)/recipes")}
        >
          {recipe.image_url ? (
            <Image
              source={{ uri: recipe.image_url }}
              style={[styles.recentRecipeImage, { borderRadius: radius.sm }]}
            />
          ) : (
            <View
              style={[
                styles.recentRecipeImagePlaceholder,
                {
                  backgroundColor: colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <FontAwesomeIcon
                icon={faCarrot}
                size={20}
                color={colors.textLight}
              />
            </View>
          )}
          <View style={styles.recentRecipeInfo}>
            <Text
              style={[styles.recentRecipeTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {recipe.title}
            </Text>
            {recipe.cuisine_type && (
              <Text
                style={[
                  styles.recentRecipeCuisine,
                  { color: colors.textSecondary },
                ]}
              >
                {recipe.cuisine_type}
              </Text>
            )}
            {recipe.created_at && (
              <Text
                style={[styles.recentRecipeTime, { color: colors.textLight }]}
              >
                Added {formatTimeAgo(recipe.created_at)}
              </Text>
            )}
          </View>
          <FontAwesomeIcon
            icon={faChevronRight}
            size={20}
            color={colors.textLight}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function Index() {
  const [recipeCount, setRecipeCount] = useState<number>(0);
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [recentCount, setRecentCount] = useState<number>(0);
  const [lastRecipeTime, setLastRecipeTime] = useState<string>("");
  const [categoryRecipes, setCategoryRecipes] = useState<{
    [key: string]: Recipe[];
  }>({});
  const [isGuest, setIsGuest] = useState<boolean>(false);

  const colors = useColors();
  const radius = useRadius();

  // Use auth context instead of local state
  const { user } = useAuth();

  // Prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);
  const demoDataInitialized = useRef(false);

  // Check if user is guest
  useEffect(() => {
    // Prevent category fetches until auth user exists
    if (!user?.id) return;

    const loadCategorySections = async () => {
      const AuthService = (await import("../../services/AuthService")).default;
      const guestStatus = await AuthService.isCurrentUserGuest();
      setIsGuest(guestStatus);
    };

    async function checkGuestStatus() {
      const AuthService = (await import("../../services/AuthService")).default;
      const guestStatus = await AuthService.isCurrentUserGuest();
      setIsGuest(guestStatus);
    }
    checkGuestStatus();
    loadCategorySections();
  }, [user, user?.id]);

  // Memoize categories to prevent unnecessary re-renders
  const categories = useMemo(
    () => [
      { key: "italian", name: "Italian", emoji: "🍝" },
      { key: "mexican", name: "Mexican", emoji: "🌮" },
      { key: "asian", name: "Asian", emoji: "🥢" },
      { key: "american", name: "American", emoji: "🍔" },
      { key: "mediterranean", name: "Mediterranean", emoji: "🫒" },
      { key: "indian", name: "Indian", emoji: "🍛" },
    ],
    [],
  );

  // Load recipe count on component mount and when URL modal closes
  const loadRecipeCount = useCallback(async () => {
    try {
      const recipes = await RecipeDatabase.getAllRecipes();
      setRecipeCount(recipes.length);
    } catch (error) {
      console.error("Error loading recipe count:", error);
    }
  }, []);

  const loadFavoriteCount = useCallback(async () => {
    try {
      const favorites = await FavoritesService.getAllFavorites();
      setFavoriteCount(favorites.length);
    } catch (error) {
      console.error("Error loading favorite count:", error);
    }
  }, []);

  const loadRecentCount = useCallback(async () => {
    try {
      // Count recent recipes from last 7 days
      const recent = await RecipeDatabase.getRecentRecipes(7, 50); // Get up to 50 for counting
      setRecentCount(recent.length);
    } catch (error) {
      console.error("Error loading recent count:", error);
    }
  }, []);

  const loadLastRecipeTime = useCallback(async () => {
    try {
      const mostRecent = await RecipeDatabase.getMostRecentRecipe();
      if (mostRecent && mostRecent.created_at) {
        const timeAgo = formatTimeAgo(mostRecent.created_at);
        setLastRecipeTime(timeAgo);
      } else {
        setLastRecipeTime("");
      }
    } catch (error) {
      console.error("Error loading last recipe time:", error);
      setLastRecipeTime("");
    }
  }, []);

  const loadCategoryRecipes = useCallback(async () => {
    try {
      const categoryData: { [key: string]: Recipe[] } = {};

      for (const category of categories) {
        const recipes = await RecipeDatabase.getRecipesByCategory(
          category.key,
          3,
        );
        if (recipes.length > 0) {
          categoryData[category.key] = recipes;
        }
      }

      setCategoryRecipes(categoryData);
    } catch (error) {
      console.error("Error loading category recipes:", error);
    }
  }, [categories]);

  // Initialize demo data only once
  const initializeDemoData = useCallback(async () => {
    if (demoDataInitialized.current) {
      return;
    }

    try {
      // Production build: console.log removed
      demoDataInitialized.current = true;

      // Check what data already exists
      const existingRecipes = await RecipeDatabase.getAllRecipes();
      const existingFavorites = await FavoritesService.getFavoriteRecipes();

      // Only create demo recipes if none exist and user is not a guest with real data
      if (
        existingRecipes.length === 0 &&
        (!isGuest || existingFavorites.length === 0)
      ) {
        await DemoStorage.createDemoRecipesWithCategories();
      }

      // Only create demo favorites if none exist
      if (existingFavorites.length === 0) {
        await DemoFavorites.createDemoFavoritesIfNeeded();
      }

      // Production build: console.log removed
    } catch (error) {
      console.error("Error initializing demo data:", error);
      demoDataInitialized.current = false; // Reset on error
    }
  }, [isGuest]);

  // Single function to load all data and prevent simultaneous calls
  const loadAllData = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;

    try {
      // For guest users, don't initialize demo data automatically
      // Only initialize if there are truly no recipes
      if (!isGuest) {
        await initializeDemoData();
      } else {
        // For guest users, check if we have any data first
        const existingRecipes = await RecipeDatabase.getAllRecipes();
        if (existingRecipes.length === 0) {
          // Only initialize minimal demo data for first-time guests
          await initializeDemoData();
        }
      }

      // Load all the display data
      await Promise.all([
        loadRecipeCount(),
        loadFavoriteCount(),
        loadRecentCount(),
        loadLastRecipeTime(),
        loadCategoryRecipes(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [
    isGuest,
    initializeDemoData,
    loadRecipeCount,
    loadFavoriteCount,
    loadRecentCount,
    loadLastRecipeTime,
    loadCategoryRecipes,
  ]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh data when screen comes into focus, but don't re-initialize demo data
  useFocusEffect(
    useCallback(() => {
      // Only load display data, not demo initialization
      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;

      Promise.all([
        loadRecipeCount(),
        loadFavoriteCount(),
        loadRecentCount(),
        loadLastRecipeTime(),
        loadCategoryRecipes(),
      ]).finally(() => {
        isLoadingRef.current = false;
      });
    }, [
      loadRecipeCount,
      loadFavoriteCount,
      loadRecentCount,
      loadLastRecipeTime,
      loadCategoryRecipes,
    ]),
  );

  // Navigation handlers for stats cards
  const handleNavigateToRecipes = () => {
    // Clear any existing category filter by explicitly setting params to undefined
    router.push({
      pathname: "/(tabs)/recipes",
      params: { category: undefined },
    });
  };

  const handleNavigateToFavorites = () => {
    router.push("/(tabs)/favorites");
  };

  const handleNavigateToRecents = () => {
    router.push({
      pathname: "/(tabs)/recipes",
      params: { filterType: "recent" },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.mainContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* App Bar */}
        <View style={styles.appBar}>
          <Text style={[styles.appBarTitle, { color: colors.primary }]}>
            Velvet Ladle
          </Text>
          <Pressable
            style={[
              styles.profileButton,
              { backgroundColor: colors.primaryLight },
            ]}
            onPress={() => router.push("/account")}
          >
            <FontAwesomeIcon icon={faUser} size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
            Welcome back, {user?.name || "Chef"}! 👨‍🍳
          </Text>
          <Text style={[styles.welcomeSubtext, { color: colors.textLight }]}>
            Ready to explore and create amazing recipes today
          </Text>
        </View>

        {/* Search Bar */}
        <Pressable
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderRadius: radius.lg },
          ]}
          onPress={() => router.push("/(tabs)/recipes")}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            size={20}
            color={colors.textLight}
          />
          <Text style={[styles.searchPlaceholder, { color: colors.textLight }]}>
            Search recipes, ingredients, cuisines...
          </Text>
        </Pressable>

        {/* Navigation Chips */}
        <View style={styles.chipsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.full,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleNavigateToRecipes}
          >
            <FontAwesomeIcon icon={faBook} size={20} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Recipes ({recipeCount}
              {isGuest ? "/10" : ""})
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.full,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleNavigateToFavorites}
          >
            <FontAwesomeIcon icon={faStar} size={24} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Favorites ({favoriteCount})
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.full,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleNavigateToRecents}
          >
            <FontAwesomeIcon icon={faClock} size={20} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              Recents ({recentCount})
            </Text>
          </Pressable>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredSection}>
          <Pressable
            style={({ pressed }) => [
              styles.featuredCard,
              {
                backgroundColor: colors.accent,
                borderRadius: radius.lg,
                opacity: pressed ? 0.9 : 1,
                transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
              },
            ]}
            onPress={() => router.push("/(tabs)/add")}
          >
            <View style={styles.featuredContent}>
              <Text
                style={[styles.featuredTitle, { color: colors.textInverse }]}
              >
                {recipeCount > 0 && lastRecipeTime
                  ? "Continue where you left off"
                  : "Start your culinary journey"}
              </Text>
              <Text
                style={[styles.featuredSubtitle, { color: colors.textInverse }]}
              >
                {recipeCount > 0 && lastRecipeTime
                  ? `Last recipe added ${lastRecipeTime}`
                  : "Add your first recipe from web or image"}
              </Text>
              {isGuest && recipeCount > 0 && (
                <Text
                  style={[
                    styles.guestLimitText,
                    { color: colors.textInverse, opacity: 0.8 },
                  ]}
                >
                  Guest: {recipeCount}/10 recipes • Upgrade for unlimited
                </Text>
              )}
            </View>
            <FontAwesomeIcon
              icon={faChevronRight}
              size={24}
              color={colors.textInverse}
            />
          </Pressable>
        </View>

        {/* Quick Categories */}
        {Object.keys(categoryRecipes).length > 0 && (
          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Quick Categories 🍽️
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContainer}
            >
              {categories
                .map((category) => {
                  const recipes = categoryRecipes[category.key];
                  if (!recipes || recipes.length === 0) return null;

                  return (
                    <Pressable
                      key={category.key}
                      style={({ pressed }) => [
                        styles.categoryCard,
                        {
                          backgroundColor: colors.surface,
                          borderRadius: radius.lg,
                          opacity: pressed ? 0.8 : 1,
                          transform: pressed
                            ? [{ scale: 0.95 }]
                            : [{ scale: 1 }],
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/recipes",
                          params: { category: category.key },
                        })
                      }
                    >
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryEmoji}>
                          {category.emoji}
                        </Text>
                        <Text
                          style={[
                            styles.categoryTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {category.name}
                        </Text>
                        <Text
                          style={[
                            styles.categoryCount,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {recipes.length} recipe
                          {recipes.length !== 1 ? "s" : ""}
                        </Text>
                      </View>

                      <View style={styles.categoryRecipes}>
                        {recipes.slice(0, 3).map((recipe, index) => (
                          <View
                            key={recipe.id || index}
                            style={styles.categoryRecipeItem}
                          >
                            {recipe.image_url ? (
                              <Image
                                source={{ uri: recipe.image_url }}
                                style={[
                                  styles.categoryRecipeImage,
                                  { borderRadius: radius.sm },
                                ]}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.categoryRecipeImagePlaceholder,
                                  {
                                    backgroundColor: colors.border,
                                    borderRadius: radius.sm,
                                  },
                                ]}
                              >
                                <FontAwesomeIcon
                                  icon={faUtensils}
                                  size={12}
                                  color={colors.textLight}
                                />
                              </View>
                            )}
                            <Text
                              style={[
                                styles.categoryRecipeTitle,
                                { color: colors.textPrimary },
                              ]}
                              numberOfLines={2}
                            >
                              {recipe.title}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={styles.categoryFooter}>
                        <Text
                          style={[
                            styles.viewMoreText,
                            { color: colors.primary },
                          ]}
                        >
                          View All →
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
                .filter(Boolean)}
            </ScrollView>
          </View>
        )}

        {/* Recent Recipes List */}
        {recentCount > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Recent Recipes 📖
            </Text>
            <RecentRecipesList colors={colors} radius={radius} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf4eb",
  },

  // Main app styles
  mainContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80,
  },

  // App Bar
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 8,
  },
  appBarTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Welcome Section
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    opacity: 0.8,
  },

  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 15,
    flex: 1,
  },

  // Navigation Chips
  chipsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Featured Card
  featuredSection: {
    marginBottom: 32,
  },
  featuredCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  guestLimitText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },

  // Quick Categories styles
  categoriesSection: {
    marginBottom: 32,
  },
  categoriesScrollContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryCard: {
    width: 200,
    padding: 16,
    marginRight: 16,
  },
  categoryHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
  },
  categoryRecipes: {
    gap: 8,
    marginBottom: 12,
  },
  categoryRecipeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryRecipeImage: {
    width: 24,
    height: 24,
  },
  categoryRecipeImagePlaceholder: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryRecipeTitle: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  categoryFooter: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Recent Recipes List
  recentSection: {
    marginBottom: 40,
    paddingBottom: 20,
  },
  recentList: {
    gap: 12,
  },
  recentRecipeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  recentRecipeImage: {
    width: 60,
    height: 60,
  },
  recentRecipeImagePlaceholder: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  recentRecipeInfo: {
    flex: 1,
    gap: 4,
  },
  recentRecipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  recentRecipeCuisine: {
    fontSize: 13,
    textTransform: "capitalize",
  },
  recentRecipeTime: {
    fontSize: 12,
  },
});
