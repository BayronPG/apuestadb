/* ============================================================================
   APUESTADB - procedures/06_auditoria.sql
   Procedimientos: registro y consulta de auditoria.
   IMPORTANTE: ejecutar este archivo para que los demas procedimientos puedan
               invocar usp_Auditoria_Registrar en tiempo de ejecucion.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   usp_Auditoria_Registrar  (procedimiento auxiliar)
   Objetivo    : insertar un registro de auditoria.
   Parametros  : @operacion, @entidad_afectada, @resultado ('exito'|'fallo'),
                 @id_usuario (opc), @descripcion (opc), @direccion_origen (opc)
   Validaciones: resultado valido; operacion y entidad obligatorias.
   Resultado   : insercion del registro (sin conjunto de resultados).
   Nota        : lo invocan los demas procedimientos, dentro o fuera de transaccion.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Auditoria_Registrar
    @operacion        NVARCHAR(50),
    @entidad_afectada NVARCHAR(50),
    @resultado        VARCHAR(20),
    @id_usuario       INT = NULL,
    @descripcion      NVARCHAR(500) = NULL,
    @direccion_origen VARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @operacion IS NULL OR LTRIM(RTRIM(@operacion)) = ''
        THROW 50110, N'La operacion de auditoria es obligatoria.', 1;
    IF @entidad_afectada IS NULL OR LTRIM(RTRIM(@entidad_afectada)) = ''
        THROW 50111, N'La entidad afectada es obligatoria.', 1;
    IF @resultado IS NULL OR @resultado NOT IN ('exito','fallo')
        THROW 50112, N'El resultado de auditoria no es valido.', 1;

    INSERT INTO dbo.Auditoria (id_usuario, operacion, entidad_afectada, descripcion, fecha_hora, resultado, direccion_origen)
    VALUES (@id_usuario, @operacion, @entidad_afectada, @descripcion, SYSDATETIME(), @resultado, @direccion_origen);
END
GO

/* ----------------------------------------------------------------------------
   usp_Auditoria_Consultar
   Objetivo    : consultar los registros de auditoria con filtros.
   Parametros  : @id_usuario (opc), @operacion (opc), @desde (opc), @hasta (opc),
                 @top (opc, por defecto 100, maximo 1000)
   Validaciones: rango de fechas coherente.
   Resultado   : registros de auditoria mas recientes primero.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Auditoria_Consultar
    @id_usuario INT = NULL,
    @operacion  NVARCHAR(50) = NULL,
    @desde      DATETIME2(3) = NULL,
    @hasta      DATETIME2(3) = NULL,
    @top        INT = 100
AS
BEGIN
    SET NOCOUNT ON;

    IF @desde IS NOT NULL AND @hasta IS NOT NULL AND @desde > @hasta
        THROW 50113, N'El rango de fechas no es valido.', 1;

    IF @top IS NULL OR @top <= 0 SET @top = 100;
    IF @top > 1000 SET @top = 1000;

    SELECT TOP (@top)
           au.id_auditoria, au.fecha_hora, au.id_usuario, u.correo,
           au.operacion, au.entidad_afectada, au.descripcion,
           au.resultado, au.direccion_origen
    FROM dbo.Auditoria au
    LEFT JOIN dbo.Usuario u ON u.id_usuario = au.id_usuario
    WHERE (@id_usuario IS NULL OR au.id_usuario = @id_usuario)
      AND (@operacion IS NULL OR au.operacion = @operacion)
      AND (@desde IS NULL OR au.fecha_hora >= @desde)
      AND (@hasta IS NULL OR au.fecha_hora <= @hasta)
    ORDER BY au.fecha_hora DESC;
END
GO

PRINT '06_auditoria.sql: 2 procedimientos creados.';
GO
