import { FavoritesService } from '../services/FavoritesService';
import { RecipeDatabase } from '../services/recipeDatabase';

/**
 * Utility to create demo favorites for testing
 */
export class DemoFavorites {
  /**
   * Create demo favorite recipes if none exist
   */
  static async createDemoFavoritesIfNeeded(): Promise<void> {
    try {
      // Production build: console.log removed
      
      // Check if there are already favorites
      const existingFavorites = await FavoritesService.getFavoriteRecipes();
      // Production build: console.log removed
      
      if (existingFavorites.length > 0) {
        // Production build: console.log removed
        return;
      }

      // Production build: console.log removed
      // Check if there are any recipes at all
      const allRecipes = await RecipeDatabase.getAllRecipes();
      // Production build: console.log removed
      
      // Always add some demo URL favorites, even if no recipes exist
      await this.createDemoUrlFavorites();

      if (allRecipes.length > 0) {
        // Take the first few recipes and make them favorites
        const recipesToFavorite = allRecipes.slice(0, Math.min(3, allRecipes.length));
        
        for (const recipe of recipesToFavorite) {
          try {
            await FavoritesService.addRecipeToFavorites(recipe);
            // Production build: console.log removed
          } catch (error) {
            console.error('❌ Error creating favorite for recipe:', recipe.title, error);
          }
        }
      } else {
        // Production build: console.log removed
      }
      
      // Production build: console.log removed
    } catch (error) {
      console.error('❌ Error creating demo favorites:', error);
    }
  }

  /**
   * Create demo URL favorites
   */
  private static async createDemoUrlFavorites(): Promise<void> {
    const demoUrls = [
      {
        url: 'https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/',
        title: 'Cheesy Chicken Broccoli Casserole',
        description: 'A delicious and comforting casserole perfect for family dinners.',
        imageUrl: 'https://www.allrecipes.com/thmb/8YzoMVe1l_FJR1K2U9Q1YlLW2YQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/213742-cheesy-chicken-broccoli-casserole-4x3-1-b2efc68c9b0d41ba89d2c9e4dd1e76b1.jpg'
      },
      {
        url: 'https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524',
        title: 'Classic Baked Mac and Cheese',
        description: 'Creamy, cheesy baked macaroni and cheese that\'s perfect for any occasion.',
        imageUrl: 'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2015/11/4/1/FNM_120115-Baked-Macaroni-and-Cheese-Recipe_s4x3.jpg.rend.hgtvcom.616.462.suffix/1446658037270.jpeg'
      },
      {
        url: 'https://www.simplyrecipes.com/recipes/chocolate_chip_cookies/',
        title: 'Perfect Chocolate Chip Cookies',
        description: 'The ultimate chocolate chip cookie recipe that\'s crispy on the outside and chewy on the inside.',
        imageUrl: 'https://www.simplyrecipes.com/thmb/AqALnh5RIZU5bvYCLPZlXh3nMEY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__simply_recipes__uploads__2018__07__Chocolate-Chip-Cookies-LEAD-1-ed944e07f2534e86939b77e43c9ae4b1.jpg'
      }
    ];

    for (const demo of demoUrls) {
      try {
        await FavoritesService.addUrlToFavorites(
          demo.url,
          demo.title,
          demo.description,
          demo.imageUrl
        );
        // Production build: console.log removed
      } catch (error) {
        console.error('❌ Error creating demo URL favorite:', demo.title, error);
      }
    }
  }
}
