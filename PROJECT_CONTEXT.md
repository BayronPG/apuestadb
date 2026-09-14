# PROJECT_CONTEXT.md — ApuestaDB

**Última actualización:** 14/sep/2026

## Información confirmada

- **Asignatura:** Bases de Datos 2 (Tecnológico de Antioquia).
- **Proyecto:** sitio web académico de apuestas deportivas simuladas.
- **Dinero real:** no se utilizará. Todo saldo y transacción es ficticio.
- **Fase actual:** **Fase 1 — Planteamiento** (iniciada por decisión de Jhon, 14/sep/2026).
- **Workspace:** `C:\Proyectos\ApuestaDB` (independiente de MiControlDiDi).
- **Integrantes del equipo (2):** Jhon Bayron Peláez Guerra y Shantal Coneo García (15/ago/2026).
- **Motor de base de datos: SQL Server** (decisión de Jhon, 24/ago/2026; pendiente de validación del profesor).
- **Frontend: React** (decisión de Jhon, 15/ago/2026; pendiente de validación del profesor).
- **Repositorio GitHub privado:** `https://github.com/BayronPG/apuestadb` (rama `main`).
- **Saldo por tipos tokens/PSE** con reglas R1–R5 (indicación del profesor, aplicada por Jhon, 24/ago/2026).
- **Tablas del análisis de clase** (24/ago/2026): listado trabajado con el profesor (16 tablas base; borrador en `docs/base_datos/script_tablas_sqlserver_borrador.sql`).

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
- **Maquetas** (12/ago/2026) en `docs/mockups/` (inicio, registrar, recuperar, home): propuesta visual del agente, pendiente de validación de Jhon y del profesor.

## Información pendiente

- Instrucciones del profesor.
- Aprobación del tema.
- Validación del profesor: motor SQL Server, frontend React y stack del backend.
- Entregables, rúbrica y fechas de entrega.
- Requisitos funcionales y no funcionales.
- Dudas de clase abiertas: contenido real de `Servicios` y `Reglas`; confirmar `Apuestas` (oferta) vs `HacerApuesta` (apuesta del cliente) y `Resultado`.

## Regla de actualización

Este documento solo incorpora información como **confirmada** cuando proviene del profesor o de una decisión explícitamente aprobada por Jhon. Todo lo demás permanece como provisional o pendiente.
