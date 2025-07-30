import { DemoStorage } from '../services/demoStorage';

export async function testDemoStorage() {
	console.log('=== Demo Storage Test ===');
	
	// Get all recipes
	const recipes = await DemoStorage.getAllRecipes();
	console.log(`Found ${recipes.length} recipes in demo storage:`);
	
	recipes.forEach((recipe, index) => {
		console.log(`${index + 1}. ${recipe.title}`);
		console.log(`   - ${recipe.ingredients.length} ingredients`);
		console.log(`   - ${recipe.directions.length} directions`);
		console.log(`   - Source: ${recipe.web_address}`);
		if (recipe.created_at) {
			console.log(`   - Added: ${new Date(recipe.created_at).toLocaleString()}`);
		}
		console.log('');
	});
	
	if (recipes.length === 0) {
		console.log('No recipes found. Try adding a recipe first!');
	}
	
	return recipes;
}
