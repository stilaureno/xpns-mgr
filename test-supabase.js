#!/usr/bin/env node

/**
 * Test script to verify Supabase integration
 */

import { supabase } from './src/db/database-supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection by querying the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Connection successful!');
    console.log('Data received:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Supabase Integration...\n');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n🎉 Supabase integration is working correctly!');
    console.log('You can now run the application with:');
    console.log('  SUPABASE_URL="your_supabase_url" SUPABASE_ANON_KEY="your_anon_key" bun run dev:supabase');
  } else {
    console.log('\n❌ Supabase integration needs configuration');
    console.log('Make sure to set your Supabase environment variables:');
    console.log('  SUPABASE_URL="your_supabase_url" SUPABASE_ANON_KEY="your_anon_key"');
  }
}

main();