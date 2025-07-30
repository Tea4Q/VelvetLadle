import { Recipe } from '../lib/supabase';
import { CorsProxyService } from './corsProxyService';
import { WebScrapingAPIService } from './webScrapingAPIService';

export class RecipeExtractor {
  static async extractRecipeFromUrl(url: string): Promise<Recipe | null> {
    try {
      console.log('Fetching recipe from URL:', url);
      
      // Validate URL format first
      if (!this.isValidUrl(url)) {
        console.error('Invalid URL format:', url);
        return null;
      }

      // Try API-based extraction first (more reliable)
      const apiRecipe = await WebScrapingAPIService.extractRecipeWithAPIs(url);
      if (apiRecipe) {
        console.log('✅ Recipe extracted using API services');
        return apiRecipe;
      }
      
      // Fallback to CORS proxy method
      console.log('📡 Falling back to CORS proxy extraction...');
      const response = await CorsProxyService.fetchWithCorsProxy(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Try to extract JSON-LD structured data first (most reliable)
      const jsonLdRecipe = this.extractFromJsonLd(html);
      if (jsonLdRecipe && jsonLdRecipe.title && jsonLdRecipe.ingredients && jsonLdRecipe.ingredients.length > 0) {
        return { ...jsonLdRecipe, web_address: url } as Recipe;
      }
      
      // Fallback to microdata extraction
      const microdataRecipe = this.extractFromMicrodata(html);
      if (microdataRecipe && microdataRecipe.title && microdataRecipe.ingredients && microdataRecipe.ingredients.length > 0) {
        return { ...microdataRecipe, web_address: url } as Recipe;
      }
      
      // Last resort: manual extraction from common HTML patterns
      const manualRecipe = this.extractManually(html);
      if (manualRecipe && manualRecipe.title && manualRecipe.ingredients && manualRecipe.ingredients.length > 0) {
        return { ...manualRecipe, web_address: url } as Recipe;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting recipe:', error);
      return null;
    }
  }
  
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  static extractFromJsonLd(html: string): Partial<Recipe> | null {
    try {
      // Find JSON-LD script tags using regex
      const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
      let match;
      
      while ((match = scriptRegex.exec(html)) !== null) {
        try {
          const content = match[1].trim();
          const data = JSON.parse(content);
          
          // Handle array of structured data
          const recipes = Array.isArray(data) ? data : [data];
          
          for (const item of recipes) {
            if (item['@type'] === 'Recipe' || item.type === 'Recipe') {
              return this.parseJsonLdRecipe(item);
            }
          }
        } catch (parseError) {
          console.log('Failed to parse JSON-LD script:', parseError);
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
      return null;
    }
  }
  
  static parseJsonLdRecipe(data: any): Partial<Recipe> {
    const recipe: Partial<Recipe> = {
      title: data.name || '',
      ingredients: [],
      directions: [],
    };
    
    // Extract ingredients
    if (data.recipeIngredient) {
      recipe.ingredients = Array.isArray(data.recipeIngredient) 
        ? data.recipeIngredient 
        : [data.recipeIngredient];
    }
    
    // Extract directions
    if (data.recipeInstructions) {
      recipe.directions = data.recipeInstructions.map((instruction: any) => {
        if (typeof instruction === 'string') return instruction;
        return instruction.text || instruction.name || '';
      }).filter((dir: string) => dir.length > 0);
    }
    
    // Extract servings
    if (data.recipeYield) {
      const yield_ = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
      recipe.servings = parseInt(yield_.toString()) || undefined;
    }
    
    // Extract times
    if (data.prepTime) recipe.prep_time = data.prepTime;
    if (data.cookTime) recipe.cook_time = data.cookTime;
    if (data.totalTime) recipe.total_time = data.totalTime;
    
    // Extract nutritional information
    if (data.nutrition) {
      recipe.nutritional_info = {
        calories: data.nutrition.calories ? parseInt(data.nutrition.calories) : undefined,
        protein: data.nutrition.proteinContent,
        carbs: data.nutrition.carbohydrateContent,
        fat: data.nutrition.fatContent,
        fiber: data.nutrition.fiberContent,
        sugar: data.nutrition.sugarContent,
      };
    }
    
    // Extract other metadata
    if (data.image) {
      recipe.image_url = Array.isArray(data.image) ? data.image[0].url || data.image[0] : data.image.url || data.image;
    }
    
    if (data.description) recipe.description = data.description;
    if (data.recipeCategory) recipe.cuisine_type = data.recipeCategory;
    
    return recipe;
  }
  
  static extractFromMicrodata(html: string): Partial<Recipe> | null {
    try {
      // Look for schema.org/Recipe microdata using regex
      const recipeRegex = /itemtype=["'][^"']*schema\.org\/Recipe["'][^>]*>(.*?)<\/[^>]+>/gis;
      const match = recipeRegex.exec(html);
      
      if (!match) return null;
      
      const recipeSection = match[1];
      
      const recipe: Partial<Recipe> = {
        title: '',
        ingredients: [],
        directions: [],
      };
      
      // Extract title
      const titleMatch = recipeSection.match(/itemprop=["']name["'][^>]*>([^<]+)</i);
      if (titleMatch) recipe.title = titleMatch[1].trim();
      
      // Extract ingredients
      const ingredientMatches = recipeSection.match(/itemprop=["']recipeIngredient["'][^>]*>([^<]+)/gi);
      if (ingredientMatches) {
        recipe.ingredients = ingredientMatches.map(match => {
          const content = match.match(/>([^<]+)/);
          return content ? content[1].trim() : '';
        }).filter(text => text.length > 0);
      }
      
      // Extract directions
      const directionMatches = recipeSection.match(/itemprop=["']recipeInstructions["'][^>]*>([^<]+)/gi);
      if (directionMatches) {
        recipe.directions = directionMatches.map(match => {
          const content = match.match(/>([^<]+)/);
          return content ? content[1].trim() : '';
        }).filter(text => text.length > 0);
      }
      
      return recipe.title && recipe.ingredients && recipe.ingredients.length > 0 ? recipe : null;
    } catch (error) {
      console.error('Error extracting microdata:', error);
      return null;
    }
  }
  
  static extractManually(html: string): Partial<Recipe> | null {
    try {
      const recipe: Partial<Recipe> = {
        title: '',
        ingredients: [],
        directions: [],
      };
      
      // Extract title using common patterns
      const titlePatterns = [
        /<h1[^>]*class="[^"]*recipe-title[^"]*"[^>]*>([^<]+)</i,
        /<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)</i,
        /<h1[^>]*>([^<]+)</i,
        /<title>([^<]+)</i
      ];
      
      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1].trim()) {
          recipe.title = match[1].trim().replace(/\s+/g, ' ');
          break;
        }
      }
      
      // Extract ingredients using common patterns
      const ingredientPatterns = [
        /<[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)/gi,
        /<li[^>]*>(?:<[^>]*>)*([^<]*(?:cup|tablespoon|teaspoon|pound|ounce|gram|ml|liter)[^<]*)</gi,
        /<p[^>]*>([^<]*(?:cup|tablespoon|teaspoon|pound|ounce|gram|ml|liter)[^<]*)</gi
      ];
      
      for (const pattern of ingredientPatterns) {
        const matches = Array.from(html.matchAll(pattern));
        if (matches.length > 0) {
          recipe.ingredients = matches.map(match => match[1].trim()).filter(text => text.length > 3);
          if (recipe.ingredients.length > 0) break;
        }
      }
      
      // Extract directions using common patterns
      const directionPatterns = [
        /<[^>]*class="[^"]*instruction[^"]*"[^>]*>([^<]+)/gi,
        /<[^>]*class="[^"]*direction[^"]*"[^>]*>([^<]+)/gi,
        /<[^>]*class="[^"]*step[^"]*"[^>]*>([^<]+)/gi
      ];
      
      for (const pattern of directionPatterns) {
        const matches = Array.from(html.matchAll(pattern));
        if (matches.length > 0) {
          recipe.directions = matches.map(match => match[1].trim()).filter(text => text.length > 10);
          if (recipe.directions.length > 0) break;
        }
      }
      
      return recipe.title && recipe.ingredients && recipe.ingredients.length > 0 ? recipe : null;
    } catch (error) {
      console.error('Error in manual extraction:', error);
      return null;
    }
  }
  
  static isRecipePage(url: string, html?: string): boolean {
    // Check URL patterns
    const recipeUrlPatterns = [
      /recipe/i,
      /cooking/i,
      /food/i,
      /kitchen/i,
      /allrecipes\.com/i,
      /foodnetwork\.com/i,
      /epicurious\.com/i,
      /delish\.com/i,
      /tasty\.co/i,
      /tasteofhome\.com/i
    ];
    
    const hasRecipeUrl = recipeUrlPatterns.some(pattern => pattern.test(url));
    
    if (html) {
      // Check for recipe-specific content
      const recipeIndicators = [
        /"@type":\s*"Recipe"/i,
        /itemtype=".*schema\.org\/Recipe"/i,
        /class=".*recipe.*"/i,
        /class=".*ingredient.*"/i,
        /class=".*instruction.*"/i,
        /recipe-ingredients/i,
        /recipe-instructions/i
      ];
      
      const hasRecipeContent = recipeIndicators.some(pattern => pattern.test(html));
      return hasRecipeUrl || hasRecipeContent;
    }
    
    return hasRecipeUrl;
  }
}
