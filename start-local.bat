@echo off
echo Starting Email Sender Application for Local Development
echo =====================================================
echo.

echo Setting up environment...
echo.

echo Starting Backend Server (Port 5000)...
cd backend
start cmd /k "npm start"
timeout /t 3

echo.
echo Starting Frontend React App (Port 3000)...
cd ../frontend-react
start cmd /k "npm start"

echo.
echo =====================================================
echo Both servers are starting up...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo =====================================================
echo.
echo Press any key to exit this script (servers will continue running)
pause