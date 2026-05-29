# Sync PayPal env vars from .env.paypal-vercel.local to Vercel Production.
# Prereq: vercel login && vercel link (app project, repo root).
# Usage:  pwsh scripts/sync-paypal-vercel-env.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env.paypal-vercel.local'

if (-not (Test-Path $envFile)) {
  Write-Error "Missing $envFile — create it from .env.example PayPal section."
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Error 'Install Vercel CLI: npm i -g vercel'
}

Push-Location $root
try {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
    if ($line -notmatch '^([A-Z0-9_]+)=(.*)$') { continue }
    $name = $Matches[1]
    $value = $Matches[2]
    Write-Host "Setting $name (production)..."
    $value | vercel env add $name production --force 2>&1 | Out-Host
  }
  Write-Host 'Done. Redeploy production: vercel --prod'
} finally {
  Pop-Location
}
