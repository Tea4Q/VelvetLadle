import { Recipe, isSupabaseConfigured, supabase } from '../lib/supabase';
import { DemoStorage } from './demoStorage';

export class RecipeDatabase {
  static async saveRecipe(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    // Production build: console.log removed
    try {
      // Production build: console.log removed
      
      if (!isSupabaseConfigured || !supabase) {
        // Production build: console.log removed
        const result = await DemoStorage.saveRecipe(recipe);
        return result;
      }

      // Get current authenticated user
      // Production build: console.log removed
      const { data: { user } } = await supabase.auth.getUser();
      // Production build: console.log removed` : 'null');
      
      if (!user) {
        // Production build: console.log removed
        return { success: false, error: 'User not authenticated' };
      }
      
      // Production build: console.log removed
      // Production build: console.log removed
      
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          title: recipe.title,
          ingredients: recipe.ingredients,
          directions: recipe.directions,
          servings: recipe.servings,
          prep_time_minutes: recipe.prep_time_minutes,
          cook_time_minutes: recipe.cook_time_minutes,
          total_time_minutes: recipe.total_time_minutes,
          nutritional_info: recipe.nutritional_info,
          web_address: recipe.web_address,
          recipe_source: recipe.recipe_source,
          image_url: recipe.image_url,
          description: recipe.description,
          cuisine_type: recipe.cuisine_type,
          difficulty_level: recipe.difficulty_level,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving recipe:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message };
      }
      
      // Production build: console.log removed

     
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

  static async getRecipeById(id: number): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Demo storage: find recipe by ID
        const allRecipes = await DemoStorage.getAllRecipes();
        const recipe = allRecipes.find(r => r.id === id);
        if (recipe) {
          return { success: true, data: recipe };
        }
        return { success: false, error: 'Recipe not found' };
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching recipe by ID:', error);
      return { success: false, error: 'Failed to fetch recipe' };
    }
  }

  static async getAllRecipes(): Promise<Recipe[]> {
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Production build: console.log removed');
        const recipes = await DemoStorage.getAllRecipes();
        // Initialize demo recipes if storage is empty
        if (recipes.length === 0) {
          // Production build: console.log removed
          await DemoStorage.createDemoRecipesWithCategories();
          return await DemoStorage.getAllRecipes();
        }
        return recipes;
      }

      // Check if user is authenticated in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('recipes')
        .select('*');
      
      if (user) {
        // Authenticated Supabase users see their own recipes
        // Production build: console.log removed
        query = query.eq('user_id', user.id);
      } else {
        // Guests (no Supabase auth) see demo recipes (recipes with no user_id)
        // Production build: console.log removed
        query = query.is('user_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }

      // Production build: console.log removed
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

      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('recipes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
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
      // Production build: console.log removed
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
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Filter by user_id if authenticated, otherwise get demo recipes
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.is('user_id', null);
      }
      
      const { data, error } = await query.single();

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
