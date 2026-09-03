# PROJECT_CONTEXT.md — ApuestaDB

**Última actualización:** 24/ago/2026

## Información confirmada

- **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia).
- **Proyecto:** sitio web académico de apuestas deportivas simuladas.
- **Dinero real:** no se utilizará. Todo saldo y transacción es ficticio.
- **Fase actual:** Fase 0 — Contexto académico.
- **Workspace:** `C:\Proyectos\ApuestaDB` (independiente de MiControlDiDi).
- **Integrantes del equipo (2):** Jhon Bayron Peláez Guerra y Shantal Coneo García (15/ago/2026).
- **Frontend: React** (decisión de Jhon, 15/ago/2026; pendiente de validación del profesor). Proyecto Vite + React creado en `src/frontend` como sandbox de aprendizaje, sin conexión a base de datos.
- **Motor de base de datos: SQL Server** (decisión de Jhon, 24/ago/2026; pendiente de validación del profesor). Los futuros scripts SQL se escribirán en T-SQL.
- **Repositorio GitHub privado:** `https://github.com/BayronPG/apuestadb` (creado 15/ago/2026, rama `main`). Equipo de 2 personas; pendiente invitar a la compañera como colaboradora.
- **Sandbox técnico autorizado (02/sep/2026, decisión de Jhon):** backend **Node.js + Express** en `src/backend` (login/registro contra BD real con hash bcrypt y sesión por cookie httpOnly), base de datos local **`ApuestaDB` creada en `SQLEXPRESS01`** con los scripts borrador de clase y login SQL dedicado `apuestadb_app`. Entorno listo: TCP/IP habilitado (puerto 1433) y modo de autenticación mixto (scripts en `src/backend/scripts/`). **La exportación a Excel fue retirada por decisión de Jhon (02/sep/2026); no existe conexión Excel↔BD.** **Modelo actual de la BD del proyecto: 29 tablas** (16 de clase + 13 de la ampliación incorporada; script `src/backend/scripts/script_ampliacion_sandbox_29_tablas.sql`), cada tabla con ≥5 registros de demostración ficticios. No representa avance de fase académica.

## Información provisional

(Punto de partida; sujeto a confirmación del profesor.)

- Deporte inicial: fútbol.
- Tipo de apuestas: simples.
- Mercado inicial: resultado del partido.
- Opciones del mercado: local, empate o visitante.
- Saldo ficticio.
- **Maquetas** (12/ago/2026) en `docs/mockups/` (inicio, registrar, recuperar, home): propuesta visual del agente, pendientes de validación de Jhon y del profesor.
- **Tablas del análisis de clase** (24/ago/2026): listado trabajado con el profesor (16 tablas base; borrador en `docs/base_datos/script_tablas_sqlserver_borrador.sql`). **Saldo por tipos tokens/PSE** (reglas R1-R5, indicación del profesor). **El modelo actual de la base de datos del proyecto (sandbox) tiene 29 tablas**: las 16 del análisis de clase más 13 adicionales incorporadas al proyecto (02/sep/2026, ampliación en `src/backend/scripts/script_ampliacion_sandbox_29_tablas.sql`), cada una con al menos 5 registros de demostración ficticios. Los scripts originales de clase permanecen intactos.

## Información pendiente

- Instrucciones del profesor.
- Aprobación del tema.
- Validación del profesor sobre el motor SQL Server.
- Backend: sin decidir. Frontend: React (decisión de Jhon, pendiente validación del profesor).
- Integrantes del equipo.
- Entregables.
- Rúbrica.
- Fechas de entrega.
- Requisitos funcionales y no funcionales.

## Regla de actualización

Este documento solo incorpora información como **confirmada** cuando proviene del profesor o de una decisión explícitamente aprobada por Jhon. Todo lo demás permanece como provisional o pendiente.
