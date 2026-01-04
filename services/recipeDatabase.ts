import { supabase, Recipe, isSupabaseConfigured } from '../lib/supabase';
import { DemoStorage } from './demoStorage';

export class RecipeDatabase {
  static async saveRecipe(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        const result = await DemoStorage.saveRecipe(recipe);
        if (result.success) {
        
        }
        return result;
      }

    
      
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
          recipe_source: recipe.recipe_source,
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
        // Production build: console.log removed
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
        const recipes = await DemoStorage.getAllRecipes();
        // Initialize demo recipes if storage is empty
        if (recipes.length === 0) {
          await DemoStorage.createDemoRecipesWithCategories();
          return await DemoStorage.getAllRecipes();
        }
        return recipes;
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
        // Production build: console.log removed
        return await DemoStorage.updateRecipe(id, updates);
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
      console.log('[RecipeDatabase] Attempting to delete recipe with id:', id);
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

  static async getMostRecentRecipe(): Promise<Recipe | null> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo storage: get all recipes and sort by creation date
        const allRecipes = await DemoStorage.getAllRecipes();
        if (allRecipes.length === 0) return null;
        
        return allRecipes.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        })[0];
      }

      // Supabase: query most recent recipe
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching most recent recipe:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching most recent recipe:', error);
      return null;
    }
  }

  static async getRecipesByCategory(cuisineType: string, limit: number = 4): Promise<Recipe[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        const allRecipes = await DemoStorage.getAllRecipes();
        return allRecipes
          .filter(recipe => recipe.cuisine_type?.toLowerCase() === cuisineType.toLowerCase())
          .slice(0, limit);
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .ilike('cuisine_type', cuisineType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recipes by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching recipes by category:', error);
      return [];
    }
  }

  static async getAvailableCategories(): Promise<string[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        const allRecipes = await DemoStorage.getAllRecipes();
        const categories = [...new Set(allRecipes
          .map(recipe => recipe.cuisine_type)
          .filter(Boolean)
          .map(cat => cat!.toLowerCase())
        )];
        return categories;
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('cuisine_type')
        .not('cuisine_type', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      const categories = [...new Set(data
        .map((item: { cuisine_type?: string }) => item.cuisine_type?.toLowerCase())
        .filter(Boolean)
      )] as string[];
      
      return categories;
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      return [];
    }
  }
}
