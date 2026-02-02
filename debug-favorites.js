/**
 * Debug script to test and cleanup favorites functionality
 * Run this in the browser console when the app is loaded
 */

// Test favorites functionality
async function debugFavorites() {
  console.log('🔍 Debugging Favorites Functionality...');
  
  try {
    console.log('1. Checking local storage...');
    const localFavorites = localStorage.getItem('velvet_ladle_favorites');
    const parsed = localFavorites ? JSON.parse(localFavorites) : [];
    console.log('Total favorites in storage:', parsed.length);
    
    if (parsed.length > 0) {
      const recipes = parsed.filter(f => f.type === 'recipe');
      const urls = parsed.filter(f => f.type === 'url');
      console.log('- Recipe favorites:', recipes.length);
      console.log('- URL favorites:', urls.length);
      
      // Check for duplicates
      const urlSet = new Set();
      const recipeSet = new Set();
      let duplicates = 0;
      
      parsed.forEach(fav => {
        if (fav.type === 'recipe') {
          const key = `recipe-${fav.recipe_id}`;
          if (recipeSet.has(key)) duplicates++;
          recipeSet.add(key);
        } else {
          const key = `url-${fav.url}`;
          if (urlSet.has(key)) duplicates++;
          urlSet.add(key);
        }
      });
      
      console.log('- Duplicates found:', duplicates);
    }
    
    console.log('4. Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Cleanup function to remove duplicates
async function cleanupFavorites() {
  console.log('🧹 Cleaning up favorites...');
  
  try {
    const localFavorites = localStorage.getItem('velvet_ladle_favorites');
    if (!localFavorites) {
      console.log('No favorites to clean up');
      return;
    }
    
    const parsed = JSON.parse(localFavorites);
    const seen = new Set();
    const unique = parsed.filter(fav => {
      const key = fav.type === 'recipe' ? `recipe-${fav.recipe_id}` : `url-${fav.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    if (unique.length !== parsed.length) {
      localStorage.setItem('velvet_ladle_favorites', JSON.stringify(unique));
      console.log(`✅ Removed ${parsed.length - unique.length} duplicates`);
      console.log(`✅ Now have ${unique.length} unique favorites`);
      console.log('🔄 Refresh the app to see changes');
    } else {
      console.log('✅ No duplicates found');
    }
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// Clear all favorites (nuclear option)
async function clearAllFavorites() {
  if (confirm('Are you sure you want to clear ALL favorites? This cannot be undone.')) {
    localStorage.removeItem('velvet_ladle_favorites');
    console.log('🗑️ All favorites cleared');
    console.log('🔄 Refresh the app to see changes');
  }
}

// Instructions
console.log(`
🐛 Favorites Debug & Cleanup Helper
===================================

Available Functions:
1. debugFavorites() - Check current favorites and find issues
2. cleanupFavorites() - Remove duplicate favorites
3. clearAllFavorites() - Delete all favorites (with confirmation)

Quick Fix for Your Issue:
1. Run: cleanupFavorites()
2. Refresh the app page
3. Check if favorites count is now correct

`);