import { Recipe } from '../lib/supabase';

export class WebScrapingAPIService {
  private static readonly SCRAPINGBEE_API_KEY = process.env.EXPO_PUBLIC_SCRAPINGBEE_KEY;
  private static readonly SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY;

  /**
   * Extract recipe using ScrapingBee API with improved timeout settings
   */
  static async extractWithScrapingBee(url: string): Promise<string | null> {
    if (!this.SCRAPINGBEE_API_KEY) {
      console.warn('ScrapingBee API key not configured');
      return null;
    }

    try {
      const apiUrl = `https://app.scrapingbee.com/api/v1/?` + 
        `api_key=${this.SCRAPINGBEE_API_KEY}&` +
        `url=${encodeURIComponent(url)}&` +
        `render_js=true&` +
        `premium_proxy=true&` +
        `wait=5000&` +                    // Wait 5 seconds for page to load
        `timeout=30000`;                  // 30 second total timeout

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second client timeout

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VelvetLadle Recipe App 1.0'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        return html;
      } else {
        const errorText = await response.text();
        console.error('[ScrapingBee] API error:', response.status, response.statusText, errorText);
        return null;
      }
    } catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[ScrapingBee] Request timed out after 35 seconds');
      } else {
        console.error('[ScrapingBee] API error:', error?.message || error);
      }
      return null;
    }
  }

  /**
   * Search recipes using Spoonacular API
   */
  static async searchRecipesSpoonacular(query: string): Promise<Recipe[]> {
    if (!this.SPOONACULAR_API_KEY) {
      console.warn('Spoonacular API key not configured');
      return [];
    }

    try {
      const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?` +
        `apiKey=${this.SPOONACULAR_API_KEY}&` +
        `query=${encodeURIComponent(query)}&` +
        `addRecipeInformation=true&` +
        `instructionsRequired=true&` +
        `fillIngredients=true&` +
        `number=10`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      return data.results?.map((recipe: any) => ({
        title: recipe.title,
        ingredients: recipe.extendedIngredients?.map((ing: any) => ing.original) || [],
        directions: recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || [],
        servings: recipe.servings,
        prep_time: `Prep Time ${recipe.preparationMinutes || 0}M`,
        cook_time: `Cook Time${recipe.cookingMinutes || 0}M`,
        total_time: `Total Time ${recipe.readyInMinutes || 0}M`,
        image_url: recipe.image,
        description: recipe.summary?.replace(/<[^>]*>/g, ''), // Remove HTML tags
        web_address: recipe.sourceUrl || 'spoonacular-api',
        cuisine_type: recipe.cuisines?.[0],
        nutritional_info: recipe.nutrition ? {
          calories: recipe.nutrition.nutrients?.find((n: any) => n.name === 'Calories')?.amount,
          protein: recipe.nutrition.nutrients?.find((n: any) => n.name === 'Protein')?.amount,
          carbs: recipe.nutrition.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount,
          fat: recipe.nutrition.nutrients?.find((n: any) => n.name === 'Fat')?.amount,
        } : undefined,
      })) || [];
    } catch (error) {
      console.error('Spoonacular API error:', error);
      return [];
    }
  }

  /**
   * Extract recipe from URL using Spoonacular
   */
  static async extractRecipeSpoonacular(url: string): Promise<Recipe | null> {
    if (!this.SPOONACULAR_API_KEY) {
      console.warn('[Spoonacular] API key not configured');
      return null;
    }

    try {
      const apiUrl = `https://api.spoonacular.com/recipes/extract?` +
        `apiKey=${this.SPOONACULAR_API_KEY}&` +
        `url=${encodeURIComponent(url)}&` +
        `forceExtraction=true`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Spoonacular] API error:`, response.status, response.statusText, errorText);
        return null;
      }
      const recipe = await response.json();

      if (!recipe || !recipe.id) {
        console.error('[Spoonacular] No recipe found or missing ID in response:', recipe);
        return null;
      }

      // Map Spoonacular nutrition to app's nutritional_info format (with units)
      const getNutrient = (name: string, unit: string): string | undefined => {
        const n = recipe.nutrition?.nutrients?.find((nutrient: any) => nutrient.name === name);
        if (!n || n.amount == null) return undefined;
        return `${parseFloat(n.amount).toFixed(1)}${unit}`;
      };
      const result: Recipe = {
        title: recipe.title,
        ingredients: recipe.extendedIngredients?.map((ing: any) => ing.original) || [],
        directions: recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || [],
        servings: recipe.servings,
        prep_time: `PT${recipe.preparationMinutes || 0}M`,
        cook_time: `PT${recipe.cookingMinutes || 0}M`,
        total_time: `PT${recipe.readyInMinutes || 0}M`,
        image_url: recipe.image,
        description: recipe.summary?.replace(/<[^>]*>/g, ''),
        web_address: url,
        cuisine_type: recipe.cuisines?.[0],
        nutritional_info: recipe.nutrition ? {
          calories: recipe.nutrition.nutrients?.find((n: any) => n.name === 'Calories')?.amount ? Math.round(recipe.nutrition.nutrients.find((n: any) => n.name === 'Calories').amount) : undefined,
          protein: getNutrient('Protein', 'g'),
          carbs: getNutrient('Carbohydrates', 'g'),
          fat: getNutrient('Fat', 'g'),
          sugar: getNutrient('Sugar', 'g'),
          fiber: getNutrient('Fiber', 'g'),
          sodium: getNutrient('Sodium', 'mg'),
        } : undefined,
      };
      
      // Fallback: Parse nutrition from description text if structured data not available
      if (!result.nutritional_info && recipe.summary) {
        // Production build: console.log removed
        // Production build: console.log removed);
        const nutritionFromText = this.parseNutritionFromText(recipe.summary);
        if (nutritionFromText) {
          result.nutritional_info = nutritionFromText;
          // Production build: console.log removed
        } else {
          // Production build: console.log removed
        }
        
        // Also try to extract cook time from description
        const timeMatch = recipe.summary.match(/(?:in|around|about)\s+(?:around\s+)?(\d+)\s*minutes?/i);
        if (timeMatch && (!result.total_time || result.total_time === 'PT0M')) {
          result.total_time = `PT${timeMatch[1]}M`;
          // Production build: console.log removed
        }
      } else {
        // Production build: console.log removed
      }
      
      // Check for critical fields - only title and ingredients are required
      // Directions can be added manually later
      if (!result.title || !result.ingredients.length) {
        console.error('[Spoonacular] Incomplete recipe data (missing title or ingredients):', result);
        return null;
      }
      
      // Warn if directions are missing but still return the recipe
      if (!result.directions.length) {
        console.warn('[Spoonacular] Recipe extracted without directions - can be added manually');
      }
      
      return result;
    } catch (error: any) {
      console.error('[Spoonacular] Extract error:', error?.message || error);
      return null;
    }
  }

  /**
   * Enhanced recipe extraction with API fallbacks
   */
  static async extractRecipeWithAPIs(url: string): Promise<Recipe | null> {
    // Try Spoonacular recipe extraction first (most reliable for recipes)
    let spoonacularRecipe: Recipe | null = null;
    try {
      spoonacularRecipe = await this.extractRecipeSpoonacular(url);
    } catch (e: any) {
      console.error('[extractRecipeWithAPIs] Spoonacular extraction failed:', e?.message || e);
    }
    if (spoonacularRecipe) {
      return spoonacularRecipe;
    }

    // Fallback to ScrapingBee for general web scraping
    let html: string | null = null;
    try {
      html = await this.extractWithScrapingBee(url);
    } catch (e: any) {
      console.error('[extractRecipeWithAPIs] ScrapingBee extraction failed:', e?.message || e);
    }
    if (html) {
      try {
        const { RecipeExtractor } = await import('./recipeExtractor');
        // Try JSON-LD extraction on ScrapingBee HTML
        const jsonLdRecipe = RecipeExtractor.extractFromJsonLd(html);
        if (jsonLdRecipe && jsonLdRecipe.title && jsonLdRecipe.ingredients && jsonLdRecipe.ingredients.length > 0) {
          return { ...jsonLdRecipe, web_address: url } as Recipe;
        }
        // Try other extraction methods
        const microdataRecipe = RecipeExtractor.extractFromMicrodata(html);
        if (microdataRecipe && microdataRecipe.title && microdataRecipe.ingredients && microdataRecipe.ingredients.length > 0) {
          return { ...microdataRecipe, web_address: url } as Recipe;
        }
      } catch (e: any) {
        console.error('[extractRecipeWithAPIs] Error in HTML extraction:', e?.message || e);
      }
    }
    console.error('[extractRecipeWithAPIs] All extraction methods failed for URL:', url);
    return null;
  }

  /**
   * Parse nutrition information from description text
   */
  private static parseNutritionFromText(text: string): any {
    if (!text) return null;
    
    const nutrition: any = {};
    
    // Extract calories (e.g., "652 calories")
    const caloriesMatch = text.match(/(\d+)\s*calories/i);
    if (caloriesMatch) {
      nutrition.calories = parseInt(caloriesMatch[1]);
    }
    
    // Extract protein (e.g., "19g of protein")
    const proteinMatch = text.match(/(\d+)g\s*of\s*protein/i);
    if (proteinMatch) {
      nutrition.protein = proteinMatch[1] + 'g';
    }
    
    // Extract fat (e.g., "32g of fat")
    const fatMatch = text.match(/(\d+)g\s*of\s*fat/i);
    if (fatMatch) {
      nutrition.fat = fatMatch[1] + 'g';
    }
    
    // Extract carbs (e.g., "45g of carbohydrates" or "45g of carbs")
    const carbsMatch = text.match(/(\d+)g\s*of\s*carb(?:ohydrate)?s?/i);
    if (carbsMatch) {
      nutrition.carbs = carbsMatch[1] + 'g';
    }
    
    return Object.keys(nutrition).length > 0 ? nutrition : null;
  }
}
