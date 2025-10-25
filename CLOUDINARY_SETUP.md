# CLOUDINARY SETUP GUIDE

## 🎯 **Step 1: Create Upload Preset in Cloudinary**

1. **Go to Cloudinary Dashboard**: https://cloudinary.com/console
2. **Navigate to Settings** → **Upload**
3. **Scroll down to "Upload presets"**
4. **Click "Add upload preset"**
5. **Configure the preset**:
   - **Preset name**: `ml_default`
   - **Signing Mode**: `Unsigned` (this allows frontend uploads)
   - **Folder**: `elite-bet` (optional)
   - **Access mode**: `Public`
6. **Click "Save"**

## 🎯 **Step 2: Test Cloudinary Upload**

**Open browser console (F12) and run:**

```javascript
// Test Cloudinary upload
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

fetch('https://api.cloudinary.com/v1_1/home/image/upload', {
  method: 'POST',
  body: (() => {
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('upload_preset', 'ml_default');
    return formData;
  })()
})
.then(response => response.json())
.then(result => {
  console.log('Cloudinary upload test result:', result);
})
.catch(error => {
  console.error('Cloudinary upload test error:', error);
});
```

## 🎯 **Step 3: Alternative - Use Signed Upload**

If unsigned uploads don't work, you can use signed uploads:

```javascript
// Signed upload (requires API secret)
const timestamp = Math.round(new Date().getTime() / 1000);
const signature = cloudinary.utils.api_sign_request({
  timestamp: timestamp,
  folder: 'elite-bet',
  public_id: `payment_proof_${timestamp}`
}, 'YOUR_API_SECRET');

const formData = new FormData();
formData.append('file', file);
formData.append('timestamp', timestamp);
formData.append('signature', signature);
formData.append('api_key', 'YOUR_API_KEY');
formData.append('folder', 'elite-bet');
```

## 🎯 **Step 4: Check Current Environment Variables**

Your current `.env` file has:
```env
VITE_CLOUDINARY_CLOUD_NAME=home
VITE_CLOUDINARY_API_KEY=768524123714482
VITE_CLOUDINARY_API_SECRET=5hxXwa6O3K_GI_hfB88r3M3Mfq0
```

## 🎯 **Step 5: Test the Fixed Service**

After setting up the upload preset, test the deposit form:

1. **Submit a deposit** with an image
2. **Check browser console** for:
   - `CloudinaryService: Starting real Cloudinary upload...`
   - `CloudinaryService: Uploading to Cloudinary with cloud name: home`
   - `CloudinaryService: Upload successful: {url: "https://res.cloudinary.com/...", public_id: "..."}`

## 🚨 **Common Issues**

**Issue 1: "Upload preset not found"**
- **Solution**: Create the `ml_default` preset in Cloudinary dashboard

**Issue 2: "CORS error"**
- **Solution**: Make sure the upload preset allows unsigned uploads

**Issue 3: "Invalid signature"**
- **Solution**: Use unsigned uploads or check API secret

## 🎯 **Expected Results**

After proper setup:
- ✅ **Images uploaded to Cloudinary** (not blob URLs)
- ✅ **Real Cloudinary URLs** in database
- ✅ **Images accessible** from anywhere
- ✅ **Proper image URLs** in admin dashboard

## 📍 **Quick Fix**

If you want to test immediately, you can:

1. **Go to Cloudinary Dashboard**
2. **Create upload preset** named `ml_default`
3. **Set it to unsigned**
4. **Test deposit form** - should now upload to Cloudinary
