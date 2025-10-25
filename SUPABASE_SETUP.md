# Supabase Integration Setup Guide

This guide will help you set up Supabase authentication and database for your Elite Bet application.

## 🚀 Quick Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `elite-bet-platform`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables

1. Create a `.env` file in your project root:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Replace the values with your actual Supabase credentials

### 4. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire content from `supabase-schema.sql` file
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- ✅ Users table with proper relationships
- ✅ Transactions table for financial data
- ✅ Admin users table for admin access
- ✅ Audit logs for compliance
- ✅ Games table for casino games
- ✅ Bets table for betting data
- ✅ Row Level Security (RLS) policies
- ✅ Triggers and functions
- ✅ Default admin user and sample games

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure the following:

**Site URL**: `http://localhost:5173` (for development)
**Redirect URLs**: 
- `http://localhost:5173/**`
- `https://your-domain.com/**` (for production)

**Email Settings**:
- Enable email confirmations (optional for demo)
- Configure SMTP settings if needed

### 6. Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Test user registration:
   - Go to `/register`
   - Create a new account
   - Check Supabase dashboard → **Authentication** → **Users** to see the new user

3. Test admin login:
   - Go to `/admin/login`
   - Use credentials: `admin@elitebet.com` / `Admin123!`
   - Check admin dashboard for real user data

## 🔧 Admin Credentials

**Default Admin Account:**
- **Email**: `admin@elitebet.com`
- **Password**: `Admin123!`
- **Role**: Super Administrator
- **Permissions**: Full access (`['*']`)

## 📊 What You'll See in Admin Dashboard

Once integrated, the admin dashboard will show:

### Real User Data
- ✅ All registered users from Supabase
- ✅ User balances, verification status
- ✅ Registration dates and last login
- ✅ User activity and statistics

### Real Transaction Data
- ✅ All deposits and withdrawals
- ✅ Betting transactions
- ✅ Transaction status and history
- ✅ Financial reporting

### System Statistics
- ✅ Total users count
- ✅ Active users
- ✅ Total deposits/withdrawals
- ✅ Platform revenue
- ✅ Pending verifications

### Audit Logs
- ✅ All user actions
- ✅ Admin actions
- ✅ System events
- ✅ Security events

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ Users can only see their own data
- ✅ Admins can see all user data
- ✅ Proper permission checks
- ✅ Data isolation

### Audit Trail
- ✅ All actions logged
- ✅ IP address tracking
- ✅ User agent logging
- ✅ Timestamp tracking

### Data Protection
- ✅ Encrypted connections
- ✅ Secure authentication
- ✅ Input validation
- ✅ SQL injection protection

## 🚀 Production Deployment

### Environment Variables for Production
```bash
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### Database Backup
- Enable automatic backups in Supabase
- Set up point-in-time recovery
- Configure backup retention

### Monitoring
- Set up Supabase monitoring
- Configure alerts
- Monitor performance metrics

## 🔍 Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
- Check your `.env` file exists
- Verify variable names start with `VITE_`
- Restart your development server

**2. "Invalid admin credentials"**
- Check admin user exists in database
- Verify password is `Admin123!`
- Check admin user is active

**3. "Permission denied"**
- Check RLS policies are enabled
- Verify user has proper permissions
- Check authentication status

**4. Database connection issues**
- Verify Supabase project is active
- Check network connectivity
- Verify API keys are correct

### Debug Steps

1. Check browser console for errors
2. Check Supabase dashboard → **Logs**
3. Verify database schema is applied
4. Test with simple queries in SQL Editor

## 📈 Next Steps

After successful integration:

1. **Customize Admin Dashboard**
   - Add more user management features
   - Implement advanced reporting
   - Add bulk operations

2. **Enhance Security**
   - Implement 2FA for admins
   - Add IP whitelisting
   - Set up monitoring alerts

3. **Add Features**
   - Real-time notifications
   - Advanced analytics
   - Automated reporting

4. **Production Optimization**
   - Database indexing
   - Query optimization
   - Caching strategies

## 🆘 Support

If you encounter issues:

1. Check the Supabase documentation
2. Review the error logs
3. Test with the provided demo credentials
4. Verify all setup steps are completed

---

**🎉 Congratulations!** Your Elite Bet platform now has real database integration with Supabase!
