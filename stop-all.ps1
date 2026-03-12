# Stop all ThreadTrack related processes
Write-Host "Stopping all ThreadTrack services..." -ForegroundColor Red

# Stop Node processes (Node and Metro)
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "Killing $($nodeProcs.Count) Node processes..."
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Stop Python (FastAPI/Uvicorn)
$pyProcs = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pyProcs) {
    Write-Host "Killing $($pyProcs.Count) Python processes..."
    $pyProcs | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "All services stopped." -ForegroundColor Green
exit 0
