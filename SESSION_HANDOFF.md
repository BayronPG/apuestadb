# SESSION_HANDOFF.md — ApuestaDB

**Última actualización:** 07/oct/2026 — **Fase 13 (entregable de consultas SQL) y recuperación de la base de datos**

## Fase actual

**FASES 0 a 12.1 COMPLETADAS; FASE 13 COMPLETADA (07/oct/2026).** El proyecto está cerrado como **funcional, documentado y listo para entrega y sustentación académica**. No hay fase abierta ni trabajo pendiente autorizado. Cualquier cambio nuevo (funcionalidad, alcance, base de datos, backend, frontend o documentación) requiere autorización explícita de Jhon.

## Información confirmada

- Asignatura: Bases de Datos 2 (Tecnológico de Antioquia). Proyecto académico de apuestas deportivas simuladas: sin dinero real, sin pasarelas de pago, saldo y transacciones ficticias.
- Integrantes (2): Jhon Bayron Peláez Guerra y Shantal Coneo García (15/ago/2026).
- Workspace exclusivo: `C:\Proyectos\ApuestaDB`. Repositorio privado `BayronPG/apuestadb` (rama `main`).
- Infraestructura del agente separada del proyecto (14/sep/2026): bootstrap y memoria en `C:\Users\BAYRON\.openclaw\workspace-apuestadb`; el agente usa `cwd` = `C:\Proyectos\ApuestaDB`. La prueba de quitar `agents.defaults.repoRoot` se midió y se revirtió (ApuestaDB pasaba a mostrar `C:\Users\BAYRON`). Detalle en `docs/ACTUAL/pruebas/RECONFIGURACION_OPENCLAW.md`. **Decisión definitiva (14/sep/2026):** mantener la configuración actual; fase de reconfiguración cerrada, sin más cambios de OpenClaw.
- Stack confirmado (14/sep/2026): React + Vite · Node.js + Express · SQL Server (`SQLEXPRESS01`) · SSMS.
- Saldo por tipos tokens/PSE con reglas R1–R5 (indicación del profesor, aplicada por Jhon).
- Motor SQL Server y stack React: decisión de Jhon, **pendientes de validación del profesor**.

## Último punto validado (histórico de fases)

- **Fase 0** — contexto académico y separación respecto a otros proyectos.
- **Fase 1** — planteamiento y requisitos: `docs/ACTUAL/entregables/planteamiento_fase1.md`, `docs/ACTUAL/requisitos/` (objetivos, alcance, actores, 29 RF, 12 RNF, 21 RN, 12 CU, riesgos).
- **Fases 2–5** — modelo conceptual (29 entidades, 34 relaciones), modelo lógico (29 tablas), auditoría de normalización (1FN/2FN/3FN; correcciones C-1 y C-2 aplicadas), diccionario de datos.
- **Fase 6 / 6.1** — modelo físico SQL Server y script DDL en `database/` (01–05).
- **Fase 7** — 14 procedimientos en `database/procedures/` + `docs/ACTUAL/procedimientos/`.
- **Fase 8** — 12 vistas y 6 funciones + `docs/ACTUAL/views_functions/`.
- **Fase 9** — 13 triggers + `docs/ACTUAL/triggers/`.
- **Fase 10 / 10.1 — CERRADA** — backend `backend/` con **24 endpoints** y documentación en `docs/ACTUAL/backend/`.
- **Fase 11 / 11.1 — CERRADA** — frontend `frontend/` (16 páginas, 15 componentes) y `docs/ACTUAL/frontend/`.
- **Fase 12 — CERRADA** — pruebas integrales reales: base recreada desde cero, 38/38 verificaciones de API, flujo completo (recarga → apuesta → resultado → liquidación), respaldo `.bak`. Documentos en `docs/ACTUAL/pruebas/`.
- **Fase 12.1 — CERRADA (14/sep/2026)** — datos de demostración completos: `database/06_demo_data.sql` (idempotente) y `docs/ACTUAL/pruebas/DATOS_DEMOSTRACION.md`. **278 registros nuevos, 344 totales** en las 29 tablas, 0 errores de FK/CHECK/trigger, 12/12 vistas con información y procedimientos verificados con datos reales.
- **Cierre documental** — `docs/ACTUAL/entregables/`: ENTREGA_FINAL, RESUMEN_SUSTENTACION, CHECKLIST_ENTREGA.
- **Fase 13 — COMPLETADA (07/oct/2026)** — entregable de consultas exigido por el profesor en `database/consultas/`: 80 SELECT, 20 INSERT, 20 UPDATE, 20 DELETE y 20 JOIN distintos (los JOIN van aparte), más 4 funciones nuevas hasta completar las 10 del modelo. Verificado ejecutando los 6 archivos con `sqlcmd` contra la base real. Incluye la **recuperación de la base tras un borrado accidental**: respaldo de Fase 12 → `datos_prueba.sql` → `06_demo_data.sql` → usuario de aplicación. Detalle en `docs/ACTUAL/pruebas/RECUPERACION_FASE13.md` y mapa requisito → sentencia en `database/consultas/COBERTURA.md`.

## Estado técnico verificado (14/sep/2026)

| Elemento | Valor |
|---|---|
| Base de datos | `ApuestaDB` en `localhost\SQLEXPRESS01` (29 tablas, **335 registros**, 38 FK, 26 UNIQUE, 26 índices + 1 filtrado, 12 vistas, **10 funciones**, 14 procedimientos, 13 triggers) |
| Datos de demostración | `database/06_demo_data.sql` — 6 usuarios `@apuestadb.co`, 6 ligas, 7 temporadas, 13 equipos, 12 estadios, 6 árbitros, 9 eventos, 9 mercados, 27 opciones, 30 registros de cuota, 11 apuestas (7 ganadas / 2 perdidas / 2 pendientes), 9 liquidaciones, 16 cuentas de saldo, 9 recargas, 27 movimientos de saldo, 7 favoritos, 14 notificaciones, 54 registros de auditoría |
| Backend | `http://localhost:4000/api` — `GET /api/health` → `baseDatos: conectada`; **24 endpoints**; 38/38 pruebas de API exitosas |
| Frontend | `http://localhost:5173` (proxy `/api` → 4000); **16 páginas React**, 15 componentes; `npm run build` sin errores |
| Login de aplicación | `apuestadb_app` (SQL auth) — contraseña solo en `backend/.env` (no versionado) |
| Credencial demo | Los usuarios `@apuestadb.co` reutilizan la credencial (hash bcrypt) de los usuarios de prueba de la Fase 12; el valor en claro no se versiona |
| Respaldo | `docs/base_datos/backups/ApuestaDB_bak_fase13_20261007_191831.bak` (con datos de demostración, 10,55 MB, verificado con `RESTORE VERIFYONLY`) · anterior: `ApuestaDB_bak_fase12_20260914_191607.bak` (solo esquema y objetos) |

## Elementos provisionales / propuestas

- Alcance inicial provisional (fútbol, apuestas simples, mercado resultado del partido): sujeto a confirmación del profesor.
- `docs/ACTUAL/frontend/PENDIENTES_BACKEND.md` y `docs/ACTUAL/pruebas/CORRECCIONES.md`: 4 mejoras no bloqueantes (endpoint de creación de eventos, SQL Server Browser/puerto fijo, nota en `.env.example`, 3 endpoints del contrato de Fase 11).
- 4 tablas no alcanzan 5 filas por `CHECK` de dominio cerrado (Rol, TipoSaldo, TipoMovimientoSaldo y OpcionApuesta por mercado); justificado en `docs/ACTUAL/pruebas/DATOS_DEMOSTRACION.md` §3.

## Pendientes

- Validaciones del profesor: motor SQL Server, stack React, backend, entregables, rúbrica y fechas.
- Dudas de clase abiertas: contenido real de `Servicios` y `Reglas`; `Apuestas` (oferta) vs `HacerApuesta` (apuesta del cliente); `Resultado`.
- Invitación pendiente de aceptación de `shantal-hue` como colaboradora del repositorio.
- Recorrido clicable en navegador, responsive real y pruebas de concurrencia (no realizados; ver `docs/ACTUAL/pruebas/RESULTADOS.md` §7).

## Próximo paso recomendado

Para la Fase 13: revisar `database/consultas/COBERTURA.md` (mapa requisito → sentencia) y `docs/ACTUAL/pruebas/RECUPERACION_FASE13.md` (cadena de recuperación y credencial de la aplicación). En paralelo, sigue vigente lo anterior: el sistema está cerrado y la base incluye datos de demostración, así que antes de la entrega conviene **revisar** `docs/ACTUAL/entregables/CHECKLIST_ENTREGA.md`, ensayar la sustentación con `RESUMEN_SUSTENTACION.md` y usar `docs/ACTUAL/pruebas/DATOS_DEMOSTRACION.md` §5 como guion de la demo. Para la demo en vivo, levantar SQL Server + backend + frontend (los tres servicios quedaron verificados).

## Acciones que requieren autorización

- Commit y push (cada uno se autoriza explícitamente).
- Cualquier cambio de código, base de datos, alcance o contrato de la API.
- Reabrir una fase o incorporar archivos externos al workspace.
- Publicar el repositorio o compartir credenciales.
