# Restart Services Script

Write-Host "Stopping existing Node.js and Python processes..."
taskkill /F /IM node.exe /T 2>$null
taskkill /F /IM python.exe /T 2>$null

Write-Host "Services stopped."
Start-Sleep -Seconds 2

$root = "c:\Users\awwab\Desktop\Genesis\Genesis\sme-supply-chain"

# 1. Start AI Service (Port 8000)
Write-Host "Starting AI Service on Port 8000..."
$ai_process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$root\ai_service'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --reload --port 8000" -PassThru

# 2. Start Backend Server (Port 5002)
Write-Host "Starting Backend Server on Port 5002..."
$server_process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm start" -PassThru

# 3. Start Frontend Client (Port 5173)
Write-Host "Starting Frontend Client..."
$client_process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev" -PassThru

Write-Host "All services have been triggered to start."
Write-Host "AI Service: http://localhost:8000"
Write-Host "Backend: http://localhost:5002"
Write-Host "Frontend: http://localhost:5173"
