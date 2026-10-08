# ENTREGA_FINAL.md — ApuestaDB

**Proyecto:** sitio web académico de apuestas deportivas simuladas
**Asignatura:** Bases de Datos 2 — Tecnológico de Antioquia
**Integrantes:** Jhon Bayron Peláez Guerra · Shantal Coneo García
**Fecha de cierre:** 14/sep/2026
**Estado:** ✅ funcional, validado de punta a punta y listo para entrega académica

---

## 1. Resumen ejecutivo

ApuestaDB es una aplicación web académica de apuestas deportivas **simuladas**: no hay dinero real, ni pasarelas de pago, ni cuotas de proveedores externos. El proyecto demuestra de forma completa e integrada los conceptos de Bases de Datos 2: modelado conceptual, lógico y físico; normalización hasta 3FN; diccionario de datos; programación en el motor (procedimientos, vistas, funciones y triggers); seguridad y auditoría; y el consumo de esa base desde un backend REST y un frontend React.

El sistema se construyó por fases (0 a 12), cada una autorizada y documentada. La Fase 12 ejecutó las **pruebas integrales reales** sobre SQL Server, el backend y el frontend, con **38 verificaciones de API sin fallas** y un **flujo funcional completo** verificado (recarga ficticia → apuesta con cuota congelada → resultado oficial → liquidación → pago del premio → trazabilidad).

## 2. Alcance final

**Incluido y funcionando**
- Registro, inicio de sesión, recuperación y restablecimiento de contraseña (bcrypt + JWT).
- Roles `usuario` y `administrador` con autorización verificada en el backend.
- Catálogo deportivo: país, ciudad, estadio, liga, temporada, equipos, árbitros y eventos.
- Mercados y opciones de apuesta con cuotas; historial automático de cambios de cuota.
- Apuestas simples con cuota congelada, validación de saldo y transacción única.
- Saldo ficticio por tipos (tokens y PSE) con movimientos trazables y recargas administrativas.
- Resultados oficiales, liquidación de apuestas (individual y por evento) y pago de premios.
- Historial de apuestas, historial de movimientos, notificaciones, perfil y ranking.
- Panel administrativo: usuarios, recargas, resultados, liquidaciones, auditoría y 3 reportes (administrativo, financiero, ranking).
- Auditoría de operaciones y triggers de integridad.

**Fuera de alcance (por decisión del proyecto)**
- Dinero real, pasarelas de pago, múltiples deportes, apuestas combinadas, proveedores externos de cuotas, estadísticas avanzadas.
- Mejoras no bloqueantes documentadas en `docs/ACTUAL/frontend/PENDIENTES_BACKEND.md`.

## 3. Arquitectura final

```
Navegador (React 18 + Vite, puerto 5173)
        │  HTTP/JSON  (Axios, JWT en localStorage)
        ▼
API REST (Node.js + Express, puerto 4000, prefijo /api)
  rutas → middlewares (auth, roles, validación) → controladores
        → servicios (reglas de negocio) → repositorios
        ▼
SQL Server 2022 Express (localhost\SQLEXPRESS01)
  29 tablas · 12 vistas · 6 funciones · 14 procedimientos · 13 triggers
```

Capas separadas y responsabilidades claras:
- **Base de datos:** integridad, transacciones, reglas críticas, auditoría y automatización (triggers).
- **Backend:** autenticación (JWT), autorización por rol, validación de entrada, hash bcrypt y acceso exclusivamente parametrizado (sin SQL concatenado).
- **Frontend:** presentación, navegación protegida por rol y estados visuales; nunca decide la autorización real.

## 4. Tecnologías utilizadas

| Capa | Tecnología | Uso |
|---|---|---|
| Base de datos | Microsoft SQL Server (Express, `SQLEXPRESS01`) + SSMS | Modelo físico, T-SQL, procedimientos, vistas, funciones, triggers |
| Backend | Node.js 24 + Express 4 | API REST, 24 endpoints |
| Seguridad | `jsonwebtoken` (JWT), `bcrypt`, `express-validator`, `helmet`, `cors` | Sesión, hash, validación, cabeceras, CORS |
| Acceso a datos | `mssql` (driver `tedious`), consultas parametrizadas | Pool de conexiones, ejecución de procedimientos |
| Frontend | React 18 + Vite 5 + React Router 6 + Axios + Context API | 16 páginas, 15 componentes, CSS propio mobile-first |
| Control de versiones | Git + GitHub privado (`BayronPG/apuestadb`) | Trazabilidad del proyecto |

## 5. Métricas finales del proyecto

| Métrica | Valor |
|---|---|
| Tablas | **29** (29 PK, 26 UNIQUE, 38 FK, CHECK y DEFAULT) |
| Índices | 25 non-clustered + 1 único filtrado (+ 29 clustered de PK) |
| Vistas | **12** |
| Funciones | **6** (4 escalares, 2 table-valued) |
| Procedimientos almacenados | **14** |
| Triggers | **13** |
| Endpoints REST | **24** |
| Pantallas del frontend | **16** páginas + 15 componentes reutilizables |
| Rutas del frontend | 15 rutas + índice + 404 |
| Normalización | 1FN, 2FN y 3FN en 29/29 tablas |
| Pruebas de API ejecutadas | **38** verificaciones → 38 OK / 0 fallas |
| Casos negativos cubiertos | 8 (401, 403, 404, 400, saldo insuficiente, token inválido, etc.) |
| Fases completadas | 13 (Fase 0 a Fase 12) |
| Respaldo verificado | `ApuestaDB_bak_fase12_20260914_191607.bak` |

## 6. Logros técnicos

1. **Modelo completo y normalizado:** 29 tablas derivadas de un modelo conceptual propio (no reutilizado), con auditoría de normalización y correcciones aplicadas hasta 3FN.
2. **Programación en el motor:** 14 procedimientos con `TRY/CATCH`, `THROW` y transacciones anidadas correctamente; 13 triggers que garantizan auditoría, historial de cuotas, consistencia de saldos y protección de registros críticos.
3. **Reglas de negocio garantizadas en la base:** descuento de saldo y registro de la apuesta en una sola transacción, cuota congelada, liquidación única por apuesta, premio derivado del marcador oficial.
4. **Seguridad real:** contraseñas nunca en texto plano (bcrypt calculado en el backend), JWT, autorización por rol, consultas exclusivamente parametrizadas y auditoría de accesos y operaciones.
5. **Integración verificada de punta a punta:** una apuesta registrada en la interfaz produjo movimientos, notificaciones y reportes reales en SQL Server (100.000 → 90.000 → 108.500 tokens).
6. **Trazabilidad documental:** cada fase tiene su carpeta de documentación, y las pruebas integrales dejaron plan, resultados, errores y correcciones.

## 7. Problemas encontrados y solucionados

| Problema | Causa | Solución aplicada |
|---|---|---|
| Índice filtrado rechazado (`Msg 1934`) | `sqlcmd` ejecuta con `QUOTED_IDENTIFIER OFF` | Opciones `SET` obligatorias dentro de `04_indexes.sql` |
| 4 archivos de procedimientos no compilaban (`Msg 156`) | Función (`LEFT(ERROR_MESSAGE(),500)`) usada como parámetro de `EXEC` | Calcular el mensaje en una variable y pasarla al procedimiento |
| Advertencias de dependencia | Orden de ejecución de procedimientos | Documentado el orden recomendado; no afecta la ejecución |
| El backend no conectaba a SQL Server | Instancia con nombre + SQL Server Browser deshabilitado | `DB_SERVER=localhost` + `DB_PORT=1433` en `.env` local |
| `.env` truncaba JWT y contraseña | `dotenv` corta el valor en `#` sin comillas | Valores entrecomillados; verificación de longitudes |
| Respaldo fallido (`Msg 1844`) | `COMPRESSION` no existe en Express | Respaldo sin compresión |
| DML manual bloqueado en `Usuario` | Índice filtrado + `QUOTED_IDENTIFIER` | `sqlcmd -I` (o SSMS) |
| Reinicio del equipo durante las pruebas | Evento externo (19:25) | Pruebas retomadas; base intacta en disco |

Detalle completo en `docs/ACTUAL/pruebas/ERRORES.md` y `docs/ACTUAL/pruebas/CORRECCIONES.md`.

## 8. Estado final del sistema

| Componente | Estado | Evidencia |
|---|---|---|
| Base de datos | ✅ Creada, poblada y verificada | 29/29 tablas, 38 FK, 14 procedimientos, 13 triggers; respaldo generado |
| Backend | ✅ Operativo | `GET /api/health` → `baseDatos: conectada` |
| Frontend | ✅ Operativo | `http://localhost:5173` HTTP 200; proxy `/api` → API → BD |
| Integración | ✅ Verificada por contrato | 38/38 verificaciones; flujo completo hasta el premio |
| Documentación | ✅ Completa por fase y de cierre | `docs/` (14 carpetas) + documentos raíz |
| Pendiente declarado | ⚠️ Recorrido clicable en navegador, responsive real y concurrencia | `docs/ACTUAL/pruebas/RESULTADOS.md` §7 |
