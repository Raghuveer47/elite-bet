# Quick Testing Checklist

## 🚀 Quick Start

1. **Start Backend**
   ```bash
   cd backend
   npm start
   # Should see: 🚀 Server running on port 3001
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   # Open http://localhost:5173
   ```

3. **Test Health**
   - Visit: http://localhost:3001/health
   - Should see: `{"status":"OK"}`

## ✅ Step-by-Step Testing

### 1. Test Login (5 minutes)
- [ ] Sign up a new user
- [ ] Check localStorage has session
- [ ] Check Supabase has user
- [ ] Login works
- [ ] Session persists on refresh

**How to verify:**
```javascript
// Browser console
localStorage.getItem('elitebet_user_session')
// Should return user object
```

### 2. Test Cloudinary Upload (3 minutes)
- [ ] Go to Wallet → Deposit
- [ ] Click "Upload Payment Screenshot"
- [ ] Select an image
- [ ] Image shows in preview
- [ ] Check console for upload URL
- [ ] Check Cloudinary dashboard for image

**Expected Console:**
```
CloudinaryService: Upload successful
URL: https://res.cloudinary.com/.../payment_proof_abc123.png
```

### 3. Test Deposit Flow (5 minutes)
- [ ] Fill deposit form
- [ ] Upload screenshot
- [ ] Submit deposit
- [ ] Success message appears
- [ ] Check MongoDB for transaction
- [ ] Login as admin
- [ ] See deposit in "Pending Deposits"
- [ ] Click "Approve"
- [ ] Balance increases in MongoDB

**MongoDB Check:**
```bash
mongo
> use elitebet
> db.transactions.find({ type: 'deposit' }).pretty()
> db.users.findOne({ userId: 'YOUR_ID' })
```

### 4. Test Betting Flow (5 minutes)
- [ ] Go to Casino
- [ ] Play slots
- [ ] Place $10 bet
- [ ] Balance decreases instantly
- [ ] Win $25
- [ ] Balance increases instantly
- [ ] Check MongoDB for bet record

**MongoDB Check:**
```bash
> db.bets.find().pretty()
> db.transactions.find({ type: 'win' }).pretty()
> db.users.findOne({ userId: 'YOUR_ID' }, { balance: 1 })
```

## 🔍 Verification Commands

### Backend Health
```bash
curl http://localhost:3001/health
```

### Check MongoDB Data
```bash
mongo
> use elitebet
> show collections
> db.users.find().pretty()
> db.transactions.find().sort({ createdAt: -1 }).limit(5).pretty()
> db.bets.find().pretty()
```

### Check Frontend Logs
Open browser console (F12) and look for:
- ✅ Successful API calls
- ✅ No errors
- ✅ Balance updates

## 🐛 Quick Fixes

**Backend won't start:**
```bash
cd backend
npm install
# Check if port 3001 is free
lsof -ti:3001 | xargs kill -9
npm start
```

**Frontend can't connect:**
- Check `VITE_BACKEND_URL=http://localhost:3001/api/betting` in frontend/.env
- Restart frontend server

**Cloudinary error:**
- Check credentials in frontend/.env
- Visit Cloudinary dashboard to verify account

**MongoDB error:**
```bash
# Start MongoDB
mongod

# Or use MongoDB Atlas connection string
```

## 📊 Expected Results

| Test | Expected Time | Status |
|------|---------------|--------|
| Login | < 1s | ✅ |
| Cloudinary Upload | 1-3s | ✅ |
| Deposit Submit | < 1s | ✅ |
| Balance Update | < 50ms | ✅ |
| Bet Processing | < 100ms | ✅ |
| Win Processing | < 100ms | ✅ |

## 🎯 What to Look For

**✅ Good Signs:**
- Fast balance updates
- No loading delays
- Instant bet processing
- Screenshots appear in admin panel
- Data appears in MongoDB

**❌ Bad Signs:**
- Balance stuck at same value
- Long loading times
- "Failed to fetch" errors
- Supabase timeout errors
- Data not appearing in database

## 💡 Tips

1. **Use Browser Console** - Check for errors
2. **Use Network Tab** - See API calls
3. **Use MongoDB Compass** - Visual database viewer
4. **Check Logs** - Backend console shows all operations
5. **Test One Thing at a Time** - Don't rush

## 🚨 Critical Tests

These MUST work for production:

1. ✅ Login/Signup
2. ✅ Deposit with screenshot upload
3. ✅ Admin approval
4. ✅ Balance updates instantly
5. ✅ Bet placement
6. ✅ Win processing
7. ✅ All data in MongoDB

---

**Once all checkboxes are ✅, your system is ready for production!** 🎉
