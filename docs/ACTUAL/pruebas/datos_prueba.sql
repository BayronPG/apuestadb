/* ============================================================================
   APUESTADB - docs/ACTUAL/pruebas/datos_prueba.sql
   Objetivo : datos deportivos minimos para las pruebas integrales (Fase 12).
   Requiere : database/01..05 + functions + views + procedures + triggers.
   Nota     : el proyecto NO tiene endpoint de creacion de eventos; estos datos
              se cargan por SQL, igual que en un escenario academico real.
   Idempotente: puede ejecutarse varias veces sin duplicar filas.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* --- Ubicacion ------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Pais WHERE nombre = N'Colombia')
    INSERT INTO dbo.Pais (nombre, codigo) VALUES (N'Colombia', 'CO');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Ciudad WHERE nombre = N'Medellin')
    INSERT INTO dbo.Ciudad (id_pais, nombre, region)
    SELECT id_pais, N'Medellin', N'Antioquia' FROM dbo.Pais WHERE nombre = N'Colombia';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Estadio WHERE nombre = N'Atanasio Girardot')
    INSERT INTO dbo.Estadio (id_ciudad, nombre, capacidad, direccion)
    SELECT id_ciudad, N'Atanasio Girardot', 44000, N'Carrera 74 # 48-10'
    FROM dbo.Ciudad WHERE nombre = N'Medellin';
GO

/* --- Liga y temporada ------------------------------------------------------ */
IF NOT EXISTS (SELECT 1 FROM dbo.Liga WHERE nombre = N'Liga BetPlay Dimayor')
    INSERT INTO dbo.Liga (id_deporte, nombre, categoria, estado)
    SELECT id_deporte, N'Liga BetPlay Dimayor', N'Primera A', 'vigente'
    FROM dbo.Deporte WHERE nombre = N'Futbol';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Temporada WHERE etiqueta = N'2026-I')
    INSERT INTO dbo.Temporada (id_liga, etiqueta, fecha_inicio, fecha_fin, estado)
    SELECT id_liga, N'2026-I', '2026-01-15', '2026-06-30', 'en_curso'
    FROM dbo.Liga WHERE nombre = N'Liga BetPlay Dimayor';
GO

/* --- Equipos --------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Equipo WHERE nombre = N'Atletico Nacional')
    INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
    SELECT d.id_deporte, c.id_ciudad, N'Atletico Nacional', N'NAC', '1947-03-07', 'vigente'
    FROM dbo.Deporte d CROSS JOIN dbo.Ciudad c
    WHERE d.nombre = N'Futbol' AND c.nombre = N'Medellin';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Equipo WHERE nombre = N'Independiente Medellin')
    INSERT INTO dbo.Equipo (id_deporte, id_ciudad, nombre, siglas, fecha_fundacion, estado)
    SELECT d.id_deporte, c.id_ciudad, N'Independiente Medellin', N'DIM', '1913-11-14', 'vigente'
    FROM dbo.Deporte d CROSS JOIN dbo.Ciudad c
    WHERE d.nombre = N'Futbol' AND c.nombre = N'Medellin';
GO

/* --- Evento programado (clasico paisa) ------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Evento WHERE descripcion = N'Clasico paisa - prueba Fase 12')
    INSERT INTO dbo.Evento
        (id_temporada, id_equipo_local, id_equipo_visitante, id_estadio,
         fecha_hora_inicio, estado, descripcion)
    SELECT t.id_temporada, local.id_equipo, visitante.id_equipo, e.id_estadio,
           DATEADD(DAY, 2, SYSDATETIME()), 'programado', N'Clasico paisa - prueba Fase 12'
    FROM dbo.Temporada t
    CROSS JOIN (SELECT id_equipo FROM dbo.Equipo WHERE nombre = N'Atletico Nacional') local
    CROSS JOIN (SELECT id_equipo FROM dbo.Equipo WHERE nombre = N'Independiente Medellin') visitante
    CROSS JOIN (SELECT TOP 1 id_estadio FROM dbo.Estadio WHERE nombre = N'Atanasio Girardot') e
    WHERE t.etiqueta = N'2026-I';
GO

/* --- Mercado "resultado del partido" con tres opciones --------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Mercado WHERE nombre = N'Resultado del partido'
                                             AND id_evento = (SELECT TOP 1 id_evento FROM dbo.Evento
                                                              WHERE descripcion = N'Clasico paisa - prueba Fase 12'))
    INSERT INTO dbo.Mercado (id_evento, nombre, descripcion, fecha_apertura, fecha_cierre, estado)
    SELECT ev.id_evento, N'Resultado del partido', N'Ganador del partido: local, empate o visitante.',
           SYSDATETIME(), DATEADD(MINUTE, -5, ev.fecha_hora_inicio), 'abierto'
    FROM dbo.Evento ev WHERE ev.descripcion = N'Clasico paisa - prueba Fase 12';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.OpcionApuesta
               WHERE id_mercado = (SELECT TOP 1 m.id_mercado FROM dbo.Mercado m
                                   JOIN dbo.Evento e ON e.id_evento = m.id_evento
                                   WHERE e.descripcion = N'Clasico paisa - prueba Fase 12'))
    INSERT INTO dbo.OpcionApuesta (id_mercado, etiqueta, cuota_vigente, estado)
    SELECT m.id_mercado, o.etiqueta, o.cuota, 'habilitada'
    FROM dbo.Mercado m
    JOIN dbo.Evento e ON e.id_evento = m.id_evento
    CROSS JOIN (VALUES ('local', CAST(1.85 AS DECIMAL(9,2))),
                       ('empate', CAST(3.40 AS DECIMAL(9,2))),
                       ('visitante', CAST(4.20 AS DECIMAL(9,2)))) AS o(etiqueta, cuota)
    WHERE e.descripcion = N'Clasico paisa - prueba Fase 12' AND m.nombre = N'Resultado del partido';
GO

/* --- Verificacion ---------------------------------------------------------- */
SELECT 'Evento' AS tabla, COUNT(*) AS filas FROM dbo.Evento
UNION ALL SELECT 'Mercado', COUNT(*) FROM dbo.Mercado
UNION ALL SELECT 'OpcionApuesta', COUNT(*) FROM dbo.OpcionApuesta
UNION ALL SELECT 'Equipo', COUNT(*) FROM dbo.Equipo;
GO

SELECT e.id_evento, e.descripcion, e.estado, e.fecha_hora_inicio,
       el.nombre AS local, ev.nombre AS visitante,
       m.id_mercado, m.nombre AS mercado, m.estado AS estado_mercado,
       o.id_opcion, o.etiqueta, o.cuota_vigente
FROM dbo.Evento e
JOIN dbo.Equipo el ON el.id_equipo = e.id_equipo_local
JOIN dbo.Equipo ev ON ev.id_equipo = e.id_equipo_visitante
LEFT JOIN dbo.Mercado m ON m.id_evento = e.id_evento
LEFT JOIN dbo.OpcionApuesta o ON o.id_mercado = m.id_mercado
WHERE e.descripcion = N'Clasico paisa - prueba Fase 12'
ORDER BY o.id_opcion;
GO
