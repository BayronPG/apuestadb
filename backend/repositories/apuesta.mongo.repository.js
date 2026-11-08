'use strict';

/**
 * Repositorio MongoDB del agregado APUESTA (Fase 17).
 * Lecturas y documentos del dominio documental; el dinero vive en PostgreSQL.
 */

const config = require('../config');
const mongodb = require('../config/db/mongodb');
const mysql = require('../config/db/mysql');
const postgresql = require('../config/db/postgresql');

const COLECCION = 'apuesta';

async function coleccion(nombre = COLECCION) {
  await mongodb.ping();
  const db = mongodb.obtenerDb();
  if (!db) throw new Error('MongoDB no configurado');
  return db.collection(nombre);
}

function aApi(doc, extra = {}) {
  return {
    id_apuesta: doc.id_apuesta,
    id_usuario: doc.id_usuario,
    id_opcion: doc.id_opcion,
    id_tipo_saldo: doc.id_tipo_saldo,
    monto: doc.monto,
    cuota_congelada: doc.cuota_congelada,
    tipo_apuesta: doc.tipo_apuesta,
    estado: doc.estado,
    fecha_hora_registro: doc.fecha_hora_registro,
    ...extra,
  };
}

/** Enriquecimiento con catalogo (MySQL) y tipo de saldo. */
async function enriquecer(docs) {
  if (docs.length === 0) return [];
  const idsOpcion = [...new Set(docs.map((d) => d.id_opcion))];
  const pool = await mysql.obtenerPool();
  const [opciones] = await pool.query(
    `SELECT o.id_opcion, o.etiqueta AS opcion, o.cuota_vigente,
            m.nombre AS mercado, d.nombre AS deporte, l.nombre AS liga,
            el.nombre AS equipo_local, ev.nombre AS equipo_visitante
       FROM OpcionApuesta o
       JOIN Mercado m  ON m.id_mercado = o.id_mercado
       JOIN Evento e   ON e.id_evento = m.id_evento
       JOIN Temporada t ON t.id_temporada = e.id_temporada
       JOIN Liga l     ON l.id_liga = t.id_liga
       JOIN Deporte d  ON d.id_deporte = l.id_deporte
       JOIN Equipo el  ON el.id_equipo = e.id_equipo_local
       JOIN Equipo ev  ON ev.id_equipo = e.id_equipo_visitante
      WHERE o.id_opcion IN (${idsOpcion.map(() => '?').join(',')})`,
    idsOpcion,
  );
  const { rows: tipos } = await (await postgresql.obtenerPool()).query(
    'SELECT id_tipo_saldo, nombre FROM TipoSaldo',
  );
  const porOpcion = new Map(opciones.map((o) => [o.id_opcion, o]));
  const porTipo = new Map(tipos.map((t) => [t.id_tipo_saldo, t.nombre]));

  const liquidadas = new Set(
    (
      await (await coleccion('liquidacion'))
        .find({ id_apuesta: { $in: docs.map((d) => d.id_apuesta) } })
        .toArray()
    ).map((l) => l.id_apuesta),
  );

  return docs.map((d) => {
    const o = porOpcion.get(d.id_opcion) || {};
    return aApi(d, {
      deporte: o.deporte || null,
      liga: o.liga || null,
      equipo_local: o.equipo_local || null,
      equipo_visitante: o.equipo_visitante || null,
      mercado: o.mercado || null,
      opcion: o.opcion || null,
      premio_potencial: Number((Number(d.monto) * Number(d.cuota_congelada)).toFixed(2)),
      tipo_saldo: porTipo.get(d.id_tipo_saldo) || null,
      fecha_liquidacion: liquidadas.has(d.id_apuesta) ? d.fecha_hora_registro : null,
    });
  });
}

async function buscarPorClave(clave) {
  if (!clave) return null;
  const doc = await (await coleccion()).findOne({ clave_idempotencia: clave });
  return doc || null;
}

async function siguienteId() {
  const db = mongodb.obtenerDb();
  const r = await db.collection('contadores').findOneAndUpdate(
    { _id: 'apuesta' },
    { $inc: { valor: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return r.value ? r.value.valor : r.valor;
}

async function insertar(documento) {
  await (await coleccion()).insertOne(documento);
  return documento;
}

async function historial({ idUsuario, estado = null }) {
  const filtro = { id_usuario: Number(idUsuario) };
  if (estado) filtro.estado = estado;
  const docs = await (await coleccion()).find(filtro).sort({ fecha_hora_registro: -1 }).toArray();
  return enriquecer(docs);
}

async function porEstado(idUsuario, estado) {
  return historial({ idUsuario, estado });
}

function opcionDe(idOpcion) {
  return mysql.obtenerPool().then(async (pool) => {
    const [filas] = await pool.query(
      `SELECT o.id_opcion, o.cuota_vigente, o.estado AS estado_opcion,
              m.estado AS estado_mercado, e.estado AS estado_evento, e.fecha_hora_inicio
         FROM OpcionApuesta o
         JOIN Mercado m ON m.id_mercado = o.id_mercado
         JOIN Evento e  ON e.id_evento = m.id_evento
        WHERE o.id_opcion = ?`,
      [idOpcion],
    );
    return filas[0] || null;
  });
}

module.exports = { historial, porEstado, buscarPorClave, siguienteId, insertar, opcionDe, enriquecer };
