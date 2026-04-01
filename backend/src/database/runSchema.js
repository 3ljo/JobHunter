// One-time script to run schema.sql against Supabase
// Usage: node src/database/runSchema.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function run() {
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) console.error('Error running schema:', error);
  else console.log('Schema created successfully!');
}

run();
