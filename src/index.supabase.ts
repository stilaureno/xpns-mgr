import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serveStatic } from "hono/bun";
import { initializeDatabase } from "./db/database-supabase";
import expenses from "./routes/expenses.supabase";
import categories from "./routes/categories.supabase";
import users from "./routes/users.supabase";

// Initialize database
await initializeDatabase();

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({
    name: "Expense Manager API (Supabase)",
    version: "1.0.0",
    database: "Supabase",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (must be before static file serving)
app.route("/api/expenses", expenses);
app.route("/api/categories", categories);
app.route("/api/users", users);

// Serve static files (after API routes)
app.use("/*", serveStatic({ root: "./public" }));

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal server error", details: err.message }, 500);
});

// Start server
const port = parseInt(process.env.PORT || "3344");
const hostname = process.env.HOST || "0.0.0.0"; // Listen on all interfaces

console.log(`🚀 Server starting on http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`);
console.log(`📊 Using Supabase database`);
console.log(`🌐 Accessible from network on port ${port}`);

export default {
  port,
  hostname,
  fetch: app.fetch,
};