# RECONFIGURACIÓN DE OPENCLAW — Separación de la infraestructura del agente

**Fecha:** 14/sep/2026 (20:18–20:24) · **Autorización:** Jhon Bayron Peláez Guerra · **Estado:** separación aplicada y verificada; prueba de `repoRoot` ejecutada, medida y **revertida**.

---

## 1. Configuración final del agente `apuestadb`

| Campo | Valor | Estado |
|---|---|---|
| `agents.entries.apuestadb.workspace` | `C:\Users\BAYRON\.openclaw\workspace-apuestadb` | ✅ aplicado (recarga en caliente) |
| `agents.entries.apuestadb.cwd` | `C:\Proyectos\ApuestaDB` | ✅ aplicado tras reiniciar el gateway |
| `agents.entries.apuestadb.repoRoot` | no existe en el esquema | ⛔ no configurable por agente |
| `agents.defaults.repoRoot` | `C:\Proyectos\MiControlDiDi` (global, 6 agentes) | ↩️ restaurado tras la prueba (§3) |
| `agents.entries.apuestadb.model` | `deepseek/deepseek-v4-flash` (+ `deepseek/deepseek-v4-pro`) | sin cambios |
| `agents.entries.apuestadb.contextInjection` | `always` | sin cambios |
| `agents.entries.apuestadb.identity` | ApuestaDB ⚽ | sin cambios |

**Efecto:** el bootstrap y la memoria se leen del workspace propio del agente; las herramientas trabajan por defecto en `C:\Proyectos\ApuestaDB`; los entregables académicos no comparten carpeta con los archivos internos del agente.

---

## 2. Verificaciones realizadas

| Verificación | Evidencia | Resultado |
|---|---|---|
| El agente carga memoria | `memory_get` leyó `memory/2026-09-14.md` desde el nuevo workspace (27 archivos, incluidos `dreaming/` y `.dreams/`) | ✅ |
| El agente carga identidad | `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, `DREAMS.md` presentes en `…\workspace-apuestadb` | ✅ |
| El proyecto abre correctamente | `backend/server.js`, `frontend/src/main.jsx`, `database/06_demo_data.sql` presentes; raíz con `docs/`, `database/`, `backend/`, `frontend/`, `sandbox/` y documentos raíz | ✅ |
| Sin referencias cruzadas incorrectas | raíz del proyecto: solo referencias legítimas; workspace del agente: 35 marcadores corregidos (§4) | ✅ |
| Otros agentes | ninguno afectado: configuración global restaurada a su valor original (§3) | ✅ |
| Línea Runtime de ApuestaDB tras la reversión | sondeo real: `repo=C:\Proyectos\MiControlDiDi` (idéntica al estado previo a la prueba) | ✅ |

---

## 3. Prueba de `agents.defaults.repoRoot` (opción A) — ejecutada y REVERTIDA

**Hipótesis a validar:** quitar el valor global haría que cada agente detectara su propio repositorio desde `workspace`/`cwd`.

**Riesgo detectado antes de aplicar:** `C:\Users\BAYRON` **es un repositorio Git local** (rama `main`, sin remoto). Riesgo estimado: `main`, `tdea`, `pruebas-software` y el propio workspace de ApuestaDB caerían en esa ruta. Reportado antes de tocar la configuración (instrucción de Jhon).

**Ejecución (20:22):**
1. Respaldo previo: `C:\Users\BAYRON\.openclaw\openclaw.json.bak-20260914-2020` (14 204 bytes). `diff` posterior: la única diferencia era esa clave.
2. `null` fue rechazado por el esquema (`agents.defaults.repoRoot: Invalid input: expected string, received null`) → la clave quedó como cadena vacía `""`.
3. **Sondeo real** (subagente de ApuestaDB, contexto limpio, prompt reconstruido):

   `Runtime: name=ApuestaDB | agent=apuestadb | host=PC-BAYRON | repo=C:\Users\BAYRON | os=Windows_NT 10.0.26200 (x64) | ...`

**Resultado: la auto-detección devuelve `C:\Users\BAYRON`, ruta incorrecta.** La detección sube desde el **workspace** del agente (bajo `C:\Users\BAYRON\.openclaw`) y **no usa el `cwd`** del proyecto.

**Reversión automática aplicada:**
- Restauración del respaldo: hash `99BE875F…7163` idéntico al respaldo; `agents.defaults.repoRoot` = `C:\Proyectos\MiControlDiDi` (verificado también en la configuración efectiva del gateway).
- Copia del estado de prueba conservada: `C:\Users\BAYRON\.openclaw\openclaw.json.pruebaA-20260914-2022`.
- **Motivo del uso del archivo:** la herramienta del sistema quedó sin inferencia (`prepared model runtime plugin generation was superseded for …\agents\apuestadb\agent`) y no aceptaba cambios de configuración; la restauración por archivo es exacta y verificable por hash.
- **Confirmación posterior:** nuevo sondeo de ApuestaDB → `repo=C:\Proyectos\MiControlDiDi`.

**Efecto en los demás agentes:** ninguno. `main`, `tdea`, `pruebas-software`, `construccion-software-2` y MiControlDiDi conservan la clave global original; MiControlDiDi no cambiaría en ningún caso porque su workspace **es** `C:\Proyectos\MiControlDiDi`.

---

## 4. Marcadores de proyecto en memoria (corregidos)

35 marcadores `<!-- project: github.com/BayronPG/MiControlDiDi -->` en `memory/2026-09-14.md` → reemplazados por `github.com/BayronPG/ApuestaDB`. Verificación: 0 marcadores con el proyecto ajeno; 38 con el correcto (3 ya eran correctos). Causa raíz: el marcador se deriva del repositorio detectado en Runtime.

---

## 5. Reparto final de archivos

| Ubicación | Contenido |
|---|---|
| `C:\Users\BAYRON\.openclaw\workspace-apuestadb` (workspace del agente) | `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, `DREAMS.md`, `memory/`, `media/`, sidecar legado `openclaw-workspace-state.json.migrated.*` |
| `C:\Proyectos\ApuestaDB` (cwd del proyecto) | `.git`, `.tmp/` (local, ignorado por Git), `.vscode/`, `backend/`, `database/`, `docs/`, `frontend/`, `sandbox/`, `.editorconfig`, `.gitignore`, `DECISION_LOG.md`, `package.json`, `PROJECT_CONTEXT.md`, `README.md`, `SESSION_HANDOFF.md` |

`sandbox/` permanece en el proyecto: es código del proyecto (referenciado por `package.json`, `.vscode/tasks.json` y la documentación), no infraestructura del agente.

---

## 6. Decisión definitiva (aprobada por Jhon, 14/sep/2026 20:28)

**Se mantiene la configuración actual; no se realizarán más cambios de configuración de OpenClaw.** Fase de reconfiguración cerrada.

| Elemento | Estado final definitivo |
|---|---|
| `agents.defaults.repoRoot` | `C:\Proyectos\MiControlDiDi` (global, sin cambios) |
| `agents.entries.apuestadb.workspace` | `C:\Users\BAYRON\.openclaw\workspace-apuestadb` |
| `agents.entries.apuestadb.cwd` | `C:\Proyectos\ApuestaDB` |
| Bootstrap, `memory/` y `media/` | en `C:\Users\BAYRON\.openclaw\workspace-apuestadb` |
| Respaldo | `openclaw.json.bak-20260914-2020` conservado |

**Justificación:** la prueba real (§3) demostró que eliminar `repoRoot` produce una detección incorrecta (`C:\Users\BAYRON`); el beneficio es menor que el riesgo. **No se volverá a proponer** este cambio salvo que OpenClaw incorpore soporte de `repoRoot` por agente.
2. **Limitación conocida y aceptada:** no existe `repoRoot` por agente, así que la línea Runtime de ApuestaDB seguirá nombrando el proyecto de la clave global. Causa inmediata de que la auto-detección devuelva `C:\Users\BAYRON`: esa carpeta de usuario es un repositorio Git. No afecta al funcionamiento ni a los artefactos del proyecto.

---

## 7. Pendientes

- Ninguno de configuración: **fase cerrada**.
- Commit y push: **no autorizados**.
- Los nuevos marcadores de memoria seguirán generándose con el proyecto detectado (MiControlDiDi): comportamiento conocido y aceptado.
