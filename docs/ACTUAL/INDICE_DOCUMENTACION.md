# ÍNDICE DE DOCUMENTACIÓN OFICIAL — ApuestaDB

**Fecha de auditoría:** 14/sep/2026
**Actualizado:** 07/oct/2026 — commit de la reorganización documental (se añadió `pruebas/RECUPERACION_FASE13.md` y se corrigió el encabezado de `pruebas/datos_prueba.sql`).
**Alcance:** reorganización de `docs/` en `docs/ACTUAL/` (documentación vigente) y `docs/HISTORICO/`
(documentación superada, de prueba o heredada). **No se eliminó ningún archivo** y no se modificó
base de datos, backend, frontend, SQL ni configuración de OpenClaw.

**Criterio de clasificación**

| Carpeta | Criterio |
|---|---|
| `ACTUAL` | Documentación que describe el sistema entregado (Fases 0 a 12.1 del `SESSION_HANDOFF.md`): requisitos, modelos, normalización, diccionario, objetos SQL Server, backend, frontend, pruebas integrales y entregables. |
| `HISTORICO` | Borradores, artefactos obsoletos, material de trabajo y prototipos superados por la versión final. Se conservan como trazabilidad. |

---

## 1. Documentación vigente (`docs/ACTUAL/`)

### 1.1 Entregables y cierre
| Documento | Contenido |
|---|---|
| `entregables/ENTREGA_FINAL.md` | Documento de entrega del proyecto |
| `entregables/RESUMEN_SUSTENTACION.md` | Guion de la sustentación |
| `entregables/CHECKLIST_ENTREGA.md` | Lista de verificación previa a la entrega |
| `entregables/planteamiento_fase1.md` | Planteamiento de la Fase 1 (origen oficial del proyecto) |

### 1.2 Fase 1 — Requisitos
| Documento | Contenido |
|---|---|
| `requisitos/README.md` | Índice del bloque de requisitos |
| `requisitos/requisitos_funcionales.md` | 29 requisitos funcionales |
| `requisitos/requisitos_no_funcionales.md` | 12 requisitos no funcionales |
| `requisitos/reglas_negocio.md` | 21 reglas de negocio |
| `requisitos/casos_uso.md` | 12 casos de uso |
| `requisitos/actores.md` | Actores del sistema |
| `requisitos/riesgos.md` | Riesgos identificados |
| `requisitos/informacion_pendiente.md` | Información y validaciones pendientes |

### 1.3 Fases 2–5 — Modelo de datos
| Documento | Contenido |
|---|---|
| `modelo_conceptual/MODELO_CONCEPTUAL.md` | Modelo conceptual |
| `modelo_conceptual/ENTIDADES.md` | 29 entidades |
| `modelo_conceptual/RELACIONES.md` | 34 relaciones |
| `modelo_conceptual/CARDINALIDADES.md` | Cardinalidades |
| `modelo_conceptual/DICCIONARIO_CONCEPTUAL.md` | Diccionario conceptual |
| `modelo_logico/MODELO_LOGICO.md` | Modelo lógico (29 tablas) |
| `modelo_logico/TABLAS.md` | Detalle de tablas lógicas |
| `modelo_logico/RELACIONES_LOGICAS.md` | Relaciones lógicas |
| `modelo_logico/DECISIONES_DISENO.md` | Decisiones de diseño |
| `normalizacion/NORMALIZACION_1FN.md` | Primera forma normal |
| `normalizacion/NORMALIZACION_2FN.md` | Segunda forma normal |
| `normalizacion/NORMALIZACION_3FN.md` | Tercera forma normal |
| `normalizacion/DEPENDENCIAS_FUNCIONALES.md` | Dependencias funcionales |
| `normalizacion/AUDITORIA_MODELO.md` | Auditoría del modelo |
| `normalizacion/CORRECCIONES_4_1.md` | Correcciones C-1 y C-2 aplicadas |
| `diccionario_datos/DICCIONARIO_DATOS.md` | Diccionario de datos |
| `diccionario_datos/TABLAS_DETALLADAS.md` | Tablas detalladas |
| `diccionario_datos/ATRIBUTOS.md` | Atributos |
| `diccionario_datos/REGLAS_VALIDACION.md` | Reglas de validación |

### 1.4 Fase 6 — Modelo físico SQL Server
| Documento | Contenido |
|---|---|
| `sql_server/MODELO_FISICO.md` | Modelo físico |
| `sql_server/TIPOS_DATOS.md` | Tipos de datos |
| `sql_server/CLAVES_Y_RESTRICCIONES.md` | Claves y restricciones |
| `sql_server/INDICES.md` | Índices |
| `sql_server/ESTRATEGIA_INTEGRIDAD.md` | Estrategia de integridad |
| `base_datos/diagramas_er/apuestadb_er.mmd` | Diagrama E-R vigente (fuente Mermaid) |
| `base_datos/diagramas_er/apuestadb_er.png` / `.svg` / `.html` | Diagrama E-R vigente (render) |
| `base_datos/diagramas_er/apuestadb_er_vista.png` | Vista general del diagrama E-R |
| `base_datos/diagramas_er/columnas.txt` / `fks.txt` | Volcado de columnas y claves foráneas |

### 1.5 Fases 7–9 — Objetos de base de datos
| Documento | Contenido |
|---|---|
| `procedimientos/PROCEDIMIENTOS.md` | 14 procedimientos almacenados |
| `views_functions/VIEWS_FUNCTIONS.md` | 12 vistas y 6 funciones |
| `triggers/TRIGGERS.md` | 13 triggers |

### 1.6 Fase 10 — Backend
| Documento | Contenido |
|---|---|
| `backend/ARQUITECTURA.md` | Arquitectura del backend |
| `backend/ENDPOINTS.md` | 24 endpoints |
| `backend/CONFIGURACION.md` | Configuración y variables de entorno |
| `backend/INTEGRACION_FRONTEND.md` | Contrato de integración con el frontend |

### 1.7 Fase 11 — Frontend
| Documento | Contenido |
|---|---|
| `frontend/ARQUITECTURA_FRONTEND.md` | Arquitectura React + Vite |
| `frontend/COMPONENTES.md` | Componentes |
| `frontend/RUTAS.md` | 16 rutas / páginas |
| `frontend/INTEGRACION_API.md` | Integración con la API |
| `frontend/INTEGRACION_REAL.md` | Integración real verificada |
| `frontend/UX_UI.md` | Decisiones de UX/UI |
| `frontend/MEJORAS_DASHBOARD.md` | Mejoras aplicadas al dashboard |
| `frontend/VALIDACION_FRONTEND.md` | Validación del frontend |
| `frontend/PENDIENTES_BACKEND.md` | Pendientes no bloqueantes del contrato |

### 1.8 Fases 12 y 12.1 — Pruebas integrales y datos de demostración
| Documento | Contenido |
|---|---|
| `pruebas/PLAN_PRUEBAS.md` | Plan de pruebas |
| `pruebas/RESULTADOS.md` | Resultados (38/38 verificaciones de API) |
| `pruebas/ERRORES.md` | Errores encontrados |
| `pruebas/CORRECCIONES.md` | Correcciones aplicadas |
| `pruebas/DATOS_DEMOSTRACION.md` | Dataset de demostración (guion de la demo) |
| `pruebas/datos_prueba.sql` | Datos de prueba de la Fase 12 |
| `pruebas/RECUPERACION_FASE13.md` | Recuperación de la base tras el borrado accidental (07/oct/2026): cadena de restauración, hallazgos y verificación |
| `pruebas/RECONFIGURACION_OPENCLAW.md` | Prueba de reconfiguración del agente (cerrada) |
| `pruebas/VALIDACION_SEPARACION_AGENTE.md` | Validación de separación workspace/proyecto |

### 1.9 Consultas abiertas al profesor
| Documento | Contenido |
|---|---|
| `profesor/preguntas_clase_tablas.md` | 5 dudas abiertas (Servicios, Reglas, Apuestas vs HacerApuesta, Resultado, login) — siguen pendientes según `SESSION_HANDOFF.md` |

---

## 2. Documentación histórica (`docs/HISTORICO/`)

| Ruta actual | Origen | Motivo |
|---|---|---|
| `HISTORICO/base_datos/script_tablas_sqlserver_borrador.sql` | `docs/base_datos/` | Borrador del 24/ago/2026 (16 tablas); superado por `database/01..05` (29 tablas) |
| `HISTORICO/base_datos/script_datos_prueba_borrador.sql` | `docs/base_datos/` | Borrador del 24/ago/2026; superado por `database/06_demo_data.sql` |
| `HISTORICO/base_datos/diagramas_er/_obsoletos/` (8 archivos) | `docs/base_datos/diagramas_er/_obsoletos/` | Versiones anteriores del diagrama E-R (02 y 09/sep/2026) |
| `HISTORICO/base_datos/diagramas_er/_scratch/` (8 archivos) | `docs/base_datos/diagramas_er/_scratch/` | Archivos de trabajo y errores de renderizado |
| `HISTORICO/mockups/` (4 HTML + README + `capturas/` + `capturas-react/`) | `docs/mockups/` | Maquetas estáticas del 12/ago/2026 y capturas del 15/ago/2026; superadas por el frontend React de la Fase 11 |
| `HISTORICO/pruebas/resumen_pruebas_sandbox.md` | `docs/pruebas/` | Pruebas del sandbox (02/sep/2026); superadas por las pruebas integrales reales de la Fase 12 |

---

## 3. Contenido de `docs/` que NO se movió (no es documentación)

| Ruta | Motivo |
|---|---|
| `docs/base_datos/backups/` (3 `.bak`) | Respaldos binarios de base de datos; referenciados por `SESSION_HANDOFF.md`, `PROJECT_CONTEXT.md`, `DECISION_LOG.md` y `docs/ACTUAL/entregables/CHECKLIST_ENTREGA.md` |
| `docs/mockups/.tmp-profile/` | Perfil temporal de navegador (ignorado por `.gitignore`); no es documentación |
| `docs/pruebas/.gitignore` | Regla de exclusión de `salidas_xlsx/`; configuración, no documentación |

---

## 4. Referencias internas corregidas (14/sep/2026)

Corrección autorizada por Jhon. Se actualizaron **25 archivos de documentación** (raíz del proyecto, `docs/ACTUAL/` y `sandbox/`) y **7 skills del agente**.

**Reglas aplicadas**

| Ruta antigua | Ruta nueva |
|---|---|
| `docs/<área>/` (backend, frontend, requisitos, modelo_conceptual, modelo_logico, normalizacion, diccionario_datos, sql_server, procedimientos, views_functions, triggers, entregables, pruebas, profesor) | `docs/ACTUAL/<área>/` |
| `docs/base_datos/diagramas_er/` | `docs/ACTUAL/base_datos/diagramas_er/` |
| `docs/mockups/` | `docs/HISTORICO/mockups/` |
| `docs/base_datos/script_*_borrador.sql` | `docs/HISTORICO/base_datos/` |
| `docs/pruebas/resumen_pruebas_sandbox.md` | `docs/HISTORICO/pruebas/` |
| `docs/pruebas/PENDIENTES_BACKEND.md` (ruta errónea) | `docs/ACTUAL/frontend/PENDIENTES_BACKEND.md` |
| `docs/base_datos/backups/`, `docs/mockups/.tmp-profile/`, `docs/pruebas/.gitignore` | sin cambio (no se movieron) |

**Documentos modificados (25):** `PROJECT_CONTEXT.md`, `SESSION_HANDOFF.md`, `DECISION_LOG.md`, `README.md`; `docs/ACTUAL/diccionario_datos/DICCIONARIO_DATOS.md`, `docs/ACTUAL/entregables/CHECKLIST_ENTREGA.md`, `ENTREGA_FINAL.md`, `RESUMEN_SUSTENTACION.md`; `docs/ACTUAL/frontend/INTEGRACION_API.md`, `MEJORAS_DASHBOARD.md`, `UX_UI.md`; `docs/ACTUAL/modelo_conceptual/ENTIDADES.md`, `MODELO_CONCEPTUAL.md`, `RELACIONES.md`; `docs/ACTUAL/modelo_logico/MODELO_LOGICO.md`, `TABLAS.md`; `docs/ACTUAL/profesor/preguntas_clase_tablas.md`; `docs/ACTUAL/pruebas/CORRECCIONES.md`, `RESULTADOS.md`, `VALIDACION_SEPARACION_AGENTE.md`; `docs/ACTUAL/requisitos/informacion_pendiente.md`; `docs/ACTUAL/sql_server/MODELO_FISICO.md`; `sandbox/backend/README.md`, `sandbox/backend/scripts/fk_empresa_apuestas/README_FK_EMPRESA_APUESTAS.md`, `sandbox/backend/scripts/p1p10/README_P1_P10.md`.

**Skills del agente actualizadas (7):** `mermaid-er-diagram`, `agent-workspace-layout`, `commit-hygiene`, `apuestadb-demo-data`, `apuestadb-frontend`, `apuestadb-rest-backend`, `sql-server-migrations`. Se incorporó además la skill `docs-organization`, que documenta este procedimiento de separación y corrección de rutas.

**Verificación:** 0 referencias obsoletas dentro de la documentación (el encabezado de `docs/ACTUAL/pruebas/datos_prueba.sql` se corrigió el 07/oct/2026); las que quedan apuntan a rutas que no se movieron (`docs/base_datos/backups/`, `docs/mockups/.tmp-profile/`, `docs/pruebas/.gitignore`).

**Referencias NO modificadas** (fuera del alcance autorizado: `backend/`, `database/`, `frontend/` y el contenido de los `.sql`):

| Archivo | Línea(s) | Referencia obsoleta |
|---|---|---|
| `backend/README.md` | 63, 64, 65 | `docs/backend/ARQUITECTURA.md`, `ENDPOINTS.md`, `CONFIGURACION.md` |
| `backend/repositories/usuario.repository.js` | 37 | comentario → `docs/backend/ARQUITECTURA.md` |
| `backend/services/auth.service.js` | 9 | comentario → `docs/backend/ARQUITECTURA.md` |
| `database/README.md` | 40, 42 | `docs/pruebas/DATOS_DEMOSTRACION.md`, `RESULTADOS.md`, `CORRECCIONES.md` |
| `frontend/README.md` | 70, 88 | `docs/frontend/` |
| `frontend/src/pages/Notificaciones.jsx` | 89 | comentario → `docs/frontend/INTEGRACION_API.md` |
| `frontend/src/pages/RecuperarContrasena.jsx` | 22 | comentario → `docs/backend/ENDPOINTS.md` |
| `frontend/src/services/adminService.js` | 22 | comentario → `docs/frontend/PENDIENTES_BACKEND.md` |
| `frontend/src/services/eventoService.js` | 10 | comentario → `docs/backend/INTEGRACION_FRONTEND.md` |
| `frontend/src/services/notificacionService.js` | 10 | comentario → `docs/frontend/INTEGRACION_API.md` |
| `frontend/src/utils/constantes.js` | 59 | comentario → `docs/frontend/INTEGRACION_API.md` |

`.vscode/settings.json` (línea 17) y `.gitignore` (línea 10) siguen apuntando a `docs/mockups/.tmp-profile/`, que **no** se movió: la referencia es correcta.
---

## 5. Estado final de `docs/`

```
docs/
├── ACTUAL/                     # documentación vigente (Fases 0 a 12.1)
│   ├── INDICE_DOCUMENTACION.md # este índice
│   ├── entregables/
│   ├── requisitos/
│   ├── modelo_conceptual/
│   ├── modelo_logico/
│   ├── normalizacion/
│   ├── diccionario_datos/
│   ├── sql_server/
│   ├── base_datos/diagramas_er/
│   ├── procedimientos/
│   ├── views_functions/
│   ├── triggers/
│   ├── backend/
│   ├── frontend/
│   ├── pruebas/
│   └── profesor/
├── HISTORICO/                  # documentación superada (sin eliminar)
│   ├── base_datos/             # borradores SQL + diagramas E-R obsoletos y scratch
│   ├── mockups/                # maquetas y capturas antiguas
│   └── pruebas/                # pruebas del sandbox
├── base_datos/backups/         # respaldos .bak (no movidos)
├── mockups/.tmp-profile/       # perfil temporal de navegador (no movido)
└── pruebas/.gitignore          # regla de exclusión (no movida)
```

Sin pérdida de archivos: el total de archivos bajo `docs/` antes y después de la reorganización es 608.
