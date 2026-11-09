'use strict';

/**
 * Conexion a MySQL (motor auxiliar, sin esquema propio todavia).
 *
 * Mantiene un unico pool creado de forma perezosa. Si la creacion falla, el
 * pool se descarta para permitir un nuevo intento en la siguiente peticion.
 * No registra ni expone credenciales.
 */

const mysql = require('mysql2/promise');
const config = require('../index');

const cfg = config.mysql;

let pool = null;
let creacionEnCurso = null;

function crearPool() {
  return mysql.createPool({
    host: cfg.host,
    port: cfg.puerto,
    database: cfg.baseDatos || undefined,
    user: cfg.usuario || undefined,
    password: cfg.contrasena || undefined,
    connectTimeout: cfg.tiempoConexion,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
  });
}

function obtenerPool() {
  if (pool) return Promise.resolve(pool);
  if (creacionEnCurso) return creacionEnCurso;

  creacionEnCurso = Promise.resolve()
    .then(() => {
      pool = crearPool();
      creacionEnCurso = null;
      return pool;
    })
    .catch((error) => {
      creacionEnCurso = null;
      pool = null;
      throw error;
    });

  return creacionEnCurso;
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
  if (!cfg.host) throw new Error('MySQL no configurado');
  const conexion = await conTimeout(obtenerPool(), cfg.tiempoConexion);
  await conTimeout(conexion.query('SELECT 1 AS ok'), cfg.tiempoConexion);
  return true;
}

/** Cierra el pool y permite reabrirlo despues. */
async function cerrar() {
  const actual = pool;
  pool = null;
  creacionEnCurso = null;
  if (!actual) return;
  try {
    await actual.end();
  } catch (_error) {
    /* cierre silencioso */
  }
}

module.exports = { ping, cerrar, obtenerPool };
