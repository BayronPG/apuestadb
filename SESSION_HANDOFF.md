# SESSION_HANDOFF.md — ApuestaDB

**Última actualización:** 14/sep/2026 — inicio de la Fase 1 (proyecto oficial)

## Fase actual

**Fase 1 — Planteamiento.** El sandbox técnico se conserva como referencia en `sandbox/` (renombrado desde `app/`); la base local fue eliminada (decisión de Jhon, 14/sep/2026).

## Información confirmada

- Asignatura: Bases de Datos 2 (Tecnológico de Antioquia).
- Proyecto: sitio web académico de apuestas deportivas simuladas (sin dinero real, saldo y transacciones ficticios).
- Integrantes del equipo (2): Jhon Bayron Peláez Guerra y Shantal Coneo García (15/ago/2026).
- Workspace independiente: `C:\Proyectos\ApuestaDB`.
- Repositorio GitHub privado `BayronPG/apuestadb` (rama `main`).
- Frontend: React — decisión de Jhon (15/ago/2026), pendiente de validación del profesor.
- Motor de base de datos: SQL Server — decisión de Jhon (24/ago/2026), pendiente de validación del profesor.
- Saldo por tipos tokens/PSE con reglas R1–R5 (indicación del profesor, aplicada por Jhon).
- Tablas del análisis de clase (16 tablas base; borrador en `docs/base_datos/script_tablas_sqlserver_borrador.sql`).

## Último punto validado

- **Sandbox conservado en Git** renombrado a `sandbox/` (14/sep/2026); base de datos local `ApuestaDB` y login SQL `apuestadb_app` borrados.
- Respaldos de la BD conservados en `docs/base_datos/backups/`.
- **Fase 1 — Planteamiento iniciada**: documento en `docs/entregables/planteamiento_fase1.md`.

## Elementos provisionales / propuestas

- Alcance inicial provisional (fútbol, apuestas simples, mercado resultado del partido) — sujeto a confirmación del profesor.
- Maquetas en `docs/mockups/` como propuesta visual.

## Pendientes

- Instrucciones, aprobación del tema y validaciones del profesor (motor SQL Server, stack React, backend).
- Entregables, rúbrica, fechas de entrega y requisitos funcionales/no funcionales.
- Dudas de clase abiertas: contenido real de `Servicios` y `Reglas`; `Apuestas` (oferta) vs `HacerApuesta` (apuesta del cliente); `Resultado`.
- Invitación pendiente de aceptación: compañera `shantal-hue` como colaboradora del repositorio.
- Decidir si los archivos del workspace general (`Taller_modelo_normalizacion.docx`, `base_datos_no_normalizada_F1.xlsx`) pertenecen al curso.

## Próximo paso recomendado

Desarrollar y validar con Jhon el documento de Planteamiento (Fase 1): nombre, descripción, problema, justificación, objetivos, alcance y limitaciones.

## Acciones que requieren autorización

- Commit y push (cada uno se autoriza explícitamente).
- Avanzar a la Fase 2 (Requisitos).
- Incorporar archivos externos al workspace.
- Cambiar alcance, modelo de datos o tecnologías del proyecto.
- Actualizar este handoff en un cierre de sesión posterior.
