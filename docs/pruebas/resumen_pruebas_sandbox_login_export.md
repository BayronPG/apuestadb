# Resumen de pruebas — Sandbox login/registro + exportación a Excel

**Fecha:** 02/sep/2026 · **Proyecto:** ApuestaDB (Bases de Datos 2, TIA)
**Alcance:** pruebas reales del sandbox técnico autorizado (backend Node.js/Express + SQL Server + frontend React).
**Documento sin secretos:** no incluye contraseñas, cookies, cadenas de conexión ni datos sensibles.

---

## 1. Entorno verificado

| Verificación | Resultado |
|---|---|
| Servicio `MSSQL$SQLEXPRESS01` | Running |
| Protocolo TCP/IP en la instancia | Habilitado (scripts `habilitar_tcp_sqlexpress01.ps1` v2) |
| Puerto 1433 escuchando | Sí (`localhost:1433`) |
| Modo de autenticación | Mixto SQL + Windows (`IsIntegratedSecurityOnly = 0`, script `habilitar_login_mixto.ps1`) |
| Conexión del backend a `ApuestaDB` | `GET /api/health` → `{"ok":true,"bd":"ApuestaDB"}` |
| Variables de entorno | Leídas desde `src/backend/.env` (valores sensibles nunca impresos) |

## 2. Batería automatizada (`src/backend/scripts/pruebas_api.mjs`)

Ejecución final: **21/21 PASS** (total 21 pruebas, 0 fallos).

| # | Prueba | Resultado |
|---|---|---|
| 1 | Health backend + BD | PASS |
| 2 | Registro de usuario real (201) | PASS |
| 3 | Contraseña almacenada como hash bcrypt (len 60, ≠ texto plano) | PASS |
| 4 | Saldos iniciales tokens/pse en 0 (reglas R1/R5) | PASS |
| 5 | Rechazo correo duplicado (409) | PASS |
| 6 | Rechazo documento duplicado (409) | PASS |
| 7 | Validación formato de correo (400) | PASS |
| 8 | Login correcto con rol desde BD (200, rol=usuario) | PASS |
| 9 | Rechazo credenciales incorrectas (401, mensaje genérico) | PASS |
| 10 | Rechazo correo inexistente (401, mismo mensaje genérico) | PASS |
| 11 | Intentos registrados en tabla `Login` (exitoso y fallido) | PASS |
| 12 | Sesión persistente con cookie | PASS |
| 13 | Exportación sin sesión → 401 | PASS |
| 14 | Exportación con rol usuario → 403 | PASS |
| 15 | Cierre de sesión y sesión invalidada | PASS |
| 16 | Login admin (200, rol=admin) | PASS |
| 17 | Listado seguro de tablas (16 tablas) | PASS |
| 18 | Rechazo de tabla inexistente/nombre arbitrario (400) | PASS |
| 19 | Exportación de 1 tabla (hoja `Usuario`, encabezados = columnas reales) | PASS |
| 20 | Exportación de varias tablas (3 hojas: Usuario, SaldoCuenta, Apuestas) | PASS |
| 21 | Exportación de tabla vacía (hoja solo con encabezados) | PASS |

## 3. Archivos .xlsx generados (evidencia)

Carpeta: `docs/pruebas/salidas_xlsx/` — validados por lectura con ExcelJS y **abiertos con Excel real (COM)**:

| Archivo | Hojas (filas de datos) |
|---|---|
| `evidencia_1_tabla_ApuestaDB_exportacion_20260902_185917.xlsx` | Usuario (6) |
| `evidencia_varias_tablas_ApuestaDB_exportacion_20260902_185917.xlsx` | Usuario (6), SaldoCuenta (10), Apuestas (6) |
| `evidencia_tabla_vacia_ApuestaDB_exportacion_20260902_185917.xlsx` | _PruebaVacia (0: solo encabezados) |

Nombres de archivo con formato `ApuestaDB_exportacion_YYYYMMDD_HHmmss.xlsx` (con sufijo si hay colisión de segundo). Nulos → celdas vacías; números, fechas y textos conservan su tipo. Se conservan identificadores y claves foráneas (se exporta el `SELECT *` real).

## 4. Correcciones realizadas durante las pruebas

1. **`DB_SERVER` en una sola variable "host,puerto"**: el driver `mssql` no la parsea → separado en `DB_SERVER` + `DB_PORT` (`src/backend/src/db.js`, `.env`).
2. **TCP deshabilitado en la instancia** (solo memoria compartida): script v2 `habilitar_tcp_sqlexpress01.ps1` (escritura directa al registro, puerto 1433).
3. **Servidor en modo solo autenticación Windows**: script `habilitar_login_mixto.ps1` (`LoginMode = 2`).
4. **Login SQL desincronizado con `.env`**: script `sincronizar_clave_login.ps1` (clave aleatoria, nunca impresa).
5. **Bug en la batería**: faltaba `clave2` en el usuario de prueba → corregido; correo/documento únicos por ejecución para repetibilidad.
6. **Ruta de evidencias** apuntaba a `src/docs/` → corregida a `docs/pruebas/salidas_xlsx/`.
7. **Colisión de nombres de archivo** al exportar varias tablas en el mismo segundo → sufijo numérico en el exportador y prefijos descriptivos en las copias de evidencia.

## 5. Notas

- El usuario admin sembrado (`jhon@apuestadb.com`) tenía un hash ficticio inválido; la batería lo reemplaza en cada ejecución con un hash bcrypt real de una clave de pruebas de sandbox (valor no documentado aquí por política de no exponer contraseñas).
- La batería es repetible: cada ejecución crea un usuario de prueba nuevo.
- La tabla `_PruebaVacia` es un andamio temporal de prueba: se crea y elimina dentro de la batería.
