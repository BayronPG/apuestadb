# ApuestaDB (nombre provisional)

## Integrantes

- Jhon Bayron Peláez Guerra
- Shantal Coneo García

## Descripción académica

Proyecto académico de la asignatura **Bases de Datos 2** (Tecnológico de Antioquia).

ApuestaDB es un **sitio web académico de apuestas deportivas simuladas**: los usuarios registran apuestas sobre eventos deportivos ficticios, con saldo y transacciones completamente simuladas.

## Aclaraciones importantes

- **No utiliza dinero real.**
- **No incluye pasarelas de pago reales.**
- **No promueve apuestas reales.**
- Trabaja únicamente con saldo y transacciones ficticias.
- Su prioridad académica es demostrar conocimientos de bases de datos (modelado, normalización, SQL, integridad, transacciones, consultas y reportes).

## Estado actual

- **Fase 0: Contexto académico.**
- El proyecto se encuentra en etapa de definición; aún no hay requisitos confirmados del profesor.
- **Pendiente de confirmación:** motor de base de datos, alcance definitivo, entregables y forma de evaluación.
- **Frontend:** React (Vite) aprobado por el equipo (pendiente validación del profesor). Las maquetas HTML se convirtieron a componentes React en `src/frontend` (15/ago/2026).
- **Repositorio:** GitHub privado `BayronPG/apuestadb` (15/ago/2026).

## Estructura del workspace

```
ApuestaDB/
├── README.md               ← este archivo
├── AGENT_INSTRUCTIONS.md   ← instrucciones vigentes del agente ApuestaDB
├── PROJECT_CONTEXT.md      ← contexto confirmado, provisional y pendiente
├── DECISION_LOG.md         ← registro de decisiones aprobadas
├── SESSION_HANDOFF.md      ← estado de continuidad entre sesiones
├── docs/
│   ├── profesor/           ← guías, rúbricas, notas y materiales del profesor
│   ├── requisitos/         ← requisitos funcionales y no funcionales
│   ├── base_datos/         ← modelos, scripts y diccionarios de datos
│   ├── mockups/            ← maquetas HTML originales y capturas
│   ├── pruebas/            ← planes y evidencias de pruebas
│   └── entregables/        ← entregas finales del proyecto
└── src/
    ├── README.md
    └── frontend/           ← proyecto React (Vite): componentes de las maquetas
```

## Cómo ejecutar el frontend

```
cd src/frontend
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador. Rutas disponibles: `/` (inicio de sesión), `/registrar`, `/recuperar` y `/home`.

## Notas de control

- La base de datos **aún no ha comenzado**; no se ha seleccionado motor.
- El frontend React es un **sandbox de aprendizaje** (sin conexión a BD): reproduce las maquetas aprobadas como propuesta.
- Este proyecto es independiente de `C:\Proyectos\MiControlDiDi`; no comparten archivos.
