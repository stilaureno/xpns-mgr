import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serveStatic } from "hono/bun";
import { initializeDatabase } from "./db/database";
import expenses from "./routes/expenses";
import categories from "./routes/categories";
import users from "./routes/users";

// Initialize database
initializeDatabase();

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// Serve static files
app.use("/*", serveStatic({ root: "./public" }));

// Health check
app.get("/health", (c) => {
  return c.json({
    name: "Expense Manager API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route("/api/expenses", expenses);
app.route("/api/categories", categories);
app.route("/api/users", users);

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

console.log(`🚀 Server starting on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
