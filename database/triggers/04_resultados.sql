/* ============================================================================
   APUESTADB - triggers/04_resultados.sql
   Triggers de consistencia y proteccion de resultados.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   trg_Resultado_Consistencia
   Tabla  : Resultado | Evento: INSERT, UPDATE
   Objetivo: garantizar que el resultado sea coherente con el evento.
   Validaciones:
     - el evento no puede estar cancelado ni suspendido;
     - los marcadores no pueden ser negativos;
     - no puede haber mas de un resultado por evento (redundante con UNIQUE,
       pero con mensaje claro para cargas por lote).
   Multi-fila: valida el conjunto `inserted`.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Resultado_Consistencia
ON dbo.Resultado
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.Evento e ON e.id_evento = i.id_evento
               WHERE e.estado IN ('cancelado','suspendido'))
        THROW 50210, N'No se puede registrar un resultado de un evento cancelado o suspendido.', 1;

    IF EXISTS (SELECT 1 FROM inserted WHERE marcador_local < 0 OR marcador_visitante < 0)
        THROW 50211, N'Los marcadores no pueden ser negativos.', 1;

    IF EXISTS (SELECT 1 FROM inserted GROUP BY id_evento HAVING COUNT(*) > 1)
        THROW 50212, N'No puede haber mas de un resultado por evento.', 1;
END
GO

/* ----------------------------------------------------------------------------
   trg_Resultado_NoEliminar
   Tabla  : Resultado | Evento: DELETE
   Objetivo: impedir eliminar resultados oficiales o con liquidaciones asociadas.
   Nota   : se permite borrar un resultado 'provisional' que no tenga liquidaciones.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Resultado_NoEliminar
ON dbo.Resultado
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM deleted d
               WHERE d.estado = 'oficial'
                  OR EXISTS (SELECT 1 FROM dbo.Liquidacion l WHERE l.id_resultado = d.id_resultado))
        THROW 50213, N'No se puede eliminar un resultado oficial o con liquidaciones asociadas.', 1;
END
GO

PRINT 'triggers/04_resultados.sql: 2 triggers creados.';
GO
