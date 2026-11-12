'use strict';

/**
 * APUESTADB - database/postgresql/10_alinear_fechas_local.js
 *
 * Deja PostgreSQL con la MISMA hora de pared que SQL Server, que es la
 * convencion que la API expone (datetime2 sin zona + driver en UTC).
 *
 * - Devuelve +5 h a las filas migradas que se habian restado por error.
 * - Lleva a hora local (-5 h) los movimientos de conciliacion creados con
 *   CURRENT_TIMESTAMP en UTC.
 *
 * Uso: node database/postgresql/10_alinear_fechas_local.js [--dry-run|--aplicar]
 */

const path = require('path');
const RAIZ = path.join(__dirname, '..', '..');
const postgresql = require(path.join(RAIZ, 'backend', 'config', 'db', 'postgresql'));

const APLICAR = process.argv.includes('--aplicar');

const MOVS_MIGRADOS = [1, 2, 3, 4, 5, 6, 7, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27];
const RECARGAS_MIGRADAS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const CUENTAS_MIGRADAS = [
  2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34,
];

(async () => {
  const pool = await postgresql.obtenerPool();
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    if (APLICAR) {
      await cliente.query(
        `UPDATE movimientosaldo SET fecha_hora = fecha_hora + INTERVAL '5 hours'
          WHERE id_movimiento = ANY($1::int[])`,
        [MOVS_MIGRADOS],
      );
      await cliente.query(
        `UPDATE recarga SET fecha_hora = fecha_hora + INTERVAL '5 hours'
          WHERE id_recarga = ANY($1::int[])`,
        [RECARGAS_MIGRADAS],
      );
      await cliente.query(
        `UPDATE saldocuenta SET fecha_ultima_actualizacion = fecha_ultima_actualizacion + INTERVAL '5 hours'
          WHERE id_saldo_cuenta = ANY($1::int[])`,
        [CUENTAS_MIGRADAS],
      );
      // Movimientos creados despues de la migracion (conciliacion y aperturas).
      await cliente.query(
        `UPDATE movimientosaldo SET fecha_hora = fecha_hora - INTERVAL '5 hours'
          WHERE id_movimiento >= 50`,
      );
      await cliente.query('COMMIT');
      console.log('ALINEACION_APLICADA=OK');
    } else {
      await cliente.query('ROLLBACK');
      console.log('MODO=dry-run');
    }

    const muestra = await cliente.query(
      `SELECT id_saldo_cuenta, to_char(fecha_ultima_actualizacion,'YYYY-MM-DD HH24:MI:SS') AS f
         FROM saldocuenta WHERE id_saldo_cuenta IN (25, 33) ORDER BY id_saldo_cuenta`,
    );
    console.log('CUENTAS=' + JSON.stringify(muestra.rows));
    const movs = await cliente.query(
      `SELECT id_movimiento, to_char(fecha_hora,'YYYY-MM-DD HH24:MI:SS') AS f
         FROM movimientosaldo WHERE id_movimiento IN (53, 56) ORDER BY id_movimiento`,
    );
    console.log('MOVS=' + JSON.stringify(movs.rows));
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
    await pool.end();
    process.exit(0);
  }
})().catch((error) => {
  console.error('ERROR ' + error.message);
  process.exit(1);
});
