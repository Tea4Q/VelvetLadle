import { supabase, isSupabaseConfigured, Recipe, Favorite } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for managing recipe and URL favorites
 * Works with both Supabase database and local storage fallback
 */
export class FavoritesService {
  private static readonly STORAGE_KEY = 'velvet_ladle_favorites';
  
  /**
   * Add a recipe to favorites
   */
  static async addRecipeToFavorites(recipe: Recipe): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Update recipe in database
        await supabase
          .from('recipes')
          .update({ 
            is_favorite: true,
            favorited_at: new Date().toISOString()
          })
          .eq('id', recipe.id);

        // Also add to favorites table for better organization
        const favorite: Favorite = {
          type: 'recipe',
          recipe_id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,
          url: recipe.web_address
        };

        await supabase
          .from('favorites')
          .upsert(favorite, { 
            onConflict: 'recipe_id',
            ignoreDuplicates: false 
          });

        console.log('✅ Recipe added to favorites in database');
      } else {
        // Local storage fallback
        await this.addToLocalFavorites({
          type: 'recipe',
          recipe_id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,
          url: recipe.web_address,
          created_at: new Date().toISOString()
        });
        console.log('✅ Recipe added to local favorites');
      }
    } catch (error) {
      console.error('❌ Error adding recipe to favorites:', error);
      throw new Error('Failed to add recipe to favorites');
    }
  }

  /**
   * Remove a recipe from favorites
   */
  static async removeRecipeFromFavorites(recipeId: number): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Update recipe in database
        await supabase
          .from('recipes')
          .update({ 
            is_favorite: false,
            favorited_at: null
          })
          .eq('id', recipeId);

        // Remove from favorites table
        await supabase
          .from('favorites')
          .delete()
          .eq('recipe_id', recipeId);

        console.log('✅ Recipe removed from favorites in database');
      } else {
        // Local storage fallback
        await this.removeFromLocalFavorites('recipe', recipeId);
        console.log('✅ Recipe removed from local favorites');
      }
    } catch (error) {
      console.error('❌ Error removing recipe from favorites:', error);
      throw new Error('Failed to remove recipe from favorites');
    }
  }

  /**
   * Add a URL to favorites
   */
  static async addUrlToFavorites(
    url: string, 
    title: string, 
    description?: string, 
    imageUrl?: string,
    tags?: string[]
  ): Promise<void> {
    try {
      const favorite: Favorite = {
        type: 'url',
        url,
        title,
        description,
        image_url: imageUrl,
        tags,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('favorites')
          .upsert(favorite, { 
            onConflict: 'url',
            ignoreDuplicates: false 
          });
        console.log('✅ URL added to favorites in database');
      } else {
        await this.addToLocalFavorites(favorite);
        console.log('✅ URL added to local favorites');
      }
    } catch (error) {
      console.error('❌ Error adding URL to favorites:', error);
      throw new Error('Failed to add URL to favorites');
    }
  }

  /**
   * Remove a URL from favorites
   */
  static async removeUrlFromFavorites(url: string): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('favorites')
          .delete()
          .eq('url', url);
        console.log('✅ URL removed from favorites in database');
      } else {
        await this.removeFromLocalFavorites('url', undefined, url);
        console.log('✅ URL removed from local favorites');
      }
    } catch (error) {
      console.error('❌ Error removing URL from favorites:', error);
      throw new Error('Failed to remove URL from favorites');
    }
  }

  /**
   * Get all favorites
   */
  static async getAllFavorites(): Promise<Favorite[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        return await this.getLocalFavorites();
      }
    } catch (error) {
      console.error('❌ Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Get favorite recipes with full recipe data
   */
  static async getFavoriteRecipes(): Promise<Recipe[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('is_favorite', true)
          .order('favorited_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        // For local storage, we need to get favorites and then find matching recipes
        const favorites = await this.getLocalFavorites();
        const recipeFavorites = favorites.filter(f => f.type === 'recipe');
        
        // This is a simplified version - in a real app you'd want to store recipe data
        return recipeFavorites.map(fav => ({
          id: fav.recipe_id,
          title: fav.title,
          description: fav.description,
          web_address: fav.url || '',
          image_url: fav.image_url,
          ingredients: [],
          directions: [],
          is_favorite: true,
          favorited_at: fav.created_at
        })) as Recipe[];
      }
    } catch (error) {
      console.error('❌ Error getting favorite recipes:', error);
      return [];
    }
  }

  /**
   * Get favorite URLs
   */
  static async getFavoriteUrls(): Promise<Favorite[]> {
    try {
      const allFavorites = await this.getAllFavorites();
      return allFavorites.filter(f => f.type === 'url');
    } catch (error) {
      console.error('❌ Error getting favorite URLs:', error);
      return [];
    }
  }

  /**
   * Check if a recipe is favorited
   */
  static async isRecipeFavorited(recipeId: number): Promise<boolean> {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('recipes')
          .select('is_favorite')
          .eq('id', recipeId)
          .single();

        if (error) return false;
        return data?.is_favorite || false;
      } else {
        const favorites = await this.getLocalFavorites();
        return favorites.some(f => f.type === 'recipe' && f.recipe_id === recipeId);
      }
    } catch (error) {
      console.error('❌ Error checking if recipe is favorited:', error);
      return false;
    }
  }

  /**
   * Check if a URL is favorited
   */
  static async isUrlFavorited(url: string): Promise<boolean> {
    try {
      const favorites = await this.getAllFavorites();
      return favorites.some(f => f.type === 'url' && f.url === url);
    } catch (error) {
      console.error('❌ Error checking if URL is favorited:', error);
      return false;
    }
  }

  /**
   * Update favorite with notes or tags
   */
  static async updateFavorite(
    favoriteId: number, 
    updates: { notes?: string; tags?: string[]; description?: string }
  ): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('favorites')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', favoriteId);
        console.log('✅ Favorite updated in database');
      } else {
        await this.updateLocalFavorite(favoriteId, updates);
        console.log('✅ Favorite updated locally');
      }
    } catch (error) {
      console.error('❌ Error updating favorite:', error);
      throw new Error('Failed to update favorite');
    }
  }

  /**
   * Search favorites
   */
  static async searchFavorites(query: string): Promise<Favorite[]> {
    try {
      const allFavorites = await this.getAllFavorites();
      const searchLower = query.toLowerCase();
      
      return allFavorites.filter(favorite => 
        favorite.title.toLowerCase().includes(searchLower) ||
        favorite.description?.toLowerCase().includes(searchLower) ||
        favorite.notes?.toLowerCase().includes(searchLower) ||
        favorite.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('❌ Error searching favorites:', error);
      return [];
    }
  }

  /**
   * Get favorites statistics
   */
  static async getFavoritesStats(): Promise<{
    totalFavorites: number;
    recipeCount: number;
    urlCount: number;
    topTags: string[];
  }> {
    try {
      const favorites = await this.getAllFavorites();
      const recipes = favorites.filter(f => f.type === 'recipe');
      const urls = favorites.filter(f => f.type === 'url');
      
      // Count tag usage
      const tagCounts: { [key: string]: number } = {};
      favorites.forEach(fav => {
        fav.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      return {
        totalFavorites: favorites.length,
        recipeCount: recipes.length,
        urlCount: urls.length,
        topTags
      };
    } catch (error) {
      console.error('❌ Error getting favorites stats:', error);
      return {
        totalFavorites: 0,
        recipeCount: 0,
        urlCount: 0,
        topTags: []
      };
    }
  }

  // Private helper methods for local storage
  private static async getLocalFavorites(): Promise<Favorite[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error reading local favorites:', error);
      return [];
    }
  }

  private static async saveLocalFavorites(favorites: Favorite[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('❌ Error saving local favorites:', error);
    }
  }

  private static async addToLocalFavorites(favorite: Favorite): Promise<void> {
    const favorites = await this.getLocalFavorites();
    favorites.unshift(favorite); // Add to beginning
    await this.saveLocalFavorites(favorites);
  }

  private static async removeFromLocalFavorites(
    type: 'recipe' | 'url', 
    recipeId?: number, 
    url?: string
  ): Promise<void> {
    const favorites = await this.getLocalFavorites();
    const filtered = favorites.filter(fav => {
      if (type === 'recipe') {
        return !(fav.type === 'recipe' && fav.recipe_id === recipeId);
      } else {
        return !(fav.type === 'url' && fav.url === url);
      }
    });
    await this.saveLocalFavorites(filtered);
  }

  private static async updateLocalFavorite(
    favoriteId: number, 
    updates: { notes?: string; tags?: string[]; description?: string }
  ): Promise<void> {
    const favorites = await this.getLocalFavorites();
    const index = favorites.findIndex(f => f.id === favoriteId);
    if (index !== -1) {
      favorites[index] = {
        ...favorites[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      await this.saveLocalFavorites(favorites);
    }
  }
}
