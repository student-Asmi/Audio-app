const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please check your SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client for user operations (using anon key for client-side if needed)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase configured successfully');
console.log(`📊 Project URL: ${supabaseUrl}`);

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count');
    if (error) {
      console.log('⚠️  Database connection test:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.log('⚠️  Database connection test:', error.message);
  }
}

testConnection();

module.exports = {
  supabase,
  supabaseAdmin
};