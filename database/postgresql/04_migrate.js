'use strict';

/**
 * APUESTADB - database/postgresql/04_migrate.js
 * Migracion del dominio financiero desde SQL Server (origen, solo lectura)
 * hacia PostgreSQL (destino). Fase 16.
 *
 * - Conserva identificadores (incluye BIGSERIAL).
 * - Idempotente: INSERT ... ON CONFLICT (pk) DO UPDATE.
 * - Fechas en UTC con milisegundos.
 * - Ajusta las secuencias tras la carga.
 * - Solo imprime conteos y estados; nunca credenciales.
 *
 * Uso (desde la raiz del proyecto, con POSTGRES_* en el entorno):
 *   node database/postgresql/04_migrate.js
 */

const { Pool } = require('../../backend/node_modules/pg');
const { consultar } = require('../../backend/config/database');

const TABLAS = [
  { nombre: 'TipoSaldo', pk: 'id_tipo_saldo' },
  { nombre: 'TipoMovimientoSaldo', pk: 'id_tipo_movimiento' },
  { nombre: 'SaldoCuenta', pk: 'id_saldo_cuenta' },
  { nombre: 'Recarga', pk: 'id_recarga' },
  { nombre: 'MovimientoSaldo', pk: 'id_movimiento' },
];

const LOTE = 500;

function fechaUtc(valor) {
  if (!(valor instanceof Date)) return valor;
  if (Number.isNaN(valor.getTime())) return null;
  const iso = valor.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 23)}`;
}

function normalizar(fila) {
  const salida = {};
  for (const [clave, valor] of Object.entries(fila)) {
    salida[clave] = valor instanceof Date ? fechaUtc(valor) : valor;
  }
  return salida;
}

function crearPool() {
  const obligatorias = ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
  const faltan = obligatorias.filter((clave) => !process.env[clave]);
  if (faltan.length > 0) throw new Error(`Variables PostgreSQL incompletas: ${faltan.join(', ')}`);
  return new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number.parseInt(process.env.POSTGRES_PORT || '5433', 10),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 4,
  });
}

async function migrarTabla(pool, tabla) {
  const origen = await consultar(`SELECT * FROM dbo.${tabla.nombre} ORDER BY ${tabla.pk}`);
  const filas = origen.registros.map(normalizar);
  if (filas.length === 0) return { tabla: tabla.nombre, origen: 0, destino: 0 };

  const columnas = Object.keys(filas[0]);
  const actualizaciones = columnas
    .filter((c) => c !== tabla.pk)
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');

  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    const valores = [];
    const grupos = [];
    lote.forEach((fila, indiceFila) => {
      const marcadores = columnas.map((c, indiceCol) => {
        valores.push(fila[c]);
        return `$${indiceFila * columnas.length + indiceCol + 1}`;
      });
      grupos.push(`(${marcadores.join(', ')})`);
    });

    const sql =
      `INSERT INTO ${tabla.nombre} (${columnas.join(', ')}) VALUES ${grupos.join(', ')} ` +
      `ON CONFLICT (${tabla.pk}) DO UPDATE SET ${actualizaciones}`;
    await pool.query(sql, valores);
  }

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n, COUNT(DISTINCT ${tabla.pk})::int AS d FROM ${tabla.nombre}`);
  return { tabla: tabla.nombre, origen: filas.length, destino: rows[0].n, distintas: rows[0].d };
}

async function ajustarSecuencias(pool) {
  const secuencias = [
    ['TipoSaldo', 'id_tipo_saldo'],
    ['TipoMovimientoSaldo', 'id_tipo_movimiento'],
    ['SaldoCuenta', 'id_saldo_cuenta'],
    ['Recarga', 'id_recarga'],
    ['MovimientoSaldo', 'id_movimiento'],
  ];
  for (const [tabla, pk] of secuencias) {
    await pool.query(
      `SELECT setval(pg_get_serial_sequence('${tabla}', '${pk}'),
                     COALESCE((SELECT MAX(${pk}) FROM ${tabla}), 1),
                     (SELECT COUNT(*) > 0 FROM ${tabla}))`,
    );
  }
}

(async () => {
  const pool = crearPool();
  const resultados = [];
  let error = null;

  try {
    for (const tabla of TABLAS) {
      const r = await migrarTabla(pool, tabla);
      resultados.push(r);
      if (r.origen !== r.destino || r.destino !== r.distintas) {
        throw new Error(`Diferencia de filas en ${r.tabla}: origen=${r.origen} destino=${r.destino}`);
      }
    }
    await ajustarSecuencias(pool);
  } catch (e) {
    error = e;
  } finally {
    for (const r of resultados) {
      console.log(`${r.tabla}: origen=${r.origen} destino=${r.destino} distintas=${r.distintas ?? '-'}`);
    }
    console.log(`TOTAL_MIGRADO=${resultados.reduce((s, r) => s + r.origen, 0)}`);
    await pool.end();
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
