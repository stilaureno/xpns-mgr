import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key to modify RLS policies
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL in environment variables');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function configureRLSPolicies() {
  console.log('Configuring Row Level Security policies...');

  try {
    // For now, let's disable RLS for all tables to make data accessible
    // In production, you would want to set up more granular policies
    
    // Disable RLS for all tables
    const rlsQueries = [
      'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.expense_history DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;'
    ];
    
    for (const query of rlsQueries) {
      // Since Supabase doesn't have a direct method to execute raw SQL,
      // you would need to run these queries in the SQL Editor in your Supabase dashboard
      console.log(`Execute this in your Supabase SQL Editor: ${query}`);
    }
    
    console.log('');
    console.log('Alternatively, you can run these queries in your Supabase SQL Editor:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor tab');
    console.log('3. Paste and run these commands:');
    console.log('');
    for (const query of rlsQueries) {
      console.log(query);
    }
    console.log('');
    console.log('After running these commands, your data will be accessible through the API.');
    console.log('Then run your application with: HOST=0.0.0.0 PORT=4000 bun run dev:supabase');
  } catch (error) {
    console.error('❌ Error configuring RLS policies:', error);
  }
}

configureRLSPolicies();