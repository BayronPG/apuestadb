/* ============================================================================
   APUESTADB - triggers/02_saldo.sql
   Triggers de sincronizacion del saldo y proteccion de registros criticos.
   ----------------------------------------------------------------------------
   NOTA DE DISENO (evitar duplicidad):
   NO se crea un trigger que "registre automaticamente un movimiento" cuando se
   modifica SaldoCuenta: usp_MovimientoSaldo_Registrar YA inserta el movimiento y
   actualiza el saldo en la misma transaccion; un trigger asi duplicaria
   movimientos. En su lugar:
     - el trigger sobre MovimientoSaldo SINCRONIZA el saldo consolidado, y
     - el trigger sobre SaldoCuenta PROTEGE la integridad.
   ----------------------------------------------------------------------------
   POLITICA DE ERRORES: el trigger que ESCRIBE (sincronizacion) usa TRY/CATCH;
   los triggers de validacion usan THROW directo (su proposito es abortar).
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   trg_MovimientoSaldo_SincronizarSaldo
   Tabla  : MovimientoSaldo | Evento: INSERT
   Objetivo: dejar SaldoCuenta.saldo_actual igual al saldo_resultante del ultimo
             movimiento (actualizacion automatica del saldo consolidado).
   Multi-fila: toma el movimiento de mayor id por cuenta.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_MovimientoSaldo_SincronizarSaldo
ON dbo.MovimientoSaldo
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        ;WITH ultimo AS
        (
            SELECT i.id_saldo_cuenta, i.saldo_resultante,
                   ROW_NUMBER() OVER (PARTITION BY i.id_saldo_cuenta ORDER BY i.id_movimiento DESC) AS rn
            FROM inserted i
        )
        UPDATE sc
        SET sc.saldo_actual = u.saldo_resultante,
            sc.fecha_ultima_actualizacion = SYSDATETIME()
        FROM dbo.SaldoCuenta sc
        JOIN ultimo u ON u.id_saldo_cuenta = sc.id_saldo_cuenta
        WHERE u.rn = 1;
    END TRY
    BEGIN CATCH
        THROW 50205, N'No se pudo sincronizar el saldo de la cuenta tras el movimiento.', 1;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   trg_SaldoCuenta_Proteger
   Tabla  : SaldoCuenta | Evento: UPDATE, DELETE
   Objetivo: impedir saldos negativos y la eliminacion de cuentas de saldo.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_SaldoCuenta_Proteger
ON dbo.SaldoCuenta
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM inserted WHERE saldo_actual < 0)
        THROW 50201, N'El saldo de la cuenta no puede ser negativo.', 1;

    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
        THROW 50202, N'No se permite eliminar cuentas de saldo (registro critico).', 1;
END
GO

/* ----------------------------------------------------------------------------
   trg_MovimientoSaldo_NoEliminar
   Tabla  : MovimientoSaldo | Evento: DELETE
   Objetivo: los movimientos de saldo son inmutables (trazabilidad, RN-19).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_MovimientoSaldo_NoEliminar
ON dbo.MovimientoSaldo
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM deleted)
        THROW 50203, N'Los movimientos de saldo son inmutables: no se permite eliminarlos.', 1;
END
GO

PRINT 'triggers/02_saldo.sql: 3 triggers creados.';
GO
