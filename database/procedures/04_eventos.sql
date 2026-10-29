/* ============================================================================
   APUESTADB - procedures/04_eventos.sql
   Procedimientos: registro de resultado de evento y creacion de notificacion.
   Requiere : database/01..05 y procedures/06.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   usp_Evento_RegistrarResultado
   Objetivo    : registrar el resultado oficial (marcador) de un evento.
   Parametros  : @id_evento, @marcador_local, @marcador_visitante,
                 @estado ('oficial'|'provisional'), @id_administrador (opc),
                 @id_resultado (OUTPUT)
   Validaciones: evento existente y no cancelado; marcadores >= 0; primer resultado.
   Resultado   : id del resultado y confirmacion.
   Regla       : RN-15 (el resultado oficial habilita la liquidacion).
   Nota        : la opcion ganadora del mercado 1X2 se DERIVA del marcador.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Evento_RegistrarResultado
    @id_evento          INT,
    @marcador_local     SMALLINT,
    @marcador_visitante SMALLINT,
    @estado             VARCHAR(20) = 'oficial',
    @id_administrador   INT = NULL,
    @id_resultado       INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @propia BIT = 0;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE id_evento = @id_evento)
            THROW 50080, N'El evento no existe.', 1;
        IF @marcador_local IS NULL OR @marcador_visitante IS NULL
           OR @marcador_local < 0 OR @marcador_visitante < 0
            THROW 50081, N'Los marcadores deben ser mayores o iguales a cero.', 1;
        IF @estado IS NULL OR @estado NOT IN ('oficial','provisional')
            THROW 50082, N'El estado del resultado no es valido.', 1;
        IF EXISTS (SELECT 1 FROM dbo.Evento WHERE id_evento = @id_evento AND estado = 'cancelado')
            THROW 50083, N'No se puede registrar el resultado de un evento cancelado.', 1;
        IF EXISTS (SELECT 1 FROM dbo.Resultado WHERE id_evento = @id_evento)
            THROW 50084, N'El evento ya tiene un resultado registrado.', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        INSERT INTO dbo.Resultado (id_evento, marcador_local, marcador_visitante, fecha_registro, estado)
        VALUES (@id_evento, @marcador_local, @marcador_visitante, SYSDATETIME(), @estado);

        SET @id_resultado = CAST(SCOPE_IDENTITY() AS INT);

        IF @estado = 'oficial'
            UPDATE dbo.Evento SET estado = 'finalizado' WHERE id_evento = @id_evento;

        EXEC dbo.usp_Auditoria_Registrar
             @operacion = N'Registrar resultado', @entidad_afectada = N'Resultado',
             @resultado = 'exito', @id_usuario = @id_administrador,
             @descripcion = N'Resultado de evento registrado.';

        IF @propia = 1 COMMIT;

        SELECT @id_resultado AS id_resultado, N'Resultado registrado correctamente.' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        DECLARE @descripcion_error NVARCHAR(500) = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Registrar resultado', @entidad_afectada = N'Resultado',
             @resultado = 'fallo', @id_usuario = @id_administrador,
             @descripcion = @descripcion_error;
        THROW;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   usp_Notificacion_Crear
   Objetivo    : crear una notificacion para un usuario.
   Parametros  : @id_usuario, @mensaje, @tipo, @id_notificacion (OUTPUT)
   Validaciones: usuario existente; mensaje y tipo obligatorios.
   Resultado   : id de la notificacion creada.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Notificacion_Crear
    @id_usuario      INT,
    @mensaje         NVARCHAR(500),
    @tipo            NVARCHAR(40),
    @id_notificacion BIGINT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
        THROW 50090, N'El usuario no existe.', 1;
    IF @mensaje IS NULL OR LTRIM(RTRIM(@mensaje)) = ''
        THROW 50091, N'El mensaje de la notificacion es obligatorio.', 1;
    IF @tipo IS NULL OR LTRIM(RTRIM(@tipo)) = ''
        THROW 50092, N'El tipo de notificacion es obligatorio.', 1;

    INSERT INTO dbo.Notificacion (id_usuario, mensaje, tipo, fecha_hora, estado)
    VALUES (@id_usuario, @mensaje, @tipo, SYSDATETIME(), 'no_leida');

    SET @id_notificacion = SCOPE_IDENTITY();

    SELECT @id_notificacion AS id_notificacion, N'Notificacion creada.' AS confirmacion;
END
GO

PRINT '04_eventos.sql: 2 procedimientos creados.';
GO
