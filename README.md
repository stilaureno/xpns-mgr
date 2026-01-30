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
│   │   ├── migrate.ts      # Database migrations
│   │   └── seed.ts         # Seed data
│   ├── routes/             # API routes
│   │   ├── expenses.ts     # Expense endpoints
│   │   ├── categories.ts   # Category endpoints
│   │   └── users.ts        # User endpoints
│   ├── services/           # Business logic
│   │   ├── expense.service.ts
│   │   ├── category.service.ts
│   │   └── user.service.ts
│   └── index.ts            # Application entry point
├── public/
│   └── index.html          # Frontend UI
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- **Bun** (latest version)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Initialize the database:**
   ```bash
   bun run db:migrate
   ```

3. **Seed sample data:**
   ```bash
   bun run db:seed
   ```

4. **Start the development server:**
   ```bash
   bun run dev
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
