# CORRECCIONES.md — Fase 12 (correcciones aplicadas)

**Fecha:** 14/sep/2026
**Criterio:** cambio mínimo, justificado por un error real (`ERRORES.md`), sin alterar el modelo de datos, el alcance ni los contratos de la API.

---

## C-01 — `database/04_indexes.sql`: opciones SET obligatorias

**Error:** E-01.
**Cambio aplicado:** encabezado de sesión dentro del script, antes de crear los índices.

```sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO
```

**Resultado:** el script funciona igual desde SSMS y desde `sqlcmd`, sin depender de la opción `-I`.
**Verificación:** `sys.indexes.has_filter = 1` → 1 índice (UX_Usuario_telefono).

## C-02 — Procedimientos: función fuera del `EXEC`

**Error:** E-02.
**Cambio aplicado** en `01_auth.sql`, `02_saldo.sql`, `03_apuestas.sql` (2 bloques) y `04_eventos.sql`: el mensaje de error se calcula en una variable y luego se pasa al procedimiento.

```sql
-- antes
EXEC dbo.usp_Auditoria_Registrar ..., @descripcion = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);

-- despues
DECLARE @descripcion_error NVARCHAR(500) = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);
EXEC dbo.usp_Auditoria_Registrar ..., @descripcion = @descripcion_error;
```

**Coherencia de tipos:** `usp_Auditoria_Registrar.@descripcion` es `NVARCHAR(500)`; la variable usa el mismo tipo.
**Verificación:** los 14 procedimientos existen y el manejo de errores audita correctamente (probado con casos negativos: 400/403/404 sin excepción no controlada).

## C-03 — Dependencias entre procedimientos (E-03)

**Decisión:** no se renombraron los archivos (son entregables de la fase 7); se documenta el orden recomendado.
**Orden recomendado al ejecutar `database/procedures/`:** `06_auditoria.sql` y `04_eventos.sql` (proveen `usp_Auditoria_Registrar` y `usp_Notificacion_Crear`) **antes** de `01_auth.sql`, `02_saldo.sql` y `03_apuestas.sql`. Ejecutarlos en el orden numérico también funciona: solo genera advertencias de dependencia, no errores.
**Nota añadida** en `database/README.md`.

## C-04 — Configuración de conexión del backend (E-05)

**Cambio aplicado** en `backend/.env` (archivo local, no versionado):

```
DB_SERVER=localhost      (antes: localhost\SQLEXPRESS01)
DB_PORT=1433             (la instancia escucha en 1433 y en un puerto dinamico)
```

**Motivo:** evitar la dependencia del SQL Server Browser, que está deshabilitado. No se modificó ninguna configuración del servidor SQL (no se habilitó TCP, no se inició el Browser, no se cambiaron puertos): solo la cadena de conexión de la aplicación.
**Alternativa no aplicada (queda a decisión de Jhon):** habilitar el SQL Server Browser o fijar un puerto estático, si se prefiere usar el nombre de instancia.

## C-05 — Secretos de `.env` entre comillas (E-06)

**Cambio aplicado:** `JWT_SECRET="..."` y `DB_PASSWORD="..."` entre comillas dobles.
**Motivo:** `dotenv` corta el valor en el primer `#` cuando no está entrecomillado (el JWT quedaba en 14 caracteres y la contraseña en 7).
**Verificación:** `dotenv` entrega `JWT_SECRET` de 48 caracteres y `DB_PASSWORD` de 28; el login SQL y el arranque del backend funcionan.
**Aprendizaje para futuros despliegues:** generar secretos sin `#` o entrecomillarlos siempre.

## C-06 — Respaldo sin compresión (E-07)

**Cambio aplicado:** `BACKUP DATABASE ApuestaDB TO DISK = ... WITH INIT, NAME = ...` (sin `COMPRESSION`, no soportada en Express).
**Resultado:** `docs/base_datos/backups/ApuestaDB_bak_fase12_20260914_191607.bak` (4.97 MB) creado correctamente.

## C-07 — DML manual sobre `dbo.Usuario` (E-04)

**Cambio aplicado:** la promoción a administrador se ejecutó con `sqlcmd -I` (QUOTED_IDENTIFIER ON).
**Regla documentada:** cualquier `INSERT/UPDATE/DELETE` manual sobre `dbo.Usuario` desde `sqlcmd` requiere `-I` (o ejecutarse desde SSMS). Con C-01 ya aplicado a los scripts, esto afecta solo a comandos manuales.

## C-08 — Datos de prueba por SQL

**Archivo creado:** `docs/ACTUAL/pruebas/datos_prueba.sql` (idempotente).
**Motivo:** el proyecto no tiene endpoint de creación de eventos; para probar apuestas y liquidación se necesitan evento, mercado, opciones y cuotas. El script usa los valores admitidos por las restricciones CHECK reales (`programado`, `abierto`, `habilitada`, `local/empate/visitante`, `en_curso`, `vigente`).
**Verificación:** 1 evento, 1 mercado, 3 opciones; el flujo funcional completo cerró con saldo 108.500 y 1 apuesta ganada.

## C-09 — Procedimiento de trabajo (E-08)

**Cambio aplicado:** no se detienen procesos `node` en bloque (el gateway de OpenClaw corre sobre Node). El backend se detiene por su identificador de sesión/PID.
**Motivo:** durante la recuperación tras el reinicio del equipo se detuvieron procesos ajenos al backend.

## C-10 — Archivos temporales fuera del repositorio

**Cambio aplicado:** los guiones de prueba y las credenciales locales se guardan en `.tmp/` (ya ignorado por `.gitignore`): `.tmp/credenciales_prueba_fase12.env`, `.tmp/resultados_fase12.txt`, `.tmp/scripts_fase12/`.
**Motivo:** no incorporar credenciales ni artefactos de ejecución al control de versiones.

---

## Pendientes de corrección (no aplicados, requieren tu decisión)

| # | Tema | Propuesta |
|---|---|---|
| P-1 | Creación de eventos solo por SQL | Endpoint administrativo `POST /api/eventos` (fase futura, requiere autorización) |
| P-2 | SQL Server Browser deshabilitado | Habilitarlo o fijar puerto estático si se quiere volver a `localhost\SQLEXPRESS01` en `.env` |
| P-3 | `.env.example` | Añadir la nota de entrecomillar valores que contengan `#` |
| P-4 | 3 endpoints faltantes del contrato (Fase 11) | `PATCH /notificaciones/:id`, `GET/PUT /usuarios/perfil`, `GET /saldo/tipos` |
