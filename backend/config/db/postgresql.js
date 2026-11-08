'use strict';

/**
 * Conexion a PostgreSQL (motor auxiliar, sin esquema propio todavia).
 *
 * Pool unico y perezoso con `pg.Pool`. Si la creacion falla se descarta para
 * permitir reconexion posterior. No registra ni expone credenciales.
 */

const { Pool } = require('pg');
const config = require('../index');

const cfg = config.postgresql;

let pool = null;

function obtenerPool() {
  if (!pool) {
    pool = new Pool({
      host: cfg.host,
      port: cfg.puerto,
      database: cfg.baseDatos || undefined,
      user: cfg.usuario || undefined,
      password: cfg.contrasena || undefined,
      connectionTimeoutMillis: cfg.tiempoConexion,
      idleTimeoutMillis: 30000,
      max: 5,
      query_timeout: cfg.tiempoConexion,
    });
    // Un error del pool no debe tumbar el proceso.
    pool.on('error', () => {
      /* se ignora: el estado se reporta por ping() */
    });
  }
  return pool;
}

function conTimeout(promesa, ms) {
  let temporizador;
  const limite = new Promise((_resolver, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('tiempo de espera agotado')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

/** Ping con `SELECT 1 AS ok`. Lanza un error saneado si falla. */
async function ping() {
  if (!cfg.host) throw new Error('PostgreSQL no configurado');
  const actual = obtenerPool();
  const resultado = await conTimeout(actual.query('SELECT 1 AS ok'), cfg.tiempoConexion);
  if (!resultado || !resultado.rows || resultado.rows.length === 0) {
    throw new Error('PostgreSQL sin respuesta');
  }
  return true;
}

/** Cierra el pool y permite reabrirlo despues. */
async function cerrar() {
  const actual = pool;
  pool = null;
  if (!actual) return;
  try {
    await actual.end();
  } catch (_error) {
    /* cierre silencioso */
  }
}

module.exports = { ping, cerrar, obtenerPool };
