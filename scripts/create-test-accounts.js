/**
 * Script to create test accounts for development
 * Run: node scripts/create-test-accounts.js
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

const testAccounts = [
  {
    email: 'velvetladle.guest@gmail.com',
    password: 'guest123',
    name: 'Guest User',
    accountType: 'guest',
  },
  {
    email: 'velvetladle.free@gmail.com',
    password: 'free123',
    name: 'Free User',
    accountType: 'free',
  },
  {
    email: 'velvetladle.paid@gmail.com',
    password: 'paid123',
    name: 'Premium User',
    accountType: 'paid',
  },
];

async function createAccounts() {
  console.log('🚀 Creating test accounts...\n');

  for (const account of testAccounts) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            name: account.name,
            account_type: account.accountType,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⚠️  ${account.accountType.toUpperCase()}: ${account.email} already exists`);
        } else {
          console.error(`❌ ${account.accountType.toUpperCase()}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${account.accountType.toUpperCase()}: Created ${account.email}`);
        console.log(`   Password: ${account.password}`);
        console.log(`   User ID: ${data.user?.id}\n`);
      }
    } catch (err) {
      console.error(`❌ Error creating ${account.accountType}:`, err.message);
    }
  }

  console.log('\n📝 Test Account Credentials:');
  console.log('═══════════════════════════════════════════════');
  testAccounts.forEach(acc => {
    console.log(`${acc.accountType.toUpperCase().padEnd(6)} → ${acc.email} / ${acc.password}`);
  });
  console.log('═══════════════════════════════════════════════\n');
}

createAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
