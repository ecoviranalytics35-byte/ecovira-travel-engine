# Script to move .env.local from app/.env.local to project root
# Run this from the App directory (where package.json is located)

$ErrorActionPreference = "Stop"

Write-Host "Checking .env.local location..." -ForegroundColor Cyan

$sourcePath = "app\.env.local"
$destPath = ".env.local"
$projectRoot = Get-Location

# Check if source exists
if (Test-Path $sourcePath) {
    Write-Host "Found .env.local in app/ directory" -ForegroundColor Yellow
    Write-Host "Moving to project root: $projectRoot" -ForegroundColor Yellow
    
    # Move the file
    Move-Item -Path $sourcePath -Destination $destPath -Force
    
    Write-Host "✓ Successfully moved .env.local to project root" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Restart your dev server (npm run dev) for changes to take effect!" -ForegroundColor Red
} elseif (Test-Path $destPath) {
    Write-Host "✓ .env.local is already in the correct location (project root)" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local not found in either location" -ForegroundColor Red
    Write-Host "  Expected locations:" -ForegroundColor Yellow
    Write-Host "    - $projectRoot\app\.env.local (WRONG - will be moved)" -ForegroundColor Yellow
    Write-Host "    - $projectRoot\.env.local (CORRECT - create it here)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Create .env.local in the project root (same folder as package.json)" -ForegroundColor Cyan
    exit 1
}

