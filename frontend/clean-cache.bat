@echo off
echo Cleaning Next.js cache...
echo.

if exist .next (
    rmdir /s /q .next
    echo [OK] Removed .next folder
)

if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo [OK] Removed node_modules cache
)

echo.
echo Cache cleaned successfully!
echo.
echo Now run: npm run dev
echo Or run: npm run dev:clean (cleans automatically)
pause
