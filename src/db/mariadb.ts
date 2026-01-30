import mysql from "mysql2/promise";

// Database configuration
const dbConfig = {
  socketPath: process.env.DB_SOCKET || "/var/run/mysqld/mysqld.sock",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "expense_manager",
};

// Create connection pool
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database and tables
export async function initializeDatabase() {
  let connection;
  
  try {
    // Connect without database to create it if needed
    const tempPool = mysql.createPool({
      socketPath: dbConfig.socketPath,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    connection = await tempPool.getConnection();
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    console.log(`✅ Database '${dbConfig.database}' ready`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role ENUM('user', 'approver', 'admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'PHP',
        category_id VARCHAR(36),
        date DATETIME NOT NULL,
        state VARCHAR(50) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_state (state),
        INDEX idx_created_by (created_by),
        INDEX idx_date (date),
        INDEX idx_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create expense_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expense_history (
        id VARCHAR(36) PRIMARY KEY,
        expense_id VARCHAR(36) NOT NULL,
        from_state VARCHAR(50),
        to_state VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_data JSON,
        performed_by VARCHAR(36),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        INDEX idx_expense_id (expense_id),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create receipts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id VARCHAR(36) PRIMARY KEY,
        expense_id VARCHAR(36) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        mimetype VARCHAR(100),
        size INT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        INDEX idx_expense_id (expense_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ All tables created successfully");
    
    await connection.release();
    await tempPool.end();
    
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    if (connection) await connection.release();
    throw error;
  }
}

// Helper function to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Get a connection from the pool
export async function getConnection() {
  return await pool.getConnection();
}

// Execute a query
export async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Close the pool
export async function closePool() {
  await pool.end();
}

export default pool;
