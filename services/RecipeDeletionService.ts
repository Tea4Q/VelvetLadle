import { Alert } from 'react-native';
import { Recipe } from '../lib/supabase';
import { RecipeValidation } from '../utils/recipeValidation';
import { ImageStorageService } from './ImageStorageService';
import { RecipeDatabase } from './recipeDatabase';

/**
 * Centralized service for deleting recipes across the app.
 * Handles database deletion, image cleanup, and user confirmation.
 */
export class RecipeDeletionService {
  /**
   * Delete a recipe with confirmation dialog and cleanup.
   * @param recipe - The recipe to delete
   * @param onSuccess - Callback to run after successful deletion (e.g., refresh list, navigate back)
   * @returns Promise that resolves when deletion is complete or cancelled
   */
  static async deleteRecipeWithConfirmation(
    recipe: Recipe,
    onSuccess?: () => void
  ): Promise<void> {
    const recipeTitle = RecipeValidation.getSafeTitle(recipe);
    
    if (!recipe.id) {
      console.error('❌ Recipe has no ID, cannot delete');
      Alert.alert('Error', 'Cannot delete recipe: Invalid recipe data');
      return;
    }

    if (!recipe.title || recipe.title.trim() === '') {
      console.warn('⚠️ Recipe has empty title, ID:', recipe.id);
    }

    // Show confirmation dialog
    return new Promise((resolve) => {
      // Use Alert for both web and mobile
      if (typeof window !== 'undefined' && window.confirm) {
        // Web browser confirmation
        if (!window.confirm(
          `Are you sure you want to delete "${recipeTitle}"?\n\nThis action cannot be undone.`
        )) {
          resolve();
          return;
        }
        this.performDelete(recipe, onSuccess).then(resolve);
      } else {
        // Mobile native alert
        Alert.alert(
          'Delete Recipe',
          `Are you sure you want to delete "${recipeTitle}"?\n\nThis action cannot be undone.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(),
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await this.performDelete(recipe, onSuccess);
                resolve();
              }
            }
          ]
        );
      }
    });
  }

  /**
   * Perform the actual deletion without confirmation.
   * @param recipe - The recipe to delete
   * @param onSuccess - Callback to run after successful deletion
   */
  private static async performDelete(
    recipe: Recipe,
    onSuccess?: () => void
  ): Promise<void> {
    try {
      const result = await RecipeDatabase.deleteRecipe(recipe.id!);
      
      if (result.success) {
        // Clean up local image cache
        await ImageStorageService.deleteLocalImage(recipe.id!);
        
        // Call success callback (e.g., refresh list, navigate back)
        if (onSuccess) {
          onSuccess();
        }
        
        // Show success message
        Alert.alert('Deleted', 'Recipe deleted successfully');
      } else {
        console.error('❌ Error deleting recipe:', result.error);
        Alert.alert('Error', result.error || 'Failed to delete recipe. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      Alert.alert('Error', 'Failed to delete recipe. Please try again.');
    }
  }

  /**
   * Delete recipe immediately without confirmation (use with caution).
   * @param recipe - The recipe to delete
   * @param onSuccess - Callback to run after successful deletion
   */
  static async deleteRecipeImmediate(
    recipe: Recipe,
    onSuccess?: () => void
  ): Promise<void> {
    if (!recipe.id) {
      console.error('❌ Recipe has no ID, cannot delete');
      Alert.alert('Error', 'Cannot delete recipe: Invalid recipe data');
      return;
    }

    await this.performDelete(recipe, onSuccess);
  }
}
