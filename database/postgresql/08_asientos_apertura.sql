-- ============================================================================
-- APUESTADB - database/postgresql/08_asientos_apertura.sql
--
-- Registra el saldo inicial de las cuentas migradas que no tienen historial de
-- origen, para que la suma de movimientos explique el saldo actual.
--
-- NO modifica SaldoCuenta: solo inserta el asiento de apertura (tipo ajuste),
-- fechado antes del primer movimiento de la cuenta. Idempotente por referencia.
-- ============================================================================

BEGIN;

-- u11 tokens: saldo 100.000 sin movimiento de origen; el primer movimiento es la
-- apuesta 15 (-1.000), por lo que la apertura queda en 100.000.
INSERT INTO movimientosaldo
       (id_saldo_cuenta, id_tipo_movimiento, monto, saldo_resultante, fecha_hora, referencia)
SELECT 21, 4, 100000.00, 100000.00,
       COALESCE(
         (SELECT MIN(ms.fecha_hora) FROM movimientosaldo ms WHERE ms.id_saldo_cuenta = 21),
         CURRENT_TIMESTAMP
       ) - INTERVAL '1 second',
       'Saldo inicial migrado sin historial de origen (conciliacion)'
 WHERE NOT EXISTS (
   SELECT 1 FROM movimientosaldo ms
    WHERE ms.id_saldo_cuenta = 21
      AND ms.referencia LIKE 'Saldo inicial%'
 );

-- u12 PSE: saldo 125.000 copiado por el backfill, sin movimientos.
INSERT INTO movimientosaldo
       (id_saldo_cuenta, id_tipo_movimiento, monto, saldo_resultante, fecha_hora, referencia)
SELECT 24, 4, 125000.00, 125000.00,
       COALESCE(
         (SELECT sc.fecha_ultima_actualizacion FROM saldocuenta sc WHERE sc.id_saldo_cuenta = 24),
         CURRENT_TIMESTAMP
       ) - INTERVAL '1 second',
       'Saldo inicial migrado sin historial de origen (conciliacion)'
 WHERE NOT EXISTS (
   SELECT 1 FROM movimientosaldo ms
    WHERE ms.id_saldo_cuenta = 24
      AND ms.referencia LIKE 'Saldo inicial%'
 );

COMMIT;
