# Starts the backend and frontend together, each in its own window.
# Run from anywhere:  .\start-dev.ps1
# Close a window (or press Ctrl+C in it) to stop that server.

$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "No virtual environment found at backend\.venv. Set it up first (see README.md)." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend packages first..."
    Push-Location $frontend
    npm install
    Pop-Location
}

# Backend: http://localhost:8000 (API docs at /docs)
Start-Process powershell -WorkingDirectory $backend -ArgumentList @(
    "-NoExit", "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'Life Dashboard - backend'; & '$python' -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
)

# Frontend: http://localhost:3000
Start-Process powershell -WorkingDirectory $frontend -ArgumentList @(
    "-NoExit", "-Command",
    "`$Host.UI.RawUI.WindowTitle = 'Life Dashboard - frontend'; npm run dev"
)

Write-Host "Started. Open http://localhost:3000 once both windows say they are ready." -ForegroundColor Green
