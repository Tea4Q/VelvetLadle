// services/nutritionService.ts
// Service to fetch nutrition data for a recipe using Spoonacular API (as an example)
// Replace 'YOUR_SPOONACULAR_API_KEY' with your actual API key




const SPOONACULAR_API_KEY = '89a6aed438fb42debc55fdb2ab57163e'; 
const API_URL = 'https://api.spoonacular.com/recipes/parseIngredients';

export async function fetchNutrition(ingredients: string[], servings: number = 1) {
  try {
    // Spoonacular expects a single string with one ingredient per line
    const ingredientList = ingredients.join('\n');
    const response = await fetch(
      `${API_URL}?apiKey=${SPOONACULAR_API_KEY}&servings=${servings}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientList }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch nutrition data');
    }
    const data = await response.json();
    // The response contains an array of ingredient objects with nutrition info
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch nutrition data' };
  }
}
