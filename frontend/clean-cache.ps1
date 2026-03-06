# Quick Fix for Next.js CSS 404 Errors
# Run this script when you encounter CSS loading issues

Write-Host "🧹 Cleaning Next.js cache..." -ForegroundColor Yellow

# Remove .next folder
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✓ Removed .next folder" -ForegroundColor Green
}

# Remove node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✓ Removed node_modules cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Cache cleaned successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
Write-Host "Or run: npm run dev:clean (cleans automatically)" -ForegroundColor Cyan
