-- ============================================================================
-- APUESTADB - database/mysql/05_verify.sql
-- Verificacion del catalogo MySQL (Fase 15). Solo lectura.
--
-- Uso: mysql -u ... apuestadb < database/mysql/05_verify.sql
-- Cada consulta devuelve el valor esperado y el obtenido.
-- ============================================================================

USE apuestadb;

SELECT 'tablas_catalogo' AS control, 16 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME IN ('Pais','Ciudad','Estadio','Deporte','Liga','Temporada','Equipo',
                      'Arbitro','Evento','CalendarioArbitro','Mercado','OpcionApuesta',
                      'HistorialCuota','Resultado','FavoritoEquipo','Jugador');

SELECT 'vistas_eventos' AS control, 2 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.VIEWS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME IN ('vw_EventosActivos','vw_EventosFinalizados');

SELECT 'foreign_keys' AS control, 18 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.TABLE_CONSTRAINTS
 WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY';

SELECT 'unique' AS control, 16 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.TABLE_CONSTRAINTS
 WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'UNIQUE';

SELECT 'check' AS control, 20 AS esperado, COUNT(*) AS obtenido
  FROM information_schema.TABLE_CONSTRAINTS
 WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK';

SELECT 'indices_esperados' AS control, 10 AS esperado, COUNT(DISTINCT INDEX_NAME) AS obtenido
  FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = DATABASE()
   AND INDEX_NAME IN ('IX_Equipo_Ciudad','IX_Evento_EquipoLocal','IX_Evento_EquipoVisitante',
                      'IX_Evento_Estadio','IX_Evento_Estado_Fecha','IX_Calendario_Arbitro',
                      'IX_Favorito_Equipo','IX_Resultado_Evento','IX_Jugador_Equipo',
                      'IX_Jugador_Nombre');

-- ------------------------------------------------------------- huerfanos ----
SELECT 'huerfanos_ciudad' AS control, 0 AS esperado,
       COUNT(*) AS obtenido FROM Ciudad c LEFT JOIN Pais p ON p.id_pais = c.id_pais WHERE p.id_pais IS NULL
UNION ALL SELECT 'huerfanos_estadio', 0,
       COUNT(*) FROM Estadio e LEFT JOIN Ciudad c ON c.id_ciudad = e.id_ciudad WHERE c.id_ciudad IS NULL
UNION ALL SELECT 'huerfanos_liga', 0,
       COUNT(*) FROM Liga l LEFT JOIN Deporte d ON d.id_deporte = l.id_deporte WHERE d.id_deporte IS NULL
UNION ALL SELECT 'huerfanos_temporada', 0,
       COUNT(*) FROM Temporada t LEFT JOIN Liga l ON l.id_liga = t.id_liga WHERE l.id_liga IS NULL
UNION ALL SELECT 'huerfanos_equipo_deporte', 0,
       COUNT(*) FROM Equipo q LEFT JOIN Deporte d ON d.id_deporte = q.id_deporte WHERE d.id_deporte IS NULL
UNION ALL SELECT 'huerfanos_equipo_ciudad', 0,
       COUNT(*) FROM Equipo q LEFT JOIN Ciudad c ON c.id_ciudad = q.id_ciudad WHERE c.id_ciudad IS NULL
UNION ALL SELECT 'huerfanos_evento_temporada', 0,
       COUNT(*) FROM Evento v LEFT JOIN Temporada t ON t.id_temporada = v.id_temporada WHERE t.id_temporada IS NULL
UNION ALL SELECT 'huerfanos_evento_local', 0,
       COUNT(*) FROM Evento v LEFT JOIN Equipo q ON q.id_equipo = v.id_equipo_local WHERE q.id_equipo IS NULL
UNION ALL SELECT 'huerfanos_evento_visitante', 0,
       COUNT(*) FROM Evento v LEFT JOIN Equipo q ON q.id_equipo = v.id_equipo_visitante WHERE q.id_equipo IS NULL
UNION ALL SELECT 'huerfanos_evento_estadio', 0,
       COUNT(*) FROM Evento v LEFT JOIN Estadio e ON e.id_estadio = v.id_estadio WHERE e.id_estadio IS NULL
UNION ALL SELECT 'huerfanos_calendario_evento', 0,
       COUNT(*) FROM CalendarioArbitro k LEFT JOIN Evento v ON v.id_evento = k.id_evento WHERE v.id_evento IS NULL
UNION ALL SELECT 'huerfanos_calendario_arbitro', 0,
       COUNT(*) FROM CalendarioArbitro k LEFT JOIN Arbitro a ON a.id_arbitro = k.id_arbitro WHERE a.id_arbitro IS NULL
UNION ALL SELECT 'huerfanos_mercado', 0,
       COUNT(*) FROM Mercado m LEFT JOIN Evento v ON v.id_evento = m.id_evento WHERE v.id_evento IS NULL
UNION ALL SELECT 'huerfanos_opcion', 0,
       COUNT(*) FROM OpcionApuesta o LEFT JOIN Mercado m ON m.id_mercado = o.id_mercado WHERE m.id_mercado IS NULL
UNION ALL SELECT 'huerfanos_historial', 0,
       COUNT(*) FROM HistorialCuota h LEFT JOIN OpcionApuesta o ON o.id_opcion = h.id_opcion WHERE o.id_opcion IS NULL
UNION ALL SELECT 'huerfanos_resultado', 0,
       COUNT(*) FROM Resultado r LEFT JOIN Evento v ON v.id_evento = r.id_evento WHERE v.id_evento IS NULL
UNION ALL SELECT 'huerfanos_favorito', 0,
       COUNT(*) FROM FavoritoEquipo f LEFT JOIN Equipo q ON q.id_equipo = f.id_equipo WHERE q.id_equipo IS NULL
UNION ALL SELECT 'huerfanos_jugador', 0,
       COUNT(*) FROM Jugador j LEFT JOIN Equipo q ON q.id_equipo = j.id_equipo WHERE q.id_equipo IS NULL;

-- ------------------------------------------------------------- reglas -------
SELECT 'rn16_local_distinto' AS control, 0 AS esperado,
       COUNT(*) AS obtenido FROM Evento WHERE id_equipo_local = id_equipo_visitante;

SELECT 'jugadores_total' AS control, '>=26' AS esperado, COUNT(*) AS obtenido FROM Jugador;

SELECT 'jugadores_por_equipo_min2' AS control, 13 AS esperado,
       COUNT(*) AS obtenido
  FROM (SELECT id_equipo FROM Jugador GROUP BY id_equipo HAVING COUNT(*) >= 2) x;

SELECT 'jugador_camiseta_invalida' AS control, 0 AS esperado,
       COUNT(*) AS obtenido FROM Jugador
 WHERE numero_camiseta IS NOT NULL AND (numero_camiseta < 1 OR numero_camiseta > 99);

SELECT 'jugador_camiseta_duplicada' AS control, 0 AS esperado,
       COUNT(*) AS obtenido
  FROM (SELECT id_equipo, numero_camiseta FROM Jugador
         WHERE numero_camiseta IS NOT NULL
         GROUP BY id_equipo, numero_camiseta HAVING COUNT(*) > 1) d;

SELECT 'vista_activos_filas' AS control, '>0' AS esperado, COUNT(*) AS obtenido FROM vw_EventosActivos;
SELECT 'vista_finalizados_filas' AS control, '>0' AS esperado, COUNT(*) AS obtenido FROM vw_EventosFinalizados;
