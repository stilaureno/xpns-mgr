import db, { generateId } from "./database";

console.log("Seeding database...");

// Seed users
const users = [
  { id: generateId(), name: "John Doe", email: "john@example.com", role: "user" },
  { id: generateId(), name: "Jane Smith", email: "jane@example.com", role: "approver" },
  { id: generateId(), name: "Admin User", email: "admin@example.com", role: "admin" },
];

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (id, name, email, role) VALUES (?, ?, ?, ?)"
);

for (const user of users) {
  insertUser.run(user.id, user.name, user.email, user.role);
}

// Seed categories for daily expense tracking
const categories = [
  { id: generateId(), name: "Uncategorized", description: "Uncategorized expenses", color: "#6B7280" },
  { id: generateId(), name: "Groceries", description: "Food and household items", color: "#10B981" },
  { id: generateId(), name: "Fare", description: "Transportation and travel", color: "#3B82F6" },
  { id: generateId(), name: "Food & Dining", description: "Restaurants and takeout", color: "#F59E0B" },
  { id: generateId(), name: "Bills", description: "Utilities and monthly bills", color: "#EF4444" },
  { id: generateId(), name: "Shopping", description: "Personal shopping", color: "#8B5CF6" },
  { id: generateId(), name: "Entertainment", description: "Movies, games, hobbies", color: "#EC4899" },
  { id: generateId(), name: "Health", description: "Medical and pharmacy", color: "#14B8A6" },
  { id: generateId(), name: "Other", description: "Miscellaneous expenses", color: "#6B7280" },
];

const insertCategory = db.prepare(
  "INSERT OR IGNORE INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)"
);

for (const category of categories) {
  insertCategory.run(category.id, category.name, category.description, category.color);
}

console.log(`Seeded ${users.length} users and ${categories.length} categories`);
console.log("Database seeding completed!");
