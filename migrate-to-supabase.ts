import { Database } from 'bun:sqlite';
import { createClient } from '@supabase/supabase-js';

// Initialize SQLite database
const sqliteDb = new Database('./expenses.db');

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL in environment variables');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('⚠️  Warning: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.log('To get the service role key:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Project Settings > API');
  console.log('3. Copy the "Service role secret" (not the anon key)');
  console.log('4. Add SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" to your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

async function migrateData() {
  console.log('Starting data migration from SQLite to Supabase...');

  try {
    // Migrate users
    console.log('Migrating users...');
    const sqliteUsers = sqliteDb.query('SELECT * FROM users').all();
    
    for (const user of sqliteUsers) {
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        });
        
      if (error) {
        console.error('Error inserting user:', error);
      }
    }
    console.log(`Migrated ${sqliteUsers.length} users`);

    // Migrate categories
    console.log('Migrating categories...');
    const sqliteCategories = sqliteDb.query('SELECT * FROM categories').all();
    
    for (const category of sqliteCategories) {
      const { error } = await supabase
        .from('categories')
        .insert({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          created_at: category.created_at
        });
        
      if (error) {
        console.error('Error inserting category:', error);
      }
    }
    console.log(`Migrated ${sqliteCategories.length} categories`);

    // Migrate expenses
    console.log('Migrating expenses...');
    const sqliteExpenses = sqliteDb.query(`
      SELECT 
        id, title, description, amount, currency, category_id, date, 
        state, created_by, created_at, updated_at
      FROM expenses
    `).all();
    
    for (const expense of sqliteExpenses) {
      const { error } = await supabase
        .from('expenses')
        .insert({
          id: expense.id,
          title: expense.title,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          category_id: expense.category_id,
          date: expense.date,
          state: expense.state,
          created_by: expense.created_by,
          created_at: expense.created_at,
          updated_at: expense.updated_at
        });
        
      if (error) {
        console.error('Error inserting expense:', error);
      }
    }
    console.log(`Migrated ${sqliteExpenses.length} expenses`);

    // Migrate expense history
    console.log('Migrating expense history...');
    const sqliteHistory = sqliteDb.query(`
      SELECT 
        id, expense_id, from_state, to_state, event_type, 
        event_data, performed_by, timestamp
      FROM expense_history
    `).all();
    
    for (const history of sqliteHistory) {
      const { error } = await supabase
        .from('expense_history')
        .insert({
          id: history.id,
          expense_id: history.expense_id,
          from_state: history.from_state,
          to_state: history.to_state,
          event_type: history.event_type,
          event_data: history.event_data ? JSON.parse(history.event_data) : null,
          performed_by: history.performed_by,
          timestamp: history.timestamp
        });
        
      if (error) {
        console.error('Error inserting history:', error);
      }
    }
    console.log(`Migrated ${sqliteHistory.length} history records`);

    // Migrate receipts
    console.log('Migrating receipts...');
    const sqliteReceipts = sqliteDb.query('SELECT * FROM receipts').all();
    
    for (const receipt of sqliteReceipts) {
      const { error } = await supabase
        .from('receipts')
        .insert({
          id: receipt.id,
          expense_id: receipt.expense_id,
          filename: receipt.filename,
          filepath: receipt.filepath,
          mimetype: receipt.mimetype,
          size: receipt.size,
          uploaded_at: receipt.uploaded_at
        });
        
      if (error) {
        console.error('Error inserting receipt:', error);
      }
    }
    console.log(`Migrated ${sqliteReceipts.length} receipts`);

    console.log('\n✅ Data migration completed successfully!');
    console.log('You can now run your application with Supabase:');
    console.log('HOST=0.0.0.0 PORT=4000 bun run dev:supabase');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    sqliteDb.close();
  }
}

migrateData();