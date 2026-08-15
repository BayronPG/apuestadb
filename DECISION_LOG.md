# DECISION_LOG.md — ApuestaDB

Registro de decisiones del proyecto. Cada entrada incluye: fecha, decisión, motivo, alternativas consideradas, fuente de aprobación y elementos afectados.

| # | Fecha | Decisión | Motivo | Alternativas consideradas | Aprobada por | Elementos afectados |
|---|-------|----------|--------|---------------------------|--------------|---------------------|
| 1 | 05/ago/2026 | Crear el workspace independiente `C:\Proyectos\ApuestaDB` con la estructura inicial aprobada (README, AGENT_INSTRUCTIONS, PROJECT_CONTEXT, DECISION_LOG, SESSION_HANDOFF, docs/ con subcarpetas y src/README). | Disponer de un espacio aislado para el proyecto académico, sin mezclarlo con MiControlDiDi, manteniendo el proyecto en Fase 0. | Usar la carpeta del workspace general (`C:\Users\BAYRON\workspace-developer`); usar la misma carpeta de MiControlDiDi. | Jhon Bayron Peláez Guerra (autorización explícita, 05/ago/2026) | Creación del workspace completo; README.md, AGENT_INSTRUCTIONS.md, PROJECT_CONTEXT.md, DECISION_LOG.md, SESSION_HANDOFF.md, docs/ (profesor, requisitos, base_datos, pruebas, entregables), src/README.md |
| 2 | 15/ago/2026 | Usar **React** como tecnología de frontend. Se creó proyecto Vite + React en `src/frontend` (sandbox de aprendizaje, sin conexión a BD). | El equipo acordó que el frontend se hará con React. | Otras opciones (Angular, Vue, HTML/CSS puro) no evaluadas formalmente todavía. | Jhon Bayron Peláez Guerra (15/ago/2026); pendiente validación del profesor | `src/frontend` (Vite + React), PROJECT_CONTEXT, futuro frontend definitivo, maquetas como referencia visual |
| 3 | 15/ago/2026 | Mantener las **tablas del análisis de clase** (empresa, cargo, deporte, usuario, Empleado, log_sesion) como **material de trabajo en Fase 0** (borrador), sin convertirlas en modelo definitivo ni escribir SQL nuevo hasta confirmar motor y alcance con el profesor. | El motor de BD y el alcance real aún no están confirmados; las tablas cubren solo el módulo de acceso/seguridad. | Tratar las tablas como modelo definitivo; descartarlas; esperar nuevas indicaciones. | Jhon Bayron Peláez Guerra (15/ago/2026) | Modelo de datos futuro, scripts SQL, PROJECT_CONTEXT |

## Notas

- **No se registran como aprobadas** el motor de base de datos ni el alcance provisional (fútbol, apuestas simples, mercado resultado del partido, saldo ficticio). Siguen siendo provisionales.
- **React** está aprobado por Jhon (decisión 2) pero **pendiente de validación del profesor**.
- **Maquetas** (12/ago/2026) y **tablas de clase**: propuesta/material, no requisitos confirmados del profesor.
- El agente ApuestaDB **no fue creado formalmente** en el entorno (no existe herramienta nativa para ello); su configuración vive en `AGENT_INSTRUCTIONS.md`.
