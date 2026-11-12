-- ============================================================================
-- APUESTADB - database/mysql/01_schema.sql
-- Esquema MySQL 8 del catalogo deportivo (Fase 15).
--
-- Alcance:
--   * 15 tablas migradas desde SQL Server: Pais, Ciudad, Estadio, Deporte,
--     Liga, Temporada, Equipo, Arbitro, Evento, CalendarioArbitro, Mercado,
--     OpcionApuesta, HistorialCuota, Resultado, FavoritoEquipo.
--   * 1 tabla nueva: Jugador (pertenece a Equipo).
--   * 2 vistas equivalentes a SQL Server: vw_EventosActivos,
--     vw_EventosFinalizados.
--
-- Decisiones:
--   * Estadio representa la cancha solicitada por el profesor.
--   * FavoritoEquipo.id_usuario es una referencia logica a SQL Server (sin FK).
--   * Resultado permanece junto a Evento en MySQL.
--   * InnoDB + utf8mb4 + utf8mb4_0900_ai_ci.
--
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS apuestadb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE apuestadb;

-- ---------------------------------------------------------------- catalogo --
CREATE TABLE IF NOT EXISTS Pais (
  id_pais INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(10) NULL,
  PRIMARY KEY (id_pais)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Ciudad (
  id_ciudad INT NOT NULL AUTO_INCREMENT,
  id_pais INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  region VARCHAR(100) NULL,
  PRIMARY KEY (id_ciudad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Estadio (
  id_estadio INT NOT NULL AUTO_INCREMENT,
  id_ciudad INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  capacidad INT NULL,
  direccion VARCHAR(200) NULL,
  PRIMARY KEY (id_estadio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Deporte (
  id_deporte INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente',
  PRIMARY KEY (id_deporte)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Liga (
  id_liga INT NOT NULL AUTO_INCREMENT,
  id_deporte INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente',
  PRIMARY KEY (id_liga)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Temporada (
  id_temporada INT NOT NULL AUTO_INCREMENT,
  id_liga INT NOT NULL,
  etiqueta VARCHAR(20) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'en_curso',
  PRIMARY KEY (id_temporada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Equipo (
  id_equipo INT NOT NULL AUTO_INCREMENT,
  id_deporte INT NOT NULL,
  id_ciudad INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  siglas VARCHAR(10) NULL,
  fecha_fundacion DATE NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente',
  logo_file_id VARCHAR(100) NULL,
  logo_url VARCHAR(500) NULL,
  PRIMARY KEY (id_equipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Arbitro (
  id_arbitro INT NOT NULL AUTO_INCREMENT,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'vigente',
  PRIMARY KEY (id_arbitro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Evento (
  id_evento INT NOT NULL AUTO_INCREMENT,
  id_temporada INT NOT NULL,
  id_equipo_local INT NOT NULL,
  id_equipo_visitante INT NOT NULL,
  id_estadio INT NOT NULL,
  fecha_hora_inicio DATETIME(3) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programado',
  descripcion VARCHAR(255) NULL,
  PRIMARY KEY (id_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS CalendarioArbitro (
  id_calendario INT NOT NULL AUTO_INCREMENT,
  id_evento INT NOT NULL,
  id_arbitro INT NOT NULL,
  rol_arbitro VARCHAR(20) NOT NULL DEFAULT 'principal',
  fecha_designacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_calendario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Mercado (
  id_mercado INT NOT NULL AUTO_INCREMENT,
  id_evento INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NULL,
  fecha_apertura DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_cierre DATETIME(3) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
  PRIMARY KEY (id_mercado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS OpcionApuesta (
  id_opcion INT NOT NULL AUTO_INCREMENT,
  id_mercado INT NOT NULL,
  etiqueta VARCHAR(20) NOT NULL,
  cuota_vigente DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_opcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS HistorialCuota (
  id_historial BIGINT NOT NULL AUTO_INCREMENT,
  id_opcion INT NOT NULL,
  valor_cuota DECIMAL(10,2) NOT NULL,
  fecha_hora_cambio DATETIME(3) NOT NULL,
  motivo VARCHAR(255) NULL,
  PRIMARY KEY (id_historial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS Resultado (
  id_resultado INT NOT NULL AUTO_INCREMENT,
  id_evento INT NOT NULL,
  marcador_local SMALLINT NOT NULL,
  marcador_visitante SMALLINT NOT NULL,
  fecha_registro DATETIME(3) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_resultado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Referencia logica a Usuario (SQL Server): sin FK entre motores.
CREATE TABLE IF NOT EXISTS FavoritoEquipo (
  id_favorito INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_equipo INT NOT NULL,
  fecha_marcado DATETIME(3) NOT NULL,
  PRIMARY KEY (id_favorito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------ tabla nueva --
CREATE TABLE IF NOT EXISTS Jugador (
  id_jugador BIGINT NOT NULL AUTO_INCREMENT,
  id_equipo INT NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  numero_camiseta INT NULL,
  posicion VARCHAR(50) NULL,
  fecha_nacimiento DATE NULL,
  nacionalidad VARCHAR(100) NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo',
  fecha_creacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_jugador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------------ vistas --
CREATE OR REPLACE VIEW vw_EventosActivos AS
SELECT e.id_evento,
       d.nombre AS deporte,
       l.nombre AS liga,
       t.etiqueta AS temporada,
       el.nombre AS equipo_local,
       ev.nombre AS equipo_visitante,
       es.nombre AS estadio,
       e.fecha_hora_inicio,
       e.estado,
       (SELECT COUNT(*) FROM Mercado m
         WHERE m.id_evento = e.id_evento AND m.estado = 'abierto') AS mercados_abiertos
FROM Evento e
JOIN Temporada t ON t.id_temporada = e.id_temporada
JOIN Liga l      ON l.id_liga = t.id_liga
JOIN Deporte d   ON d.id_deporte = l.id_deporte
JOIN Equipo el   ON el.id_equipo = e.id_equipo_local
JOIN Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
JOIN Estadio es  ON es.id_estadio = e.id_estadio
WHERE e.estado IN ('programado','en_curso');

CREATE OR REPLACE VIEW vw_EventosFinalizados AS
SELECT e.id_evento,
       d.nombre AS deporte,
       l.nombre AS liga,
       el.nombre AS equipo_local,
       ev.nombre AS equipo_visitante,
       e.fecha_hora_inicio,
       r.marcador_local,
       r.marcador_visitante,
       CASE
         WHEN r.marcador_local IS NULL OR r.marcador_visitante IS NULL THEN NULL
         WHEN r.marcador_local > r.marcador_visitante THEN 'local'
         WHEN r.marcador_local < r.marcador_visitante THEN 'visitante'
         ELSE 'empate'
       END AS opcion_ganadora,
       r.estado AS estado_resultado,
       r.fecha_registro
FROM Evento e
JOIN Temporada t ON t.id_temporada = e.id_temporada
JOIN Liga l      ON l.id_liga = t.id_liga
JOIN Deporte d   ON d.id_deporte = l.id_deporte
JOIN Equipo el   ON el.id_equipo = e.id_equipo_local
JOIN Equipo ev   ON ev.id_equipo = e.id_equipo_visitante
LEFT JOIN Resultado r ON r.id_evento = e.id_evento
WHERE e.estado = 'finalizado';
