# Start all services for ThreadTrack

Write-Host "Starting ThreadTrack Services..." -ForegroundColor Cyan

# Start Node Backend
Write-Host "Starting Node.js Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command 'cd backend-node; npm run dev'"

# Start Python Backend
Write-Host "Starting Python Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command 'cd backend-python; .\venn\Scripts\activate; python main.py'"

# Start Mobile (Expo)
Write-Host "Starting Mobile App (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command 'cd mobile; npx expo start'"

Write-Host "All services are launching in separate windows." -ForegroundColor Green
