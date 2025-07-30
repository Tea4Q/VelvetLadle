import { Recipe } from '../lib/supabase';

// In-memory storage for demo mode when Supabase isn't configured
let demoRecipes: Recipe[] = [];
let nextId = 1;

export class DemoStorage {
  static async saveRecipe(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      const newRecipe: Recipe = {
        ...recipe,
        id: nextId++,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      demoRecipes.push(newRecipe);
      console.log('Recipe saved to demo storage:', newRecipe.title);
      
      return { success: true, data: newRecipe };
    } catch (error) {
      console.error('Error saving to demo storage:', error);
      return { success: false, error: 'Failed to save recipe to demo storage' };
    }
  }

  static async getRecipeByUrl(url: string): Promise<Recipe | null> {
    const recipe = demoRecipes.find(r => r.web_address === url);
    return recipe || null;
  }

  static async getAllRecipes(): Promise<Recipe[]> {
    return [...demoRecipes].sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  }

  static async updateRecipe(id: number, updates: Partial<Recipe>): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      const index = demoRecipes.findIndex(r => r.id === id);
      if (index === -1) {
        return { success: false, error: 'Recipe not found' };
      }

      demoRecipes[index] = {
        ...demoRecipes[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      return { success: true, data: demoRecipes[index] };
    } catch (error) {
      console.error('Error updating demo recipe:', error);
      return { success: false, error: 'Failed to update recipe in demo storage' };
    }
  }

  static async deleteRecipe(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const index = demoRecipes.findIndex(r => r.id === id);
      if (index === -1) {
        return { success: false, error: 'Recipe not found' };
      }

      demoRecipes.splice(index, 1);
      return { success: true };
    } catch (error) {
      console.error('Error deleting demo recipe:', error);
      return { success: false, error: 'Failed to delete recipe from demo storage' };
    }
  }

  static getStorageInfo(): string {
    return `Demo Storage: ${demoRecipes.length} recipes stored in memory (will be lost when app restarts)`;
  }
}
