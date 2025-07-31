import { supabase, Recipe, isSupabaseConfigured } from '../lib/supabase';
import { DemoStorage } from './demoStorage';

export class RecipeDatabase {
  static async saveRecipe(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.log('Using demo storage for recipe:', recipe.title);
        const result = await DemoStorage.saveRecipe(recipe);
        if (result.success) {
          console.log('📝 Recipe saved to demo storage (in-memory only). Set up Supabase for persistent storage.');
        }
        return result;
      }

      console.log('Saving recipe to Supabase database:', recipe.title);
      
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          title: recipe.title,
          ingredients: recipe.ingredients,
          directions: recipe.directions,
          servings: recipe.servings,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          total_time: recipe.total_time,
          nutritional_info: recipe.nutritional_info,
          web_address: recipe.web_address,
          image_url: recipe.image_url,
          description: recipe.description,
          cuisine_type: recipe.cuisine_type,
          difficulty_level: recipe.difficulty_level,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving recipe:', error);
        return { success: false, error: error.message };
      }

      console.log('Recipe saved successfully:', data);
      console.log('🖼️ Saved image URL:', data?.image_url);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error saving recipe:', error);
      return { success: false, error: 'An unexpected error occurred while saving the recipe' };
    }
  }

  static async getRecipeByUrl(url: string): Promise<Recipe | null> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return await DemoStorage.getRecipeByUrl(url);
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('web_address', url)
        .single();

      if (error) {
        console.log('Recipe not found for URL:', url);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching recipe by URL:', error);
      return null;
    }
  }

  static async getAllRecipes(): Promise<Recipe[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return await DemoStorage.getAllRecipes();
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching recipes:', error);
      return [];
    }
  }

  static async updateRecipe(id: number, updates: Partial<Recipe>): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { 
          success: false, 
          error: 'Supabase is not configured. Please set up your Supabase credentials.' 
        };
      }

      const { data, error } = await supabase
        .from('recipes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating recipe:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating recipe:', error);
      return { success: false, error: 'An unexpected error occurred while updating the recipe' };
    }
  }

  static async deleteRecipe(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { 
          success: false, 
          error: 'Supabase is not configured. Please set up your Supabase credentials.' 
        };
      }

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recipe:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting recipe:', error);
      return { success: false, error: 'An unexpected error occurred while deleting the recipe' };
    }
  }

  static async getRecentRecipes(days: number = 7): Promise<Recipe[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo storage: filter by creation date
        const allRecipes = await DemoStorage.getAllRecipes();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return allRecipes.filter(recipe => {
          if (!recipe.created_at) return false;
          const recipeDate = new Date(recipe.created_at);
          return recipeDate >= cutoffDate;
        });
      }

      // Supabase: query recent recipes
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recent recipes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching recent recipes:', error);
      return [];
    }
  }
}
