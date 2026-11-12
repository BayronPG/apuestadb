/* ============================================================================
   APUESTADB - read model de reportes (MVP)
   Fuente: MongoDB apuesta/liquidacion.
   Refresco: backend/scripts/reporte_rm.js (backfill o refresh).
   ============================================================================ */

IF OBJECT_ID('dbo.RM_Apuesta', 'U') IS NULL
CREATE TABLE dbo.RM_Apuesta
(
    id_apuesta          BIGINT        NOT NULL PRIMARY KEY,
    id_usuario          INT           NOT NULL,
    id_opcion           INT           NOT NULL,
    id_evento           INT           NULL,
    id_tipo_saldo       INT           NOT NULL,
    monto               DECIMAL(18,2) NOT NULL,
    cuota_congelada     DECIMAL(10,2) NULL,
    tipo_apuesta        VARCHAR(20)   NULL,
    estado              VARCHAR(20)   NOT NULL,
    fecha_registro      DATETIME2(3)  NOT NULL,
    id_movimiento       BIGINT        NULL,
    clave_idempotencia  VARCHAR(120)  NULL,
    actualizado_en      DATETIME2(3)  NOT NULL CONSTRAINT DF_RM_Apuesta_Act DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.RM_Liquidacion', 'U') IS NULL
CREATE TABLE dbo.RM_Liquidacion
(
    id_apuesta          BIGINT        NOT NULL PRIMARY KEY,
    id_liquidacion      BIGINT        NULL,
    id_resultado        INT           NULL,
    resultado           VARCHAR(20)   NULL,
    monto_premio        DECIMAL(18,2) NOT NULL DEFAULT 0,
    fecha_hora          DATETIME2(3)  NULL,
    estado              VARCHAR(20)   NULL,
    actualizado_en      DATETIME2(3)  NOT NULL CONSTRAINT DF_RM_Liquidacion_Act DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.RM_SyncState', 'U') IS NULL
CREATE TABLE dbo.RM_SyncState
(
    origen          VARCHAR(30)   NOT NULL PRIMARY KEY,
    ultima_sync     DATETIME2(3)  NOT NULL,
    apuestas        INT           NOT NULL,
    liquidaciones   INT           NOT NULL,
    detalle         NVARCHAR(400) NULL
);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RM_Apuesta_Usuario' AND object_id = OBJECT_ID('dbo.RM_Apuesta'))
    CREATE INDEX IX_RM_Apuesta_Usuario ON dbo.RM_Apuesta (id_usuario);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RM_Apuesta_Evento' AND object_id = OBJECT_ID('dbo.RM_Apuesta'))
    CREATE INDEX IX_RM_Apuesta_Evento ON dbo.RM_Apuesta (id_evento);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RM_Apuesta_Estado' AND object_id = OBJECT_ID('dbo.RM_Apuesta'))
    CREATE INDEX IX_RM_Apuesta_Estado ON dbo.RM_Apuesta (estado);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RM_Liquidacion_Resultado' AND object_id = OBJECT_ID('dbo.RM_Liquidacion'))
    CREATE INDEX IX_RM_Liquidacion_Resultado ON dbo.RM_Liquidacion (id_resultado);
GO

CREATE OR ALTER VIEW dbo.vw_ReporteAdministrativo
AS
SELECT e.id_evento,
       d.nombre  AS deporte,
       l.nombre  AS liga,
       el.nombre AS equipo_local,
       ev.nombre AS equipo_visitante,
       e.fecha_hora_inicio,
       e.estado,
       r.marcador_local,
       r.marcador_visitante,
       COUNT(a.id_apuesta) AS apuestas,
       ISNULL(SUM(a.monto), 0) AS monto_apostado,
       ISNULL(SUM(li.monto_premio), 0) AS premios_pagados,
       ISNULL(SUM(a.monto), 0) - ISNULL(SUM(li.monto_premio), 0) AS margen
FROM dbo.RM_Apuesta a
JOIN dbo.Evento e      ON e.id_evento = a.id_evento
JOIN dbo.Temporada t   ON t.id_temporada = e.id_temporada
JOIN dbo.Liga l        ON l.id_liga = t.id_liga
JOIN dbo.Deporte d     ON d.id_deporte = l.id_deporte
JOIN dbo.Equipo el     ON el.id_equipo = e.id_equipo_local
JOIN dbo.Equipo ev     ON ev.id_equipo = e.id_equipo_visitante
LEFT JOIN dbo.Resultado r       ON r.id_evento = e.id_evento
LEFT JOIN dbo.RM_Liquidacion li ON li.id_apuesta = a.id_apuesta
GROUP BY e.id_evento, d.nombre, l.nombre, el.nombre, ev.nombre,
         e.fecha_hora_inicio, e.estado, r.marcador_local, r.marcador_visitante;
GO

CREATE OR ALTER VIEW dbo.vw_RankingUsuarios
AS
SELECT r.id_usuario,
       r.correo,
       r.total_apuestas,
       r.apuestas_ganadas,
       r.apuestas_perdidas,
       r.total_apostado,
       r.total_premios,
       r.ganancia_neta,
       RANK() OVER (ORDER BY r.ganancia_neta DESC, r.total_premios DESC) AS posicion
FROM (
    SELECT u.id_usuario,
           u.correo,
           COUNT(a.id_apuesta) AS total_apuestas,
           ISNULL(SUM(CASE WHEN a.estado = 'ganada'  THEN 1 ELSE 0 END), 0) AS apuestas_ganadas,
           ISNULL(SUM(CASE WHEN a.estado = 'perdida' THEN 1 ELSE 0 END), 0) AS apuestas_perdidas,
           ISNULL(SUM(a.monto), 0) AS total_apostado,
           ISNULL(SUM(li.monto_premio), 0) AS total_premios,
           ISNULL(SUM(li.monto_premio), 0)
             - ISNULL(SUM(CASE WHEN a.estado IN ('ganada','perdida') THEN a.monto ELSE 0 END), 0) AS ganancia_neta
    FROM dbo.Usuario u
    LEFT JOIN dbo.RM_Apuesta a      ON a.id_usuario = u.id_usuario
    LEFT JOIN dbo.RM_Liquidacion li ON li.id_apuesta = a.id_apuesta
    GROUP BY u.id_usuario, u.correo
) r;
GO

PRINT 'read_model/01_read_model.sql: tablas y vistas creadas.';
GO
