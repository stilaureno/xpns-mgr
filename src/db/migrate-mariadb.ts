import { initializeDatabase, closePool } from "./mariadb";

console.log("🚀 Running MariaDB migrations...");

try {
  await initializeDatabase();
  console.log("✅ Migrations completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  await closePool();
}
