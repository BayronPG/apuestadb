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
- **Repositorio:** GitHub privado `BayronPG/apuestadb` (rama `main`).

## Documentos del proyecto

| Documento | Contenido |
|---|---|
| `docs/entregables/planteamiento_fase1.md` | Planteamiento (Fase 1): nombre, problema, justificación, objetivos, alcance, limitaciones |
| `PROJECT_CONTEXT.md` | Contexto confirmado, provisional y pendiente |
| `DECISION_LOG.md` | Registro de decisiones aprobadas |
| `SESSION_HANDOFF.md` | Estado de continuidad entre sesiones |
| `AGENT_INSTRUCTIONS.md` | Instrucciones vigentes del asistente ApuestaDB |

## Estructura del workspace

```
ApuestaDB/
├── README.md               ← este archivo
├── PROJECT_CONTEXT.md      ← contexto confirmado/provisional/pendiente
├── DECISION_LOG.md         ← decisiones aprobadas
├── SESSION_HANDOFF.md      ← continuidad entre sesiones
├── sandbox/               ← código del sandbox (conservado como referencia)
├── docs/
│   ├── profesor/           ← guías, rúbricas, notas y materiales del profesor
│   ├── requisitos/         ← requisitos funcionales y no funcionales (Fase 2)
│   ├── base_datos/         ← scripts SQL de clase (borrador) y respaldos
│   ├── mockups/            ← maquetas HTML y capturas
│   ├── pruebas/            ← planes y evidencias de pruebas
│   └── entregables/        ← documentos de cada fase (planteamiento, etc.)
└── .vscode/, .editorconfig  ← configuración de editor
```

## Notas de control

- Este proyecto es independiente de `C:\Proyectos\MiControlDiDi`; no comparten archivos.
- No se hacen `commit` ni `push` sin autorización explícita de Jhon.
- No se avanza de fase sin autorización explícita de Jhon.
