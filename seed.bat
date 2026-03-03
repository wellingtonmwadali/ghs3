@echo off
echo Seeding database with sample data...
cd backend
npm run seed
cd..
echo.
echo Database seeded successfully!
echo You can now run start.bat to launch the application
pause
