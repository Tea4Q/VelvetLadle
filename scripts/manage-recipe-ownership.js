/**
 * Script to manage recipe ownership
 * Run: node scripts/manage-recipe-ownership.js
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

async function showCurrentState() {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, user_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  const demoRecipes = recipes.filter(r => !r.user_id);
  const ownedRecipes = recipes.filter(r => r.user_id);

  console.log('\n📊 Current Recipe State:');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`Demo Recipes (user_id = NULL): ${demoRecipes.length}`);
  demoRecipes.forEach(r => console.log(`   🍽️  ${r.title}`));
  
  console.log(`\nOwned Recipes: ${ownedRecipes.length}`);
  ownedRecipes.forEach(r => console.log(`   👤 ${r.title} (${r.user_id.substring(0, 8)}...)`));
  
  console.log('\n═══════════════════════════════════════════════\n');

  return { demoRecipes, ownedRecipes, allRecipes: recipes };
}

async function assignOwnership(userId) {
  console.log(`\n🔄 Assigning all demo recipes to user: ${userId.substring(0, 8)}...\n`);

  const { data, error } = await supabase
    .from('recipes')
    .update({ user_id: userId })
    .is('user_id', null)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Updated ${data.length} recipes:`);
  data.forEach(r => console.log(`   - ${r.title}`));
  console.log('');
}

async function duplicateAsDemoRecipes(recipeIds) {
  console.log('\n📋 Duplicating recipes as demo recipes...\n');

  const { data: recipes, error: fetchError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds);

  if (fetchError) {
    console.error('❌ Error fetching recipes:', fetchError.message);
    return;
  }

  // Create copies with user_id = NULL
  const demoRecipes = recipes.map(r => {
    const { id, created_at, ...recipeData } = r;
    return { ...recipeData, user_id: null };
  });

  const { data, error } = await supabase
    .from('recipes')
    .insert(demoRecipes)
    .select();

  if (error) {
    console.error('❌ Error creating demo copies:', error.message);
    return;
  }

  console.log(`✅ Created ${data.length} demo recipe copies:`);
  data.forEach(r => console.log(`   🍽️  ${r.title}`));
  console.log('');
}

async function main() {
  console.log('\n🍳 VelvetLadle Recipe Ownership Manager\n');

  const state = await showCurrentState();
  if (!state) return;

  console.log('What would you like to do?\n');
  console.log('1. Keep existing recipes as DEMO (recommended)');
  console.log('   → Guests see them, you create new personal recipes');
  console.log('');
  console.log('2. Claim existing recipes as YOURS + keep demo copies');
  console.log('   → Assign user_id to existing, duplicate as demos');
  console.log('');
  console.log('3. Claim existing recipes as YOURS (no demos)');
  console.log('   → Assign user_id, guests see nothing');
  console.log('');

  // For automated execution, set your choice here:
  const CHOICE = null; // Set to 1, 2, or 3 to automate
  const USER_ID = 'ce82f711-2868-4dd0-8a11-de3c60a4bb1f'; // Your paid account ID from earlier

  if (CHOICE === 1) {
    console.log('✅ CHOICE 1: Keeping as demo recipes (no changes needed)\n');
    console.log('Your existing recipes are already demo recipes.');
    console.log('Sign in with a test account to add personal recipes!\n');
  } else if (CHOICE === 2) {
    console.log('✅ CHOICE 2: Claim + Keep Demo Copies\n');
    await duplicateAsDemoRecipes(state.demoRecipes.map(r => r.id));
    await assignOwnership(USER_ID);
    await showCurrentState();
  } else if (CHOICE === 3) {
    console.log('✅ CHOICE 3: Claim All (No Demos)\n');
    await assignOwnership(USER_ID);
    await showCurrentState();
  } else {
    console.log('ℹ️  Set CHOICE and USER_ID in the script to proceed.\n');
    console.log('Test Account IDs:');
    console.log('  GUEST: 772af8dc-f1b4-4917-8645-765474f9b2af');
    console.log('  FREE:  8bdcb5e2-699e-4875-baab-c41b8ddf803f');
    console.log('  PAID:  ce82f711-2868-4dd0-8a11-de3c60a4bb1f\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
