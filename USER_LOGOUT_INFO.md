# 🔐 User Logout Flow

## How User Logout Works in Production

### After User Logout
When you click the "Logout" button in the header or account page:

1. **Shows Success Message**
   - Toast notification: "Logged out successfully"
   - Message visible for 0.5 seconds

2. **Session Cleared (Complete Cleanup)**
   - **Clears ALL localStorage** (complete wipe)
   - Removes user session from `sessionStorage`
   - Clears all user data from context
   - Fresh start for next login

3. **State Reset**
   - Clears user information
   - Resets authentication state
   - Loads user data

4. **Redirect to Login**
   - Automatically redirects to `/login` after 0.5 seconds
   - Login form is ready for new credentials
   - Clean login experience

### Logout Locations

You can logout from multiple places:

1. **Header (Desktop)**
   - Click your profile or wallet button
   - Click "Logout" from dropdown

2. **Header (Mobile)**
   - Click the menu icon (☰)
   - Scroll to "Logout" button

3. **Account Page**
   - Go to `/account` page
   - Click "Logout" button

---

## 🔄 Complete Login-Logout Flow

### Scenario 1: Logout and Login Again
1. **Current State**: Logged in as user
2. **Action**: Click "Logout" button
3. **Result**: 
   - Toast message shown
   - Redirected to `/login` after 0.5 seconds
4. **Action**: Enter credentials again
5. **Result**: Successfully logged in

### Scenario 2: Logout, Refresh, Then Login
1. **Current State**: Logged in as user
2. **Action**: Click "Logout" button
3. **Result**: Redirected to `/login`
4. **Action**: Refresh the page (F5)
5. **Result**: Still on login page (no redirect)
6. **Action**: Enter credentials
7. **Result**: Successfully logged in

### Scenario 3: Session Expired
1. **Current State**: User session expired (Supabase session)
2. **Result**: Redirected to `/login`
3. **Action**: Enter credentials
4. **Result**: Successfully logged in with new session

---

## 🧪 Testing Logout Flow in Production

### Test Steps

1. **Login as User**
   - Go to `/login`
   - Enter credentials (e.g., demo account)
   - Click "Login"

2. **Verify Dashboard**
   - Should see user dashboard
   - URL should be `/dashboard`
   - Balance should be visible

3. **Navigate to Any Page**
   - Click on "Sports" or "Casino"
   - URL should change accordingly

4. **Logout**
   - Click "Logout" button in header
   - Should see "Logged out successfully" toast
   - Should redirect to `/login` after 0.5 seconds

5. **Verify Logout**
   - URL should be `/login`
   - Login form should be empty and ready
   - No user data visible

6. **Login Again**
   - Enter credentials
   - Click "Login"
   - Should login successfully

7. **Test Refresh After Logout**
   - Logout again
   - While on `/login`, refresh page (F5)
   - Should stay on login page (no redirect loop)

---

## ✅ Expected Behavior in Production

### After Logout
- ✅ Shows "Logged out successfully" toast
- ✅ Redirects to `/login` after 0.5 seconds
- ✅ Session cleared from all storage
- ✅ Can login again immediately
- ✅ Login form is ready for input

### After Login
- ✅ Redirects to `/dashboard`
- ✅ User data loads
- ✅ Balance visible
- ✅ All user routes accessible
- ✅ Session persists

### After Session Expires
- ✅ Redirects to `/login`
- ✅ "Session expired" message shown
- ✅ Can login again to start new session

---

## 🎯 Key Features

### Complete Session Cleanup
```javascript
// Clears ALL localStorage (complete wipe)
localStorage.clear();
console.log('Cleared all localStorage');

// Clear sessionStorage
sessionStorage.removeItem('elitebet_user_session');

// Resets all state
setUser(null);
setIsAuthenticated(false);
setIsLoading(false);
```

### User-Friendly Toast
```javascript
// Shows success message first
toast.success('Logged out successfully');

// Then redirects after delay
setTimeout(() => {
  window.location.href = '/login';
}, 500);
```

### Fresh Start
- Every logout starts fresh
- No cached credentials
- No old session data
- Ready for new login immediately

---

## 📝 Demo Account

For testing logout flow:

**Email:** `demo@spinzos.com`  
**Password:** `Demo123!`

---

## 🔄 Production vs Development

### Development (localhost)
- Logout redirects to `http://localhost:5173/login`
- Same behavior as production
- All features work identically

### Production (Live Site)
- Logout redirects to `https://www.spinzos.com/login`
- Fully tested and working
- Session management works perfectly

---

## 🚨 Important Notes

1. **Logout is Immediate**
   - Toast shown first
   - Then redirect after 0.5 seconds
   - Smooth user experience

2. **Session Completely Cleared**
   - All user data removed
   - Storage cleared
   - State reset
   - Supabase session signed out

3. **Can Login Immediately**
   - No waiting period
   - Can use same credentials
   - Can use different account
   - Fresh session created
   - All localStorage cleared (complete cleanup)

4. **Refresh Works**
   - After logout, refresh stays on login page
   - After login, refresh stays on dashboard
   - No redirect loops
   - No blank pages

5. **Works in Production**
   - Tested and verified
   - No issues on refresh
   - Handles all edge cases
   - Professional user experience
