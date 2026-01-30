import { Database } from "bun:sqlite";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./expenses.db";

export const db = new Database(DB_PATH, { create: true });

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create tables
export function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'approver', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Expenses table
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'PHP',
      category_id TEXT,
      date DATETIME NOT NULL,
      state TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Expense history table (for state transitions)
  db.run(`
    CREATE TABLE IF NOT EXISTS expense_history (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT,
      performed_by TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(id)
    )
  `);

  // Receipts table
  db.run(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mimetype TEXT,
      size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(id)
    )
  `);

  console.log("Database initialized successfully");
}

// Helper function to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

export default db;
