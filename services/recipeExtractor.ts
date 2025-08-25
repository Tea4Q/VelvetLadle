import { Recipe } from '../lib/supabase';
import { CorsProxyService } from './corsProxyService';
import { WebScrapingAPIService } from './webScrapingAPIService';

export class RecipeExtractor {
  static async extractRecipeFromUrl(url: string): Promise<Recipe | null> {
    try {
      // Production build: console.log removed
      
      // Validate URL format first
      if (!this.isValidUrl(url)) {
        console.error('❌ Invalid Website format:', url);
        return null;
      }

      // Strategy 1: Try API-based extraction first (most reliable)
      // Production build: console.log removed
      try {
        const apiRecipe = await Promise.race([
          WebScrapingAPIService.extractRecipeWithAPIs(url),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), 45000)
          )
        ]);
        
        if (apiRecipe) {
          // Production build: console.log removed
          return apiRecipe;
        }
      } catch (error) {
        // Production build: console.log removed
      }
      
      // Strategy 2: Fallback to CORS proxy method
      // Production build: console.log removed
      try {
        const response = await Promise.race([
          CorsProxyService.fetchWithCorsProxy(url),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('CORS proxy timeout')), 30000)
          )
        ]);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        // Production build: console.log removed');
        
        // Try to extract JSON-LD structured data first (most reliable)
        const jsonLdRecipe = this.extractFromJsonLd(html);
        if (jsonLdRecipe && jsonLdRecipe.title && jsonLdRecipe.ingredients && jsonLdRecipe.ingredients.length > 0) {
          // Production build: console.log removed
          const recipeWithImage = { ...jsonLdRecipe, web_address: url } as Recipe;
          // Ensure we have an image
          if (!recipeWithImage.image_url) {
            recipeWithImage.image_url = this.extractImageFromHtml(html, url);
          }
          // Production build: console.log removed
          return recipeWithImage;
        }
        
        // Fallback to microdata extraction
        const microdataRecipe = this.extractFromMicrodata(html);
        if (microdataRecipe && microdataRecipe.title && microdataRecipe.ingredients && microdataRecipe.ingredients.length > 0) {
          // Production build: console.log removed
          const recipeWithImage = { ...microdataRecipe, web_address: url } as Recipe;
          // Ensure we have an image
          if (!recipeWithImage.image_url) {
            recipeWithImage.image_url = this.extractImageFromHtml(html, url);
          }
          // Production build: console.log removed
          return recipeWithImage;
        }
        
        // Last resort: manual extraction from common HTML patterns
        const manualRecipe = this.extractManually(html, url);
        if (manualRecipe && manualRecipe.title && manualRecipe.ingredients && manualRecipe.ingredients.length > 0) {
          // Production build: console.log removed
          const recipeWithImage = { ...manualRecipe, web_address: url } as Recipe;
          // Ensure we have an image
          if (!recipeWithImage.image_url) {
            recipeWithImage.image_url = this.extractImageFromHtml(html, url);
          }
          // Production build: console.log removed
          return recipeWithImage;
        }
        
      } catch (error) {
        // Production build: console.log removed
      }
      
      // Production build: console.log removed
      return null;
      
    } catch (error) {
      console.error('💥 Critical error during recipe extraction:', error);
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
          // Production build: console.log removed
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
      return null;
    }
  }
  
  static extractImageFromHtml(html: string, baseUrl: string): string | undefined {
    try {
      // Production build: console.log removed
      
      // Priority 1: Look for recipe-specific image patterns
      const recipeImagePatterns = [
        // Recipe card images
        /<img[^>]*class="[^"]*recipe-card[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*recipe-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*recipe-photo[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*featured-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*hero-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*entry-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*post-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        
        // Microdata images
        /<img[^>]*itemprop=["']image["'][^>]*src=["']([^"']+)["']/i,
        
        // Open Graph images
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        
        // Twitter card images
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
        
        // General article images
        /<img[^>]*class="[^"]*article-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        /<img[^>]*class="[^"]*main-image[^"]*"[^>]*src=["']([^"']+)["']/i,
        
        // Data attributes (common in modern websites)
        /<img[^>]*data-src=["']([^"']+)["']/i,
        /<img[^>]*data-lazy=["']([^"']+)["']/i,
        /<img[^>]*data-original=["']([^"']+)["']/i,
      ];
      
      for (const pattern of recipeImagePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const imageUrl = this.normalizeImageUrl(match[1], baseUrl);
          if (this.isValidImageUrl(imageUrl)) {
            // Production build: console.log removed
            return imageUrl;
          }
        }
      }
      
      // Priority 2: Look for any large images in the content area
      const contentImagePattern = /<img[^>]*src=["']([^"']+)["'][^>]*(?:width=["'](\d+)["']|height=["'](\d+)["'])?[^>]*>/gi;
      const imageMatches = Array.from(html.matchAll(contentImagePattern));
      
      // Filter and score images
      const candidateImages = imageMatches
        .map(match => ({
          url: this.normalizeImageUrl(match[1], baseUrl),
          width: parseInt(match[2] || '0'),
          height: parseInt(match[3] || '0'),
          score: this.scoreImageRelevance(match[0], match[1])
        }))
        .filter(img => this.isValidImageUrl(img.url))
        .sort((a, b) => b.score - a.score);
      
      if (candidateImages.length > 0) {
        // Production build: console.log removed
        return candidateImages[0].url;
      }
      
      // Production build: console.log removed
      return undefined;
      
    } catch (error) {
      console.error('Error extracting image:', error);
      return undefined;
    }
  }
  
  static normalizeImageUrl(imageUrl: string, baseUrl: string): string {
    try {
      // If it's already a full URL, return it
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // If it starts with //, add protocol
      if (imageUrl.startsWith('//')) {
        const baseProtocol = new URL(baseUrl).protocol;
        return `${baseProtocol}${imageUrl}`;
      }
      
      // If it's a relative URL, resolve it against the base URL
      const base = new URL(baseUrl);
      return new URL(imageUrl, base).toString();
    } catch {
      return imageUrl;
    }
  }
  
  static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      // Check for valid image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
      
      // Check for image-like query parameters (common in CDNs)
      const hasImageParams = urlObj.search.includes('format=') || 
                            urlObj.search.includes('w=') || 
                            urlObj.search.includes('width=') ||
                            urlObj.search.includes('h=') ||
                            urlObj.search.includes('height=');
      
      // Exclude common non-recipe images
      const excludePatterns = [
        'logo', 'icon', 'avatar', 'profile', 'social', 
        'banner', 'ad', 'advertisement', 'sponsor',
        'placeholder', 'default', '1x1', 'pixel'
      ];
      
      const hasExcludedPattern = excludePatterns.some(pattern => 
        pathname.includes(pattern) || urlObj.search.includes(pattern)
      );
      
      return (hasImageExtension || hasImageParams) && !hasExcludedPattern;
    } catch {
      return false;
    }
  }
  
  static scoreImageRelevance(imgTag: string, src: string): number {
    let score = 0;
    const tag = imgTag.toLowerCase();
    const url = src.toLowerCase();
    
    // Positive indicators
    if (tag.includes('recipe') || url.includes('recipe')) score += 100;
    if (tag.includes('food') || url.includes('food')) score += 80;
    if (tag.includes('dish') || url.includes('dish')) score += 70;
    if (tag.includes('featured') || url.includes('featured')) score += 60;
    if (tag.includes('hero') || url.includes('hero')) score += 50;
    if (tag.includes('main') || url.includes('main')) score += 40;
    if (tag.includes('large') || url.includes('large')) score += 30;
    
    // Size indicators (width/height attributes)
    const widthMatch = tag.match(/width=["'](\d+)["']/);
    const heightMatch = tag.match(/height=["'](\d+)["']/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1]);
      if (width >= 400) score += 20;
      if (width >= 600) score += 30;
    }
    if (heightMatch) {
      const height = parseInt(heightMatch[1]);
      if (height >= 300) score += 20;
      if (height >= 400) score += 30;
    }
    
    // Negative indicators
    if (tag.includes('logo') || url.includes('logo')) score -= 50;
    if (tag.includes('icon') || url.includes('icon')) score -= 40;
    if (tag.includes('avatar') || url.includes('avatar')) score -= 40;
    if (tag.includes('ad') || url.includes('ad')) score -= 60;
    if (tag.includes('banner') || url.includes('banner')) score -= 30;
    if (tag.includes('thumb') || url.includes('thumb')) score -= 20;
    
    return score;
  }

  private static extractNutritionFromHtml(html: string): any {
    try {
      const nutrition: any = {};

      // Extract calories
      const caloriesMatch = html.match(/(\d+)\s*calories?/gi);
      if (caloriesMatch && caloriesMatch[0]) {
        const calories = parseInt(caloriesMatch[0].match(/\d+/)?.[0] || '0');
        if (calories > 0 && calories < 5000) { // Reasonable calorie range
          nutrition.calories = calories;
        }
      }

      // Extract protein
      const proteinMatch = html.match(/(\d+)g?\s*protein/gi);
      if (proteinMatch && proteinMatch[0]) {
        const protein = parseInt(proteinMatch[0].match(/\d+/)?.[0] || '0');
        if (protein > 0 && protein < 200) { // Reasonable protein range
          nutrition.protein = protein + 'g';
        }
      }

      // Extract carbohydrates
      const carbMatch = html.match(/(\d+)g?\s*carb(?:ohydrate)?s?/gi);
      if (carbMatch && carbMatch[0]) {
        const carbs = parseInt(carbMatch[0].match(/\d+/)?.[0] || '0');
        if (carbs > 0 && carbs < 500) { // Reasonable carb range
          nutrition.carbs = carbs + 'g';
        }
      }

      // Extract fat
      const fatMatch = html.match(/(\d+)g?\s*fat/gi);
      if (fatMatch && fatMatch[0]) {
        const fat = parseInt(fatMatch[0].match(/\d+/)?.[0] || '0');
        if (fat > 0 && fat < 200) { // Reasonable fat range
          nutrition.fat = fat + 'g';
        }
      }

      // Extract fiber
      const fiberMatch = html.match(/(\d+)g?\s*fiber/gi);
      if (fiberMatch && fiberMatch[0]) {
        const fiber = parseInt(fiberMatch[0].match(/\d+/)?.[0] || '0');
        if (fiber > 0 && fiber < 100) { // Reasonable fiber range
          nutrition.fiber = fiber + 'g';
        }
      }

      // Extract sugar
      const sugarMatch = html.match(/(\d+)g?\s*sugar/gi);
      if (sugarMatch && sugarMatch[0]) {
        const sugar = parseInt(sugarMatch[0].match(/\d+/)?.[0] || '0');
        if (sugar > 0 && sugar < 200) { // Reasonable sugar range
          nutrition.sugar = sugar + 'g';
        }
      }

      // Extract sodium
      const sodiumMatch = html.match(/(\d+)mg?\s*sodium/gi);
      if (sodiumMatch && sodiumMatch[0]) {
        const sodium = parseInt(sodiumMatch[0].match(/\d+/)?.[0] || '0');
        if (sodium > 0 && sodium < 5000) { // Reasonable sodium range
          nutrition.sodium = sodium;
        }
      }

      return Object.keys(nutrition).length > 0 ? nutrition : null;
    } catch (error) {
      console.error('Error extracting nutrition from HTML:', error);
      return null;
    }
  }

  private static extractCuisineFromHtml(html: string): string | null {
    try {
      // Production build: console.log removed
      
      // Priority 1: Look for specific cuisine/category meta tags
      const metaCuisinePatterns = [
        // Open Graph cuisine/category
        /<meta[^>]*property=["']og:cuisine["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*property=["']og:category["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*property=["']recipe:category["'][^>]*content=["']([^"']+)["']/i,
        
        // Twitter card cuisine
        /<meta[^>]*name=["']twitter:cuisine["'][^>]*content=["']([^"']+)["']/i,
        
        // Recipe-specific meta tags
        /<meta[^>]*name=["']recipe-category["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*name=["']cuisine["'][^>]*content=["']([^"']+)["']/i,
      ];
      
      for (const pattern of metaCuisinePatterns) {
        const match = html.match(pattern);
        if (match && match[1] && this.isValidCuisine(match[1])) {
          // Production build: console.log removed
          return this.normalizeCuisine(match[1]);
        }
      }
      
      // Priority 2: Look for cuisine in structured data that might not be JSON-LD
      const structuredPatterns = [
        /<[^>]*class="[^"]*recipe-category[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*cuisine[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)/i,
        /<[^>]*class="[^"]*recipe-cuisine[^"]*"[^>]*>([^<]+)/i,
      ];
      
      for (const pattern of structuredPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && this.isValidCuisine(match[1])) {
          // Production build: console.log removed
          return this.normalizeCuisine(match[1]);
        }
      }
      
      // Priority 3: Look for cuisine keywords in title, headings, and breadcrumbs
      const contextPatterns = [
        // Breadcrumb patterns
        /<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)<\/nav>/is,
        /<ol[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)<\/ol>/is,
        
        // Title and heading patterns
        /<title>([^<]+)</i,
        /<h1[^>]*>([^<]+)</i,
        /<h2[^>]*>([^<]+)</i,
      ];
      
      for (const pattern of contextPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const extractedCuisine = this.extractCuisineFromText(match[1]);
          if (extractedCuisine) {
            // Production build: console.log removed
            return extractedCuisine;
          }
        }
      }
      
      // Production build: console.log removed
      return null;
      
    } catch (error) {
      console.error('Error extracting cuisine:', error);
      return null;
    }
  }
  
  static extractCuisineFromText(text: string): string | undefined {
    if (!text || typeof text !== 'string') return undefined;
    
    const normalized = text.toLowerCase();
    
    // Known cuisine keywords with priority order
    const cuisineKeywords = [
      { keyword: 'italian', cuisine: 'Italian' },
      { keyword: 'chinese', cuisine: 'Chinese' },
      { keyword: 'mexican', cuisine: 'Mexican' },
      { keyword: 'indian', cuisine: 'Indian' },
      { keyword: 'thai', cuisine: 'Thai' },
      { keyword: 'japanese', cuisine: 'Japanese' },
      { keyword: 'french', cuisine: 'French' },
      { keyword: 'mediterranean', cuisine: 'Mediterranean' },
      { keyword: 'american', cuisine: 'American' },
      { keyword: 'greek', cuisine: 'Greek' },
      { keyword: 'korean', cuisine: 'Korean' },
      { keyword: 'vietnamese', cuisine: 'Vietnamese' },
      { keyword: 'spanish', cuisine: 'Spanish' },
      { keyword: 'moroccan', cuisine: 'Moroccan' },
      { keyword: 'lebanese', cuisine: 'Lebanese' },
      { keyword: 'turkish', cuisine: 'Turkish' },
      { keyword: 'german', cuisine: 'German' },
      { keyword: 'british', cuisine: 'British' },
      { keyword: 'caribbean', cuisine: 'Caribbean' },
      { keyword: 'brazilian', cuisine: 'Brazilian' },
      { keyword: 'peruvian', cuisine: 'Peruvian' },
      { keyword: 'ethiopian', cuisine: 'Ethiopian' },
      { keyword: 'russian', cuisine: 'Russian' },
      { keyword: 'scandinavian', cuisine: 'Scandinavian' },
      { keyword: 'middle eastern', cuisine: 'Middle Eastern' },
      { keyword: 'asian', cuisine: 'Asian' },
      { keyword: 'european', cuisine: 'European' },
      { keyword: 'african', cuisine: 'African' },
      { keyword: 'latin', cuisine: 'Latin' },
    ];
    
    // Find the first matching cuisine keyword
    for (const { keyword, cuisine } of cuisineKeywords) {
      if (normalized.includes(keyword)) {
        return cuisine;
      }
    }
    
    return undefined;
  }
  
  static isValidCuisine(cuisine: string): boolean {
    if (!cuisine || typeof cuisine !== 'string') return false;
    
    const trimmed = cuisine.trim();
    if (trimmed.length < 3 || trimmed.length > 50) return false;
    
    // Exclude common non-cuisine terms
    const excludeTerms = [
      'recipe', 'recipes', 'cooking', 'food', 'kitchen', 'chef',
      'dish', 'meal', 'dinner', 'lunch', 'breakfast', 'dessert',
      'appetizer', 'main', 'side', 'snack', 'drink', 'beverage',
      'blog', 'website', 'home', 'page', 'category', 'tag'
    ];
    
    const normalized = trimmed.toLowerCase();
    return !excludeTerms.some(term => normalized.includes(term));
  }
  
  static normalizeCuisine(cuisine: string): string {
    if (!cuisine) return '';
    
    return cuisine.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
      // Always store the original string
      recipe.recipe_yield = yield_.toString();
      // Improved number parsing: extract first number in the string
      const match = yield_.toString().match(/\d+(?:\.\d+)?/);
      if (match) {
        recipe.servings = parseFloat(match[0]);
      } else {
        recipe.servings = undefined;
      }
    }
    
    // Extract times
    if (data.prepTime) recipe.prep_time = data.prepTime;
    if (data.cookTime) recipe.cook_time = data.cookTime;
    if (data.totalTime) recipe.total_time = data.totalTime;
    
    // Extract nutritional information
    if (data.nutrition) {
      recipe.nutritional_info = {
        calories: data.nutrition.calories ? parseInt(data.nutrition.calories.toString()) : undefined,
        protein: data.nutrition.proteinContent || data.nutrition.protein,
        carbs: data.nutrition.carbohydrateContent || data.nutrition.carbs || data.nutrition.carbohydrates,
        fat: data.nutrition.fatContent || data.nutrition.fat || data.nutrition.totalFat,
        fiber: data.nutrition.fiberContent || data.nutrition.fiber || data.nutrition.dietaryFiber,
        sugar: data.nutrition.sugarContent || data.nutrition.sugar || data.nutrition.sugars,
      };
      
      // Clean up nutritional values to remove extra text
      if (recipe.nutritional_info) {
        const cleaned = { ...recipe.nutritional_info };
        Object.keys(cleaned).forEach(key => {
          const value = cleaned[key as keyof typeof cleaned];
          if (typeof value === 'string') {
            // Extract numeric value and unit from strings like "25g", "150 calories", etc.
            const cleanValue = value.replace(/[^\d.gGmMcC\s]/g, '').trim();
            if (cleanValue && key !== 'calories') {
              (cleaned as any)[key] = cleanValue;
            }
          }
        });
        recipe.nutritional_info = cleaned;
      }
    }
    
    // Extract other metadata
    if (data.image) {
      // Handle various image formats in JSON-LD
      if (Array.isArray(data.image)) {
        // Take the first image if it's an array
        const firstImage = data.image[0];
        if (typeof firstImage === 'string') {
          recipe.image_url = firstImage;
        } else if (firstImage && firstImage.url) {
          recipe.image_url = firstImage.url;
        } else if (firstImage && firstImage['@id']) {
          recipe.image_url = firstImage['@id'];
        }
      } else if (typeof data.image === 'string') {
        recipe.image_url = data.image;
      } else if (data.image.url) {
        recipe.image_url = data.image.url;
      } else if (data.image['@id']) {
        recipe.image_url = data.image['@id'];
      }
      
      if (recipe.image_url) {
        // Production build: console.log removed
      }
    }
    
    if (data.description) recipe.description = data.description;
    if (data.recipeCategory) recipe.cuisine_type = data.recipeCategory;
    if (data.recipeCuisine) recipe.cuisine_type = data.recipeCuisine;
    
    // If no specific cuisine found but we have category data, try to extract cuisine from it
    if (!recipe.cuisine_type && data.keywords) {
      const keywords = Array.isArray(data.keywords) ? data.keywords.join(' ') : data.keywords;
      recipe.cuisine_type = this.extractCuisineFromText(keywords);
    }
    
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
      
      // Extract image from microdata
      const imageMatch = recipeSection.match(/itemprop=["']image["'][^>]*(?:src=["']([^"']+)["']|content=["']([^"']+)["'])/i);
      if (imageMatch) {
        recipe.image_url = imageMatch[1] || imageMatch[2];
        // Production build: console.log removed
      }
      
      // Extract cuisine from microdata
      const cuisineMatch = recipeSection.match(/itemprop=["']recipeCategory["'][^>]*>([^<]+)/i);
      if (cuisineMatch) {
        recipe.cuisine_type = cuisineMatch[1].trim();
      }
      
      // Extract nutritional information from microdata
      const nutritionMatch = recipeSection.match(/itemprop=["']nutrition["'][^>]*>(.*?)<\/[^>]+>/is);
      if (nutritionMatch) {
        const nutritionSection = nutritionMatch[1];
        recipe.nutritional_info = {};
        
        // Extract calories
        const caloriesMatch = nutritionSection.match(/itemprop=["']calories["'][^>]*>([^<]+)/i);
        if (caloriesMatch) {
          recipe.nutritional_info.calories = parseInt(caloriesMatch[1].replace(/\D/g, ''));
        }
        
        // Extract other nutrition facts
        const proteinMatch = nutritionSection.match(/itemprop=["']proteinContent["'][^>]*>([^<]+)/i);
        if (proteinMatch) recipe.nutritional_info.protein = proteinMatch[1].trim();
        
        const carbsMatch = nutritionSection.match(/itemprop=["']carbohydrateContent["'][^>]*>([^<]+)/i);
        if (carbsMatch) recipe.nutritional_info.carbs = carbsMatch[1].trim();
        
        const fatMatch = nutritionSection.match(/itemprop=["']fatContent["'][^>]*>([^<]+)/i);
        if (fatMatch) recipe.nutritional_info.fat = fatMatch[1].trim();
        
        const fiberMatch = nutritionSection.match(/itemprop=["']fiberContent["'][^>]*>([^<]+)/i);
        if (fiberMatch) recipe.nutritional_info.fiber = fiberMatch[1].trim();
        
        const sugarMatch = nutritionSection.match(/itemprop=["']sugarContent["'][^>]*>([^<]+)/i);
        if (sugarMatch) recipe.nutritional_info.sugar = sugarMatch[1].trim();
      }
      
      return recipe.title && recipe.ingredients && recipe.ingredients.length > 0 ? recipe : null;
    } catch (error) {
      console.error('Error extracting microdata:', error);
      return null;
    }
  }
  
  static extractManually(html: string, baseUrl: string = ''): Partial<Recipe> | null {
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
      
      // Extract image using the dedicated image extraction method
      recipe.image_url = this.extractImageFromHtml(html, baseUrl);
      
      // Extract cuisine/category information
      recipe.cuisine_type = this.extractCuisineFromHtml(html) || undefined;
      
      // Extract basic nutritional information from common patterns
      recipe.nutritional_info = this.extractNutritionFromHtml(html);
      
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
