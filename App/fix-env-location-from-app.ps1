# Script to move .env.local from App/app/.env.local to App/.env.local
# Run this from the App directory (where package.json is located)

$ErrorActionPreference = "Stop"

Write-Host "Fixing .env.local location..." -ForegroundColor Cyan
Write-Host ""

$sourcePath = "app\.env.local"
$destPath = ".env.local"
$projectRoot = Get-Location

Write-Host "Project root: $projectRoot" -ForegroundColor Yellow
Write-Host "Source (wrong): $projectRoot\$sourcePath" -ForegroundColor Red
Write-Host "Destination (correct): $projectRoot\$destPath" -ForegroundColor Green
Write-Host ""

# Check if source exists
if (Test-Path $sourcePath) {
    Write-Host "✓ Found .env.local in app/ directory (WRONG location)" -ForegroundColor Yellow
    
    # Check if destination already exists
    if (Test-Path $destPath) {
        Write-Host "⚠ WARNING: .env.local already exists in root!" -ForegroundColor Red
        Write-Host "  Root file: $projectRoot\$destPath" -ForegroundColor Yellow
        Write-Host "  App file: $projectRoot\$sourcePath" -ForegroundColor Yellow
        Write-Host ""
        $choice = Read-Host "Do you want to overwrite root .env.local with app/.env.local? (y/N)"
        if ($choice -ne "y" -and $choice -ne "Y") {
            Write-Host "Cancelled. Please manually merge or backup files." -ForegroundColor Yellow
            exit 1
        }
        # Backup root file
        $backupPath = ".env.local.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $destPath $backupPath -Force
        Write-Host "  Backed up root .env.local to: $backupPath" -ForegroundColor Cyan
    }
    
    # Move the file
    Write-Host ""
    Write-Host "Moving .env.local from app/ to root..." -ForegroundColor Cyan
    Move-Item -Path $sourcePath -Destination $destPath -Force
    
    Write-Host "✓ Successfully moved .env.local to project root" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Restart your dev server (npm run dev) for changes to take effect!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify .env.local is in: $projectRoot\$destPath" -ForegroundColor White
    Write-Host "2. Stop dev server (Ctrl+C)" -ForegroundColor White
    Write-Host "3. Restart: npm run dev" -ForegroundColor White
    Write-Host "4. Visit: http://localhost:3000/api/env-check to verify env vars are loaded" -ForegroundColor White
} elseif (Test-Path $destPath) {
    Write-Host "✓ .env.local is already in the correct location (project root)" -ForegroundColor Green
    Write-Host "  Location: $projectRoot\$destPath" -ForegroundColor White
} else {
    Write-Host "✗ .env.local not found in either location" -ForegroundColor Red
    Write-Host ""
    Write-Host "Expected locations:" -ForegroundColor Yellow
    Write-Host "  ❌ WRONG: $projectRoot\$sourcePath" -ForegroundColor Red
    Write-Host "  ✓ CORRECT: $projectRoot\$destPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Create .env.local in the project root (same folder as package.json)" -ForegroundColor Cyan
    exit 1
}

