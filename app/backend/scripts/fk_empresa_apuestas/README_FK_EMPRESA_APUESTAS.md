# Migracion FK_Apuestas_Empresa - ApuestaDB (sandbox)

Fecha: 09/sep/2026 · Autorizacion: Jhon Bayron Pelaez Guerra ("la que tu creas mejor":
se eligio `Apuestas.empresa_id -> Empresa.id`).
Estado: APLICADA y VALIDADA en `SQLEXPRESS01\ApuestaDB`. Sin commit ni push.
Respaldo previo: `app/backend/backups/ApuestaDB_bak_20260909_2032.bak`.

## Motivo

`Empresa`, `Reglas` y `Servicios` formaban un grupo cerrado: `Reglas` y `Servicios`
apuntaban a `Empresa` (P8), pero **`Empresa` no colgaba de nada del resto del modelo**,
asi que el trio se veia apartado en cualquier diagrama (SSMS y ER). Peticion de Jhon:
conectarlos.

## Cambio aplicado

- Columna nueva `Apuestas.empresa_id` INT NULL.
- FK `FK_Apuestas_Empresa`: `Apuestas.empresa_id -> Empresa(id)`, con `WITH CHECK`
  (habilitada y de confianza).
- Backfill: las 6 ofertas existentes se asignaron a la operadora principal
  (`Empresa` id = 1, "ApuestaDB S.A.S."), mismo criterio que uso P8 para
  `Servicios` y `Reglas`.

## Archivos de la migracion

- `migracion_fk_empresa_apuestas.sql` - idempotente (2a ejecucion verificada = no-op).
- `rollback_fk_empresa_apuestas.sql` - deshace en orden inverso (FK y luego columna).
- `validacion.sql` - verificaciones post-migracion.

## Validacion (09/sep/2026)

- FK presente, `is_disabled = 0`, `is_not_trusted = 0`.
- `Apuestas` sin `empresa_id`: **0**. Huerfanos: **0**.
- Tablas de dominio sin ninguna FK: **0** (excluye `sysdiagrams`).
- Total de claves foraneas: **43** (antes 42).
- Relaciones del grupo: `Apuestas -> Empresa`, `Reglas -> Empresa`,
  `Servicios -> Empresa` (mas `Apuestas -> Calendario`, `HacerApuesta -> Apuestas`,
  `HistorialCuota -> Apuestas`).

## Diagrama ER

- `docs/base_datos/diagramas_er/apuestadb_er.mmd` regenerado desde la base:
  **29 tablas / 43 relaciones**.
- PNG / SVG / HTML republicados (PNG 8572x7176); los artefactos anteriores se
  movieron a `_obsoletos/`.

## Notas

- Cambio del **sandbox**; NO es requisito confirmado del profesor. El contenido real de
  `Servicios` y `Reglas` sigue pendiente de definicion con el profesor
  (`docs/profesor/preguntas_clase_tablas.md`).
- El diagrama de SSMS (`sysdiagrams`) sigue vacio: se crea desde la GUI de SSMS
  (New Database Diagram + Add de las 29 tablas).
- Dashboard y backend sin modificar; sin dependencias nuevas en el proyecto;
  sin commit ni push.
