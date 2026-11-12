'use strict';

/**
 * APUESTADB - database/postgresql/05_backfill_saldo.js
 *
 * Copia a PostgreSQL las cuentas de saldo que existen en SQL Server y faltan en
 * el motor financiero (usuarios creados despues de la migracion de la Fase 16).
 *
 * Reglas:
 *   - Solo INSERT: nunca actualiza saldos ya presentes (ON CONFLICT DO NOTHING).
 *   - Idempotente: puede ejecutarse varias veces sin duplicar filas.
 *   - Ajusta la secuencia de SaldoCuenta al maximo id.
 *   - No imprime credenciales; solo conteos, ids y diferencias.
 *
 * Uso (desde la raiz del proyecto, con el .env del backend cargado):
 *   node database/postgresql/05_backfill_saldo.js            (aplica)
 *   node database/postgresql/05_backfill_saldo.js --dry-run  (solo informa)
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
const { consultar } = require(path.join(RAIZ, 'backend', 'config', 'database'));
const postgresql = require(path.join(RAIZ, 'backend', 'config', 'db', 'postgresql'));

const APLICAR = !process.argv.includes('--dry-run');

function fechaUtc(valor) {
  if (!(valor instanceof Date)) return valor;
  if (Number.isNaN(valor.getTime())) return null;
  const iso = valor.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 23)}`;
}

function clave(cuenta) {
  return `${cuenta.id_usuario}-${cuenta.id_tipo_saldo}`;
}

async function cuentasSqlServer() {
  const resultado = await consultar(
    `SELECT sc.id_saldo_cuenta,
            sc.id_usuario,
            sc.id_tipo_saldo,
            sc.saldo_actual,
            sc.fecha_ultima_actualizacion
       FROM dbo.SaldoCuenta sc
      ORDER BY sc.id_saldo_cuenta`,
  );
  return resultado.registros;
}

async function cuentasPostgres(pool) {
  const { rows } = await pool.query(
    `SELECT id_saldo_cuenta, id_usuario, id_tipo_saldo, saldo_actual
       FROM saldocuenta
      ORDER BY id_saldo_cuenta`,
  );
  return rows;
}

async function ajustarSecuencia(pool) {
  const { rows } = await pool.query(
    `SELECT setval(
              pg_get_serial_sequence('saldocuenta', 'id_saldo_cuenta'),
              COALESCE((SELECT MAX(id_saldo_cuenta) FROM saldocuenta), 1),
              (SELECT COUNT(*) > 0 FROM saldocuenta)
            ) AS valor`,
  );
  return rows[0] ? rows[0].valor : null;
}

async function contar(pool, tabla) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${tabla}`);
  return rows[0].n;
}

async function main() {
  const pool = await postgresql.obtenerPool();

  const sqlCuentas = await cuentasSqlServer();
  const pgAntes = await cuentasPostgres(pool);
  const pgPorId = new Map(pgAntes.map((c) => [Number(c.id_saldo_cuenta), c]));
  const pgPorPar = new Map(pgAntes.map((c) => [clave(c), c]));

  const faltantes = [];
  const conflictosPar = [];

  for (const cuenta of sqlCuentas) {
    const id = Number(cuenta.id_saldo_cuenta);
    if (pgPorId.has(id)) continue;
    if (pgPorPar.has(clave(cuenta))) {
      conflictosPar.push({ ...cuenta, pg: pgPorPar.get(clave(cuenta)) });
      continue;
    }
    faltantes.push(cuenta);
  }

  console.log(`BACKFILL_SALDO modo=${APLICAR ? 'aplicar' : 'dry-run'}`);
  console.log(`SQL_SERVER_CUENTAS=${sqlCuentas.length}`);
  console.log(`POSTGRES_CUENTAS_ANTES=${pgAntes.length}`);
  console.log(`FALTANTES=${faltantes.length}`);
  for (const cuenta of faltantes) {
    console.log(
      `  pendiente id=${cuenta.id_saldo_cuenta} usuario=${cuenta.id_usuario} tipo=${cuenta.id_tipo_saldo} saldo=${cuenta.saldo_actual}`,
    );
  }
  if (conflictosPar.length > 0) {
    console.log(`CONFLICTOS_PAR=${conflictosPar.length} (mismo usuario/tipo con otro id en PG)`);
    for (const conflicto of conflictosPar) {
      console.log(
        `  conflicto usuario=${conflicto.id_usuario} tipo=${conflicto.id_tipo_saldo} sql_id=${conflicto.id_saldo_cuenta} pg_id=${conflicto.pg.id_saldo_cuenta}`,
      );
    }
  }

  let insertadas = 0;
  if (APLICAR) {
    for (const cuenta of faltantes) {
      const { rowCount } = await pool.query(
        `INSERT INTO saldocuenta
                (id_saldo_cuenta, id_usuario, id_tipo_saldo, saldo_actual, fecha_ultima_actualizacion)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          Number(cuenta.id_saldo_cuenta),
          Number(cuenta.id_usuario),
          Number(cuenta.id_tipo_saldo),
          Number(cuenta.saldo_actual),
          fechaUtc(cuenta.fecha_ultima_actualizacion),
        ],
      );
      insertadas += rowCount;
    }
    const secuencia = await ajustarSecuencia(pool);
    console.log(`INSERTADAS=${insertadas}`);
    console.log(`SECUENCIA_SALDOCUENTA=${secuencia}`);
  } else {
    console.log('INSERTADAS=0 (dry-run)');
  }

  const pgDespues = await cuentasPostgres(pool);
  const pgPar = new Map(pgDespues.map((c) => [clave(c), c]));
  const pgId = new Map(pgDespues.map((c) => [Number(c.id_saldo_cuenta), c]));

  console.log(`POSTGRES_CUENTAS_DESPUES=${pgDespues.length}`);

  // ------------------------------------------------------- verificacion ----
  const faltanDespues = sqlCuentas.filter(
    (c) => !pgId.has(Number(c.id_saldo_cuenta)) && !pgPar.has(clave(c)),
  );
  console.log(`PARES_SQL_SIN_PG=${faltanDespues.length}`);

  for (const idUsuario of [13, 17]) {
    const propias = pgDespues
      .filter((c) => Number(c.id_usuario) === idUsuario)
      .map((c) => `tipo${c.id_tipo_saldo}=${c.saldo_actual}`);
    console.log(`USUARIO_${idUsuario}_PG=${propias.length > 0 ? propias.join(',') : 'sin cuentas'}`);
  }

  const diferencias = [];
  for (const origen of sqlCuentas) {
    const destino = pgPar.get(clave(origen));
    if (!destino) continue;
    if (Number(origen.saldo_actual) !== Number(destino.saldo_actual)) {
      diferencias.push({
        usuario: origen.id_usuario,
        tipo: origen.id_tipo_saldo,
        sql: Number(origen.saldo_actual),
        pg: Number(destino.saldo_actual),
      });
    }
  }
  console.log(`SALDOS_DISTINTOS_SQL_VS_PG=${diferencias.length}`);
  for (const diferencia of diferencias) {
    console.log(
      `  diferencia usuario=${diferencia.usuario} tipo=${diferencia.tipo} sql=${diferencia.sql} pg=${diferencia.pg}`,
    );
  }

  // Recargas y movimientos: solo auditoria de conteos (no se migran aqui).
  const recargasSql = await consultar('SELECT COUNT(*) AS n FROM dbo.Recarga');
  const movimientosSql = await consultar('SELECT COUNT(*) AS n FROM dbo.MovimientoSaldo');
  console.log(`RECARGAS_SQL=${recargasSql.registros[0].n}`);
  console.log(`RECARGAS_PG=${await contar(pool, 'recarga')}`);
  console.log(`MOVIMIENTOS_SQL=${movimientosSql.registros[0].n}`);
  console.log(`MOVIMIENTOS_PG=${await contar(pool, 'movimientosaldo')}`);

  const recargasPorUsuarioSql = await consultar(
    `SELECT id_usuario, COUNT(*) AS n FROM dbo.Recarga GROUP BY id_usuario ORDER BY id_usuario`,
  );
  const { rows: recargasPorUsuarioPg } = await pool.query(
    `SELECT id_usuario, COUNT(*)::int AS n FROM recarga GROUP BY id_usuario ORDER BY id_usuario`,
  );
  const mapaPg = new Map(recargasPorUsuarioPg.map((r) => [Number(r.id_usuario), Number(r.n)]));
  const desfaseRecargas = recargasPorUsuarioSql.registros
    .map((r) => ({
      usuario: Number(r.id_usuario),
      sql: Number(r.n),
      pg: mapaPg.get(Number(r.id_usuario)) || 0,
    }))
    .filter((r) => r.sql !== r.pg);
  console.log(`RECARGAS_POR_USUARIO_DESFASE=${desfaseRecargas.length}`);
  for (const fila of desfaseRecargas) {
    console.log(`  recargas usuario=${fila.usuario} sql=${fila.sql} pg=${fila.pg}`);
  }

  await pool.end();
}

main().catch((error) => {
  console.error(`BACKFILL_FALLIDO: ${error.message}`);
  process.exit(1);
});
