@echo off
echo 🚀 Starting Email Sender Application with React Frontend
echo.

echo 📧 Setting up backend dependencies...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
) else (
    echo Backend dependencies already installed
)

echo.
echo ⚛️ Setting up React frontend dependencies...
cd ..\frontend-react
if not exist node_modules (
    echo Installing React dependencies...
    npm install
) else (
    echo React dependencies already installed
)

echo.
echo 🔧 Starting backend server...
start "Backend Server" cmd /c "cd ..\backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo ⚛️ Starting React frontend...
npm start

echo.
echo Press any key to close...
pause > nul