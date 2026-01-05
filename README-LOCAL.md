# Email Sender - Local Development Setup

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (running locally on port 27017)
3. **Git**

## Quick Start

1. **Clone the repository** (if not done already):
   ```bash
   git clone <your-repo-url>
   cd Email-Sender-
   ```

2. **Install dependencies**:
   ```bash
   # Backend dependencies
   cd backend
   npm install

   # Frontend dependencies
   cd ../frontend-react
   npm install
   ```

3. **Set up environment variables**:
   - The `.env` file in the backend folder is already configured for localhost
   - Make sure MongoDB is running locally on `mongodb://localhost:27017/email-sender`

4. **Start the application**:
   ```bash
   # Option 1: Use the batch script (Windows)
   start-local.bat

   # Option 2: Start manually
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend-react
   npm start
   ```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health
- **Auth Routes**: http://localhost:5000/api/auth

## Features Configured for Local Development

✅ MongoDB connection (local)
✅ JWT authentication  
✅ Google OAuth (configure in Google Console)
✅ Email/Password registration and login
✅ CORS enabled for localhost
✅ Session management
✅ Redis (optional - will work without it)

## Troubleshooting

### MongoDB Issues
- Make sure MongoDB is installed and running
- Check if the service is running: `mongod --version`
- Start MongoDB service if needed

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`, `http://localhost:5000`
6. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Update your `.env` file with the client ID and secret

### Common Issues
- **Port conflicts**: Make sure ports 3000 and 5000 are available
- **CORS errors**: Check that frontend URL in backend matches `http://localhost:3000`
- **Auth not working**: Verify JWT_SECRET is set in `.env` file