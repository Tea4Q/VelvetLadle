import { Recipe } from '../lib/supabase';

export class WebScrapingAPIService {
  private static readonly SCRAPINGBEE_API_KEY = process.env.EXPO_PUBLIC_SCRAPINGBEE_KEY;
  private static readonly SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY;

  /**
   * Extract recipe using ScrapingBee API
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
        `premium_proxy=true`;

      const response = await fetch(apiUrl);
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      console.error('ScrapingBee API error:', error);
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
        prep_time: `PT${recipe.preparationMinutes || 0}M`,
        cook_time: `PT${recipe.cookingMinutes || 0}M`,
        total_time: `PT${recipe.readyInMinutes || 0}M`,
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
      console.warn('Spoonacular API key not configured');
      return null;
    }

    try {
      const apiUrl = `https://api.spoonacular.com/recipes/extract?` +
        `apiKey=${this.SPOONACULAR_API_KEY}&` +
        `url=${encodeURIComponent(url)}&` +
        `forceExtraction=true`;

      const response = await fetch(apiUrl);
      const recipe = await response.json();

      if (recipe.id) {
        return {
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
        };
      }
      return null;
    } catch (error) {
      console.error('Spoonacular extract error:', error);
      return null;
    }
  }

  /**
   * Enhanced recipe extraction with API fallbacks
   */
  static async extractRecipeWithAPIs(url: string): Promise<Recipe | null> {
    console.log('Attempting recipe extraction with APIs for:', url);

    // Try Spoonacular recipe extraction first (most reliable for recipes)
    const spoonacularRecipe = await this.extractRecipeSpoonacular(url);
    if (spoonacularRecipe) {
      console.log('✅ Extracted recipe using Spoonacular API');
      return spoonacularRecipe;
    }

    // Fallback to ScrapingBee for general web scraping
    const html = await this.extractWithScrapingBee(url);
    if (html) {
      console.log('✅ Fetched HTML using ScrapingBee, parsing...');
      // Use your existing RecipeExtractor logic on the HTML
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
    }

    console.log('❌ All API extraction methods failed');
    return null;
  }
}
