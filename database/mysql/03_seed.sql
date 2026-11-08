-- ============================================================================
-- APUESTADB - database/mysql/03_seed.sql
-- Semilla academica de la tabla nueva Jugador (Fase 15).
--
-- Reglas:
--   * Minimo 2 jugadores ficticios por equipo existente (13 equipos demo).
--   * Nombres claramente ficticios: no representan personas reales.
--   * Sin correos, documentos, telefonos ni datos personales.
--   * Idempotente: solo inserta la camiseta que aun no existe en el equipo.
--
-- Requiere: 01_schema.sql, 02_constraints_indexes.sql y la migracion de Equipo.
-- ============================================================================

USE apuestadb;

INSERT INTO Jugador
  (id_equipo, nombres, apellidos, numero_camiseta, posicion, fecha_nacimiento, nacionalidad, estado)
SELECT e.id_equipo,
       CONCAT('Titular ', LPAD(e.id_equipo, 2, '0'), ' ', v.sufijo),
       CASE v.orden WHEN 1 THEN 'Demo Norte' ELSE 'Demo Sur' END,
       v.camiseta,
       CASE v.orden WHEN 1 THEN 'Defensa' ELSE 'Delantero' END,
       DATE_ADD('1995-01-15', INTERVAL (e.id_equipo * 7 + v.orden) DAY),
       'Colombia',
       'activo'
  FROM Equipo e
  JOIN (SELECT 1 AS orden, 8 AS camiseta, 'A' AS sufijo
        UNION ALL
        SELECT 2 AS orden, 17 AS camiseta, 'B' AS sufijo) v
 WHERE NOT EXISTS (
   SELECT 1 FROM Jugador j
    WHERE j.id_equipo = e.id_equipo
      AND j.numero_camiseta = v.camiseta
 );
