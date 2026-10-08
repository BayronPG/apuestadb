# PLAN_PRUEBAS.md — Fase 12 (Pruebas integrales reales)

**Fecha:** 14/sep/2026
**Autorizado por:** Jhon Bayron Peláez Guerra (14/sep/2026)
**Objetivo:** validar el sistema completo de punta a punta: SQL Server → Backend → Frontend → integración React → API → SQL Server.

---

## 1. Alcance autorizado

Restaurar/recrear la base, ejecutar scripts SQL, procedimientos, views, functions y triggers, instalar dependencias del backend, configurar `.env`, levantar backend y frontend, y ejecutar las pruebas integrales.

## 2. Entorno de pruebas

| Elemento | Valor |
|---|---|
| Instancia SQL Server | `localhost\SQLEXPRESS01` (servicio `MSSQL$SQLEXPRESS01`, Running) |
| Autenticación de administración | Windows (`sqlcmd -E`), usuario sysadmin verificado |
| Autenticación de la API | SQL (login de aplicación dedicado, `DB_AUTH_MODE=sql`) |
| Base de datos | `ApuestaDB` (no existía: se crea desde cero) |
| Backend | Node.js + Express, puerto 4000, prefijo `/api` |
| Frontend | React + Vite, puerto 5173 |
| Herramienta SQL | `sqlcmd` (Client SDK ODBC 170) |

## 3. Secuencia de pruebas

### Fase A — Base de datos
1. `01_database.sql` … `05_seed_data.sql` en orden.
2. `functions/`, `views/`, `procedures/`, `triggers/`.
3. Verificación de objetos: 29 tablas, 29 PK, 38 FK, 81 índices, 14 procedimientos, 12 vistas, 6 funciones, 13 triggers.
4. Respaldo `.bak` del estado validado.

### Fase B — Datos de prueba
5. Usuarios de prueba (uno `usuario`, uno `administrador`) por la vía real (`POST /api/auth/registro`) y asignación de rol administrativo en la base.
6. Datos deportivos (deporte, liga/temporada, equipos, evento programado, mercado, opciones y cuotas) por script SQL, porque no existe endpoint de creación de eventos.

### Fase C — Backend
7. `npm install` en `backend/`, `.env` real (sin credenciales en el repositorio).
8. Arranque y verificación de `GET /api/health` con base conectada.
9. Prueba de los 24 endpoints con los tres perfiles: público, usuario, administrador; y casos negativos (sin token, token inválido, rol insuficiente, datos inválidos).

### Fase D — Frontend
10. Arranque de Vite (`npm run dev`).
11. Recorrido real en navegador: login, dashboard, eventos, crear apuesta, historial, saldo, movimientos, notificaciones, perfil; y zona administrativa (dashboard admin, reportes, ranking).
12. Verificación de la cadena completa React → API → SQL Server (una apuesta registrada debe verse reflejada en la base y descontada del saldo).

### Fase E — Cierre
13. Registro de resultados, errores y correcciones en `RESULTADOS.md`, `ERRORES.md` y `CORRECCIONES.md`.

## 4. Criterios de aceptación

- La base se crea sin errores y con los conteos de objetos esperados.
- `GET /api/health` reporta la base como conectada.
- Los 24 endpoints responden con el contrato documentado (`{ ok, data }`).
- Un flujo funcional completo (registro → recarga → apuesta → resultado → liquidación) deja rastro verificable en la base.
- El frontend compila, arranca y opera contra la API real (sin datos simulados).

## 5. Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Scripts nunca ejecutados: pueden fallar en orden o sintaxis | Ejecutar con `-b` (abortar en error) y registrar cada fallo |
| Acentos en `Futbol`/mensajes por codificación | `sqlcmd -f 65001` (UTF-8) |
| Sin datos de arranque de usuarios/eventos | Datos de prueba explícitos (fase B) |
| Triggers y procedimientos pueden encadenar transacciones | Ejecutar por lotes y revisar cada mensaje de error |
| Prueba en navegador con sesión real | Perfil de navegador aislado, solo `localhost` |

## 6. Fuera de alcance

- Cambios de alcance, modelo de datos o contratos de la API.
- Múltiples deportes, apuestas combinadas, pagos reales.
- Commit o push (requieren autorización aparte).
