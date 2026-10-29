/* ============================================================================
   APUESTADB - views/04_reportes.sql
   Vistas de reportes (ranking, administrativo, financiero y auditoria).
   Requiere : database/01..05 ejecutados.
   ============================================================================ */

USE ApuestaDB;
GO
SET NOCOUNT ON;
GO

/* ----------------------------------------------------------------------------
   vw_RankingUsuarios
   Objetivo : clasificar a los usuarios por ganancia neta y premios obtenidos.
   Casos de uso: reporte academico y panel de posiciones.
   Nota     : incluye la columna calculada 'posicion' (RANK).
   ---------------------------------------------------------------------------- */
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
    LEFT JOIN dbo.Apuesta a      ON a.id_usuario = u.id_usuario
    LEFT JOIN dbo.Liquidacion li ON li.id_apuesta = a.id_apuesta
    GROUP BY u.id_usuario, u.correo
) r;
GO

/* ----------------------------------------------------------------------------
   vw_ReporteAdministrativo
   Objetivo : resumen por evento (apuestas, monto, premios y margen).
   Casos de uso: seguimiento administrativo de la operacion.
   ---------------------------------------------------------------------------- */
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
FROM dbo.Evento e
JOIN dbo.Temporada t ON t.id_temporada = e.id_temporada
JOIN dbo.Liga l      ON l.id_liga = t.id_liga
JOIN dbo.Deporte d   ON d.id_deporte = l.id_deporte
JOIN dbo.Equipo el   ON el.id_equipo = e.id_equipo_local
JOIN dbo.Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
LEFT JOIN dbo.Resultado r        ON r.id_evento = e.id_evento
LEFT JOIN dbo.Mercado m          ON m.id_evento = e.id_evento
LEFT JOIN dbo.OpcionApuesta o    ON o.id_mercado = m.id_mercado
LEFT JOIN dbo.Apuesta a          ON a.id_opcion = o.id_opcion
LEFT JOIN dbo.Liquidacion li     ON li.id_apuesta = a.id_apuesta
GROUP BY e.id_evento, d.nombre, l.nombre, el.nombre, ev.nombre,
         e.fecha_hora_inicio, e.estado, r.marcador_local, r.marcador_visitante;
GO

/* ----------------------------------------------------------------------------
   vw_ReporteFinanciero
   Objetivo : resumen por tipo de saldo (recargado, apostado, premios y saldo en cuentas).
   Casos de uso: reporte financiero del saldo ficticio (sin dinero real).
   Nota     : usa subconsultas para evitar duplicacion por productos cartesianos.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_ReporteFinanciero
AS
SELECT ts.id_tipo_saldo,
       ts.nombre AS tipo_saldo,
       ISNULL((SELECT SUM(r.monto) FROM dbo.Recarga r
               WHERE r.id_tipo_saldo = ts.id_tipo_saldo AND r.estado = 'aplicada'), 0) AS total_recargado,
       ISNULL((SELECT SUM(a.monto) FROM dbo.Apuesta a
               WHERE a.id_tipo_saldo = ts.id_tipo_saldo), 0) AS total_apostado,
       ISNULL((SELECT SUM(li.monto_premio) FROM dbo.Liquidacion li
               JOIN dbo.Apuesta a2 ON a2.id_apuesta = li.id_apuesta
               WHERE a2.id_tipo_saldo = ts.id_tipo_saldo), 0) AS total_premios,
       ISNULL((SELECT SUM(sc.saldo_actual) FROM dbo.SaldoCuenta sc
               WHERE sc.id_tipo_saldo = ts.id_tipo_saldo), 0) AS saldo_en_cuentas
FROM dbo.TipoSaldo ts;
GO

/* ----------------------------------------------------------------------------
   vw_ReporteAuditoria
   Objetivo : consultar la auditoria con el usuario y su rol.
   Casos de uso: revision de accesos y operaciones sensibles.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER VIEW dbo.vw_ReporteAuditoria
AS
SELECT au.id_auditoria,
       au.fecha_hora,
       au.id_usuario,
       u.correo,
       r.nombre AS rol,
       au.operacion,
       au.entidad_afectada,
       au.descripcion,
       au.resultado,
       au.direccion_origen
FROM dbo.Auditoria au
LEFT JOIN dbo.Usuario u ON u.id_usuario = au.id_usuario
LEFT JOIN dbo.Rol r     ON r.id_rol = u.id_rol;
GO

PRINT 'views/04_reportes.sql: 4 vistas creadas.';
GO
