# Render Deployment Steps

## 1. Deploy Backend on Render

### Create a new Web Service on Render:
1. Connect your GitHub repository
2. Choose the `backend` directory as the root
3. Use these settings:

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Environment Variables:**
Copy all values from `.env.production` and add them in Render dashboard:
- MONGODB_URI
- JWT_SECRET  
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- EMAIL_USER
- EMAIL_PASSWORD
- FRONTEND_URL
- BACKEND_URL (use the URL Render provides)
- PORT (Render will set this automatically, but you can set to 10000)
- SESSION_SECRET
- REDIS_URL
- NODE_ENV=production

### Important Notes:
- Render uses PORT from environment, typically 10000
- Your backend URL will be: `https://your-app-name.onrender.com`
- Update BACKEND_URL and GOOGLE_CALLBACK_URL with the actual URL once deployed

## 2. Update Frontend Environment Variables

In Vercel dashboard:
1. Go to your project settings
2. Environment Variables
3. Add: `VITE_API_BASE_URL` = `https://your-actual-backend-url.onrender.com`

## 3. Update Google OAuth Settings

In Google Cloud Console OAuth settings, **ADD** these URLs:

**Authorized JavaScript origins:**
- `https://email-sender-azure.vercel.app`

**Authorized redirect URLs:**
- `https://your-actual-backend-url.onrender.com/api/auth/google/callback`

## 4. After Backend Deployment

1. Note your actual Render backend URL
2. Update the URLs in this file with the real URL
3. Update Vercel environment variables with the real backend URL
4. Update Google OAuth settings with the real callback URL

## Next Steps:
1. Deploy backend to Render first
2. Get the actual backend URL from Render
3. Update all environment files with the real URL
4. Redeploy frontend with updated environment variables