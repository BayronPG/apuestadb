# Migración financiera a PostgreSQL — Fase 16

**Fecha:** 08/nov/2026 · **Rama:** `poliglota` · **Estado:** esquema, datos y lecturas migrados.

## 1. Alcance

- 5 tablas del dominio financiero migradas desde SQL Server a PostgreSQL:
  `TipoSaldo`, `TipoMovimientoSaldo`, `SaldoCuenta`, `Recarga`, `MovimientoSaldo`.
- **60 filas** migradas conservando identificadores.
- Lecturas del backend (`/api/saldo`, `/api/saldo/tipos`, `/api/saldo/movimientos`) disponibles
  en PostgreSQL mediante `SALDO_MOTOR`; el valor predeterminado sigue siendo `sqlserver`.
- **Escrituras** (registrar movimiento, crear recarga) permanecen en SQL Server en esta fase.
- MySQL, MongoDB y el frontend no se modifican.

## 2. Inventario origen (SQL Server)

| Tabla | Filas | PK | Depende de |
|---|---:|---|---|
| TipoSaldo | 2 | id_tipo_saldo | — |
| TipoMovimientoSaldo | 4 | id_tipo_movimiento | — |
| SaldoCuenta | 18 | id_saldo_cuenta | TipoSaldo |
| Recarga | 9 | id_recarga | TipoSaldo |
| MovimientoSaldo | 27 | id_movimiento | SaldoCuenta, TipoMovimientoSaldo, Recarga |

Totales de control: saldo 1.247.500,00 · movimientos 1.897.500,00 · recargas 1.110.000,00.

### Referencias entre motores (sin FK)

- `SaldoCuenta.id_usuario` y `Recarga.id_usuario` → `Usuario` en SQL Server.
- `MovimientoSaldo.id_apuesta` → `Apuesta` en MongoDB.

## 3. Esquema PostgreSQL

| Elemento | Cantidad |
|---|---:|
| Tablas | 5 |
| Vistas | 2 (`vw_SaldoDetalle`, `vw_HistorialMovimientos`) |
| UNIQUE | 4 |
| CHECK | 10 |
| Índices | 8 |

Traducciones: `IDENTITY` → `SERIAL`/`BIGSERIAL`; `NVARCHAR` → `VARCHAR`; `DATETIME2(3)` →
`TIMESTAMP(3)`; `DECIMAL(18,2)` → `NUMERIC(18,2)`.

## 4. Migración

`database/postgresql/04_migrate.js`: lectura de SQL Server, escritura por lotes en PostgreSQL,
`ON CONFLICT (pk) DO UPDATE`, fechas UTC con milisegundos, ajuste de secuencias y parada ante
diferencias de conteo.

## 5. Resultados verificados

| Control | Resultado |
|---|---|
| DDL ejecutado dos veces | OK |
| Migración ejecutada dos veces | OK (60 filas, sin duplicados) |
| Conteos por tabla (2/4/18/9/27) | OK |
| Sumas de saldo, movimientos y recargas | OK |
| Huérfanos internos (5 relaciones) | 0 |
| FK y CHECK aplicados | Verificado (errores 23503 / 23514) |
| Vistas financieras | 2 |
| `/api/saldo` en ambos motores | Mismo resultado (2 cuentas, total 108.500) |
| `/api/saldo/movimientos` | 3 filas idénticas |
| `/api/health` | operativo 4/4 |

## 6. Backend

- `SALDO_MOTOR=sqlserver` (predeterminado): procedimientos actuales.
- `SALDO_MOTOR=postgresql`: lecturas financieras desde PostgreSQL, con el mismo contrato HTTP
  (DECIMAL y BIGINT se normalizan a `number`).
- Pendiente para 16.1: trasladar las escrituras (`usp_MovimientoSaldo_Registrar`,
  `usp_Recarga_Crear`) y sus triggers a PL/pgSQL; hoy siguen en SQL Server.
