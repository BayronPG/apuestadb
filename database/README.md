# ApuestaDB — Scripts de base de datos (SQL Server)

Scripts DDL/DML del proyecto **ApuestaDB** (Bases de Datos 2 — Tecnológico de Antioquia).
Integrantes: Jhon Bayron Peláez Guerra · Shantal Coneo García.

## Orden de ejecución

Ejecutar **en este orden** (SSMS o `sqlcmd`):

| # | Archivo | Contenido |
|---|---|---|
| 01 | `01_database.sql` | Crea la base `ApuestaDB` y sus opciones |
| 02 | `02_tables.sql` | Crea las **29 tablas** (columnas, tipos, nulabilidad, IDENTITY) |
| 03 | `03_constraints.sql` | PK (29), UNIQUE (26), CHECK, DEFAULT y FK (38) |
| 04 | `04_indexes.sql` | Índices non-clustered (25) + 1 índice único filtrado |
| 05 | `05_seed_data.sql` | Datos mínimos de arranque (catálogos base) |
| 06 | `06_demo_data.sql` | **Datos de demostración completos** (29 tablas, 344 registros, idempotente) — Fase 12.1 |

## Requisitos

- **SQL Server** (instancia local o la del entorno de la asignatura).
- **SQL Server Management Studio (SSMS)** o `sqlcmd`.
- Permisos para crear base de datos.

## Notas de ejecución

- **Batches:** los scripts usan `GO`; ejecutar el archivo completo desde SSMS.
- **Codificación:** abrir/guardar los `.sql` en **UTF-8** para que los caracteres acentuados (p. ej., `Fútbol`) se interpreten correctamente.
- **Esquema:** se usa `dbo`; no se requiere un esquema adicional.
- **Re-ejecución:** `02_tables.sql` incluye (comentado) un bloque `DROP TABLE IF EXISTS` para recrear los objetos. Úselo solo si desea borrar los datos.
- **Estados:** no existe tabla de estados; son dominios cerrados validados con `CHECK`.

## Objetos generados

- **29 tablas** con **29 PK**.
- **26 restricciones UNIQUE** + **CHECK** + **DEFAULT**.
- **38 FOREIGN KEY** (1 compuesta; `CASCADE` solo en dependientes hoja).
- **81 objetos de índice**: 29 clustered (PK) + 26 únicos + 26 non-clustered.
- **Datos mínimos (05):** roles (2), deportes (1), tipos de saldo (2), tipos de movimiento (4).
- **Datos de demostración (06):** 278 registros nuevos / 344 totales en las 29 tablas (catálogo deportivo, usuarios, cuotas, apuestas, liquidaciones y saldo ficticio). Detalle en `docs/pruebas/DATOS_DEMOSTRACION.md`.

> **Estado:** scripts ejecutados y verificados contra SQL Server el 14/sep/2026 (Fases 12 y 12.1): 29 tablas, **344 registros**, 38 FK, 26 UNIQUE, 25 indices + 1 filtrado, 12 vistas, 6 funciones, 14 procedimientos y 13 triggers. Resultados en docs/pruebas/RESULTADOS.md, datos de demostración en docs/pruebas/DATOS_DEMOSTRACION.md y correcciones en docs/pruebas/CORRECCIONES.md.

## Orden oficial de ejecución (completo)

1. `01_database.sql`
2. `02_tables.sql`
3. `03_constraints.sql`
4. `04_indexes.sql`
5. `05_seed_data.sql`
6. `functions/` -> `views/` -> `procedures/` (`06_auditoria.sql` y `04_eventos.sql` antes de `01`, `02` y `03`; en orden numerico solo genera advertencias de dependencia) -> `triggers/`
7. `06_demo_data.sql` (datos de demostración)

> `06_demo_data.sql` se ejecuta **después de los triggers**: así los datos pasan por las validaciones (`Resultado`, `Liquidacion`, saldo consolidado) y se genera automáticamente el historial de cuotas. Es idempotente: si los usuarios `@apuestadb.co` ya existen, no inserta nada.

Al ejecutar con `sqlcmd` use `-I` (QUOTED_IDENTIFIER ON) para los indices filtrados y el DML sobre `dbo.Usuario`.
