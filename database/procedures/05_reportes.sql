/* ============================================================================
   APUESTADB - procedures/05_reportes.sql
   Procedimientos: consultas de reportes e historial.
   Requiere : database/01..05.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   usp_MovimientoSaldo_Historial
   Objetivo    : consultar el historial de movimientos de saldo de un usuario.
   Parametros  : @id_usuario, @id_tipo_saldo (opc), @desde (opc), @hasta (opc)
   Validaciones: el usuario existe.
   Resultado   : movimientos con tipo de saldo, concepto, monto, saldo resultante
                 y origen (apuesta o recarga).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_MovimientoSaldo_Historial
    @id_usuario    INT,
    @id_tipo_saldo INT = NULL,
    @desde         DATETIME2(3) = NULL,
    @hasta         DATETIME2(3) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
        THROW 50101, N'El usuario no existe.', 1;
    IF @desde IS NOT NULL AND @hasta IS NOT NULL AND @desde > @hasta
        THROW 50102, N'El rango de fechas no es valido.', 1;

    SELECT ms.id_movimiento,
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
    WHERE sc.id_usuario = @id_usuario
      AND (@id_tipo_saldo IS NULL OR sc.id_tipo_saldo = @id_tipo_saldo)
      AND (@desde IS NULL OR ms.fecha_hora >= @desde)
      AND (@hasta IS NULL OR ms.fecha_hora <= @hasta)
    ORDER BY ms.fecha_hora DESC;
END
GO

PRINT '05_reportes.sql: 1 procedimiento creado.';
GO
