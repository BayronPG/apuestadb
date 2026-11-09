# Estructura del proyecto — ApuestaDB

## Mapa de la raíz

```text
ApuestaDB/
├── backend/                 API Node.js + Express (activo)
├── frontend/                React + Vite (activo)
├── database/                Scripts y objetos SQL Server (activo)
├── docs/
│   ├── ACTUAL/              Documentación vigente
│   └── HISTORICO/           Documentación antigua conservada
├── sandbox/                 Prototipo histórico (legado)
├── .vscode/                 Configuración de VS Code
├── .editorconfig            Reglas de formato
├── .git/                    Metadatos de Git
├── .gitignore               Reglas de exclusión de Git
├── .env.docker              Variables locales de Docker (no versionar)
├── .env.docker.example      Plantilla de variables de Docker
├── .tmp/                    Archivos temporales ignorados
├── docker-compose.yml       Entorno local de cuatro motores
├── package.json             Scripts raíz heredados
├── README.md                Puerta de entrada del repositorio
├── PROJECT_CONTEXT.md       Contexto técnico actual
├── SESSION_HANDOFF.md       Punto de continuidad
└── DECISION_LOG.md          Registro de decisiones técnicas
```

## Clasificación y reglas

- **Activos:** `backend/`, `frontend/`, `database/`, `docs/ACTUAL/` y
  `docker-compose.yml`.
- **Gestión:** `PROJECT_CONTEXT.md`, `SESSION_HANDOFF.md` y `DECISION_LOG.md`.
- **Documentación:** `README.md` y `docs/`.
- **Legados:** `sandbox/` y los seis scripts de `package.json` raíz, porque
  todavía apuntan a `sandbox/backend/` o `sandbox/frontend/`. No se modifican
  en esta tarea.
- **Temporales/ignorados:** `.tmp/`, `.env`, `.env.docker`, `node_modules/`,
  `dist/` y archivos `.bak`; no se versionan.
- **Configuración:** `.vscode/`, `.editorconfig`, `.gitignore` y
  `.env.docker.example`.

No mover archivos sin actualizar sus referencias en el mismo commit.

## Inicio de una nueva sesión

1. `README.md`
2. `PROJECT_CONTEXT.md`
3. `SESSION_HANDOFF.md`
4. `DECISION_LOG.md`

## Ramas

- Rama de trabajo actual: `poliglota`.
- Rama estable: `main`.
