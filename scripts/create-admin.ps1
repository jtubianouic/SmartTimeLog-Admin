param(
    [string]$Email = "admin@smarttimelog.com"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentPath = Join-Path $projectRoot ".env"

if (-not (Test-Path $environmentPath)) {
    throw "Missing .env file."
}

Get-Content $environmentPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Count -eq 2) {
            Set-Item -Path "Env:$($parts[0])" -Value $parts[1]
        }
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$serverKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl) {
    throw "NEXT_PUBLIC_SUPABASE_URL is not configured."
}

if (-not $serverKey -or -not $serverKey.StartsWith("sb_secret_")) {
    throw "SUPABASE_SERVICE_ROLE_KEY must contain a valid sb_secret_ key."
}

$password = Read-Host "Password for $Email" -AsSecureString
$confirmation = Read-Host "Confirm password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$confirmationPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmation)

try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $plainConfirmation = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmationPointer)

    if ($plainPassword.Length -lt 8) {
        throw "Password must contain at least 8 characters."
    }

    if ($plainPassword -cne $plainConfirmation) {
        throw "Passwords do not match."
    }

    $body = @{
        email = $Email
        password = $plainPassword
        email_confirm = $true
        app_metadata = @{ role = "admin" }
    } | ConvertTo-Json

    $body | node (Join-Path $PSScriptRoot "create-admin.mjs")

    if ($LASTEXITCODE -ne 0) {
        throw "Supabase rejected the administrator account request."
    }

    Write-Host "Admin Auth account created for $Email." -ForegroundColor Green
}
finally {
    $plainPassword = $null
    $plainConfirmation = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmationPointer)
}