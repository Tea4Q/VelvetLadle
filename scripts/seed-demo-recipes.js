/**
 * Script to seed demo recipes for guest users
 * Run: node scripts/seed-demo-recipes.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const demoRecipes = [
  {
    title: 'Classic Chocolate Chip Cookies',
    description: 'Soft and chewy cookies with gooey chocolate chips',
    ingredients: ['2 1/4 cups all-purpose flour', '1 tsp baking soda', '1 tsp salt', '1 cup butter, softened', '3/4 cup granulated sugar', '3/4 cup packed brown sugar', '2 large eggs', '2 tsp vanilla extract', '2 cups chocolate chips'],
    directions: ['Preheat oven to 375°F', 'Mix flour, baking soda and salt', 'Beat butter and sugars until creamy', 'Add eggs and vanilla', 'Gradually blend in dry mixture', 'Stir in chocolate chips', 'Drop rounded tablespoons onto ungreased cookie sheets', 'Bake 9-11 minutes or until golden brown'],
    prep_time_minutes: 15,
    cook_time_minutes: 10,
    total_time_minutes: 25,
    servings: 48,
    cuisine: 'American',
    category: 'Dessert',
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
    user_id: null, // Demo recipe for guests
  },
  {
    title: 'Creamy Tomato Basil Pasta',
    description: 'A rich and creamy pasta with fresh tomatoes and basil',
    ingredients: ['1 lb pasta', '2 tbsp olive oil', '4 cloves garlic, minced', '1 can (28 oz) crushed tomatoes', '1 cup heavy cream', '1/2 cup fresh basil, chopped', '1/2 cup Parmesan cheese', 'Salt and pepper to taste'],
    directions: ['Cook pasta according to package directions', 'Heat olive oil in large pan', 'Sauté garlic until fragrant', 'Add crushed tomatoes and simmer 10 minutes', 'Stir in cream and basil', 'Season with salt and pepper', 'Toss with cooked pasta', 'Top with Parmesan'],
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    total_time_minutes: 30,
    servings: 6,
    cuisine: 'Italian',
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    user_id: null,
  },
  {
    title: 'Grilled Lemon Herb Chicken',
    description: 'Juicy grilled chicken with bright citrus flavors',
    ingredients: ['4 chicken breasts', '1/4 cup olive oil', '3 tbsp lemon juice', '2 cloves garlic, minced', '1 tbsp fresh rosemary', '1 tbsp fresh thyme', '1 tsp salt', '1/2 tsp black pepper'],
    directions: ['Mix olive oil, lemon juice, garlic, herbs, salt and pepper', 'Pour over chicken and marinate 30 minutes', 'Preheat grill to medium-high', 'Grill chicken 6-8 minutes per side', 'Let rest 5 minutes before serving'],
    prep_time_minutes: 40,
    cook_time_minutes: 15,
    total_time_minutes: 55,
    servings: 4,
    cuisine: 'Mediterranean',
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800',
    user_id: null,
  },
  {
    title: 'Fresh Garden Salad',
    description: 'Crisp vegetables with homemade vinaigrette',
    ingredients: ['6 cups mixed greens', '1 cucumber, sliced', '2 tomatoes, diced', '1/2 red onion, thinly sliced', '1/4 cup olive oil', '2 tbsp balsamic vinegar', '1 tsp Dijon mustard', 'Salt and pepper'],
    directions: ['Combine greens, cucumber, tomatoes and onion in large bowl', 'Whisk together olive oil, vinegar, mustard, salt and pepper', 'Drizzle dressing over salad', 'Toss gently to coat', 'Serve immediately'],
    prep_time_minutes: 15,
    cook_time_minutes: 0,
    total_time_minutes: 15,
    servings: 4,
    cuisine: 'American',
    category: 'Salad',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    user_id: null,
  },
  {
    title: 'Fluffy Buttermilk Pancakes',
    description: 'Light and airy breakfast pancakes',
    ingredients: ['2 cups all-purpose flour', '2 tbsp sugar', '2 tsp baking powder', '1 tsp baking soda', '1/2 tsp salt', '2 cups buttermilk', '2 large eggs', '1/4 cup melted butter'],
    directions: ['Mix dry ingredients in large bowl', 'Whisk buttermilk, eggs and butter in another bowl', 'Pour wet into dry and stir until just combined', 'Heat griddle to 375°F', 'Pour 1/4 cup batter for each pancake', 'Flip when bubbles form on surface', 'Cook until golden brown'],
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    total_time_minutes: 25,
    servings: 12,
    cuisine: 'American',
    category: 'Breakfast',
    image_url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800',
    user_id: null,
  },
];

async function seedDemoRecipes() {
  console.log('🌱 Seeding demo recipes for guest users...\n');

  try {
    // Check if demo recipes already exist
    const { data: existing, error: checkError } = await supabase
      .from('recipes')
      .select('id, title')
      .is('user_id', null);

    if (checkError) {
      console.error('❌ Error checking existing recipes:', checkError.message);
      process.exit(1);
    }

    if (existing && existing.length > 0) {
      console.log(`⚠️  Found ${existing.length} existing demo recipes:`);
      existing.forEach(r => console.log(`   - ${r.title}`));
      console.log('\nSkipping seed (demo recipes already exist)');
      console.log('To re-seed, delete existing demo recipes first.\n');
      return;
    }

    // Insert demo recipes
    const { data, error } = await supabase
      .from('recipes')
      .insert(demoRecipes)
      .select();

    if (error) {
      console.error('❌ Error inserting demo recipes:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully created ${data.length} demo recipes:\n`);
    data.forEach(recipe => {
      console.log(`   🍽️  ${recipe.title} (${recipe.category})`);
    });
    console.log('\n🎉 Demo recipes are now available for guest users!\n');

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

seedDemoRecipes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
