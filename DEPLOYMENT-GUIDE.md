# 🚀 Deployment Guide: Email Sender App

This guide walks you through deploying your Email Sender application with:
- **Frontend**: React app on Vercel
- **Backend**: Node.js API on Fly.io

## 📋 Prerequisites

### Required Accounts & Tools
1. **GitHub** account (for code repository)
2. **Vercel** account (connect with GitHub)
3. **Fly.io** account 
4. **MongoDB Atlas** account (cloud database)
5. **Redis Cloud** account (optional but recommended)
6. **Flyctl CLI** installed locally

### Install Flyctl
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

## 🗂️ Project Structure After Setup
```
Email-Sender/
├── backend/
│   ├── .env                    # Your environment variables
│   ├── .env.example           # Template (created)
│   ├── Dockerfile             # Docker config (created)
│   ├── .dockerignore          # Docker ignore (created)
│   ├── fly.toml               # Fly.io config (created)
│   └── src/...                # Your existing code
├── frontend-react/
│   ├── .env                   # Your environment variables
│   ├── .env.example           # Template (created)
│   ├── vercel.json            # Vercel config (created)
│   └── src/...                # Your existing code
└── README.md
```

## 🔧 Setup Phase

### 1. Set Up External Services

#### MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/emailsender`
5. Whitelist all IPs (0.0.0.0/0) or specific Fly.io IPs

#### Redis Cloud (Session Store - Recommended)
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free database
3. Get connection URL: `redis://username:password@hostname:port`

#### Email Service Setup
Choose one option:

**Option A: Gmail (Easiest)**
1. Enable 2FA on your Gmail account
2. Generate App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use: `EMAIL_SERVICE=gmail` with your Gmail and App Password

**Option B: Custom SMTP**
Use any SMTP service (SendGrid, Mailgun, etc.)

#### Google OAuth (For Social Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `https://YOUR_APP_NAME.fly.dev/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback` (for development)

### 2. Configure Environment Variables

#### Backend Environment (.env)
Create `backend/.env` based on `.env.example`:

```bash
NODE_ENV=production
PORT=8080

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emailsender?retryWrites=true&w=majority

# Session & JWT Secrets (Generate strong random strings)
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters
JWT_SECRET=your-jwt-secret-minimum-32-characters

# Redis (Optional but recommended)
REDIS_URL=redis://username:password@hostname:port

# Email Configuration (Choose one)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://YOUR_APP_NAME.fly.dev/api/auth/google/callback

# Frontend URL (Will be updated after Vercel deployment)
FRONTEND_URL=https://your-frontend.vercel.app
```

#### Frontend Environment (.env)
Create `frontend-react/.env`:

```bash
VITE_API_BASE_URL=https://YOUR_APP_NAME.fly.dev
VITE_GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
NODE_ENV=production
```

## 🚀 Backend Deployment (Fly.io)

### 1. Initialize Fly.io App
```bash
cd backend
flyctl auth login
flyctl launch
```

Follow prompts:
- App name: Choose unique name (e.g., `your-name-email-sender`)
- Region: Choose closest to users (e.g., `iad` for US East)
- Don't add PostgreSQL
- Don't deploy now

### 2. Update fly.toml
Edit `backend/fly.toml` and replace `your-app-name-here` with your actual app name.

### 3. Set Environment Variables
```bash
# Set each variable individually
flyctl secrets set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/emailsender"
flyctl secrets set SESSION_SECRET="your-session-secret"
flyctl secrets set JWT_SECRET="your-jwt-secret"
flyctl secrets set EMAIL_SERVICE="gmail"
flyctl secrets set EMAIL_USER="your-email@gmail.com"
flyctl secrets set EMAIL_PASS="your-app-password"
flyctl secrets set GOOGLE_CLIENT_ID="your-client-id"
flyctl secrets set GOOGLE_CLIENT_SECRET="your-client-secret"
flyctl secrets set REDIS_URL="your-redis-url"
```

### 4. Deploy Backend
```bash
flyctl deploy
```

### 5. Get Backend URL
```bash
flyctl info
# Note the URL: https://your-app-name.fly.dev
```

## 🌐 Frontend Deployment (Vercel)

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy on Vercel
1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Select `frontend-react` as root directory
4. Set environment variables:
   - `VITE_API_BASE_URL`: `https://YOUR_APP_NAME.fly.dev`
   - `VITE_GOOGLE_CLIENT_ID`: `your-google-client-id`
5. Deploy

### 3. Update Backend CORS
Update `backend/.env` or Fly.io secrets with your Vercel URL:
```bash
flyctl secrets set FRONTEND_URL="https://your-frontend.vercel.app"
```

### 4. Update Google OAuth
Add your Vercel domain to Google OAuth authorized domains:
- `https://your-frontend.vercel.app`

### 5. Redeploy Backend
```bash
cd backend
flyctl deploy
```

## ✅ Testing Deployment

### 1. Health Check
Visit: `https://your-app-name.fly.dev/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "uptime": 123,
  "memory": "45MB"
}
```

### 2. Frontend Test
Visit: `https://your-frontend.vercel.app`
- Should load properly
- Try login/register
- Test email functionality

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify `FRONTEND_URL` is set correctly in backend
- Check Vercel deployment URL matches

**2. Database Connection**
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check connection string format

**3. Environment Variables**
- List Fly.io secrets: `flyctl secrets list`
- Check Vercel environment variables in dashboard

**4. Build Failures**
```bash
# Check Fly.io logs
flyctl logs

# Check build status
flyctl status
```

### Useful Commands

```bash
# Fly.io
flyctl logs                    # View logs
flyctl ssh console            # SSH into container
flyctl status                 # Check app status
flyctl scale count 1          # Scale to 1 instance
flyctl secrets list           # List environment variables

# Vercel
npx vercel --prod             # Manual deployment
npx vercel logs               # View deployment logs
```

## 🔄 Updating Deployments

### Backend Updates
```bash
cd backend
git add .
git commit -m "Update backend"
git push
flyctl deploy
```

### Frontend Updates
Vercel auto-deploys on Git push. Manual deployment:
```bash
cd frontend-react
npx vercel --prod
```

## 🔒 Security Checklist

- [ ] Strong session and JWT secrets (32+ characters)
- [ ] Environment variables not in code
- [ ] CORS properly configured
- [ ] Database connection secured
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Google OAuth domains restricted

## 💡 Production Optimizations

### Backend
- Enable Redis for sessions and caching
- Monitor with Fly.io metrics
- Set up log aggregation
- Configure auto-scaling

### Frontend  
- Enable Vercel Analytics
- Set up error monitoring (Sentry)
- Configure performance monitoring
- Optimize bundle size

## 🎯 Next Steps

1. Set up monitoring and alerting
2. Configure backup strategies
3. Implement CI/CD pipelines
4. Add comprehensive logging
5. Set up staging environments

---

🎉 **Congratulations!** Your Email Sender app is now live in production!

- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://your-app-name.fly.dev