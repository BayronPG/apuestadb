'use strict';

/**
 * Repositorio de JUGADOR (tabla nueva de MySQL, Fase 15).
 *
 * Jugador es un registro de catalogo: pertenece a Equipo y no interviene en
 * apuestas, mercados, resultados ni saldos. Siempre se consulta en MySQL.
 */

const mysql = require('../config/db/mysql');

async function consultar(texto, parametros = []) {
  const pool = await mysql.obtenerPool();
  const [filas] = await pool.query(texto, parametros);
  return filas;
}

/** Lista jugadores; opcionalmente filtra por equipo. */
async function listar({ idEquipo = null } = {}) {
  if (idEquipo) {
    return consultar(
      `SELECT j.id_jugador, j.id_equipo, e.nombre AS equipo,
              j.nombres, j.apellidos, j.numero_camiseta, j.posicion,
              j.fecha_nacimiento, j.nacionalidad, j.estado, j.fecha_creacion
         FROM Jugador j
         JOIN Equipo e ON e.id_equipo = j.id_equipo
        WHERE j.id_equipo = ?
        ORDER BY j.apellidos ASC, j.nombres ASC`,
      [idEquipo],
    );
  }
  return consultar(
    `SELECT j.id_jugador, j.id_equipo, e.nombre AS equipo,
            j.nombres, j.apellidos, j.numero_camiseta, j.posicion,
            j.fecha_nacimiento, j.nacionalidad, j.estado, j.fecha_creacion
       FROM Jugador j
       JOIN Equipo e ON e.id_equipo = j.id_equipo
      ORDER BY e.nombre ASC, j.apellidos ASC, j.nombres ASC`,
  );
}

/** Devuelve un jugador por identificador o null. */
async function obtenerPorId(idJugador) {
  const filas = await consultar(
    `SELECT j.id_jugador, j.id_equipo, e.nombre AS equipo,
            j.nombres, j.apellidos, j.numero_camiseta, j.posicion,
            j.fecha_nacimiento, j.nacionalidad, j.estado, j.fecha_creacion
       FROM Jugador j
       JOIN Equipo e ON e.id_equipo = j.id_equipo
      WHERE j.id_jugador = ?`,
    [idJugador],
  );
  return filas[0] || null;
}

/** Comprueba si el equipo existe en MySQL. */
async function existeEquipo(idEquipo) {
  const filas = await consultar('SELECT id_equipo FROM Equipo WHERE id_equipo = ?', [idEquipo]);
  return filas.length > 0;
}

/** Comprueba si la camiseta ya esta ocupada en el equipo. */
async function existeCamiseta(idEquipo, numeroCamiseta) {
  if (numeroCamiseta === null || numeroCamiseta === undefined) return false;
  const filas = await consultar(
    'SELECT id_jugador FROM Jugador WHERE id_equipo = ? AND numero_camiseta = ?',
    [idEquipo, numeroCamiseta],
  );
  return filas.length > 0;
}

/** Inserta un jugador y devuelve la fila creada. */
async function crear(datos) {
  const pool = await mysql.obtenerPool();
  const [resultado] = await pool.query(
    `INSERT INTO Jugador
       (id_equipo, nombres, apellidos, numero_camiseta, posicion,
        fecha_nacimiento, nacionalidad, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.idEquipo,
      datos.nombres,
      datos.apellidos,
      datos.numeroCamiseta,
      datos.posicion,
      datos.fechaNacimiento,
      datos.nacionalidad,
      datos.estado,
    ],
  );
  return obtenerPorId(resultado.insertId);
}

module.exports = { listar, obtenerPorId, existeEquipo, existeCamiseta, crear };
