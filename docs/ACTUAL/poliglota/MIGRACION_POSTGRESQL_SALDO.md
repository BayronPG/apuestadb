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

- `SALDO_MOTOR=sqlserver` (predeterminado): procedimientos actuales, comportamiento intacto.
- `SALDO_MOTOR=postgresql`: lecturas y **escrituras** financieras en PostgreSQL, con el mismo contrato HTTP.
  - `POST /api/recargas` ejecuta `fn_recarga_crear`.
  - Los movimientos usan `fn_movimiento_saldo` (apuesta, premio, recarga, ajuste).
  - DECIMAL y BIGINT se normalizan a `number`.

## 7. Escrituras transaccionales (Fase 16.1)

`database/postgresql/03_functions.sql` implementa:

- `fn_movimiento_saldo`: valida monto y tipo, bloquea la cuenta con `SELECT ... FOR UPDATE`,
  calcula el saldo con `NUMERIC`, inserta el movimiento y actualiza la cuenta en una sola
  transacción. Saldo insuficiente o cualquier fallo produce rollback completo.
- `fn_recarga_crear`: valida tipo vigente, localiza la cuenta, crea la recarga y aplica el
  abono mediante `fn_movimiento_saldo`.
- **Idempotencia:** tabla `IdempotenciaFinanciera` con clave única y bloqueo de asesoría por clave;
  una clave repetida devuelve el resultado original sin volver a aplicar el cambio.
- TOKENS y PSE son cuentas independientes: cada operación afecta solo su `id_tipo_saldo`.

Verificado: recarga, duplicado, monto inválido, descuento, insuficiencia, premio, premio duplicado,
rollback, concurrencia (dos débitos simultáneos: uno aplica, otro se rechaza) y ambos tipos.

Pendiente (Fase 17): orquestación de apuestas con MongoDB (saga), notificaciones y auditoría
desde PostgreSQL, y traslado de `usp_Apuesta_Crear`/liquidación. No se simula ACID global.
