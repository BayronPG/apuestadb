# RECUPERACIÓN DE LA BASE DE DATOS — ApuestaDB (Fase 13)

**Fecha del incidente:** 07/oct/2026 (~19:03) — la base `ApuestaDB` se eliminó por error.
**Fecha de recuperación:** 07/oct/2026
**Resultado:** base restaurada, datos de demostración recargados y cadena React → API → SQL Server verificada.

---

## 1. Diagnóstico

`sys.databases` ya no listaba `ApuestaDB`. Quedaban los tres respaldos en
`docs/base_datos/backups/`, pero **solo uno sirve**:

| Respaldo | Estado | ¿Sirve? |
|---|---|---|
| `ApuestaDB_bak_fase12_20260914_191607.bak` | Modelo final (29 tablas, 12 vistas, 14 procedimientos, 13 triggers, 6 funciones) | **Sí** |
| `ApuestaDB_bak_final_20260914_145010.bak` | Modelo viejo (`Empresa`, `Servicios`, `Apuestas`, `HacerApuesta`, `LogPago`…) | No |
| `ApuestaDB_bak_20260909_1917.bak` | Estado intermedio del 09/sep | No |

El respaldo de la Fase 12 trae **esquema y objetos, pero sin datos** (9 filas de catálogo, 0 usuarios):
los datos de demostración viven en scripts y hay que recargarlos.

## 2. Cadena de recuperación (orden exacto, probado)

```bat
:: 1) Restaurar el esquema y los objetos
sqlcmd -S localhost\SQLEXPRESS01 -Q "RESTORE DATABASE ApuestaDB FROM DISK = 'C:\Proyectos\ApuestaDB\docs\base_datos\backups\ApuestaDB_bak_fase12_20260914_191607.bak' WITH MOVE 'ApuestaDB' TO 'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS01\MSSQL\DATA\ApuestaDB.mdf', MOVE 'ApuestaDB_log' TO 'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS01\MSSQL\DATA\ApuestaDB_log.ldf', RECOVERY, REPLACE;"

:: 2) Catálogos deportivos base (Colombia, Medellín, Liga BetPlay, Nacional, DIM…)
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -I -b -f 65001 -i docs\ACTUAL\pruebas\datos_prueba.sql

:: 3) Usuarios de referencia de la Fase 12 (ver §3) y sus 4 cuentas de saldo

:: 4) Reponer el usuario de aplicación (ver §4)

:: 5) Datos de demostración
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -E -C -I -f 65001 -b -i database\06_demo_data.sql

:: 6) Funciones del entregable de la Fase 13 (4 nuevas)
sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i database\consultas\06_funciones_adicionales.sql
```

**El flag `-I` no es opcional** en los pasos 2 y 5: el índice único filtrado de `Usuario`
obliga a `QUOTED_IDENTIFIER ON` para cualquier DML (ya documentado como **E-04** en `ERRORES.md`);
sin él, `06_demo_data.sql` aborta con `Msg 1934`.

## 3. Credencial de demostración

`06_demo_data.sql` exige un hash bcrypt de referencia y **no lo versiona**.
La credencial de prueba vive en el archivo no versionado `.tmp/credenciales_prueba_fase12.env`
(una sola línea con pares `clave=valor` separados por espacios: `ADMIN_CORREO`, `ADMIN_PASS`,
`USUARIO_CORREO`, `USUARIO_PASS`). Con ella se regeneraron los hashes bcrypt (costo 10) de:

- `usuario@apuestadb.local` y `admin@apuestadb.local` (usuarios de referencia de la Fase 12), y
- los 6 usuarios `@apuestadb.co` de la demostración (reutilizan la credencial, igual que antes).

Los valores en claro nunca se imprimieron ni se escribieron en el repositorio.

## 4. Usuario de aplicación (hallazgo importante)

Tras restaurar, el login SQL `apuestadb_app` queda **huérfano**: existe en el servidor pero no
tiene usuario mapeado en la base, y el backend falla con *Login failed*. Se repone con:

```sql
CREATE USER [apuestadb_app] FOR LOGIN [apuestadb_app];
ALTER ROLE db_datareader ADD MEMBER [apuestadb_app];
ALTER ROLE db_datawriter ADD MEMBER [apuestadb_app];
GRANT EXECUTE ON SCHEMA::dbo TO [apuestadb_app];
```

Permisos según `RESULTADOS.md` §1. **Este paso debe repetirse después de cualquier restore.**

## 5. Verificación ejecutada

| Prueba | Resultado |
|---|---|
| `GET /api/health` | `data.baseDatos.estado = "conectada"` |
| Batería de endpoints (4 grupos + rechazos) y flujo funcional | **58/58 PASS, 0 FALLA** |
| Aserción de auditoría (2 logins → +2 filas `INICIO_SESION`) | PASS |
| Flujo funcional: recarga 100000 → apuesta 10000 @1.85 → saldo 90000 → resultado 2-1 oficial → liquidación → saldo 108500, apuesta `ganada`, 3 movimientos, 2 notificaciones | PASS (aritmética exacta) |
| Frontend `http://localhost:5173` | HTTP 200 con `#root` |
| Proxy `http://localhost:5173/api/health` | `baseDatos: conectada` |

## 6. Estado final de los datos

29 de 29 tablas pobladas. **28 de las 29 tablas coinciden exactamente** con el conteo de
`DATOS_DEMOSTRACION.md` §2.

Única diferencia: **`Auditoria` = 45 filas (documentado: 54)**. Es la tabla de trazas: su
número depende de cuántas operaciones auditadas se ejecutaron en la corrida original (logins y
llamadas a procedimientos), dato que no quedó registrado. El resto del dataset es idéntico.

Total actual: **335 registros** (documentado: 344; la diferencia son esas 9 trazas de auditoría).

## 7. Prevención

1. El respaldo de la Fase 12 **no incluye datos**: conviene un respaldo con el dataset de
   demostración cargado (`BACKUP DATABASE` tras el paso 5; en Express **sin** `WITH COMPRESSION`, ver E-07).
2. Repetir el respaldo cada vez que cambie el estado que se quiere conservar.
3. No versionar `.env` ni `.tmp/`: ya están excluidos por `.gitignore`.
