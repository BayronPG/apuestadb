# Resumen de pruebas — Sandbox login/registro (estado actual)

**Fecha de actualización:** 02/sep/2026 · **Proyecto:** ApuestaDB (Bases de Datos 2, TIA)
**Alcance:** pruebas reales del sandbox técnico autorizado (backend Node.js/Express + SQL Server + frontend React).
**Documento sin secretos:** no incluye contraseñas, cookies, cadenas de conexión ni datos sensibles.

> Nota histórica: una versión anterior de este resumen documentaba la práctica de
> exportación a Excel (21/21 pruebas). Esa funcionalidad fue retirada por decisión
> de Jhon (02/sep/2026); el detalle histórico vive en el historial de Git.

---

## 1. Entorno verificado

| Verificación | Resultado |
|---|---|
| Servicio `MSSQL$SQLEXPRESS01` | Running |
| Protocolo TCP/IP (puerto 1433) | Habilitado |
| Modo de autenticación | Mixto SQL + Windows (`IsIntegratedSecurityOnly = 0`) |
| Base de datos | `ApuestaDB` — **modelo actual de 29 tablas** (16 de clase + 13 de la ampliación), cada tabla con ≥5 registros ficticios |
| Conexión del backend | `GET /api/health` → `{"ok":true,"bd":"ApuestaDB"}` |
| Variables de entorno | Leídas desde `app/backend/.env` (valores sensibles nunca impresos) |

## 2. Batería automatizada (`app/backend/scripts/pruebas_api.mjs`)

Resultado: **15/15 PASS** (0 fallos).

| # | Prueba | Resultado |
|---|---|---|
| 1 | Health backend + BD | PASS |
| 2 | Endpoint de sesión sin cookie → 401 (ruta protegida) | PASS |
| 3 | Registro de usuario real (201) | PASS |
| 4 | Contraseña almacenada como hash bcrypt (len 60, ≠ texto plano) | PASS |
| 5 | Saldos iniciales tokens/pse en 0 (reglas R1/R5) | PASS |
| 6 | Rechazo correo duplicado (409) | PASS |
| 7 | Rechazo documento duplicado (409) | PASS |
| 8 | Validación de formato de correo (400) | PASS |
| 9 | Login correcto con rol desde BD (200, rol=usuario) | PASS |
| 10 | Rechazo credenciales incorrectas (401, mensaje genérico) | PASS |
| 11 | Rechazo correo inexistente (401, mismo mensaje genérico) | PASS |
| 12 | Intentos registrados en tabla `Login` (exitoso y fallido) | PASS |
| 13 | Sesión persistente (cookie httpOnly) | PASS |
| 14 | Cierre de sesión y sesión invalidada | PASS |
| 15 | Login admin (200, rol=admin) | PASS |

## 3. Otras verificaciones ejecutadas

- Script de ampliación a 29 tablas (`script_ampliacion_sandbox_29_tablas.sql`): ejecutado varias veces **sin duplicar datos** (idempotente); `DBCC CHECKCONSTRAINTS` sin violaciones; 29 tablas con mínimo 5 filas.
- Datos y hashes de demostración ficticios (usuarios demo con `HASH_FICTICIO_...`).
- Frontend: `npm run build` OK y `npm run lint` con 0 errores (1 aviso cosmético de fast-refresh).
- Smoke test end-to-end por proxy de Vite (`localhost:5173` → backend): login admin real, `/home` 200, logout OK.
- Revisión manual de aceptación del frontend (registro, login, sesión, rutas, roles, interfaz) validada por Jhon (02/sep/2026).

## 4. Notas

- La batería es repetible: cada ejecución registra un usuario de prueba nuevo con clave aleatoria (solo vive en memoria) y correo/documento únicos.
- El usuario admin sembrado (`jhon@apuestadb.com`) recibe en cada corrida un hash bcrypt real de la clave definida en `PRUEBA_CLAVE_ADMIN` (`.env` local, no versionado).
- Los usuarios sembrados por SQL (seed de clase y demo) usan hash ficticio y no pueden iniciar sesión hasta tener un hash real.
