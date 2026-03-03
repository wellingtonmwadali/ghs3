@echo off
echo Starting GHS3 Garage Management System...
echo.
echo Starting Backend Server...
cd backend
start cmd /k "npm run dev"
cd..

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd frontend
start cmd /k "npm run dev"
cd..

echo.
echo ============================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ============================================
echo.
echo Login credentials:
echo Owner: admin@garage.com / admin123
echo Manager: manager@garage.com / manager123
echo ============================================
