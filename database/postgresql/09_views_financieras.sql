-- ============================================================================
-- APUESTADB - database/postgresql/09_views_financieras.sql
--
-- Equivalentes PostgreSQL de las vistas financieras de SQL Server para que
-- /api/usuarios y /api/reportes/financiero puedan leer del motor canonico.
--
-- Idempotente: CREATE OR REPLACE VIEW.
-- ============================================================================

-- Saldo consolidado por usuario (tokens, PSE y total).
CREATE OR REPLACE VIEW vw_saldoconsolidado AS
SELECT sc.id_usuario,
       COALESCE(MAX(CASE WHEN ts.nombre = 'tokens' THEN sc.saldo_actual END), 0) AS saldo_tokens,
       COALESCE(MAX(CASE WHEN ts.nombre = 'PSE' THEN sc.saldo_actual END), 0) AS saldo_pse,
       COALESCE(SUM(sc.saldo_actual), 0) AS saldo_total
  FROM saldocuenta sc
  JOIN tiposaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
 GROUP BY sc.id_usuario;

-- Resumen financiero por tipo de saldo.
CREATE OR REPLACE VIEW vw_reportefinanciero AS
SELECT ts.id_tipo_saldo,
       ts.nombre AS tipo_saldo,
       COALESCE((
         SELECT SUM(r.monto) FROM recarga r
          WHERE r.id_tipo_saldo = ts.id_tipo_saldo AND r.estado = 'aplicada'
       ), 0) AS total_recargado,
       COALESCE((
         SELECT SUM(ms.monto)
           FROM movimientosaldo ms
           JOIN saldocuenta sc ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
           JOIN tipomovimientosaldo tm ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
          WHERE sc.id_tipo_saldo = ts.id_tipo_saldo AND tm.nombre = 'apuesta'
       ), 0) AS total_apostado,
       COALESCE((
         SELECT SUM(ms.monto)
           FROM movimientosaldo ms
           JOIN saldocuenta sc ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
           JOIN tipomovimientosaldo tm ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
          WHERE sc.id_tipo_saldo = ts.id_tipo_saldo AND tm.nombre = 'premio'
       ), 0) AS total_premios,
       COALESCE((
         SELECT SUM(sc.saldo_actual) FROM saldocuenta sc
          WHERE sc.id_tipo_saldo = ts.id_tipo_saldo
       ), 0) AS saldo_en_cuentas
  FROM tiposaldo ts;
