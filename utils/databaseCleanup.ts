// Database cleanup utility for VelvetLadle
import { RecipeDatabase } from '../services/recipeDatabase';

export class DatabaseCleanup {
  /**
   * Find and fix recipes with empty or invalid titles
   */
  static async fixEmptyTitles(): Promise<void> {
    try {
      console.log('🧹 Starting database cleanup...');
      
      const allRecipes = await RecipeDatabase.getAllRecipes();
      console.log(`Found ${allRecipes.length} total recipes`);
      
      const problematicRecipes = allRecipes.filter(recipe => 
        !recipe.title || recipe.title.trim() === ''
      );
      
      console.log(`Found ${problematicRecipes.length} recipes with empty titles:`, 
        problematicRecipes.map(r => ({ id: r.id, title: r.title, ingredients: r.ingredients?.length || 0 }))
      );
      
      for (const recipe of problematicRecipes) {
        if (recipe.id) {
          console.log(`Fixing recipe ID ${recipe.id}...`);
          
          // Try to generate a title from ingredients or description
          let newTitle = '(Untitled Recipe)';
          
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            // Use first few ingredients as title
            const mainIngredients = recipe.ingredients.slice(0, 2).join(' & ');
            newTitle = `Recipe with ${mainIngredients}`;
          } else if (recipe.description) {
            // Use description as title
            newTitle = recipe.description.substring(0, 50).trim();
            if (recipe.description.length > 50) newTitle += '...';
          } else if (recipe.cuisine_type) {
            newTitle = `${recipe.cuisine_type} Recipe`;
          }
          
          // Update the recipe
          await RecipeDatabase.updateRecipe(recipe.id, {
            ...recipe,
            title: newTitle
          });
          
          console.log(`✅ Updated recipe ID ${recipe.id} with title: "${newTitle}"`);
        }
      }
      
      console.log('🎉 Database cleanup completed!');
      
    } catch (error) {
      console.error('❌ Error during database cleanup:', error);
      throw error;
    }
  }
  
  /**
   * Delete recipes that have no useful data
   */
  static async deleteEmptyRecipes(): Promise<number> {
    try {
      const allRecipes = await RecipeDatabase.getAllRecipes();
      
      const emptyRecipes = allRecipes.filter(recipe => 
        (!recipe.title || recipe.title.trim() === '') &&
        (!recipe.description || recipe.description.trim() === '') &&
        (!recipe.ingredients || recipe.ingredients.length === 0) &&
        (!recipe.directions || recipe.directions.length === 0)
      );
      
      console.log(`Found ${emptyRecipes.length} completely empty recipes`);
      
      for (const recipe of emptyRecipes) {
        if (recipe.id) {
          await RecipeDatabase.deleteRecipe(recipe.id);
          console.log(`🗑️ Deleted empty recipe ID ${recipe.id}`);
        }
      }
      
      return emptyRecipes.length;
      
    } catch (error) {
      console.error('❌ Error deleting empty recipes:', error);
      throw error;
    }
  }
}
