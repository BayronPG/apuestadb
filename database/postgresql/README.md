# PostgreSQL — dominio financiero (Fase 16)

Esquema PostgreSQL del **saldo ficticio** de ApuestaDB: 5 tablas y 2 vistas. SQL Server conserva
las escrituras financieras hasta la Fase 16.1.

## Archivos

| Archivo | Contenido |
|---|---|
| `01_schema.sql` | 5 tablas, `SERIAL`/`BIGSERIAL`, `NUMERIC(18,2)`, `TIMESTAMP(3)` y 2 vistas. |
| `02_constraints_indexes.sql` | UNIQUE, CHECK e índices (idempotente). |
| `04_migrate.js` | Migración de las 5 tablas desde SQL Server (solo lectura). |
| `05_verify.sql` | Conteos, sumas, huérfanos, restricciones e índices. |

## Orden de ejecución

```bash
docker exec -i apuestadb-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < database/postgresql/01_schema.sql
docker exec -i apuestadb-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < database/postgresql/02_constraints_indexes.sql
node database/postgresql/04_migrate.js
docker exec -i apuestadb-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < database/postgresql/05_verify.sql
```

## Decisiones

- `SaldoCuenta.id_usuario` y `Recarga.id_usuario` son referencias lógicas a `Usuario` (SQL Server).
- `MovimientoSaldo.id_apuesta` es una referencia lógica a `Apuesta` (MongoDB).
- El backend lee el saldo desde PostgreSQL con `SALDO_MOTOR=postgresql` (predeterminado `sqlserver`).
- Las escrituras y triggers financieros permanecen en SQL Server (Fase 16.1).
