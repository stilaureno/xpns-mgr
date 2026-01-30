# Development Commands Cheat Sheet

Quick reference for common commands used in the Expense Manager project.

## 📦 Project Setup

```bash
# Clone/navigate to project
cd /root/bun

# Install dependencies (requires Bun)
bun install

# Setup environment
cp .env.example .env
```

## 🗄️ Database Commands

```bash
# Initialize database schema
bun run db:migrate

# Seed sample data (users and categories)
bun run db:seed

# View database content (using Bun SQLite)
bun repl
> const { Database } = require("bun:sqlite");
> const db = new Database("./expenses.db");
> db.query("SELECT * FROM expenses").all();
> db.query("SELECT * FROM users").all();
> db.query("SELECT * FROM categories").all();
> .exit

# Reset database (clean slate)
rm expenses.db
bun run db:migrate
bun run db:seed

# Backup database
cp expenses.db expenses_backup_$(date +%Y%m%d).db

# Restore database
cp expenses_backup_20251231.db expenses.db
```

## 🚀 Running the Application

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run start

# Run on different port
PORT=3001 bun run dev

# Run with custom database path
DATABASE_PATH=./custom.db bun run dev
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test tests/expense.behavior.test.ts

# Run tests with coverage
bun test --coverage
```

## 🌐 API Testing

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

# Get expense statistics
curl http://localhost:3000/api/expenses/stats/summary

# Create new expense
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Expense",
    "amount": 100,
    "category": "category-id",
    "date": "2025-12-31",
    "createdBy": "user-id"
  }'

# Filter expenses by state
curl "http://localhost:3000/api/expenses?state=pending_approval"

# Get expense by ID
curl http://localhost:3000/api/expenses/{expense-id}

# Submit expense for approval
curl -X POST http://localhost:3000/api/expenses/{expense-id}/submit \
  -H "Content-Type: application/json" \
  -d '{"submittedBy": "user-id"}'

# Approve expense
curl -X POST http://localhost:3000/api/expenses/{expense-id}/approve \
  -H "Content-Type: application/json" \
  -d '{"approvedBy": "approver-id"}'

# Reject expense
curl -X POST http://localhost:3000/api/expenses/{expense-id}/reject \
  -H "Content-Type: application/json" \
  -d '{"rejectedBy": "approver-id", "reason": "Missing receipt"}'

# Get expense history
curl http://localhost:3000/api/expenses/{expense-id}/history
```

### Using httpie (if installed)

```bash
# Install httpie
pip install httpie

# List expenses
http GET http://localhost:3000/api/expenses

# Create expense
http POST http://localhost:3000/api/expenses \
  title="Test" \
  amount=100 \
  category="cat-id" \
  date="2025-12-31" \
  createdBy="user-id"
```

### Using Bun fetch (in REPL)

```bash
bun repl

> const res = await fetch('http://localhost:3000/api/expenses');
> const data = await res.json();
> console.log(data);
```

## 📊 Database Queries

```bash
# Start Bun REPL
bun repl

# Common queries
> const { Database } = require("bun:sqlite");
> const db = new Database("./expenses.db");

# Count expenses by state
> db.query("SELECT state, COUNT(*) as count FROM expenses GROUP BY state").all();

# Total amount by state
> db.query("SELECT state, SUM(amount) as total FROM expenses GROUP BY state").all();

# Recent expenses
> db.query("SELECT * FROM expenses ORDER BY created_at DESC LIMIT 10").all();

# Expenses pending approval
> db.query("SELECT * FROM expenses WHERE state = 'pending_approval'").all();

# User with most expenses
> db.query(`
    SELECT u.name, COUNT(e.id) as expense_count 
    FROM users u 
    LEFT JOIN expenses e ON u.id = e.created_by 
    GROUP BY u.id 
    ORDER BY expense_count DESC
  `).all();

# Expense history for specific expense
> db.query("SELECT * FROM expense_history WHERE expense_id = ?").all('expense-id');

# Exit REPL
> .exit
```

## 🔍 Debugging

```bash
# View server logs (if running with systemd)
journalctl -u expense-manager -f

# View process info (if using PM2)
pm2 list
pm2 logs expense-manager
pm2 monit

# Check port usage
lsof -i :3000
netstat -tlnp | grep 3000

# Check Bun version
bun --version

# Check process
ps aux | grep bun
```

## 📝 Code Quality

```bash
# Format code (if using Prettier)
npx prettier --write "src/**/*.ts"

# Type check
bun run tsc --noEmit

# Lint (if using ESLint)
npx eslint src/
```

## 🔧 Maintenance

```bash
# Update dependencies
bun update

# Clean install
rm -rf node_modules bun.lockb
bun install

# Check for outdated packages
bun outdated

# Backup everything
tar -czf expense-manager-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=*.db \
  .
```

## 🚢 Deployment

```bash
# Build for production (if needed)
# Note: Bun doesn't require build step for TypeScript

# Copy to server
rsync -avz --exclude 'node_modules' --exclude '*.db' \
  . user@server:/path/to/expense-manager/

# On server: Install dependencies
ssh user@server "cd /path/to/expense-manager && bun install"

# On server: Run migrations
ssh user@server "cd /path/to/expense-manager && bun run db:migrate"

# On server: Start service
ssh user@server "sudo systemctl restart expense-manager"

# Check service status
ssh user@server "sudo systemctl status expense-manager"
```

## 🐋 Docker Commands

```bash
# Build image
docker build -t expense-manager .

# Run container
docker run -p 3000:3000 expense-manager

# Run with volume for database persistence
docker run -p 3000:3000 -v $(pwd)/data:/data expense-manager

# Using docker-compose
docker-compose up -d
docker-compose logs -f
docker-compose down
docker-compose ps
docker-compose restart
```

## 🔐 Security

```bash
# Generate random secret (for future JWT implementation)
openssl rand -base64 32

# Check file permissions
ls -la expenses.db

# Set correct permissions
chmod 600 expenses.db
chown www-data:www-data expenses.db
```

## 📦 Git Commands (if using version control)

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: Expense Manager with BHVR pattern"

# Add remote
git remote add origin <your-repo-url>
git push -u origin main

# Create feature branch
git checkout -b feature/email-notifications

# Commit changes
git add .
git commit -m "Add email notifications on approval"

# Push changes
git push origin feature/email-notifications
```

## 📈 Performance Testing

```bash
# Using Apache Bench (if installed)
ab -n 1000 -c 10 http://localhost:3000/api/expenses

# Using wrk (if installed)
wrk -t12 -c400 -d30s http://localhost:3000/api/expenses

# Simple load test with curl
for i in {1..100}; do
  curl -s http://localhost:3000/api/expenses > /dev/null &
done
wait
```

## 💡 Useful One-Liners

```bash
# Get all expense IDs
curl -s http://localhost:3000/api/expenses | jq -r '.[].id'

# Count expenses by state
curl -s http://localhost:3000/api/expenses | jq 'group_by(.state) | map({state: .[0].state, count: length})'

# Total amount of all expenses
curl -s http://localhost:3000/api/expenses | jq 'map(.amount) | add'

# Find user ID by email
curl -s http://localhost:3000/api/users | jq -r '.[] | select(.email=="john@example.com") | .id'

# Complete expense workflow
EXPENSE_ID=$(curl -s -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","amount":100,"category":"cat-id","date":"2025-12-31","createdBy":"user-id"}' \
  | jq -r '.id') && \
curl -X POST http://localhost:3000/api/expenses/$EXPENSE_ID/submit \
  -H "Content-Type: application/json" \
  -d '{"submittedBy":"user-id"}' && \
echo "Expense $EXPENSE_ID submitted"
```

## 🎓 Learning & Documentation

```bash
# Read documentation
cat README.md | less
cat docs/QUICKSTART.md | less
cat docs/BHVR_PATTERN.md | less

# View project structure
cat STRUCTURE.txt

# View all available scripts
cat package.json | jq '.scripts'

# Open documentation in browser (Linux)
xdg-open README.md

# Count lines of code
find src -name "*.ts" | xargs wc -l
```

## 🆘 Troubleshooting

```bash
# Server won't start - check port
sudo lsof -i :3000
# Kill process using port
sudo kill -9 <PID>

# Database locked
# Close all connections, then:
rm expenses.db-journal

# Permission denied on database
sudo chown $USER:$USER expenses.db
chmod 644 expenses.db

# Module not found
rm -rf node_modules bun.lockb
bun install

# Clear cache
bun pm cache rm

# Check server health
curl -f http://localhost:3000/health || echo "Server not responding"
```

## 📱 Quick Reference URLs

When server is running on http://localhost:3000:

- **Main UI**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **All Expenses**: http://localhost:3000/api/expenses
- **All Categories**: http://localhost:3000/api/categories
- **All Users**: http://localhost:3000/api/users
- **Statistics**: http://localhost:3000/api/expenses/stats/summary

---

## 🔖 Bookmarks

Save these commands for quick access:

```bash
# Quick start
alias expense-start="cd /root/bun && bun run dev"

# Quick test
alias expense-test="cd /root/bun && bun test"

# Quick reset
alias expense-reset="cd /root/bun && rm -f expenses.db && bun run db:migrate && bun run db:seed"
```

Add to your `~/.bashrc` or `~/.zshrc` to make permanent.

---

**Pro Tip**: Keep this file open in a terminal window for quick reference while developing!
