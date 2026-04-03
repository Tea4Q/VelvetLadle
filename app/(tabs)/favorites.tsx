import { useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import FavoritesList from "../../components/FavoritesList";
import RecipeForm from "../../components/RecipeForm";
import RecipeViewer from "../../components/RecipeViewer";
import { GUEST_USER_ID } from "../../constants/limits";
import { useAuth } from "../../contexts/AuthContext";
import { useColors } from "../../contexts/ThemeContext";
import { Recipe } from "../../lib/supabase";
import { PurchaseService } from "../../services/purchaseService";
import { RecipeDatabase } from "../../services/recipeDatabase";

export default function FavoritesScreen() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const colors = useColors();
  const { user } = useAuth();
  const isGuest = user?.id === GUEST_USER_ID;

  useEffect(() => {
    async function checkPremium() {
      const result =
        (await PurchaseService.isPremium()) ||
        user?.subscription_tier === "premium";
      setIsPremium(result);
    }
    if (!isGuest) {
      checkPremium();
    }
  }, [isGuest, user?.subscription_tier]);

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
    setShowEditForm(false);
    setEditingRecipe(null);
    setRefreshKey((prev) => prev + 1);
    if (selectedRecipe && data && data.id === selectedRecipe.id) {
      setSelectedRecipe(data);
    }
    Alert.alert("Success", "Recipe updated successfully!");
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
          onEdit={
            !isGuest && selectedRecipe?.user_id === user?.id
              ? handleEdit
              : undefined
          }
        />
      ) : (
        <FavoritesList
          refreshTrigger={refreshKey}
          onRecipeSelect={handleRecipeSelect}
          onUrlOpen={handleUrlOpen}
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
    width: "100%",
  },
});
