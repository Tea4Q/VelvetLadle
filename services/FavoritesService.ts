import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Favorite,
  isSupabaseConfigured,
  Recipe,
  supabase,
} from "../lib/supabase";

/**
 * Service for managing recipe and URL favorites
 * Works with both Supabase database and local storage fallback
 */
export class FavoritesService {
  private static readonly STORAGE_KEY = "velvet_ladle_favorites";

  /**
   * Add a recipe to favorites
   */
  static async addRecipeToFavorites(recipe: Recipe): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // Fallback to local storage for unauthenticated users
          await this.addToLocalFavorites({
            type: "recipe",
            recipe_id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            image_url: recipe.image_url,
            url: undefined,
            created_at: new Date().toISOString(),
          });
          return;
        }

        // Update recipe in database - only if it belongs to the user
        const recipeUpdateResult = await supabase
          .from("recipes")
          .update({
            is_favorite: true,
            favorited_at: new Date().toISOString(),
          })
          .eq("id", recipe.id)
          .eq("user_id", user.id);

        if (recipeUpdateResult.error) {
          console.error('❌ addRecipeToFavorites: Recipe update error:', recipeUpdateResult.error);
        }

        // Also add to favorites table for better organization
        const favorite: Favorite = {
          type: "recipe",
          recipe_id: recipe.id,
          user_id: user.id,
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,
          // Note: url must be NULL for recipe type due to database constraint
          url: undefined,
        };

        // Check if recipe already exists in favorites table for this user
        const { data: existing } = await supabase
          .from("favorites")
          .select("*")
          .eq("recipe_id", recipe.id)
          .eq("type", "recipe")
          .eq("user_id", user.id)
          .single();

        let result;
        if (existing) {
          // Update existing record
          result = await supabase
            .from("favorites")
            .update(favorite)
            .eq("recipe_id", recipe.id)
            .eq("type", "recipe")
            .eq("user_id", user.id);
        } else {
          // Insert new record
          result = await supabase.from("favorites").insert(favorite);
        }

        if (result.error) {
          console.warn(
            "⚠️ Error adding to favorites table (but recipe marked as favorite):",
            result.error,
          );
        }

        // Production build: console.log removed
      } else {
        // Local storage fallback
        await this.addToLocalFavorites({
          type: "recipe",
          recipe_id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,
          url: undefined, // Keep consistent with database constraint
          created_at: new Date().toISOString(),
        });
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("❌ Error adding recipe to favorites:", error);
      throw new Error("Failed to add recipe to favorites");
    }
  }

  /**
   * Remove a recipe from favorites
   */
  static async removeRecipeFromFavorites(recipeId: number): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.error('User not authenticated for removeRecipeFromFavorites');
          return;
        }

        // Update recipe in database - only if it belongs to the user
        await supabase
          .from("recipes")
          .update({
            is_favorite: false,
            favorited_at: null,
          })
          .eq("id", recipeId)
          .eq("user_id", user.id);

        // Remove from favorites table - only user's own favorites
        await supabase
          .from("favorites")
          .delete()
          .eq("recipe_id", recipeId)
          .eq("user_id", user.id);

        // Production build: console.log removed
      } else {
        // Local storage fallback
        await this.removeFromLocalFavorites("recipe", recipeId);
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("❌ Error removing recipe from favorites:", error);
      throw new Error("Failed to remove recipe from favorites");
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
    tags?: string[],
  ): Promise<void> {
    try {
      // Create favorite object that will be used by both Supabase and local storage
      const favorite: Favorite = {
        type: "url",
        url,
        title,
        description,
        image_url: imageUrl,
        tags,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // Fallback to local storage for unauthenticated users
          await this.addToLocalFavorites(favorite);
          return;
        }

        // Add user_id for authenticated users
        favorite.user_id = user.id;

        // First check if URL already exists
        const { data: existing } = await supabase
          .from("favorites")
          .select("*")
          .eq("url", url)
          .eq("type", "url")
          .single();

        let result;
        if (existing) {
          // Update existing record
          result = await supabase
            .from("favorites")
            .update(favorite)
            .eq("url", url)
            .eq("type", "url");
        } else {
          // Insert new record
          result = await supabase.from("favorites").insert(favorite);
        }

        if (result.error) {
          throw result.error;
        }
        // Production build: console.log removed
      } else {
        // Production build: console.log removed
        await this.addToLocalFavorites(favorite);
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("❌ Error adding website to favorites:", error);
      throw new Error("Failed to add website to favorites");
    }
  }

  /**
   * Remove a URL from favorites
   */
  static async removeUrlFromFavorites(url: string): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("favorites").delete().eq("url", url);
        // Production build: console.log removed
      } else {
        await this.removeFromLocalFavorites("url", undefined, url);
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("❌ Error removing Website from favorites:", error);
      throw new Error("Failed to remove Website from favorites");
    }
  }

  /**
   * Get all favorites
   */
  static async getAllFavorites(): Promise<Favorite[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          const localFavorites = await this.getLocalFavorites();
          return localFavorites;
        }

        const { data, error } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error('❌ getAllFavorites: Supabase error:', error);
          throw error;
        }
        
        return data || [];
      } else {
        console.log('🔍 getAllFavorites: Using local storage mode');
        const localFavorites = await this.getLocalFavorites();
        console.log('🔍 getAllFavorites: Found', localFavorites.length, 'local favorites');
        return localFavorites;
      }
    } catch (error) {
      console.error("❌ Error getting favorites:", error);
      return [];
    }
  }

  /**
   * Get favorite recipes with full recipe data
   */
  static async getFavoriteRecipes(): Promise<Recipe[]> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // Fall back to local storage when no user is authenticated
          const favorites = await this.getLocalFavorites();
          const recipeFavorites = favorites.filter(f => f.type === 'recipe');
          
          const recipes = recipeFavorites.map(fav => ({
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
          
          return recipes;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_favorite", true)
          .order("favorited_at", { ascending: false });

        if (error) {
          console.error('❌ getFavoriteRecipes: Supabase error:', error);
          throw error;
        }
        
        return data || [];
      } else {
        console.log('🔍 getFavoriteRecipes: Using local storage mode');
        // For local storage, we need to get favorites and then find matching recipes
        const favorites = await this.getLocalFavorites();
        const recipeFavorites = favorites.filter((f) => f.type === "recipe");

        // This is a simplified version - in a real app you'd want to store recipe data
        return recipeFavorites.map((fav) => ({
          id: fav.recipe_id,
          title: fav.title,
          description: fav.description,
          web_address: fav.url || "",
          image_url: fav.image_url,
          ingredients: [],
          directions: [],
          is_favorite: true,
          favorited_at: fav.created_at,
        })) as Recipe[];
      }
    } catch (error) {
      console.error("❌ Error getting favorite recipes:", error);
      return [];
    }
  }

  /**
   * Get favorite URLs
   */
  static async getFavoriteUrls(): Promise<Favorite[]> {
    try {
      const allFavorites = await this.getAllFavorites();
      return allFavorites.filter((f) => f.type === "url");
    } catch (error) {
      console.error("❌ Error getting favorite URLs:", error);
      return [];
    }
  }

  /**
   * Check if a recipe is favorited
   */
  static async isRecipeFavorited(recipeId: number): Promise<boolean> {
    try {
      if (isSupabaseConfigured && supabase) {
        // Get current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          const favorites = await this.getLocalFavorites();
          return favorites.some(f => f.type === 'recipe' && f.recipe_id === recipeId);
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("is_favorite")
          .eq("id", recipeId)
          .eq("user_id", user.id)
          .single();

        if (error) return false;
        return data?.is_favorite || false;
      } else {
        const favorites = await this.getLocalFavorites();
        return favorites.some(
          (f) => f.type === "recipe" && f.recipe_id === recipeId,
        );
      }
    } catch (error) {
      console.error("❌ Error checking if recipe is favorited:", error);
      return false;
    }
  }

  /**
   * Check if a URL is favorited
   */
  static async isUrlFavorited(url: string): Promise<boolean> {
    try {
      const favorites = await this.getAllFavorites();
      return favorites.some((f) => f.type === "url" && f.url === url);
    } catch (error) {
      console.error("❌ Error checking if URL is favorited:", error);
      return false;
    }
  }

  /**
   * Update favorite with notes or tags
   */
  static async updateFavorite(
    favoriteId: number,
    updates: { notes?: string; tags?: string[]; description?: string },
  ): Promise<void> {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from("favorites")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", favoriteId);
        // Production build: console.log removed
      } else {
        await this.updateLocalFavorite(favoriteId, updates);
        // Production build: console.log removed
      }
    } catch (error) {
      console.error("❌ Error updating favorite:", error);
      throw new Error("Failed to update favorite");
    }
  }

  /**
   * Search favorites
   */
  static async searchFavorites(query: string): Promise<Favorite[]> {
    try {
      const allFavorites = await this.getAllFavorites();
      const searchLower = query.toLowerCase();

      return allFavorites.filter(
        (favorite) =>
          favorite.title.toLowerCase().includes(searchLower) ||
          favorite.description?.toLowerCase().includes(searchLower) ||
          favorite.notes?.toLowerCase().includes(searchLower) ||
          favorite.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    } catch (error) {
      console.error("❌ Error searching favorites:", error);
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
      const recipes = favorites.filter((f) => f.type === "recipe");
      const urls = favorites.filter((f) => f.type === "url");

      // Count tag usage
      const tagCounts: { [key: string]: number } = {};
      favorites.forEach((fav) => {
        fav.tags?.forEach((tag) => {
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
        topTags,
      };
    } catch (error) {
      console.error("❌ Error getting favorites stats:", error);
      return {
        totalFavorites: 0,
        recipeCount: 0,
        urlCount: 0,
        topTags: [],
      };
    }
  }

  // Private helper methods for local storage
  private static async getLocalFavorites(): Promise<Favorite[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("❌ Error reading local favorites:", error);
      return [];
    }
  }

  private static async saveLocalFavorites(
    favorites: Favorite[],
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("❌ Error saving local favorites:", error);
    }
  }

  private static async addToLocalFavorites(favorite: Favorite): Promise<void> {
    const favorites = await this.getLocalFavorites();
    favorites.unshift(favorite); // Add to beginning
    await this.saveLocalFavorites(favorites);
  }

  private static async removeFromLocalFavorites(
    type: "recipe" | "url",
    recipeId?: number,
    url?: string,
  ): Promise<void> {
    const favorites = await this.getLocalFavorites();
    const filtered = favorites.filter((fav) => {
      if (type === "recipe") {
        return !(fav.type === "recipe" && fav.recipe_id === recipeId);
      } else {
        return !(fav.type === "url" && fav.url === url);
      }
    });
    await this.saveLocalFavorites(filtered);
  }

  private static async updateLocalFavorite(
    favoriteId: number,
    updates: { notes?: string; tags?: string[]; description?: string },
  ): Promise<void> {
    const favorites = await this.getLocalFavorites();
    const index = favorites.findIndex((f) => f.id === favoriteId);
    if (index !== -1) {
      favorites[index] = {
        ...favorites[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await this.saveLocalFavorites(favorites);
    }
  }

  /**
   * Clear all local favorites (for cleanup/debugging)
   */
  static async clearLocalFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Local favorites cleared');
    } catch (error) {
      console.error('❌ Error clearing local favorites:', error);
    }
  }

  /**
   * Remove duplicate favorites (cleanup method)
   */
  static async removeDuplicateFavorites(): Promise<void> {
    try {
      const favorites = await this.getLocalFavorites();
      const seen = new Set<string>();
      const uniqueFavorites = favorites.filter(fav => {
        const key = fav.type === 'recipe' ? `recipe-${fav.recipe_id}` : `url-${fav.url}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      
      if (uniqueFavorites.length !== favorites.length) {
        await this.saveLocalFavorites(uniqueFavorites);
        console.log(`✅ Removed ${favorites.length - uniqueFavorites.length} duplicate favorites`);
      }
    } catch (error) {
      console.error('❌ Error removing duplicate favorites:', error);
    }
  }
}
