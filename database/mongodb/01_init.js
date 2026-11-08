'use strict';

/**
 * APUESTADB - database/mongodb/01_init.js
 * Colecciones e indices del dominio documental (Fase 17):
 * apuesta, liquidacion, notificacion, auditoria.
 *
 * Idempotente: createCollection solo si falta; createIndex es idempotente.
 * Uso: MONGO_URI=... MONGO_DATABASE=apuestadb node database/mongodb/01_init.js
 */

const { MongoClient } = require('../../backend/node_modules/mongodb');

const COLECCIONES = {
  apuesta: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['id_apuesta', 'id_usuario', 'id_opcion', 'id_tipo_saldo', 'monto',
          'cuota_congelada', 'tipo_apuesta', 'estado', 'fecha_hora_registro'],
        properties: {
          id_apuesta: { bsonType: ['int','long','double'] },
          id_usuario: { bsonType: ['int','long','double'] },
          id_opcion: { bsonType: ['int','long','double'] },
          id_tipo_saldo: { bsonType: ['int','long','double'] },
          monto: { bsonType: ['int','long','double','decimal'] },
          cuota_congelada: { bsonType: ['int','long','double','decimal'] },
          tipo_apuesta: { bsonType: 'string' },
          estado: { enum: ['pendiente', 'ganada', 'perdida', 'anulada'] },
          fecha_hora_registro: { bsonType: 'date' },
        },
      },
    },
    indices: [
      [{ id_apuesta: 1 }, { unique: true }],
      [{ clave_idempotencia: 1 }, { unique: true, sparse: true }],
      [{ id_usuario: 1, estado: 1 }],
      [{ fecha_hora_registro: -1 }],
    ],
  },
  liquidacion: {
    indices: [
      [{ id_liquidacion: 1 }, { unique: true }],
      [{ id_apuesta: 1 }],
      [{ id_resultado: 1 }],
    ],
  },
  notificacion: {
    indices: [
      [{ id_notificacion: 1 }, { unique: true }],
      [{ id_usuario: 1, fecha_hora: -1 }],
    ],
  },
  auditoria: {
    indices: [
      [{ id_auditoria: 1 }, { unique: true }],
      [{ id_usuario: 1, fecha_hora: -1 }],
      [{ operacion: 1 }],
    ],
  },
};

(async () => {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DATABASE || 'apuestadb';
  if (!uri) {
    console.error('FALTA MONGO_URI');
    process.exit(1);
  }
  const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await cliente.connect();
    const db = cliente.db(dbName);
    const existentes = new Set((await db.listCollections().toArray()).map((c) => c.name));

    for (const [nombre, def] of Object.entries(COLECCIONES)) {
      if (!existentes.has(nombre)) {
        await db.createCollection(nombre, def.validator ? { validator: def.validator } : {});
      } else if (def.validator) {
        await db.command({ collMod: nombre, validator: def.validator });
      }
      for (const [clave, opciones] of def.indices) {
        await db.collection(nombre).createIndex(clave, opciones);
      }
      console.log(`${nombre}: OK`);
    }
    console.log('INIT_OK');
    process.exit(0);
  } catch (e) {
    console.error(`INIT_FALLIDA: ${e.message}`);
    process.exit(1);
  } finally {
    await cliente.close();
  }
})();
