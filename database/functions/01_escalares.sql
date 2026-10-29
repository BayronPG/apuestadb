/* ============================================================================
   APUESTADB - functions/01_escalares.sql
   Funciones escalares (retornan un unico valor).
   IMPORTANTE: crear estas funciones ANTES de las vistas 01_eventos y 02_apuestas,
               que las referencian (las vistas validan sus dependencias al crearse).
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   fn_PremioPotencial
   Tipo      : escalar
   Objetivo  : calcular el premio potencial de una apuesta (monto x cuota).
   Parametros: @monto, @cuota
   Retorna   : DECIMAL(18,2). Devuelve 0 si los datos no son validos.
   Casos de uso: mostrar el premio potencial en la vista de historial de apuestas.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_PremioPotencial
(
    @monto DECIMAL(18,2),
    @cuota DECIMAL(10,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    IF @monto IS NULL OR @cuota IS NULL OR @monto < 0 OR @cuota <= 0
        RETURN CAST(0 AS DECIMAL(18,2));

    RETURN CAST(@monto * @cuota AS DECIMAL(18,2));
END
GO

/* ----------------------------------------------------------------------------
   fn_OpcionGanadora
   Tipo      : escalar
   Objetivo  : determinar la opcion ganadora (local/empate/visitante) del marcador.
   Parametros: @marcador_local, @marcador_visitante
   Retorna   : VARCHAR(20) ('local' | 'empate' | 'visitante') o NULL.
   Casos de uso: vista de eventos finalizados y logica de liquidacion.
   Nota      : materializa la decision C-2 (la opcion ganadora se deriva).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_OpcionGanadora
(
    @marcador_local     SMALLINT,
    @marcador_visitante SMALLINT
)
RETURNS VARCHAR(20)
AS
BEGIN
    IF @marcador_local IS NULL OR @marcador_visitante IS NULL
        RETURN NULL;

    RETURN CASE
               WHEN @marcador_local > @marcador_visitante THEN 'local'
               WHEN @marcador_local < @marcador_visitante THEN 'visitante'
               ELSE 'empate'
           END;
END
GO

/* ----------------------------------------------------------------------------
   fn_SaldoDisponible
   Tipo      : escalar
   Objetivo  : obtener el saldo disponible de un usuario para un tipo de saldo.
   Parametros: @id_usuario, @id_tipo_saldo
   Retorna   : DECIMAL(18,2). Devuelve 0 si no existe la cuenta.
   Casos de uso: validaciones previas a apostar y panel del usuario.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_SaldoDisponible
(
    @id_usuario    INT,
    @id_tipo_saldo INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @saldo DECIMAL(18,2);

    SELECT @saldo = saldo_actual
    FROM dbo.SaldoCuenta
    WHERE id_usuario = @id_usuario
      AND id_tipo_saldo = @id_tipo_saldo;

    RETURN ISNULL(@saldo, 0);
END
GO

/* ----------------------------------------------------------------------------
   fn_GananciaAcumulada
   Tipo      : escalar
   Objetivo  : calcular la ganancia neta de un usuario (premios - apuestas resueltas).
   Parametros: @id_usuario
   Retorna   : DECIMAL(18,2).
   Casos de uso: ranking de usuarios y estadisticas personales.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_GananciaAcumulada
(
    @id_usuario INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @premios DECIMAL(18,2), @apostado DECIMAL(18,2);

    SELECT @premios = ISNULL(SUM(li.monto_premio), 0)
    FROM dbo.Liquidacion li
    JOIN dbo.Apuesta a ON a.id_apuesta = li.id_apuesta
    WHERE a.id_usuario = @id_usuario;

    SELECT @apostado = ISNULL(SUM(a.monto), 0)
    FROM dbo.Apuesta a
    WHERE a.id_usuario = @id_usuario
      AND a.estado IN ('ganada','perdida');

    RETURN @premios - @apostado;
END
GO

PRINT 'functions/01_escalares.sql: 4 funciones escalares creadas.';
GO
