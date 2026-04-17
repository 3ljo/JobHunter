// Check that the feature_usage table + increment_feature_usage RPC exist.
// Usage: node src/database/runFeatureUsageSchema.js
//
// Supabase client libraries can't execute raw DDL, so if anything is missing
// this script prints the SQL you need to paste into the Supabase SQL Editor.

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Checking feature_usage schema...');

  const { error: tableErr } = await supabase.from('feature_usage').select('id').limit(1);
  if (tableErr && tableErr.code === '42P01') {
    console.log('\nfeature_usage table does NOT exist.');
    console.log('Open the Supabase SQL Editor and paste the contents of:');
    console.log('  backend/src/database/feature-usage-schema.sql\n');
    const sql = fs.readFileSync(path.join(__dirname, 'feature-usage-schema.sql'), 'utf8');
    console.log('----- SQL -----');
    console.log(sql);
    console.log('---- /SQL -----');
    return;
  }

  if (tableErr) {
    console.error('Unexpected error checking feature_usage:', tableErr.message);
    return;
  }

  console.log('feature_usage table exists.');

  // Verify the RPC is installed by calling it with a null user_id (will fail safely).
  const { error: rpcErr } = await supabase.rpc('increment_feature_usage', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_feature: 'cv_analysis',
  });

  if (rpcErr && (rpcErr.code === '42883' || /function.*does not exist/i.test(rpcErr.message || ''))) {
    console.log('\nincrement_feature_usage RPC is missing.');
    console.log('Re-run the SQL in backend/src/database/feature-usage-schema.sql.');
    return;
  }

  console.log('increment_feature_usage RPC is installed.');

  // Clean up the test row we just created.
  await supabase
    .from('feature_usage')
    .delete()
    .eq('user_id', '00000000-0000-0000-0000-000000000000');

  console.log('\nAll good — quota tracking is ready.');
}

run().catch((err) => {
  console.error('Migration check failed:', err.message);
  process.exit(1);
});
