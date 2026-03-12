# Start all services for ThreadTrack in the BACKGROUND (Hidden)

$root = Get-Location

Write-Host "Starting ThreadTrack Services in Background..." -ForegroundColor Cyan

# Start Node Backend
Write-Host "Launching Node.js Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command cd backend-node; npm run dev" `
    -WindowStyle Hidden `
    -WorkingDirectory $root `
    -RedirectStandardOutput "$root\node-log.txt" `
    -RedirectStandardError "$root\node-err.txt"

# Start Python Backend
Write-Host "Launching Python Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command cd backend-python; .\venn\Scripts\activate; python main.py" `
    -WindowStyle Hidden `
    -WorkingDirectory $root `
    -RedirectStandardOutput "$root\python-log.txt" `
    -RedirectStandardError "$root\python-err.txt"

# Start Mobile (Expo)
Write-Host "Launching Mobile App (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command cd mobile; npx expo start --offline" `
    -WindowStyle Hidden `
    -WorkingDirectory $root `
    -RedirectStandardOutput "$root\mobile-log.txt" `
    -RedirectStandardError "$root\mobile-err.txt"

Write-Host "All services are running in the background." -ForegroundColor Green
Write-Host "Logs are available in node-log.txt, python-log.txt, and mobile-log.txt" -ForegroundColor Gray
