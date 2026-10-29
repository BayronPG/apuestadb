/* ============================================================================
   APUESTADB - triggers/01_auditoria.sql
   Triggers de auditoria automatica de cambios y trazabilidad administrativa.
   ----------------------------------------------------------------------------
   POLITICA DE ERRORES (buenas practicas):
   - Los triggers que ESCRIBEN (auditoria) envuelven su cuerpo en TRY/CATCH y
     convierten cualquier fallo en un mensaje claro con THROW.
   - El login de la sesion se registra en la descripcion (Auditoria.id_usuario
     es FK a Usuario y puede ser NULL para acciones administrativas directas).
   ----------------------------------------------------------------------------
   NOTA DE DISENO (evitar duplicidad):
   Los procedimientos de la Fase 7 ya auditan sus operaciones de negocio. Estos
   triggers cubren lo que los procedimientos NO auditan: cambios/borrados de
   Usuario y cambios en los catalogos (Evento, Mercado, OpcionApuesta).
   ----------------------------------------------------------------------------
   Buenas practicas: inserted/deleted, manejo multi-fila (conjuntos), TRY/CATCH.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   trg_Usuario_Auditoria
   Tabla  : Usuario | Evento: UPDATE, DELETE
   Objetivo: trazar modificaciones y bajas de usuarios (el alta la audita
             usp_Usuario_Registrar).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Usuario_Auditoria
ON dbo.Usuario
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        /* UPDATE */
        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'UPDATE Usuario', N'Usuario',
               N'Usuario id=' + CAST(i.id_usuario AS NVARCHAR(20))
                 + N'; estado=' + i.estado + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM inserted i
        JOIN deleted  d ON d.id_usuario = i.id_usuario;

        /* DELETE */
        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'DELETE Usuario', N'Usuario',
               N'Usuario id=' + CAST(d.id_usuario AS NVARCHAR(20))
                 + N'; correo=' + d.correo + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM deleted d
        WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id_usuario = d.id_usuario);
    END TRY
    BEGIN CATCH
        THROW 50200, N'No se pudo registrar la auditoria del cambio en Usuario.', 1;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   trg_Evento_Auditoria
   Tabla  : Evento | Evento: INSERT, UPDATE, DELETE
   Objetivo: trazabilidad de operaciones administrativas sobre el calendario.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Evento_Auditoria
ON dbo.Evento
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'INSERT Evento', N'Evento',
               N'Evento id=' + CAST(i.id_evento AS NVARCHAR(20)) + N'; estado=' + i.estado
                 + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM inserted i
        WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.id_evento = i.id_evento);

        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'UPDATE Evento', N'Evento',
               N'Evento id=' + CAST(i.id_evento AS NVARCHAR(20))
                 + N'; estado=' + d.estado + N'->' + i.estado
                 + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM inserted i
        JOIN deleted  d ON d.id_evento = i.id_evento;

        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'DELETE Evento', N'Evento',
               N'Evento id=' + CAST(d.id_evento AS NVARCHAR(20)) + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM deleted d
        WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id_evento = d.id_evento);
    END TRY
    BEGIN CATCH
        THROW 50200, N'No se pudo registrar la auditoria del cambio en Evento.', 1;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   trg_Mercado_Auditoria
   Tabla  : Mercado | Evento: INSERT, UPDATE, DELETE
   Objetivo: trazabilidad de la apertura/cierre de mercados de apuesta.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_Mercado_Auditoria
ON dbo.Mercado
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'INSERT Mercado', N'Mercado',
               N'Mercado id=' + CAST(i.id_mercado AS NVARCHAR(20)) + N'; estado=' + i.estado
                 + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM inserted i
        WHERE NOT EXISTS (SELECT 1 FROM deleted d WHERE d.id_mercado = i.id_mercado);

        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'UPDATE Mercado', N'Mercado',
               N'Mercado id=' + CAST(i.id_mercado AS NVARCHAR(20))
                 + N'; estado=' + d.estado + N'->' + i.estado
                 + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM inserted i
        JOIN deleted  d ON d.id_mercado = i.id_mercado;

        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'DELETE Mercado', N'Mercado',
               N'Mercado id=' + CAST(d.id_mercado AS NVARCHAR(20)) + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM deleted d
        WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id_mercado = d.id_mercado);
    END TRY
    BEGIN CATCH
        THROW 50200, N'No se pudo registrar la auditoria del cambio en Mercado.', 1;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   trg_OpcionApuesta_Auditoria
   Tabla  : OpcionApuesta | Evento: UPDATE, DELETE
   Objetivo: trazar cambios de estado/borrado de opciones (el alta y los cambios
             de cuota quedan en HistorialCuota, ver 03_cuotas.sql).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER dbo.trg_OpcionApuesta_Auditoria
ON dbo.OpcionApuesta
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'UPDATE OpcionApuesta', N'OpcionApuesta',
               N'Opcion id=' + CAST(i.id_opcion AS NVARCHAR(20))
                 + N'; estado=' + d.estado + N'->' + i.estado
                 + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM inserted i
        JOIN deleted  d ON d.id_opcion = i.id_opcion;

        INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
        SELECT NULL, N'DELETE OpcionApuesta', N'OpcionApuesta',
               N'Opcion id=' + CAST(d.id_opcion AS NVARCHAR(20)) + N'; login=' + ORIGINAL_LOGIN(),
               SYSDATETIME(), 'exito', NULL
        FROM deleted d
        WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id_opcion = d.id_opcion);
    END TRY
    BEGIN CATCH
        THROW 50200, N'No se pudo registrar la auditoria del cambio en OpcionApuesta.', 1;
    END CATCH
END
GO

PRINT 'triggers/01_auditoria.sql: 4 triggers creados.';
GO
