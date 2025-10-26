# 🔐 Admin Login Information

## Admin Portal Access

### Direct URL
```
https://www.spinzos.com/admin/login
```

### Login Credentials

**Email:** `admin@spinzos.com`  
**Password:** `Admin123!`

---

## 🔑 Quick Access

### For Production (Live Site)
1. Navigate to: `https://www.spinzos.com/admin/login`
2. Enter the credentials above
3. Click "Access Admin Portal"

### For Local Development
1. Navigate to: `http://localhost:5173/admin/login`
2. Enter the credentials above
3. Click "Access Admin Portal"

---

## 📊 Admin Dashboard Features

Once logged in, you have access to:

### 1. **Admin Dashboard** (`/admin/dashboard`)
- System overview and statistics
- Real-time user activity
- Platform metrics
- Quick actions

### 2. **User Management** (`/admin/users`)
- View all registered users
- User details and balances
- Activate/suspend/close accounts
- User verification status
- Transaction history per user

### 3. **Financial Management** (`/admin/financial`)
- All deposits and withdrawals
- Pending payments
- Approve/reject transactions
- Financial reports and analytics
- Revenue tracking

### 4. **Game Management** (`/admin/games`)
- Casino game configuration
- Sports betting odds
- Game availability
- Payout management

### 5. **Risk Management** (`/admin/risk`)
- Fraud detection
- Suspicious activity alerts
- User behavior monitoring
- Security management

### 6. **KYC Management** (`/admin/kyc`)
- User verification requests
- Document review
- Identity verification
- Compliance management

### 7. **Promotion Management** (`/admin/promotions`)
- Create and manage bonuses
- Promotional campaigns
- Welcome bonuses
- Special offers

### 8. **Support Management** (`/admin/support`)
- Customer support tickets
- User inquiries
- Support history
- Response management

---

## 🔒 Security Features

### Session Management
- Admin sessions expire after 24 hours
- Secure logout available
- Session monitoring

### Audit Logging
- All admin actions are logged
- IP address tracking
- Timestamp recording
- Action history

### Access Control
- Super Administrator role
- Full system permissions
- All data access
- System configuration access

---

## 🛡️ Important Security Notes

1. **Never share these credentials publicly**
2. **Change the password in production**
3. **Use strong, unique passwords**
4. **Enable 2FA in production**
5. **Monitor audit logs regularly**
6. **Limit admin access to trusted personnel only**

---

## 🚨 Troubleshooting

### Cannot Access Admin Portal

**Problem:** Getting 404 error
**Solution:** 
- Ensure you're using the correct URL: `/admin/login`
- Check if the deployment includes all configuration files
- Verify `vercel.json`, `netlify.toml`, or `_redirects` file exists

**Problem:** Invalid credentials error
**Solution:**
- Double-check: Email must be `admin@spinzos.com`
- Password must be: `Admin123!`
- Check for typos or extra spaces
- The password is case-sensitive

**Problem:** Page refresh shows 404
**Solution:**
- Ensure hosting configuration files are deployed
- Check `REFRESH_404_FIX.md` for details
- Re-deploy with proper configuration files

### Admin Dashboard Not Loading

**Problem:** Infinite loading
**Solution:**
- Check browser console for errors
- Verify Supabase connection
- Check network connectivity
- Clear browser cache and cookies

---

## 📝 Default Admin Account Details

```
Email: admin@spinzos.com
Password: Admin123!
Role: Super Administrator
Permissions: Full Access (*)
Level: 10 (Maximum)
Status: Active
```

---

## 🎯 Quick Reference

| Feature | URL |
|---------|-----|
| Admin Login | `/admin/login` |
| Admin Dashboard | `/admin/dashboard` |
| User Management | `/admin/users` |
| Financial | `/admin/financial` |
| Games | `/admin/games` |
| Risk Management | `/admin/risk` |
| KYC | `/admin/kyc` |
| Promotions | `/admin/promotions` |
| Support | `/admin/support` |

---

## ✅ Production Checklist

Before going live:
- [ ] Change default admin password
- [ ] Enable two-factor authentication
- [ ] Set up admin user email notifications
- [ ] Configure session timeout
- [ ] Enable audit logging
- [ ] Set up IP whitelist (optional)
- [ ] Test all admin routes
- [ ] Verify error handling
- [ ] Test logout functionality
- [ ] Verify no blank pages on refresh
