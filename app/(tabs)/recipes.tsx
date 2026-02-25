import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import RecipeForm from "../../components/RecipeForm";
import RecipeList from "../../components/RecipeList";
import RecipeViewer from "../../components/RecipeViewer";
import { useAuth } from "../../contexts/AuthContext";
import { useColors } from "../../contexts/ThemeContext";
import { Recipe } from "../../lib/supabase";
import { RecipeDatabase } from "../../services/recipeDatabase";
import { useFocusEffect } from '@react-navigation/native';


export default function RecipesScreen() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const colors = useColors();
  const { user } = useAuth();

  const isGuest = user?.id === "guest_user";

  // Get URL parameters for category filtering, filterType, and recipeId
  const { category, filterType, recipeId } = useLocalSearchParams();
  const stableCategory = useMemo(() => category as string, [category]);
  const stableFilterType = useMemo(() => filterType as string, [filterType]);

  useFocusEffect(
    useCallback(() => {
      if (__DEV__) {
        console.warn("[RecipesScreen] focus refresh", { userId: user?.id });
      }

      if (!user?.id) return undefined; // Don't set up interval if user ID is not available

      // Refresh recipes every 5 minutes while screen is focused
      const interval = setInterval(() => {
        if (__DEV__) {
          console.log("[RecipesScreen] refreshing recipes in background");
        }
        setRefreshKey((prev) => prev + 1);
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval); // Clean up interval on blur
    }, [user?.id /* keep existing deps used by fetch logic */])
  );

  // When recipeId is passed via router params, load and display that recipe
  useEffect(() => {
    if (recipeId) {
      const loadRecipe = async () => {
        const id = parseInt(recipeId as string, 10);
        if (!isNaN(id)) {
          const { success, data } = await RecipeDatabase.getRecipeById(id);
          if (success && data) {
            setSelectedRecipe(data);
          }
        }
      };
      loadRecipe();
    }
  }, [recipeId, user?.id]);

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleBack = () => {
    setSelectedRecipe(null);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowEditForm(true);
  };

  const handleEditFormClose = () => {
    setShowEditForm(false);
    setEditingRecipe(null);
  };

  const handleRecipeFormSave = async (updatedRecipe: Recipe) => {
    if (!updatedRecipe.id) {
      Alert.alert("Error", "Recipe ID is missing.");
      return;
    }
    const { success, data, error } = await RecipeDatabase.updateRecipe(
      updatedRecipe.id,
      updatedRecipe,
    );
    if (!success) {
      Alert.alert("Error updating recipe", error || "Unknown error");
      return;
    }

    // Close the edit form and refresh
    setShowEditForm(false);
    setEditingRecipe(null);
    setRefreshKey((prev) => prev + 1);

    // If we're viewing the edited recipe, update the selected recipe
    if (selectedRecipe && data && data.id === selectedRecipe.id) {
      setSelectedRecipe(data);
    }

    // Show success message
    Alert.alert("Success", "Recipe updated successfully!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedRecipe ? (
        <RecipeViewer
          recipe={selectedRecipe}
          onBack={handleBack}
          onEdit={isGuest ? undefined : handleEdit}
        />
      ) : (
        <RecipeList
          key={`recipes-list-${refreshKey}-${stableCategory || "all"}-${stableFilterType || "none"}`} // Include both category and filterType in key
          onRecipeSelect={handleRecipeSelect}
          initialCategoryFilter={stableCategory}
          initialFilterType={stableFilterType}
        />
      )}

      {showEditForm && editingRecipe && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            zIndex: 10,
          }}
        >
          <RecipeForm
            initialRecipe={editingRecipe}
            onSave={handleRecipeFormSave}
            onCancel={handleEditFormClose}
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
});
