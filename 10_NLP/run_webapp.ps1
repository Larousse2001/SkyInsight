# Starts FastAPI backend + Next.js dev server in parallel.
# Usage:  powershell -ExecutionPolicy Bypass -File 10_NLP/run_webapp.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. FastAPI
$apiJob = Start-Job -ScriptBlock {
    param($r)
    Set-Location (Split-Path $r -Parent)
    & c:\Users\moham\SkyInsight\.venv\Scripts\python.exe -m uvicorn 10_NLP.app.api:app --reload --reload-dir 10_NLP/app --port 8000
} -ArgumentList $root

Write-Host "FastAPI starting on http://localhost:8000 (job $($apiJob.Id))" -ForegroundColor Cyan

# 2. Next.js
Set-Location (Join-Path $root "web")
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}
Write-Host "Next.js starting on http://localhost:3000" -ForegroundColor Cyan
npm run dev

# When Next dev exits, stop API too
Stop-Job  $apiJob -ErrorAction SilentlyContinue
Remove-Job $apiJob -ErrorAction SilentlyContinue
