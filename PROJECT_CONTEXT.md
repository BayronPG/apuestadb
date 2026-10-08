# PROJECT_CONTEXT.md — ApuestaDB

**Última actualización:** 14/sep/2026

## Información confirmada

- **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia).
- **Proyecto:** sitio web académico de apuestas deportivas simuladas.
- **Dinero real:** no se utilizará. Todo saldo y transacción es ficticio.
- **Fase actual:** **Fase 11 — Frontend React** (frontend construido y enganchado a la API; pendiente de revisión de Jhon y de ejecutar las pruebas integrales).
- **Workspace:** `C:\Proyectos\ApuestaDB` (independiente de MiControlDiDi).
- **Integrantes del equipo (2):** Jhon Bayron Peláez Guerra y Shantal Coneo García (15/ago/2026).
- **Motor de base de datos: SQL Server** (decisión de Jhon, 24/ago/2026; pendiente de validación del profesor).
- **Frontend: React** (decisión de Jhon, 15/ago/2026; pendiente de validación del profesor).
- **Backend: Node.js + Express** y **administración con SSMS** (stack confirmado por Jhon, 14/sep/2026).
- **Fase 1 — Definición de Requisitos completada** (14/sep/2026): `docs/ACTUAL/requisitos/` (objetivos, alcance, actores, 29 RF, 12 RNF, 21 RN, 12 CU, riesgos, pendientes).
- **Fase 2 — Modelo conceptual del negocio generado** (14/sep/2026): `docs/ACTUAL/modelo_conceptual/` (29 entidades, 34 relaciones, diccionario y E-R conceptual); pendiente de revisión de Jhon.
- **Fase 3 — Modelo lógico relacional generado** (14/sep/2026): `docs/ACTUAL/modelo_logico/` (29 tablas, relaciones 1:1/1:N/N:M resueltas, 12 decisiones de diseño); pendiente de revisión de Jhon.
- **Fase 4 — Auditoría de normalización realizada** (14/sep/2026): `docs/ACTUAL/normalizacion/` (1FN 29/29, 2FN 28/29, 3FN 27/29; 2 correcciones C-1/C-2 y 5 redundancias controladas); pendiente de revisión de Jhon.
- **Fase 4.1 — Correcciones aplicadas** (14/sep/2026): eliminados `MovimientoSaldo.clase_movimiento` y `Resultado.opcion_ganadora`; verificación final 1FN/2FN/3FN en 29/29 (`docs/ACTUAL/normalizacion/CORRECCIONES_4_1.md`); 5 redundancias controladas documentadas. Pendiente de revisión de Jhon.
- **Fase 5 — Diccionario de datos generado** (14/sep/2026): `docs/ACTUAL/diccionario_datos/` (DICCIONARIO_DATOS, TABLAS_DETALLADAS, ATRIBUTOS, REGLAS_VALIDACION); 29 tablas documentadas. Pendiente de revisión de Jhon.
- **Fase 6 — Modelo físico diseñado** (14/sep/2026): `docs/ACTUAL/sql_server/` (MODELO_FISICO, TIPOS_DATOS, CLAVES_Y_RESTRICCIONES, INDICES, ESTRATEGIA_INTEGRIDAD). Pendiente de revisión de Jhon.
- **Fase 6.1 — Script DDL generado** (14/sep/2026): `database/` (01_database, 02_tables, 03_constraints, 04_indexes, 05_seed_data); 29 tablas, 29 PK, 38 FK, 81 índices. Pendiente de revisión y ejecución.
- **Fase 7 — Procedimientos almacenados generados** (14/sep/2026): `database/procedures/` (01_auth…06_auditoria) y `docs/ACTUAL/procedimientos/PROCEDIMIENTOS.md`; 14 procedimientos con TRY/CATCH y transacciones.
- **Fase 8 — Views y Functions generadas** (14/sep/2026): `database/views/` (12 vistas), `database/functions/` (6 funciones) y `docs/ACTUAL/views_functions/VIEWS_FUNCTIONS.md`.
- **Fase 9 — Triggers generados** (14/sep/2026): `database/triggers/` (13 triggers) y `docs/ACTUAL/triggers/TRIGGERS.md`.
- **Fase 10 — Backend Node.js + Express construido** (14/sep/2026): `backend/` (23 endpoints, 52 archivos JS, integración de procedimientos y vistas) y `docs/ACTUAL/backend/` (ARQUITECTURA, ENDPOINTS, CONFIGURACION); sin `npm install` ni ejecución.
- **Fase 10.1 — Ajustes de integración** (14/sep/2026): nuevo `GET /api/eventos/:id/opciones` y `GET /api/saldo` con `idTipoSaldo`/`nombreTipoSaldo` (**24 endpoints**); `docs/ACTUAL/backend/INTEGRACION_FRONTEND.md`.
- **Fase 11 / 11.1 — Frontend React** (14/sep/2026): `frontend/` (16 páginas, 15 componentes, JWT + Context API + Axios, responsive) y `docs/ACTUAL/frontend/` (5 documentos); Crear Apuesta y recargas enganchados a la API real (sin datos simulados).
- **Repositorio GitHub privado:** `https://github.com/BayronPG/apuestadb` (rama `main`).
- **Saldo por tipos tokens/PSE** con reglas R1–R5 (indicación del profesor, aplicada por Jhon, 24/ago/2026).
- **Tablas del análisis de clase** (24/ago/2026): listado trabajado con el profesor (16 tablas base; borrador en `docs/HISTORICO/base_datos/script_tablas_sqlserver_borrador.sql`).

## Sandbox (conservado como referencia)

El **sandbox técnico** se **conserva en Git** dentro de la carpeta `sandbox/` (backend, frontend y scripts), renombrado desde `app/` (decisión de Jhon, 14/sep/2026).

- La **base de datos local `ApuestaDB` y el login SQL `apuestadb_app` fueron eliminados**; hay respaldo en `docs/base_datos/backups/` (dos `.bak`).
- El historial de Git conserva los commits del sandbox (`c0e5736`, `a6f03cc`, `5ba3015`, etc.).

## Información provisional

(Punto de partida; sujeto a confirmación del profesor.)

- Deporte inicial: fútbol.
- Tipo de apuestas: simples.
- Mercado inicial: resultado del partido.
- Opciones del mercado: local, empate o visitante.
- Saldo ficticio.
- **Maquetas** (12/ago/2026) en `docs/HISTORICO/mockups/` (inicio, registrar, recuperar, home): propuesta visual del agente, pendiente de validación de Jhon y del profesor.

## Información pendiente

- Instrucciones del profesor.
- Aprobación del tema.
- Validación del profesor: motor SQL Server, frontend React y stack del backend.
- Entregables, rúbrica y fechas de entrega.
- Requisitos funcionales y no funcionales.
- Dudas de clase abiertas: contenido real de `Servicios` y `Reglas`; confirmar `Apuestas` (oferta) vs `HacerApuesta` (apuesta del cliente) y `Resultado`.

## Metodología — MODO EFICIENCIA MÁXIMA (14/sep/2026)

Política permanente de respuesta autorizada por Jhon (v1.2 de `AGENT_INSTRUCTIONS.md`):

- Prioridad **trabajo > explicación**; no repetir contexto, requisitos, tablas, entidades, documentación ni decisiones ya aprobadas.
- No volver a mostrar listas, diagramas, scripts, código ni archivos completos salvo petición explícita.
- El detalle se registra en los archivos del proyecto, no en la conversación; sin teoría, introducciones ni conclusiones largas.
- Límites: normal 10 líneas; con errores 20; auditorías 30.
- Cierre de tarea: `✅ Hecho` / `📁 Archivos creados/modificados` / `⚠️ Problemas encontrados` / `🔧 Correcciones realizadas` / `➡️ Próximo paso recomendado`; fin de fase: `✅ Fase completada` / `📁 Archivos modificados` / `➡️ Próxima fase`.

## Regla de actualización

Este documento solo incorpora información como **confirmada** cuando proviene del profesor o de una decisión explícitamente aprobada por Jhon. Todo lo demás permanece como provisional o pendiente.
