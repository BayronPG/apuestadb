# SESSION_HANDOFF.md — ApuestaDB

**Última actualización:** 02/sep/2026 — cierre de sesión del 02/sep (documentación)

## Fase actual

**Fase 0 — Contexto académico** (a la espera de instrucciones y validaciones del profesor). En paralelo existe un **sandbox técnico autorizado** por Jhon (02/sep/2026) para practicar la integración frontend + backend + base de datos.

## Información confirmada

- Asignatura: Bases de Datos 2 (Tecnológico de Antioquia).
- Proyecto: sitio web académico de apuestas deportivas simuladas (sin dinero real, saldo y transacciones ficticios).
- Integrantes del equipo (2): Jhon Bayron Peláez Guerra y Shantal Coneo García (15/ago/2026).
- Workspace independiente: `C:\Proyectos\ApuestaDB`.
- Repositorio GitHub privado `BayronPG/apuestadb` (rama `main`; último push: `8620020`).
- Frontend: React (Vite) — decisión de Jhon (15/ago/2026), pendiente de validación del profesor.
- Motor de base de datos: SQL Server (decisión de Jhon 24/ago/2026), pendiente de validación del profesor.
- Saldo por tipos tokens/PSE con reglas R1-R5 (indicación del profesor, aplicada por Jhon).
- Sandbox técnico autorizado (02/sep/2026):
  - Backend Node.js + Express en `app/backend` (login/registro reales con hash bcrypt, sesión por cookie httpOnly, roles desde la BD, bitácora en `Login`).
  - Base de datos local `ApuestaDB` en la instancia `SQLEXPRESS01` con **modelo actual de 29 tablas** (16 del análisis de clase + 13 de la ampliación incorporada al proyecto; script idempotente `app/backend/scripts/script_ampliacion_sandbox_29_tablas.sql`). Cada tabla conserva al menos 5 registros ficticios de demostración.
  - La funcionalidad de exportación a Excel se implementó como práctica y **fue retirada por decisión de Jhon** (02/sep/2026): no existe conexión Excel↔BD.
  - Batería automatizada de pruebas: **15/15 PASS**; build y lint del frontend OK.
  - Revisión manual de aceptación del frontend (registro, login, sesión, rutas, roles, interfaz) validada por Jhon (02/sep/2026).

## Último punto validado

- Publicado en `main` el commit `8620020` (modelo de BD ampliado a 29 tablas con datos).
- Documentación del proyecto corregida y actualizada al estado actual (02/sep/2026).

## Elementos provisionales / propuestas

- Alcance inicial provisional (fútbol, apuestas simples, mercado resultado del partido) — sujeto a confirmación del profesor.
- Las 13 tablas adicionales forman parte del modelo actual del sandbox; la validación final del modelo completo (29 tablas) corresponde al profesor.

## Pendientes

- Instrucciones, aprobación del tema y validaciones del profesor (motor SQL Server, stack React + Node/Express, modelo de 29 tablas).
- Entregables, rúbrica, fechas de entrega y requisitos funcionales/no funcionales.
- Dudas de clase abiertas: contenido real de `Servicios` y `Reglas`; confirmar `Apuestas` como oferta vs `HacerApuesta` como apuesta del cliente; `Resultado`.
- Invitación pendiente de aceptación: compañera `shantal-hue` como colaboradora del repositorio.
- Decidir si los archivos del workspace general (`Taller_modelo_normalizacion.docx`, `base_datos_no_normalizada_F1.xlsx`) pertenecen al curso (requiere autorización de Jhon).

## Archivos relevantes (02/sep/2026)

- `README.md` (guía de inicio), `PROJECT_CONTEXT.md`, `DECISION_LOG.md` (decisiones 1-14).
- `app/backend/README.md`, `app/backend/scripts/script_ampliacion_sandbox_29_tablas.sql`, `app/backend/scripts/pruebas_api.mjs`.
- `docs/pruebas/resumen_pruebas_sandbox.md` (evidencia de pruebas vigente).

## Pruebas realizadas

- Batería automatizada 15/15 PASS (registro, hash bcrypt, duplicados, login correcto/incorrecto/inexistente, bitácora `Login`, sesión, logout, rol admin).
- Script de ampliación a 29 tablas ejecutado varias veces sin duplicar datos; `DBCC CHECKCONSTRAINTS` sin violaciones; 29 tablas con mínimo 5 filas.
- Build (`npm run build`) y lint (0 errores) del frontend.
- Smoke test end-to-end por proxy de Vite (login, `/home`, logout).

## Pruebas pendientes

- Ninguna conocida para el sandbox actual.

## Problemas conocidos

- Las sesiones viven en memoria (MemoryStore): al reiniciar el backend se pierden (suficiente para sandbox).
- Los usuarios sembrados por SQL usan hash ficticio (`HASH_FICTICIO_...`) y no pueden iniciar sesión hasta tener un hash bcrypt real (la batería lo hace para el admin).

## Riesgos

- Presentar el sandbox (29 tablas, stack) como modelo definitivo aprobado por el profesor → mitigado: siempre se distingue lo trabajado en clase de lo incorporado por el equipo.
- Mezclar contextos con MiControlDiDi → mitigado: workspace independiente.
- Exponer secretos (`.env`, credenciales locales) → mitigado: `.env` sin versionar y fuera de commits.

## Próximo paso recomendado

Preparar la presentación al profesor del avance (modelo 29 tablas + sandbox login/registro) y recoger sus validaciones, o continuar con la siguiente tarea que indique Jhon.

## Acciones que requieren autorización

- Avanzar a la Fase 1.
- Commit y push (cada uno se autoriza explícitamente).
- Incorporar archivos externos al workspace.
- Cambiar alcance, modelo de datos o tecnologías del proyecto académico.
- Actualizar este handoff en un cierre de sesión posterior.
