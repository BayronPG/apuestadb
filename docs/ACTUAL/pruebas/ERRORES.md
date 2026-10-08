# ERRORES.md — Fase 12 (errores reales encontrados al ejecutar)

**Fecha:** 14/sep/2026
**Regla:** solo errores observados durante la ejecución real, con el mensaje del motor/servidor y su impacto. Las correcciones aplicadas están en `CORRECCIONES.md`.

---

## E-01 — Índice filtrado rechazado por `sqlcmd` (Msg 1934)

- **Dónde:** `database/04_indexes.sql` (índice `UX_Usuario_telefono`).
- **Mensaje:** `CREATE INDEX failed because the following SET options have incorrect settings: 'QUOTED_IDENTIFIER'`.
- **Causa:** `sqlcmd` ejecuta con `QUOTED_IDENTIFIER OFF`; los índices filtrados exigen `ON`. Desde SSMS no aparece porque SSMS lo activa por defecto.
- **Impacto:** 25 índices se crearon; el índice único filtrado de teléfono no. 26 de 81 objetos de índice quedaron incompletos temporalmente.

## E-02 — Procedimientos que no compilaban (Msg 156, "Incorrect syntax near the keyword 'LEFT'")

- **Dónde:** `procedures/01_auth.sql`, `02_saldo.sql`, `03_apuestas.sql` (2 veces), `04_eventos.sql`, en los bloques `BEGIN CATCH`.
- **Código original:** `EXEC dbo.usp_Auditoria_Registrar ..., @descripcion = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);`
- **Causa:** T-SQL no permite llamadas a funciones como valor de un parámetro de `EXEC` (solo constantes, variables o `NULL`). El parser falla justo en `LEFT`.
- **Impacto:** los 4 archivos fallaron y sus 11 procedimientos no se crearon en el primer intento (solo quedaron 3 de 14).

## E-03 — Advertencias de dependencia por orden de ejecución

- **Dónde:** `procedures/01_auth.sql` → `usp_Auditoria_Registrar` (creado en `06_auditoria.sql`); `02_saldo.sql` y `03_apuestas.sql` → `usp_Notificacion_Crear` (creado en `04_eventos.sql`).
- **Mensaje:** `The module 'usp_...' depends on the missing object 'dbo.usp_...'`.
- **Causa:** el orden numérico de los archivos no sigue el orden de dependencias.
- **Impacto:** advertencia, no error (el módulo se crea igual y funciona cuando el objeto existe). No bloqueó nada.

## E-04 — `sqcmd` sin `-I` no puede modificar `dbo.Usuario` (Msg 1934)

- **Dónde:** promoción del usuario administrador (`UPDATE dbo.Usuario SET id_rol = ...`) ejecutada desde `sqlcmd`.
- **Mensaje:** `UPDATE failed because the following SET options have incorrect settings: 'QUOTED_IDENTIFIER'`.
- **Causa:** la tabla `Usuario` tiene el índice único filtrado de E-01; cualquier DML sobre ella exige `QUOTED_IDENTIFIER ON`.
- **Impacto:** el usuario quedó con rol `usuario`; la prueba de endpoints administrativos habría fallado.

## E-05 — El backend no conectaba a SQL Server

- **Síntoma:** `GET /api/health` → `{"estado":"no_disponible","detalle":"Failed to connect to localhost\\SQLEXPRESS01 in 15000ms"}`.
- **Causa:** `DB_SERVER=localhost\SQLEXPRESS01` con `port` explícito: el driver `tedious` no resuelve instancias con nombre y el **SQL Server Browser está detenido y deshabilitado** (`SQLBrowser`, StartType `Disabled`), así que no puede traducir el nombre de instancia al puerto dinámico.
- **Impacto:** ninguna ruta con datos funcionaba, aunque la API respondía.

## E-06 — Valores de `.env` truncados por el carácter `#`

- **Síntoma:** advertencia `JWT_SECRET debe tener 32 caracteres o mas` y `Login failed for user 'apuestadb_app'` pese a que `sqlcmd` sí autenticaba con la misma contraseña.
- **Diagnóstico:** el valor real tenía 28 caracteres (contraseña) y 48 (JWT); `dotenv` entregó 7 y 14. El primer `#` de cada valor corta el resto de la línea.
- **Causa:** secretos generados con un alfabeto que incluía `#` y escritos sin comillas en `.env`.
- **Impacto:** el arranque funcionaba pero sin conexión a base y con JWT inválido por longitud.

## E-07 — `BACKUP ... WITH COMPRESSION` no soportado en Express (Msg 1844)

- **Mensaje:** `BACKUP DATABASE WITH COMPRESSION is not supported on Express Edition (64-bit)`.
- **Impacto:** el primer respaldo de la fase falló; el `.bak` no se generó.

## E-08 — Reinicio del equipo durante la ejecución

- **Hecho:** `LastBootUpTime = 14/sep/2026 19:25:15`. El equipo se reinició en medio de las pruebas (varios reinicios del gateway coinciden en hora) y el servicio `MSSQL$SQLEXPRESS01` quedó detenido un momento antes de volver solo (StartType `Automatic`).
- **Impacto: ** dos intentos de levantar el backend murieron por el reinicio (`EADDRINUSE`/sin escucha) y las pruebas se retomaron después. No hubo pérdida de datos: la base quedó intacta en disco.
- **Nota de proceso:** durante la recuperación se detuvieron procesos `node` en bloque, lo que incluyó procesos ajenos al backend; se corrigió el procedimiento para detener solo el PID propio.

## E-09 — `npm install` omitió el script de instalación de `bcrypt`

- **Mensaje:** `npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts: bcrypt@5.1.1`.
- **Impacto:** ninguno observable: la verificación `require('bcrypt')` + `hashSync` funcionó (binario precompilado incluido). Se deja constancia por si en otro equipo la instalación falla.

## E-10 — Navegación del navegador bloqueada por política

- **Síntoma:** la herramienta de navegador devolvió `browser navigation blocked by policy` al intentar abrir `http://localhost:5173/login`.
- **Impacto:** no se pudo ejecutar el recorrido clicable (login, navegación, formularios) en un navegador real; la integración se validó por HTTP, proxy y contratos de la API.

## E-11 — Defectos del arnés de pruebas (no del proyecto)

- El primer intento del guion de pruebas leyó mal el archivo de credenciales locales y envió `contrasena` nula → `400` en el login. Corregido en el propio guion (formato `clave=valor`).
- `Invoke-RestMethod` no propaga el cuerpo del error 400; los códigos se inspeccionaron desde `Exception.Response.StatusCode`.
