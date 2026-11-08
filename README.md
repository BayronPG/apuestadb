# README.md — ApuestaDB

Sitio web académico de **apuestas deportivas simuladas** — Bases de Datos 2 (Tecnológico de Antioquia).

## Integrantes

- Jhon Bayron Peláez Guerra
- Shantal Coneo García

## Descripción académica

Proyecto académico de la asignatura **Bases de Datos 2**: los usuarios registran apuestas sobre eventos deportivos ficticios, con saldo y transacciones completamente simuladas.

### Aclaraciones importantes

- **No utiliza dinero real.**
- **No incluye pasarelas de pago reales.**
- **No promueve apuestas reales.**
- Trabaja únicamente con saldo y transacciones ficticias.
- Su prioridad académica es demostrar conocimientos de bases de datos (modelado, normalización, SQL, integridad, transacciones, consultas y reportes).

## Estado actual

- **Fase 1 — Planteamiento** (proyecto oficial iniciado el 14/sep/2026).
- El **sandbox técnico** se conserva en Git como referencia, en la carpeta `sandbox/` (renombrada desde `app/`). La base de datos local fue eliminada (14/sep/2026).
- Stack definido por el equipo, pendiente de validación del profesor: **SQL Server** (motor) + **React** (frontend).
- **Repositorio:** GitHub privado `BayronPG/apuestadb` (rama de trabajo `poliglota`, rama estable `main`).

## Mapa del repositorio

- `backend/`: API Node.js + Express.
- `frontend/`: React + Vite.
- `database/`: scripts de SQL Server y futuras carpetas por motor.
- `docs/ACTUAL/`: documentación vigente.
- `docs/HISTORICO/`: documentación antigua conservada.
- `sandbox/`: prototipo histórico; no usar para desarrollo actual.
- `docker-compose.yml`: entorno local de cuatro motores.
- `PROJECT_CONTEXT.md`: contexto técnico actual.
- `SESSION_HANDOFF.md`: punto de continuidad.
- `DECISION_LOG.md`: decisiones técnicas.

> **Advertencia:** Para desarrollo actual use `backend/`, `frontend/`, `database/` y
> `docs/ACTUAL/`. No ejecute scripts de `sandbox/` salvo que una guía histórica lo solicite.

## Documentos del proyecto

| Documento | Contenido |
|---|---|
| `docs/ACTUAL/entregables/planteamiento_fase1.md` | Planteamiento (Fase 1): nombre, problema, justificación, objetivos, alcance, limitaciones |
| `PROJECT_CONTEXT.md` | Contexto confirmado, provisional y pendiente |
| `DECISION_LOG.md` | Registro de decisiones aprobadas |
| `SESSION_HANDOFF.md` | Estado de continuidad entre sesiones |
| `AGENT_INSTRUCTIONS.md` | Instrucciones vigentes del asistente ApuestaDB |

## Notas de control

- Este proyecto es independiente de `C:\Proyectos\MiControlDiDi`; no comparten archivos.
- No se hacen `commit` ni `push` sin autorización explícita de Jhon.
- No se avanza de fase sin autorización explícita de Jhon.
