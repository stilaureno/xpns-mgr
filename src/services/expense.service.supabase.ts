import { getSupabaseClient, Expense as SupabaseExpense, ExpenseHistory } from '../db/database-supabase';
import { BehaviorMachine } from "../behaviors/core";
import { expenseBehavior, ExpenseData, ExpenseEvents, ExpenseState } from "../behaviors/expense.behavior";

export interface Expense extends ExpenseData {
  state: ExpenseState;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpenseService {
  // Create a new expense
  static async create(data: Omit<ExpenseData, "id">): Promise<Expense | null> {
    const now = new Date();

    const expense: Expense = {
      ...data,
      id: crypto.randomUUID(), // Using crypto.randomUUID() for consistent ID generation
      state: "draft", // Default state for new expenses
      createdAt: now,
      updatedAt: now,
    };

    // Insert into Supabase
    const { data: insertedExpense, error } = await getSupabaseClient()
      .from('expenses')
      .insert([{
        id: expense.id,
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        category_id: expense.category,
        date: expense.date.toISOString(),
        state: expense.state,
        created_by: expense.createdBy
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return null;
    }

    // Add to history
    await this.addHistory(expense.id, null, "draft", "CREATE", {}, expense.createdBy);

    return this.mapRowToExpense(insertedExpense);
  }

  // Get expense by ID
  static async getById(id: string): Promise<Expense | null> {
    const { data: expense, error } = await getSupabaseClient()
      .from('expenses')
      .select(`
        *,
        category:categories(name),
        user:users(name)
      `)
      .eq('id', id)
      .single();

    if (error || !expense) {
      console.error('Error getting expense by ID:', error);
      return null;
    }

    return this.mapRowToExpense(expense);
  }

  // Get all expenses with filtering
  static async getAll(filters?: {
    state?: ExpenseState;
    createdBy?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    let query = getSupabaseClient().from('expenses').select(`
      *,
      category:categories(name),
      user:users(name)
    `);

    if (filters?.state) {
      query = query.eq('state', filters.state);
    }

    if (filters?.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString());
    }

    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error getting all expenses:', error);
      return [];
    }

    return data.map(row => this.mapRowToExpense(row));
  }

  // Update expense
  static async update(id: string, updates: Partial<ExpenseData>): Promise<Expense | null> {
    const expense = await this.getById(id);
    if (!expense) return null;

    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.category !== undefined) updateData.category_id = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date.toISOString();

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await getSupabaseClient()
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return null;
    }

    return this.mapRowToExpense(data);
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
    const { data, error } = await getSupabaseClient()
      .from('expenses')
      .update({ 
        state: newState,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error transitioning expense:', error);
      throw error;
    }

    // Add to history
    await this.addHistory(id, oldState, newState, eventType, eventData, performedBy);

    return this.mapRowToExpense(data);
  }

  // Get expense history
  static async getHistory(expenseId: string) {
    const { data, error } = await getSupabaseClient()
      .from('expense_history')
      .select('*')
      .eq('expense_id', expenseId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error getting expense history:', error);
      return [];
    }

    return data;
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
    const { error } = await getSupabaseClient()
      .from('expense_history')
      .insert([{
        expense_id: expenseId,
        from_state: fromState,
        to_state: toState,
        event_type: eventType,
        event_data: eventData,
        performed_by: performedBy
      }]);

    if (error) {
      console.error('Error adding history:', error);
    }
  }

  // Delete expense
  static async delete(id: string): Promise<boolean> {
    const { error } = await getSupabaseClient()
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return false;
    }

    return true;
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
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      receipts: [], // Will be populated separately if needed
      metadata: {}, // Will be populated separately if needed
    };
  }

  // Get statistics
  static async getStatistics(userId?: string, startDate?: Date, endDate?: Date) {
    // Build the base query with filters
    let query = getSupabaseClient()
      .from('expenses')
      .select(`
        state,
        amount
      `)
      .not('state', 'eq', 'archived'); // Exclude archived expenses from stats

    if (userId) {
      query = query.eq('created_by', userId);
    }

    if (startDate) {
      query = query.gte('date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('date', endDate.toISOString());
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error getting expenses for statistics:', error);
      return [];
    }

    // Manually group and calculate statistics
    const statsMap = new Map();
    
    for (const expense of expenses) {
      if (!statsMap.has(expense.state)) {
        statsMap.set(expense.state, {
          state: expense.state,
          total_count: 0,
          total_amount: 0,
          avg_amount: 0
        });
      }
      
      const stat = statsMap.get(expense.state);
      stat.total_count += 1;
      stat.total_amount += parseFloat(expense.amount) || 0;
    }
    
    // Calculate averages
    for (const stat of statsMap.values()) {
      stat.avg_amount = stat.total_count > 0 ? stat.total_amount / stat.total_count : 0;
    }
    
    return Array.from(statsMap.values());
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

    return await this.getStatistics(userId, startDate, now);
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

    let supabaseQuery = getSupabaseClient()
      .from('expenses')
      .select(`
        *,
        category:categories(name),
        user:users(name)
      `, { count: 'exact' });

    // Date range filtering
    if (startDate) {
      supabaseQuery = supabaseQuery.gte('date', startDate.toISOString());
    }

    if (endDate) {
      supabaseQuery = supabaseQuery.lte('date', endDate.toISOString());
    }

    // Category filter
    if (category) {
      supabaseQuery = supabaseQuery.eq('category_id', category);
    }

    // State filter
    if (state) {
      supabaseQuery = supabaseQuery.eq('state', state);
    }

    // Created by filter
    if (createdBy) {
      supabaseQuery = supabaseQuery.eq('created_by', createdBy);
    }

    // Text search across multiple fields (if query provided)
    if (query && query.trim()) {
      // For Supabase, we'll use ilike for case-insensitive search
      const searchTerms = query.trim().toLowerCase().split(/\s+/);
      
      searchTerms.forEach(term => {
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${term}%,description.ilike.%${term}%,amount::text.ilike.%${term}%`
        );
      });
    }

    supabaseQuery = supabaseQuery
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      console.error('Error searching expenses:', error);
      return { expenses: [], total: 0, highlights: new Map() };
    }

    // Build highlights map for matched terms
    const highlights = new Map<string, string[]>();
    
    if (query && query.trim()) {
      const searchTerms = query.trim().toLowerCase().split(/\s+/);

      data.forEach(row => {
        const matchedFields: string[] = [];

        searchTerms.forEach(term => {
          if (row.title?.toLowerCase().includes(term)) {
            if (!matchedFields.includes('title')) matchedFields.push('title');
          }
          if (row.description?.toLowerCase().includes(term)) {
            if (!matchedFields.includes('description')) matchedFields.push('description');
          }
          if (row.amount?.toString().toLowerCase().includes(term)) {
            if (!matchedFields.includes('amount')) matchedFields.push('amount');
          }
          if (row.category?.name?.toLowerCase().includes(term)) {
            if (!matchedFields.includes('category')) matchedFields.push('category');
          }
        });

        if (matchedFields.length > 0) {
          highlights.set(row.id, matchedFields);
        }
      });
    }

    return {
      expenses: data.map(row => this.mapRowToExpense(row)),
      total: count || 0,
      highlights
    };
  }

  // Get daily totals grouped by day for a specific month and year
  static async getDailyTotals(year: number, month: number, userId?: string) {
    // Format dates as YYYY-MM-DD strings
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // Calculate the last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let query = getSupabaseClient()
      .from('expenses')
      .select(`
        date,
        amount,
        state
      `)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .neq('state', 'archived'); // Exclude archived expenses

    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error getting daily totals:', error);
      return [];
    }

    // Group expenses by date and calculate totals
    const dailyTotalsMap = new Map();
    
    for (const expense of expenses) {
      const dateOnly = new Date(expense.date).toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      if (!dailyTotalsMap.has(dateOnly)) {
        dailyTotalsMap.set(dateOnly, {
          day: dateOnly,
          count: 0,
          total_amount: 0,
          avg_amount: 0
        });
      }
      
      const dayData = dailyTotalsMap.get(dateOnly);
      dayData.count += 1;
      dayData.total_amount += parseFloat(expense.amount) || 0;
    }
    
    // Calculate averages
    for (const dayData of dailyTotalsMap.values()) {
      dayData.avg_amount = dayData.count > 0 ? dayData.total_amount / dayData.count : 0;
    }
    
    // Convert map to array and sort by date
    const result = Array.from(dailyTotalsMap.values());
    result.sort((a, b) => a.day.localeCompare(b.day)); // Sort chronologically
    
    return result;
  }
}