import { pool, generateId } from "../db/mariadb";
import { BehaviorMachine } from "../behaviors/core";
import { expenseBehavior, ExpenseData, ExpenseEvents, ExpenseState } from "../behaviors/expense.behavior";

export interface Expense extends ExpenseData {
  state: ExpenseState;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpenseService {
  // Create a new expense (automatically set to active for daily tracking)
  static async create(data: Omit<ExpenseData, "id">): Promise<Expense> {
    const id = generateId();
    const now = new Date();
    
    const expense: Expense = {
      ...data,
      id,
      paymentMethod: data.paymentMethod || 'cash',
      state: "active", // Daily expenses are immediately active
      createdAt: now,
      updatedAt: now,
    };

    await pool.execute(
      `INSERT INTO expenses (id, title, description, amount, currency, category_id, date, state, payment_method, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.title,
        expense.description,
        expense.amount,
        expense.currency,
        expense.category,
        expense.date,
        expense.state,
        expense.paymentMethod,
        expense.createdBy
      ]
    );

    await this.addHistory(expense.id, null, "active", "CREATE", {}, expense.createdBy);

    return expense;
  }

  // Get expense by ID
  static async getById(id: string): Promise<Expense | null> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM expenses WHERE id = ?",
      [id]
    );

    if (rows.length === 0) return null;

    return this.mapRowToExpense(rows[0]);
  }

  // Get all expenses with date filtering for daily tracking
  static async getAll(filters?: {
    state?: ExpenseState;
    createdBy?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    let query = "SELECT * FROM expenses WHERE 1=1";
    const params: any[] = [];

    if (filters?.state) {
      query += " AND state = ?";
      params.push(filters.state);
    }

    if (filters?.createdBy) {
      query += " AND created_by = ?";
      params.push(filters.createdBy);
    }

    if (filters?.category) {
      query += " AND category_id = ?";
      params.push(filters.category);
    }

    if (filters?.startDate) {
      query += " AND date >= ?";
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += " AND date <= ?";
      params.push(filters.endDate);
    }

    query += " ORDER BY date DESC, created_at DESC";

    const [rows]: any = await pool.execute(query, params);

    return rows.map((row: any) => this.mapRowToExpense(row));
  }

  // Update expense
  static async update(id: string, updates: Partial<ExpenseData>): Promise<Expense | null> {
    const expense = await this.getById(id);
    if (!expense) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.amount !== undefined) {
      fields.push("amount = ?");
      values.push(updates.amount);
    }
    if (updates.category !== undefined) {
      fields.push("category_id = ?");
      values.push(updates.category);
    }
    if (updates.date !== undefined) {
      fields.push("date = ?");
      values.push(updates.date);
    }
    if (updates.paymentMethod !== undefined) {
      fields.push("payment_method = ?");
      values.push(updates.paymentMethod);
    }

    if (fields.length === 0) return expense;

    fields.push("updated_at = NOW()");
    values.push(id);

    await pool.execute(
      `UPDATE expenses SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  // Transition expense state
  static async transition(
    id: string,
    eventType: keyof ExpenseEvents,
    eventData: ExpenseEvents[keyof ExpenseEvents],
    performedBy: string
  ): Promise<Expense | null> {
    const expense = await this.getById(id);
    if (!expense) return null;

    // Create behavior machine with current state
    const machine = new BehaviorMachine(expenseBehavior, expense, expense.state);

    // Attempt transition
    const success = await machine.transition(eventType, eventData);
    
    if (!success) {
      throw new Error(`Invalid transition: ${eventType} from state ${expense.state}`);
    }

    const newState = machine.getState();
    const oldState = expense.state;

    // Update database
    await pool.execute(
      "UPDATE expenses SET state = ?, updated_at = NOW() WHERE id = ?",
      [newState, id]
    );

    // Add to history
    await this.addHistory(id, oldState, newState, eventType, eventData, performedBy);

    return this.getById(id);
  }

  // Get expense history
  static async getHistory(expenseId: string) {
    const [rows]: any = await pool.execute(
      `SELECT * FROM expense_history 
       WHERE expense_id = ? 
       ORDER BY timestamp ASC`,
      [expenseId]
    );

    return rows.map((row: any) => ({
      ...row,
      event_data: row.event_data ? JSON.parse(row.event_data) : null
    }));
  }

  // Add history entry
  private static async addHistory(
    expenseId: string,
    fromState: ExpenseState | null,
    toState: ExpenseState,
    eventType: string,
    eventData: any,
    performedBy: string
  ): Promise<void> {
    await pool.execute(
      `INSERT INTO expense_history (id, expense_id, from_state, to_state, event_type, event_data, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        expenseId,
        fromState,
        toState,
        eventType,
        JSON.stringify(eventData),
        performedBy
      ]
    );
  }

  // Delete expense
  static async delete(id: string): Promise<boolean> {
    const [result]: any = await pool.execute(
      "DELETE FROM expenses WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Helper to map database row to Expense object
  private static mapRowToExpense(row: any): Expense {
    return {
      id: row.id,
      title: row.title,
      description: row.description || "",
      amount: parseFloat(row.amount),
      currency: row.currency,
      category: row.category_id,
      date: new Date(row.date),
      state: row.state as ExpenseState,
      paymentMethod: row.payment_method || 'cash',
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      receipts: [],
      metadata: {},
    };
  }

  // Get statistics optimized for daily expense tracking
  static async getStatistics(userId?: string, startDate?: Date, endDate?: Date) {
    let query = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_amount,
        state
      FROM expenses
      WHERE 1=1
    `;

    const params: any[] = [];
    
    if (userId) {
      query += " AND created_by = ?";
      params.push(userId);
    }

    if (startDate) {
      query += " AND date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND date <= ?";
      params.push(endDate);
    }

    query += " GROUP BY state";

    const [results]: any = await pool.execute(query, params);

    // Convert DECIMAL strings to numbers
    return results.map((row: any) => ({
      total_count: parseInt(row.total_count) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
      avg_amount: parseFloat(row.avg_amount) || 0,
      state: row.state
    }));
  }

  // Get daily/weekly/monthly totals
  static async getPeriodTotals(period: 'today' | 'week' | 'month' | 'year', userId?: string) {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return this.getStatistics(userId, startDate, now);
  }

  // Search expenses with dynamic text matching and date range filtering
  static async search(options: {
    query?: string;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    state?: ExpenseState;
    createdBy?: string;
    limit?: number;
  }): Promise<{ expenses: Expense[]; total: number; highlights: Map<string, string[]> }> {
    const { query, startDate, endDate, category, state, createdBy, limit = 50 } = options;
    
    let sqlQuery = `
      SELECT e.*, c.name as category_name 
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Date range filtering
    if (startDate) {
      sqlQuery += " AND e.date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      sqlQuery += " AND e.date <= ?";
      params.push(endDate);
    }

    // Category filter
    if (category) {
      sqlQuery += " AND e.category_id = ?";
      params.push(category);
    }

    // State filter
    if (state) {
      sqlQuery += " AND e.state = ?";
      params.push(state);
    }

    // Created by filter
    if (createdBy) {
      sqlQuery += " AND e.created_by = ?";
      params.push(createdBy);
    }

    // Text search across multiple fields (if query provided)
    if (query && query.trim()) {
      const searchTerms = query.trim().toLowerCase().split(/\s+/);
      
      // Build search conditions for each term - must match at least one field
      searchTerms.forEach((term) => {
        sqlQuery += ` AND (
          LOWER(e.title) LIKE ? OR 
          LOWER(e.description) LIKE ? OR 
          CAST(e.amount AS CHAR) LIKE ? OR
          LOWER(c.name) LIKE ?
        )`;
        const likeTerm = `%${term}%`;
        params.push(likeTerm, likeTerm, likeTerm, likeTerm);
      });
    }

    sqlQuery += " ORDER BY e.date DESC, e.created_at DESC";
    
    // Get total count first
    const countQuery = sqlQuery.replace(
      /SELECT e\.\*, c\.name as category_name/,
      "SELECT COUNT(*) as count"
    ).replace(/ORDER BY.*$/, "");
    
    const [countResult]: any = await pool.execute(countQuery, params);
    const total = countResult[0]?.count || 0;

    // Apply limit
    sqlQuery += " LIMIT ?";
    params.push(limit);

    const [rows]: any = await pool.execute(sqlQuery, params);

    // Build highlights map for matched terms
    const highlights = new Map<string, string[]>();
    
    if (query && query.trim()) {
      const searchTerms = query.trim().toLowerCase().split(/\s+/);
      
      rows.forEach((row: any) => {
        const matchedFields: string[] = [];
        
        searchTerms.forEach(term => {
          if (row.title?.toLowerCase().includes(term)) {
            if (!matchedFields.includes('title')) matchedFields.push('title');
          }
          if (row.description?.toLowerCase().includes(term)) {
            if (!matchedFields.includes('description')) matchedFields.push('description');
          }
          if (row.amount?.toString().includes(term)) {
            if (!matchedFields.includes('amount')) matchedFields.push('amount');
          }
          if (row.category_name?.toLowerCase().includes(term)) {
            if (!matchedFields.includes('category')) matchedFields.push('category');
          }
        });
        
        if (matchedFields.length > 0) {
          highlights.set(row.id, matchedFields);
        }
      });
    }

    return {
      expenses: rows.map((row: any) => this.mapRowToExpense(row)),
      total,
      highlights
    };
  }

  // Get daily totals grouped by day for a specific month and year
  static async getDailyTotals(year: number, month: number, userId?: string) {
    // month is 0-indexed in JavaScript Date, but we'll use 1-indexed (1-12)
    // Calculate the last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    
    // Format dates as YYYY-MM-DD strings to avoid timezone conversion issues
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let query = `
      SELECT 
        DATE(date) as day,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM expenses
      WHERE DATE(date) >= DATE(?) AND DATE(date) <= DATE(?)
        AND state != 'archived'
    `;

    const params: any[] = [
      startDateStr,
      endDateStr
    ];
    
    if (userId) {
      query += " AND created_by = ?";
      params.push(userId);
    }

    query += " GROUP BY DATE(date) ORDER BY day ASC";

    const [rows]: any = await pool.execute(query, params);
    
    // Filter results to ensure they match the selected month/year exactly
    // This prevents timezone-related issues from including dates from adjacent months
    const filteredResults = (rows as any[]).filter((row: any) => {
      let dateStr: string;
      
      // Handle different date formats from MariaDB
      if (row.day instanceof Date) {
        // Convert Date object to YYYY-MM-DD string
        const d = row.day;
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (typeof row.day === 'string') {
        dateStr = row.day;
      } else {
        return false;
      }
      
      if (!dateStr) return false;
      const [resultYear, resultMonth] = dateStr.split('-').map(Number);
      return resultYear === year && resultMonth === month;
    });

    return filteredResults.map((row: any) => {
      // Ensure day is returned as a string in YYYY-MM-DD format
      let dayStr: string;
      if (row.day instanceof Date) {
        const d = row.day;
        dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (typeof row.day === 'string') {
        dayStr = row.day;
      } else {
        dayStr = String(row.day);
      }
      
      return {
        day: dayStr,
        count: row.count,
        total_amount: parseFloat(row.total_amount) || 0,
        avg_amount: parseFloat(row.avg_amount) || 0
      };
    });
  }
}
