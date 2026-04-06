import { Hono } from "hono";
import { ExpenseService } from "../services/expense.service.supabase";
import { ExpenseEvents } from "../behaviors/expense.behavior";

const expenses = new Hono();

// ============================================
// Static routes MUST come before parameterized routes
// ============================================

// Search expenses with dynamic text matching and date range filtering
expenses.get("/search", async (c) => {
  const query = c.req.query("q") || c.req.query("query") || "";
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const category = c.req.query("category");
  const state = c.req.query("state");
  const createdBy = c.req.query("createdBy");
  const limit = c.req.query("limit");

  const searchOptions: any = {};

  if (query) searchOptions.query = query;
  if (startDate) searchOptions.startDate = new Date(startDate);
  if (endDate) searchOptions.endDate = new Date(endDate);
  if (category) searchOptions.category = category;
  if (state) searchOptions.state = state;
  if (createdBy) searchOptions.createdBy = createdBy;
  if (limit) searchOptions.limit = parseInt(limit);

  const result = await ExpenseService.search(searchOptions);

  // Convert highlights Map to object for JSON serialization
  const highlightsObj: Record<string, string[]> = {};
  result.highlights.forEach((fields, id) => {
    highlightsObj[id] = fields;
  });

  return c.json({
    expenses: result.expenses,
    total: result.total,
    highlights: highlightsObj,
    query: query,
    filters: {
      startDate: startDate || null,
      endDate: endDate || null,
      category: category || null,
      state: state || null
    }
  });
});

// Get statistics
expenses.get("/stats/summary", async (c) => {
  const userId = c.req.query("userId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  const stats = await ExpenseService.getStatistics(
    userId,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  );
  return c.json(stats);
});

// Get period totals (today, week, month, year)
expenses.get("/stats/period/:period", async (c) => {
  const period = c.req.param("period") as 'today' | 'week' | 'month' | 'year';
  const userId = c.req.query("userId");

  if (!['today', 'week', 'month', 'year'].includes(period)) {
    return c.json({ error: "Invalid period. Use: today, week, month, or year" }, 400);
  }

  const stats = await ExpenseService.getPeriodTotals(period, userId);
  return c.json(stats);
});

// Get daily totals for a specific month and year
expenses.get("/stats/daily-totals", async (c) => {
  const year = c.req.query("year");
  const month = c.req.query("month");
  const userId = c.req.query("userId");

  if (!year || !month) {
    return c.json({ error: "Year and month are required" }, 400);
  }

  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return c.json({ error: "Invalid year or month" }, 400);
  }

  const dailyTotals = await ExpenseService.getDailyTotals(yearNum, monthNum, userId);
  return c.json(dailyTotals);
});

// Get all expenses with date filtering
expenses.get("/", async (c) => {
  const state = c.req.query("state");
  const createdBy = c.req.query("createdBy");
  const category = c.req.query("category");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  const filters: any = {};
  if (state) filters.state = state;
  if (createdBy) filters.createdBy = createdBy;
  if (category) filters.category = category;
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);

  const allExpenses = await ExpenseService.getAll(filters);
  return c.json(allExpenses);
});

// ============================================
// Parameterized routes come AFTER static routes
// ============================================

// Get expense by ID
expenses.get("/:id", async (c) => {
  const id = c.req.param("id");
  const expense = await ExpenseService.getById(id);

  if (!expense) {
    return c.json({ error: "Expense not found" }, 404);
  }

  return c.json(expense);
});

// Get expense history
expenses.get("/:id/history", async (c) => {
  const id = c.req.param("id");
  const history = await ExpenseService.getHistory(id);
  return c.json(history);
});

// Create new expense
expenses.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const expense = await ExpenseService.create({
      title: body.title,
      description: body.description || "",
      amount: parseFloat(body.amount),
      currency: body.currency || "PHP",
      category: body.category,
      date: new Date(body.date),
      paymentMethod: body.paymentMethod || "cash",
      createdBy: body.createdBy,
      receipts: body.receipts || [],
      metadata: body.metadata || {},
    });

    if (!expense) {
      return c.json({ error: "Failed to create expense" }, 400);
    }

    return c.json(expense, 201);
  } catch (error) {
    return c.json({ error: "Failed to create expense", details: String(error) }, 400);
  }
});

// Update expense
expenses.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const updates: any = {};
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.amount) updates.amount = parseFloat(body.amount);
    if (body.category) updates.category = body.category;
    if (body.date) updates.date = new Date(body.date);
    if (body.paymentMethod) updates.paymentMethod = body.paymentMethod;

    const expense = await ExpenseService.update(id, updates);

    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }

    return c.json(expense);
  } catch (error) {
    return c.json({ error: "Failed to update expense", details: String(error) }, 400);
  }
});

// Archive expense
expenses.post("/:id/archive", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const expense = await ExpenseService.transition(
      id,
      "ARCHIVE",
      {
        archivedBy: body.archivedBy || body.userId || "system",
        timestamp: new Date()
      } as ExpenseEvents["ARCHIVE"],
      body.archivedBy || body.userId || "system"
    );

    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }

    return c.json(expense);
  } catch (error) {
    return c.json({ error: "Failed to archive expense", details: String(error) }, 400);
  }
});

// Restore archived expense
expenses.post("/:id/restore", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const expense = await ExpenseService.transition(
      id,
      "RESTORE",
      {
        restoredBy: body.restoredBy || body.userId || "system",
        timestamp: new Date()
      } as ExpenseEvents["RESTORE"],
      body.restoredBy || body.userId || "system"
    );

    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }

    return c.json(expense);
  } catch (error) {
    return c.json({ error: "Failed to restore expense", details: String(error) }, 400);
  }
});

// Delete expense
expenses.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const success = await ExpenseService.delete(id);

  if (!success) {
    return c.json({ error: "Expense not found" }, 404);
  }

  return c.json({ message: "Expense deleted successfully" });
});

export default expenses;