/* ============================================================================
   APUESTADB - procedures/01_auth.sql
   Procedimientos: registro de usuario, inicio de sesion y recuperacion de clave.
   Requiere : database/01..05 ejecutados y database/procedures/06 (auditoria).
   Convencion: prefijo usp_ ; errores con THROW ; TRY/CATCH ; transacciones.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   usp_Usuario_Registrar
   Objetivo    : registrar un usuario y crear sus cuentas de saldo en cero.
   Parametros  : @nombres, @apellidos, @correo, @contrasena_hash, @telefono,
                 @id_usuario (OUTPUT)
   Validaciones: campos obligatorios, formato de correo, correo/telefono unicos,
                 existencia del rol 'usuario'.
   Resultado   : id del usuario creado + mensaje.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Usuario_Registrar
    @nombres         NVARCHAR(100),
    @apellidos       NVARCHAR(100),
    @correo          NVARCHAR(150),
    @contrasena_hash VARCHAR(255),
    @telefono        NVARCHAR(20) = NULL,
    @id_usuario      INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @id_rol INT, @propia BIT = 0;

    BEGIN TRY
        IF @nombres IS NULL OR LTRIM(RTRIM(@nombres)) = '' THROW 50001, N'El nombre es obligatorio.', 1;
        IF @apellidos IS NULL OR LTRIM(RTRIM(@apellidos)) = '' THROW 50002, N'El apellido es obligatorio.', 1;
        IF @correo IS NULL OR LTRIM(RTRIM(@correo)) = '' OR @correo NOT LIKE N'%_@_%._%' THROW 50003, N'El correo no es valido.', 1;
        IF @contrasena_hash IS NULL OR LEN(@contrasena_hash) < 20 THROW 50004, N'La credencial (hash) no es valida.', 1;
        IF EXISTS (SELECT 1 FROM dbo.Usuario WHERE correo = @correo) THROW 50005, N'El correo ya esta registrado.', 1;
        IF @telefono IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Usuario WHERE telefono = @telefono) THROW 50006, N'El telefono ya esta registrado.', 1;

        SELECT @id_rol = id_rol FROM dbo.Rol WHERE nombre = 'usuario' AND estado = 'vigente';
        IF @id_rol IS NULL THROW 50007, N'No existe el rol "usuario" (ejecute 05_seed_data.sql).', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        INSERT INTO dbo.Usuario (id_rol, nombres, apellidos, correo, contrasena, telefono, estado, fecha_registro)
        VALUES (@id_rol, LTRIM(RTRIM(@nombres)), LTRIM(RTRIM(@apellidos)), LTRIM(RTRIM(@correo)),
                @contrasena_hash, @telefono, 'activo', SYSDATETIME());

        SET @id_usuario = CAST(SCOPE_IDENTITY() AS INT);

        /* Saldos iniciales en cero para cada tipo de saldo (RN-02) */
        INSERT INTO dbo.SaldoCuenta (id_usuario, id_tipo_saldo, saldo_actual, fecha_ultima_actualizacion)
        SELECT @id_usuario, ts.id_tipo_saldo, 0, SYSDATETIME()
        FROM dbo.TipoSaldo ts
        WHERE ts.estado = 'vigente';

        IF NOT EXISTS (SELECT 1 FROM dbo.SaldoCuenta WHERE id_usuario = @id_usuario)
            THROW 50008, N'No se pudieron crear las cuentas de saldo.', 1;

        EXEC dbo.usp_Auditoria_Registrar
             @operacion = N'Registrar usuario', @entidad_afectada = N'Usuario',
             @resultado = 'exito', @id_usuario = @id_usuario,
             @descripcion = N'Alta de usuario con saldos iniciales en cero.';

        IF @propia = 1 COMMIT;

        SELECT @id_usuario AS id_usuario, N'Usuario registrado correctamente.' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        EXEC dbo.usp_Auditoria_Registrar
             @operacion = N'Registrar usuario', @entidad_afectada = N'Usuario',
             @resultado = 'fallo', @descripcion = N'Fallo al registrar usuario.';
        THROW;
    END CATCH
END
GO

/* ----------------------------------------------------------------------------
   usp_Auth_IniciarSesion
   Objetivo    : validar credenciales y devolver los datos de sesion del usuario.
   Parametros  : @correo, @contrasena_hash, @direccion_origen (opc),
                 @id_usuario/@id_rol/@nombre_rol (OUTPUT)
   Validaciones: parametros presentes, usuario existente y activo, hash coincidente.
   Resultado   : datos del usuario y su rol; acceso auditado (exito/fallo).
   Nota        : la comparacion es por igualdad de hash. Si el backend usa un hash
                 con sal aleatoria (bcrypt), la verificacion se hace en el backend y
                 este procedimiento se usa para obtener la credencial y auditar.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Auth_IniciarSesion
    @correo           NVARCHAR(150),
    @contrasena_hash  VARCHAR(255),
    @direccion_origen VARCHAR(45) = NULL,
    @id_usuario       INT = NULL OUTPUT,
    @id_rol           INT = NULL OUTPUT,
    @nombre_rol       VARCHAR(20) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @correo IS NULL OR @contrasena_hash IS NULL THROW 50010, N'Debe indicar correo y contrasena.', 1;

    DECLARE @estado VARCHAR(20), @hash VARCHAR(255);

    SELECT @id_usuario = u.id_usuario, @estado = u.estado, @hash = u.contrasena,
           @id_rol = u.id_rol, @nombre_rol = r.nombre
    FROM dbo.Usuario u
    JOIN dbo.Rol r ON r.id_rol = u.id_rol
    WHERE u.correo = @correo;

    IF @id_usuario IS NULL
    BEGIN
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Iniciar sesion', @entidad_afectada = N'Usuario',
             @resultado = 'fallo', @descripcion = N'Correo no encontrado.', @direccion_origen = @direccion_origen;
        THROW 50011, N'Credenciales invalidas.', 1;
    END

    IF @estado <> 'activo'
    BEGIN
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Iniciar sesion', @entidad_afectada = N'Usuario',
             @resultado = 'fallo', @id_usuario = @id_usuario, @descripcion = N'Usuario inhabilitado.',
             @direccion_origen = @direccion_origen;
        THROW 50012, N'El usuario esta inhabilitado.', 1;
    END

    IF @hash <> @contrasena_hash
    BEGIN
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Iniciar sesion', @entidad_afectada = N'Usuario',
             @resultado = 'fallo', @id_usuario = @id_usuario, @descripcion = N'Contrasena incorrecta.',
             @direccion_origen = @direccion_origen;
        THROW 50013, N'Credenciales invalidas.', 1;
    END

    EXEC dbo.usp_Auditoria_Registrar @operacion = N'Iniciar sesion', @entidad_afectada = N'Usuario',
         @resultado = 'exito', @id_usuario = @id_usuario, @descripcion = N'Acceso correcto.',
         @direccion_origen = @direccion_origen;

    SELECT @id_usuario AS id_usuario, @id_rol AS id_rol, @nombre_rol AS rol, N'Acceso correcto.' AS mensaje;
END
GO

/* ----------------------------------------------------------------------------
   usp_Auth_RecuperarContrasena
   Objetivo    : solicitar un token de recuperacion o restablecer la contrasena.
   Parametros  : @accion ('solicitar' | 'restablecer'), @correo, @valor_token,
                 @nueva_contrasena_hash, @valor_token_generado (OUTPUT)
   Validaciones: accion valida, usuario activo, token vigente y no expirado,
                 nueva credencial valida.
   Resultado   : token generado (solicitar) o confirmacion (restablecer).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Auth_RecuperarContrasena
    @accion                VARCHAR(20),
    @correo                NVARCHAR(150),
    @valor_token           VARCHAR(128) = NULL,
    @nueva_contrasena_hash VARCHAR(255) = NULL,
    @valor_token_generado  VARCHAR(128) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @id_usuario INT, @id_token INT, @propia BIT = 0;

    BEGIN TRY
        IF @accion IS NULL OR @accion NOT IN ('solicitar','restablecer') THROW 50020, N'Accion no valida.', 1;
        IF @correo IS NULL OR LTRIM(RTRIM(@correo)) = '' THROW 50021, N'El correo es obligatorio.', 1;

        SELECT @id_usuario = id_usuario FROM dbo.Usuario WHERE correo = @correo AND estado = 'activo';
        IF @id_usuario IS NULL THROW 50022, N'No existe un usuario activo con ese correo.', 1;

        IF @@TRANCOUNT = 0 BEGIN BEGIN TRAN; SET @propia = 1; END

        IF @accion = 'solicitar'
        BEGIN
            UPDATE dbo.TokenRecuperacion SET estado = 'expirado'
            WHERE id_usuario = @id_usuario AND estado = 'vigente';

            SET @valor_token_generado = REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', '')
                                      + REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', '');

            INSERT INTO dbo.TokenRecuperacion (id_usuario, valor_token, fecha_emision, fecha_expiracion, estado)
            VALUES (@id_usuario, @valor_token_generado, SYSDATETIME(), DATEADD(MINUTE, 30, SYSDATETIME()), 'vigente');

            EXEC dbo.usp_Auditoria_Registrar @operacion = N'Solicitar recuperacion', @entidad_afectada = N'TokenRecuperacion',
                 @resultado = 'exito', @id_usuario = @id_usuario, @descripcion = N'Token de recuperacion generado.';

            IF @propia = 1 COMMIT;

            SELECT @valor_token_generado AS valor_token, N'Token generado (vigencia 30 minutos).' AS mensaje;
        END
        ELSE
        BEGIN
            IF @valor_token IS NULL OR @nueva_contrasena_hash IS NULL OR LEN(@nueva_contrasena_hash) < 20
                THROW 50023, N'Debe indicar el token y la nueva credencial.', 1;

            SELECT @id_token = id_token FROM dbo.TokenRecuperacion
            WHERE id_usuario = @id_usuario AND valor_token = @valor_token
              AND estado = 'vigente' AND fecha_expiracion > SYSDATETIME();

            IF @id_token IS NULL THROW 50024, N'El token no es valido o ha expirado.', 1;

            UPDATE dbo.Usuario SET contrasena = @nueva_contrasena_hash WHERE id_usuario = @id_usuario;
            UPDATE dbo.TokenRecuperacion SET estado = 'usado' WHERE id_token = @id_token;

            EXEC dbo.usp_Auditoria_Registrar @operacion = N'Restablecer contrasena', @entidad_afectada = N'Usuario',
                 @resultado = 'exito', @id_usuario = @id_usuario, @descripcion = N'Contrasena restablecida con token.';

            IF @propia = 1 COMMIT;

            SELECT N'Contrasena restablecida correctamente.' AS mensaje;
        END
    END TRY
    BEGIN CATCH
        IF @propia = 1 AND @@TRANCOUNT > 0 ROLLBACK;
        DECLARE @descripcion_error NVARCHAR(500) = LEFT(N'Fallo: ' + ERROR_MESSAGE(), 500);
        EXEC dbo.usp_Auditoria_Registrar @operacion = N'Recuperar contrasena', @entidad_afectada = N'Usuario',
             @resultado = 'fallo', @descripcion = @descripcion_error;
        THROW;
    END CATCH
END
GO

PRINT '01_auth.sql: 3 procedimientos creados.';
GO
