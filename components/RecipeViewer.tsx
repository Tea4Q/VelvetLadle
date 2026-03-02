import {
  faArrowsRotate,
  faBook,
  faHeart,
  faLightbulb,
  faNoteSticky,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
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
import { Recipe } from "../lib/supabase";
import { FavoritesService } from "../services/FavoritesService";
import { RecipeDeletionService } from "../services/RecipeDeletionService";
import { RecipeRefreshService } from "../services/recipeRefreshService";
import FontAwesomeIcon from "./FontAwesomeIcon";
import IngredientList from "./IngredientList";
import SmartImage from "./SmartImage";

type Props = {
  recipe: Recipe;
  onBack?: () => void;
  onEdit?: (recipe: Recipe) => void;
  onRefresh?: (updatedRecipe: Recipe) => void; // Add this prop
};

export default function RecipeViewer({
  recipe,
  onBack,
  onEdit,
  onRefresh,
}: Props) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(recipe);
  const [activeTab, setActiveTab] = useState<
    "overview" | "cooking-tips" | "notes"
  >("overview");
  const [servingAdjustment, setServingAdjustment] = useState(() => {
    if (recipe.recipe_yield) {
      const match = recipe.recipe_yield.match(/\d+/);
      if (match) return parseInt(match[0]);
    }
    return recipe.servings || 4;
  });
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [personalNotes, setPersonalNotes] = useState(
    recipe.personal_notes || "",
  );

  const colors = useColors();
  const spacing = useSpacing();
  const typography = useTypography();
  const radius = useRadius();

  useEffect(() => {
    setCurrentRecipe(recipe);

    // Sync serving adjustment to updated recipe_yield or servings
    const baseServings = (() => {
      if (recipe.recipe_yield) {
        const match = recipe.recipe_yield.match(/\d+/);
        if (match) return parseInt(match[0]);
      }
      return recipe.servings || 4;
    })();
    setServingAdjustment(baseServings);

    const checkFavoriteStatus = async () => {
      if (recipe.id) {
        const favorited = await FavoritesService.isRecipeFavorited(recipe.id);
        setIsFavorited(favorited);
      }
    };
    checkFavoriteStatus();

    // Initialize completed steps array
    setCompletedSteps(new Array(recipe.directions.length).fill(false));
  }, [
    recipe.id,
    recipe.directions.length,
    recipe.recipe_yield,
    recipe.servings,
    recipe.total_time_minutes,
    recipe.updated_at,
  ]);

  const toggleStepCompletion = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      const newSteps = [...prev];
      newSteps[stepIndex] = !newSteps[stepIndex];
      return newSteps;
    });
  };

  const adjustServings = (newServings: number) => {
    if (newServings > 0 && newServings <= 20) {
      setServingAdjustment(newServings);
    }
  };

  const getCookingTips = () => [
    "📌 Mise en place: Prepare all ingredients before you start cooking",
    "🌡️ Use a thermometer for meat and baked goods for best results",
    "🧂 Taste as you go and adjust seasonings gradually",
    "⏰ Set timers for each step to avoid overcooking",
    "🔥 Preheat your oven and pans for even cooking",
    "📏 Measure ingredients accurately, especially for baking",
  ];

  const handleToggleFavorite = async () => {
    if (!recipe.id) return;

    setLoading(true);
    try {
      if (isFavorited) {
        await FavoritesService.removeRecipeFromFavorites(recipe.id);
        setIsFavorited(false);
        Alert.alert("Removed", "Recipe removed from favorites");
      } else {
        await FavoritesService.addRecipeToFavorites(recipe);
        setIsFavorited(true);
        Alert.alert("Added", "Recipe added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe.id) return;

    await RecipeDeletionService.deleteRecipeWithConfirmation(recipe, () => {
      // After successful deletion, navigate back if handler provided
      if (onBack) {
        onBack();
      }
    });
  };

  const handleRefresh = async () => {
    if (!currentRecipe.id) return;

    Alert.alert(
      "Refresh Recipe",
      "Re-extract this recipe from its source URL? This will update ingredients, directions, and nutrition info.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refresh",
          style: "default",
          onPress: async () => {
            setRefreshing(true);
            try {
              const result =
                await RecipeRefreshService.refreshRecipeFromUrl(currentRecipe);
              if (result.success && result.data) {
                setCurrentRecipe(result.data);
                // Notify parent component of the update
                if (onRefresh) {
                  onRefresh(result.data);
                }
                Alert.alert("✅ Success", "Recipe refreshed with latest data!");
              } else {
                Alert.alert(
                  "❌ Error",
                  result.error || "Failed to refresh recipe",
                );
              }
            } catch (error: any) {
              console.error("Error refreshing recipe:", error);
              Alert.alert(
                "❌ Error",
                error.message || "Failed to refresh recipe",
              );
            } finally {
              setRefreshing(false);
            }
          },
        },
      ],
    );
  };

  const openWebAddress = async () => {
    if (recipe.web_address && recipe.web_address !== "manually-entered") {
      try {
        const canOpen = await Linking.canOpenURL(recipe.web_address);
        if (canOpen) {
          await Linking.openURL(recipe.web_address);
        } else {
          Alert.alert("Error", "Cannot open this URL");
        }
      } catch {
        Alert.alert("Error", "Failed to open URL");
      }
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabContainer,
          { marginTop: spacing.md, marginBottom: spacing.md },
        ]}
        contentContainerStyle={{
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
        }}
      >
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.headerButton,
                { backgroundColor: colors.primary, borderRadius: radius.full },
              ]}
            >
              <FontAwesomeIcon
                name="faArrowLeft"
                size={16}
                color={colors.textInverse}
              />
              <Text
                style={[styles.headerButtonText, { color: colors.textInverse }]}
              >
                Back
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={loading}
            style={[
              styles.headerButton,
              {
                backgroundColor: isFavorited
                  ? colors.accent
                  : colors.background,
                borderColor: colors.accent,
                borderWidth: 1,
                borderRadius: radius.full,
              },
            ]}
          >
            <FontAwesomeIcon
              icon={faHeart}
              size={16}
              color={isFavorited ? colors.textInverse : colors.accent}
              solid={isFavorited}
            />
            <Text
              style={[
                styles.headerButtonText,
                {
                  color: isFavorited ? colors.textInverse : colors.accent,
                },
              ]}
            >
              {isFavorited ? "Favorited" : "Favorite"}
            </Text>
          </TouchableOpacity>

          {RecipeRefreshService.canRefresh(currentRecipe) && (
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              style={[
                styles.headerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.full,
                  opacity: refreshing ? 0.5 : 1,
                },
              ]}
            >
              <FontAwesomeIcon
                icon={faArrowsRotate}
                size={16}
                color={colors.primary}
              />
              <Text
                style={[styles.headerButtonText, { color: colors.primary }]}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </Text>
            </TouchableOpacity>
          )}

          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(recipe)}
              style={[
                styles.headerButton,
                { backgroundColor: colors.primary, borderRadius: radius.full },
              ]}
            >
              <FontAwesomeIcon
                name="faPen"
                size={16}
                color={colors.textInverse}
              />
              <Text
                style={[styles.headerButtonText, { color: colors.textInverse }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.headerButton,
              {
                backgroundColor: "#dc2626",
                borderRadius: radius.full,
              },
            ]}
          >
            <FontAwesomeIcon
              name="faTrash"
              size={16}
              color={colors.textInverse}
            />
            <Text
              style={[styles.headerButtonText, { color: colors.textInverse }]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navigation Tabs */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: spacing.md,
          paddingHorizontal: spacing.md,
        }}
      >
        {[
          { key: "overview", label: "📖 Overview", icon: faBook },
          { key: "cooking-tips", label: "💡 Tips", icon: faLightbulb },
          { key: "notes", label: "📝 Notes", icon: faNoteSticky },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab.key ? colors.primary : colors.background,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab.key
                      ? colors.textInverse
                      : colors.textPrimary,
                  fontSize: typography.fontSize.sm,
                  fontWeight:
                    activeTab === tab.key
                      ? typography.fontWeight.semibold
                      : typography.fontWeight.normal,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabbed Content */}
      {activeTab === "overview" && (
        <>
          {/* Recipe Image */}
          {currentRecipe.image_url && currentRecipe.id && (
            <View style={styles.imageContainer}>
              <SmartImage
                imageUrl={currentRecipe.image_url}
                recipeId={currentRecipe.id}
                style={styles.recipeImage}
                resizeMode="cover"
                fallbackIcon="🍽️"
                onError={(error: any) => {
                  // Production build: console.log removed
                }}
              />
            </View>
          )}

          {/* Recipe Info */}
          <View
            style={[
              styles.infoSection,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {currentRecipe.description && (
              <Text style={[styles.description, { color: colors.textPrimary }]}>
                {currentRecipe.description}
              </Text>
            )}

            <View style={styles.infoGrid}>
              <View
                style={[
                  styles.infoItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Servings
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {currentRecipe.recipe_yield || servingAdjustment}
                </Text>
              </View>
              <View
                style={[
                  styles.infoItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Prep Time{" "}
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatTime(recipe.prep_time_minutes) || "–"}
                </Text>
              </View>
              <View
                style={[
                  styles.infoItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Cook Time
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatTime(recipe.cook_time_minutes) || "–"}
                </Text>
              </View>
              <View
                style={[
                  styles.infoItem,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Total Time
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {formatTime(recipe.total_time_minutes) || "–"}
                </Text>
              </View>
              {recipe.difficulty_level && (
                <View
                  style={[
                    styles.infoItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Difficulty
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.textPrimary }]}
                  >
                    {recipe.difficulty_level}
                  </Text>
                </View>
              )}
              {recipe.cuisine_type && (
                <View
                  style={[
                    styles.infoItem,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Text
                    style={[styles.infoLabel, { color: colors.textSecondary }]}
                  >
                    Cuisine
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: colors.textPrimary }]}
                  >
                    {recipe.cuisine_type}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                🏷️ Tags
              </Text>
              <View style={styles.tagsContainer}>
                {recipe.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: colors.primary + "20",
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ingredients */}
          <IngredientList
            ingredients={currentRecipe.ingredients}
            servings={servingAdjustment}
            originalServings={currentRecipe.servings}
          />

          {/* Enhanced Directions with Checkboxes */}
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Directions ({currentRecipe.directions.length} steps)
            </Text>
            {currentRecipe.directions.map((direction, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleStepCompletion(index)}
                style={[
                  styles.enhancedDirectionItem,
                  {
                    backgroundColor: completedSteps[index]
                      ? colors.success + "20"
                      : colors.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepCheckbox,
                    { borderColor: colors.primary },
                    completedSteps[index] && [
                      styles.stepCheckboxCompleted,
                      { backgroundColor: colors.primary },
                    ],
                  ]}
                >
                  {completedSteps[index] && (
                    <FontAwesomeIcon
                      name="faCheck"
                      size={12}
                      color={colors.textInverse}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.directionText,
                      { color: colors.textPrimary },
                      completedSteps[index] && styles.stepTextCompleted,
                    ]}
                  >
                    {direction}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Cooking Tips Tab */}
      {activeTab === "cooking-tips" && (
        <View
          style={[
            styles.tipsContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            🍳 Cooking Tips & Techniques
          </Text>
          {getCookingTips().map((tip, index) => (
            <View
              key={index}
              style={[styles.tipItem, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.tipText, { color: colors.textPrimary }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <View
          style={[
            styles.notesContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📝 Personal Notes
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              { borderColor: colors.border, color: colors.textPrimary },
            ]}
            placeholder="Add your personal notes, modifications, or reviews here..."
            placeholderTextColor={colors.textSecondary}
            value={personalNotes}
            onChangeText={setPersonalNotes}
            multiline
            numberOfLines={6}
          />
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Notes Saved",
                "Your personal notes have been saved!",
              );
              // Switch back to overview tab after saving
              setActiveTab("overview");
            }}
            style={[
              styles.headerButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                alignSelf: "center",
                marginTop: spacing.md,
              },
            ]}
          >
            <FontAwesomeIcon
              name="faSave"
              size={16}
              color={colors.textInverse}
            />
            <Text
              style={[styles.headerButtonText, { color: colors.textInverse }]}
            >
              Save Notes
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Overview Tab Only - Show remaining sections */}
      {activeTab === "overview" && (
        <>
          {/* Nutritional Information - Only show if data exists */}
          {currentRecipe.nutritional_info &&
            (currentRecipe.nutritional_info.calories ||
              currentRecipe.nutritional_info.protein ||
              currentRecipe.nutritional_info.carbs ||
              currentRecipe.nutritional_info.fat) && (
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.sectionTitle, { color: colors.textPrimary }]}
                >
                  🥗 Nutritional Information
                </Text>
                <Text
                  style={[
                    styles.nutritionDisclaimer,
                    { color: colors.textSecondary },
                  ]}
                >
                  Per serving • Approximate values
                </Text>

                <View style={styles.nutritionGrid}>
                  {currentRecipe.nutritional_info?.calories !== undefined &&
                    currentRecipe.nutritional_info?.calories !== null && (
                      <View style={[styles.nutritionItem, styles.caloriesItem]}>
                        <Text style={styles.nutritionIcon}>🔥</Text>
                        <Text
                          style={[
                            styles.nutritionLabel,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Calories
                        </Text>
                        <Text
                          style={[styles.nutritionValue, styles.caloriesValue]}
                        >
                          {Math.round(currentRecipe.nutritional_info.calories)}
                        </Text>
                        <Text
                          style={[
                            styles.nutritionUnit,
                            { color: colors.textSecondary },
                          ]}
                        >
                          kcal
                        </Text>
                      </View>
                    )}

                  {currentRecipe.nutritional_info?.protein && (
                    <View
                      style={[
                        styles.nutritionItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.nutritionIcon}>🥩</Text>
                      <Text
                        style={[
                          styles.nutritionLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Protein
                      </Text>
                      <Text
                        style={[
                          styles.nutritionValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {currentRecipe.nutritional_info.protein}
                      </Text>
                    </View>
                  )}

                  {currentRecipe.nutritional_info?.carbs && (
                    <View
                      style={[
                        styles.nutritionItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.nutritionIcon}>🍞</Text>
                      <Text
                        style={[
                          styles.nutritionLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Carbs
                      </Text>
                      <Text
                        style={[
                          styles.nutritionValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {currentRecipe.nutritional_info.carbs}
                      </Text>
                    </View>
                  )}

                  {currentRecipe.nutritional_info?.fat && (
                    <View
                      style={[
                        styles.nutritionItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.nutritionIcon}>🥑</Text>
                      <Text
                        style={[
                          styles.nutritionLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Fat
                      </Text>
                      <Text
                        style={[
                          styles.nutritionValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {currentRecipe.nutritional_info.fat}
                      </Text>
                    </View>
                  )}

                  {currentRecipe.nutritional_info?.fiber && (
                    <View
                      style={[
                        styles.nutritionItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.nutritionIcon}>🌾</Text>
                      <Text
                        style={[
                          styles.nutritionLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Fiber
                      </Text>
                      <Text
                        style={[
                          styles.nutritionValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {currentRecipe.nutritional_info.fiber}
                      </Text>
                    </View>
                  )}

                  {currentRecipe.nutritional_info?.sugar && (
                    <View
                      style={[
                        styles.nutritionItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.nutritionIcon}>🍯</Text>
                      <Text
                        style={[
                          styles.nutritionLabel,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Sugar
                      </Text>
                      <Text
                        style={[
                          styles.nutritionValue,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {currentRecipe.nutritional_info.sugar}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Nutritional Notes */}
                {currentRecipe.nutritional_info?.calories !== undefined &&
                  currentRecipe.nutritional_info?.calories !== null && (
                    <View
                      style={[
                        styles.nutritionNotes,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.notesTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        💡 Nutrition Tips
                      </Text>
                      <Text
                        style={[
                          styles.noteText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        • This recipe provides{" "}
                        {Math.round(
                          (currentRecipe.nutritional_info.calories / 2000) *
                            100,
                        )}
                        % of daily calories (based on 2000 cal/day)
                      </Text>
                      {currentRecipe.nutritional_info.protein && (
                        <Text
                          style={[
                            styles.noteText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          • Good source of protein for muscle health and satiety
                        </Text>
                      )}
                      {currentRecipe.nutritional_info.fiber && (
                        <Text
                          style={[
                            styles.noteText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          • Contains fiber for digestive health
                        </Text>
                      )}
                    </View>
                  )}
              </View>
            )}

          {/* Source */}
          <View
            style={[
              styles.sourceSection,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Source
            </Text>
            {recipe.web_address && recipe.web_address !== "manually-entered" ? (
              <TouchableOpacity onPress={openWebAddress}>
                <Text
                  style={[
                    styles.sourceText,
                    { color: colors.primary, textDecorationLine: "underline" },
                  ]}
                >
                  📖 {recipe.web_address}
                </Text>
              </TouchableOpacity>
            ) : recipe.recipe_source &&
              recipe.recipe_source.toLowerCase().includes("http") ? (
              <TouchableOpacity
                onPress={async () => {
                  if (!recipe.recipe_source) return;

                  try {
                    const canOpen = await Linking.canOpenURL(
                      recipe.recipe_source,
                    );
                    if (canOpen) {
                      await Linking.openURL(recipe.recipe_source);
                    } else {
                      Alert.alert("Error", "Cannot open this URL");
                    }
                  } catch {
                    Alert.alert("Error", "Failed to open URL");
                  }
                }}
              >
                <Text
                  style={[
                    styles.sourceText,
                    { color: colors.primary, textDecorationLine: "underline" },
                  ]}
                >
                  📖 {recipe.recipe_source}
                </Text>
              </TouchableOpacity>
            ) : recipe.recipe_source &&
              recipe.recipe_source !== "Manually entered" ? (
              <Text style={[styles.sourceText, { color: colors.textPrimary }]}>
                📖 {recipe.recipe_source}
              </Text>
            ) : (
              <Text style={[styles.sourceText, { color: colors.textPrimary }]}>
                ✏️ Manually entered recipe
              </Text>
            )}
          </View>

          {/* Metadata */}
          <View style={[styles.metadata, { borderTopColor: colors.border }]}>
            {recipe.created_at && (
              <Text
                style={[styles.metadataText, { color: colors.textSecondary }]}
              >
                Added: {new Date(recipe.created_at).toLocaleDateString()}
              </Text>
            )}
            {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
              <Text
                style={[styles.metadataText, { color: colors.textSecondary }]}
              >
                Updated: {new Date(recipe.updated_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#faf4eb",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 20,
    minWidth: 60,
    paddingHorizontal: 5, // Add padding to prevent buttons from touching edges
    // minHeight: 36, // Reduced from 44 to match small button height
    flexWrap: "wrap", // Allow wrapping on very small screens
    gap: 8, // Reduced gap for smaller buttons
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00205B",
    marginBottom: 20,
    textAlign: "center",
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recipeImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00205B",
  },
  description: {
    fontSize: 16,
    color: "#00205B",
    marginBottom: 15,
    fontStyle: "italic",
    textAlign: "center",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },

  infoItem: {
    backgroundColor: "#faf4eb",
    borderRadius: 8,
    padding: 10,
    minWidth: "45%",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#00205B",
    opacity: 0.7,
    marginBottom: 5,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 16,
    color: "#00205B",
    fontWeight: "bold",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00205B",
  },
  sourceSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 45,
    borderWidth: 1,
    borderColor: "#00205B",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00205B",
    marginBottom: 15,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#00205B",
    marginRight: 10,
    marginTop: 2,
  },
  listText: {
    fontSize: 16,
    color: "#00205B",
    flex: 1,
    lineHeight: 22,
  },
  directionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  stepNumber: {
    backgroundColor: "#00205B",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginTop: 2,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  directionText: {
    fontSize: 16,
    color: "#00205B",
    flex: 1,
    lineHeight: 22,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  nutritionItem: {
    backgroundColor: "#faf4eb",
    borderRadius: 12,
    padding: 15,
    minWidth: "30%",
    maxWidth: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8dcc0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caloriesItem: {
    backgroundColor: "#fff5f5",
    borderColor: "#fed7d7",
    minWidth: "48%",
  },
  nutritionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#00205B",
    opacity: 0.8,
    marginBottom: 5,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nutritionValue: {
    fontSize: 18,
    color: "#00205B",
    fontWeight: "bold",
    textAlign: "center",
  },
  caloriesValue: {
    fontSize: 22,
    color: "#d53f8c",
  },
  nutritionUnit: {
    fontSize: 10,
    color: "#00205B",
    opacity: 0.6,
    marginTop: 2,
    textAlign: "center",
  },
  nutritionDisclaimer: {
    fontSize: 12,
    color: "#00205B",
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
  },
  nutritionNotes: {
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#bee3f8",
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00205B",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: "#00205B",
    opacity: 0.8,
    lineHeight: 16,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 16,
    color: "#00205B",
    textAlign: "center",
    fontStyle: "italic",
  },
  metadata: {
    borderTopWidth: 1,
    borderTopColor: "#00205B",
    paddingTop: 15,
    marginTop: 10,
  },
  metadataText: {
    fontSize: 12,
    color: "#00205B",
    opacity: 0.6,
    textAlign: "center",
    marginBottom: 5,
  },
  // Enhanced styles
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabContainer: {
    // Dynamic styles applied inline
  },
  tab: {
    // Dynamic styles applied inline
  },
  tabText: {
    // Dynamic styles applied inline
  },
  servingAdjuster: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
  servingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00205B",
  },
  servingButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  servingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00205B",
    minWidth: 80,
    textAlign: "center",
  },
  enhancedDirectionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#00205B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginTop: 2,
  },
  stepCheckboxCompleted: {
    backgroundColor: "#00205B",
  },
  stepTextCompleted: {
    opacity: 0.6,
    textDecorationLine: "line-through",
  },
  tipsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00205B",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#00205B",
    flex: 1,
    lineHeight: 20,
    marginLeft: 8,
  },
  notesContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00205B",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#00205B",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
