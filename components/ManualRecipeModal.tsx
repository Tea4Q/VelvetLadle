import React, { useState } from "react";
import {
	Alert,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Recipe, isSupabaseConfigured } from "../lib/supabase";
import { RecipeDatabase } from "../services/recipeDatabase";
import { RecipeSourceDemo } from "../services/RecipeSourceDemo";
import { RecipeSourceService } from "../services/RecipeSourceService";
import Button from "./buttons";
import RecipeSourceInput from "./RecipeSourceInput";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialUrl?: string;
  editingRecipe?: Recipe | null;
  onRecipeUpdated?: () => void;
  onRecipeSelect?: (recipe: Recipe) => void;
};

export default function ManualRecipeModal({
  visible,
  onClose,
  initialUrl,
  editingRecipe,
  onRecipeUpdated,
  onRecipeSelect,
}: Props) {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [directions, setDirections] = useState("");
  const [servings, setServings] = useState("");
  const [recipeSource, setRecipeSource] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editingRecipe;

  // Debug function for recipe source changes
  const handleRecipeSourceChange = (text: string) => {
    setRecipeSource(text);
  };

  // Helper function to validate URL format
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  // Populate form when editing
  React.useEffect(() => {
    if (visible) {
      // Initialize demo sources for first-time users
      RecipeSourceDemo.initializeDemoSources();
    }

    if (editingRecipe) {
      setTitle(editingRecipe.title || "");
      setIngredients(
        editingRecipe.ingredients ? editingRecipe.ingredients.join("\n") : "",
      );
      setDirections(
        editingRecipe.directions ? editingRecipe.directions.join("\n") : "",
      );
      setServings(
        editingRecipe.servings ? editingRecipe.servings.toString() : "",
      );
      setRecipeSource(editingRecipe.recipe_source || "");
      setImageUrl(editingRecipe.image_url || "");
    } else {
      // Reset form
      setTitle("");
      setIngredients("");
      setDirections("");
      setServings("");
      setRecipeSource("");
      setImageUrl("");
    }
  }, [editingRecipe, visible, initialUrl]);

  const resetForm = () => {
    setTitle("");
    setIngredients("");
    setDirections("");
    setServings("");
    setRecipeSource("");
    setImageUrl("");
  };

  const { fetchNutrition } = require("../services/nutritionService");
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Information", "Please enter a recipe title.");
      return;
    }

    if (!ingredients.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter at least one ingredient.",
      );
      return;
    }

    if (!directions.trim()) {
      Alert.alert("Missing Information", "Please enter cooking directions.");
      return;
    }

    // Validate URLs if provided
    if (imageUrl.trim() && !isValidUrl(imageUrl.trim())) {
      Alert.alert(
        "Invalid Image URL",
        "Please enter a valid image URL or leave it blank.",
      );
      return;
    }

    setIsSaving(true);

    try {
      // Save the recipe source for future suggestions
      if (recipeSource.trim()) {
        await RecipeSourceService.addSource(recipeSource.trim());
      }

      // Fetch nutrition info from Spoonacular
      let nutritional_info = undefined;
      try {
        const nutritionResult = await fetchNutrition(
          ingredients
            .split("\n")
            .map((ing) => ing.trim())
            .filter((ing) => ing.length > 0),
          servings.trim() ? parseInt(servings.trim()) : 1,
        );
        if (nutritionResult.success && Array.isArray(nutritionResult.data)) {
          // Aggregate nutrition data (calories, protein, carbs, fat, fiber, sugar)
          let calories = 0,
            protein = 0,
            carbs = 0,
            fat = 0,
            fiber = 0,
            sugar = 0,
            sodium = 0;
          nutritionResult.data.forEach((item: any) => {
            if (item.nutrition) {
              calories +=
                item.nutrition.nutrients?.find(
                  (n: any) => n.name === "Calories",
                )?.amount || 0;
              protein +=
                item.nutrition.nutrients?.find((n: any) => n.name === "Protein")
                  ?.amount || 0;
              carbs +=
                item.nutrition.nutrients?.find(
                  (n: any) => n.name === "Carbohydrates",
                )?.amount || 0;
              fat +=
                item.nutrition.nutrients?.find((n: any) => n.name === "Fat")
                  ?.amount || 0;
              fiber +=
                item.nutrition.nutrients?.find((n: any) => n.name === "Fiber")
                  ?.amount || 0;
              sugar +=
                item.nutrition.nutrients?.find((n: any) => n.name === "Sugar")
                  ?.amount || 0;
              sodium +=
                item.nutrition.nutrients?.find((n: any) => n.name === "Sodium")
                  ?.amount || 0;
            }
          });
          nutritional_info = {
            calories: Math.round(calories),
            protein: protein ? protein.toFixed(1) + "g" : undefined,
            carbs: carbs ? carbs.toFixed(1) + "g" : undefined,
            fat: fat ? fat.toFixed(1) + "g" : undefined,
            fiber: fiber ? fiber.toFixed(1) + "g" : undefined,
            sugar: sugar ? sugar.toFixed(1) + "g" : undefined,
            sodium: sodium ? Math.round(sodium) + "mg" : undefined,
          };
        }
      } catch (err) {
        // If nutrition fetch fails, continue without it
        nutritional_info = undefined;
      }

      // If recipeSource is a valid URL, treat as web_address and also save as recipe_source
      let web_address =
        initialUrl || editingRecipe?.web_address || "manually-entered";
      let recipe_source = recipeSource.trim() || undefined;
      if (recipe_source && isValidUrl(recipe_source)) {
        web_address = recipe_source;
        // Always keep recipe_source as the original value for RecipeViewer
      }
      // If no recipe_source, set a default
      if (!recipe_source) {
        recipe_source = "Manually entered";
      }
      const recipe: Recipe = {
        title: title.trim(),
        ingredients: ingredients
          .split("\n")
          .map((ing) => ing.trim())
          .filter((ing) => ing.length > 0),
        directions: directions
          .split("\n")
          .map((dir) => dir.trim())
          .filter((dir) => dir.length > 0),
        servings: servings.trim() ? parseInt(servings.trim()) : undefined,
        web_address,
        recipe_source,
        image_url: imageUrl.trim() || undefined,
        description: editingRecipe?.description || "Manually entered recipe",
        nutritional_info,
      };

      let result;
      if (isEditing && editingRecipe?.id) {
        // Update existing recipe
        result = await RecipeDatabase.updateRecipe(editingRecipe.id, recipe);
      } else {
        // Create new recipe
        result = await RecipeDatabase.saveRecipe(recipe);
      }

      if (result.success) {
        const storageType = isSupabaseConfigured
          ? "Supabase database"
          : "demo storage (temporary)";
        const setupNote = isSupabaseConfigured
          ? ""
          : "\n\n💡 Set up Supabase for permanent storage";
        const actionText = isEditing ? "updated" : "saved";

        // Close modal and reset form immediately
        resetForm();
        onClose();
        if (onRecipeUpdated) onRecipeUpdated();

        const buttons = [
          {
            text: "OK",
            onPress: () => {
              // Modal already closed, no additional action needed
            },
          },
        ];

        // Add "View Recipe" button if onRecipeSelect is provided and we have the saved recipe
        if (onRecipeSelect && result.data) {
          buttons.push({
            text: "View Recipe",
            onPress: () => {
              if (result.data) {
                onRecipeSelect(result.data);
              }
            },
          });
        }

        const sourceNote = recipe.recipe_source
          ? `\n📖 Source: ${recipe.recipe_source}`
          : "";

        Alert.alert(
          `Recipe ${isEditing ? "Updated" : "Saved"}!`,
          `Successfully ${actionText} "${recipe.title}" to ${storageType} with ${recipe.ingredients.length} ingredients and ${recipe.directions.length} steps.${sourceNote}${setupNote}`,
          buttons,
        );
      } else {
        Alert.alert(
          `${isEditing ? "Update" : "Save"} Failed`,
          `Could not ${isEditing ? "update" : "save"} the recipe: ${result.error}`,
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditing ? "updating" : "saving"} manual recipe:`,
        error,
      );
      Alert.alert(
        "Error",
        `An unexpected error occurred while ${isEditing ? "updating" : "saving"} the recipe.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Recipe" : "Add Recipe Manually"}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing
                ? "Update recipe details below"
                : "Enter recipe details below"}
            </Text>

            <Text style={styles.label}>Recipe Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Classic Chicken Gizzards"
              value={title}
              onChangeText={setTitle}
              multiline={false}
              spellCheck={true}
              autoCorrect={true}
            />

            <Text style={styles.label}>Recipe Source</Text>
            <Text
              style={[
                styles.label,
                {
                  fontSize: 12,
                  color: "#666",
                  fontWeight: "normal",
                  marginTop: 0,
                  marginBottom: 5,
                },
              ]}
            >
              Where did you get this recipe? (e.g., "Grandma's recipe", "Found
              in old cookbook")
            </Text>
            <RecipeSourceInput
              value={recipeSource}
              onChangeText={handleRecipeSourceChange}
            />

            <Text style={styles.label}>Recipe Image address</Text>
            <Text
              style={[
                styles.label,
                {
                  fontSize: 12,
                  color: "#666",
                  fontWeight: "normal",
                  marginTop: 0,
                  marginBottom: 5,
                },
              ]}
            >
              Direct link to an image (jpg, png, gif, webp)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://example.com/image.jpg (optional)"
              value={imageUrl}
              onChangeText={setImageUrl}
              multiline={false}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>
              Ingredients * (one per line, include amounts)
            </Text>
            <Text
              style={[
                styles.label,
                {
                  fontSize: 12,
                  color: "#666",
                  fontWeight: "normal",
                  marginTop: 0,
                  marginBottom: 5,
                },
              ]}
            >
              Include amounts and units (e.g., &quot;2 cups flour&quot;, &quot;1
              tsp salt&quot;)
            </Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder={`2 1/4 cups all-purpose flour\n1 teaspoon baking soda\n1/2 cup butter, softened\n2 large eggs\nSalt and pepper to taste`}
              value={ingredients}
              onChangeText={setIngredients}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              spellCheck={true}
              autoCorrect={true}
            />

            <Text style={styles.label}>Directions * (one step per line)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder={`Clean and trim gizzards\nHeat oil in large skillet\nSauté onions until golden\nAdd gizzards and cook until tender`}
              value={directions}
              onChangeText={setDirections}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              spellCheck={true}
              autoCorrect={true}
            />

            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 4"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              multiline={false}
              spellCheck={false}
              autoCorrect={false}
            />

            <View style={styles.buttonContainer}>
              <Button
                label={
                  isSaving
                    ? isEditing
                      ? "Updating..."
                      : "Saving..."
                    : isEditing
                      ? "Update Recipe"
                      : "Save Recipe"
                }
                theme="primary"
                onPress={handleSave}
              />
              <Button label="Cancel" onPress={handleCancel} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#faf4eb",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#00205B",
  },
  scrollView: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00205B",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#00205B",
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.7,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00205B",
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#00205B",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#00205B",
  },
  multilineInput: {
    minHeight: 100,
  },
  recipeSourceInput: {
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
});
