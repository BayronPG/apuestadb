'use strict';

/**
 * Conexion a MongoDB (motor auxiliar, sin colecciones todavia).
 *
 * Usa el `MongoClient` oficial con una unica instancia perezosa. Si la
 * conexion falla, el cliente se descarta para permitir un nuevo intento.
 * No registra ni expone la URI ni credenciales.
 */

const { MongoClient } = require('mongodb');
const config = require('../index');

const cfg = config.mongodb;

let cliente = null;
let conexionEnCurso = null;
let base = null;

function conTimeout(promesa, ms) {
  let temporizador;
  const limite = new Promise((_resolver, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('tiempo de espera agotado')), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

function conectar() {
  if (cliente) return Promise.resolve(cliente);
  if (conexionEnCurso) return conexionEnCurso;

  conexionEnCurso = (async () => {
    const nuevo = new MongoClient(cfg.uri, {
      serverSelectionTimeoutMS: cfg.tiempoConexion,
      connectTimeoutMS: cfg.tiempoConexion,
      maxPoolSize: 5,
    });
    try {
      await conTimeout(nuevo.connect(), cfg.tiempoConexion);
      cliente = nuevo;
      base = nuevo.db(cfg.baseDatos || undefined);
      conexionEnCurso = null;
      return nuevo;
    } catch (error) {
      try {
        await nuevo.close(true);
      } catch (_e) {
        /* cierre silencioso */
      }
      cliente = null;
      base = null;
      conexionEnCurso = null;
      throw error;
    }
  })();

  return conexionEnCurso;
}

/** Ping con `db.command({ ping: 1 })`. Lanza un error saneado si falla. */
async function ping() {
  if (!cfg.uri) throw new Error('MongoDB no configurado');
  await conectar();
  const db = base || (cliente && cliente.db(cfg.baseDatos || undefined));
  if (!db) throw new Error('MongoDB no configurado');
  const respuesta = await conTimeout(db.command({ ping: 1 }), cfg.tiempoConexion);
  if (!respuesta || respuesta.ok !== 1) throw new Error('MongoDB sin respuesta');
  return true;
}

/** Devuelve la base configurada (solo cuando el cliente ya esta conectado). */
function obtenerDb() {
  return base;
}

/** Cierra el cliente y permite reconectar despues. */
async function cerrar() {
  const actual = cliente;
  cliente = null;
  base = null;
  conexionEnCurso = null;
  if (!actual) return;
  try {
    await actual.close(true);
  } catch (_error) {
    /* cierre silencioso */
  }
}

module.exports = { ping, cerrar, obtenerDb };
