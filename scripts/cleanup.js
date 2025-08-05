// One-time cleanup script to fix the empty recipe title
// Run this in the browser console to fix your database

// Simple cleanup function that doesn't require imports
window.fixEmptyRecipes = async function() {
  try {
    // Production build: console.log removed
    
    // Access the database service directly from the global context
    const { RecipeDatabase } = await import('../services/recipeDatabase');
    
    const allRecipes = await RecipeDatabase.getAllRecipes();
    // Production build: console.log removed
    
    const problematicRecipes = allRecipes.filter(recipe => 
      !recipe.title || recipe.title.trim() === ''
    );
    
    // Production build: console.log removed
    
    for (const recipe of problematicRecipes) {
      if (recipe.id) {
        // Production build: console.log removed
        
        // Try to generate a title from ingredients or description
        let newTitle = '(Untitled Recipe)';
        
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          // Use first ingredient as basis for title
          const firstIngredient = recipe.ingredients[0];
          if (firstIngredient) {
            // Clean up the ingredient name
            const cleanIngredient = firstIngredient.replace(/^\d+\.?\s*/, '').replace(/^[\d\s\/]+\s*(cups?|tbsp|tsp|lbs?|oz|grams?|ml|liters?)?\s*/i, '').trim();
            newTitle = `Recipe with ${cleanIngredient}`;
          }
        } else if (recipe.description) {
          // Use description as title
          newTitle = recipe.description.substring(0, 50).trim();
          if (recipe.description.length > 50) newTitle += '...';
        } else if (recipe.cuisine_type) {
          newTitle = `${recipe.cuisine_type} Recipe`;
        }
        
        // Update the recipe
        await RecipeDatabase.updateRecipe(recipe.id, {
          ...recipe,
          title: newTitle
        });
        
        // Production build: console.log removed
      }
    }
    
    // Production build: console.log removed
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Auto-run on import if this is run directly
// Production build: console.log removed in console to fix empty recipe titles.');
