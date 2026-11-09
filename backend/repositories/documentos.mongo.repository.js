'use strict';

/**
 * Repositorio MongoDB de documentos de Fase 17.1:
 * liquidaciones, notificaciones y auditoria.
 */

const mongodb = require('../config/db/mongodb');

async function coleccion(nombre) {
  await mongodb.ping();
  const db = mongodb.obtenerDb();
  if (!db) throw new Error('MongoDB no configurado');
  return db.collection(nombre);
}

async function siguienteId(nombre) {
  const db = mongodb.obtenerDb();
  const r = await db.collection('contadores').findOneAndUpdate(
    { _id: nombre },
    { $inc: { valor: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return r.value ? r.value.valor : r.valor;
}

async function buscarLiquidacion(idApuesta) {
  return (await coleccion('liquidacion')).findOne({ id_apuesta: Number(idApuesta) });
}

async function crearLiquidacion(datos) {
  const id = await siguienteId('liquidacion');
  const documento = {
    id_liquidacion: id,
    id_apuesta: Number(datos.idApuesta),
    id_resultado: Number(datos.idResultado),
    resultado_liquidacion: datos.resultado,
    monto_premio: Number(datos.montoPremio),
    fecha_hora: new Date(),
    estado: 'aplicada',
  };
  await (await coleccion('liquidacion')).insertOne(documento);
  return documento;
}

async function actualizarApuesta(idApuesta, estado) {
  await (await coleccion('apuesta')).updateOne(
    { id_apuesta: Number(idApuesta) },
    { $set: { estado } },
  );
}

async function obtenerApuesta(idApuesta) {
  return (await coleccion('apuesta')).findOne({ id_apuesta: Number(idApuesta) });
}

async function notificacionesPendientesDeEvento(idEvento, idsOpcion) {
  const coleccionApuesta = await coleccion('apuesta');
  return coleccionApuesta.find({ estado: 'pendiente', id_opcion: { $in: idsOpcion } }).toArray();
}

async function registrarNotificacion({ idUsuario, mensaje, tipo }) {
  const id = await siguienteId('notificacion');
  const documento = {
    id_notificacion: id,
    id_usuario: Number(idUsuario),
    mensaje,
    tipo,
    fecha_hora: new Date(),
    estado: 'pendiente',
  };
  await (await coleccion('notificacion')).insertOne(documento);
  return documento;
}

async function listarNotificaciones({ idUsuario, estado = null, limite = 100 }) {
  const filtro = { id_usuario: Number(idUsuario) };
  if (estado) filtro.estado = estado;
  return (await coleccion('notificacion'))
    .find(filtro)
    .sort({ fecha_hora: -1 })
    .limit(Number(limite) || 100)
    .toArray();
}

async function actualizarNotificacion(idNotificacion, idUsuario, estado) {
  const r = await (await coleccion('notificacion')).updateOne(
    { id_notificacion: Number(idNotificacion), id_usuario: Number(idUsuario) },
    { $set: { estado } },
  );
  return r.matchedCount > 0;
}

async function registrarAuditoria(datos) {
  const id = await siguienteId('auditoria');
  const documento = {
    id_auditoria: id,
    id_usuario: datos.idUsuario === null || datos.idUsuario === undefined ? null : Number(datos.idUsuario),
    operacion: datos.operacion,
    entidad_afectada: datos.entidadAfectada,
    descripcion: datos.descripcion || null,
    fecha_hora: new Date(),
    resultado: datos.resultado,
    direccion_origen: datos.direccionOrigen || null,
  };
  await (await coleccion('auditoria')).insertOne(documento);
  return documento;
}

async function consultarAuditoria({ idUsuario = null, operacion = null, desde = null, hasta = null, top = 100 }) {
  const filtro = {};
  if (idUsuario !== null) filtro.id_usuario = Number(idUsuario);
  if (operacion) filtro.operacion = operacion;
  if (desde || hasta) {
    filtro.fecha_hora = {};
    if (desde) filtro.fecha_hora.$gte = new Date(desde);
    if (hasta) filtro.fecha_hora.$lte = new Date(hasta);
  }
  return (await coleccion('auditoria'))
    .find(filtro)
    .sort({ fecha_hora: -1 })
    .limit(Number(top) || 100)
    .toArray();
}

module.exports = {
  buscarLiquidacion,
  crearLiquidacion,
  actualizarApuesta,
  obtenerApuesta,
  notificacionesPendientesDeEvento,
  registrarNotificacion,
  listarNotificaciones,
  actualizarNotificacion,
  registrarAuditoria,
  consultarAuditoria,
};
