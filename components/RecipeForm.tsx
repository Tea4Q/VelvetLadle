import { useColors } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Recipe } from "../lib/supabase";
import Button from "./buttons";
import SmartImage from "./SmartImage";

const colors = useColors();

interface RecipeFormProps {
  initialRecipe?: Recipe | null;
  onSave: (recipe: Recipe) => void | Promise<void>;
  onCancel: () => void;
}

const defaultNutrition = {
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
  sodium: "",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary, padding: 20 },
  content: { padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.textPrimary,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 80 },
  image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    color: colors.primary,
  },
  nutritionRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  nutritionLabel: { width: 90, fontSize: 14, color: colors.textPrimary },
  nutritionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    gap: 10,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBottom,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    backgroundColor: colors.background,
  },
  tabText: { fontSize: 16, color: colors.inactive, fontWeight: "600" },
  activeTabText: { color: colors.textPrimary, fontWeight: "bold" },
});

export default function RecipeForm({
  initialRecipe,
  onSave,
  onCancel,
}: RecipeFormProps) {
  const [activeTab, setActiveTab] = useState<
    "basics" | "details" | "nutrition" | "notes"
  >("basics");
  const [title, setTitle] = useState(initialRecipe?.title || "");
  const [description, setDescription] = useState(
    initialRecipe?.description || "",
  );
  const [imageUrl, setImageUrl] = useState(initialRecipe?.image_url || "");
  const [ingredients, setIngredients] = useState(
    initialRecipe?.ingredients?.join("\n") || "",
  );
  const [directions, setDirections] = useState(
    initialRecipe?.directions?.join("\n") || "",
  );
  const [recipeYield, setRecipeYield] = useState(
    initialRecipe?.recipe_yield || initialRecipe?.servings?.toString() || "",
  );
  const [prepTime, setPrepTime] = useState(
    initialRecipe?.prep_time_minutes?.toString() || "",
  );
  const [cookTime, setCookTime] = useState(
    initialRecipe?.cook_time_minutes?.toString() || "",
  );
  const [totalTime, setTotalTime] = useState(
    initialRecipe?.total_time_minutes?.toString() || "",
  );
  const [cuisine, setCuisine] = useState(initialRecipe?.cuisine_type || "");
  const [difficulty, setDifficulty] = useState(
    initialRecipe?.difficulty_level || "",
  );
  const [nutrition, setNutrition] = useState<any>(
    initialRecipe?.nutritional_info || defaultNutrition,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialRecipe) {
      setTitle(initialRecipe.title || "");
      setDescription(initialRecipe.description || "");
      setImageUrl(initialRecipe.image_url || "");
      setIngredients(initialRecipe.ingredients?.join("\n") || "");
      setDirections(initialRecipe.directions?.join("\n") || "");
      setRecipeYield(initialRecipe.recipe_yield || initialRecipe.servings?.toString() || "");
      setPrepTime(initialRecipe.prep_time_minutes?.toString() || "");
      setCookTime(initialRecipe.cook_time_minutes?.toString() || "");
      setTotalTime(initialRecipe.total_time_minutes?.toString() || "");
      setCuisine(initialRecipe.cuisine_type || "");
      setDifficulty(initialRecipe.difficulty_level || "");
      setNutrition(initialRecipe.nutritional_info || defaultNutrition);
    }
  }, [initialRecipe]);

  const handleSave = async () => {
    if (isSaving) return; // Prevent double-submit

    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a recipe title.");
      return;
    }
    if (!ingredients.trim()) {
      Alert.alert(
        "Missing Ingredients",
        "Please enter at least one ingredient.",
      );
      return;
    }
    if (!directions.trim()) {
      Alert.alert("Missing Directions", "Please enter at least one direction.");
      return;
    }

    setIsSaving(true);
    try {
      const recipe: Recipe = {
        ...initialRecipe,
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        ingredients: ingredients
          .split("\n")
          .map((i) => i.trim())
          .filter(Boolean),
        directions: directions
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean),
        recipe_yield: recipeYield.trim() || undefined,
        servings: recipeYield.trim()
          ? (parseInt(recipeYield.trim().match(/\d+/)?.[0] || "0") || undefined)
          : undefined,
        prep_time_minutes: prepTime.trim()
          ? parseInt(prepTime.trim())
          : undefined,
        cook_time_minutes: cookTime.trim()
          ? parseInt(cookTime.trim())
          : undefined,
        total_time_minutes: totalTime.trim()
          ? parseInt(totalTime.trim())
          : undefined,
        cuisine_type: cuisine.trim(),
        difficulty_level: difficulty.trim(),
        nutritional_info: nutrition,
        web_address: initialRecipe?.web_address || "",
        recipe_source: initialRecipe?.recipe_source || "",
      };

      // Call onSave and wait for it if it's async
      const result = onSave(recipe);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
        {/* Top Bar: Back, Save, Cancel */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 20,
            paddingHorizontal: 10,
            backgroundColor: colors.background,
            gap: 8,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: colors.textPrimary,
                marginRight: 4,
              }}
            >
              ←
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textPrimary,
                fontWeight: "600",
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label={isSaving ? "Saving..." : "Save"}
              theme="primary"
              onPress={handleSave}
            />
            <Button label="Cancel" onPress={onCancel} />
          </View>
        </View>
        {/* Tab Navigation */}
        <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "basics" && styles.activeTab]}
            onPress={() => setActiveTab("basics")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "basics" && styles.activeTabText,
              ]}
            >
              Basics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "details" && styles.activeTab]}
            onPress={() => setActiveTab("details")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "details" && styles.activeTabText,
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "nutrition" && styles.activeTab]}
            onPress={() => setActiveTab("nutrition")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "nutrition" && styles.activeTabText,
              ]}
            >
              Nutrition
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "notes" && styles.activeTab]}
            onPress={() => setActiveTab("notes")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "notes" && styles.activeTabText,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>
        </View>
        {/* Tab Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {activeTab === "basics" && (
            <>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
              />
              {imageUrl ? (
                <SmartImage
                  imageUrl={imageUrl}
                  recipeId={initialRecipe?.id ?? 0}
                  style={styles.image}
                />
              ) : null}
              <Text style={styles.label}>Ingredients *</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={ingredients}
                onChangeText={setIngredients}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholder="Enter each ingredient on a new line"
              />
              <Text style={styles.label}>Directions *</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={directions}
                onChangeText={setDirections}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                placeholder="Enter each direction on a new line"
              />
            </>
          )}
          {activeTab === "details" && (
            <>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.input}
                value={recipeYield}
                onChangeText={setRecipeYield}
                placeholder="e.g. 4 or 2-4"
              />
              <Text style={styles.label}>Prep Time</Text>
              <TextInput
                style={styles.input}
                value={prepTime}
                onChangeText={setPrepTime}
              />
              <Text style={styles.label}>Cook Time</Text>
              <TextInput
                style={styles.input}
                value={cookTime}
                onChangeText={setCookTime}
              />
              <Text style={styles.label}>Total Time</Text>
              <TextInput
                style={styles.input}
                value={totalTime}
                onChangeText={setTotalTime}
              />
              <Text style={styles.label}>Cuisine</Text>
              <TextInput
                style={styles.input}
                value={cuisine}
                onChangeText={setCuisine}
              />
              <Text style={styles.label}>Difficulty</Text>
              <TextInput
                style={styles.input}
                value={difficulty}
                onChangeText={setDifficulty}
              />
            </>
          )}
          {activeTab === "nutrition" && (
            <>
              <Text style={styles.sectionTitle}>Nutritional Info</Text>
              {Object.keys(defaultNutrition).map((key) => (
                <View key={key} style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </Text>
                  <TextInput
                    style={styles.nutritionInput}
                    value={nutrition[key] || ""}
                    onChangeText={(val) =>
                      setNutrition((n: any) => ({ ...n, [key]: val }))
                    }
                    keyboardType={
                      key === "calories" || key === "sodium"
                        ? "numeric"
                        : "default"
                    }
                  />
                </View>
              ))}
            </>
          )}
          {activeTab === "notes" && (
            <View style={{ padding: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textPrimary,
                  textAlign: "center",
                }}
              >
                Personal notes feature coming soon!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                This feature requires a database update.
              </Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
