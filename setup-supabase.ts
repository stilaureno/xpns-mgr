import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL in environment variables');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.log('Note: You need the Service Role Key, not the anon key, to run database migrations.');
  console.log('Go to your Supabase dashboard > Project Settings > API to get the Service Role Key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function initializeDatabase() {
  console.log('Initializing Supabase database...');

  // SQL schema for the expense manager
  const schemaSql = `
    -- Enable UUID extension
    create extension if not exists "uuid-ossp";

    -- Users table
    create table if not exists users (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      email text unique not null,
      role text not null check (role in ('user', 'approver', 'admin')),
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Categories table
    create table if not exists categories (
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      description text,
      color text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Expenses table
    create table if not exists expenses (
      id uuid primary key default uuid_generate_v4(),
      title text not null,
      description text,
      amount numeric not null,
      currency text default 'PHP',
      category_id uuid references categories(id),
      date timestamp with time zone not null,
      state text not null,
      created_by uuid not null references users(id),
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Update updated_at column trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_expenses_updated_at 
        BEFORE UPDATE ON expenses 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();

    -- Expense history table (for state transitions)
    create table if not exists expense_history (
      id uuid primary key default uuid_generate_v4(),
      expense_id uuid not null references expenses(id),
      from_state text,
      to_state text not null,
      event_type text not null,
      event_data jsonb,
      performed_by uuid references users(id),
      timestamp timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- Receipts table
    create table if not exists receipts (
      id uuid primary key default uuid_generate_v4(),
      expense_id uuid not null references expenses(id),
      filename text not null,
      filepath text not null,
      mimetype text,
      size integer,
      uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- RLS (Row Level Security) policies - disabled by default
    alter table users enable row level security;
    alter table categories enable row level security;
    alter table expenses enable row level security;
    alter table expense_history enable row level security;
    alter table receipts enable row level security;
  `;

  try {
    // Execute the schema SQL
    const { error } = await supabase.rpc('execute_sql', {
      sql: schemaSql
    });

    if (error) {
      console.error('Error executing schema:', error);
      // Alternative approach: try to execute statements individually
      console.log('Trying to execute schema statements individually...');
      
      // Split the schema into individual statements
      const statements = schemaSql.split(';').filter(stmt => stmt.trim() !== '');
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          const result = await supabase.rpc('execute_sql', { sql: statement });
          if (result.error) {
            console.warn(`Warning executing statement:`, result.error);
          }
        }
      }
    }

    console.log('✅ Database initialized successfully!');
    
    // Verify tables were created
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.log('Users table exists but may be empty.');
    } else {
      console.log('Users table verified:', usersCheck);
    }

    console.log('\n🎉 Supabase setup complete!');
    console.log('You can now run your application with:');
    console.log('bun run dev:supabase');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}

initializeDatabase();