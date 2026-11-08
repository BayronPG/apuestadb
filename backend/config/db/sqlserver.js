'use strict';

/**
 * Conexion a SQL Server (motor funcional de ApuestaDB).
 *
 * No abre un pool propio: delega en `config/database.js`, que ya mantiene el
 * pool compartido que consumen los repositorios. Este modulo solo expone la
 * interfaz comun (ping / cerrar / obtenerPool) para el health multimotor.
 */

const database = require('../database');

/** Comprueba la conectividad con SQL Server. */
async function ping() {
  const conectado = await database.probarConexion();
  if (!conectado) throw new Error('SQL Server sin respuesta');
  return true;
}

/** Devuelve el pool compartido existente. */
function obtenerPool() {
  return database.obtenerPool();
}

/** Cierra el pool compartido. */
async function cerrar() {
  await database.cerrarPool();
}

module.exports = { ping, cerrar, obtenerPool };
