/**
 * Move recipes to a specific user
 * Run: node scripts/move-recipes-to-user.js
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

// Configuration - Set these before running
const TARGET_USER_ID = 'ce82f711-2868-4dd0-8a11-de3c60a4bb1f'; // Your paid account
const OPERATION = 'preview'; // 'preview' or 'move'

// Options for which recipes to move:
const MOVE_OPTIONS = {
  moveAllDemo: true,          // Move all recipes with user_id = NULL
  moveSpecificIds: [],        // Or move specific recipe IDs: [1, 2, 3]
  moveFromUser: null,         // Or move from another user: 'other-user-id-here'
};

async function previewMove() {
  console.log('\n📋 Preview: Recipes to Move\n');
  console.log(`Target User: ${TARGET_USER_ID.substring(0, 8)}...`);
  console.log('═══════════════════════════════════════════════\n');

  let query = supabase.from('recipes').select('id, title, user_id, created_at');

  if (MOVE_OPTIONS.moveAllDemo) {
    query = query.is('user_id', null);
    console.log('📦 Moving ALL demo recipes (user_id = NULL)\n');
  } else if (MOVE_OPTIONS.moveSpecificIds.length > 0) {
    query = query.in('id', MOVE_OPTIONS.moveSpecificIds);
    console.log(`📦 Moving specific recipes: ${MOVE_OPTIONS.moveSpecificIds.join(', ')}\n`);
  } else if (MOVE_OPTIONS.moveFromUser) {
    query = query.eq('user_id', MOVE_OPTIONS.moveFromUser);
    console.log(`📦 Moving recipes from user: ${MOVE_OPTIONS.moveFromUser.substring(0, 8)}...\n`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  if (data.length === 0) {
    console.log('⚠️  No recipes found matching criteria\n');
    return null;
  }

  console.log(`Found ${data.length} recipes to move:\n`);
  data.forEach(r => {
    const date = new Date(r.created_at).toLocaleDateString();
    const owner = r.user_id ? r.user_id.substring(0, 8) + '...' : 'DEMO';
    console.log(`   ${r.id}. ${r.title}`);
    console.log(`      Current: ${owner} → New: ${TARGET_USER_ID.substring(0, 8)}...`);
  });
  console.log('');

  return data;
}

async function moveRecipes(recipes) {
  console.log('\n🔄 Moving recipes...\n');

  const recipeIds = recipes.map(r => r.id);

  const { data, error } = await supabase
    .from('recipes')
    .update({ user_id: TARGET_USER_ID })
    .in('id', recipeIds)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Successfully moved ${data.length} recipes!\n`);
  data.forEach(r => console.log(`   ✓ ${r.title}`));
  console.log('');
}

async function showSummary() {
  const { data: all } = await supabase.from('recipes').select('id, user_id');
  const { data: forUser } = await supabase.from('recipes').select('id').eq('user_id', TARGET_USER_ID);
  const { data: demo } = await supabase.from('recipes').select('id').is('user_id', null);

  console.log('═══════════════════════════════════════════════');
  console.log('📊 Current State:');
  console.log(`   Total recipes: ${all?.length || 0}`);
  console.log(`   ${TARGET_USER_ID.substring(0, 8)}... owns: ${forUser?.length || 0} recipes`);
  console.log(`   Demo recipes: ${demo?.length || 0}`);
  console.log('═══════════════════════════════════════════════\n');
}

async function main() {
  console.log('\n🔧 Recipe Ownership Transfer Tool\n');

  // Show current state
  await showSummary();

  // Preview what will be moved
  const recipes = await previewMove();
  if (!recipes) return;

  if (OPERATION === 'preview') {
    console.log('ℹ️  Running in PREVIEW mode (no changes made)');
    console.log('   To actually move recipes, set OPERATION = \'move\' in the script\n');
  } else if (OPERATION === 'move') {
    console.log('⚠️  MOVE mode - recipes will be transferred!\n');
    await moveRecipes(recipes);
    await showSummary();
  } else {
    console.log('❌ Invalid OPERATION. Must be "preview" or "move"\n');
  }

  console.log('💡 Available User IDs:');
  console.log('   GUEST: 772af8dc-f1b4-4917-8645-765474f9b2af');
  console.log('   FREE:  8bdcb5e2-699e-4875-baab-c41b8ddf803f');
  console.log('   PAID:  ce82f711-2868-4dd0-8a11-de3c60a4bb1f\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
