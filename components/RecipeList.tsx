import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import {
	useColors,
	useElevation,
	useRadius,
	useSpacing,
	useTypography,
} from "../contexts/ThemeContext";
import { Recipe } from "../lib/supabase";
import { FavoritesService } from "../services/FavoritesService";
import { ImageStorageService } from "../services/ImageStorageService";
import { RecipeDatabase } from "../services/recipeDatabase";
import { RecipeDeletionService } from "../services/RecipeDeletionService";
import { RecipeExtractor } from "../services/recipeExtractor";
import { RecipeFilterService } from "../services/RecipeFilterService";
import { RecipeValidation } from "../utils/recipeValidation";
import Button from "./buttons";
import RecipeSearchFilter from "./RecipeSearchFilter";
import SmartImage from "./SmartImage";

type Props = {
  onRecipeSelect?: (recipe: Recipe) => void;
  initialCategoryFilter?: string;
  initialFilterType?: string;
};

export default function RecipeList({
  onRecipeSelect,
  initialCategoryFilter,
  initialFilterType,
}: Props) {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(
    !!initialCategoryFilter || !!initialFilterType,
  );
  const [favoriteStatuses, setFavoriteStatuses] = useState<{
    [key: number]: boolean;
  }>({});

  const { user } = useAuth();
  const router = useRouter();
  const isGuest = user?.id === "guest_user";

  // Use ref to prevent multiple simultaneous loads
  const isLoadingRef = useRef(false);

  // Stabilize the initial category filter to prevent unnecessary re-renders
  const stableCategoryFilter = useRef(initialCategoryFilter);

  // Watch for changes to initialCategoryFilter and update the filter
  useEffect(() => {
    if (stableCategoryFilter.current !== initialCategoryFilter) {
      stableCategoryFilter.current = initialCategoryFilter;

      // Apply the new category filter to the existing recipes
      if (initialCategoryFilter) {
        const filtered = RecipeFilterService.filterRecipes(
          allRecipes,
          "",
          [],
          [initialCategoryFilter],
        );
        setFilteredRecipes(filtered);
        setShowFilters(true);
      } else {
        setFilteredRecipes(allRecipes);
        setShowFilters(false);
      }
    }
  }, [initialCategoryFilter, allRecipes]);

  // Use theme
  const colors = useColors();
  const spacing = useSpacing();
  const radius = useRadius();
  const typography = useTypography();
  const elevation = useElevation();

  const loadRecipes = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      // Production build: console.log removed
      return;
    }

    isLoadingRef.current = true;

    try {
      // Initialize image storage on first load
      await ImageStorageService.initializeStorage();

      const recipes = await RecipeDatabase.getAllRecipes();

      // Clean and validate recipes
      const cleanRecipes = RecipeValidation.cleanRecipeList(recipes);

      setAllRecipes(cleanRecipes);

      // Apply filters if provided
      let recipesToShow = cleanRecipes;

      // Apply filterType (e.g., 'recent')
      if (initialFilterType === "recent") {
        // Filter to recent recipes (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        recipesToShow = cleanRecipes
          .filter((recipe) => {
            if (!recipe.created_at) return false;
            const recipeDate = new Date(recipe.created_at);
            return recipeDate >= sevenDaysAgo;
          })
          .sort(
            (a, b) =>
              new Date(b.created_at || "").getTime() -
              new Date(a.created_at || "").getTime(),
          );
      }

      // Apply category filter if provided (after filterType)
      if (stableCategoryFilter.current) {
        recipesToShow = RecipeFilterService.filterRecipes(
          recipesToShow,
          "",
          [],
          [stableCategoryFilter.current],
        );
      }

      setFilteredRecipes(recipesToShow);

      // Load favorite statuses
      const statuses: { [key: number]: boolean } = {};
      for (const recipe of cleanRecipes) {
        if (recipe.id) {
          statuses[recipe.id] = await FavoritesService.isRecipeFavorited(
            recipe.id,
          );
        }
      }
      setFavoriteStatuses(statuses);

      // Preload images in the background for better UX
      if (cleanRecipes.length > 0) {
        // Don't await this - let it run in background
        ImageStorageService.preloadImages(cleanRecipes).catch((error) => {
          console.warn("⚠️ Image preloading failed:", error);
        });
      }
    } catch (error) {
      console.error("Error loading recipes:", error);
      // Simple error handling without Alert dependency issues
      setLoading(false);
      setRefreshing(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, []); // Remove initialCategoryFilter dependency completely

  // Helper to detect demo recipes
  const isDemoRecipe = (recipe: Recipe) => {
    return recipe.web_address?.startsWith("https://example.com/");
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (!recipe.id) return;

    try {
      const isFavorited = favoriteStatuses[recipe.id] || false;

      if (isFavorited) {
        await FavoritesService.removeRecipeFromFavorites(recipe.id);
        setFavoriteStatuses((prev) => ({ ...prev, [recipe.id!]: false }));

        // Web-compatible success message
        // Production build: console.log removed
      } else {
        await FavoritesService.addRecipeToFavorites(recipe);
        setFavoriteStatuses((prev) => ({ ...prev, [recipe.id!]: true }));

        // Web-compatible success message
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleSearch = useCallback(
    (
      searchTerm: string,
      selectedIngredients: string[],
      selectedCuisines: string[],
    ) => {
      // Start with all recipes, then apply initial filterType if present
      let baseRecipes = allRecipes;

      // Apply filterType (e.g., 'recent') first if present
      if (initialFilterType === "recent") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        baseRecipes = allRecipes
          .filter((recipe) => {
            if (!recipe.created_at) return false;
            const recipeDate = new Date(recipe.created_at);
            return recipeDate >= sevenDaysAgo;
          })
          .sort(
            (a, b) =>
              new Date(b.created_at || "").getTime() -
              new Date(a.created_at || "").getTime(),
          );
      }

      // Then apply search/filter on the base set
      const filtered = RecipeFilterService.filterRecipes(
        baseRecipes,
        searchTerm,
        selectedIngredients,
        selectedCuisines,
      );
      setFilteredRecipes(filtered);
    },
    [allRecipes, initialFilterType],
  );

  const handleClearSearch = useCallback(() => {
    // When clearing search, restore to the initial filtered state (if any)
    let recipesToShow = allRecipes;

    // Apply filterType (e.g., 'recent') if present
    if (initialFilterType === "recent") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      recipesToShow = allRecipes
        .filter((recipe) => {
          if (!recipe.created_at) return false;
          const recipeDate = new Date(recipe.created_at);
          return recipeDate >= sevenDaysAgo;
        })
        .sort(
          (a, b) =>
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime(),
        );
    }

    // Apply category filter if provided (after filterType)
    if (stableCategoryFilter.current) {
      recipesToShow = RecipeFilterService.filterRecipes(
        recipesToShow,
        "",
        [],
        [stableCategoryFilter.current],
      );
    }

    setFilteredRecipes(recipesToShow);
  }, [allRecipes, initialFilterType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    // Inline the refresh logic to avoid dependency issues
    if (isLoadingRef.current) {
      setRefreshing(false);
      return;
    }

    isLoadingRef.current = true;

    try {
      const recipes = await RecipeDatabase.getAllRecipes();
      const cleanRecipes = RecipeValidation.cleanRecipeList(recipes);
      setAllRecipes(cleanRecipes);

      // Apply current category filter if provided
      if (stableCategoryFilter.current) {
        const filtered = RecipeFilterService.filterRecipes(
          cleanRecipes,
          "",
          [],
          [stableCategoryFilter.current],
        );
        setFilteredRecipes(filtered);
      } else {
        setFilteredRecipes(cleanRecipes);
      }

      const statuses: { [key: number]: boolean } = {};
      for (const recipe of cleanRecipes) {
        if (recipe.id) {
          statuses[recipe.id] = await FavoritesService.isRecipeFavorited(
            recipe.id,
          );
        }
      }
      setFavoriteStatuses(statuses);
    } catch (error) {
      console.error("Error refreshing recipes:", error);
    } finally {
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, []);

  const handleDelete = useCallback(
    async (recipe: Recipe) => {
      await RecipeDeletionService.deleteRecipeWithConfirmation(
        recipe,
        handleRefresh,
      );
    },
    [handleRefresh],
  );

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]); // Use loadRecipes dependency properly

  // Separate useEffect for debug functions to avoid re-render loops
  useEffect(() => {
    // Only set debug functions if they don't already exist
    if (typeof window !== "undefined" && !(window as any).debugFixEmptyTitles) {
      // Production build: console.log removed

      // Make cleanup function available in browser console for debugging
      (window as any).debugFixEmptyTitles = async () => {
        try {
          // Production build: console.log removed
          const recipes = await RecipeDatabase.getAllRecipes();

          for (const recipe of recipes) {
            if (recipe.id && (!recipe.title || recipe.title.trim() === "")) {
              // Production build: console.log removed

              let newTitle = "(Untitled Recipe)";
              if (recipe.ingredients && recipe.ingredients.length > 0) {
                const firstIngredient = recipe.ingredients[0];
                if (firstIngredient) {
                  // Extract main ingredient name
                  const cleanIngredient = firstIngredient
                    .replace(/^\d+\.?\s*/, "") // Remove leading numbers
                    .replace(
                      /^[\d\s\/]+\s*(cups?|tbsp|tsp|lbs?|oz|grams?|ml|liters?)?\s*/i,
                      "",
                    ) // Remove measurements
                    .trim();
                  newTitle = `Recipe with ${cleanIngredient}`;
                }
              }

              await RecipeDatabase.updateRecipe(recipe.id, {
                ...recipe,
                title: newTitle,
              });

              // Production build: console.log removed
            }
          }

          // Production build: console.log removed
          // Use window.location.reload() only on web, manual refresh on mobile
          if (typeof window !== "undefined" && window.location) {
            window.location.reload();
          } else {
            // Production build: console.log removed
          }
        } catch (error) {
          console.error("❌ Cleanup failed:", error);
        }
      };

      // Add function to fix missing cuisine information
      (window as any).debugFixMissingCuisines = async () => {
        try {
          // Production build: console.log removed
          const recipes = await RecipeDatabase.getAllRecipes();
          let updatedCount = 0;

          for (const recipe of recipes) {
            if (
              recipe.id &&
              recipe.web_address &&
              (!recipe.cuisine_type || recipe.cuisine_type.trim() === "")
            ) {
              // Production build: console.log removed

              // Try to extract cuisine from title, description, or re-fetch from URL
              let extractedCuisine: string | undefined;

              // First try extracting from existing data
              const searchText = [recipe.title, recipe.description]
                .filter(Boolean)
                .join(" ");
              extractedCuisine =
                RecipeExtractor.extractCuisineFromText(searchText);

              // If we found a cuisine, update the recipe
              if (extractedCuisine) {
                await RecipeDatabase.updateRecipe(recipe.id, {
                  ...recipe,
                  cuisine_type: extractedCuisine,
                });

                // Production build: console.log removed
                updatedCount++;
              } else {
                // Production build: console.log removed
              }
            }
          }

          // Production build: console.log removed
          if (typeof window !== "undefined" && window.location) {
            window.location.reload();
          } else {
            // Production build: console.log removed
          }
        } catch (error) {
          console.error("❌ Cuisine cleanup failed:", error);
        }
      };

      // Add function to fix missing images
      (window as any).debugFixMissingImages = async () => {
        try {
          // Production build: console.log removed
          const recipes = await RecipeDatabase.getAllRecipes();
          let updatedCount = 0;

          for (const recipe of recipes) {
            if (
              recipe.id &&
              recipe.web_address &&
              (!recipe.image_url || recipe.image_url.trim() === "")
            ) {
              // Production build: console.log removed

              try {
                // Re-extract recipe data including images
                const extractedRecipe =
                  await RecipeExtractor.extractRecipeFromUrl(
                    recipe.web_address,
                  );

                if (
                  extractedRecipe &&
                  extractedRecipe.recipe &&
                  extractedRecipe.recipe.image_url
                ) {
                  await RecipeDatabase.updateRecipe(recipe.id, {
                    ...recipe,
                    image_url: extractedRecipe.recipe.image_url,
                  });

                  // Production build: console.log removed
                  updatedCount++;
                } else {
                  // Production build: console.log removed
                }
              } catch (error) {
                // Production build: console.log removed
              }
            }
          }

          // Production build: console.log removed
          if (typeof window !== "undefined" && window.location) {
            window.location.reload();
          } else {
            // Production build: console.log removed
          }
        } catch (error) {
          console.error("❌ Image cleanup failed:", error);
        }
      };
    } // Close the if statement for debug functions check
  }, []); // Empty dependency array - run only once on mount

  const availableIngredients = useMemo(
    () => RecipeFilterService.extractIngredients(allRecipes),
    [allRecipes],
  );
  const availableCuisines = useMemo(
    () => RecipeFilterService.extractCuisines(allRecipes),
    [allRecipes],
  );

  const renderRecipe = ({ item: recipe }: { item: Recipe }) => (
    <TouchableOpacity
      style={[
        styles.recipeCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginHorizontal: spacing.lg,
          marginVertical: spacing.sm,
          ...elevation.md,
        },
      ]}
      onPress={() => onRecipeSelect?.(recipe)}
    >
      <View style={styles.recipeHeader}>
        <Text
          style={[
            styles.recipeTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              flex: 1,
            },
          ]}
        >
          {RecipeValidation.getSafeTitle(recipe)}
        </Text>

        {isDemoRecipe(recipe) && (
          <View
            style={{
              backgroundColor: colors.info + "20",
              borderColor: colors.info,
              borderWidth: 1,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: radius.sm,
              marginLeft: spacing.xs,
              marginRight: spacing.sm,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: colors.info,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              DEMO
            </Text>
          </View>
        )}

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Prevent card press
              handleToggleFavorite(recipe);
            }}
            style={[styles.actionButton, { marginRight: spacing.sm }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={{
                fontSize: 18,
                color: favoriteStatuses[recipe.id!]
                  ? colors.accent
                  : colors.textLight,
              }}
            >
              {favoriteStatuses[recipe.id!] ? "⭐" : "☆"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Prevent card press
              handleDelete(recipe);
            }}
            style={[
              styles.actionButton,
              styles.deleteButton,
              {
                backgroundColor: colors.error + "20", // Add light background
                borderRadius: radius.sm,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={{
                color: colors.error,
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              🗑️
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recipe Image */}
      {recipe.image_url && recipe.id && (
        <SmartImage
          imageUrl={recipe.image_url}
          recipeId={recipe.id}
          style={[
            styles.recipeImage,
            {
              width: "100%",
              height: 200,
              borderRadius: radius.md,
              marginTop: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
          resizeMode="cover"
          fallbackIcon="🍽️"
          onError={(error: any) => {
            // Production build: console.log removed
          }}
        />
      )}

      {recipe.description && (
        <Text
          style={[
            styles.recipeDescription,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSize.sm,
              marginTop: spacing.xs,
              marginBottom: spacing.sm,
            },
          ]}
          numberOfLines={2}
        >
          {recipe.description}
        </Text>
      )}

      <View style={styles.recipeDetails}>
        {recipe.cuisine_type && (
          <View
            style={[
              styles.cuisineTag,
              {
                backgroundColor: colors.accent,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.cuisineText,
                {
                  color: colors.textInverse,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                },
              ]}
            >
              {recipe.cuisine_type}
            </Text>
          </View>
        )}

        {recipe.prep_time_minutes && (
          <Text
            style={[
              styles.timeText,
              {
                color: colors.textLight,
                fontSize: typography.fontSize.xs,
              },
            ]}
          >
            ⏰ {recipe.prep_time_minutes}
          </Text>
        )}
      </View>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <Text
          style={[
            styles.ingredientCount,
            {
              color: colors.textLight,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.sm,
            },
          ]}
        >
          🥕 {recipe.ingredients.length} ingredients
        </Text>
      )}

      {/* Nutritional Summary */}
      {recipe.nutritional_info && (
        <View style={[styles.nutritionSummary, { marginTop: spacing.sm }]}>
          {recipe.nutritional_info.calories && (
            <View
              style={[
                styles.nutritionBadge,
                {
                  backgroundColor: colors.accent + "20",
                  marginRight: spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  styles.nutritionBadgeText,
                  { color: colors.accent, fontSize: typography.fontSize.xs },
                ]}
              >
                🔥 {recipe.nutritional_info.calories} cal
              </Text>
            </View>
          )}
          {recipe.nutritional_info.protein && (
            <View
              style={[
                styles.nutritionBadge,
                {
                  backgroundColor: colors.secondary + "20",
                  marginRight: spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  styles.nutritionBadgeText,
                  { color: colors.secondary, fontSize: typography.fontSize.xs },
                ]}
              >
                🥩 {recipe.nutritional_info.protein}
              </Text>
            </View>
          )}
          {recipe.nutritional_info.carbs && (
            <View
              style={[
                styles.nutritionBadge,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Text
                style={[
                  styles.nutritionBadgeText,
                  { color: colors.primary, fontSize: typography.fontSize.xs },
                ]}
              >
                🍞 {recipe.nutritional_info.carbs}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading recipes...
        </Text>
      </View>
    );
  }

  if (filteredRecipes.length === 0 && !showFilters) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text
          style={[
            styles.emptyText,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSize.lg,
              textAlign: "center",
              marginBottom: spacing.xl,
            },
          ]}
        >
          No recipes found.
        </Text>
        <Button
          label="Refresh"
          theme="outline"
          onPress={handleRefresh}
          icon="refresh"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Guest Signup CTA Banner */}
      {isGuest && (
        <View
          style={[
            styles.guestBanner,
            {
              backgroundColor: colors.secondary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.guestBannerText,
              {
                color: colors.primary,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing.xs,
              },
            ]}
          >
            👋 Browsing Demo Recipes
          </Text>
          <Text
            style={[
              styles.guestBannerSubtext,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Sign up to add your own recipes and sync across devices!
          </Text>
          <Button
            label="Create Free Account"
            theme="primary"
            onPress={() => router.push("/account")}
            icon="user-plus"
          />
        </View>
      )}

      {/* Filter Toggle Button */}
      <View
        style={[
          styles.header,
          { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              flex: 1,
            },
          ]}
        >
          {isGuest ? "Demo Recipes" : "My Recipes"} ({filteredRecipes.length})
        </Text>

        <Button
          label={showFilters ? "Hide Filters" : "Show Filters"}
          theme={showFilters ? "primary" : "outline"}
          onPress={() => setShowFilters(!showFilters)}
          icon={showFilters ? "filter" : "filter"}
        />
      </View>

      {/* Search and Filter Component */}
      {showFilters && (
        <RecipeSearchFilter
          onSearch={handleSearch}
          onClear={handleClearSearch}
          availableIngredients={availableIngredients}
          availableCuisines={availableCuisines}
          initialCuisines={
            stableCategoryFilter.current ? [stableCategoryFilter.current] : []
          }
        />
      )}

      {/* Results Summary */}
      {showFilters && filteredRecipes.length !== allRecipes.length && (
        <View
          style={[
            styles.resultsHeader,
            {
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surface,
              marginHorizontal: spacing.lg,
              borderRadius: radius.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.resultsText,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
              },
            ]}
          >
            Showing {filteredRecipes.length} of {allRecipes.length} recipes
          </Text>
        </View>
      )}

      {filteredRecipes.length === 0 ? (
        <View style={[styles.centerContainer, { flex: 1 }]}>
          <Text
            style={[
              styles.noResultsText,
              {
                color: colors.textSecondary,
                fontSize: typography.fontSize.lg,
                textAlign: "center",
                marginBottom: spacing.lg,
              },
            ]}
          >
            No recipes match your filters
          </Text>
          <Button
            label="Clear Filters"
            theme="outline"
            onPress={handleClearSearch}
            icon="times"
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {filteredRecipes.map((recipe, index) => (
            <View key={recipe.id?.toString() || `${recipe.title}-${index}`}>
              {renderRecipe({ item: recipe })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  guestBanner: {
    // Dynamic styles applied inline
  },
  guestBannerText: {
    // Dynamic styles applied inline
  },
  guestBannerSubtext: {
    // Dynamic styles applied inline
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    // Dynamic styles applied inline
  },
  resultsHeader: {
    // Dynamic styles applied inline
  },
  resultsText: {
    // Dynamic styles applied inline
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyText: {
    // Dynamic styles applied inline
  },
  noResultsText: {
    // Dynamic styles applied inline
  },
  recipeCard: {
    // Dynamic styles applied inline
  },
  recipeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    minWidth: 32,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    // Additional styling for delete button
  },
  recipeTitle: {
    // Dynamic styles applied inline
  },
  recipeImage: {
    // Dynamic styles applied inline
  },
  recipeDescription: {
    // Dynamic styles applied inline
  },
  recipeDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cuisineTag: {
    // Dynamic styles applied inline
  },
  cuisineText: {
    // Dynamic styles applied inline
  },
  timeText: {
    // Dynamic styles applied inline
  },
  ingredientCount: {
    // Dynamic styles applied inline
  },
  nutritionSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  nutritionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  nutritionBadgeText: {
    fontWeight: "600",
  },
});
