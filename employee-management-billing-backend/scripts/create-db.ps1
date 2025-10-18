# Usage: .\create-db.ps1 -SuperPass "your_postgres_superuser_password"
param(
  [string]$SuperUser = "postgres",
  [string]$SuperPass,
  [string]$NewDb = "EMS",
  [string]$NewUser = "billing_user",
  [string]$NewPass = "vendhan@123",
  [string]$DbHost = "localhost",
  [int]$Port = 5432
)

if (-not $SuperPass) {
  Write-Host "Please enter the superuser password (input hidden):"
  $SuperPass = Read-Host -AsSecureString
  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SuperPass)
  $SuperPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
}

$env:PGPASSWORD = $SuperPass

try {
  psql -U $SuperUser -h $DbHost -p $Port -c "CREATE DATABASE \"$NewDb\";"
  psql -U $SuperUser -h $DbHost -p $Port -c "CREATE USER \"$NewUser\" WITH PASSWORD '$NewPass';"
  psql -U $SuperUser -h $DbHost -p $Port -c "GRANT ALL PRIVILEGES ON DATABASE \"$NewDb\" TO \"$NewUser\";"
  Write-Host "Database and user created successfully."
} catch {
  Write-Error "Error creating DB/user: $_"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
