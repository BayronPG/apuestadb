'use strict';

/**
 * Historial de transacciones en Firestore (paralelo a PostgreSQL).
 * PostgreSQL sigue siendo la fuente de verdad financiera.
 * Si no hay credenciales, las funciones no hacen nada y la API lo informa.
 */

const config = require('../config');

let app = null;
let db = null;
let intento = false;

function habilitado() {
  return Boolean(config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey);
}

function obtenerDb() {
  if (!habilitado()) return null;
  if (db) return db;
  if (intento) return null;
  intento = true;
  try {
    // firebase-admin v12+: API modular; versiones antiguas exponen admin.credential.cert.
    // eslint-disable-next-line global-require
    const { initializeApp, cert, getApps } = require('firebase-admin/app');
    // eslint-disable-next-line global-require
    const { getFirestore } = require('firebase-admin/firestore');
    if (!app) {
      const credencial = cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      });
      app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: credencial });
    }
    db = getFirestore(app);
  } catch (_error) {
    db = null;
  }
  return db;
}

/**
 * Guarda una transacción Wompi. No lanza: si Firestore falla, el flujo de pago continúa.
 * @param {{idUsuario:number, referencia:string, monto:number, estado:string, fecha?:string}} datos
 */
async function guardarTransaccion(datos) {
  const base = obtenerDb();
  if (!base) return false;
  try {
    await base.collection(config.firebase.collection).doc(datos.referencia).set({
      idUsuario: Number(datos.idUsuario),
      referencia: datos.referencia,
      monto: Number(datos.monto),
      estado: datos.estado,
      fecha: datos.fecha ? new Date(datos.fecha) : new Date(),
    }, { merge: true });
    return true;
  } catch (_error) {
    return false;
  }
}

/** Lista las transacciones de un usuario (más recientes primero). */
async function listarTransacciones(idUsuario, limite = 50) {
  const base = obtenerDb();
  if (!base) return { habilitado: false, transacciones: [] };
  // Sin orderBy para evitar un índice compuesto: se ordena en memoria.
  const consulta = await base
    .collection(config.firebase.collection)
    .where('idUsuario', '==', Number(idUsuario))
    .get();
  const transacciones = consulta.docs.map((doc) => {
    const dato = doc.data();
    return {
      referencia: dato.referencia,
      monto: dato.monto,
      estado: dato.estado,
      fecha: dato.fecha && typeof dato.fecha.toDate === 'function' ? dato.fecha.toDate().toISOString() : dato.fecha,
    };
  }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).slice(0, limite);
  return { habilitado: true, transacciones };
}

module.exports = { habilitado, guardarTransaccion, listarTransacciones };
