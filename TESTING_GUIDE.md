# Complete Testing Guide

This guide will help you test all flows: Login → Deposits → Bets → Cloudinary → Backend.

## 🔧 Prerequisites

Before testing, make sure you have:

1. **Backend Server Running**
   ```bash
   cd backend
   npm install
   # Create .env file
   npm start
   ```

2. **Frontend Running**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Cloudinary Account**
   - Sign up at https://cloudinary.com
   - Get your credentials

## 📝 Step 1: Configure Environment Variables

### Backend `.env` (backend/.env)
```env
MONGODB_URI=mongodb://localhost:27017/elitebet
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env` (frontend/.env)
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
VITE_BACKEND_URL=http://localhost:3001/api/betting

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

## 🧪 Step 2: Test Login Flow

1. Open http://localhost:5173
2. Click "Sign Up" or "Login"
3. Enter email and password
4. Check browser console for:
   ```
   ✅ AuthContext: User logged in successfully
   ✅ AuthContext: Session created
   ```

5. Check localStorage:
   - Open DevTools → Application → localStorage
   - Should see: `elitebet_user_session`
   - Should see: `sb-{your-project}-auth-token`

6. Check Supabase Dashboard:
   - Go to Authentication → Users
   - Your user should appear

7. Check MongoDB (if using local MongoDB):
   ```bash
   mongo
   > use elitebet
   > db.users.find().pretty()
   ```

## 📸 Step 3: Test Cloudinary Image Upload

### 3.1 Test Direct Cloudinary Upload

Create test file: `frontend/test-cloudinary.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Cloudinary Test</title>
</head>
<body>
    <input type="file" id="fileInput" accept="image/*">
    <img id="preview" style="max-width: 500px;">
    
    <script type="module">
        const cloudName = 'your_cloud_name'; // Replace with your cloud name
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('preview');
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'ml_default'); // Replace with your preset
            
            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                console.log('Upload successful:', data);
                preview.src = data.secure_url;
                alert('Image uploaded! Check console for URL');
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Upload failed: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

### 3.2 Test from Deposit Form

1. Navigate to Wallet page
2. Click "Deposit"
3. Upload a payment screenshot
4. Open browser console, should see:
   ```
   ✅ CloudinaryService: Starting upload...
   ✅ CloudinaryService: Upload successful
   ✅ Deposit screenshot uploaded: https://res.cloudinary.com/...
   ```

5. Check Cloudinary Dashboard:
   - Go to https://console.cloudinary.com
   - Media Library → elite-bet/payment-proofs
   - Your image should appear

### 3.3 Test Cloudinary Service

Open browser console and run:

```javascript
// Import CloudinaryService (you may need to adjust the path)
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const result = await CloudinaryService.uploadImage(file, 'test-folder');
  console.log('Upload result:', result);
};
fileInput.click();
```

## 💰 Step 4: Test Deposit Flow

### 4.1 Submit Deposit Request

1. Go to Wallet → Deposit
2. Fill in:
   - Amount: 500
   - Name: Test User
   - Email: test@example.com
   - Transaction ID: TXN123456
3. Upload payment screenshot
4. Click "Submit Deposit Request"

**Expected Console Output:**
```
✅ CloudinaryService: Upload successful
✅ DepositForm: Deposit request submitted
✅ WalletContext: Manual deposit submitted
✅ Transaction created in database
```

**Check MongoDB:**
```javascript
db.transactions.find({ type: 'deposit' }).pretty()
// Should show your deposit transaction with status: 'pending'
```

### 4.2 Verify in Admin Panel

1. Login as admin
2. Go to "Pending Deposits"
3. Your deposit should appear with:
   - Amount: 500
   - Status: Pending
   - Payment screenshot visible
   - Transaction ID displayed

### 4.3 Approve Deposit

1. In admin panel, click "Approve" on your deposit
2. Enter notes (optional)
3. Click "Approve Deposit"

**Expected Result:**
```
✅ Transaction status: pending → completed
✅ User balance updated in MongoDB
✅ Transaction record created
```

**Check Balance Update:**
```javascript
// In MongoDB
db.users.findOne({ userId: 'your-user-id' })
// balance should increase by 500
```

## 🎰 Step 5: Test Betting Flow

### 5.1 Place a Bet

1. Go to Casino page
2. Play a slot game
3. Place a bet (e.g., $10)

**Expected Console Output:**
```
✅ WalletContext: Processing bet
✅ BackendWalletService: Place bet request
✅ Backend: Balance deducted
✅ WalletContext: Bet processed successfully
```

**Check MongoDB:**
```javascript
db.bets.find().pretty()
// Should show your bet
db.transactions.find({ type: 'bet' }).pretty()
// Should show bet transaction
db.users.findOne({ userId: 'your-user-id' })
// balance should decrease by bet amount
```

### 5.2 Process Win

1. Continue playing until you win
2. Check console for:
```
✅ Bet result processed
✅ Win amount credited
✅ Balance updated in MongoDB
```

**Check MongoDB:**
```javascript
db.bets.findOne({ status: 'won' })
// Should show your winning bet
db.transactions.find({ type: 'win' }).pretty()
// Should show win transaction
db.users.findOne({ userId: 'your-user-id' })
// balance should include winnings
```

## 🔍 Step 6: Verify Data in Database

### Check MongoDB Collections

Open MongoDB shell:
```bash
mongo
> use elitebet
> show collections
```

**Expected Collections:**
- users
- transactions
- bets

**Query Examples:**

```javascript
// Get all users
db.users.find().pretty()

// Get all transactions for a user
db.transactions.find({ userId: 'your-user-id' }).sort({ createdAt: -1 })

// Get all bets for a user
db.bets.find({ userId: 'your-user-id' }).sort({ createdAt: -1 })

// Get balance for a user
db.users.findOne({ userId: 'your-user-id' }, { balance: 1, totalDeposited: 1 })

// Get transaction statistics
db.transactions.aggregate([
  { $match: { userId: 'your-user-id' } },
  { $group: {
    _id: '$type',
    total: { $sum: '$amount' },
    count: { $sum: 1 }
  }}
])
```

### Check Supabase Tables

Go to Supabase Dashboard:
1. **users table**: Should have your user
2. **transactions table**: Pending deposits appear here
3. **audit_logs**: Activity logs

## 🚀 Step 7: Test API Endpoints

### Using cURL or Postman

**Test Health Check:**
```bash
curl http://localhost:3001/health
```

**Get User Balance:**
```bash
curl http://localhost:3001/api/betting/balance/YOUR_USER_ID
```

**Place a Bet:**
```bash
curl -X POST http://localhost:3001/api/betting/bet \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "gameId": "slots_001",
    "gameType": "slots",
    "amount": 10
  }'
```

**Get Transactions:**
```bash
curl http://localhost:3001/api/betting/transactions/YOUR_USER_ID
```

## 🐛 Common Issues & Solutions

### Issue 1: Cloudinary Upload Fails

**Error:** "Cloudinary credentials not found"

**Solution:**
1. Check `.env` file has correct credentials
2. Verify `VITE_CLOUDINARY_CLOUD_NAME` is set
3. Restart frontend server after changing `.env`

### Issue 2: Backend Not Connecting

**Error:** "Failed to fetch" or "Network error"

**Solution:**
1. Check backend is running on port 3001
2. Verify `VITE_BACKEND_URL` in frontend `.env`
3. Check CORS settings in backend

### Issue 3: MongoDB Connection Issues

**Error:** "Mongoose connection failed"

**Solution:**
1. Start MongoDB: `mongod`
2. Check `MONGODB_URI` in backend `.env`
3. Verify MongoDB is accessible

### Issue 4: Supabase Slow/Not Updating

**Error:** Balance updates take too long

**Solution:**
- Use MongoDB backend instead
- Update frontend to use `BackendWalletService`
- Supabase is only for authentication now

## ✅ Testing Checklist

- [ ] Login/Signup works
- [ ] Session stored in localStorage
- [ ] User created in Supabase
- [ ] Cloudinary upload works
- [ ] Image appears in Cloudinary dashboard
- [ ] Deposit request submitted
- [ ] Transaction appears in MongoDB
- [ ] Admin can see pending deposit
- [ ] Screenshot visible in admin panel
- [ ] Deposit approved by admin
- [ ] Balance updates instantly in MongoDB
- [ ] Bet placed successfully
- [ ] Balance deducted from account
- [ ] Win processed correctly
- [ ] Balance updated with winnings
- [ ] All data in MongoDB

## 📊 Expected Performance

- ⚡ Login: < 1 second
- ⚡ Cloudinary Upload: 1-3 seconds
- ⚡ Balance Update (MongoDB): < 50ms
- ⚡ Bet Processing: < 100ms
- ⚡ Transaction Creation: < 100ms

## 🎯 Next Steps

After verifying everything works:

1. **Deploy Backend**
   - Deploy to Heroku/Railway/Render
   - Update `VITE_BACKEND_URL`

2. **Deploy Frontend**
   - Deploy to Netlify/Vercel
   - Update environment variables

3. **Production MongoDB**
   - Use MongoDB Atlas
   - Update connection string

4. **Test Production**
   - Test all flows in production
   - Monitor performance
   - Check logs

Good luck with testing! 🚀
