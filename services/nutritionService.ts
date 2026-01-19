// services/nutritionService.ts
// Service to fetch nutrition data for a recipe using Spoonacular API
// Set EXPO_PUBLIC_SPOONACULAR_KEY in your .env.local file

const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY || '89a6aed438fb42debc55fdb2ab57163e'; 
const API_URL = 'https://api.spoonacular.com/recipes/parseIngredients';

export async function fetchNutrition(ingredients: string[], servings: number = 1) {
  if (!SPOONACULAR_API_KEY) {
    console.warn('[NutritionService] Spoonacular API key not configured');
    return { success: false, error: 'API key not configured' };
  }

  try {
    // Production build: console.log removed
    
    // Spoonacular expects a single string with one ingredient per line
    const ingredientList = ingredients.join('\n');
    const response = await fetch(
      `${API_URL}?apiKey=${SPOONACULAR_API_KEY}&servings=${servings}&includeNutrition=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `ingredientList=${encodeURIComponent(ingredientList)}`,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NutritionService] API error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    // Production build: console.log removed
    // The response contains an array of ingredient objects with nutrition info
    return { success: true, data };
  } catch (error: any) {
    console.error('[NutritionService] Error:', error.message || error);
    return { success: false, error: error.message || 'Failed to fetch nutrition data' };
  }
}
