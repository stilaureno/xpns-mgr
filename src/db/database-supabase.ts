import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateId } from './database'; // Reuse the UUID generation function

// Type definitions matching the database schema
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'approver' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category_id?: string;
  date: string;
  state: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseHistory {
  id: string;
  expense_id: string;
  from_state?: string;
  to_state: string;
  event_type: string;
  event_data?: any;
  performed_by?: string;
  timestamp: string;
}

export interface Receipt {
  id: string;
  expense_id: string;
  filename: string;
  filepath: string;
  mimetype?: string;
  size?: number;
  uploaded_at: string;
}

// Supabase client will be created lazily when first accessed
let _supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabase) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL) {
      throw new Error('Missing SUPABASE_URL in environment variables');
    }

    if (!SUPABASE_ANON_KEY) {
      throw new Error('Missing SUPABASE_ANON_KEY in environment variables');
    }

    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  return _supabase;
};

// Initialize database - create tables if they don't exist
// Note: In Supabase, tables are typically created via the dashboard or SQL migration
// This function can be used to verify the tables exist or insert initial data
export async function initializeDatabase() {
  console.log('Supabase database connection established');

  // Get the Supabase client
  const supabase = getSupabaseClient();

  // Verify we can connect to Supabase
  try {
    const { error } = await supabase.from('users').select('count').single();
    
    if (error) {
      if (error.code === '42P01') { // 42P01 is "UndefinedTable" error
        console.warn('⚠️  Database tables not found. Please run the schema setup in your Supabase dashboard.');
      } else {
        console.error('Error connecting to Supabase:', error);
        throw error;
      }
    } else {
      console.log('✅ Supabase connection verified');
    }
  } catch (err) {
    console.warn('⚠️  Could not verify Supabase connection. Database tables may not be set up yet.');
    console.warn('💡  Please run the schema setup in your Supabase dashboard.');
  }
}

// Export the generateId function for consistency with existing code
export { generateId };

// Export default for compatibility
export default getSupabaseClient;