/* ============================================================================
   APUESTADB - consultas/05_join.sql
   Entregable : 20 sentencias con JOIN distintas (Fase 13).
   Motor      : SQL Server (T-SQL), base ApuestaDB.
   ----------------------------------------------------------------------------
   Reglas de este archivo:
     - Los JOIN se cuentan APARTE de los 80 SELECT de 01_select.sql.
     - 20 sentencias distintas: INNER, LEFT, RIGHT, FULL OUTER, CROSS, self join,
       joins de 4 a 8 tablas, join con vista, CROSS/OUTER APPLY, join con CTE,
       con funcion de ventana, con HAVING y con subconsulta correlacionada.
     - Solo lectura: no modifica datos.
   Uso: sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i 05_join.sql
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

/* ==========================================================================
   JOIN BASICOS Y DE DOS TABLAS
   ========================================================================== */

-- J-001 | INNER JOIN | Apuestas con el correo del usuario que las registro
SELECT TOP (10) a.id_apuesta, u.correo, a.monto, a.cuota_congelada, a.estado, a.fecha_hora_registro
FROM dbo.Apuesta a
INNER JOIN dbo.Usuario u ON u.id_usuario = a.id_usuario
ORDER BY a.fecha_hora_registro DESC;
GO

-- J-002 | INNER JOIN multi-tabla | Cartelera con los dos equipos y el estadio (self join de Equipo)
SELECT e.id_evento, el.nombre AS equipo_local, ev.nombre AS equipo_visitante,
       es.nombre AS estadio, e.fecha_hora_inicio, e.estado
FROM dbo.Evento e
INNER JOIN dbo.Equipo el  ON el.id_equipo = e.id_equipo_local
INNER JOIN dbo.Equipo ev  ON ev.id_equipo = e.id_equipo_visitante
INNER JOIN dbo.Estadio es ON es.id_estadio = e.id_estadio
ORDER BY e.fecha_hora_inicio;
GO

-- J-003 | LEFT JOIN | Todos los usuarios con su numero de apuestas (incluye los que no tienen)
SELECT u.id_usuario, u.correo, COUNT(a.id_apuesta) AS apuestas, ISNULL(SUM(a.monto), 0) AS monto_total
FROM dbo.Usuario u
LEFT JOIN dbo.Apuesta a ON a.id_usuario = u.id_usuario
GROUP BY u.id_usuario, u.correo
ORDER BY apuestas DESC, u.correo;
GO

-- J-004 | LEFT JOIN + IS NULL | Usuarios sin ninguna apuesta registrada
SELECT u.id_usuario, u.correo, u.fecha_registro
FROM dbo.Usuario u
LEFT JOIN dbo.Apuesta a ON a.id_usuario = u.id_usuario
WHERE a.id_apuesta IS NULL
ORDER BY u.correo;
GO

-- J-005 | RIGHT JOIN | Cuentas de saldo vistas desde el tipo de saldo
SELECT ts.nombre AS tipo_saldo, sc.id_saldo_cuenta, sc.saldo_actual
FROM dbo.TipoSaldo ts
RIGHT JOIN dbo.SaldoCuenta sc ON sc.id_tipo_saldo = ts.id_tipo_saldo
ORDER BY sc.id_saldo_cuenta;
GO

-- J-006 | FULL OUTER JOIN | Conceptos de movimiento frente a movimientos registrados
SELECT tm.nombre AS concepto, tm.naturaleza, ms.id_movimiento, ms.monto
FROM dbo.TipoMovimientoSaldo tm
FULL OUTER JOIN dbo.MovimientoSaldo ms ON ms.id_tipo_movimiento = tm.id_tipo_movimiento
ORDER BY tm.nombre, ms.id_movimiento;
GO

-- J-007 | CROSS JOIN | Combinaciones posibles de deporte y tipo de saldo
SELECT d.nombre AS deporte, ts.nombre AS tipo_saldo
FROM dbo.Deporte d
CROSS JOIN dbo.TipoSaldo ts
ORDER BY d.nombre, ts.nombre;
GO

-- J-008 | SELF JOIN | Parejas de equipos que comparten el mismo deporte
SELECT e1.nombre AS equipo_1, e2.nombre AS equipo_2, e1.siglas AS siglas_1, e2.siglas AS siglas_2
FROM dbo.Equipo e1
INNER JOIN dbo.Equipo e2 ON e2.id_deporte = e1.id_deporte
                        AND e2.id_equipo > e1.id_equipo
ORDER BY e1.nombre, e2.nombre;
GO

-- J-009 | JOIN de 4 tablas | Extracto de movimientos con su usuario y concepto
SELECT ms.id_movimiento, u.correo, tm.nombre AS concepto, tm.naturaleza,
       ms.monto, ms.saldo_resultante, ms.fecha_hora
FROM dbo.MovimientoSaldo ms
INNER JOIN dbo.SaldoCuenta sc          ON sc.id_saldo_cuenta = ms.id_saldo_cuenta
INNER JOIN dbo.Usuario u               ON u.id_usuario = sc.id_usuario
INNER JOIN dbo.TipoMovimientoSaldo tm  ON tm.id_tipo_movimiento = ms.id_tipo_movimiento
ORDER BY ms.id_movimiento;
GO

-- J-010 | JOIN de 5 tablas | Apuestas con su mercado, evento y marcador final
SELECT TOP (10) a.id_apuesta, o.etiqueta, o.cuota_vigente, m.nombre AS mercado,
       e.descripcion AS evento, r.marcador_local, r.marcador_visitante, a.estado
FROM dbo.Apuesta a
INNER JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
INNER JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
INNER JOIN dbo.Evento e        ON e.id_evento = m.id_evento
LEFT  JOIN dbo.Resultado r     ON r.id_evento = e.id_evento
ORDER BY a.fecha_hora_registro DESC;
GO

/* ==========================================================================
   JOIN CON AGREGACION, VENTANAS Y CTE
   ========================================================================== */

-- J-011 | JOIN de 6 tablas + GROUP BY | Monto apostado por liga
SELECT l.nombre AS liga, COUNT(a.id_apuesta) AS apuestas, SUM(a.monto) AS monto_apostado
FROM dbo.Apuesta a
INNER JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
INNER JOIN dbo.Mercado m       ON m.id_mercado = o.id_mercado
INNER JOIN dbo.Evento e        ON e.id_evento = m.id_evento
INNER JOIN dbo.Temporada t     ON t.id_temporada = e.id_temporada
INNER JOIN dbo.Liga l          ON l.id_liga = t.id_liga
GROUP BY l.nombre
ORDER BY monto_apostado DESC;
GO

-- J-012 | JOIN + HAVING | Usuarios con mas de una apuesta registrada
SELECT u.id_usuario, u.correo, COUNT(a.id_apuesta) AS apuestas
FROM dbo.Usuario u
INNER JOIN dbo.Apuesta a ON a.id_usuario = u.id_usuario
GROUP BY u.id_usuario, u.correo
HAVING COUNT(a.id_apuesta) > 1
ORDER BY apuestas DESC, u.correo;
GO

-- J-013 | JOIN + RANK() OVER | Ranking de usuarios por premios liquidados
SELECT u.id_usuario, u.correo,
       SUM(li.monto_premio) AS total_premios,
       RANK() OVER (ORDER BY SUM(li.monto_premio) DESC) AS puesto
FROM dbo.Usuario u
INNER JOIN dbo.Apuesta a      ON a.id_usuario = u.id_usuario
INNER JOIN dbo.Liquidacion li ON li.id_apuesta = a.id_apuesta
GROUP BY u.id_usuario, u.correo
ORDER BY puesto;
GO

-- J-014 | JOIN + CTE | Movimientos por usuario calculados en una expresion comun
WITH movimientos_por_usuario AS
(
    SELECT u.id_usuario, u.correo, COUNT(*) AS movimientos, SUM(ms.monto) AS monto_movido
    FROM dbo.Usuario u
    INNER JOIN dbo.SaldoCuenta sc     ON sc.id_usuario = u.id_usuario
    INNER JOIN dbo.MovimientoSaldo ms ON ms.id_saldo_cuenta = sc.id_saldo_cuenta
    GROUP BY u.id_usuario, u.correo
)
SELECT id_usuario, correo, movimientos, monto_movido
FROM movimientos_por_usuario
WHERE monto_movido > 0
ORDER BY monto_movido DESC;
GO

-- J-015 | JOIN + CASE | Desenlace del partido segun el marcador oficial
SELECT e.id_evento, e.descripcion, r.marcador_local, r.marcador_visitante,
       CASE WHEN r.marcador_local > r.marcador_visitante THEN N'Gana ' + el.nombre
            WHEN r.marcador_local < r.marcador_visitante THEN N'Gana ' + ev.nombre
            ELSE N'Empate' END AS desenlace
FROM dbo.Evento e
INNER JOIN dbo.Resultado r ON r.id_evento = e.id_evento
INNER JOIN dbo.Equipo el   ON el.id_equipo = e.id_equipo_local
INNER JOIN dbo.Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
WHERE e.estado = 'finalizado'
ORDER BY e.fecha_hora_inicio;
GO

-- J-016 | JOIN + subconsulta correlacionada | Eventos con mercados y apuestas asociadas
SELECT e.id_evento, e.descripcion, t.etiqueta AS temporada,
       (SELECT COUNT(*) FROM dbo.Mercado m WHERE m.id_evento = e.id_evento) AS mercados,
       (SELECT COUNT(*) FROM dbo.Apuesta a
        INNER JOIN dbo.OpcionApuesta o ON o.id_opcion = a.id_opcion
        INNER JOIN dbo.Mercado m2      ON m2.id_mercado = o.id_mercado
        WHERE m2.id_evento = e.id_evento) AS apuestas
FROM dbo.Evento e
INNER JOIN dbo.Temporada t ON t.id_temporada = e.id_temporada
ORDER BY apuestas DESC, e.id_evento;
GO

/* ==========================================================================
   JOIN CON VISTAS Y APPLY
   ========================================================================== */

-- J-017 | JOIN vista + tabla | Historial de apuestas cruzado con su liquidacion
SELECT h.id_apuesta, h.correo, h.opcion, h.monto, h.monto_premio, l.estado AS estado_liquidacion
FROM dbo.vw_HistorialApuestas h
INNER JOIN dbo.Liquidacion l ON l.id_apuesta = h.id_apuesta
ORDER BY h.fecha_hora_registro DESC;
GO

-- J-018 | OUTER APPLY | Ultimo mercado definido para cada evento
SELECT e.id_evento, e.descripcion, m.nombre AS ultimo_mercado, m.estado AS estado_mercado
FROM dbo.Evento e
OUTER APPLY (SELECT TOP (1) m.nombre, m.estado
             FROM dbo.Mercado m
             WHERE m.id_evento = e.id_evento
             ORDER BY m.fecha_cierre DESC) AS m
ORDER BY e.id_evento;
GO

-- J-019 | Cadena completa (8 tablas) | Apuesta liquidada con marcador, equipos y liga
SELECT a.id_apuesta, li.resultado_liquidacion, li.monto_premio,
       r.marcador_local, r.marcador_visitante,
       el.nombre AS equipo_local, ev.nombre AS equipo_visitante, l.nombre AS liga
FROM dbo.Apuesta a
INNER JOIN dbo.Liquidacion li ON li.id_apuesta = a.id_apuesta
INNER JOIN dbo.Resultado r    ON r.id_resultado = li.id_resultado
INNER JOIN dbo.Evento e       ON e.id_evento = r.id_evento
INNER JOIN dbo.Equipo el      ON el.id_equipo = e.id_equipo_local
INNER JOIN dbo.Equipo ev      ON ev.id_equipo = e.id_equipo_visitante
INNER JOIN dbo.Temporada t    ON t.id_temporada = e.id_temporada
INNER JOIN dbo.Liga l         ON l.id_liga = t.id_liga
ORDER BY a.id_apuesta;
GO

-- J-020 | CROSS APPLY con funcion table-valued | Estadisticas de apuestas por evento
SELECT e.id_evento, e.descripcion, x.apuestas, x.monto_apostado, x.premios_pagados,
       x.apuestas_local, x.apuestas_empate, x.apuestas_visitante
FROM dbo.Evento e
CROSS APPLY dbo.fn_EstadisticasEvento(e.id_evento) AS x
WHERE x.apuestas > 0
ORDER BY x.monto_apostado DESC;
GO

PRINT N'05_join.sql: 20 sentencias con JOIN ejecutadas (J-001 a J-020).';
GO
