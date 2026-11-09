'use strict';

/**
 * APUESTADB - database/mongodb/03_verify.js
 * Verificacion del dominio documental en MongoDB (Fase 17). Solo lectura.
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
  const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  let ok = true;
  try {
    await cliente.connect();
    const db = cliente.db(dbName);

    for (const def of TABLAS) {
      const origen = await consultar(`SELECT COUNT(*) AS n, SUM(${def.pk}) AS suma FROM dbo.${def.tabla}`);
      const o = origen.registros[0];
      const coleccion = db.collection(def.coleccion);
      const destino = await coleccion.countDocuments();
      const distintos = (await coleccion.distinct(def.pk)).length;
      const agregado = await coleccion.aggregate([{ $group: { _id: null, suma: { $sum: `$${def.pk}` } } }]).toArray();
      const suma = agregado.length > 0 ? agregado[0].suma : 0;
      const igual = Number(o.n) === destino && destino === distintos && Number(o.suma) === suma;
      if (!igual) ok = false;
      console.log(`${def.coleccion}: ${igual ? 'OK' : 'DIF'} origen=${o.n}/${o.suma} destino=${destino}/${suma} ids=${distintos}`);
    }

    const sinFecha = await db.collection('apuesta').countDocuments({ fecha_hora_registro: { $not: { $type: 'date' } } });
    console.log(`apuesta_fechas_invalidas=${sinFecha}`);
    if (sinFecha > 0) ok = false;

    const indice = await db.collection('apuesta').indexes();
    const tieneUnico = indice.some((i) => i.key && i.key.id_apuesta === 1 && i.unique);
    console.log(`indice_unico_id_apuesta=${tieneUnico}`);
    if (!tieneUnico) ok = false;

    console.log(ok ? 'VERIFICACION_OK' : 'VERIFICACION_CON_DIFERENCIAS');
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error(`VERIFICACION_FALLIDA: ${e.message}`);
    process.exit(1);
  } finally {
    await cliente.close();
  }
})();
