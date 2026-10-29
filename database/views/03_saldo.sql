/* ============================================================================
   APUESTADB - views/03_saldo.sql
   Vistas de saldo y movimientos.
   Requiere : database/01..05 ejecutados.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   vw_SaldoConsolidado
   Objetivo : mostrar el saldo de cada usuario por tipo (tokens, PSE) y el total.
   Casos de uso: panel del usuario y control administrativo del saldo ficticio.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_SaldoConsolidado
AS
SELECT u.id_usuario,
       u.correo,
       u.estado AS estado_usuario,
       ISNULL(MAX(CASE WHEN ts.nombre = 'tokens' THEN sc.saldo_actual END), 0) AS saldo_tokens,
       ISNULL(MAX(CASE WHEN ts.nombre = 'PSE'    THEN sc.saldo_actual END), 0) AS saldo_pse,
       ISNULL(SUM(sc.saldo_actual), 0) AS saldo_total
FROM dbo.Usuario u
LEFT JOIN dbo.SaldoCuenta sc ON sc.id_usuario = u.id_usuario
LEFT JOIN dbo.TipoSaldo ts    ON ts.id_tipo_saldo = sc.id_tipo_saldo
GROUP BY u.id_usuario, u.correo, u.estado;
GO

/* ----------------------------------------------------------------------------
   vw_HistorialMovimientos
   Objetivo : listar todos los movimientos de saldo con su concepto y saldo resultante.
   Casos de uso: extracto del usuario y auditoria financiera del saldo ficticio.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_HistorialMovimientos
AS
SELECT ms.id_movimiento,
       u.id_usuario,
       u.correo,
       ts.nombre AS tipo_saldo,
       tm.nombre AS concepto,
       tm.naturaleza,
       ms.monto,
       ms.saldo_resultante,
       ms.fecha_hora,
       ms.referencia,
       ms.id_apuesta,
       ms.id_recarga
FROM dbo.MovimientoSaldo ms
JOIN dbo.SaldoCuenta sc         ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
JOIN dbo.TipoSaldo ts           ON ts.id_tipo_saldo = sc.id_tipo_saldo
JOIN dbo.TipoMovimientoSaldo tm ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
JOIN dbo.Usuario u              ON u.id_usuario = sc.id_usuario;
GO

PRINT 'views/03_saldo.sql: 2 vistas creadas.';
GO
