// One-time cleanup script to fix the empty recipe title
// Run this in the browser console to fix your database

// Simple cleanup function that doesn't require imports
window.fixEmptyRecipes = async function() {
  try {
    console.log('🧹 Starting recipe cleanup...');
    
    // Access the database service directly from the global context
    const { RecipeDatabase } = await import('../services/recipeDatabase');
    
    const allRecipes = await RecipeDatabase.getAllRecipes();
    console.log(`Found ${allRecipes.length} total recipes`);
    
    const problematicRecipes = allRecipes.filter(recipe => 
      !recipe.title || recipe.title.trim() === ''
    );
    
    console.log(`Found ${problematicRecipes.length} recipes with empty titles`);
    
    for (const recipe of problematicRecipes) {
      if (recipe.id) {
        console.log(`Fixing recipe ID ${recipe.id}...`);
        
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
        
        console.log(`✅ Updated recipe ID ${recipe.id} with title: "${newTitle}"`);
      }
    }
    
    console.log('🎉 Database cleanup completed! Please refresh the page.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Auto-run on import if this is run directly
console.log('💡 Cleanup function loaded! Run window.fixEmptyRecipes() in console to fix empty recipe titles.');
