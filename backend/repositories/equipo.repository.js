'use strict';

const mysql = require('../config/db/mysql');

async function listarParaAsociar() {
  const pool = await mysql.obtenerPool();
  const [filas] = await pool.query('SELECT id_equipo, nombre FROM Equipo');
  return filas;
}

async function actualizarLogo(idEquipo, { fileId, url }) {
  const pool = await mysql.obtenerPool();
  const [resultado] = await pool.query(
    'UPDATE Equipo SET logo_file_id = ?, logo_url = ? WHERE id_equipo = ?',
    [fileId, url, idEquipo],
  );
  if (resultado.affectedRows === 0) return null;
  const [filas] = await pool.query(
    'SELECT id_equipo, nombre, logo_file_id, logo_url FROM Equipo WHERE id_equipo = ?',
    [idEquipo],
  );
  return filas[0] || null;
}

module.exports = { listarParaAsociar, actualizarLogo };
