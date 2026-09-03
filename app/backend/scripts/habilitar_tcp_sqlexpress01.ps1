# ============================================================
# ApuestaDB - Habilitar TCP en SQL Server Express (SQLEXPRESS01) - v2
# ------------------------------------------------------------
# v2: escribe DIRECTAMENTE en el registro de la instancia (metodo WMI
# fallo silenciosamente en v1) y verifica el resultado al final.
#
# COMO EJECUTARLO (una sola vez, como Administrador):
#   powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Proyectos\ApuestaDB\app\backend\scripts\habilitar_tcp_sqlexpress01.ps1"
#
# Que hace:
#   1. Habilita TCP (Enabled=1) a nivel de protocolo y por IP.
#   2. Fija el puerto estatico 1433 en IPAll (desactiva dinamico).
#   3. Reinicia el servicio MSSQL$SQLEXPRESS01.
#   4. Verifica: servicio Running + puerto 1433 escuchando + sqlcmd por TCP.
# Es idempotente y reversible (solo cambia valores de red).
# ============================================================

$ErrorActionPreference = 'Stop'
$svc = 'MSSQL$SQLEXPRESS01'
$base = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS01\MSSQLServer\SuperSocketNetLib'
$tcp  = Join-Path $base 'Tcp'
$ipAll = Join-Path $tcp 'IPAll'

Write-Host '==> [1/4] Aplicando configuracion TCP en el registro...'

# Nivel de protocolo: habilitar TCP
Set-ItemProperty -Path $tcp -Name 'Enabled' -Value 1 -Type DWord
Write-Host '    OK: Tcp Enabled = 1'

# IPAll: puerto estatico 1433, sin puerto dinamico
Set-ItemProperty -Path $ipAll -Name 'TcpPort' -Value '1433' -Type String
Set-ItemProperty -Path $ipAll -Name 'TcpDynamicPorts' -Value '0' -Type String
Write-Host '    OK: IPAll TcpPort = 1433'

# Habilitar TCP en cada IP concreta (loopback, LAN, IPv6)
$ips = Get-ChildItem $tcp | Where-Object { $_.PSChildName -like 'IP*' }
foreach ($ip in $ips) {
    $props = Get-ItemProperty -Path $ip.PSPath -ErrorAction SilentlyContinue
    if ($null -ne $props.Enabled) {
        Set-ItemProperty -Path $ip.PSPath -Name 'Enabled' -Value 1 -Type DWord
    }
}
Write-Host "    OK: TCP habilitado en $($ips.Count) IP(s) configuradas"

Write-Host '==> [2/4] Reiniciando servicio SQL Server (espera ~30 s)...'
Restart-Service -Name $svc -Force

$estado = 'Stopped'
for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Seconds 1
    $estado = (Get-Service -Name $svc).Status
    if ($estado -eq 'Running') { break }
}
Write-Host "    Estado del servicio: $estado"
if ($estado -ne 'Running') { throw 'El servicio no quedo en estado Running.' }

Write-Host '==> [3/4] Verificando puerto 1433...'
$abierto = $false
for ($i = 0; $i -lt 60; $i++) {
    $t = Test-NetConnection -ComputerName localhost -Port 1433 -WarningAction SilentlyContinue
    if ($t.TcpTestSucceeded) { $abierto = $true; break }
    Start-Sleep -Seconds 1
}
Write-Host "    Puerto 1433 abierto: $abierto"

Write-Host '==> [4/4] Verificando conexion por TCP con sqlcmd...'
if ($abierto) {
    $out = sqlcmd -S localhost,1433 -E -Q "SET NOCOUNT ON; SELECT @@SERVERNAME AS servidor;" -W -l 10 2>&1
    $out | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host '    AVISO: no se pudo verificar con sqlcmd (puerto cerrado).'
}

Write-Host ''
if ($abierto) {
    Write-Host '======================================================'
    Write-Host '  LISTO: TCP habilitado en 1433 y conexion verificada.'
    Write-Host '======================================================'
} else {
    Write-Host '======================================================'
    Write-Host '  ATENCION: el puerto 1433 sigue cerrado.'
    Write-Host '  Revisa: (1) firewall, (2) servicio, (3) registro:'
    Write-Host "  Get-Service '$svc'"
    Write-Host '  Get-NetTCPConnection -LocalPort 1433 -State Listen'
    Write-Host '======================================================'
}
