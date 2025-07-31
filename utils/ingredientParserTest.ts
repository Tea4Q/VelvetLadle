// Test file to verify ingredient parsing functionality
import { parseIngredient, parseIngredients, scaleIngredient } from '../utils/ingredientParser';

// Test data with various ingredient formats
const testIngredients = [
  "2 cups all-purpose flour",
  "1/4 teaspoon salt",
  "3 large eggs",
  "1 tablespoon olive oil", 
  "2.5 pounds chicken breast",
  "Salt and pepper to taste",
  "1 medium onion, diced",
  "2 cloves garlic, minced",
  "1/2 cup freshly grated Parmesan cheese",
  "Fresh basil leaves"
];

console.log('=== Ingredient Parsing Test ===\n');

testIngredients.forEach((ingredient, index) => {
  console.log(`${index + 1}. Original: "${ingredient}"`);
  const parsed = parseIngredient(ingredient);
  console.log(`   Parsed: Amount="${parsed.amount}" Unit="${parsed.unit}" Name="${parsed.name}"`);
  console.log('');
});

console.log('=== Scaling Test ===\n');

const testIngredient = parseIngredient("2 cups flour");
console.log('Original:', testIngredient);

const doubled = scaleIngredient(testIngredient, 2);
console.log('Doubled:', doubled);

const halved = scaleIngredient(testIngredient, 0.5);
console.log('Halved:', halved);

const tripled = scaleIngredient(testIngredient, 3);
console.log('Tripled:', tripled);

export {}; // Make this a module
