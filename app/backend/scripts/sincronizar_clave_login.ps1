# ApuestaDB - sincroniza la clave del login SQL 'apuestadb_app' con app/backend/.env
# (uso interno; genera clave aleatoria, nunca la imprime)
$ErrorActionPreference = 'Stop'
$chars = (48..57) + (65..90) + (97..122)
$pw = -join ($chars | Get-Random -Count 28 | ForEach-Object { [char]$_ })

$tmpSql = Join-Path $env:TEMP ("alter_login_" + [guid]::NewGuid().ToString('N') + ".sql")
$sql = "ALTER LOGIN apuestadb_app WITH PASSWORD = N'{0}', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF;`nSELECT 'alter_ok' AS estado;`n" -f $pw
[System.IO.File]::WriteAllText($tmpSql, $sql, (New-Object System.Text.UTF8Encoding($false)))
try {
    sqlcmd -S .\SQLEXPRESS01 -E -i $tmpSql -W 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { throw "ALTER LOGIN fallo (exit $LASTEXITCODE)" }
} finally {
    Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue
}

# Actualizar .env con la misma clave
$envPath = 'C:\Proyectos\ApuestaDB\app\backend\.env'
$c = Get-Content $envPath
$out = foreach ($l in $c) { if ($l -like 'DB_PASSWORD=*') { 'DB_PASSWORD=' + $pw } else { $l } }
[System.IO.File]::WriteAllLines($envPath, $out, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "OK: clave del login sincronizada con .env (longitud $($pw.Length), no se muestra)"
