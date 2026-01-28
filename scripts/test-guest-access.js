/**
 * Check RLS policies and query recipes as guest
 * Run: node scripts/test-guest-access.js
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

async function testGuestAccess() {
  console.log('\n🔍 Testing Guest Access to Recipes\n');

  // Test 1: Get current user (should be null for unauthenticated)
  console.log('1️⃣ Checking auth state...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log(`   Auth user: ${user ? user.email : '❌ NULL (guest mode)'}\n`);

  // Test 2: Query ALL recipes (no filter)
  console.log('2️⃣ Querying ALL recipes...');
  const { data: allRecipes, error: allError } = await supabase
    .from('recipes')
    .select('id, title, user_id')
    .limit(5);

  if (allError) {
    console.error(`   ❌ Error: ${allError.message}`);
    console.error(`   Code: ${allError.code}`);
    console.error(`   Details: ${allError.details}\n`);
  } else {
    console.log(`   ✅ Success: ${allRecipes.length} recipes returned`);
    allRecipes.forEach(r => console.log(`      - ${r.title} (user_id: ${r.user_id || 'NULL'})`));
    console.log('');
  }

  // Test 3: Query only demo recipes (user_id IS NULL)
  console.log('3️⃣ Querying demo recipes (user_id IS NULL)...');
  const { data: demoRecipes, error: demoError } = await supabase
    .from('recipes')
    .select('id, title, user_id')
    .is('user_id', null)
    .limit(5);

  if (demoError) {
    console.error(`   ❌ Error: ${demoError.message}`);
    console.error(`   Code: ${demoError.code}\n`);
  } else {
    console.log(`   ✅ Success: ${demoRecipes.length} demo recipes returned`);
    demoRecipes.forEach(r => console.log(`      - ${r.title}`));
    console.log('');
  }

  // Test 4: Count total recipes
  console.log('4️⃣ Counting total recipes...');
  const { count, error: countError } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`   ❌ Error: ${countError.message}\n`);
  } else {
    console.log(`   ✅ Total recipes in database: ${count}\n`);
  }

  // Test 5: Count demo recipes
  console.log('5️⃣ Counting demo recipes...');
  const { count: demoCount, error: demoCountError } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null);

  if (demoCountError) {
    console.error(`   ❌ Error: ${demoCountError.message}\n`);
  } else {
    console.log(`   ✅ Demo recipes (user_id = NULL): ${demoCount}\n`);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('📋 Summary:');
  console.log(`   Guest mode: ${!user ? '✅ Yes' : '❌ No (signed in)'}`);
  console.log(`   Can query recipes: ${!allError ? '✅ Yes' : '❌ No'}`);
  console.log(`   Total recipes: ${count || 0}`);
  console.log(`   Demo recipes: ${demoCount || 0}`);
  console.log('═══════════════════════════════════════════════\n');
}

testGuestAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
