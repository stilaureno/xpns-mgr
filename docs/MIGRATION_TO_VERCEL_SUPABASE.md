# Migration Guide: Expense Manager to Vercel + Supabase

This guide provides comprehensive instructions for migrating the Expense Manager application from its current architecture (Bun + Hono + SQLite) to a modern deployment on Vercel (frontend/backend hosting) with Supabase (PostgreSQL database).

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Changes](#architecture-changes)
4. [Step 1: Set Up Supabase](#step-1-set-up-supabase)
5. [Step 2: Configure Database Schema](#step-2-configure-database-schema)
6. [Step 3: Update Backend Code](#step-3-update-backend-code)
7. [Step 4: Configure Vercel](#step-4-configure-vercel)
8. [Step 5: Environment Variables](#step-5-environment-variables)
9. [Step 6: Deploy to Vercel](#step-6-deploy-to-vercel)
10. [Data Migration](#data-migration)
11. [Rollback Strategy](#rollback-strategy)
12. [Cost Comparison](#cost-comparison)
13. [FAQ](#faq)

---

## Overview

### Why Migrate?

The current Expense Manager application runs on a traditional server setup with Bun, Hono, and SQLite. While this architecture is lightweight and performant, it presents several operational challenges:

| Challenge | Current Architecture | Vercel + Supabase |
|-----------|---------------------|-------------------|
| **Deployment** | Manual server setup, SSH access | Automatic deployments from Git |
| **Scaling** | Manual server scaling | Automatic serverless scaling |
| **Database** | SQLite file-based (single point of failure) | PostgreSQL with managed backups |
| **SSL/TLS** | Manual certificate management | Automatic HTTPS |
| **Global CDN** | Not available | Edge network worldwide |
| **Cost** | Fixed server cost | Pay-per-use model |

### Benefits of Vercel + Supabase

1. **Zero Configuration Deployments**: Push to Git and Vercel automatically builds and deploys
2. **Serverless Architecture**: No server management, automatic scaling to zero when idle
3. **Global Edge Network**: Your application runs close to users worldwide
4. **Managed Database**: Supabase handles database backups, updates, and security
5. **Built-in Authentication**: Supabase Auth integrates seamlessly with Row Level Security
6. **Real-time Capabilities**: Subscribe to database changes in real-time
7. **Developer Experience**: Preview deployments for every PR, instant rollbacks

### Estimated Migration Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Setup | 1-2 hours | Create Supabase project, configure Vercel |
| Database | 2-4 hours | Create schemas, RLS policies, migrate data |
| Backend | 4-8 hours | Convert Hono routes to Next.js API routes |
| Frontend | 4-8 hours | Update frontend to use Supabase client |
| Testing | 2-4 hours | Integration testing, edge cases |
| Deployment | 1-2 hours | Production deployment, DNS changes |

---

## Prerequisites

### Required Accounts

1. **Supabase Account**
   - Sign up at: https://supabase.com
   - Free tier includes:
     - 500MB database storage
     - 2GB bandwidth
     - 50MB file storage
     - 50,000 monthly active users

2. **Vercel Account**
   - Sign up at: https://vercel.com
   - Connect your GitHub/GitLab/Bitbucket account
   - Free tier includes:
     - 100GB bandwidth per month
     - 100 hours of serverless function execution
     - Unlimited deployments

### Required Tools

```bash
# Node.js 18+ (required for Next.js)
node --version  # Should be 18.x or higher

# npm or yarn (package manager)
npm --version
yarn --version

# Supabase CLI (for local development and migrations)
npm install -g supabase

# Vercel CLI (optional, for local preview)
npm install -g vercel

# PostgreSQL client (for data migration)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client
# Windows: https://www.postgresql.org/download/
```

### Verify Your Environment

```bash
# Check Node.js version
node --version  # Must be 18.0.0 or higher

# Check npm version
npm --version   # Must be 9.0.0 or higher

# Login to Supabase
supabase login

# Login to Vercel (optional, can use web interface)
vercel login
```

---

## Architecture Changes

### Current Architecture (Bun + Hono + SQLite)

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx Reverse Proxy                        │
│                   (SSL Termination)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Bun Server (Hono)                          │
│                   ┌─────────────────┐                        │
│                   │  API Routes     │                        │
│                   │  - GET /expenses│                        │
│                   │  - POST /expenses                      │
│                   │  - PUT /expenses/:id                    │
│                   │  - DELETE /expenses/:id                 │
│                   └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                         │
│                   (/root/bun2/expenses.db)                   │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture (Vercel + Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                   ┌─────────────────┐                        │
│                   │  Next.js App    │                        │
│                   │  - Frontend     │                        │
│                   │  - API Routes   │                        │
│                   └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                         │
│                   ┌─────────────────┐                        │
│                   │  PostgreSQL     │                        │
│                   │  (Auth + Data)  │                        │
│                   └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect | Current | Target |
|--------|---------|--------|
| **Runtime** | Bun (server process) | Vercel Serverless Functions |
| **Framework** | Hono | Next.js (App Router) |
| **Database** | SQLite (file-based) | PostgreSQL (managed) |
| **Auth** | Custom implementation | Supabase Auth |
| **API Style** | REST | REST + Auto-generated APIs |
| **Real-time** | Not available | Subscriptions |
| **Edge Functions** | No | Yes (Vercel Edge) |

---

## Step 1: Set Up Supabase

### Create Supabase Project

1. Navigate to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `expense-manager` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Select the region closest to your users
4. Wait for project creation (2-5 minutes)

### Get Supabase Credentials

Once your project is ready, navigate to:

1. **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Project Settings** → **Database**
4. Copy:
   - **Host**: `db.your-project-id.supabase.co`
   - **Database**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`

### Set Up Supabase CLI (Optional but Recommended)

```bash
# Initialize Supabase in your project
supabase init

# This creates:
# - supabase/config.toml
# - supabase/ folder with:
#   - functions/ (Edge Functions)
#   - migrations/ (Database migrations)
#   - seed.sql (Seed data)
```

### Configure Local Development

Create a `.env.local` file in your project root:

```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Step 2: Configure Database Schema

### Create Database Schema

Navigate to the SQL Editor in Supabase Dashboard and execute the following SQL:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE expense_category AS ENUM (
    'food', 'transport', 'utilities', 'entertainment',
    'shopping', 'healthcare', 'education', 'travel', 'other'
);

CREATE TYPE expense_status AS ENUM (
    'pending', 'approved', 'rejected', 'deleted'
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    category expense_category,
    expense_date DATE NOT NULL,
    status expense_status DEFAULT 'pending',
    receipt_url TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category expense_category,
    amount DECIMAL(12, 2) NOT NULL,
    period TEXT DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create recurring_expenses table
CREATE TABLE public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category expense_category,
    title TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    frequency TEXT NOT NULL,
    next_due_date DATE NOT NULL,
    last_processed_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at on all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

-- Recurring expenses policies
CREATE POLICY "Users can view own recurring" ON public.recurring_expenses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring" ON public.recurring_expenses
    FOR ALL USING (auth.uid() = user_id);
```

### Auto-Create Profile and Categories on Signup

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ language 'plpgsql SECURITY DEFINER';

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create default categories
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
DECLARE
    default_cats TEXT[] := ARRAY[
        '{"Food & Dining", "🍔", "#FF6B6B"}',
        '{"Transportation", "🚗", "#4ECDC4"}',
        '{"Utilities", "💡", "#45B7D1"}',
        '{"Entertainment", "🎬", "#96CEB4"}',
        '{"Shopping", "🛍️", "#FFEAA7"}',
        '{"Healthcare", "🏥", "#DDA0DD"}',
        '{"Education", "📚", "#98D8C8"}',
        '{"Travel", "✈️", "#F7DC6F"}',
        '{"Other", "📦", "#BDC3C7"}'
    ];
    cat TEXT;
    parts TEXT[];
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_sleep(0.1);
        FOREACH cat IN ARRAY default_cats LOOP
            parts := string_to_array(replace(replace(cat, '{', ''), '}', ''), ',');
            INSERT INTO public.categories (user_id, name, icon, color, is_default)
            VALUES (NEW.id, trim(parts[1]), trim(parts[2]), trim(parts[3]), TRUE);
        END LOOP;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created_categories
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_categories();
```

---

## Step 3: Update Backend Code

### Initialize Next.js Project

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest expense-manager --typescript --tailwind --eslint

# Navigate to project
cd expense-manager

# Install Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Install other dependencies
npm install recharts date-fns
```

### Project Structure

```
expense-manager/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── expenses/
│   │   │   │   ├── route.ts          # GET all, POST new
│   │   │   │   └── [id]/route.ts     # GET, PUT, DELETE one
│   │   │   ├── categories/
│   │   │   │   └── route.ts
│   │   │   └── auth/
│   │   │       └── [...nextauth]/route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── expenses/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Login page
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── ExpenseForm.tsx
│   │   └── CategorySelect.tsx
│   ├── lib/
│   │   ├── supabase.ts               # Browser client
│   │   ├── supabase-admin.ts         # Server client
│   │   ├── expenses.ts               # Expense service
│   │   └── categories.ts             # Category service
│   └── types/
│       └── index.ts
├── public/
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Supabase Client Configuration

**src/lib/supabase.ts**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**src/lib/supabase-admin.ts**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
```

### API Routes

**src/app/api/expenses/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-admin'

// GET /api/expenses - List all expenses for current user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let query = supabase
    .from('expenses')
    .select('*, categories(id, name, icon, color)')
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (category) query = query.eq('category', category)
  if (startDate) query = query.gte('expense_date', startDate)
  if (endDate) query = query.lte('expense_date', endDate)

  query = query.order('expense_date', { ascending: false })

  const { data: expenses, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expenses })
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description,
      amount: body.amount,
      category: body.category,
      expense_date: body.expense_date,
      category_id: body.category_id,
      tags: body.tags || []
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expense: data }, { status: 201 })
}
```

**src/app/api/expenses/[id]/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-admin'

// GET /api/expenses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ expense: data })
}

// PUT /api/expenses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('expenses')
    .update({
      title: body.title,
      description: body.description,
      amount: body.amount,
      category: body.category,
      expense_date: body.expense_date,
      tags: body.tags
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expense: data })
}

// DELETE /api/expenses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

## Step 4: Configure Vercel

### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Deploy from Git

1. Push code to GitHub/GitLab/Bitbucket
2. Visit https://vercel.com and click "Add New Project"
3. Select your repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click "Deploy"

---

## Step 5: Environment Variables

### Development (.env.local)

```bash
# Supabase - Get these from Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Your Supabase URL | All |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Your anon key | All |
| SUPABASE_SERVICE_ROLE_KEY | Service role key | Production only |
| NEXTAUTH_SECRET | Generated secret | All |
| NEXTAUTH_URL | Production URL | Production |

---

## Step 6: Deploy to Vercel

### Automatic Deployments

Once connected to GitHub/GitLab/Bitbucket:
1. Vercel automatically deploys on every push
2. Preview deployments for every PR
3. Production deployment on merge to main branch

### Manual Deployment (Vercel CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Verify Deployment

1. Visit your Vercel deployment URL
2. Check that the application loads correctly
3. Test authentication flow
4. Test CRUD operations on expenses
5. Verify data is persisting in Supabase

---

## Data Migration

### Export Current SQLite Data

```bash
# Export data to JSON
sqlite3 expenses.db ".mode json" ".headers on" "SELECT * FROM expenses;" > expenses.json
sqlite3 expenses.db ".mode json" ".headers on" "SELECT * FROM categories;" > categories.json
```

### Import to Supabase

Use the Supabase Dashboard's Table Editor or SQL:

```sql
-- Example: Insert expenses (with user_id mapping)
INSERT INTO public.expenses (id, user_id, title, amount, category, expense_date, status, created_at)
VALUES 
  (uuid_generate_v4(), 'user-uuid-1', 'Groceries', 50.00, 'food', '2024-01-15', 'pending', NOW()),
  (uuid_generate_v4(), 'user-uuid-1', 'Gas', 45.00, 'transport', '2024-01-16', 'pending', NOW());
```

### Migration Script (Node.js)

```javascript
// migrate.js
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const expenses = JSON.parse(fs.readFileSync('expenses.json', 'utf-8'))

async function migrate() {
  for (const exp of expenses) {
    const { error } = await supabase
      .from('expenses')
      .insert({
        id: exp.id,
        user_id: exp.user_id,
        title: exp.title,
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        expense_date: exp.expense_date,
        status: 'pending',
        created_at: exp.created_at
      })
    
    if (error) {
      console.error('Error inserting:', error)
    }
  }
  console.log('Migration complete!')
}

migrate()
```

Run with:
```bash
node migrate.js
```

---

## Rollback Strategy

### If Migration Fails

1. **Keep the old server running** until migration is verified
2. **Backup Supabase data** before migration:
   ```bash
   # Using pg_dump
   pg_dump "postgresql://user:pass@host:5432/db" > backup.sql
   ```

3. **Point domain back to old server** if critical issues occur
4. **Vercel deployments are versioned** - you can instantly rollback in the dashboard

### Rollback Steps

1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "Redeploy" or point domain back to old server
4. Supabase data remains intact for re-import if needed

---

## Cost Comparison

### Current Architecture (Self-Hosted)

| Resource | Monthly Cost |
|----------|-------------|
| VPS Server (2GB RAM, 1 CPU) | ~$10-20/month |
| Domain + SSL | ~$1-2/month |
| **Total** | **~$12-22/month** |

### Vercel + Supabase (Free Tier)

| Resource | Free Tier | Cost if Exceeded |
|----------|-----------|-----------------|
| Vercel Bandwidth | 100GB/month | $20/100GB |
| Vercel Functions | 100 hours/month | $10/100 hours |
| Supabase Database | 500MB | $4/500MB |
| Supabase Bandwidth | 2GB | $10/GB |
| **Total (Free)** | **$0/month** | **~$44+/month** |

### Cost Optimization Tips

1. **Use caching** to reduce database queries
2. **Optimize images** to reduce bandwidth
3. **Monitor usage** in Vercel and Supabase dashboards
4. **Upgrade only when needed** - free tier is generous for small apps

---

## FAQ

### Q: Do I need to change my domain?

**A:** No, you can keep your existing domain. Update your DNS A record or CNAME to point to Vercel's nameservers or your custom domain.

### Q: How do I handle authentication?

**A:** Use Supabase Auth directly or integrate with NextAuth.js. Supabase provides email/password, OAuth (Google, GitHub, etc.), and magic links out of the box.

### Q: What happens to my existing data?

**A:** You'll need to migrate data from SQLite to PostgreSQL. The migration script in this guide helps automate this process.

### Q: Can I still use Bun?

**A:** Yes, you can deploy Bun on Vercel using Edge Functions, but Next.js provides better integration and automatic optimizations.

### Q: How do I debug serverless functions?

**A:** Use Vercel's logging dashboard or run locally with `vercel dev`. Check the Functions tab in Vercel Dashboard for execution logs.

### Q: Is there a way to test locally?

**A:** Yes, use Supabase CLI for local database:
```bash
supabase start
```
This runs a local PostgreSQL instance and Supabase services.

---

## Summary

Migrating from Bun + Hono + SQLite to Vercel + Supabase provides:

- **Easier deployments** with Git integration
- **Better scalability** with serverless architecture
- **Improved security** with managed RLS policies
- **Lower maintenance** with managed services
- **Better developer experience** with preview deployments

Follow this guide step by step, test thoroughly, and you'll have a modern, scalable expense manager application ready for production!

---

*Document Version: 1.0*  
*Last Updated: January 2026*