# Deploying to Vercel with Supabase

This document explains how to deploy the Expense Manager application to Vercel with Supabase as the database.

## Step 1: Set up Supabase Database

1. Go to [https://supabase.com](https://supabase.com) and sign up for a free account
2. Create a new project
3. Once the project is created, go to the Project Settings > API to get your:
   - **Project URL** (SUPABASE_URL)
   - **anon key** (SUPABASE_ANON_KEY)

4. Execute the SQL schema in the SQL Editor:
   - Go to the SQL Editor tab in your Supabase dashboard
   - Copy the content from `supabase_schema.sql` file in this project
   - Run the SQL to create the necessary tables

## Step 2: Install Vercel CLI and Login

```bash
npm install -g vercel
vercel login
```

Follow the prompts to log in to your Vercel account. You can log in with your email or GitHub account.

## Step 3: Deploy to Vercel

Before deploying, you **MUST** have your Supabase credentials ready:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key

**Important**: Without these credentials, the application will not work properly after deployment.

Then run the deployment command:

```bash
vercel --prod
```

During the deployment, you'll be prompted to set the environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `NODE_ENV`: Set to `production`

Alternatively, you can link your project to your Vercel account first:
```bash
vercel
```
This will guide you through linking your project, and then you can set environment variables in the Vercel dashboard.

## Step 4: Configure Environment Variables in Vercel Dashboard

This step is **CRITICAL** for the application to work properly. Without these environment variables, the application will fail:

1. Go to your project in the Vercel dashboard
2. Go to Settings > Environment Variables
3. Add the following variables:
   - `SUPABASE_URL` (required): Your Supabase project URL (e.g., https://xycyngjqgnznggtkoitv.supabase.co)
   - `SUPABASE_ANON_KEY` (required): Your Supabase anon key (starts with "eyJhb...")
   - `NODE_ENV` (recommended): Set to `production`

**Important**: If you didn't set these during deployment, the application will show errors until these variables are configured in the Vercel dashboard.

**Note**: You need to get the correct Supabase credentials from your Supabase dashboard:
- `SUPABASE_URL`: Your Supabase project URL (which you already have: https://xycyngjqgnznggtkoitv.supabase.co)
- `SUPABASE_ANON_KEY`: Go to your Supabase dashboard > Project Settings > API, and copy the "anon key" (it typically starts with "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")

## Step 5: Run Database Schema Setup (CRITICAL)

This is a **CRITICAL** step that must be completed for the application to work properly:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the content from the `supabase_schema.sql` file in this project
4. Paste and run the SQL in the SQL Editor to create the necessary tables

Without these database tables, the application will continue to show errors even after setting the environment variables.

**Additional Step (if needed)**: If you encounter permission errors after setting up the schema, you may need to adjust Row Level Security (RLS) policies:
1. Go to your Supabase SQL Editor
2. Run these commands to disable RLS temporarily (for testing):
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.expense_history DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
   ```

## Testing the Deployed Application

Once deployed, you can test your application:

1. Visit the URL provided by Vercel after deployment
2. Check the health endpoint: `https://your-deployed-url.vercel.app/health`
3. Test the API endpoints:
   - List expenses: `GET /api/expenses`
   - List categories: `GET /api/categories`
   - List users: `GET /api/users`
4. Use the web interface to create and manage expenses

## Additional Notes

- The application is configured to work with Vercel's serverless functions
- Static files in the `public` directory will be served automatically
- The API routes are available under `/api/*`
- The application uses the Supabase client for database operations