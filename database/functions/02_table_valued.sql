/* ============================================================================
   APUESTADB - functions/02_table_valued.sql
   Funciones con valor de tabla (inline table-valued).
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   fn_EstadisticasUsuario
   Tipo      : table-valued (inline)
   Objetivo  : resumir la actividad de apuestas de un usuario.
   Parametros: @id_usuario
   Retorna   : 1 fila con totales (apuestas, ganadas, perdidas, pendientes,
               total apostado, total premios y ganancia neta).
   Casos de uso: perfil del usuario y panel administrativo.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_EstadisticasUsuario
(
    @id_usuario INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT u.id_usuario,
           u.correo,
           COUNT(a.id_apuesta) AS total_apuestas,
           ISNULL(SUM(CASE WHEN a.estado = 'ganada'    THEN 1 ELSE 0 END), 0) AS apuestas_ganadas,
           ISNULL(SUM(CASE WHEN a.estado = 'perdida'   THEN 1 ELSE 0 END), 0) AS apuestas_perdidas,
           ISNULL(SUM(CASE WHEN a.estado = 'pendiente' THEN 1 ELSE 0 END), 0) AS apuestas_pendientes,
           ISNULL(SUM(a.monto), 0) AS total_apostado,
           ISNULL(SUM(li.monto_premio), 0) AS total_premios,
           ISNULL(SUM(li.monto_premio), 0)
             - ISNULL(SUM(CASE WHEN a.estado IN ('ganada','perdida') THEN a.monto ELSE 0 END), 0) AS ganancia_neta
    FROM dbo.Usuario u
    LEFT JOIN dbo.Apuesta a      ON a.id_usuario = u.id_usuario
    LEFT JOIN dbo.Liquidacion li ON li.id_apuesta = a.id_apuesta
    WHERE u.id_usuario = @id_usuario
    GROUP BY u.id_usuario, u.correo
);
GO

/* ----------------------------------------------------------------------------
   fn_EstadisticasEvento
   Tipo      : table-valued (inline)
   Objetivo  : resumir la actividad de apuestas de un evento y su distribucion.
   Parametros: @id_evento
   Retorna   : 1 fila con apuestas, monto apostado, premios pagados y la
               distribucion por opcion (local, empate, visitante).
   Casos de uso: reporte administrativo por evento.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER FUNCTION dbo.fn_EstadisticasEvento
(
    @id_evento INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT e.id_evento,
           e.fecha_hora_inicio,
           e.estado,
           COUNT(a.id_apuesta) AS apuestas,
           ISNULL(SUM(a.monto), 0) AS monto_apostado,
           ISNULL(SUM(li.monto_premio), 0) AS premios_pagados,
           ISNULL(SUM(CASE WHEN o.etiqueta = 'local'     THEN 1 ELSE 0 END), 0) AS apuestas_local,
           ISNULL(SUM(CASE WHEN o.etiqueta = 'empate'    THEN 1 ELSE 0 END), 0) AS apuestas_empate,
           ISNULL(SUM(CASE WHEN o.etiqueta = 'visitante' THEN 1 ELSE 0 END), 0) AS apuestas_visitante
    FROM dbo.Evento e
    LEFT JOIN dbo.Mercado m       ON m.id_evento = e.id_evento
    LEFT JOIN dbo.OpcionApuesta o ON o.id_mercado = m.id_mercado
    LEFT JOIN dbo.Apuesta a       ON a.id_opcion = o.id_opcion
    LEFT JOIN dbo.Liquidacion li  ON li.id_apuesta = a.id_apuesta
    WHERE e.id_evento = @id_evento
    GROUP BY e.id_evento, e.fecha_hora_inicio, e.estado
);
GO

PRINT 'functions/02_table_valued.sql: 2 funciones table-valued creadas.';
GO
