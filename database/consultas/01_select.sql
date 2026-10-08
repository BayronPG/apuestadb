/* ============================================================================
   APUESTADB - consultas/01_select.sql
   Entregable : 80 sentencias SELECT distintas (Fase 13).
   Motor      : SQL Server (T-SQL), base ApuestaDB.
   ----------------------------------------------------------------------------
   Reglas de este archivo:
     - Las 80 sentencias son DISTINTAS entre si (tablas, filtros, funciones o
       formas de consulta diferentes).
     - NO hay JOIN explicito: las combinaciones estan en 05_join.sql (se cuentan
       aparte). Aqui las referencias entre tablas usan subconsultas.
     - 58 sentencias cubren las 29 tablas (2 por tabla) y 12 consultan las 12
       vistas del modelo.
     - Solo lectura: no modifica datos.
   Uso: sqlcmd -S localhost\SQLEXPRESS01 -d ApuestaDB -i 01_select.sql
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
   BLOQUE 1 - SEGURIDAD Y USUARIOS (Rol, Usuario, PreguntaSeguridad,
   RespuestaSeguridad, TokenRecuperacion)
   ========================================================================== */

-- S-001 | Rol | Listado basico de roles ordenado por nombre
SELECT id_rol, nombre, descripcion, estado
FROM dbo.Rol
ORDER BY nombre;
GO

-- S-002 | Rol | Estado traducido con CASE y filtro por vigencia
SELECT nombre,
       CASE WHEN estado = 'vigente' THEN 'Activo' ELSE 'Inactivo' END AS estado_legible,
       LEN(ISNULL(descripcion, '')) AS longitud_descripcion
FROM dbo.Rol
WHERE estado = 'vigente';
GO

-- S-003 | Usuario | Nombre completo con CONCAT y orden por apellidos
SELECT id_usuario,
       CONCAT(nombres, ' ', apellidos) AS nombre_completo,
       correo,
       fecha_registro
FROM dbo.Usuario
ORDER BY apellidos, nombres;
GO

-- S-004 | Usuario | Conteo de usuarios por estado con HAVING
SELECT estado, COUNT(*) AS total_usuarios
FROM dbo.Usuario
GROUP BY estado
HAVING COUNT(*) >= 1
ORDER BY total_usuarios DESC;
GO

-- S-005 | PreguntaSeguridad | Preguntas vigentes ordenadas
SELECT id_pregunta, enunciado, estado
FROM dbo.PreguntaSeguridad
WHERE estado = 'vigente'
ORDER BY id_pregunta;
GO

-- S-006 | PreguntaSeguridad | Preguntas que empiezan por 'Cual' y su longitud
SELECT enunciado, LEN(enunciado) AS caracteres
FROM dbo.PreguntaSeguridad
WHERE enunciado LIKE N'Cual%'
ORDER BY caracteres DESC;
GO

-- S-007 | RespuestaSeguridad | Top 5 usuarios con mas respuestas de seguridad
SELECT TOP (5) id_usuario, COUNT(*) AS respuestas
FROM dbo.RespuestaSeguridad
GROUP BY id_usuario
ORDER BY respuestas DESC, id_usuario;
GO

-- S-008 | RespuestaSeguridad | Respuestas de usuarios activos (subconsulta)
SELECT id_respuesta, id_usuario, id_pregunta, LEFT(respuesta, 20) AS respuesta_corta
FROM dbo.RespuestaSeguridad
WHERE id_usuario IN (SELECT id_usuario FROM dbo.Usuario WHERE estado = 'activo')
ORDER BY id_respuesta;
GO

-- S-009 | TokenRecuperacion | Tokens vigentes con horas restantes de validez
SELECT id_token, id_usuario, valor_token,
       DATEDIFF(HOUR, SYSDATETIME(), fecha_expiracion) AS horas_restantes
FROM dbo.TokenRecuperacion
WHERE estado = 'vigente'
  AND fecha_expiracion > SYSDATETIME()
ORDER BY horas_restantes;
GO

-- S-010 | TokenRecuperacion | Conteo de tokens por estado
SELECT estado, COUNT(*) AS total, MIN(fecha_emision) AS primer_token
FROM dbo.TokenRecuperacion
GROUP BY estado
ORDER BY total DESC;
GO

/* ==========================================================================
   BLOQUE 2 - CATALOGO DEPORTIVO (Pais, Ciudad, Estadio, Deporte, Liga,
   Temporada, Equipo, Arbitro, Evento, CalendarioArbitro, Mercado,
   OpcionApuesta, HistorialCuota)
   ========================================================================== */

-- S-011 | Pais | Listado con codigo por omision
SELECT id_pais, nombre, ISNULL(codigo, 'S/C') AS codigo
FROM dbo.Pais
ORDER BY nombre;
GO

-- S-012 | Pais | Ciudades registradas por pais (subconsulta escalar)
SELECT p.nombre AS pais,
       (SELECT COUNT(*) FROM dbo.Ciudad c WHERE c.id_pais = p.id_pais) AS ciudades
FROM dbo.Pais p
ORDER BY ciudades DESC, p.nombre;
GO

-- S-013 | Ciudad | Ciudades de una region ordenadas (filtro por patron)
SELECT id_ciudad, nombre, region
FROM dbo.Ciudad
WHERE region LIKE N'%a%'
ORDER BY region, nombre;
GO

-- S-014 | Ciudad | Ciudades que tienen al menos un estadio (EXISTS)
SELECT c.id_ciudad, c.nombre
FROM dbo.Ciudad c
WHERE EXISTS (SELECT 1 FROM dbo.Estadio e WHERE e.id_ciudad = c.id_ciudad)
ORDER BY c.nombre;
GO

-- S-015 | Estadio | Estadios con capacidad alta ordenados de mayor a menor
SELECT id_estadio, nombre, capacidad
FROM dbo.Estadio
WHERE capacidad >= 50000
ORDER BY capacidad DESC;
GO

-- S-016 | Estadio | Capacidad minima, promedio y maxima del catalogo
SELECT COUNT(*) AS estadios,
       MIN(capacidad) AS capacidad_minima,
       CAST(AVG(capacidad * 1.0) AS DECIMAL(12,2)) AS capacidad_promedio,
       MAX(capacidad) AS capacidad_maxima
FROM dbo.Estadio
WHERE capacidad IS NOT NULL;
GO

-- S-017 | Deporte | Listado de deportes con su estado
SELECT id_deporte, nombre, ISNULL(descripcion, N'Sin descripcion') AS descripcion, estado
FROM dbo.Deporte
ORDER BY nombre;
GO

-- S-018 | Deporte | Clasificacion por extension de la descripcion (CASE)
SELECT nombre,
       CASE WHEN LEN(ISNULL(descripcion, '')) > 40 THEN 'Descripcion amplia'
            WHEN LEN(ISNULL(descripcion, '')) > 0  THEN 'Descripcion corta'
            ELSE 'Sin descripcion' END AS tipo_descripcion
FROM dbo.Deporte
ORDER BY nombre;
GO

-- S-019 | Liga | Ligas de primera division y su conteo por categoria
SELECT categoria, COUNT(*) AS ligas
FROM dbo.Liga
WHERE categoria = N'Primera Division'
GROUP BY categoria;
GO

-- S-020 | Liga | Nombre del deporte al que pertenece cada liga (subconsulta)
SELECT l.nombre AS liga, l.estado,
       (SELECT d.nombre FROM dbo.Deporte d WHERE d.id_deporte = l.id_deporte) AS deporte
FROM dbo.Liga l
ORDER BY deporte, liga;
GO

-- S-021 | Temporada | Rango de fechas por estado de temporada
SELECT estado,
       COUNT(*) AS temporadas,
       MIN(fecha_inicio) AS primera_fecha,
       MAX(fecha_fin) AS ultima_fecha
FROM dbo.Temporada
GROUP BY estado
ORDER BY temporadas DESC;
GO

-- S-022 | Temporada | Temporadas que terminan despues de hoy
SELECT id_temporada, etiqueta, fecha_inicio, fecha_fin
FROM dbo.Temporada
WHERE fecha_fin > CAST(SYSDATETIME() AS DATE)
ORDER BY fecha_fin;
GO

-- S-023 | Equipo | Equipos con siglas de tres letras ordenados por nombre
SELECT id_equipo, nombre, siglas
FROM dbo.Equipo
WHERE LEN(siglas) = 3
ORDER BY nombre;
GO

-- S-024 | Equipo | Equipos fundados antes de 1930
SELECT nombre, siglas, fecha_fundacion
FROM dbo.Equipo
WHERE fecha_fundacion IS NOT NULL
  AND fecha_fundacion < CONVERT(DATE, '1930-01-01')
ORDER BY fecha_fundacion;
GO

-- S-025 | Arbitro | Arbitros por categoria ordenados de mayor a menor
SELECT categoria, COUNT(*) AS arbitros
FROM dbo.Arbitro
GROUP BY categoria
ORDER BY arbitros DESC, categoria;
GO

-- S-026 | Arbitro | Arbitros FIFA con nombre completo
SELECT id_arbitro, CONCAT(nombres, ' ', apellidos) AS nombre_completo, categoria
FROM dbo.Arbitro
WHERE categoria = N'FIFA'
ORDER BY apellidos;
GO

-- S-027 | Evento | Conteo de eventos por estado
SELECT estado, COUNT(*) AS eventos
FROM dbo.Evento
GROUP BY estado
ORDER BY eventos DESC;
GO

-- S-028 | Evento | Top 5 eventos programados con dias de anticipacion
SELECT TOP (5) id_evento, descripcion, fecha_hora_inicio,
       DATEDIFF(DAY, SYSDATETIME(), fecha_hora_inicio) AS dias_para_el_evento
FROM dbo.Evento
WHERE estado = 'programado'
ORDER BY fecha_hora_inicio;
GO

-- S-029 | CalendarioArbitro | Designaciones por rol
SELECT rol_arbitro, COUNT(*) AS designaciones
FROM dbo.CalendarioArbitro
GROUP BY rol_arbitro
ORDER BY designaciones DESC;
GO

-- S-030 | CalendarioArbitro | Designaciones hechas con 3 o mas dias de anticipacion
SELECT id_calendario, id_evento, id_arbitro, fecha_designacion,
       DATEDIFF(DAY, fecha_designacion,
                (SELECT e.fecha_hora_inicio FROM dbo.Evento e WHERE e.id_evento = ca.id_evento)) AS dias_anticipacion
FROM dbo.CalendarioArbitro ca
WHERE DATEDIFF(DAY, ca.fecha_designacion,
               (SELECT e.fecha_hora_inicio FROM dbo.Evento e WHERE e.id_evento = ca.id_evento)) >= 3
ORDER BY dias_anticipacion DESC;
GO

-- S-031 | Mercado | Mercados abiertos que aun no cierran
SELECT id_mercado, nombre, fecha_cierre, estado
FROM dbo.Mercado
WHERE estado = 'abierto'
  AND fecha_cierre > SYSDATETIME()
ORDER BY fecha_cierre;
GO

-- S-032 | Mercado | Duracion en horas de cada mercado, del mas largo al mas corto
SELECT id_mercado, nombre, DATEDIFF(HOUR, fecha_apertura, fecha_cierre) AS horas_abierto
FROM dbo.Mercado
ORDER BY horas_abierto DESC;
GO

-- S-033 | OpcionApuesta | Cuota promedio por etiqueta de opcion
SELECT etiqueta,
       COUNT(*) AS opciones,
       CAST(AVG(cuota_vigente) AS DECIMAL(10,2)) AS cuota_promedio
FROM dbo.OpcionApuesta
GROUP BY etiqueta
ORDER BY cuota_promedio DESC;
GO

-- S-034 | OpcionApuesta | Opciones con cuota superior a 3.00
SELECT id_opcion, id_mercado, etiqueta, cuota_vigente
FROM dbo.OpcionApuesta
WHERE cuota_vigente > 3.00
ORDER BY cuota_vigente DESC;
GO

-- S-035 | HistorialCuota | Cambios de cuota registrados por motivo
SELECT motivo, COUNT(*) AS cambios, MIN(valor_cuota) AS cuota_minima, MAX(valor_cuota) AS cuota_maxima
FROM dbo.HistorialCuota
WHERE motivo LIKE N'%uota%'
GROUP BY motivo
ORDER BY cambios DESC;
GO

-- S-036 | HistorialCuota | Variacion de la cuota respecto al registro anterior (LAG)
SELECT id_opcion,
       fecha_hora_cambio,
       valor_cuota,
       LAG(valor_cuota) OVER (PARTITION BY id_opcion ORDER BY fecha_hora_cambio) AS cuota_anterior,
       valor_cuota - ISNULL(LAG(valor_cuota) OVER (PARTITION BY id_opcion ORDER BY fecha_hora_cambio), valor_cuota) AS variacion
FROM dbo.HistorialCuota
ORDER BY id_opcion, fecha_hora_cambio;
GO

/* ==========================================================================
   BLOQUE 3 - APUESTAS, SALDO FICTICIO, RESULTADOS, LIQUIDACION Y SOPORTE
   ========================================================================== */

-- S-037 | Apuesta | Indicadores generales de las apuestas registradas
SELECT COUNT(*) AS apuestas,
       SUM(monto) AS monto_total,
       CAST(AVG(monto) AS DECIMAL(18,2)) AS monto_promedio,
       MIN(monto) AS monto_minimo,
       MAX(monto) AS monto_maximo
FROM dbo.Apuesta;
GO

-- S-038 | Apuesta | Apuestas por estado con monto acumulado
SELECT estado, COUNT(*) AS apuestas, SUM(monto) AS monto_acumulado
FROM dbo.Apuesta
GROUP BY estado
ORDER BY monto_acumulado DESC;
GO

-- S-039 | FavoritoEquipo | Equipos favoritos por usuario
SELECT id_usuario, COUNT(*) AS equipos_favoritos
FROM dbo.FavoritoEquipo
GROUP BY id_usuario
ORDER BY equipos_favoritos DESC, id_usuario;
GO

-- S-040 | FavoritoEquipo | Favoritos marcados en agosto de 2026
SELECT id_favorito, id_usuario, id_equipo, fecha_marcado
FROM dbo.FavoritoEquipo
WHERE YEAR(fecha_marcado) = 2026
  AND MONTH(fecha_marcado) = 8
ORDER BY fecha_marcado;
GO

-- S-041 | TipoSaldo | Tipos de saldo ficticio disponibles
SELECT id_tipo_saldo, nombre, ISNULL(descripcion, N'Sin descripcion') AS descripcion, estado
FROM dbo.TipoSaldo
ORDER BY nombre;
GO

-- S-042 | TipoSaldo | Cuentas existentes por tipo de saldo (subconsulta)
SELECT ts.nombre AS tipo_saldo,
       (SELECT COUNT(*) FROM dbo.SaldoCuenta sc WHERE sc.id_tipo_saldo = ts.id_tipo_saldo) AS cuentas
FROM dbo.TipoSaldo ts
ORDER BY cuentas DESC;
GO

-- S-043 | SaldoCuenta | Saldo ficticio total y promedio por cuenta
SELECT COUNT(*) AS cuentas,
       SUM(saldo_actual) AS saldo_total,
       CAST(AVG(saldo_actual) AS DECIMAL(18,2)) AS saldo_promedio
FROM dbo.SaldoCuenta;
GO

-- S-044 | SaldoCuenta | Top 5 cuentas con mayor saldo
SELECT TOP (5) id_saldo_cuenta, id_usuario, id_tipo_saldo, saldo_actual
FROM dbo.SaldoCuenta
ORDER BY saldo_actual DESC;
GO

-- S-045 | TipoMovimientoSaldo | Naturaleza contable traducida (CASE)
SELECT nombre,
       naturaleza,
       CASE naturaleza WHEN 'debito' THEN 'Disminuye el saldo'
                       WHEN 'credito' THEN 'Aumenta el saldo'
                       ELSE 'No definida' END AS efecto
FROM dbo.TipoMovimientoSaldo
ORDER BY nombre;
GO

-- S-046 | TipoMovimientoSaldo | Movimientos registrados por tipo (subconsulta)
SELECT tm.nombre AS concepto,
       (SELECT COUNT(*) FROM dbo.MovimientoSaldo ms WHERE ms.id_tipo_movimiento = tm.id_tipo_movimiento) AS movimientos
FROM dbo.TipoMovimientoSaldo tm
ORDER BY movimientos DESC;
GO

-- S-047 | MovimientoSaldo | Movimientos superiores al promedio
SELECT id_movimiento, id_saldo_cuenta, monto, saldo_resultante
FROM dbo.MovimientoSaldo
WHERE monto > (SELECT AVG(monto) FROM dbo.MovimientoSaldo)
ORDER BY monto DESC;
GO

-- S-048 | MovimientoSaldo | Ultimo movimiento de cada cuenta (ROW_NUMBER en tabla derivada)
SELECT ultimo.id_saldo_cuenta, ultimo.id_movimiento, ultimo.monto, ultimo.saldo_resultante, ultimo.fecha_hora
FROM (SELECT id_saldo_cuenta, id_movimiento, monto, saldo_resultante, fecha_hora,
             ROW_NUMBER() OVER (PARTITION BY id_saldo_cuenta ORDER BY id_movimiento DESC) AS rn
      FROM dbo.MovimientoSaldo) AS ultimo
WHERE ultimo.rn = 1
ORDER BY ultimo.id_saldo_cuenta;
GO

-- S-049 | Recarga | Recargas por estado con monto acumulado
SELECT estado, COUNT(*) AS recargas, SUM(monto) AS monto_total
FROM dbo.Recarga
GROUP BY estado
ORDER BY monto_total DESC;
GO

-- S-050 | Recarga | Promedio de recarga por mes
SELECT YEAR(fecha_hora) AS anio, MONTH(fecha_hora) AS mes,
       COUNT(*) AS recargas,
       CAST(AVG(monto) AS DECIMAL(18,2)) AS promedio
FROM dbo.Recarga
GROUP BY YEAR(fecha_hora), MONTH(fecha_hora)
ORDER BY anio, mes;
GO

-- S-051 | Resultado | Marcador con la opcion ganadora derivada del marcador
SELECT id_resultado, id_evento, marcador_local, marcador_visitante,
       dbo.fn_OpcionGanadora(marcador_local, marcador_visitante) AS opcion_ganadora,
       estado
FROM dbo.Resultado
ORDER BY id_resultado;
GO

-- S-052 | Resultado | Promedio de goles por partido registrado
SELECT COUNT(*) AS resultados,
       CAST(AVG(marcador_local * 1.0) AS DECIMAL(6,2)) AS promedio_local,
       CAST(AVG(marcador_visitante * 1.0) AS DECIMAL(6,2)) AS promedio_visitante,
       CAST(AVG((marcador_local + marcador_visitante) * 1.0) AS DECIMAL(6,2)) AS promedio_total
FROM dbo.Resultado;
GO

-- S-053 | Liquidacion | Premios pagados por desenlace
SELECT resultado_liquidacion, COUNT(*) AS liquidaciones, SUM(monto_premio) AS premios
FROM dbo.Liquidacion
GROUP BY resultado_liquidacion
ORDER BY premios DESC;
GO

-- S-054 | Liquidacion | Top 3 premios mas altos
SELECT TOP (3) id_liquidacion, id_apuesta, resultado_liquidacion, monto_premio
FROM dbo.Liquidacion
ORDER BY monto_premio DESC;
GO

-- S-055 | Notificacion | Notificaciones sin leer por tipo
SELECT tipo, COUNT(*) AS no_leidas
FROM dbo.Notificacion
WHERE estado = 'no_leida'
GROUP BY tipo
ORDER BY no_leidas DESC;
GO

-- S-056 | Notificacion | Conteo por usuario incluyendo su correo (subconsulta)
SELECT n.id_usuario,
       (SELECT u.correo FROM dbo.Usuario u WHERE u.id_usuario = n.id_usuario) AS correo,
       COUNT(*) AS notificaciones
FROM dbo.Notificacion n
GROUP BY n.id_usuario
ORDER BY notificaciones DESC;
GO

-- S-057 | Auditoria | Operaciones fallidas agrupadas
SELECT operacion, entidad_afectada, COUNT(*) AS fallos
FROM dbo.Auditoria
WHERE resultado = 'fallo'
GROUP BY operacion, entidad_afectada
ORDER BY fallos DESC;
GO

-- S-058 | Auditoria | Ultimos 10 registros con usuario por omision
SELECT TOP (10) id_auditoria, fecha_hora,
       COALESCE(CAST(id_usuario AS VARCHAR(10)), 'administrativo') AS ejecutor,
       operacion, entidad_afectada, resultado
FROM dbo.Auditoria
ORDER BY fecha_hora DESC;
GO

/* ==========================================================================
   BLOQUE 4 - CONSULTAS SOBRE LAS 12 VISTAS DEL MODELO
   ========================================================================== */

-- S-059 | vw_EventosActivos | Eventos con mercados abiertos
SELECT id_evento, deporte, liga, equipo_local, equipo_visitante, fecha_hora_inicio, mercados_abiertos
FROM dbo.vw_EventosActivos
WHERE mercados_abiertos > 0
ORDER BY fecha_hora_inicio;
GO

-- S-060 | vw_EventosFinalizados | Resultados oficiales y opcion ganadora
SELECT equipo_local, equipo_visitante, marcador_local, marcador_visitante, opcion_ganadora
FROM dbo.vw_EventosFinalizados
WHERE estado_resultado = 'oficial'
ORDER BY fecha_hora_inicio;
GO

-- S-061 | vw_HistorialApuestas | Ultimas 10 apuestas con premio potencial
SELECT TOP (10) id_apuesta, correo, equipo_local, equipo_visitante, opcion,
       monto, cuota_congelada, premio_potencial, resultado_liquidacion
FROM dbo.vw_HistorialApuestas
ORDER BY fecha_hora_registro DESC;
GO

-- S-062 | vw_ApuestasPendientes | Apuestas pendientes por fecha de evento
SELECT id_apuesta, correo, equipo_local, equipo_visitante, opcion, monto, fecha_hora_inicio
FROM dbo.vw_ApuestasPendientes
ORDER BY fecha_hora_inicio;
GO

-- S-063 | vw_ApuestasGanadas | Total de premios pagados a apuestas ganadas
SELECT COUNT(*) AS apuestas_ganadas,
       SUM(monto) AS total_apostado,
       SUM(monto_premio) AS total_premios
FROM dbo.vw_ApuestasGanadas;
GO

-- S-064 | vw_ApuestasPerdidas | Apuestas perdidas por liga
SELECT liga, COUNT(*) AS apuestas_perdidas, SUM(monto) AS monto_perdido
FROM dbo.vw_ApuestasPerdidas
GROUP BY liga
ORDER BY monto_perdido DESC;
GO

-- S-065 | vw_SaldoConsolidado | Cuentas con saldo disponible
SELECT id_usuario, correo, estado_usuario, saldo_tokens, saldo_pse, saldo_total
FROM dbo.vw_SaldoConsolidado
WHERE saldo_total > 0
ORDER BY saldo_total DESC;
GO

-- S-066 | vw_HistorialMovimientos | Ultimos 10 descuentos por apuesta
SELECT TOP (10) id_movimiento, correo, tipo_saldo, concepto, monto, saldo_resultante, fecha_hora
FROM dbo.vw_HistorialMovimientos
WHERE concepto = 'apuesta'
ORDER BY fecha_hora DESC;
GO

-- S-067 | vw_RankingUsuarios | Tres primeros puestos del ranking
SELECT posicion, correo, total_apuestas, total_apostado, total_premios, ganancia_neta
FROM dbo.vw_RankingUsuarios
WHERE posicion <= 3
ORDER BY posicion;
GO

-- S-068 | vw_ReporteAdministrativo | Eventos ordenados por margen
SELECT id_evento, liga, equipo_local, equipo_visitante, apuestas, monto_apostado, premios_pagados, margen
FROM dbo.vw_ReporteAdministrativo
WHERE apuestas > 0
ORDER BY margen DESC;
GO

-- S-069 | vw_ReporteFinanciero | Resumen financiero del saldo ficticio
SELECT tipo_saldo, total_recargado, total_apostado, total_premios, saldo_en_cuentas,
       total_recargado - saldo_en_cuentas AS saldo_en_juego
FROM dbo.vw_ReporteFinanciero
ORDER BY tipo_saldo;
GO

-- S-070 | vw_ReporteAuditoria | Intentos fallidos de acceso
SELECT id_auditoria, fecha_hora, ISNULL(correo, 'no autenticado') AS correo,
       operacion, resultado, direccion_origen
FROM dbo.vw_ReporteAuditoria
WHERE resultado = 'fallo'
ORDER BY fecha_hora DESC;
GO

/* ==========================================================================
   BLOQUE 5 - OPERADORES DE CONJUNTO, FUNCIONES DE VENTANA Y AGREGACION
   ========================================================================== */

-- S-071 | UNION | Usuarios con equipos favoritos o con notificaciones sin leer
SELECT correo
FROM dbo.Usuario
WHERE id_usuario IN (SELECT id_usuario FROM dbo.FavoritoEquipo)
UNION
SELECT correo
FROM dbo.Usuario
WHERE id_usuario IN (SELECT id_usuario FROM dbo.Notificacion WHERE estado = 'no_leida')
ORDER BY correo;
GO

-- S-072 | UNION ALL | Comparativo de conteos con etiqueta de origen
SELECT 'apuestas registradas' AS grupo, COUNT(*) AS total FROM dbo.Apuesta
UNION ALL
SELECT 'apuestas pendientes', COUNT(*) FROM dbo.Apuesta WHERE estado = 'pendiente'
UNION ALL
SELECT 'apuestas ganadas', COUNT(*) FROM dbo.Apuesta WHERE estado = 'ganada';
GO

-- S-073 | INTERSECT | Usuarios que tienen apuestas y equipos favoritos
SELECT id_usuario FROM dbo.Apuesta
INTERSECT
SELECT id_usuario FROM dbo.FavoritoEquipo
ORDER BY id_usuario;
GO

-- S-074 | EXCEPT | Usuarios sin ninguna apuesta registrada
SELECT id_usuario FROM dbo.Usuario
EXCEPT
SELECT id_usuario FROM dbo.Apuesta
ORDER BY id_usuario;
GO

-- S-075 | AVG() OVER | Apuestas comparadas con el monto promedio global
SELECT id_apuesta, monto,
       CAST(AVG(monto * 1.0) OVER () AS DECIMAL(18,2)) AS promedio_global,
       monto - CAST(AVG(monto * 1.0) OVER () AS DECIMAL(18,2)) AS diferencia
FROM dbo.Apuesta
ORDER BY monto DESC;
GO

-- S-076 | SUM() OVER | Monto acumulado de apuestas por usuario (ventana particionada)
SELECT id_usuario, id_apuesta, monto,
       SUM(monto) OVER (PARTITION BY id_usuario ORDER BY fecha_hora_registro, id_apuesta
                        ROWS UNBOUNDED PRECEDING) AS acumulado_usuario
FROM dbo.Apuesta
ORDER BY id_usuario, fecha_hora_registro;
GO

-- S-077 | PIVOT | Opciones de apuesta por etiqueta y estado
SELECT etiqueta, [habilitada] AS habilitadas, [deshabilitada] AS deshabilitadas
FROM (SELECT etiqueta, estado FROM dbo.OpcionApuesta) AS s
PIVOT (COUNT(estado) FOR estado IN ([habilitada], [deshabilitada])) AS p
ORDER BY etiqueta;
GO

-- S-078 | FOR XML PATH | Correos de los usuarios agrupados por rol
SELECT u.id_rol,
       STUFF((SELECT '; ' + u2.correo
              FROM dbo.Usuario u2
              WHERE u2.id_rol = u.id_rol
              ORDER BY u2.correo
              FOR XML PATH('')), 1, 2, '') AS correos
FROM dbo.Usuario u
GROUP BY u.id_rol;
GO

-- S-079 | CTE | Usuarios con mas de una apuesta registrada
WITH resumen AS
(
    SELECT id_usuario, COUNT(*) AS total_apuestas, SUM(monto) AS monto_total
    FROM dbo.Apuesta
    GROUP BY id_usuario
)
SELECT id_usuario, total_apuestas, monto_total
FROM resumen
WHERE total_apuestas > 1
ORDER BY total_apuestas DESC;
GO

-- S-080 | DENSE_RANK() OVER | Top 10 de cuotas vigentes mas altas por mercado
SELECT TOP (10) id_opcion, id_mercado, etiqueta, cuota_vigente,
       DENSE_RANK() OVER (ORDER BY cuota_vigente DESC) AS posicion
FROM dbo.OpcionApuesta
ORDER BY cuota_vigente DESC;
GO

PRINT N'01_select.sql: 80 sentencias SELECT ejecutadas (S-001 a S-080).';
GO
