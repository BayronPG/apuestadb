/* ============================================================================
   APUESTADB - procedures/02_saldo.sql
   Procedimientos: consulta de saldo, registro de movimiento y creacion de recarga.
   Requiere : database/01..05 y procedures/01 y 06.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   usp_Saldo_Consultar
   Objetivo    : consultar el saldo del usuario por tipo (tokens y PSE).
   Parametros  : @id_usuario
   Validaciones: el usuario existe.
   Resultado   : filas con tipo de saldo, saldo actual y fecha de actualizacion.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Saldo_Consultar
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
        THROW 50030, N'El usuario no existe.', 1;

    SELECT sc.id_saldo_cuenta,
           ts.nombre       AS tipo_saldo,
           sc.saldo_actual,
           sc.fecha_ultima_actualizacion
    FROM dbo.SaldoCuenta sc
    JOIN dbo.TipoSaldo ts ON ts.id_tipo_saldo = sc.id_tipo_saldo
    WHERE sc.id_usuario = @id_usuario
    ORDER BY ts.nombre;
END
GO

/* ----------------------------------------------------------------------------
   usp_MovimientoSaldo_Registrar
   Objetivo    : aplicar un debito/credito y registrar el movimiento (primitiva).
   Parametros  : @id_saldo_cuenta, @nombre_movimiento, @monto, @id_apuesta,
                 @id_recarga, @referencia, @id_movimiento (OUTPUT)
   Validaciones: monto > 0, origen excluyente, tipo de movimiento valido,
                 cuenta existente, saldo suficiente en debitos.
   Resultado   : id del movimiento y saldo resultante.
   Nota        : si no hay transaccion activa, abre una propia (actualiza saldo y
                 registra el movimiento de forma atomica).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_MovimientoSaldo_Registrar
    @id_saldo_cuenta   INT,
    @nombre_movimiento VARCHAR(20),
    @monto             DECIMAL(18,2),
    @id_apuesta        INT = NULL,
    @id_recarga        INT = NULL,
    @referencia        NVARCHAR(100) = NULL,
    @id_movimiento     BIGINT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @id_tipo_movimiento INT, @naturaleza VARCHAR(10),
            @saldo_actual DECIMAL(18,2), @nuevo_saldo DECIMAL(18,2), @propia BIT = 0;

    BEGIN TRY
        IF @monto IS NULL OR @monto <= 0 THROW 50040, N'El monto debe ser mayor que cero.', 1;
        IF @id_apuesta IS NOT NULL AND @id_recarga IS NOT NULL
            THROW 50041, N'El movimiento no puede originarse en apuesta y recarga a la vez.', 1;

        SELECT @id_tipo_movimiento = id_tipo_movimiento, @naturaleza = naturaleza
        FROM dbo.TipoMovimientoSaldo WHERE nombre = @nombre_movimiento;
        IF @id_tipo_movimiento IS NULL THROW 50042, N'Tipo de movimiento no valido.', 1;

        SELECT @saldo_actual = saldo_actual
        FROM dbo.SaldoCuenta WITH (UPDLOCK, ROWLOCK)
        WHERE id_saldo_cuenta = @id_saldo_cuenta;
        IF @saldo_actual IS NULL THROW 50043, N'La cuenta de saldo no existe.', 1;

        SET @nuevo_saldo = CASE WHEN @naturaleza = 'debito'
                                THEN @saldo_actual - @monto
                                ELSE @saldo_actual + @monto END;
        IF @nuevo_saldo < 0 THROW 50044, N'Saldo insuficiente para el movimiento.', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        UPDATE dbo.SaldoCuenta
        SET saldo_actual = @nuevo_saldo,
            fecha_ultima_actualizacion = SYSDATETIME()
        WHERE id_saldo_cuenta = @id_saldo_cuenta;

        INSERT INTO dbo.MovimientoSaldo
            (id_saldo_cuenta, id_tipo_movimiento, id_apuesta, id_recarga, monto, saldo_resultante, fecha_hora, referencia)
        VALUES
            (@id_saldo_cuenta, @id_tipo_movimiento, @id_apuesta, @id_recarga, @monto, @nuevo_saldo, SYSDATETIME(), @referencia);

        SET @id_movimiento = SCOPE_IDENTITY();

        IF @propia = 1 COMMIT;

        SELECT @id_movimiento AS id_movimiento, @nuevo_saldo AS saldo_resultante;
    END TRY
    BEGIN CATCH
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   usp_Recarga_Crear
   Objetivo    : registrar una recarga ficticia y abonarla al saldo.
   Parametros  : @id_usuario, @id_tipo_saldo, @monto, @id_administrador,
                 @observacion, @id_recarga (OUTPUT)
   Validaciones: usuario activo, tipo de saldo valido, monto > 0,
                 administrador valido si se informa.
   Resultado   : id de la recarga y confirmacion.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Recarga_Crear
    @id_usuario       INT,
    @id_tipo_saldo    INT,
    @monto            DECIMAL(18,2),
    @id_administrador INT = NULL,
    @observacion      NVARCHAR(255) = NULL,
    @id_recarga       INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @id_saldo_cuenta INT, @propia BIT = 0;

    BEGIN TRY
        IF @monto IS NULL OR @monto <= 0 THROW 50050, N'El monto de la recarga debe ser mayor que cero.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario AND estado = 'activo')
            THROW 50051, N'El usuario no existe o no esta activo.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.TipoSaldo WHERE id_tipo_saldo = @id_tipo_saldo AND estado = 'vigente')
            THROW 50052, N'El tipo de saldo no es valido.', 1;
        IF @id_administrador IS NOT NULL AND NOT EXISTS
            (SELECT 1 FROM dbo.Usuario u JOIN dbo.Rol r ON r.id_rol = u.id_rol
             WHERE u.id_usuario = @id_administrador AND r.nombre = 'administrador')
            THROW 50053, N'El administrador indicado no es valido.', 1;

        SELECT @id_saldo_cuenta = id_saldo_cuenta FROM dbo.SaldoCuenta
        WHERE id_usuario = @id_usuario AND id_tipo_saldo = @id_tipo_saldo;
        IF @id_saldo_cuenta IS NULL THROW 50054, N'El usuario no tiene cuenta para ese tipo de saldo.', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        INSERT INTO dbo.Recarga (id_usuario, id_tipo_saldo, monto, fecha_hora, estado, observacion)
        VALUES (@id_usuario, @id_tipo_saldo, @monto, SYSDATETIME(), 'aplicada', @observacion);

        SET @id_recarga = CAST(SCOPE_IDENTITY() AS INT);

        EXEC dbo.usp_MovimientoSaldo_Registrar
             @id_saldo_cuenta = @id_saldo_cuenta,
             @nombre_movimiento = 'recarga',
             @monto = @monto,
             @id_recarga = @id_recarga,
             @referencia = N'Recarga de saldo ficticio';

        EXEC dbo.usp_Notificacion_Crear
             @id_usuario = @id_usuario,
             @mensaje = N'Se acredito una recarga de saldo ficticio.',
             @tipo = N'recarga';

        EXEC dbo.usp_Auditoria_Registrar
             @operacion = N'Crear recarga', @entidad_afectada = N'Recarga',
             @resultado = 'exito', @id_usuario = @id_administrador,
             @descripcion = N'Recarga de saldo ficticio aplicada.';

        IF @propia = 1 COMMIT;

        SELECT @id_recarga AS id_recarga, N'Recarga aplicada correctamente.' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        DECLARE @descripcion_error NVARCHAR(500) = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Crear recarga', @entidad_afectada = N'Recarga',
             @resultado = 'fallo', @id_usuario = @id_administrador,
             @descripcion = @descripcion_error;
        THROW;
    END CATCH
END
GO

PRINT '02_saldo.sql: 3 procedimientos creados.';
GO
