# CHECKLIST_ENTREGA.md — ApuestaDB

**Fecha:** 14/sep/2026
**Uso:** verificar todo antes de entregar y antes de sustentar. Marcar cada casilla con evidencia real.

---

## A. Checklist de ENTREGA (documentación y código)

### A.1 Repositorio y estructura
- [ ] Repositorio privado `BayronPG/apuestadb`, rama `main`, con los cambios de cierre subidos (**requiere autorización de Jhon: commit y push no están autorizados todavía**).
- [ ] `.gitignore` vigente: sin `node_modules/`, `dist/`, `.env`, `.tmp/`, respaldos masivos ni archivos internos del agente.
- [ ] Estructura clara: `database/`, `backend/`, `frontend/`, `docs/`, `sandbox/` (referencia), documentos raíz.
- [ ] Invitación a `shantal-hue` aceptada (pendiente externo).

### A.2 Base de datos
- [ ] `database/01..05` + `functions/`, `views/`, `procedures/`, `triggers/` ejecutan sin errores desde SSMS y desde `sqlcmd`.
- [ ] Conteos verificados: 29 tablas, 29 PK, 26 UNIQUE, 38 FK, 26 índices + 1 filtrado, 12 vistas, 6 funciones, 14 procedimientos, 13 triggers.
- [ ] Datos mínimos cargados (`05_seed_data.sql`) y datos de prueba separados (`docs/ACTUAL/pruebas/datos_prueba.sql`).
- [ ] Respaldo `.bak` localizado y probado (`docs/base_datos/backups/`).
- [ ] Diagrama E-R actualizado (`docs/ACTUAL/base_datos/diagramas_er/apuestadb_er.png` / `.svg`).

### A.3 Backend
- [ ] `npm install` ejecuta sin errores.
- [ ] `backend/.env` existe **localmente** y no está versionado; `.env.example` describe todas las variables.
- [ ] `npm start` levanta la API y `GET /api/health` reporta la base **conectada**.
- [ ] 24 endpoints documentados en `docs/ACTUAL/backend/ENDPOINTS.md` coinciden con `backend/routes/`.
- [ ] Sin credenciales ni contraseñas dentro del código versionado.

### A.4 Frontend
- [ ] `npm install` y `npm run build` sin errores (143 módulos, 0 errores).
- [ ] `npm run dev` sirve en 5173 y el proxy `/api` alcanza la API.
- [ ] 15 rutas + índice + 404 documentadas en `docs/ACTUAL/frontend/RUTAS.md`.
- [ ] Sin dependencias no autorizadas; estilos propios.

### A.5 Documentación académica
- [ ] `docs/ACTUAL/requisitos/` (29 RF, 12 RNF, 21 RN, 12 CU, actores, riesgos).
- [ ] `docs/ACTUAL/modelo_conceptual/`, `docs/ACTUAL/modelo_logico/`, `docs/ACTUAL/normalizacion/`, `docs/ACTUAL/diccionario_datos/`, `docs/ACTUAL/sql_server/`.
- [ ] `docs/ACTUAL/procedimientos/`, `docs/ACTUAL/views_functions/`, `docs/ACTUAL/triggers/`, `docs/ACTUAL/backend/`, `docs/ACTUAL/frontend/`.
- [ ] `docs/ACTUAL/pruebas/` (PLAN_PRUEBAS, RESULTADOS, ERRORES, CORRECCIONES, datos_prueba.sql).
- [ ] `docs/ACTUAL/entregables/` (planteamiento_fase1, ENTREGA_FINAL, RESUMEN_SUSTENTACION, CHECKLIST_ENTREGA).
- [ ] `README.md`, `PROJECT_CONTEXT.md`, `DECISION_LOG.md`, `SESSION_HANDOFF.md` actualizados al cierre.

### A.6 Estado del sistema antes de entregar
- [ ] Base `ApuestaDB` con los datos de prueba cargados y el respaldo disponible.
- [ ] Backend y frontend levantados y verificados el día de la entrega.
- [ ] Sin procesos duplicados escuchando en 4000/5173.

---

## B. Checklist de SUSTENTACIÓN

### B.1 Preparación técnica (30 minutos antes)
- [ ] Servicio `MSSQL$SQLEXPRESS01` en ejecución y respaldo a mano.
- [ ] Backend arrancado: `cd backend ; npm start` (verificar `GET /api/health` → `conectada`).
- [ ] Frontend arrancado: `cd frontend ; npm run dev` (abrir `http://localhost:5173`).
- [ ] SSMS abierto con la consulta de evidencia lista (`MovimientoSaldo`, `Auditoria`, `HistorialCuota`).
- [ ] Credenciales de los usuarios de prueba a la mano (archivo local `.tmp/credenciales_prueba_fase12.env`, no versionado).
- [ ] Pestañas preparadas: panel de usuario, panel administrador, diagrama E-R.
- [ ] Plan B: capturas de pantalla y el `.bak` por si la demo en vivo falla.

### B.2 Contenido expuesto
- [ ] Problema y objetivo explicados sin tecnicismos innecesarios.
- [ ] Alcance real y limitaciones declarados con honestidad.
- [ ] Modelo de datos: conceptual → lógico → físico con el diagrama a la vista.
- [ ] Normalización: 1FN/2FN/3FN con un ejemplo concreto de dependencia funcional.
- [ ] Programación en el motor: al menos un procedimiento, un trigger y una vista explicados.
- [ ] Arquitectura BD → API → frontend y controles de seguridad (bcrypt, JWT, roles).
- [ ] Demo completa: recarga → apuesta → resultado → liquidación → premio → trazabilidad.
- [ ] Pruebas: 38 verificaciones, 0 fallas, y los problemas encontrados y cómo se resolvieron.
- [ ] Métricas finales memorizadas (29/38/12/6/14/13/24/16).

### B.3 Cierre
- [ ] Aprendizajes y trabajo futuro (endpoint de eventos, los 3 endpoints del contrato, concurrencia).
- [ ] Agradecimiento al profesor y apertura a preguntas.
- [ ] Capa de datos intacta al terminar la demo (sin dejar transacciones abiertas).

---

## C. Bloqueos conocidos antes de entregar

| # | Bloqueo | Requiere |
|---|---|---|
| 1 | Commit y push de los cambios de cierre | Autorización explícita de Jhon |
| 2 | Aceptación de la invitación al repositorio | Compañera `shantal-hue` |
| 3 | Validación del profesor sobre motor, stack y alcance | Profesor |
| 4 | Recorrido clicable en navegador / responsive / concurrencia | Autorización para una sesión de pruebas adicional |
