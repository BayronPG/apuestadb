/* ============================================================================
   APUESTADB - triggers/05_liquidacion.sql
   Triggers de validacion y proteccion de liquidaciones.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   trg_Liquidacion_Validar
   Tabla  : Liquidacion | Evento: INSERT, UPDATE
   Objetivo: asegurar que la liquidacion sea coherente con la apuesta y el resultado.
   Validaciones:
     - el resultado debe estar en estado 'oficial';
     - el resultado debe pertenecer al mismo evento de la apuesta;
     - el premio debe coincidir con el desenlace (ganada: monto x cuota; perdida: 0);
     - no puede haber mas de una liquidacion por apuesta (RN-14).
   Multi-fila: valida el conjunto `inserted`.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Liquidacion_Validar
ON dbo.Liquidacion
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.Resultado r ON r.id_resultado = i.id_resultado
               WHERE r.estado <> 'oficial')
        THROW 50220, N'Solo se puede liquidar con un resultado en estado oficial.', 1;

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.Apuesta a       ON a.id_apuesta = i.id_apuesta
               JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
               JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
               JOIN dbo.Resultado r     ON r.id_resultado = i.id_resultado
               WHERE m.id_evento <> r.id_evento)
        THROW 50221, N'El resultado no corresponde al evento de la apuesta.', 1;

    IF EXISTS (SELECT 1
               FROM inserted i
               JOIN dbo.Apuesta a ON a.id_apuesta = i.id_apuesta
               WHERE (i.resultado_liquidacion = 'perdida' AND i.monto_premio <> 0)
                  OR (i.resultado_liquidacion = 'ganada'
                      AND i.monto_premio <> CAST(a.monto * a.cuota_congelada AS DECIMAL(18,2))))
        THROW 50222, N'El monto del premio no es coherente con el desenlace de la liquidacion.', 1;

    IF EXISTS (SELECT 1 FROM inserted GROUP BY id_apuesta HAVING COUNT(*) > 1)
        THROW 50223, N'No puede haber mas de una liquidacion por apuesta.', 1;
END
GO

/* ----------------------------------------------------------------------------
   trg_Liquidacion_NoEliminar
   Tabla  : Liquidacion | Evento: DELETE
   Objetivo: las liquidaciones son inmutables (trazabilidad del cierre de apuestas).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Liquidacion_NoEliminar
ON dbo.Liquidacion
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM deleted)
        THROW 50224, N'Las liquidaciones son inmutables: no se permite eliminarlas.', 1;
END
GO

PRINT 'triggers/05_liquidacion.sql: 2 triggers creados.';
GO
