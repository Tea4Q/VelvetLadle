import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import FavoritesList from "../../components/FavoritesList";
import RecipeViewer from "../../components/RecipeViewer";
import { useColors } from "../../contexts/ThemeContext";
import { Recipe } from "../../lib/supabase";

export default function FavoritesScreen() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const colors = useColors();

  // Refresh favorites when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Production build: console.log removed
      setRefreshKey((prev) => prev + 1);
    }, []),
  );

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleBack = () => {
    setSelectedRecipe(null);
  };

  const handleEdit = (recipe: Recipe) => {
    // TODO: Implement edit functionality
    // Production build: console.log removed
  };

  const handleUrlOpen = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedRecipe ? (
        <RecipeViewer
          recipe={selectedRecipe}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      ) : (
        <FavoritesList
          refreshTrigger={refreshKey}
          onRecipeSelect={handleRecipeSelect}
          onUrlOpen={handleUrlOpen}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});
