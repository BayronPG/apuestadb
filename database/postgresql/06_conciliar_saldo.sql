-- ============================================================================
-- APUESTADB - database/postgresql/06_conciliar_saldo.sql
--
-- Conciliacion unica de movimientos que solo existian en SQL Server.
-- Se ejecuta UNA vez; las claves de idempotencia evitan duplicados si se repite.
--
-- u2  tokens (cuenta 3):  apuestas 12, 13 y 14 (3 x 1.000)
-- u11 tokens (cuenta 21): apuesta 15 (1.000)
-- u11 PSE    (cuenta 22): recarga 12 (+120.000) y apuesta 16 (-10.000) => neto +110.000
--
-- No se hace UPDATE de saldos: todo pasa por fn_movimiento_saldo / fn_recarga_crear.
-- ============================================================================

BEGIN;

SELECT * FROM fn_movimiento_saldo(
  3, 'apuesta', 1000.00, 12, NULL,
  'Conciliacion multi-motor: debito apuesta 12 (solo SQL Server)',
  'conciliacion:apuesta:12'
);

SELECT * FROM fn_movimiento_saldo(
  3, 'apuesta', 1000.00, 13, NULL,
  'Conciliacion multi-motor: debito apuesta 13 (solo SQL Server)',
  'conciliacion:apuesta:13'
);

SELECT * FROM fn_movimiento_saldo(
  3, 'apuesta', 1000.00, 14, NULL,
  'Conciliacion multi-motor: debito apuesta 14 (solo SQL Server)',
  'conciliacion:apuesta:14'
);

SELECT * FROM fn_movimiento_saldo(
  21, 'apuesta', 1000.00, 15, NULL,
  'Conciliacion multi-motor: debito apuesta 15 (solo SQL Server)',
  'conciliacion:apuesta:15'
);

SELECT * FROM fn_recarga_crear(
  11, 2, 120000.00, NULL,
  'Conciliacion multi-motor: recarga 12 (solo SQL Server)',
  'conciliacion:recarga:12'
);

SELECT * FROM fn_movimiento_saldo(
  22, 'apuesta', 10000.00, 16, NULL,
  'Conciliacion multi-motor: debito apuesta 16 (solo SQL Server)',
  'conciliacion:apuesta:16'
);

COMMIT;

-- Verificacion esperada:
--   u1  tokens = 15.000
--   u2  tokens = 115.500
--   u11 tokens = 99.000
--   u11 PSE    = 110.000
