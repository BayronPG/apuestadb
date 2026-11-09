'use strict';

/**
 * APUESTADB - database/mongodb/02_migrate.js
 * Migracion de apuestas, liquidaciones, notificaciones y auditoria desde
 * SQL Server (origen, solo lectura) hacia MongoDB (Fase 17).
 *
 * - Conserva los identificadores numericos originales.
 * - Idempotente: updateOne con upsert por id.
 * - Fechas como Date (UTC, con milisegundos).
 * - Solo imprime conteos; nunca credenciales.
 */

const { MongoClient } = require('../../backend/node_modules/mongodb');
const { consultar } = require('../../backend/config/database');

const TABLAS = [
  { tabla: 'Apuesta', coleccion: 'apuesta', pk: 'id_apuesta' },
  { tabla: 'Liquidacion', coleccion: 'liquidacion', pk: 'id_liquidacion' },
  { tabla: 'Notificacion', coleccion: 'notificacion', pk: 'id_notificacion' },
  { tabla: 'Auditoria', coleccion: 'auditoria', pk: 'id_auditoria' },
];

(async () => {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DATABASE || 'apuestadb';
  if (!uri) {
    console.error('FALTA MONGO_URI');
    process.exit(1);
  }

  const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  let error = null;
  const resumen = [];

  try {
    await cliente.connect();
    const db = cliente.db(dbName);

    for (const def of TABLAS) {
      const origen = await consultar(`SELECT * FROM dbo.${def.tabla} ORDER BY ${def.pk}`);
      const filas = origen.registros;
      const coleccion = db.collection(def.coleccion);

      for (const fila of filas) {
        const documento = {};
        for (const [clave, valor] of Object.entries(fila)) {
          // mssql devuelve BIGINT como string: se normaliza a numero.
          documento[clave] = typeof valor === 'string' && /^-?\d+$/.test(valor) ? Number(valor) : valor;
        }
        await coleccion.updateOne(
          { [def.pk]: documento[def.pk] },
          { $set: documento },
          { upsert: true },
        );
      }

      const destino = await coleccion.countDocuments();
      resumen.push({ coleccion: def.coleccion, origen: filas.length, destino });
      if (filas.length !== destino) {
        throw new Error(`Diferencia en ${def.coleccion}: origen=${filas.length} destino=${destino}`);
      }
    }

    // Contador para nuevas apuestas: continúa desde el maximo migrado.
    const maximo = await db.collection('apuesta').find({}).sort({ id_apuesta: -1 }).limit(1).toArray();
    const siguiente = maximo.length > 0 ? maximo[0].id_apuesta : 0;
    await db.collection('contadores').updateOne(
      { _id: 'apuesta' },
      { $max: { valor: siguiente } },
      { upsert: true },
    );

    const pares = [
      ['liquidacion', 'id_liquidacion'],
      ['notificacion', 'id_notificacion'],
      ['auditoria', 'id_auditoria'],
    ];
    for (const [coleccion, campo] of pares) {
      const ultimo = await db.collection(coleccion).find({}).sort({ [campo]: -1 }).limit(1).toArray();
      const maximoColeccion = ultimo.length > 0 ? ultimo[0][campo] : 0;
      await db.collection('contadores').updateOne(
        { _id: coleccion },
        { $max: { valor: maximoColeccion } },
        { upsert: true },
      );
    }
  } catch (e) {
    error = e;
  } finally {
    for (const r of resumen) {
      console.log(`${r.coleccion}: origen=${r.origen} destino=${r.destino}`);
    }
    console.log(`TOTAL_MIGRADO=${resumen.reduce((s, r) => s + r.origen, 0)}`);
    await cliente.close();
  }

  if (error) {
    console.error(`MIGRACION_FALLIDA: ${error.message}`);
    process.exit(1);
  }
  console.log('MIGRACION_OK');
  process.exit(0);
})().catch((e) => {
  console.error(`MIGRACION_FALLIDA: ${e.message}`);
  process.exit(1);
});
