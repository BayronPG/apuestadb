/* ============================================================================
   APUESTADB - views/01_eventos.sql
   Vistas de eventos deportivos.
   Requiere : database/01..05 ejecutados. No modifica tablas ni procedimientos.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   vw_EventosActivos
   Objetivo : listar los eventos disponibles (programados o en curso).
   Casos de uso: cartelera del usuario y seleccion de partidos para apostar.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_EventosActivos
AS
SELECT e.id_evento,
       d.nombre AS deporte,
       l.nombre AS liga,
       t.etiqueta AS temporada,
       el.nombre AS equipo_local,
       ev.nombre AS equipo_visitante,
       es.nombre AS estadio,
       e.fecha_hora_inicio,
       e.estado,
       (SELECT COUNT(*) FROM dbo.Mercado m
        WHERE m.id_evento = e.id_evento AND m.estado = 'abierto') AS mercados_abiertos
FROM dbo.Evento e
JOIN dbo.Temporada t ON t.id_temporada = e.id_temporada
JOIN dbo.Liga l      ON l.id_liga = t.id_liga
JOIN dbo.Deporte d   ON d.id_deporte = l.id_deporte
JOIN dbo.Equipo el   ON el.id_equipo = e.id_equipo_local
JOIN dbo.Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
JOIN dbo.Estadio es  ON es.id_estadio = e.id_estadio
WHERE e.estado IN ('programado','en_curso');
GO

/* ----------------------------------------------------------------------------
   vw_EventosFinalizados
   Objetivo : listar los eventos finalizados con su resultado y la opcion ganadora.
   Casos de uso: consulta de resultados y verificacion previa a la liquidacion.
   Nota     : la opcion ganadora se DERIVA del marcador (no se almacena).
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_EventosFinalizados
AS
SELECT e.id_evento,
       d.nombre AS deporte,
       l.nombre AS liga,
       el.nombre AS equipo_local,
       ev.nombre AS equipo_visitante,
       e.fecha_hora_inicio,
       r.marcador_local,
       r.marcador_visitante,
       dbo.fn_OpcionGanadora(r.marcador_local, r.marcador_visitante) AS opcion_ganadora,
       r.estado AS estado_resultado,
       r.fecha_registro
FROM dbo.Evento e
JOIN dbo.Temporada t ON t.id_temporada = e.id_temporada
JOIN dbo.Liga l      ON l.id_liga = t.id_liga
JOIN dbo.Deporte d   ON d.id_deporte = l.id_deporte
JOIN dbo.Equipo el   ON el.id_equipo = e.id_equipo_local
JOIN dbo.Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
LEFT JOIN dbo.Resultado r ON r.id_evento = e.id_evento
WHERE e.estado = 'finalizado';
GO

PRINT 'views/01_eventos.sql: 2 vistas creadas.';
GO
