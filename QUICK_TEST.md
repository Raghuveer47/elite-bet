# Quick Test Setup Guide

## 🚀 Test Your Supabase Integration

### Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon public key

### Step 2: Set Environment Variables

Create a `.env` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Copy the entire content from `supabase-schema.sql`
3. Paste and click **Run**

### Step 4: Test the Application

```bash
npm run dev
```

### Step 5: Test User Registration

1. Go to `/register`
2. Create a new account
3. Check Supabase dashboard → **Authentication** → **Users** to see the new user

### Step 6: Test Admin Login

1. Go to `/admin/login`
2. Use credentials: `admin@elitebet.com` / `Admin123!`
3. Check admin dashboard for real user data

## ✅ What Should Work Now

- ✅ User registration and login
- ✅ Real database storage
- ✅ Admin dashboard with live data
- ✅ Transaction management
- ✅ User management
- ✅ Audit logging
- ✅ Session management

## 🔧 Troubleshooting

**Error: "Missing Supabase environment variables"**
- Check your `.env` file exists
- Verify variable names start with `VITE_`
- Restart development server

**Error: "Invalid admin credentials"**
- Check admin user exists in database
- Verify password is `Admin123!`
- Check admin user is active

**Database connection issues**
- Verify Supabase project is active
- Check API keys are correct
- Verify database schema is applied

## 🎉 Success!

If everything works, you now have:
- Real user authentication
- Persistent data storage
- Admin user management
- Financial transaction tracking
- Production-ready architecture

Your Elite Bet platform is now connected to Supabase! 🚀
