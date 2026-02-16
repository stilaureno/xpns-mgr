# 💰 Expense Manager

A modern, full-stack expense management application built with **Bun** and the **BHVR (Behavior)** pattern. This project demonstrates clean architecture, state machine patterns, and modern web development practices.

## ✨ Features

- **🎯 Behavior-Driven Design**: Implements state machines for expense workflow management
- **⚡ Built with Bun**: Ultra-fast JavaScript runtime and toolkit
- **🚀 REST API**: Complete API with CRUD operations and state transitions
- **💾 SQLite Database**: Lightweight, file-based database with Bun's native SQLite support
- **🎨 Modern UI**: Beautiful, responsive web interface
- **📊 Real-time Statistics**: Dashboard with expense metrics
- **🔄 State Management**: Draft → Pending → Approved → Paid workflow
- **👥 Multi-user Support**: User roles (user, approver, admin)
- **📁 Category Management**: Organize expenses by categories

## 🏗️ Architecture

### BHVR Pattern

The project uses a **Behavior Pattern** to manage expense states and transitions:

```
draft → pending_approval → approved → paid → archived
          ↓                    ↓
        rejected ←──────────────┘
```

Each state transition is:
- **Guarded**: Validates conditions before allowing transitions
- **Tracked**: Maintains full history of state changes
- **Effect-driven**: Triggers side effects (notifications, logging, etc.)

### Project Structure

```
expense-manager/
├── src/
│   ├── behaviors/          # Behavior pattern implementation
│   │   ├── core.ts         # Core behavior machine
│   │   └── expense.behavior.ts
│   ├── db/                 # Database layer
│   │   ├── database.ts     # SQLite setup & helpers
│   │   ├── database-supabase.ts # Supabase setup & helpers
│   │   ├── migrate.ts      # Database migrations
│   │   └── seed.ts         # Seed data
│   ├── routes/             # API routes
│   │   ├── expenses.ts     # Expense endpoints (SQLite)
│   │   ├── expenses.mariadb.ts # Expense endpoints (MariaDB)
│   │   ├── expenses.supabase.ts # Expense endpoints (Supabase)
│   │   ├── categories.ts   # Category endpoints (SQLite)
│   │   ├── categories.mariadb.ts # Category endpoints (MariaDB)
│   │   ├── categories.supabase.ts # Category endpoints (Supabase)
│   │   ├── users.ts        # User endpoints (SQLite)
│   │   ├── users.mariadb.ts # User endpoints (MariaDB)
│   │   └── users.supabase.ts # User endpoints (Supabase)
│   ├── services/           # Business logic
│   │   ├── expense.service.ts # Expense service (SQLite)
│   │   ├── expense.service.mariadb.ts # Expense service (MariaDB)
│   │   ├── expense.service.supabase.ts # Expense service (Supabase)
│   │   ├── category.service.ts # Category service (SQLite)
│   │   ├── category.service.mariadb.ts # Category service (MariaDB)
│   │   ├── category.service.supabase.ts # Category service (Supabase)
│   │   ├── user.service.ts # User service (SQLite)
│   │   ├── user.service.mariadb.ts # User service (MariaDB)
│   │   └── user.service.supabase.ts # User service (Supabase)
│   ├── index.ts            # Application entry point (SQLite)
│   ├── index.mariadb.ts    # Application entry point (MariaDB)
│   └── index.supabase.ts   # Application entry point (Supabase)
├── public/
│   └── index.html          # Frontend UI
├── package.json
├── supabase_schema.sql     # Supabase database schema
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- **Bun** (latest version)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Database Options

This project supports multiple database backends:

#### SQLite (Default)
- Uses Bun's native SQLite support
- Data stored in local `expenses.db` file
- Best for development and single-user deployments

#### MariaDB
- Uses MySQL-compatible database
- Better for multi-user environments
- Configure connection in `.env` file

#### Supabase (New!)
- Uses PostgreSQL backend with real-time capabilities
- Cloud-hosted solution with authentication and storage
- Perfect for scalable applications
- Requires Supabase account and configuration

### Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Choose your database:**

   **For SQLite (default):**
   ```bash
   bun run db:migrate:sqlite
   ```

   **For MariaDB:**
   ```bash
   bun run db:migrate
   ```

   **For Supabase:**
   - First, create a Supabase account at [supabase.com](https://supabase.com)
   - Create a new project and copy your URL and anon key
   - Set up your environment variables:
     ```bash
     SUPABASE_URL="your_project_url"
     SUPABASE_ANON_KEY="your_anon_key"
     ```
   - Run the database schema by copying the content from `supabase_schema.sql` file and executing it in the Supabase SQL Editor:
     1. Go to your Supabase dashboard
     2. Navigate to the "SQL Editor" tab
     3. Copy the content from `supabase_schema.sql` and run it
   - No migration command needed for Supabase

3. **Seed sample data (optional):**

   **For SQLite:**
   ```bash
   bun run db:seed:sqlite
   ```

   **For MariaDB:**
   ```bash
   bun run db:seed
   ```

   **For Supabase:** 
   - Sample data can be added through the Supabase dashboard or API
   - To migrate existing data from SQLite, you'll need the Service Role Key:
     1. Go to your Supabase dashboard
     2. Navigate to Project Settings > API
     3. Copy the "Service role secret" (not the anon key)
     4. Run the migration script: `SUPABASE_SERVICE_ROLE_KEY="your_key" bun run migrate-to-supabase.ts`
     5. After migration, you may need to adjust Row Level Security (RLS) policies:
        - Go to your Supabase SQL Editor
        - Run these commands to disable RLS temporarily:
          ```sql
          ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
          ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
          ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
          ALTER TABLE public.expense_history DISABLE ROW LEVEL SECURITY;
          ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
          ```

4. **Start the development server:**

   **For SQLite:**
   ```bash
   bun run dev:sqlite
   ```

   **For MariaDB:**
   ```bash
   bun run dev
   ```

   **For Supabase:**
   ```bash
   SUPABASE_URL="your_project_url" SUPABASE_ANON_KEY="your_anon_key" bun run dev:supabase
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses` | List all expenses (with filters) |
| GET | `/expenses/:id` | Get expense by ID |
| POST | `/expenses` | Create new expense |
| PATCH | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |
| POST | `/expenses/:id/submit` | Submit for approval |
| POST | `/expenses/:id/approve` | Approve expense |
| POST | `/expenses/:id/reject` | Reject expense |
| POST | `/expenses/:id/pay` | Mark as paid |
| POST | `/expenses/:id/archive` | Archive expense |
| GET | `/expenses/:id/history` | Get state history |
| GET | `/expenses/stats/summary` | Get statistics |

#### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create new category |
| PATCH | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create new user |

### Example Requests

**Create an expense:**
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Office Supplies",
    "description": "Purchased printer paper",
    "amount": 45.99,
    "currency": "USD",
    "category": "<category-id>",
    "date": "2025-01-01",
    "createdBy": "<user-id>"
  }'
```

**Submit for approval:**
```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/submit \
  -H "Content-Type: application/json" \
  -d '{
    "submittedBy": "<user-id>"
  }'
```

**Approve expense:**
```bash
curl -X POST http://localhost:3000/api/expenses/<expense-id>/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approvedBy": "<approver-id>"
  }'
```

## 🎯 BHVR Pattern Explained

The Behavior Pattern is a state machine implementation that provides:

### 1. Type-Safe State Definitions
```typescript
type ExpenseState = 
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid"
  | "archived";
```

### 2. Event-Driven Transitions
```typescript
interface ExpenseEvents {
  SUBMIT: { submittedBy: string; timestamp: Date };
  APPROVE: { approvedBy: string; timestamp: Date };
  REJECT: { rejectedBy: string; reason: string; timestamp: Date };
  // ...
}
```

### 3. Guard Conditions
```typescript
transitions: {
  draft: {
    SUBMIT: {
      target: "pending_approval",
      guard: (context, event) => {
        return context.data.amount > 0 && context.data.title.length > 0;
      }
    }
  }
}
```

### 4. Side Effects
```typescript
effects: {
  pending_approval: {
    onEnter: async (context) => {
      // Send notification, webhook, etc.
      console.log(`Expense ${context.data.id} submitted`);
    }
  }
}
```

## 🗄️ Database Schema

### Tables

- **users**: User accounts with roles
- **categories**: Expense categories
- **expenses**: Main expense records
- **expense_history**: State transition log
- **receipts**: File attachments (planned)

## 🛠️ Development

### Available Scripts

```bash
bun run dev          # Start development server with watch mode
bun run start        # Start production server
bun run db:migrate   # Run database migrations
bun run db:seed      # Seed database with sample data
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000
DATABASE_PATH=./expenses.db
NODE_ENV=development
```

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Automatic refresh after actions
- **Filtering**: Filter by state and category
- **Statistics Dashboard**: View expense metrics
- **Modal Forms**: Clean UI for creating expenses
- **Action Buttons**: Context-aware actions based on state

## 🔐 Security Considerations

For production deployment, consider:

- Authentication & authorization
- Input validation & sanitization
- Rate limiting
- HTTPS/TLS
- Environment variable management
- Database backups
- Error handling & logging

## 🚀 Deployment

### Production Build

```bash
bun run start
```

### Docker (Optional)

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
RUN bun run db:migrate
RUN bun run db:seed
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for learning or production.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh)
- Web framework: [Hono](https://hono.dev)
- Database: SQLite (Bun native)

## 📞 Support

For questions or issues, please open an issue on the repository.

---

**Happy Expense Tracking! 💰**
