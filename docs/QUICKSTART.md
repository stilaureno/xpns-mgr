# Quick Start Guide

Get up and running with the Expense Manager in 5 minutes!

## Prerequisites

Make sure you have **Bun** installed:

```bash
# Check if Bun is installed
bun --version

# If not installed, install it
curl -fsSL https://bun.sh/install | bash
```

## Installation

### 1. Navigate to the project

```bash
cd /root/bun
```

### 2. Install dependencies

```bash
bun install
```

Expected output:
```
bun install v1.x.x
✓ Installed dependencies
```

### 3. Initialize the database

```bash
bun run db:migrate
```

Expected output:
```
Running database migrations...
Database initialized successfully
Migrations completed successfully!
```

### 4. Seed sample data

```bash
bun run db:seed
```

Expected output:
```
Seeding database...
Seeded 3 users and 6 categories
Database seeding completed!
```

### 5. Start the server

```bash
bun run dev
```

Expected output:
```
🚀 Server starting on http://localhost:3000
```

### 6. Open your browser

Navigate to: **http://localhost:3000**

You should see the Expense Manager dashboard!

## First Steps

### Create Your First Expense

1. Click the **"+ New Expense"** button
2. Fill in the details:
   - Title: "Team Lunch"
   - Description: "Monthly team building"
   - Amount: 85.00
   - Category: Select "Food"
   - Date: Today's date
   - User: Select "John Doe"
3. Click **"Save Expense"**

### Submit for Approval

1. Find your expense in the list
2. Click the **"Submit"** button
3. The status will change to "Pending Approval"

### Approve the Expense

1. Click the **"Approve"** button
2. The status will change to "Approved"

### Mark as Paid

1. Click the **"Mark Paid"** button
2. The status will change to "Paid"

### Archive the Expense

1. Click the **"Archive"** button
2. The expense is now archived

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# List all expenses
curl http://localhost:3000/api/expenses

# List all categories
curl http://localhost:3000/api/categories

# List all users
curl http://localhost:3000/api/users
```

### Using JavaScript

Open your browser console on http://localhost:3000 and try:

```javascript
// Fetch all expenses
const expenses = await fetch('/api/expenses').then(r => r.json());
console.log(expenses);

// Fetch statistics
const stats = await fetch('/api/expenses/stats/summary').then(r => r.json());
console.log(stats);
```

## Common Tasks

### View Database

The database file is located at `./expenses.db`

You can view it with any SQLite viewer:

```bash
# Using Bun's SQLite
bun repl
> const { Database } = require("bun:sqlite");
> const db = new Database("./expenses.db");
> db.query("SELECT * FROM expenses").all();
```

### Reset Database

```bash
# Delete the database
rm expenses.db

# Re-run migrations and seed
bun run db:migrate
bun run db:seed
```

### Run Tests

```bash
bun test
```

### Stop the Server

Press `Ctrl + C` in the terminal where the server is running.

## Troubleshooting

### Port already in use

If port 3000 is already in use, change it:

```bash
PORT=3001 bun run dev
```

Then open http://localhost:3001

### Database locked error

Make sure no other process is using the database:

```bash
# Find processes using the database
lsof | grep expenses.db

# Kill the process if needed
kill -9 <PID>
```

### Cannot install dependencies

Make sure Bun is properly installed:

```bash
which bun
bun --version
```

## Next Steps

- **Read the [BHVR Pattern Guide](./docs/BHVR_PATTERN.md)** to understand the state machine
- **Check [API Examples](./docs/API_EXAMPLES.md)** for more API usage
- **Review [Deployment Guide](./docs/DEPLOYMENT.md)** for production deployment

## Project Structure Overview

```
expense-manager/
├── src/
│   ├── behaviors/       # State machine logic
│   ├── db/              # Database & migrations
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── index.ts         # Server entry point
├── public/
│   └── index.html       # Frontend UI
├── tests/               # Test files
├── docs/                # Documentation
└── package.json         # Dependencies
```

## Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run db:migrate` | Initialize database schema |
| `bun run db:seed` | Add sample data |
| `bun test` | Run test suite |

## Getting Help

- Check the main [README.md](../README.md) for detailed documentation
- Review [API Examples](./API_EXAMPLES.md) for API usage
- Read [BHVR Pattern Guide](./BHVR_PATTERN.md) for state machine details

---

**Ready to build something awesome? Let's go! 🚀**
