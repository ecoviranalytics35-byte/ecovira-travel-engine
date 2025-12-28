# Fix build permission issues on Windows
# Run this script if you get EPERM errors during build

Write-Host "=== Fixing Next.js Build Permissions ===" -ForegroundColor Cyan

# Step 1: Stop any running Next.js dev servers
Write-Host "`n[1/4] Checking for running Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -notlike "*cursor*" }
if ($nodeProcesses) {
    Write-Host "Found Node processes. Please stop any dev servers manually." -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, Path
} else {
    Write-Host "No Node processes found. ✓" -ForegroundColor Green
}

# Step 2: Wait for OneDrive sync (if applicable)
Write-Host "`n[2/4] Waiting 3 seconds for OneDrive sync..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 3: Remove .next folder with retries
Write-Host "`n[3/4] Removing .next folder..." -ForegroundColor Yellow
$maxRetries = 3
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    if (Test-Path ".next") {
        try {
            Remove-Item -Recurse -Force ".next" -ErrorAction Stop
            Write-Host "Successfully removed .next folder. ✓" -ForegroundColor Green
            $success = $true
        } catch {
            $retryCount++
            Write-Host "Attempt $retryCount failed. Retrying in 2 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } else {
        Write-Host ".next folder doesn't exist. ✓" -ForegroundColor Green
        $success = $true
    }
}

if (-not $success) {
    Write-Host "`n⚠ WARNING: Could not remove .next folder automatically." -ForegroundColor Red
    Write-Host "Please manually delete the .next folder or close applications using it." -ForegroundColor Yellow
    Write-Host "Path: $PWD\.next" -ForegroundColor Gray
}

# Step 4: Clean npm cache (optional)
Write-Host "`n[4/4] Build fix complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. If OneDrive is syncing, wait for it to finish" -ForegroundColor White
Write-Host "2. Close any IDEs/editors with the project open" -ForegroundColor White
Write-Host "3. Run: npm run build" -ForegroundColor White
Write-Host "`nOr use dev mode instead: npm run dev" -ForegroundColor Cyan

