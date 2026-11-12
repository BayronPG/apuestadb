'use strict';

/**
 * Backfill / refresh del read model de reportes.
 * Uso: node scripts/reporte_rm.js [backfill|refresh]
 */

const { refrescar } = require('../services/reporte-rm.service');
const mongo = require('../config/db/mongodb');
const { cerrarPool } = require('../config/database');

(async () => {
  const modo = process.argv[2] === 'backfill' ? 'backfill' : 'refresh';
  try {
    const resultado = await refrescar();
    console.log(
      `[rm] ${modo}: ${resultado.apuestas} apuestas, ${resultado.liquidaciones} liquidaciones, ` +
        `${resultado.sinEvento} sin evento, ${resultado.ms} ms`,
    );
  } catch (error) {
    console.error('[rm] error:', error.message);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([mongo.cerrar(), cerrarPool()]);
  }
})();
