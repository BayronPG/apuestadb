# VALIDACIÓN PREVIA — Separación de la infraestructura del agente

**Fecha:** 14/sep/2026 · **Fase:** auditoría (sin mover archivos ni modificar configuración)
**Objetivo:** comprobar si separar la infraestructura del agente rompe el funcionamiento de ApuestaDB.

---

## 1. Alcance auditado

Raíz `C:\Proyectos\ApuestaDB` (28 entradas). Revisados: `backend/`, `frontend/`, `sandbox/`, `database/`, `docs/`, `memory/`, `media/`, `.tmp/`, `.vscode/`, `package.json` raíz, `backend/package.json`, `backend/.env` (solo nombres de claves), `backend/.env.example`, `frontend/package.json`, `frontend/vite.config.js`, y la configuración OpenClaw del agente (`agents.entries.apuestadb`).

Candidatos a mover: `AGENTS.md`, `IDENTITY.md`, `MEMORY.md`, `USER.md`, `SOUL.md`, `DREAMS.md`, `HEARTBEAT.md`, `memory/`, `media/`, `sandbox/`, `.tmp/`, `openclaw-workspace-state.json.migrated.*`.

---

## 2. Qué puede moverse (riesgo bajo)

| Elemento | Dependencias encontradas | Acción al mover |
|---|---|---|
| `.tmp/` | Solo documentales: `docs/ACTUAL/pruebas/CORRECCIONES.md` (§92), `RESULTADOS.md` (§42, §90), `docs/ACTUAL/entregables/CHECKLIST_ENTREGA.md` (§58); ignorado en `.gitignore` | Actualizar esas 4 referencias; sin impacto técnico |
| `openclaw-workspace-state.json.migrated.*` | Ninguna (el runtime usa SQLite; OpenClaw lo trata como sidecar legado) | Mover a archivo muerto; no se usa |
| `HEARTBEAT.md` | `.vscode/settings.json` (`files.exclude`); según docs de OpenClaw es aceptado pero **no-op** (el heartbeat ya no lo lee) | Sin impacto funcional |

---

## 3. Qué debe permanecer en la raíz

| Elemento | Por qué | Si se mueve sin reconfigurar |
|---|---|---|
| `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `MEMORY.md` | **Bootstrap del workspace**: OpenClaw los inyecta al prompt en cada sesión desde la raíz del workspace. La carpeta `~\.openclaw\agents\apuestadb\agent` **no** los contiene y el agente no tiene `agentDir` propio | OpenClaw inyecta marcador de "archivo faltante": el agente pierde instrucciones, persona, preferencias y memoria curada |
| `memory/` | Herramientas `memory_search` / `memory_get`, notas diarias, y plugins `dreaming`/`active-memory` escriben en `memory/**, memory/.dreams/session-corpus/` (evidencia: `memory/dreaming/light|rem|deep/`, `memory/.dreams/`) | Se rompe la recuperación de memoria y el ciclo de "dreaming" (59 archivos afectados) |
| `media/` | Almacén de medios entrantes (`media/inbound`, excluido en `.vscode/settings.json`); lo usa el flujo de documentos entrantes | Se pierde la lectura de documentos entrantes del chat |
| `sandbox/` | **Código del proyecto, no infraestructura del agente**: lo referencian `package.json` raíz (6 scripts `npm --prefix sandbox/...`), `.vscode/tasks.json` (3 tareas), `README.md`, `PROJECT_CONTEXT.md`, `DECISION_LOG.md` (§16, §15), `docs/ACTUAL/entregables/CHECKLIST_ENTREGA.md` (§13) y rutas absolutas internas (`C:\Proyectos\ApuestaDB\sandbox\...` en `sincronizar_clave_login.ps1`, `backup.sql`, `README.md`) | Se rompen los scripts raíz, las tareas de VS Code, la documentación y sus propios guiones |
| `DREAMS.md` | Lo escribe el plugin de dreaming en el nivel raíz (evidencia: `DREAMS.md` §106 "Promoted 0 candidate(s) into MEMORY.md") | El plugin lo recrearía en la raíz: separación aparente, no real |

---

## 4. Componentes independientes (verificados sin dependencia)

- **Backend**: `server.js` + `express`, `.env` (24 claves, sin rutas a la infraestructura), `dotenv`. Sin referencias a archivos del agente.
- **SQL Server**: `DB_SERVER`/`DB_PORT`/`DB_NAME`/`DB_AUTH_MODE` (`localhost` + `1433`, base `ApuestaDB`, login `apuestadb_app`). Independiente.
- **Frontend**: `vite.config.js` (puerto 5173, proxy `/api` → `http://localhost:4000`), imports React (`react-router-dom`, `axios`). Sin referencias a la infraestructura.
- **`package.json` backend/frontend, `.env.example`**: rutas relativas propias; sin impacto.
- **Única dependencia raíz real hacia `sandbox/`**: `package.json` raíz y `.vscode/tasks.json`.

---

## 5. Reconfiguración necesaria para separar de verdad

1. `agents.entries.apuestadb.workspace` → nueva carpeta propia del agente (p. ej. `C:\Users\BAYRON\.openclaw\workspace-apuestadb`), con `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `MEMORY.md`, `memory/`, `media/`.
2. `agents.entries.apuestadb.cwd` → `C:\Proyectos\ApuestaDB` (así las herramientas trabajan en el proyecto mientras el bootstrap y la memoria viven en el workspace gestionado).
3. `agents.entries.apuestadb.repoRoot` → `C:\Proyectos\ApuestaDB` para corregir el alcance mostrado en Runtime.
4. Reinicio del Gateway y verificación posterior (bootstrap cargado + `memory_search` operativo).

**Hallazgo adicional:** `agents.defaults.repoRoot` = `C:\Proyectos\MiControlDiDi`, por eso el agente reporta su alcance bajo el proyecto MiControlDiDi en lugar de `BayronPG/apuestadb`.

---

## 6. Recomendación final

- **Paso mínimo seguro hoy:** mover solo `.tmp/`, el sidecar `openclaw-workspace-state.json.migrated.*` y `HEARTBEAT.md`, actualizando las 4 referencias documentales.
- **Separación completa:** adoptar la configuración del punto 5 (workspace propio + `cwd` + `repoRoot`); requiere autorización explícita y reinicio del Gateway.
- **No mover:** `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `MEMORY.md`, `memory/`, `media/` (bootstrap/memoria) ni `sandbox/` (código del proyecto).

---

## 7. Ejecución autorizada (14/sep/2026, 20:15)

Jhon autorizó corregir `workspace`, `cwd` y `repoRoot`. Ejecutado:

| Paso | Resultado |
|---|---|
| Copia a `C:\Users\BAYRON\.openclaw\workspace-apuestadb` | Verificada: hashes SHA-256 idénticos en los 8 `.md`; `memory/` 27→27 archivos; `media/` 2→2 archivos |
| Retiro de originales de `C:\Proyectos\ApuestaDB` | Hecho; la raíz queda con `.git`, `.tmp/`, `.vscode/`, `backend/`, `database/`, `docs/`, `frontend/`, `sandbox/`, `.editorconfig`, `.gitignore`, `DECISION_LOG.md`, `package.json`, `PROJECT_CONTEXT.md`, `README.md`, `SESSION_HANDOFF.md` |
| `AGENTS.md` (nuevo workspace) | Actualizado con la nueva ubicación de archivos y la separación infraestructura/proyecto |
| Config OpenClaw | Aplicado el 14/sep/2026 20:18 tras reiniciar el gateway: `agents.entries.apuestadb.workspace` = `C:\Users\BAYRON\.openclaw\workspace-apuestadb` y `cwd` = `C:\Proyectos\ApuestaDB`. Detalle en `docs/ACTUAL/pruebas/RECONFIGURACION_OPENCLAW.md` |

**No se movió** `sandbox/` (código del proyecto) ni `.tmp/` (se conserva en la raíz, ya ignorado por Git).
