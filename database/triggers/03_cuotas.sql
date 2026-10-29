/* ============================================================================
   APUESTADB - triggers/03_cuotas.sql
   Triggers de historial automatico de cuotas.
   Para mantener cuota_vigente = ultimo valor del historial (ver Fase 4.1),
   todo cambio de cuota debe dejar rastro.
   ----------------------------------------------------------------------------
   POLITICA DE ERRORES: el trigger que ESCRIBE (historial) usa TRY/CATCH;
   el validador de inmutabilidad usa THROW directo.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   trg_OpcionApuesta_HistorialCuota
   Tabla  : OpcionApuesta | Evento: INSERT, UPDATE
   Objetivo: registrar automaticamente la cuota en HistorialCuota al crear una
             opcion y cada vez que cambia su cuota vigente.
   Regla  : RN-10 / RN-11 (la apuesta congela la cuota; el cambio no la altera).
   Multi-fila: procesa todos los registros afectados por la sentencia.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_OpcionApuesta_HistorialCuota
ON dbo.OpcionApuesta
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        /* Alta de opcion */
        INSERT INTO dbo.HistorialCuota (id_opcion, valor_cuota, fecha_hora_cambio, motivo)
        SELECT i.id_opcion, i.cuota_vigente, SYSDATETIME(), N'Alta de opcion (trigger)'
        FROM inserted i
        WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.id_opcion = i.id_opcion);

        /* Cambio de cuota */
        INSERT INTO dbo.HistorialCuota (id_opcion, valor_cuota, fecha_hora_cambio, motivo)
        SELECT i.id_opcion, i.cuota_vigente, SYSDATETIME(), N'Cambio de cuota (trigger)'
        FROM inserted i
        JOIN deleted d ON d.id_opcion = i.id_opcion
        WHERE d.cuota_vigente <> i.cuota_vigente;
    END TRY
    BEGIN CATCH
        THROW 50206, N'No se pudo registrar el historial de cuota de la opcion.', 1;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   trg_HistorialCuota_NoEliminar
   Tabla  : HistorialCuota | Evento: DELETE
   Objetivo: el historial de cuotas es inmutable (trazabilidad).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_HistorialCuota_NoEliminar
ON dbo.HistorialCuota
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM deleted)
        THROW 50204, N'El historial de cuotas es inmutable: no se permite eliminarlo.', 1;
END
GO

PRINT 'triggers/03_cuotas.sql: 2 triggers creados.';
GO
