@echo off
echo Installing Backend Dependencies...
cd backend
call npm install
cd..

echo.
echo Installing Frontend Dependencies...
cd frontend
call npm install
cd..

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Run seed.bat to populate the database
echo 2. Run start.bat to launch the application
echo.
pause
