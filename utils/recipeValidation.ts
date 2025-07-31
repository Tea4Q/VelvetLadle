import { Recipe } from '../lib/supabase';

export class RecipeValidation {
  /**
   * Validates and cleans a recipe object
   */
  static validateRecipe(recipe: Recipe): Recipe {
    return {
      ...recipe,
      title: recipe.title?.trim() || '(Untitled Recipe)',
      description: recipe.description?.trim() || undefined,
      cuisine_type: recipe.cuisine_type?.trim() || undefined,
    };
  }

  /**
   * Checks if a recipe has valid required fields
   */
  static isValidRecipe(recipe: Recipe): boolean {
    return !!(
      recipe.id &&
      recipe.title &&
      recipe.title.trim().length > 0
    );
  }

  /**
   * Filters out invalid recipes and validates the rest
   */
  static cleanRecipeList(recipes: Recipe[]): Recipe[] {
    return recipes
      .filter(recipe => recipe.id) // Must have an ID
      .map(recipe => this.validateRecipe(recipe));
  }

  /**
   * Gets a safe display title for a recipe
   */
  static getSafeTitle(recipe: Recipe): string {
    return recipe.title?.trim() || '(Untitled Recipe)';
  }
}
