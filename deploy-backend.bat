@echo off
echo Deploying Email Sender Backend to Fly.io...

REM Navigate to backend directory
cd backend

REM Copy production environment variables
copy .env.production .env

REM Deploy to Fly.io
echo Deploying to Fly.io...
fly deploy

REM Restore original .env file
copy .env.development .env

echo Deployment complete!
echo Your backend should be available at: https://email-sender-backend.fly.dev

pause