// Run admin schema migration using Supabase client
// Usage: node src/database/runAdminSchema.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Creating admin tables...');

  // Create app_settings table
  const { error: e1 } = await supabase.from('app_settings').select('key').limit(1);
  if (e1 && e1.code === '42P01') {
    console.log('app_settings table does not exist — please create it via Supabase SQL Editor.');
    console.log('Copy the SQL from admin-schema.sql and run it in https://supabase.com/dashboard');
    return;
  }

  if (!e1) {
    console.log('app_settings table already exists, seeding defaults...');
    const defaults = [
      { key: 'ai_provider', value: 'gemini' },
      { key: 'ai_model_anthropic', value: 'claude-sonnet-4-20250514' },
      { key: 'ai_model_openai', value: 'gpt-4o-mini' },
      { key: 'ai_model_gemini', value: 'gemini-2.0-flash' },
      { key: 'max_tokens', value: '4000' },
      { key: 'rate_limit_cv_per_day', value: '10' },
      { key: 'rate_limit_cl_per_day', value: '20' },
    ];

    for (const d of defaults) {
      const { error } = await supabase
        .from('app_settings')
        .upsert(d, { onConflict: 'key' });
      if (error) console.error(`  Failed to seed ${d.key}:`, error.message);
    }
    console.log('  Defaults seeded.');
  }

  // Check api_usage
  const { error: e2 } = await supabase.from('api_usage').select('id').limit(1);
  if (e2 && e2.code === '42P01') {
    console.log('api_usage table does not exist — please create it via Supabase SQL Editor.');
    return;
  }
  if (!e2) console.log('api_usage table already exists.');

  console.log('\nDone! If tables are missing, run the SQL in admin-schema.sql via the Supabase Dashboard SQL Editor.');
}

run();
