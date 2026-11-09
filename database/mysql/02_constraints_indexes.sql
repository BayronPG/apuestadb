-- ============================================================================
-- APUESTADB - database/mysql/02_constraints_indexes.sql
-- UNIQUE, CHECK, FOREIGN KEY e indices del catalogo MySQL (Fase 15).
--
-- Idempotente: cada objeto se agrega solo si no existe (information_schema).
-- Requiere: 01_schema.sql.
-- ============================================================================

USE apuestadb;

DROP PROCEDURE IF EXISTS sp_add_unique;
DROP PROCEDURE IF EXISTS sp_add_check;
DROP PROCEDURE IF EXISTS sp_add_fk;
DROP PROCEDURE IF EXISTS sp_add_index;

DROP PROCEDURE IF EXISTS sp_add_column;

DELIMITER //

CREATE PROCEDURE sp_add_unique(IN p_tabla VARCHAR(64), IN p_nombre VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = p_tabla
       AND CONSTRAINT_NAME = p_nombre
  ) THEN
    SET @ddl = p_ddl;
    PREPARE st FROM @ddl;
    EXECUTE st;
    DEALLOCATE PREPARE st;
  END IF;
END //

CREATE PROCEDURE sp_add_check(IN p_tabla VARCHAR(64), IN p_nombre VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = p_tabla
       AND CONSTRAINT_NAME = p_nombre
  ) THEN
    SET @ddl = p_ddl;
    PREPARE st FROM @ddl;
    EXECUTE st;
    DEALLOCATE PREPARE st;
  END IF;
END //

CREATE PROCEDURE sp_add_fk(IN p_tabla VARCHAR(64), IN p_nombre VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = p_tabla
       AND CONSTRAINT_NAME = p_nombre
  ) THEN
    SET @ddl = p_ddl;
    PREPARE st FROM @ddl;
    EXECUTE st;
    DEALLOCATE PREPARE st;
  END IF;
END //

CREATE PROCEDURE sp_add_index(IN p_tabla VARCHAR(64), IN p_nombre VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = p_tabla
       AND INDEX_NAME = p_nombre
  ) THEN
    SET @ddl = p_ddl;
    PREPARE st FROM @ddl;
    EXECUTE st;
    DEALLOCATE PREPARE st;
  END IF;
END //

CREATE PROCEDURE sp_add_column(IN p_tabla VARCHAR(64), IN p_columna VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = p_tabla
       AND COLUMN_NAME = p_columna
  ) THEN
    SET @ddl = p_ddl;
    PREPARE st FROM @ddl;
    EXECUTE st;
    DEALLOCATE PREPARE st;
  END IF;
END //

DELIMITER ;

-- ------------------------------------------------------------- COLUMNAS ----
CALL sp_add_column('Equipo', 'logo_file_id',
  'ALTER TABLE Equipo ADD COLUMN logo_file_id VARCHAR(100) NULL');
CALL sp_add_column('Equipo', 'logo_url',
  'ALTER TABLE Equipo ADD COLUMN logo_url VARCHAR(500) NULL');

-- --------------------------------------------------------------- UNIQUE -----
CALL sp_add_unique('Pais', 'UQ_Pais_nombre',
  'ALTER TABLE Pais ADD CONSTRAINT UQ_Pais_nombre UNIQUE (nombre)');
CALL sp_add_unique('Pais', 'UQ_Pais_codigo',
  'ALTER TABLE Pais ADD CONSTRAINT UQ_Pais_codigo UNIQUE (codigo)');
CALL sp_add_unique('Ciudad', 'UQ_Ciudad',
  'ALTER TABLE Ciudad ADD CONSTRAINT UQ_Ciudad UNIQUE (id_pais, nombre)');
CALL sp_add_unique('Estadio', 'UQ_Estadio',
  'ALTER TABLE Estadio ADD CONSTRAINT UQ_Estadio UNIQUE (id_ciudad, nombre)');
CALL sp_add_unique('Deporte', 'UQ_Deporte_nombre',
  'ALTER TABLE Deporte ADD CONSTRAINT UQ_Deporte_nombre UNIQUE (nombre)');
CALL sp_add_unique('Liga', 'UQ_Liga',
  'ALTER TABLE Liga ADD CONSTRAINT UQ_Liga UNIQUE (id_deporte, nombre)');
CALL sp_add_unique('Temporada', 'UQ_Temporada',
  'ALTER TABLE Temporada ADD CONSTRAINT UQ_Temporada UNIQUE (id_liga, etiqueta)');
CALL sp_add_unique('Equipo', 'UQ_Equipo',
  'ALTER TABLE Equipo ADD CONSTRAINT UQ_Equipo UNIQUE (id_deporte, nombre)');
CALL sp_add_unique('Evento', 'UQ_Evento',
  'ALTER TABLE Evento ADD CONSTRAINT UQ_Evento UNIQUE (id_temporada, id_equipo_local, id_equipo_visitante, fecha_hora_inicio)');
CALL sp_add_unique('CalendarioArbitro', 'UQ_CalendarioArbitro',
  'ALTER TABLE CalendarioArbitro ADD CONSTRAINT UQ_CalendarioArbitro UNIQUE (id_evento, id_arbitro)');
CALL sp_add_unique('Mercado', 'UQ_Mercado',
  'ALTER TABLE Mercado ADD CONSTRAINT UQ_Mercado UNIQUE (id_evento, nombre)');
CALL sp_add_unique('OpcionApuesta', 'UQ_OpcionApuesta',
  'ALTER TABLE OpcionApuesta ADD CONSTRAINT UQ_OpcionApuesta UNIQUE (id_mercado, etiqueta)');
CALL sp_add_unique('HistorialCuota', 'UQ_HistorialCuota',
  'ALTER TABLE HistorialCuota ADD CONSTRAINT UQ_HistorialCuota UNIQUE (id_opcion, fecha_hora_cambio)');
CALL sp_add_unique('Resultado', 'UQ_Resultado',
  'ALTER TABLE Resultado ADD CONSTRAINT UQ_Resultado UNIQUE (id_evento)');
CALL sp_add_unique('FavoritoEquipo', 'UQ_FavoritoEquipo',
  'ALTER TABLE FavoritoEquipo ADD CONSTRAINT UQ_FavoritoEquipo UNIQUE (id_usuario, id_equipo)');
CALL sp_add_unique('Jugador', 'UQ_Jugador_camiseta',
  'ALTER TABLE Jugador ADD CONSTRAINT UQ_Jugador_camiseta UNIQUE (id_equipo, numero_camiseta)');

-- ---------------------------------------------------------------- CHECK -----
CALL sp_add_check('Estadio', 'CK_Estadio_capacidad',
  'ALTER TABLE Estadio ADD CONSTRAINT CK_Estadio_capacidad CHECK (capacidad IS NULL OR capacidad >= 0)');
CALL sp_add_check('Deporte', 'CK_Deporte_estado',
  "ALTER TABLE Deporte ADD CONSTRAINT CK_Deporte_estado CHECK (estado IN ('vigente','inactivo'))");
CALL sp_add_check('Liga', 'CK_Liga_estado',
  "ALTER TABLE Liga ADD CONSTRAINT CK_Liga_estado CHECK (estado IN ('vigente','inactivo'))");
CALL sp_add_check('Temporada', 'CK_Temporada_estado',
  "ALTER TABLE Temporada ADD CONSTRAINT CK_Temporada_estado CHECK (estado IN ('en_curso','finalizada'))");
CALL sp_add_check('Temporada', 'CK_Temporada_fechas',
  'ALTER TABLE Temporada ADD CONSTRAINT CK_Temporada_fechas CHECK (fecha_inicio <= fecha_fin)');
CALL sp_add_check('Equipo', 'CK_Equipo_estado',
  "ALTER TABLE Equipo ADD CONSTRAINT CK_Equipo_estado CHECK (estado IN ('vigente','inactivo'))");
CALL sp_add_check('Arbitro', 'CK_Arbitro_estado',
  "ALTER TABLE Arbitro ADD CONSTRAINT CK_Arbitro_estado CHECK (estado IN ('vigente','inactivo'))");
CALL sp_add_check('Evento', 'CK_Evento_estado',
  "ALTER TABLE Evento ADD CONSTRAINT CK_Evento_estado CHECK (estado IN ('programado','en_curso','finalizado','cancelado','suspendido'))");
CALL sp_add_check('Evento', 'CK_Evento_equipos',
  'ALTER TABLE Evento ADD CONSTRAINT CK_Evento_equipos CHECK (id_equipo_local <> id_equipo_visitante)');
CALL sp_add_check('CalendarioArbitro', 'CK_CalendarioArbitro_rol',
  "ALTER TABLE CalendarioArbitro ADD CONSTRAINT CK_CalendarioArbitro_rol CHECK (rol_arbitro IN ('principal','asistente'))");
CALL sp_add_check('Mercado', 'CK_Mercado_estado',
  "ALTER TABLE Mercado ADD CONSTRAINT CK_Mercado_estado CHECK (estado IN ('abierto','cerrado','anulado'))");
CALL sp_add_check('Mercado', 'CK_Mercado_fechas',
  'ALTER TABLE Mercado ADD CONSTRAINT CK_Mercado_fechas CHECK (fecha_apertura <= fecha_cierre)');
CALL sp_add_check('OpcionApuesta', 'CK_OpcionApuesta_etiqueta',
  "ALTER TABLE OpcionApuesta ADD CONSTRAINT CK_OpcionApuesta_etiqueta CHECK (etiqueta IN ('local','empate','visitante'))");
CALL sp_add_check('OpcionApuesta', 'CK_OpcionApuesta_cuota',
  'ALTER TABLE OpcionApuesta ADD CONSTRAINT CK_OpcionApuesta_cuota CHECK (cuota_vigente > 0)');
CALL sp_add_check('OpcionApuesta', 'CK_OpcionApuesta_estado',
  "ALTER TABLE OpcionApuesta ADD CONSTRAINT CK_OpcionApuesta_estado CHECK (estado IN ('habilitada','deshabilitada'))");
CALL sp_add_check('HistorialCuota', 'CK_HistorialCuota_valor',
  'ALTER TABLE HistorialCuota ADD CONSTRAINT CK_HistorialCuota_valor CHECK (valor_cuota > 0)');
CALL sp_add_check('Resultado', 'CK_Resultado_marcadores',
  'ALTER TABLE Resultado ADD CONSTRAINT CK_Resultado_marcadores CHECK (marcador_local >= 0 AND marcador_visitante >= 0)');
CALL sp_add_check('Resultado', 'CK_Resultado_estado',
  "ALTER TABLE Resultado ADD CONSTRAINT CK_Resultado_estado CHECK (estado IN ('oficial','provisional'))");
CALL sp_add_check('Jugador', 'CK_Jugador_camiseta',
  'ALTER TABLE Jugador ADD CONSTRAINT CK_Jugador_camiseta CHECK (numero_camiseta IS NULL OR (numero_camiseta BETWEEN 1 AND 99))');
CALL sp_add_check('Jugador', 'CK_Jugador_estado',
  "ALTER TABLE Jugador ADD CONSTRAINT CK_Jugador_estado CHECK (estado IN ('activo','inactivo'))");

-- ----------------------------------------------------------- FOREIGN KEY ----
CALL sp_add_fk('Ciudad', 'FK_Ciudad_Pais',
  'ALTER TABLE Ciudad ADD CONSTRAINT FK_Ciudad_Pais FOREIGN KEY (id_pais) REFERENCES Pais (id_pais)');
CALL sp_add_fk('Estadio', 'FK_Estadio_Ciudad',
  'ALTER TABLE Estadio ADD CONSTRAINT FK_Estadio_Ciudad FOREIGN KEY (id_ciudad) REFERENCES Ciudad (id_ciudad)');
CALL sp_add_fk('Liga', 'FK_Liga_Deporte',
  'ALTER TABLE Liga ADD CONSTRAINT FK_Liga_Deporte FOREIGN KEY (id_deporte) REFERENCES Deporte (id_deporte)');
CALL sp_add_fk('Temporada', 'FK_Temporada_Liga',
  'ALTER TABLE Temporada ADD CONSTRAINT FK_Temporada_Liga FOREIGN KEY (id_liga) REFERENCES Liga (id_liga)');
CALL sp_add_fk('Equipo', 'FK_Equipo_Deporte',
  'ALTER TABLE Equipo ADD CONSTRAINT FK_Equipo_Deporte FOREIGN KEY (id_deporte) REFERENCES Deporte (id_deporte)');
CALL sp_add_fk('Equipo', 'FK_Equipo_Ciudad',
  'ALTER TABLE Equipo ADD CONSTRAINT FK_Equipo_Ciudad FOREIGN KEY (id_ciudad) REFERENCES Ciudad (id_ciudad)');
CALL sp_add_fk('Evento', 'FK_Evento_Temporada',
  'ALTER TABLE Evento ADD CONSTRAINT FK_Evento_Temporada FOREIGN KEY (id_temporada) REFERENCES Temporada (id_temporada)');
CALL sp_add_fk('Evento', 'FK_Evento_EquipoLocal',
  'ALTER TABLE Evento ADD CONSTRAINT FK_Evento_EquipoLocal FOREIGN KEY (id_equipo_local) REFERENCES Equipo (id_equipo)');
CALL sp_add_fk('Evento', 'FK_Evento_EquipoVisitante',
  'ALTER TABLE Evento ADD CONSTRAINT FK_Evento_EquipoVisitante FOREIGN KEY (id_equipo_visitante) REFERENCES Equipo (id_equipo)');
CALL sp_add_fk('Evento', 'FK_Evento_Estadio',
  'ALTER TABLE Evento ADD CONSTRAINT FK_Evento_Estadio FOREIGN KEY (id_estadio) REFERENCES Estadio (id_estadio)');
CALL sp_add_fk('CalendarioArbitro', 'FK_Calendario_Evento',
  'ALTER TABLE CalendarioArbitro ADD CONSTRAINT FK_Calendario_Evento FOREIGN KEY (id_evento) REFERENCES Evento (id_evento) ON DELETE CASCADE');
CALL sp_add_fk('CalendarioArbitro', 'FK_Calendario_Arbitro',
  'ALTER TABLE CalendarioArbitro ADD CONSTRAINT FK_Calendario_Arbitro FOREIGN KEY (id_arbitro) REFERENCES Arbitro (id_arbitro)');
CALL sp_add_fk('Mercado', 'FK_Mercado_Evento',
  'ALTER TABLE Mercado ADD CONSTRAINT FK_Mercado_Evento FOREIGN KEY (id_evento) REFERENCES Evento (id_evento)');
CALL sp_add_fk('OpcionApuesta', 'FK_Opcion_Mercado',
  'ALTER TABLE OpcionApuesta ADD CONSTRAINT FK_Opcion_Mercado FOREIGN KEY (id_mercado) REFERENCES Mercado (id_mercado)');
CALL sp_add_fk('HistorialCuota', 'FK_Historial_Opcion',
  'ALTER TABLE HistorialCuota ADD CONSTRAINT FK_Historial_Opcion FOREIGN KEY (id_opcion) REFERENCES OpcionApuesta (id_opcion) ON DELETE CASCADE');
CALL sp_add_fk('Resultado', 'FK_Resultado_Evento',
  'ALTER TABLE Resultado ADD CONSTRAINT FK_Resultado_Evento FOREIGN KEY (id_evento) REFERENCES Evento (id_evento)');
CALL sp_add_fk('FavoritoEquipo', 'FK_Favorito_Equipo',
  'ALTER TABLE FavoritoEquipo ADD CONSTRAINT FK_Favorito_Equipo FOREIGN KEY (id_equipo) REFERENCES Equipo (id_equipo) ON DELETE CASCADE');
CALL sp_add_fk('Jugador', 'FK_Jugador_Equipo',
  'ALTER TABLE Jugador ADD CONSTRAINT FK_Jugador_Equipo FOREIGN KEY (id_equipo) REFERENCES Equipo (id_equipo)');

-- --------------------------------------------------------------- INDICES ----
CALL sp_add_index('Equipo', 'IX_Equipo_Ciudad',
  'CREATE INDEX IX_Equipo_Ciudad ON Equipo (id_ciudad)');
CALL sp_add_index('Evento', 'IX_Evento_EquipoLocal',
  'CREATE INDEX IX_Evento_EquipoLocal ON Evento (id_equipo_local)');
CALL sp_add_index('Evento', 'IX_Evento_EquipoVisitante',
  'CREATE INDEX IX_Evento_EquipoVisitante ON Evento (id_equipo_visitante)');
CALL sp_add_index('Evento', 'IX_Evento_Estadio',
  'CREATE INDEX IX_Evento_Estadio ON Evento (id_estadio)');
CALL sp_add_index('Evento', 'IX_Evento_Estado_Fecha',
  'CREATE INDEX IX_Evento_Estado_Fecha ON Evento (estado, fecha_hora_inicio)');
CALL sp_add_index('CalendarioArbitro', 'IX_Calendario_Arbitro',
  'CREATE INDEX IX_Calendario_Arbitro ON CalendarioArbitro (id_arbitro)');
CALL sp_add_index('FavoritoEquipo', 'IX_Favorito_Equipo',
  'CREATE INDEX IX_Favorito_Equipo ON FavoritoEquipo (id_equipo)');
CALL sp_add_index('Resultado', 'IX_Resultado_Evento',
  'CREATE INDEX IX_Resultado_Evento ON Resultado (id_evento)');
CALL sp_add_index('Jugador', 'IX_Jugador_Equipo',
  'CREATE INDEX IX_Jugador_Equipo ON Jugador (id_equipo)');
CALL sp_add_index('Jugador', 'IX_Jugador_Nombre',
  'CREATE INDEX IX_Jugador_Nombre ON Jugador (apellidos, nombres)');

DROP PROCEDURE IF EXISTS sp_add_unique;
DROP PROCEDURE IF EXISTS sp_add_check;
DROP PROCEDURE IF EXISTS sp_add_fk;
DROP PROCEDURE IF EXISTS sp_add_index;
