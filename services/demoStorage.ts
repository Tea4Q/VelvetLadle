import { Recipe } from '../lib/supabase';

// In-memory storage for demo mode when Supabase isn't configured
let demoRecipes: Recipe[] = [];
let nextId = 1;

export class DemoStorage {
  static async saveRecipe(recipe: Recipe): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      const newRecipe: Recipe = {
        ...recipe,
        id: nextId++,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      demoRecipes.push(newRecipe);
      console.log('Recipe saved to demo storage:', newRecipe.title);
      
      return { success: true, data: newRecipe };
    } catch (error) {
      console.error('Error saving to demo storage:', error);
      return { success: false, error: 'Failed to save recipe to demo storage' };
    }
  }

  static async getRecipeByUrl(url: string): Promise<Recipe | null> {
    const recipe = demoRecipes.find(r => r.web_address === url);
    return recipe || null;
  }

  static async getAllRecipes(): Promise<Recipe[]> {
    return [...demoRecipes].sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );
  }

  static async updateRecipe(id: number, updates: Partial<Recipe>): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      const index = demoRecipes.findIndex(r => r.id === id);
      if (index === -1) {
        return { success: false, error: 'Recipe not found' };
      }

      demoRecipes[index] = {
        ...demoRecipes[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      return { success: true, data: demoRecipes[index] };
    } catch (error) {
      console.error('Error updating demo recipe:', error);
      return { success: false, error: 'Failed to update recipe in demo storage' };
    }
  }

  static async deleteRecipe(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const index = demoRecipes.findIndex(r => r.id === id);
      if (index === -1) {
        return { success: false, error: 'Recipe not found' };
      }

      demoRecipes.splice(index, 1);
      return { success: true };
    } catch (error) {
      console.error('Error deleting demo recipe:', error);
      return { success: false, error: 'Failed to delete recipe from demo storage' };
    }
  }

  static getStorageInfo(): string {
    return `Demo Storage: ${demoRecipes.length} recipes stored in memory (will be lost when app restarts)`;
  }

  static async createDemoRecipesWithCategories(): Promise<void> {
    if (demoRecipes.length > 0) return; // Only create if no recipes exist

    const sampleRecipes: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        title: "Classic Spaghetti Carbonara",
        ingredients: ["400g spaghetti", "200g pancetta", "4 large eggs", "100g Pecorino Romano", "Black pepper", "Salt"],
        directions: ["Cook pasta", "Fry pancetta", "Mix eggs and cheese", "Combine all ingredients"],
        servings: 4,
        prep_time: "15 mins",
        cook_time: "20 mins",
        total_time: "35 mins",
        web_address: "https://example.com/carbonara",
        cuisine_type: "italian",
        description: "A creamy, authentic Italian pasta dish",
        image_url: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400"
      },
      {
        title: "Chicken Tikka Masala",
        ingredients: ["500g chicken breast", "1 cup yogurt", "Tikka masala spice blend", "Tomato sauce", "Heavy cream"],
        directions: ["Marinate chicken", "Cook chicken", "Make sauce", "Simmer together"],
        servings: 4,
        prep_time: "30 mins",
        cook_time: "25 mins",
        total_time: "55 mins",
        web_address: "https://example.com/tikka-masala",
        cuisine_type: "indian",
        description: "Rich and creamy Indian curry",
        image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400"
      },
      {
        title: "Classic Beef Tacos",
        ingredients: ["500g ground beef", "Taco shells", "Lettuce", "Tomatoes", "Cheese", "Sour cream"],
        directions: ["Cook beef", "Warm shells", "Prepare toppings", "Assemble tacos"],
        servings: 6,
        prep_time: "10 mins",
        cook_time: "15 mins",
        total_time: "25 mins",
        web_address: "https://example.com/beef-tacos",
        cuisine_type: "mexican",
        description: "Delicious and easy beef tacos",
        image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400"
      },
      {
        title: "Chicken Teriyaki Bowl",
        ingredients: ["400g chicken thighs", "Jasmine rice", "Teriyaki sauce", "Broccoli", "Carrots", "Sesame seeds"],
        directions: ["Cook rice", "Prepare teriyaki sauce", "Cook chicken", "Steam vegetables", "Assemble bowl"],
        servings: 3,
        prep_time: "15 mins",
        cook_time: "30 mins",
        total_time: "45 mins",
        web_address: "https://example.com/teriyaki-bowl",
        cuisine_type: "asian",
        description: "Healthy and flavorful Asian-inspired bowl",
        image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"
      },
      {
        title: "Classic Cheeseburger",
        ingredients: ["500g ground beef", "Burger buns", "American cheese", "Lettuce", "Tomato", "Onion", "Pickles"],
        directions: ["Form patties", "Grill burgers", "Toast buns", "Assemble with toppings"],
        servings: 4,
        prep_time: "10 mins",
        cook_time: "10 mins",
        total_time: "20 mins",
        web_address: "https://example.com/cheeseburger",
        cuisine_type: "american",
        description: "The perfect American cheeseburger",
        image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
      },
      {
        title: "Greek Mediterranean Salad",
        ingredients: ["Mixed greens", "Feta cheese", "Olives", "Cherry tomatoes", "Cucumber", "Red onion", "Olive oil"],
        directions: ["Chop vegetables", "Prepare dressing", "Combine ingredients", "Toss with dressing"],
        servings: 4,
        prep_time: "15 mins",
        cook_time: "0 mins",
        total_time: "15 mins",
        web_address: "https://example.com/greek-salad",
        cuisine_type: "mediterranean",
        description: "Fresh and healthy Mediterranean salad",
        image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400"
      }
    ];

    for (const recipe of sampleRecipes) {
      await this.saveRecipe(recipe);
    }

    console.log(`Created ${sampleRecipes.length} demo recipes with categories`);
  }
}
