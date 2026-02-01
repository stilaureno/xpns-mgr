# Expense Manager - Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Design](#database-design)
6. [BHVR Pattern (State Machine)](#bhvr-pattern-state-machine)
7. [API Reference](#api-reference)
8. [Services Layer](#services-layer)
9. [Frontend Architecture](#frontend-architecture)
10. [Configuration](#configuration)
11. [Setup & Installation](#setup--installation)
12. [Running the Application](#running-the-application)

---

## Project Overview

**Expense Manager** is a full-stack web application for tracking daily expenses. It is built with modern JavaScript technologies and demonstrates clean architecture patterns, specifically the BHVR (Behavior) pattern for state management.

### Key Features

- **Daily Expense Tracking**: Record and categorize daily expenses
- **State Management**: Active/Archived expense states with full transition history
- **Category Management**: Organize expenses by customizable categories
- **Multi-User Support**: User, Approver, and Admin roles
- **Statistics Dashboard**: View totals by period (today, week, month, year)
- **Search Functionality**: Full-text search across expense fields
- **Responsive UI**: Works on desktop and mobile devices

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (Vanilla HTML/CSS/JS)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Dashboard │  │ Expense List│  │   Settings Modal    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     Backend API                              │
│                      (Bun + Hono)                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Middleware                         │    │
│  │  • CORS  • Logger  • PrettyJSON  • Static Files      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │  Services   │  │   Behaviors         │  │
│  │  Expenses   │  │  Expense    │  │   (State Machine)   │  │
│  │  Categories │  │  Category   │  │                     │  │
│  │    Users    │  │    User     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│                   (SQLite with Bun)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Tables                             │    │
│  │  users | categories | expenses | expense_history     │    │
│  │                     receipts                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Clear separation between routes, services, and behaviors
2. **Single Responsibility**: Each module has one clear purpose
3. **Type Safety**: TypeScript strict mode with full type definitions
4. **State Machine**: BHVR pattern for predictable state transitions
5. **Audit Trail**: Complete history of all expense state changes

---

## Technology Stack

### Runtime & Language

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Bun | 1.0+ |
| Language | TypeScript | ESNext (Strict Mode) |
| Package Manager | Bun | Built-in |

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Web Framework | Hono | 4.0+ | REST API |
| Database | SQLite (Bun native) | Data persistence |
| Server | Bun HTTP | HTTP server |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| UI Framework | Vanilla JS | No framework needed |
| Styling | CSS3 + Variables | Responsive design |
| Icons | Material Icons | Google Material icons |
| API Client | Fetch API | HTTP requests |

### Development

| Component | Technology | Purpose |
|-----------|------------|---------|
| Type Checking | TypeScript | Compile-time type safety |
| Testing | Bun Test | Unit testing |
| Code Quality | ESLint/Prettier | Code formatting (configured) |

---

## Project Structure

```
expense-manager/
├── src/
│   ├── behaviors/              # State machine implementations
│   │   ├── core.ts             # Core BehaviorMachine class
│   │   └── expense.behavior.ts # Expense state definitions
│   │
│   ├── db/                     # Database layer
│   │   ├── database.ts         # SQLite connection & schema
│   │   ├── migrate.ts          # Database migrations
│   │   └── seed.ts             # Sample data seeder
│   │
│   ├── routes/                 # API routes
│   │   ├── expenses.ts         # Expense endpoints
│   │   ├── categories.ts       # Category endpoints
│   │   └── users.ts            # User endpoints
│   │
│   ├── services/               # Business logic
│   │   ├── expense.service.ts  # Expense CRUD & state transitions
│   │   ├── category.service.ts # Category management
│   │   └── user.service.ts     # User management
│   │
│   └── index.ts                # Application entry point
│
├── public/                     # Static assets
│   └── index.html              # Single-page web UI
│
├── docs/                       # Documentation files
│   ├── QUICKSTART.md
│   ├── API_EXAMPLES.md
│   ├── BHVR_PATTERN.md
│   ├── STATE_DIAGRAM.md
│   ├── EXAMPLES.md
│   └── DEPLOYMENT.md
│
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── expenses.db                 # SQLite database (generated)
├── bun.lockb                   # Bun lock file
└── TECHNICAL_DOCUMENTATION.md  # This file
```

---

## Database Design

### Schema Overview

The database consists of 5 tables with proper foreign key relationships:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │   categories    │       │    expenses     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │       │ title           │
│ email           │       │ description     │       │ description     │
│ role            │       │ color           │       │ amount          │
│ created_at      │       │ created_at      │       │ currency        │
└─────────────────┘       └─────────────────┘       │ category_id (FK)│
         │                                            │ date            │
         │                                            │ state           │
         │                                            │ created_by (FK) │
         │                                            │ created_at      │
         │                                            │ updated_at      │
         │                                            └─────────────────┘
         │                                                    │
         │                                                    │
         ▼                                                    ▼
┌─────────────────┐                            ┌─────────────────┐
│  expense_history│                            │    receipts      │
├─────────────────┤                            ├─────────────────┤
│ id (PK)         │                            │ id (PK)         │
│ expense_id (FK) │                            │ expense_id (FK) │
│ from_state      │                            │ filename        │
│ to_state        │                            │ filepath        │
│ event_type      │                            │ mimetype        │
│ event_data      │                            │ size            │
│ performed_by    │                            │ uploaded_at     │
│ timestamp       │                            └─────────────────┘
└─────────────────┘
```

### Table Definitions

#### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'approver', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: UUID primary key
- `name`: User's full name
- `email`: Unique email address
- `role`: User role (user, approver, admin)
- `created_at`: Timestamp of creation

#### Categories Table

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: UUID primary key
- `name`: Category name
- `description`: Optional category description
- `color`: Hex color code for UI display
- `created_at`: Timestamp of creation

#### Expenses Table

```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'PHP',
  category_id TEXT,
  date DATETIME NOT NULL,
  state TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**Fields:**
- `id`: UUID primary key
- `title`: Expense title
- `description`: Optional detailed description
- `amount`: Expense amount (real/float)
- `currency`: Currency code (default: PHP)
- `category_id`: Foreign key to categories
- `date`: Date of expense
- `state**: Current state (active, archived)
- `created_by`: Foreign key to users
- `created_at**: Creation timestamp
- `updated_at`: Last update timestamp

#### Expense History Table

```sql
CREATE TABLE expense_history (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  performed_by TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id)
);
```

**Purpose:** Tracks all state transitions for audit trail

**Fields:**
- `id`: UUID primary key
- `expense_id`: Foreign key to expenses
- `from_state`: Previous state (null for creation)
- `to_state`: New state
- `event_type`: Event that triggered transition
- `event_data**: JSON-encoded event data
- `performed_by`: User who performed the action
- `timestamp`: When the transition occurred

#### Receipts Table

```sql
CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  mimetype TEXT,
  size INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expense_id) REFERENCES expenses(id)
);
```

**Purpose:** Store file attachments for expenses

---

## BHVR Pattern (State Machine)

### Overview

The **BHVR (Behavior) Pattern** is a state machine implementation that manages expense state transitions in a type-safe, predictable manner.

### State Diagram

```
    ┌──────────────────────────────────────────────────────┐
    │                   Expense States                     │
    └──────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │             │
                    ▼             │
    ┌──────────┐    │   active    │    ┌──────────────┐
    │          │    │             │    │              │
    │  CREATE  ├────┤ (default)   │    │   archived   │
    │          │    │             │    │              │
    └──────────┘    │             │    │              │
              ▲     └──────┬──────┘    └──────┬───────┘
              │            │                   │
              │            │    ARCHIVE        │
              │            │                   │ RESTORE
              │            │                   │
              │            ▼                   │
              │    ┌──────────────┐            │
              │    │              │            │
              └────┤   archived   │────────────┘
                   │              │
                   └──────────────┘
```

### Core Types

#### ExpenseState Type

```typescript
export type ExpenseState = 
  | "active"
  | "archived";
```

#### ExpenseEvents Interface

```typescript
export interface ExpenseEvents {
  ARCHIVE: { 
    archivedBy: string; 
    timestamp: Date; 
  };
  RESTORE: { 
    restoredBy: string; 
    timestamp: Date; 
  };
}
```

### BehaviorMachine Class

The `BehaviorMachine` class is a generic state machine implementation:

```typescript
export class BehaviorMachine<TState extends string, TEvent, TEffect, TData> {
  private context: BehaviorContext<TState, TData>;
  private behavior: Behavior<TState, TEvent, TEffect>;

  constructor(
    behavior: Behavior<TState, TEvent, TEffect>, 
    initialData: TData, 
    initialState?: TState
  );

  async transition(
    eventType: keyof TEvent, 
    eventData: TEvent[keyof TEvent]
  ): Promise<boolean>;

  getState(): TState;
  getContext(): BehaviorContext<TState, TData>;
  getData(): TData;
  updateData(updates: Partial<TData>): void;
}
```

### Behavior Definition

```typescript
export const expenseBehavior: Behavior<ExpenseState, ExpenseEvents, ExpenseEffects> = {
  id: "expense-tracker",
  initial: "active",
  
  transitions: {
    active: {
      ARCHIVE: {
        target: "archived",
      },
    },
    archived: {
      RESTORE: {
        target: "active",
      },
    },
  },
  
  effects: {
    archived: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} archived`);
      },
    },
    active: {
      onEnter: async (context) => {
        console.log(`Expense ${context.data.id} restored to active`);
      },
    },
  },
};
```

### Transition Process

1. **Guard Check**: Validates if transition is allowed
2. **Exit Effect**: Executes `onExit` callback for current state
3. **State Update**: Updates state to target state
4. **History Update**: Adds new state to history
5. **Enter Effect**: Executes `onEnter` callback for new state

---

## API Reference

### Base URL

```
http://localhost:3344/api
```

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Expenses** | | |
| GET | `/api/expenses` | List all expenses |
| GET | `/api/expenses/:id` | Get expense by ID |
| GET | `/api/expenses/search` | Search expenses |
| GET | `/api/expenses/:id/history` | Get expense history |
| GET | `/api/expenses/stats/summary` | Get statistics |
| GET | `/api/expenses/stats/period/:period` | Get period totals |
| GET | `/api/expenses/stats/daily-totals` | Get daily totals |
| POST | `/api/expenses` | Create expense |
| PATCH | `/api/expenses/:id` | Update expense |
| POST | `/api/expenses/:id/archive` | Archive expense |
| POST | `/api/expenses/:id/restore` | Restore expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| **Categories** | | |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:id` | Get category by ID |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| **Users** | | |
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |

### Expense Endpoints

#### GET /api/expenses

Query Parameters:
- `state`: Filter by state (active, archived)
- `createdBy`: Filter by user ID
- `category`: Filter by category ID
- `startDate`: Filter start date (ISO 8601)
- `endDate`: Filter end date (ISO 8601)

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Office Supplies",
    "description": "Printer paper",
    "amount": 45.99,
    "currency": "PHP",
    "category": "uuid",
    "date": "2025-01-15T10:00:00.000Z",
    "state": "active",
    "createdBy": "uuid",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z",
    "receipts": []
  }
]
```

#### GET /api/expenses/search

Query Parameters:
- `q` or `query`: Search text
- `startDate`: Filter start date
- `endDate`: Filter end date
- `category`: Filter by category
- `state`: Filter by state
- `createdBy`: Filter by user
- `limit`: Result limit (default: 50)

**Response:**
```json
{
  "expenses": [...],
  "total": 10,
  "highlights": {
    "uuid": ["title", "description"]
  },
  "query": "office",
  "filters": {
    "startDate