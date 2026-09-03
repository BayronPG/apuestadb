# ============================================================
# ApuestaDB - Habilitar MODO MIXTO de autenticacion en SQLEXPRESS01
# ------------------------------------------------------------
# El servidor esta en "solo autenticacion Windows", por lo que el
# login SQL 'apuestadb_app' (usado por el backend Node.js) es
# rechazado aunque la contrasena sea correcta.
#
# Que hace:
#   1. Cambia LoginMode = 2 (SQL Server + Windows) en el registro.
#   2. Reinicia el servicio MSSQL$SQLEXPRESS01.
#   3. Verifica el modo mixto y prueba el login SQL por TCP
#      leyendo la contrasena desde src/backend/.env (sin imprimirla).
#
# EJECUTAR UNA VEZ como Administrador:
#   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Proyectos\ApuestaDB\src\backend\scripts\habilitar_login_mixto.ps1"
# ============================================================

$ErrorActionPreference = 'Stop'
$svc = 'MSSQL$SQLEXPRESS01'
$regLoginMode = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS01\MSSQLServer'
$envFile = Join-Path $PSScriptRoot '..\.env'

Write-Host '==> [1/3] Configurando LoginMode = 2 (modo mixto)...'
Set-ItemProperty -Path $regLoginMode -Name 'LoginMode' -Value 2 -Type DWord
Write-Host '    OK: LoginMode = 2'

Write-Host '==> [2/3] Reiniciando servicio SQL Server...'
Restart-Service -Name $svc -Force
$estado = 'Stopped'
for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Seconds 1
    $estado = (Get-Service -Name $svc).Status
    if ($estado -eq 'Running') { break }
}
Write-Host "    Estado del servicio: $estado"
if ($estado -ne 'Running') { throw 'El servicio no quedo en estado Running.' }

Write-Host '==> [3/3] Verificaciones...'
Start-Sleep -Seconds 3
$mode = sqlcmd -S localhost,1433 -E -Q "SET NOCOUNT ON; SELECT CAST(SERVERPROPERTY('IsIntegratedSecurityOnly') AS int);" -W -h -1 -l 10 2>&1 | Select-Object -Last 1
Write-Host "    IsIntegratedSecurityOnly (0 = modo mixto): $($mode.Trim())"

# Probar login SQL leyendo la clave del .env (nunca se imprime)
if (Test-Path $envFile) {
    $pass = ((Get-Content $envFile) | Where-Object { $_ -like 'DB_PASSWORD=*' }) -replace '^DB_PASSWORD=', ''
    $env:SQLCMDPASSWORD = $pass
    $test = sqlcmd -S localhost,1433 -U apuestadb_app -d ApuestaDB -Q "SET NOCOUNT ON; SELECT SUSER_SNAME() AS sesion;" -W -l 10 2>&1
    Remove-Item Env:SQLCMDPASSWORD
    Write-Host "    Login SQL apuestadb_app por TCP: $($test -join ' ')"
} else {
    Write-Host '    AVISO: no se encontro src/backend/.env para probar el login SQL.'
}

Write-Host ''
Write-Host '======================================================'
Write-Host '  LISTO: modo mixto habilitado (si ves 0 y el login OK).'
Write-Host '======================================================'
