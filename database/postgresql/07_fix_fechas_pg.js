'use strict';

/**
 * APUESTADB - database/postgresql/07_fix_fechas_pg.js
 *
 * Corrige el desfase de +5 h introducido al copiar fechas de SQL Server a
 * PostgreSQL (mssql devuelve Date en hora local y los scripts usaron
 * toISOString). Solo toca filas cuyo desfase es exactamente +5 h frente al
 * origen; las que ya fueron actualizadas por movimientos posteriores no se
 * tocan.
 *
 * Uso:
 *   node database/postgresql/07_fix_fechas_pg.js --dry-run
 *   node database/postgresql/07_fix_fechas_pg.js --aplicar
 */

const path = require('path');
const RAIZ = path.join(__dirname, '..', '..');
const { consultar } = require(path.join(RAIZ, 'backend', 'config', 'database'));
const postgresql = require(path.join(RAIZ, 'backend', 'config', 'db', 'postgresql'));

const APLICAR = process.argv.includes('--aplicar');
const HORAS = 5 * 3600 * 1000;
const TOLERANCIA = 2000;

function desfasadas(origen, destino, campoId, campoFecha) {
  const mapa = new Map(
    origen.map((fila) => [Number(fila[campoId]), new Date(fila[campoFecha]).getTime()]),
  );
  const ids = [];
  for (const fila of destino) {
    const id = Number(fila[campoId]);
    if (!mapa.has(id)) continue;
    const delta = new Date(fila[campoFecha]).getTime() - mapa.get(id);
    if (Math.abs(delta - HORAS) <= TOLERANCIA) ids.push(id);
  }
  return ids.sort((a, b) => a - b);
}

(async () => {
  const pool = await postgresql.obtenerPool();

  const sqlMov = await consultar('SELECT id_movimiento, fecha_hora FROM dbo.MovimientoSaldo');
  const sqlRec = await consultar('SELECT id_recarga, fecha_hora FROM dbo.Recarga');
  const sqlCue = await consultar(
    'SELECT id_saldo_cuenta, fecha_ultima_actualizacion AS fecha_hora FROM dbo.SaldoCuenta',
  );

  const pgMov = (await pool.query('SELECT id_movimiento, fecha_hora FROM movimientosaldo')).rows;
  const pgRec = (await pool.query('SELECT id_recarga, fecha_hora FROM recarga')).rows;
  const pgCue = (await pool.query('SELECT id_saldo_cuenta, fecha_ultima_actualizacion AS fecha_hora FROM saldocuenta')).rows;

  const movs = desfasadas(sqlMov.registros, pgMov, 'id_movimiento', 'fecha_hora');
  const recs = desfasadas(sqlRec.registros, pgRec, 'id_recarga', 'fecha_hora');
  const cues = desfasadas(sqlCue.registros, pgCue, 'id_saldo_cuenta', 'fecha_hora');

  console.log(`MODO=${APLICAR ? 'aplicar' : 'dry-run'}`);
  console.log(`MOVIMIENTOS_DESFASADOS=${movs.length} [${movs.join(',')}]`);
  console.log(`RECARGAS_DESFASADAS=${recs.length} [${recs.join(',')}]`);
  console.log(`CUENTAS_DESFASADAS=${cues.length} [${cues.join(',')}]`);

  if (!APLICAR) {
    await pool.end();
    process.exit(0);
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    if (movs.length) {
      await cliente.query(
        `UPDATE movimientosaldo SET fecha_hora = fecha_hora - INTERVAL '5 hours'
          WHERE id_movimiento = ANY($1::int[])`,
        [movs],
      );
    }
    if (recs.length) {
      await cliente.query(
        `UPDATE recarga SET fecha_hora = fecha_hora - INTERVAL '5 hours'
          WHERE id_recarga = ANY($1::int[])`,
        [recs],
      );
    }
    if (cues.length) {
      await cliente.query(
        `UPDATE saldocuenta SET fecha_ultima_actualizacion = fecha_ultima_actualizacion - INTERVAL '5 hours'
          WHERE id_saldo_cuenta = ANY($1::int[])`,
        [cues],
      );
    }
    await cliente.query('COMMIT');
    console.log('FECHAS_CORREGIDAS=OK');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  await pool.end();
  process.exit(0);
})().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
