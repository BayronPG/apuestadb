-- ============================================================================
-- APUESTADB - database/postgresql/05_verify.sql
-- Verificacion del dominio financiero en PostgreSQL (Fase 16). Solo lectura.
-- Uso: psql -U ... -d apuestadb -f database/postgresql/05_verify.sql
-- ============================================================================

SELECT 'tablas_financieras' AS control, 5 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND lower(table_name) IN ('tiposaldo','tipomovimientosaldo','saldocuenta','recarga','movimientosaldo');

SELECT 'vistas_financieras' AS control, 2 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.views
 WHERE table_schema = 'public'
   AND lower(table_name) IN ('vw_saldodetalle','vw_historialmovimientos');

SELECT 'unique' AS control, 4 AS esperado, COUNT(*) AS obtenido
  FROM pg_constraint WHERE contype = 'u'
   AND lower(conname) IN ('uq_tiposaldo_nombre','uq_tipomovimientosaldo_nombre','uq_saldocuenta','uq_recarga');

SELECT 'check' AS control, 10 AS esperado, COUNT(*) AS obtenido
  FROM pg_constraint WHERE contype = 'c'
   AND lower(conname) LIKE 'ck_%';

SELECT 'indices' AS control, 8 AS esperado, COUNT(DISTINCT indexname) AS obtenido
  FROM pg_indexes
 WHERE schemaname = 'public'
   AND lower(indexname) IN ('ix_saldocuenta_usuario','ix_saldocuenta_tipo','ix_movimiento_cuenta',
                     'ix_movimiento_tipo','ix_movimiento_fecha','ix_movimiento_apuesta',
                     'ix_recarga_usuario','ix_recarga_tipo');

SELECT 'huerfanos_saldocuenta' AS control, 0 AS esperado, COUNT(*) AS obtenido
  FROM SaldoCuenta sc LEFT JOIN TipoSaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
 WHERE ts.id_tipo_saldo IS NULL
UNION ALL
SELECT 'huerfanos_movimiento_cuenta', 0,
       COUNT(*) FROM MovimientoSaldo ms
        LEFT JOIN SaldoCuenta sc ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
        WHERE sc.id_saldo_cuenta IS NULL
UNION ALL
SELECT 'huerfanos_movimiento_tipo', 0,
       COUNT(*) FROM MovimientoSaldo ms
        LEFT JOIN TipoMovimientoSaldo tm ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
        WHERE tm.id_tipo_movimiento IS NULL
UNION ALL
SELECT 'huerfanos_movimiento_recarga', 0,
       COUNT(*) FROM MovimientoSaldo ms
        LEFT JOIN Recarga r ON r.id_recarga = ms.id_recarga
        WHERE ms.id_recarga IS NOT NULL AND r.id_recarga IS NULL
UNION ALL
SELECT 'huerfanos_recarga_tipo', 0,
       COUNT(*) FROM Recarga r
        LEFT JOIN TipoSaldo ts ON ts.id_tipo_saldo = r.id_tipo_saldo
        WHERE ts.id_tipo_saldo IS NULL;

SELECT 'saldo_negativo' AS control, 0 AS esperado, COUNT(*) AS obtenido
  FROM SaldoCuenta WHERE saldo_actual < 0;
SELECT 'movimiento_monto_no_positivo' AS control, 0 AS esperado, COUNT(*) AS obtenido
  FROM MovimientoSaldo WHERE monto <= 0;
SELECT 'recarga_monto_no_positivo' AS control, 0 AS esperado, COUNT(*) AS obtenido
  FROM Recarga WHERE monto <= 0;
SELECT 'movimiento_doble_origen' AS control, 0 AS esperado, COUNT(*) AS obtenido
  FROM MovimientoSaldo WHERE id_apuesta IS NOT NULL AND id_recarga IS NOT NULL;

SELECT 'suma_saldo' AS control, 1247500.00 AS esperado, SUM(saldo_actual) AS obtenido FROM SaldoCuenta;
SELECT 'suma_movimientos' AS control, 1897500.00 AS esperado, SUM(monto) AS obtenido FROM MovimientoSaldo;
SELECT 'suma_recargas' AS control, 1110000.00 AS esperado, SUM(monto) AS obtenido FROM Recarga;

SELECT 'filas_tiposaldo' AS control, 2 AS esperado, COUNT(*) AS obtenido FROM TipoSaldo;
SELECT 'filas_tipomovimiento' AS control, 4 AS esperado, COUNT(*) AS obtenido FROM TipoMovimientoSaldo;
SELECT 'filas_saldocuenta' AS control, 18 AS esperado, COUNT(*) AS obtenido FROM SaldoCuenta;
SELECT 'filas_recarga' AS control, 9 AS esperado, COUNT(*) AS obtenido FROM Recarga;
SELECT 'filas_movimiento' AS control, 27 AS esperado, COUNT(*) AS obtenido FROM MovimientoSaldo;
