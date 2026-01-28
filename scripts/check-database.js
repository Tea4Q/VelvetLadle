/**
 * Quick script to check database contents
 * Run: node scripts/check-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n🔍 Checking database contents...\n');

  // Check all recipes
  const { data: allRecipes, error: allError } = await supabase
    .from('recipes')
    .select('id, title, user_id, created_at')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('❌ Error:', allError.message);
    return;
  }

  console.log(`📊 Total recipes in database: ${allRecipes.length}\n`);

  if (allRecipes.length === 0) {
    console.log('⚠️  Database is EMPTY - no recipes exist yet!\n');
    console.log('To test guest mode, you need to either:');
    console.log('  1. Add a recipe while NOT signed in (as guest)');
    console.log('  2. Run: node scripts/seed-demo-recipes.js\n');
    return;
  }

  // Group by ownership
  const demoRecipes = allRecipes.filter(r => !r.user_id);
  const ownedRecipes = allRecipes.filter(r => r.user_id);

  console.log(`🆓 Demo Recipes (user_id = NULL): ${demoRecipes.length}`);
  demoRecipes.forEach(r => {
    const date = new Date(r.created_at).toLocaleDateString();
    console.log(`   ${r.id}. ${r.title} (${date})`);
  });

  console.log(`\n👤 Owned Recipes: ${ownedRecipes.length}`);
  ownedRecipes.forEach(r => {
    const date = new Date(r.created_at).toLocaleDateString();
    const userId = r.user_id.substring(0, 8);
    console.log(`   ${r.id}. ${r.title} - User: ${userId}... (${date})`);
  });

  console.log('\n📋 What guests see:');
  const { data: guestView, error: guestError } = await supabase
    .from('recipes')
    .select('id, title')
    .is('user_id', null);

  if (guestError) {
    console.error('❌ Error:', guestError.message);
  } else {
    console.log(`   ${guestView.length} recipes`);
    guestView.forEach(r => console.log(`   - ${r.title}`));
  }

  console.log('');
}

checkDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
