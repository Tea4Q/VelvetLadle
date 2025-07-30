import { Recipe } from '../lib/supabase';

/**
 * Service for extracting and managing ingredients and cuisines from recipes
 */
export class RecipeFilterService {
  /**
   * Extract all unique ingredients from a list of recipes
   */
  static extractIngredients(recipes: Recipe[]): string[] {
    const ingredientSet = new Set<string>();
    
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          if (typeof ingredient === 'string') {
            // Clean and normalize ingredient name
            const cleanIngredient = this.cleanIngredientName(ingredient);
            if (cleanIngredient) {
              ingredientSet.add(cleanIngredient);
            }
          }
        });
      }
    });
    
    return Array.from(ingredientSet).sort();
  }

  /**
   * Extract all unique cuisines from a list of recipes
   */
  static extractCuisines(recipes: Recipe[]): string[] {
    const cuisineSet = new Set<string>();
    
    recipes.forEach(recipe => {
      // Check multiple possible fields for cuisine information
      const cuisineFields = [
        recipe.cuisine_type,
        recipe.meal_type,
        recipe.tags?.join(' '),
        recipe.description
      ];
      
      cuisineFields.forEach(field => {
        if (field) {
          if (typeof field === 'string') {
            const cuisines = this.parseCuisineString(field);
            cuisines.forEach(cuisine => cuisineSet.add(cuisine));
          }
        }
      });
    });
    
    return Array.from(cuisineSet).sort();
  }

  /**
   * Filter recipes based on search criteria
   */
  static filterRecipes(
    recipes: Recipe[],
    searchTerm: string,
    selectedIngredients: string[],
    selectedCuisines: string[]
  ): Recipe[] {
    return recipes.filter(recipe => {
      // Text search in title and description
      const matchesSearch = this.matchesTextSearch(recipe, searchTerm);
      
      // Ingredient filtering
      const matchesIngredients = this.matchesIngredients(recipe, selectedIngredients);
      
      // Cuisine filtering
      const matchesCuisines = this.matchesCuisines(recipe, selectedCuisines);
      
      return matchesSearch && matchesIngredients && matchesCuisines;
    });
  }

  /**
   * Advanced filter recipes with additional criteria
   */
  static filterRecipesAdvanced(
    recipes: Recipe[],
    filters: {
      searchTerm?: string;
      ingredients?: string[];
      cuisines?: string[];
      mealTypes?: string[];
      dietaryRestrictions?: string[];
      maxPrepTime?: number;
      maxTotalTime?: number;
      minRating?: number;
      maxDifficulty?: number;
      tags?: string[];
    }
  ): Recipe[] {
    return recipes.filter(recipe => {
      // Basic filters
      if (filters.searchTerm && !this.matchesTextSearch(recipe, filters.searchTerm)) return false;
      if (filters.ingredients && !this.matchesIngredients(recipe, filters.ingredients)) return false;
      if (filters.cuisines && !this.matchesCuisines(recipe, filters.cuisines)) return false;
      
      // Meal type filtering
      if (filters.mealTypes && filters.mealTypes.length > 0) {
        if (!recipe.meal_type || !filters.mealTypes.includes(recipe.meal_type)) return false;
      }
      
      // Dietary restrictions filtering
      if (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0) {
        const recipeDietary = recipe.dietary_restrictions || [];
        const hasRequiredDietary = filters.dietaryRestrictions.every(restriction =>
          recipeDietary.includes(restriction)
        );
        if (!hasRequiredDietary) return false;
      }
      
      // Time filtering
      if (filters.maxPrepTime && recipe.prep_time_minutes && recipe.prep_time_minutes > filters.maxPrepTime) return false;
      if (filters.maxTotalTime && recipe.total_time_minutes && recipe.total_time_minutes > filters.maxTotalTime) return false;
      
      // Rating filtering
      if (filters.minRating && (!recipe.rating || recipe.rating < filters.minRating)) return false;
      
      // Difficulty filtering
      if (filters.maxDifficulty && recipe.difficulty_rating && recipe.difficulty_rating > filters.maxDifficulty) return false;
      
      // Tags filtering
      if (filters.tags && filters.tags.length > 0) {
        const recipeTags = recipe.tags || [];
        const hasRequiredTags = filters.tags.some(tag =>
          recipeTags.some(recipeTag => recipeTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasRequiredTags) return false;
      }
      
      return true;
    });
  }

  /**
   * Clean and normalize ingredient names
   */
  private static cleanIngredientName(ingredient: string): string | null {
    if (!ingredient || typeof ingredient !== 'string') return null;
    
    // Remove measurements and quantities
    let cleaned = ingredient
      .toLowerCase()
      .replace(/^\d+(\.\d+)?\s*(cups?|tbsp|tsp|oz|lbs?|grams?|ml|liters?|cloves?|slices?|pieces?)\s*/i, '')
      .replace(/^\d+(\.\d+)?\s*/i, '') // Remove leading numbers
      .replace(/\([^)]*\)/g, '') // Remove parenthetical content
      .replace(/,.*$/g, '') // Remove everything after comma
      .trim();
    
    // Extract main ingredient (first meaningful word)
    const words = cleaned.split(/\s+/);
    const mainIngredient = words.find(word => 
      word.length > 2 && 
      !['the', 'and', 'or', 'of', 'in', 'to', 'for', 'with'].includes(word)
    );
    
    return mainIngredient && mainIngredient.length > 2 
      ? this.capitalizeFirst(mainIngredient) 
      : null;
  }

  /**
   * Parse cuisine string and extract cuisine types
   */
  private static parseCuisineString(cuisineString: string): string[] {
    if (!cuisineString || typeof cuisineString !== 'string') return [];
    
    const cuisines: string[] = [];
    const normalized = cuisineString.toLowerCase();
    
    // Known cuisine keywords
    const cuisineKeywords = [
      'italian', 'chinese', 'mexican', 'indian', 'thai', 'japanese', 'french',
      'mediterranean', 'american', 'greek', 'korean', 'vietnamese', 'spanish',
      'moroccan', 'lebanese', 'turkish', 'german', 'british', 'caribbean',
      'brazilian', 'peruvian', 'ethiopian', 'russian', 'scandinavian',
      'asian', 'european', 'african', 'latin', 'middle eastern'
    ];
    
    cuisineKeywords.forEach(keyword => {
      if (normalized.includes(keyword)) {
        cuisines.push(this.capitalizeFirst(keyword));
      }
    });
    
    // If no specific cuisine found, try to extract from category/tags
    if (cuisines.length === 0 && cuisineString.length < 50) {
      const words = cuisineString.split(/[,\s]+/).filter(word => word.length > 2);
      words.forEach(word => {
        if (word.match(/^[a-zA-Z]+$/)) {
          cuisines.push(this.capitalizeFirst(word.toLowerCase()));
        }
      });
    }
    
    return [...new Set(cuisines)]; // Remove duplicates
  }

  /**
   * Check if recipe matches text search
   */
  private static matchesTextSearch(recipe: Recipe, searchTerm: string): boolean {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchFields = [
      recipe.title,
      recipe.description,
      recipe.directions?.join(' ')
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchFields.includes(searchLower);
  }

  /**
   * Check if recipe contains selected ingredients
   */
  private static matchesIngredients(recipe: Recipe, selectedIngredients: string[]): boolean {
    if (selectedIngredients.length === 0) return true;
    
    if (!recipe.ingredients) return false;
    
    const recipeIngredients = recipe.ingredients
      .map(ing => {
        if (typeof ing === 'string') return ing.toLowerCase();
        return '';
      })
      .join(' ');
    
    return selectedIngredients.every(selectedIng => 
      recipeIngredients.includes(selectedIng.toLowerCase())
    );
  }

  /**
   * Check if recipe matches selected cuisines
   */
  private static matchesCuisines(recipe: Recipe, selectedCuisines: string[]): boolean {
    if (selectedCuisines.length === 0) return true;
    
    const recipeCuisines = this.extractCuisines([recipe]);
    
    return selectedCuisines.some(selectedCuisine => 
      recipeCuisines.some(recipeCuisine => 
        recipeCuisine.toLowerCase() === selectedCuisine.toLowerCase()
      )
    );
  }

  /**
   * Capitalize first letter of a string
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get suggested ingredients based on partial input
   */
  static getSuggestedIngredients(allIngredients: string[], partialInput: string): string[] {
    if (!partialInput.trim()) return allIngredients;
    
    const searchLower = partialInput.toLowerCase();
    return allIngredients.filter(ingredient => 
      ingredient.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get recipe statistics for filtering
   */
  static getFilterStats(recipes: Recipe[]): {
    totalRecipes: number;
    totalIngredients: number;
    totalCuisines: number;
    averageIngredientsPerRecipe: number;
    mealTypes: string[];
    dietaryOptions: string[];
    averageRating: number;
    averagePrepTime: number;
  } {
    const ingredients = this.extractIngredients(recipes);
    const cuisines = this.extractCuisines(recipes);
    const mealTypes = this.extractMealTypes(recipes);
    const dietaryOptions = this.extractDietaryRestrictions(recipes);
    
    const totalIngredientCount = recipes.reduce((sum, recipe) => 
      sum + (recipe.ingredients ? recipe.ingredients.length : 0), 0
    );
    
    const ratingsSum = recipes.reduce((sum, recipe) => 
      sum + (recipe.rating || 0), 0
    );
    const recipesWithRatings = recipes.filter(r => r.rating).length;
    
    const prepTimesSum = recipes.reduce((sum, recipe) => 
      sum + (recipe.prep_time_minutes || 0), 0
    );
    const recipesWithPrepTime = recipes.filter(r => r.prep_time_minutes).length;
    
    return {
      totalRecipes: recipes.length,
      totalIngredients: ingredients.length,
      totalCuisines: cuisines.length,
      averageIngredientsPerRecipe: recipes.length > 0 
        ? Math.round(totalIngredientCount / recipes.length) 
        : 0,
      mealTypes,
      dietaryOptions,
      averageRating: recipesWithRatings > 0 
        ? Math.round((ratingsSum / recipesWithRatings) * 10) / 10
        : 0,
      averagePrepTime: recipesWithPrepTime > 0
        ? Math.round(prepTimesSum / recipesWithPrepTime)
        : 0
    };
  }

  /**
   * Extract all meal types from recipes
   */
  static extractMealTypes(recipes: Recipe[]): string[] {
    const mealTypeSet = new Set<string>();
    
    recipes.forEach(recipe => {
      if (recipe.meal_type) {
        mealTypeSet.add(recipe.meal_type);
      }
    });
    
    return Array.from(mealTypeSet).sort();
  }

  /**
   * Extract all dietary restrictions from recipes
   */
  static extractDietaryRestrictions(recipes: Recipe[]): string[] {
    const dietarySet = new Set<string>();
    
    recipes.forEach(recipe => {
      if (recipe.dietary_restrictions) {
        recipe.dietary_restrictions.forEach(restriction => {
          dietarySet.add(restriction);
        });
      }
    });
    
    return Array.from(dietarySet).sort();
  }

  /**
   * Extract all tags from recipes
   */
  static extractTags(recipes: Recipe[]): string[] {
    const tagSet = new Set<string>();
    
    recipes.forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach(tag => {
          tagSet.add(tag);
        });
      }
    });
    
    return Array.from(tagSet).sort();
  }

  /**
   * Get time-based suggestions for filtering
   */
  static getTimeSuggestions(): { label: string; minutes: number }[] {
    return [
      { label: '15 mins', minutes: 15 },
      { label: '30 mins', minutes: 30 },
      { label: '45 mins', minutes: 45 },
      { label: '1 hour', minutes: 60 },
      { label: '1.5 hours', minutes: 90 },
      { label: '2 hours', minutes: 120 },
    ];
  }

  /**
   * Convert time string to minutes for filtering
   */
  static parseTimeToMinutes(timeString: string): number | null {
    if (!timeString) return null;
    
    const hourMatch = timeString.match(/(\d+)\s*h/i);
    const minuteMatch = timeString.match(/(\d+)\s*m/i);
    
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    
    return hours * 60 + minutes || null;
  }
}
