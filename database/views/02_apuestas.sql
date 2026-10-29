/* ============================================================================
   APUESTADB - views/02_apuestas.sql
   Vistas del historial y del estado de las apuestas.
   Requiere : database/01..05 ejecutados.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   vw_HistorialApuestas  (vista base)
   Objetivo : historial completo de apuestas con evento, opcion y liquidacion.
   Casos de uso: consulta del usuario y base de las vistas filtradas por estado.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_HistorialApuestas
AS
SELECT a.id_apuesta,
       u.id_usuario,
       u.correo,
       a.fecha_hora_registro,
       a.tipo_apuesta,
       a.estado,
       d.nombre  AS deporte,
       l.nombre  AS liga,
       el.nombre AS equipo_local,
       ev.nombre AS equipo_visitante,
       e.fecha_hora_inicio,
       m.nombre  AS mercado,
       o.etiqueta AS opcion,
       a.cuota_congelada,
       a.monto,
       dbo.fn_PremioPotencial(a.monto, a.cuota_congelada) AS premio_potencial,
       ts.nombre AS tipo_saldo,
       li.resultado_liquidacion,
       li.monto_premio,
       li.fecha_hora AS fecha_liquidacion
FROM dbo.Apuesta a
JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
JOIN dbo.Evento e        ON e.id_evento = m.id_evento
JOIN dbo.Equipo el       ON el.id_equipo = e.id_equipo_local
JOIN dbo.Equipo ev       ON ev.id_equipo = e.id_equipo_visitante
JOIN dbo.Temporada t     ON t.id_temporada = e.id_temporada
JOIN dbo.Liga l          ON l.id_liga = t.id_liga
JOIN dbo.Deporte d       ON d.id_deporte = l.id_deporte
JOIN dbo.Usuario u       ON u.id_usuario = a.id_usuario
JOIN dbo.TipoSaldo ts    ON ts.id_tipo_saldo = a.id_tipo_saldo
LEFT JOIN dbo.Liquidacion li ON li.id_apuesta = a.id_apuesta;
GO

/* ----------------------------------------------------------------------------
   vw_ApuestasPendientes
   Objetivo : apuestas aun no liquidadas.
   Casos de uso: control de riesgo y seguimiento del usuario.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_ApuestasPendientes
AS
SELECT * FROM dbo.vw_HistorialApuestas
WHERE estado = 'pendiente';
GO

/* ----------------------------------------------------------------------------
   vw_ApuestasGanadas
   Objetivo : apuestas liquidadas como ganadas, con el premio abonado.
   Casos de uso: reporte de premios y estadisticas del usuario.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_ApuestasGanadas
AS
SELECT * FROM dbo.vw_HistorialApuestas
WHERE estado = 'ganada';
GO

/* ----------------------------------------------------------------------------
   vw_ApuestasPerdidas
   Objetivo : apuestas liquidadas como perdidas.
   Casos de uso: analisis de resultados y estadisticas del usuario.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_ApuestasPerdidas
AS
SELECT * FROM dbo.vw_HistorialApuestas
WHERE estado = 'perdida';
GO

PRINT 'views/02_apuestas.sql: 4 vistas creadas.';
GO
