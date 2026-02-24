// Service to refresh recipe data from its original URL
// Useful for updating nutrition info when extraction logic improves

import { Recipe } from '../lib/supabase';
import { RecipeExtractor } from './recipeExtractor';
import { RecipeDatabase } from './recipeDatabase';

export class RecipeRefreshService {
  /**
   * Re-extract recipe from its URL and update the database
   * Preserves: personal_notes, is_favorite, favorited_at, recipe_source
   * Updates: ingredients, directions, nutrition, times, servings, etc.
   */
  static async refreshRecipeFromUrl(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      // Validate that recipe has a URL
      if (!recipe.web_address || recipe.web_address === 'manually-entered') {
        return { 
          success: false, 
          error: 'Cannot refresh: Recipe was entered manually or has no source URL' 
        };
      }

      if (!recipe.id) {
        return { success: false, error: 'Recipe ID is required' };
      }

      console.log('🔄 Refreshing recipe from URL:', recipe.web_address);

      // Re-extract recipe data from URL
      const extractResult = await RecipeExtractor.extractRecipeFromUrl(recipe.web_address);
      
      if (extractResult.error || !extractResult.recipe) {
        return { 
          success: false, 
          error: extractResult.error || 'Failed to extract recipe data' 
        };
      }

      const freshRecipe = extractResult.recipe;

      // Merge: Keep user data, update extracted data
      const updates: Partial<Recipe> = {
        title: freshRecipe.title || recipe.title,
        ingredients: freshRecipe.ingredients || recipe.ingredients,
        directions: freshRecipe.directions || recipe.directions,
        servings: freshRecipe.servings ?? recipe.servings,
        prep_time_minutes: freshRecipe.prep_time_minutes ?? recipe.prep_time_minutes,
        cook_time_minutes: freshRecipe.cook_time_minutes ?? recipe.cook_time_minutes,
        total_time_minutes: freshRecipe.total_time_minutes ?? recipe.total_time_minutes,
        nutritional_info: freshRecipe.nutritional_info ?? recipe.nutritional_info,
        image_url: freshRecipe.image_url || recipe.image_url,
        description: freshRecipe.description || recipe.description,
        cuisine_type: freshRecipe.cuisine_type || recipe.cuisine_type,
        recipe_yield: freshRecipe.recipe_yield || recipe.recipe_yield,
        // Preserve user data
        personal_notes: recipe.personal_notes,
        recipe_source: recipe.recipe_source,
        is_favorite: recipe.is_favorite,
        favorited_at: recipe.favorited_at,
      };

      console.log('💾 Updating recipe with fresh data...');
      const updateResult = await RecipeDatabase.updateRecipe(recipe.id, updates);

      if (updateResult.success) {
        console.log('✅ Recipe refreshed successfully');
        return { success: true, data: updateResult.data };
      }

      return updateResult;
    } catch (error: any) {
      console.error('❌ Error refreshing recipe:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to refresh recipe' 
      };
    }
  }

  /**
   * Check if a recipe can be refreshed (has a valid URL)
   */
  static canRefresh(recipe: Recipe): boolean {
    return !!(recipe.web_address && recipe.web_address !== 'manually-entered');
  }
}
