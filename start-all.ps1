# AdminTab Multi-Server Startup Script
# This script starts all three Next.js applications in separate PowerShell windows

Write-Host "🚀 Starting AdminTab Multi-Server Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists in main project
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Installing main project dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if node_modules exists in Filemanager
if (-not (Test-Path "Filemanager/node_modules")) {
    Write-Host "⚠️  Installing File Manager dependencies..." -ForegroundColor Yellow
    Set-Location Filemanager
    npm install
    npx prisma generate
    npx prisma db push
    Set-Location ..
}

# Check if node_modules exists in english_editor
if (-not (Test-Path "english_editor/node_modules")) {
    Write-Host "⚠️  Installing PDF Editor dependencies..." -ForegroundColor Yellow
    Set-Location english_editor
    npm install
    Set-Location ..
}

# Check if public/posts directory exists
if (-not (Test-Path "public/posts")) {
    Write-Host "📁 Creating shared storage directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "public/posts" -Force | Out-Null
}

Write-Host ""
Write-Host "✅ All dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Starting servers in separate windows..." -ForegroundColor Cyan
Write-Host ""

# Start Main AdminTab (port 3001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🏠 Main AdminTab Server (Port 3001)' -ForegroundColor Blue; npm run dev"

# Wait a moment before starting next server
Start-Sleep -Seconds 2

# Start File Manager (port 3002)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\Filemanager'; Write-Host '📁 File Manager Server (Port 3002)' -ForegroundColor Green; npm run dev"

# Wait a moment before starting next server
Start-Sleep -Seconds 2

# Start PDF Editor (port 3003)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\english_editor'; Write-Host '✏️ PDF Editor Server (Port 3003)' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "✅ All servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access URLs:" -ForegroundColor Cyan
Write-Host "   Main Site:     http://localhost:3001" -ForegroundColor White
Write-Host "   File Manager:  http://localhost:3002" -ForegroundColor White
Write-Host "   PDF Editor:    http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Log in as admin to access File Manager and Editor tabs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
