/* ============================================================================
   APUESTADB - procedures/03_apuestas.sql
   Procedimientos: registrar apuesta, liquidar apuesta, consultar historial.
   Requiere : database/01..05 y procedures/01, 02, 04, 06.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   usp_Apuesta_Registrar
   Objetivo    : registrar una apuesta simple, congelar la cuota y descontar el saldo.
   Parametros  : @id_usuario, @id_opcion, @id_tipo_saldo, @monto, @id_apuesta (OUTPUT)
   Validaciones: usuario activo, opcion habilitada, mercado abierto y vigente,
                 evento programado y no iniciado, monto > 0, saldo suficiente.
   Resultado   : id de la apuesta y confirmacion.
   Reglas      : RN-03, RN-07, RN-08, RN-09, RN-10, RN-12.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Apuesta_Registrar
    @id_usuario    INT,
    @id_opcion     INT,
    @id_tipo_saldo INT,
    @monto         DECIMAL(18,2),
    @id_apuesta    INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @id_mercado INT, @id_evento INT, @cuota DECIMAL(10,2), @opcion_estado VARCHAR(20),
            @mercado_estado VARCHAR(20), @mercado_cierre DATETIME2(3),
            @evento_estado VARCHAR(20), @evento_inicio DATETIME2(3),
            @id_saldo_cuenta INT, @propia BIT = 0;

    BEGIN TRY
        IF @monto IS NULL OR @monto <= 0 THROW 50067, N'El monto debe ser mayor que cero.', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario AND estado = 'activo')
            THROW 50066, N'El usuario no existe o no esta activo.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.TipoSaldo WHERE id_tipo_saldo = @id_tipo_saldo AND estado = 'vigente')
            THROW 50068, N'El tipo de saldo no es valido.', 1;

        SELECT @id_mercado = o.id_mercado, @cuota = o.cuota_vigente, @opcion_estado = o.estado
        FROM dbo.OpcionApuesta o WHERE o.id_opcion = @id_opcion;
        IF @id_mercado IS NULL THROW 50060, N'La opcion de apuesta no existe.', 1;
        IF @opcion_estado <> 'habilitada' THROW 50061, N'La opcion de apuesta no esta habilitada.', 1;

        SELECT @mercado_estado = m.estado, @mercado_cierre = m.fecha_cierre, @id_evento = m.id_evento
        FROM dbo.Mercado m WHERE m.id_mercado = @id_mercado;
        IF @mercado_estado <> 'abierto' THROW 50062, N'El mercado no esta abierto.', 1;
        IF @mercado_cierre <= SYSDATETIME() THROW 50063, N'El mercado ya cerro.', 1;

        SELECT @evento_estado = e.estado, @evento_inicio = e.fecha_hora_inicio
        FROM dbo.Evento e WHERE e.id_evento = @id_evento;
        IF @evento_estado <> 'programado' THROW 50064, N'El evento no esta disponible para apostar.', 1;
        IF @evento_inicio <= SYSDATETIME() THROW 50065, N'El evento ya inicio.', 1;

        SELECT @id_saldo_cuenta = id_saldo_cuenta
        FROM dbo.SaldoCuenta WHERE id_usuario = @id_usuario AND id_tipo_saldo = @id_tipo_saldo;
        IF @id_saldo_cuenta IS NULL THROW 50069, N'El usuario no tiene cuenta para ese tipo de saldo.', 1;
        IF (SELECT saldo_actual FROM dbo.SaldoCuenta WHERE id_saldo_cuenta = @id_saldo_cuenta) < @monto
            THROW 50044, N'Saldo insuficiente para la apuesta.', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        INSERT INTO dbo.Apuesta (id_usuario, id_opcion, id_tipo_saldo, monto, cuota_congelada, tipo_apuesta, estado, fecha_hora_registro)
        VALUES (@id_usuario, @id_opcion, @id_tipo_saldo, @monto, @cuota, 'simple', 'pendiente', SYSDATETIME());

        SET @id_apuesta = CAST(SCOPE_IDENTITY() AS INT);

        /* Descuento del saldo en la misma transaccion (RN-12) */
        EXEC dbo.usp_MovimientoSaldo_Registrar
             @id_saldo_cuenta = @id_saldo_cuenta,
             @nombre_movimiento = 'apuesta',
             @monto = @monto,
             @id_apuesta = @id_apuesta,
             @referencia = N'Descuento por registro de apuesta';

        EXEC dbo.usp_Auditoria_Registrar
             @operacion = N'Registrar apuesta', @entidad_afectada = N'Apuesta',
             @resultado = 'exito', @id_usuario = @id_usuario,
             @descripcion = N'Apuesta simple registrada con cuota congelada.';

        IF @propia = 1 COMMIT;

        SELECT @id_apuesta AS id_apuesta, N'Apuesta registrada correctamente.' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        DECLARE @descripcion_error NVARCHAR(500) = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Registrar apuesta', @entidad_afectada = N'Apuesta',
             @resultado = 'fallo', @id_usuario = @id_usuario,
             @descripcion = @descripcion_error;
        THROW;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   usp_Apuesta_Liquidar
   Objetivo    : liquidar una apuesta (o todas las pendientes de un evento).
   Parametros  : @id_apuesta (opc), @id_evento (opc), @id_administrador (opc)
   Validaciones: exactamente un criterio; apuesta/evento existentes; apuesta pendiente;
                 resultado oficial presente.
   Resultado   : cantidad de apuestas liquidadas.
   Reglas      : RN-04, RN-14, RN-15.
   Nota        : la opcion ganadora se DERIVA del marcador oficial (local/empate/visitante).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Apuesta_Liquidar
    @id_apuesta       INT = NULL,
    @id_evento        INT = NULL,
    @id_administrador INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @propia BIT = 0, @procesadas INT = 0;

    BEGIN TRY
        IF @id_apuesta IS NULL AND @id_evento IS NULL
            THROW 50070, N'Debe indicar la apuesta o el evento a liquidar.', 1;
        IF @id_apuesta IS NOT NULL AND @id_evento IS NOT NULL
            THROW 50071, N'Indique solo la apuesta o solo el evento, no ambos.', 1;

        IF @id_apuesta IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.Apuesta WHERE id_apuesta = @id_apuesta)
                THROW 50072, N'La apuesta no existe.', 1;
            IF EXISTS (SELECT 1 FROM dbo.Liquidacion WHERE id_apuesta = @id_apuesta)
                THROW 50075, N'La apuesta ya fue liquidada.', 1;
        END
        IF @id_evento IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE id_evento = @id_evento)
            THROW 50073, N'El evento no existe.', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
            SELECT a.id_apuesta, a.id_usuario, a.id_tipo_saldo, a.monto, a.cuota_congelada,
                   o.etiqueta, r.id_resultado, r.marcador_local, r.marcador_visitante
            FROM dbo.Apuesta a
            JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
            JOIN dbo.Mercado m ON m.id_mercado = o.id_mercado
            JOIN dbo.Resultado r ON r.id_evento = m.id_evento AND r.estado = 'oficial'
            WHERE a.estado = 'pendiente'
              AND ((@id_apuesta IS NOT NULL AND a.id_apuesta = @id_apuesta)
                OR (@id_evento IS NOT NULL AND m.id_evento = @id_evento));

        DECLARE @ape INT, @usr INT, @tsaldo INT, @monto DECIMAL(18,2), @cuota DECIMAL(10,2),
                @etiqueta VARCHAR(20), @res INT, @ml SMALLINT, @mv SMALLINT,
                @ganadora VARCHAR(20), @idsaldo INT, @premio DECIMAL(18,2), @liq VARCHAR(20);

        OPEN cur;
        FETCH NEXT FROM cur INTO @ape, @usr, @tsaldo, @monto, @cuota, @etiqueta, @res, @ml, @mv;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @ganadora = CASE WHEN @ml > @mv THEN 'local'
                                 WHEN @ml < @mv THEN 'visitante'
                                 ELSE 'empate' END;

            IF @etiqueta = @ganadora
            BEGIN
                SET @liq = 'ganada';
                SET @premio = CAST(@monto * @cuota AS DECIMAL(18,2));
            END
            ELSE
            BEGIN
                SET @liq = 'perdida';
                SET @premio = 0;
            END

            SELECT @idsaldo = id_saldo_cuenta FROM dbo.SaldoCuenta
            WHERE id_usuario = @usr AND id_tipo_saldo = @tsaldo;
            IF @idsaldo IS NULL THROW 50074, N'No existe la cuenta de saldo del usuario.', 1;

            INSERT INTO dbo.Liquidacion (id_apuesta, id_resultado, resultado_liquidacion, monto_premio, fecha_hora, estado)
            VALUES (@ape, @res, @liq, @premio, SYSDATETIME(), 'aplicada');

            IF @premio > 0
            BEGIN
                EXEC dbo.usp_MovimientoSaldo_Registrar
                     @id_saldo_cuenta = @idsaldo,
                     @nombre_movimiento = 'premio',
                     @monto = @premio,
                     @id_apuesta = @ape,
                     @referencia = N'Premio por apuesta ganada';
            END

            UPDATE dbo.Apuesta SET estado = @liq WHERE id_apuesta = @ape;

            EXEC dbo.usp_Notificacion_Crear
                 @id_usuario = @usr,
                 @mensaje = N'Tu apuesta fue liquidada.',
                 @tipo = N'liquidacion';

            SET @procesadas = @procesadas + 1;
            FETCH NEXT FROM cur INTO @ape, @usr, @tsaldo, @monto, @cuota, @etiqueta, @res, @ml, @mv;
        END

        CLOSE cur;
        DEALLOCATE cur;

        EXEC dbo.usp_Auditoria_Registrar
             @operacion = N'Liquidar apuesta', @entidad_afectada = N'Liquidacion',
             @resultado = 'exito', @id_usuario = @id_administrador,
             @descripcion = N'Proceso de liquidacion ejecutado.';

        IF @propia = 1 COMMIT;

        SELECT @procesadas AS apuestas_liquidadas, N'Liquidacion finalizada.' AS mensaje;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local','cur') >= 0 CLOSE cur;
        IF CURSOR_STATUS('local','cur') >= -1 DEALLOCATE cur;
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        DECLARE @descripcion_error NVARCHAR(500) = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Liquidar apuesta', @entidad_afectada = N'Liquidacion',
             @resultado = 'fallo', @id_usuario = @id_administrador,
             @descripcion = @descripcion_error;
        THROW;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   usp_Apuesta_Historial
   Objetivo    : consultar el historial de apuestas de un usuario.
   Parametros  : @id_usuario, @estado (opc)
   Validaciones: el usuario existe.
   Resultado   : apuestas con evento, mercado, opcion, cuota, monto y liquidacion.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Apuesta_Historial
    @id_usuario INT,
    @estado     VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE id_usuario = @id_usuario)
        THROW 50100, N'El usuario no existe.', 1;

    SELECT a.id_apuesta, a.fecha_hora_registro, a.tipo_apuesta, a.estado,
           d.nombre  AS deporte, l.nombre AS liga,
           el.nombre AS equipo_local, ev.nombre AS equipo_visitante,
           m.nombre  AS mercado, o.etiqueta AS opcion,
           a.cuota_congelada, a.monto, ts.nombre AS tipo_saldo,
           li.resultado_liquidacion, li.monto_premio
    FROM dbo.Apuesta a
    JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
    JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
    JOIN dbo.Evento e        ON e.id_evento = m.id_evento
    JOIN dbo.Equipo el       ON el.id_equipo = e.id_equipo_local
    JOIN dbo.Equipo ev       ON ev.id_equipo = e.id_equipo_visitante
    JOIN dbo.Temporada t     ON t.id_temporada = e.id_temporada
    JOIN dbo.Liga l          ON l.id_liga = t.id_liga
    JOIN dbo.Deporte d       ON d.id_deporte = l.id_deporte
    JOIN dbo.TipoSaldo ts    ON ts.id_tipo_saldo = a.id_tipo_saldo
    LEFT JOIN dbo.Liquidacion li ON li.id_apuesta = a.id_apuesta
    WHERE a.id_usuario = @id_usuario
      AND (@estado IS NULL OR a.estado = @estado)
    ORDER BY a.fecha_hora_registro DESC;
END
GO

PRINT '03_apuestas.sql: 3 procedimientos creados.';
GO
