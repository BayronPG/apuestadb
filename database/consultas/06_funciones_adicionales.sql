/* ============================================================================
   APUESTADB - consultas/06_funciones_adicionales.sql
   Entregable : 4 funciones adicionales (Fase 13) para completar las 10 que
                pide el profesor.
   Motor      : SQL Server (T-SQL), base ApuestaDB.
   ----------------------------------------------------------------------------
   Estado de la entrega de funciones:
     - Ya existian 6 (database/functions/):
         fn_PremioPotencial, fn_OpcionGanadora, fn_SaldoDisponible,
         fn_GananciaAcumulada (escalares) y
         fn_EstadisticasUsuario, fn_EstadisticasEvento (table-valued).
     - Este archivo agrega 4 escalares: fn_MargenEvento, fn_PorcentajeAcierto,
         fn_CuotaPromedioLiga, fn_SaldoSuficiente.  Total = 10 funciones.
   Nota: usa CREATE OR ALTER, por lo que el archivo es re-ejecutable.
   Uso: sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i 06_funciones_adicionales.sql
   ============================================================================ */

USE ApuestaDB;
GO

/* Configuracion de sesion: los triggers y funciones del modelo se crearon con
   estas opciones activas (equivale a la sesion por omision de SSMS). */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   fn_MargenEvento
   Tipo      : escalar
   Objetivo  : margen del evento para la casa = total apostado - premios pagados.
   Parametros: @id_evento
   Retorna   : DECIMAL(18,2). Devuelve 0 si el evento no tiene actividad.
   Casos de uso: reporte administrativo y control de riesgo (RN-17).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_MargenEvento
(
    @id_evento INT
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @apostado DECIMAL(18,2), @premios DECIMAL(18,2);

    SELECT @apostado = ISNULL(SUM(a.monto), 0)
    FROM dbo.Apuesta a
    JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
    JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
    WHERE m.id_evento = @id_evento;

    SELECT @premios = ISNULL(SUM(li.monto_premio), 0)
    FROM dbo.Liquidacion li
    JOIN dbo.Apuesta a       ON a.id_apuesta = li.id_apuesta
    JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
    JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
    WHERE m.id_evento = @id_evento;

    RETURN CAST(ISNULL(@apostado, 0) - ISNULL(@premios, 0) AS DECIMAL(18,2));
END
GO

/* ----------------------------------------------------------------------------
   fn_PorcentajeAcierto
   Tipo      : escalar
   Objetivo  : porcentaje de acierto del usuario (ganadas / apuestas resueltas).
   Parametros: @id_usuario
   Retorna   : DECIMAL(5,2) entre 0 y 100. Devuelve 0 si no hay apuestas resueltas.
   Casos de uso: perfil del usuario y ranking (solo apuestas ganadas o perdidas).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_PorcentajeAcierto
(
    @id_usuario INT
)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @resueltas INT, @ganadas INT;

    SELECT @resueltas = COUNT(*),
           @ganadas   = ISNULL(SUM(CASE WHEN estado = 'ganada' THEN 1 ELSE 0 END), 0)
    FROM dbo.Apuesta
    WHERE id_usuario = @id_usuario
      AND estado IN ('ganada', 'perdida');

    IF ISNULL(@resueltas, 0) = 0
        RETURN CAST(0 AS DECIMAL(5,2));

    RETURN CAST(@ganadas * 100.0 / @resueltas AS DECIMAL(5,2));
END
GO

/* ----------------------------------------------------------------------------
   fn_CuotaPromedioLiga
   Tipo      : escalar
   Objetivo  : cuota promedio de las opciones ofrecidas en una liga.
   Parametros: @id_liga
   Retorna   : DECIMAL(10,2). Devuelve 0 si la liga no tiene opciones.
   Casos de uso: comparativo de atractivo de mercado entre ligas.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_CuotaPromedioLiga
(
    @id_liga INT
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @promedio DECIMAL(10,2);

    SELECT @promedio = AVG(o.cuota_vigente)
    FROM dbo.OpcionApuesta o
    JOIN dbo.Mercado m     ON m.id_mercado = o.id_mercado
    JOIN dbo.Evento e      ON e.id_evento = m.id_evento
    JOIN dbo.Temporada t   ON t.id_temporada = e.id_temporada
    WHERE t.id_liga = @id_liga;

    RETURN CAST(ISNULL(@promedio, 0) AS DECIMAL(10,2));
END
GO

/* ----------------------------------------------------------------------------
   fn_SaldoSuficiente
   Tipo      : escalar
   Objetivo  : validar si el usuario tiene saldo para apostar un monto (RN-02/RN-03).
   Parametros: @id_usuario, @id_tipo_saldo, @monto
   Retorna   : BIT (1 = alcanza, 0 = no alcanza).
   Casos de uso: validacion previa al registro de una apuesta.
   Nota      : se apoya en fn_SaldoDisponible (funcion ya existente).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_SaldoSuficiente
(
    @id_usuario    INT,
    @id_tipo_saldo INT,
    @monto         DECIMAL(18,2)
)
RETURNS BIT
AS
BEGIN
    IF @monto IS NULL OR @monto <= 0
        RETURN CAST(0 AS BIT);

    RETURN CASE WHEN dbo.fn_SaldoDisponible(@id_usuario, @id_tipo_saldo) >= @monto
                THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END;
END
GO

/* ==========================================================================
   VERIFICACION: ejemplos de uso y conteo total de funciones
   ========================================================================== */

-- Margen del primer evento finalizado que tiene apuestas
SELECT dbo.fn_MargenEvento((SELECT TOP (1) m.id_evento
                            FROM dbo.Mercado m
                            JOIN dbo.OpcionApuesta o ON o.id_mercado = m.id_mercado
                            JOIN dbo.Apuesta a       ON a.id_opcion = o.id_opcion
                            ORDER BY m.id_evento)) AS margen_evento;
GO

-- Porcentaje de acierto del primer usuario con apuestas resueltas
SELECT u.correo,
       dbo.fn_PorcentajeAcierto(u.id_usuario) AS porcentaje_acierto
FROM (SELECT DISTINCT TOP (3) a.id_usuario FROM dbo.Apuesta a ORDER BY a.id_usuario) x
JOIN dbo.Usuario u ON u.id_usuario = x.id_usuario
ORDER BY porcentaje_acierto DESC;
GO

-- Cuota promedio por liga
SELECT l.nombre AS liga, dbo.fn_CuotaPromedioLiga(l.id_liga) AS cuota_promedio
FROM dbo.Liga l
ORDER BY cuota_promedio DESC;
GO

-- Validacion de saldo suficiente (ejemplo con el primer usuario y monto alto)
SELECT u.correo,
       dbo.fn_SaldoDisponible(u.id_usuario, (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens')) AS saldo_tokens,
       dbo.fn_SaldoSuficiente(u.id_usuario, (SELECT id_tipo_saldo FROM dbo.TipoSaldo WHERE nombre = 'tokens'), 50000) AS alcanza_50000
FROM (SELECT TOP (3) id_usuario, correo FROM dbo.Usuario ORDER BY id_usuario) u;
GO

-- Conteo total de funciones del modelo (debe devolver 10).
-- Nota: se excluye fn_diagramobjects, que la crea SSMS al abrir Diagramas de base
-- de datos y no hace parte del modelo ApuestaDB.
SELECT COUNT(*) AS total_funciones
FROM sys.objects
WHERE type IN ('FN', 'IF', 'TF')
  AND is_ms_shipped = 0
  AND CAST(name AS NVARCHAR(200)) <> N'fn_diagramobjects';
GO

PRINT N'06_funciones_adicionales.sql: 4 funciones creadas (total del modelo: 10).';
GO
