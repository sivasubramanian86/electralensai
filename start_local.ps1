# ElectraLensAI - Local Environment Startup Script
# This script terminates existing processes on the required ports to ensure a clean startup.

Write-Host "Cleaning up existing processes on ports 8080, 8082, 5173, and 5174..." -ForegroundColor Cyan

function Kill-ProcessOnPort {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId -ne 0 -and $processId -ne 4) { # Skip System Idle and System
                Write-Host "Killing process ID $processId on port $Port" -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Kill-ProcessOnPort 8080
Kill-ProcessOnPort 8082
Kill-ProcessOnPort 5173
Kill-ProcessOnPort 5174

Write-Host "Starting ElectraLensAI Backend (FastAPI on Port 8082)..." -ForegroundColor Green
Start-Process -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8082" -NoNewWindow

Write-Host "Starting ElectraLensAI Frontend (Vite on Port 5173)..." -ForegroundColor Green
Set-Location -Path "web"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -NoNewWindow

Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8082"
Write-Host "Frontend: http://localhost:5173"
